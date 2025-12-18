/**
 * Altibase 데이터베이스 연결 설정
 * 
 * 이 파일은 Altibase DB와의 연결을 관리합니다.
 * ODBC 드라이버를 사용하여 Altibase에 연결합니다.
 * 
 * 환경변수 설정 필요:
 * - ALTIBASE_HOST: Altibase 서버 주소
 * - ALTIBASE_PORT: Altibase 포트 (기본값: 20300)
 * - ALTIBASE_USER: 데이터베이스 사용자명
 * - ALTIBASE_PASSWORD: 데이터베이스 비밀번호
 * - ALTIBASE_DATABASE: 데이터베이스 이름
 */

import odbc from 'odbc';

/**
 * Altibase 연결 설정 인터페이스
 */
interface AltibaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * 환경변수에서 Altibase 설정 로드
 * 
 * @returns Altibase 연결 설정 객체
 * @throws 필수 환경변수가 없을 경우 에러 발생
 */
function getAltibaseConfig(): AltibaseConfig {
  const config: AltibaseConfig = {
    host: process.env.ALTIBASE_HOST || 'localhost',
    port: parseInt(process.env.ALTIBASE_PORT || '20300'),
    user: process.env.ALTIBASE_USER || 'sys',
    password: process.env.ALTIBASE_PASSWORD || 'manager',
    database: process.env.ALTIBASE_DATABASE || 'mydb',
  };

  // 필수 환경변수 검증
  if (!process.env.ALTIBASE_USER) {
    console.warn('ALTIBASE_USER not set, using default: sys');
  }
  if (!process.env.ALTIBASE_PASSWORD) {
    console.warn('ALTIBASE_PASSWORD not set, using default: manager');
  }

  return config;
}

/**
 * Altibase 연결 문자열 생성
 * 
 * ODBC 드라이버에서 사용할 연결 문자열을 생성합니다.
 * 
 * @param config - Altibase 연결 설정
 * @returns ODBC 연결 문자열
 * 
 * @example
 * ```
 * DSN=ALTIBASE;SERVER=127.0.0.1;PORT=20300;UID=sys;PWD=manager;
 * ```
 */
function buildConnectionString(config: AltibaseConfig): string {
  // Altibase ODBC 드라이버 연결 문자열 형식
  return `DSN=ALTIBASE;` +
         `SERVER=${config.host};` +
         `PORT=${config.port};` +
         `UID=${config.user};` +
         `PWD=${config.password};` +
         `NLS_USE=UTF8`;
}

/**
 * Altibase 데이터베이스 연결 풀
 * 
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 연결 풀만 사용합니다.
 */
class AltibaseConnection {
  private static instance: AltibaseConnection;
  private pool: odbc.Pool | null = null;
  private config: AltibaseConfig;
  private connectionString: string;

  /**
   * private 생성자 - 싱글톤 패턴 구현
   */
  private constructor() {
    this.config = getAltibaseConfig();
    this.connectionString = buildConnectionString(this.config);
    console.log(`[Altibase] Configuration loaded: ${this.config.host}:${this.config.port}`);
  }

  /**
   * AltibaseConnection 인스턴스 반환
   * 
   * @returns AltibaseConnection 싱글톤 인스턴스
   */
  public static getInstance(): AltibaseConnection {
    if (!AltibaseConnection.instance) {
      AltibaseConnection.instance = new AltibaseConnection();
    }
    return AltibaseConnection.instance;
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
      console.log('[Altibase] Connection pool already initialized');
      return;
    }

    try {
      console.log('[Altibase] Initializing connection pool...');
      
      // ODBC 연결 풀 생성
      this.pool = await odbc.pool({
        connectionString: this.connectionString,
        connectionTimeout: 10, // 연결 타임아웃 (초)
        loginTimeout: 10,      // 로그인 타임아웃 (초)
      });

      console.log('[Altibase] Connection pool initialized successfully');
      
      // 연결 테스트
      await this.testConnection();
    } catch (error) {
      console.error('[Altibase] Failed to initialize connection pool:', error);
      throw new Error(`Altibase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.log('[Altibase] Connection test successful:', result);
    } catch (error) {
      console.error('[Altibase] Connection test failed:', error);
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
   * // 파라미터 사용
   * const node = await db.query(
   *   'SELECT * FROM NODES WHERE ID = ?',
   *   [nodeId]
   * );
   * ```
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('[Altibase] Connection pool not initialized. Call initialize() first.');
    }

    let connection: odbc.Connection | null = null;

    try {
      // 연결 풀에서 연결 가져오기
      connection = await this.pool.connect();
      
      // 쿼리 실행
      const result = params 
        ? await connection.query(sql, params)
        : await connection.query(sql);

      return result as T[];
    } catch (error) {
      console.error('[Altibase] Query execution failed:', error);
      console.error('[Altibase] SQL:', sql);
      console.error('[Altibase] Params:', params);
      throw error;
    } finally {
      // 연결 반환 (연결 풀로)
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Altibase] Failed to close connection:', closeError);
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
   *   await conn.query('INSERT INTO NODES ...');
   *   await conn.query('INSERT INTO NODE_HISTORY ...');
   *   // 둘 다 성공하면 자동 커밋, 하나라도 실패하면 롤백
   * });
   * ```
   */
  public async transaction<T>(
    callback: (connection: odbc.Connection) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('[Altibase] Connection pool not initialized. Call initialize() first.');
    }

    let connection: odbc.Connection | null = null;

    try {
      // 연결 풀에서 연결 가져오기
      connection = await this.pool.connect();
      
      // 트랜잭션 시작
      await connection.beginTransaction();
      console.log('[Altibase] Transaction started');

      // 콜백 실행
      const result = await callback(connection);

      // 커밋
      await connection.commit();
      console.log('[Altibase] Transaction committed');

      return result;
    } catch (error) {
      // 롤백
      if (connection) {
        try {
          await connection.rollback();
          console.log('[Altibase] Transaction rolled back');
        } catch (rollbackError) {
          console.error('[Altibase] Failed to rollback transaction:', rollbackError);
        }
      }
      
      console.error('[Altibase] Transaction failed:', error);
      throw error;
    } finally {
      // 연결 반환
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('[Altibase] Failed to close connection:', closeError);
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
        await this.pool.close();
        this.pool = null;
        console.log('[Altibase] Connection pool closed');
      } catch (error) {
        console.error('[Altibase] Failed to close connection pool:', error);
        throw error;
      }
    }
  }
}

// 싱글톤 인스턴스 export
export const db = AltibaseConnection.getInstance();

// 타입 export
export type { AltibaseConfig };
