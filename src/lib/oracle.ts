/**
 * Oracle Autonomous Database 연결 설정
 * 
 * 이 파일은 Oracle Autonomous Database와의 연결을 관리합니다.
 * Oracle Wallet을 사용한 보안 연결과 기본 연결 방식을 모두 지원합니다.
 * 
 * 환경변수 설정 필요:
 * 
 * Wallet 방식 (Autonomous Database):
 * - ORACLE_WALLET_LOCATION: Wallet 파일 경로
 * - ORACLE_WALLET_PASSWORD: Wallet 비밀번호
 * - ORACLE_CONNECTION_STRING: TNS 연결 문자열 (예: mydb_high)
 * - ORACLE_USER: 데이터베이스 사용자명
 * - ORACLE_PASSWORD: 데이터베이스 비밀번호
 * 
 * 기본 방식:
 * - ORACLE_HOST: Oracle 서버 주소
 * - ORACLE_PORT: Oracle 포트 (기본값: 1521)
 * - ORACLE_SERVICE_NAME: 서비스 이름
 * - ORACLE_USER: 데이터베이스 사용자명
 * - ORACLE_PASSWORD: 데이터베이스 비밀번호
 */

import oracledb from 'oracledb';

/**
 * Oracle 연결 타입
 */
type OracleConnectionType = 'wallet' | 'basic';

/**
 * Oracle Wallet 연결 설정 인터페이스
 */
interface OracleWalletConfig {
  user: string;
  password: string;
  connectionString: string;
  walletLocation: string;
  walletPassword: string;
}

/**
 * Oracle 기본 연결 설정 인터페이스
 */
interface OracleBasicConfig {
  user: string;
  password: string;
  connectString: string; // host:port/service_name
}

/**
 * Oracle 연결 설정 통합 타입
 */
type OracleConfig = OracleWalletConfig | OracleBasicConfig;

/**
 * 환경변수에서 Oracle 설정 로드
 * 
 * ORACLE_WALLET_LOCATION이 설정되어 있으면 Wallet 방식,
 * 없으면 기본 연결 방식을 사용합니다.
 * 
 * @returns Oracle 연결 설정 객체와 연결 타입
 * @throws 필수 환경변수가 없을 경우 에러 발생
 */
function getOracleConfig(): { config: OracleConfig; type: OracleConnectionType } {
  // Wallet 방식 확인
  if (process.env.ORACLE_WALLET_LOCATION) {
    // Wallet 필수 환경변수 검증
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

    console.log('[Oracle] Using Wallet connection mode');
    console.log('[Oracle] Wallet location:', walletConfig.walletLocation);
    console.log('[Oracle] Connection string:', walletConfig.connectionString);

    return { config: walletConfig, type: 'wallet' };
  }

  // 기본 연결 방식
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

  console.log('[Oracle] Using basic connection mode');
  console.log('[Oracle] Connect string:', basicConfig.connectString);

  return { config: basicConfig, type: 'basic' };
}

/**
 * Wallet 설정이 있는지 확인
 */
function isWalletConfig(config: OracleConfig): config is OracleWalletConfig {
  return 'walletLocation' in config;
}

/**
 * Oracle 데이터베이스 연결 풀
 * 
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 연결 풀만 사용합니다.
 */
class OracleConnection {
  private static instance: OracleConnection;
  private pool: oracledb.Pool | null = null;
  private config: OracleConfig;
  private connectionType: OracleConnectionType;

  /**
   * private 생성자 - 싱글톤 패턴 구현
   */
  private constructor() {
    const { config, type } = getOracleConfig();
    this.config = config;
    this.connectionType = type;
    
    // Oracle 클라이언트 초기화 설정
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // 결과를 객체 형태로 반환
    oracledb.fetchAsString = [oracledb.CLOB]; // CLOB을 문자열로 자동 변환
    oracledb.autoCommit = false; // 명시적 커밋 사용
    
    console.log('[Oracle] Configuration loaded');
  }

  /**
   * OracleConnection 인스턴스 반환
   * 
   * @returns OracleConnection 싱글톤 인스턴스
   */
  public static getInstance(): OracleConnection {
    if (!OracleConnection.instance) {
      OracleConnection.instance = new OracleConnection();
    }
    return OracleConnection.instance;
  }

  /**
   * 연결 풀 초기화
   * 
   * 애플리케이션 시작 시 한 번 호출하여 연결 풀을 생성합니다.
   * 
   * @throws 연결 실패 시 에러 발생
   */
  public async initialize(): Promise<void> {
    if (this.pool) {
      console.log('[Oracle] Connection pool already initialized');
      return;
    }

    try {
      console.log('[Oracle] Initializing connection pool...');
      
      let poolConfig: oracledb.PoolAttributes;

      if (isWalletConfig(this.config)) {
        // Wallet 방식
        poolConfig = {
          user: this.config.user,
          password: this.config.password,
          connectionString: this.config.connectionString,
          walletLocation: this.config.walletLocation,
          walletPassword: this.config.walletPassword,
          poolMin: 2,
          poolMax: 10,
          poolIncrement: 1,
          poolTimeout: 60,
        };
      } else {
        // 기본 방식
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

      // 연결 풀 생성
      this.pool = await oracledb.createPool(poolConfig);

      console.log('[Oracle] Connection pool initialized successfully');
      console.log('[Oracle] Pool size:', {
        min: this.pool.poolMin,
        max: this.pool.poolMax,
        increment: this.pool.poolIncrement,
      });

      // 연결 테스트
      await this.testConnection();
    } catch (error) {
      console.error('[Oracle] Failed to initialize connection pool:', error);
      if (error instanceof Error) {
        console.error('[Oracle] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw new Error(
        `Oracle connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 연결 테스트
   * 
   * 간단한 쿼리를 실행하여 데이터베이스 연결을 확인합니다.
   * 
   * @throws 연결 테스트 실패 시 에러 발생
   */
  private async testConnection(): Promise<void> {
    try {
      const result = await this.query('SELECT 1 FROM DUAL');
      console.log('[Oracle] Connection test successful:', result);
    } catch (error) {
      console.error('[Oracle] Connection test failed:', error);
      throw error;
    }
  }

  /**
   * 쿼리 실행
   * 
   * SQL 쿼리를 실행하고 결과를 반환합니다.
   * 
   * @param sql - 실행할 SQL 쿼리
   * @param params - 쿼리 파라미터 (선택사항)
   * @returns 쿼리 실행 결과 배열
   * 
   * @example
   * ```typescript
   * // 단순 SELECT
   * const nodes = await db.query('SELECT * FROM NODES');
   * 
   * // 파라미터 사용 (Named 바인딩)
   * const node = await db.query(
   *   'SELECT * FROM NODES WHERE ID = :id',
   *   { id: nodeId }
   * );
   * 
   * // 파라미터 사용 (Positional 바인딩)
   * const node = await db.query(
   *   'SELECT * FROM NODES WHERE ID = :1',
   *   [nodeId]
   * );
   * ```
   */
  public async query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<T[]> {
    if (!this.pool) {
      throw new Error('[Oracle] Connection pool not initialized. Call initialize() first.');
    }

    let connection: oracledb.Connection | null = null;

    try {
      // 연결 풀에서 연결 가져오기
      connection = await this.pool.getConnection();

      // 쿼리 실행
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
      // 연결 반환 (연결 풀로)
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
   * 트랜잭션 실행
   * 
   * 여러 쿼리를 하나의 트랜잭션으로 실행합니다.
   * 콜백 함수 내에서 에러가 발생하면 자동으로 롤백됩니다.
   * 
   * @param callback - 트랜잭션 내에서 실행할 함수
   * @returns 콜백 함수의 반환값
   * 
   * @example
   * ```typescript
   * await db.transaction(async (conn) => {
   *   await conn.execute('INSERT INTO NODES ...');
   *   await conn.execute('INSERT INTO NODE_HISTORY ...');
   *   // 둘 다 성공하면 자동 커밋, 하나라도 실패하면 롤백
   * });
   * ```
   */
  public async transaction<T>(callback: (connection: oracledb.Connection) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('[Oracle] Connection pool not initialized. Call initialize() first.');
    }

    let connection: oracledb.Connection | null = null;

    try {
      // 연결 풀에서 연결 가져오기
      connection = await this.pool.getConnection();
      console.log('[Oracle] Transaction started');

      // 콜백 실행
      const result = await callback(connection);

      // 커밋
      await connection.commit();
      console.log('[Oracle] Transaction committed');

      return result;
    } catch (error) {
      // 롤백
      if (connection) {
        try {
          await connection.rollback();
          console.log('[Oracle] Transaction rolled back');
        } catch (rollbackError) {
          console.error('[Oracle] Failed to rollback transaction:', rollbackError);
        }
      }

      console.error('[Oracle] Transaction failed:', error);
      throw error;
    } finally {
      // 연결 반환
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
   * 연결 풀 종료
   * 
   * 애플리케이션 종료 시 호출하여 모든 연결을 정리합니다.
   */
  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10); // 10초 타임아웃
        this.pool = null;
        console.log('[Oracle] Connection pool closed');
      } catch (error) {
        console.error('[Oracle] Failed to close connection pool:', error);
        throw error;
      }
    }
  }

  /**
   * 현재 연결 타입 반환
   */
  public getConnectionType(): OracleConnectionType {
    return this.connectionType;
  }

  /**
   * 연결 풀 상태 반환
   */
  public getPoolStatus(): oracledb.PoolStatistics | null {
    if (!this.pool) {
      return null;
    }
    return this.pool.getStatistics();
  }
}

// 싱글톤 인스턴스 export
export const db = OracleConnection.getInstance();

// 타입 export
export type { OracleWalletConfig, OracleBasicConfig, OracleConfig, OracleConnectionType };
