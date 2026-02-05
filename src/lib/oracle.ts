/**
 * Oracle 데이터베이스 연결 래퍼 (자동 초기화 지원)
 * 
 * 이 파일은 Oracle 데이터베이스 연결을 자동으로 관리합니다.
 * 모든 쿼리 실행 전에 자동으로 연결 풀을 초기화합니다.
 * 
 * 특징:
 * - 자동 초기화: 첫 쿼리 실행 시 자동으로 연결 풀 생성
 * - 중복 초기화 방지: 동시에 여러 요청이 와도 한 번만 초기화
 * - 싱글톤 패턴: 애플리케이션 전체에서 하나의 연결 풀만 사용
 */

import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';

// Oracle 전역 설정
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = false;

type OracleConnectionType = 'wallet' | 'basic';

interface OracleWalletConfig {
  user: string;
  password: string;
  connectionString: string;
  walletLocation: string;
  walletPassword: string;
}

interface OracleBasicConfig {
  user: string;
  password: string;
  connectString: string;
}

type OracleConfig = OracleWalletConfig | OracleBasicConfig;

interface ReturningResult<T = any> {
  rowsAffected: number;
  outBinds?: Record<string, T[]>;
  lastInsertId?: number;
}

interface TransactionOptions {
  autoCommit?: boolean;
  timeout?: number;
}

interface QueryOptions {
  autoCommit?: boolean;
  outBinds?: Record<string, oracledb.BindParameter>;
}

function getOracleConfig(): { config: OracleConfig; type: OracleConnectionType } {
  if (process.env.ORACLE_WALLET_LOCATION) {
    if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD) {
      throw new Error('ORACLE_USER and ORACLE_PASSWORD are required for Wallet connection');
    }
    if (!process.env.ORACLE_CONNECTION_STRING) {
      throw new Error('ORACLE_CONNECTION_STRING is required for Wallet connection');
    }

    const walletConfig: OracleWalletConfig = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectionString: process.env.ORACLE_CONNECTION_STRING,
      walletLocation: process.env.ORACLE_WALLET_LOCATION,
      walletPassword: process.env.ORACLE_WALLET_PASSWORD || '',
    };

    console.log('[Oracle] Using Wallet connection mode (Thin)');
    return { config: walletConfig, type: 'wallet' };
  }

  if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD) {
    throw new Error('ORACLE_USER and ORACLE_PASSWORD are required');
  }
  
  const host = process.env.ORACLE_HOST || 'localhost';
  const port = process.env.ORACLE_PORT || '1521';
  const serviceName = process.env.ORACLE_SERVICE_NAME;

  if (!serviceName) {
    throw new Error('ORACLE_SERVICE_NAME is required for basic connection');
  }

  const basicConfig: OracleBasicConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${host}:${port}/${serviceName}`,
  };

  console.log('[Oracle] Using basic connection mode (Thin)');
  return { config: basicConfig, type: 'basic' };
}

function isWalletConfig(config: OracleConfig): config is OracleWalletConfig {
  return 'walletLocation' in config;
}

function parseTnsnames(walletLocation: string, serviceName: string): string | null {
  try {
    const tnsnamesPath = path.join(walletLocation, 'tnsnames.ora');
    
    if (!fs.existsSync(tnsnamesPath)) {
      console.error('[Oracle] tnsnames.ora not found at:', tnsnamesPath);
      return null;
    }

    const content = fs.readFileSync(tnsnamesPath, 'utf-8');
    const lines = content.split('\n');
    const serviceLineIndex = lines.findIndex(line => 
      line.trim().toLowerCase().startsWith(serviceName.toLowerCase())
    );
    
    if (serviceLineIndex === -1) {
      console.error('[Oracle] Service not found in tnsnames.ora:', serviceName);
      return null;
    }
    
    let serviceConfig = lines[serviceLineIndex];
    for (let i = serviceLineIndex + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith('(') || lines[i].trim() === '') {
        serviceConfig += lines[i];
      } else {
        break;
      }
    }
    
    const protocolMatch = serviceConfig.match(/protocol\s*=\s*(tcps?)/i);
    const hostMatch = serviceConfig.match(/host\s*=\s*([^)]+)\)/i);
    const portMatch = serviceConfig.match(/port\s*=\s*(\d+)/i);
    const serviceMatch = serviceConfig.match(/service_name\s*=\s*([^)]+)\)/i);
    
    if (hostMatch && portMatch && serviceMatch) {
      const protocol = protocolMatch ? protocolMatch[1] : 'tcp';
      const host = hostMatch[1].trim();
      const port = portMatch[1];
      const service = serviceMatch[1].trim();
      
      const connectString = protocol === 'tcps' 
        ? `tcps://${host}:${port}/${service}`
        : `${host}:${port}/${service}`;
      
      return connectString;
    }
    
    return null;
  } catch (error) {
    console.error('[Oracle] Error parsing tnsnames.ora:', error);
    return null;
  }
}

class OracleConnection {
  private static instance: OracleConnection;
  private pool: oracledb.Pool | null = null;
  private config: OracleConfig;
  private connectionType: OracleConnectionType;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    const { config, type } = getOracleConfig();
    this.config = config;
    this.connectionType = type;
    console.log('[Oracle] Configuration loaded (Thin Mode)');
  }

  public static getInstance(): OracleConnection {
    if (!OracleConnection.instance) {
      OracleConnection.instance = new OracleConnection();
    }
    return OracleConnection.instance;
  }

  /**
   * 연결 풀이 초기화되었는지 확인하고 필요하면 초기화
   * 모든 쿼리 실행 전에 자동으로 호출됨
   */
  private async ensureInitialized(): Promise<void> {
    if (this.pool) {
      return; // 이미 초기화됨
    }

    if (this.isInitializing) {
      // 다른 요청이 초기화 중이면 대기
      console.log('[Oracle] Waiting for ongoing initialization...');
      await this.initPromise;
      return;
    }

    // 초기화 시작
    console.log('[Oracle] Auto-initializing connection pool...');
    this.isInitializing = true;
    this.initPromise = this.doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  /**
   * 실제 초기화 로직
   */
  private async doInitialize(): Promise<void> {
    try {
      console.log('[Oracle] Initializing connection pool...');
      
      let poolConfig: oracledb.PoolAttributes;

      if (isWalletConfig(this.config)) {
        const walletLocation = this.config.walletLocation;
        const cwalletPath = path.join(walletLocation, 'cwallet.sso');
        const ewalletPath = path.join(walletLocation, 'ewallet.p12');
        
        if (!fs.existsSync(cwalletPath) && !fs.existsSync(ewalletPath)) {
          throw new Error(`Wallet files not found in: ${walletLocation}`);
        }
        
        const connectString = parseTnsnames(walletLocation, this.config.connectionString);
        
        if (!connectString) {
          throw new Error(`Could not parse connection string: ${this.config.connectionString}`);
        }
        
        poolConfig = {
          user: this.config.user,
          password: this.config.password,
          connectString: connectString,
          walletLocation: walletLocation,
          walletPassword: this.config.walletPassword || '',
          poolMin: 2,
          poolMax: 10,
          poolIncrement: 1,
          poolTimeout: 60,
        };
      } else {
        poolConfig = {
          user: this.config.user,
          password: this.config.password,
          connectString: this.config.connectString,
          poolMin: 2,
          poolMax: 10,
          poolIncrement: 1,
          poolTimeout: 60,
        };
      }

      this.pool = await oracledb.createPool(poolConfig);

      console.log('[Oracle] ✅ Connection pool initialized successfully');
      console.log('[Oracle] Pool config:', {
        min: this.pool.poolMin,
        max: this.pool.poolMax,
      });

      // 연결 테스트
      const testResult = await this.query('SELECT 1 AS num FROM DUAL');
      console.log('[Oracle] ✅ Connection test passed:', testResult[0]);
    } catch (error) {
      this.pool = null; // 초기화 실패 시 pool을 null로
      console.error('[Oracle] ❌ Failed to initialize connection pool:', error);
      throw new Error(
        `Oracle connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 명시적 초기화 (선택사항)
   * ensureInitialized()가 자동으로 호출하므로 수동 호출 불필요
   */
  public async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  /**
   * SELECT 쿼리 실행 (자동 초기화)
   */
  public async query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<T[]> {
    await this.ensureInitialized(); // 자동 초기화

    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.pool!.getConnection();
      const result = params
        ? await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
        : await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

      return (result.rows as T[]) || [];
    } catch (error) {
      console.error('[Oracle] Query execution failed:', error);
      console.error('[Oracle] SQL:', sql);
      console.error('[Oracle] Params:', params);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Oracle] Failed to close connection:', closeError);
        }
      }
    }
  }

  /**
   * RETURNING INTO 쿼리 실행 (자동 초기화)
   */
  public async executeReturning<T = any>(
    sql: string,
    params: Record<string, any>,
    options?: QueryOptions
  ): Promise<ReturningResult<T>> {
    await this.ensureInitialized(); // 자동 초기화

    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.pool!.getConnection();
      
      const result = await connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: options?.autoCommit !== undefined ? options.autoCommit : true
      } as any);

      const returningResult: ReturningResult<T> = {
        rowsAffected: result.rowsAffected || 0,
        outBinds: result.outBinds as Record<string, T[]>,
      };

      if (returningResult.outBinds && 'id' in returningResult.outBinds) {
        const ids = returningResult.outBinds.id;
        if (ids && ids.length === 1) {
          returningResult.lastInsertId = ids[0] as number;
        }
      }

      return returningResult;
    } catch (error) {
      console.error('[Oracle] Execute RETURNING failed:', error);
      console.error('[Oracle] SQL:', sql);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Oracle] Failed to close connection:', closeError);
        }
      }
    }
  }

  /**
   * 트랜잭션 실행 (자동 초기화)
   */
  public async transaction<T>(
    callback: (connection: oracledb.Connection) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    await this.ensureInitialized(); // 자동 초기화

    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.pool!.getConnection();
      console.log('[Oracle] Transaction started');

      const result = await callback(connection);

      if (options?.autoCommit !== false) {
        await connection.commit();
        console.log('[Oracle] Transaction committed');
      }

      return result;
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
          console.log('[Oracle] Transaction rolled back due to error');
        } catch (rollbackError) {
          console.error('[Oracle] Failed to rollback transaction:', rollbackError);
        }
      }

      console.error('[Oracle] Transaction failed:', error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Oracle] Failed to close connection:', closeError);
        }
      }
    }
  }

  /**
   * DML 실행 (자동 초기화)
   */
  public async execute(
    sql: string,
    params?: any[] | Record<string, any>,
    autoCommit: boolean = false
  ): Promise<number> {
    await this.ensureInitialized(); // 자동 초기화

    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.pool!.getConnection();
      const result = params
        ? await connection.execute(sql, params, { autoCommit })
        : await connection.execute(sql, [], { autoCommit });

      console.log('[Oracle] Execute successful, rows affected:', result.rowsAffected);
      return result.rowsAffected || 0;
    } catch (error) {
      console.error('[Oracle] Execute failed:', error);
      console.error('[Oracle] SQL:', sql);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Oracle] Failed to close connection:', closeError);
        }
      }
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10);
        this.pool = null;
        console.log('[Oracle] Connection pool closed');
      } catch (error) {
        console.error('[Oracle] Failed to close connection pool:', error);
        throw error;
      }
    }
  }

  public getConnectionType(): OracleConnectionType {
    return this.connectionType;
  }

  public getPoolStatus(): any {
    if (!this.pool) {
      return null;
    }
    return this.pool.getStatistics();
  }
}

export const db = OracleConnection.getInstance();
export type { 
  OracleWalletConfig, 
  OracleBasicConfig, 
  OracleConfig, 
  OracleConnectionType,
  ReturningResult,
  TransactionOptions,
  QueryOptions
};
