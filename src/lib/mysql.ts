/**
 * MySQL 데이터베이스 연결 설정
 * 
 * 이 파일은 MySQL DB와의 연결을 관리합니다.
 * mysql2 패키지를 사용하여 MySQL에 연결합니다.
 * 
 * 환경변수 설정 필요:
 * - MYSQL_HOST: MySQL 서버 주소
 * - MYSQL_PORT: MySQL 포트 (기본값: 3306)
 * - MYSQL_USER: 데이터베이스 사용자명
 * - MYSQL_PASSWORD: 데이터베이스 비밀번호
 * - MYSQL_DATABASE: 데이터베이스 이름
 */

import mysql from 'mysql2/promise';

/**
 * MySQL 연결 설정 인터페이스
 */
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * 환경변수에서 MySQL 설정 로드
 * 
 * @returns MySQL 연결 설정 객체
 */
function getMySQLConfig(): MySQLConfig {
  const config: MySQLConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mydb',
  };

  // 필수 환경변수 검증
  if (!process.env.MYSQL_PASSWORD) {
    console.warn('⚠️  MYSQL_PASSWORD not set - using empty password');
  }

  return config;
}

/**
 * MySQL 데이터베이스 연결 풀
 * 
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 연결 풀만 사용합니다.
 */
class MySQLConnection {
  private static instance: MySQLConnection;
  private pool: mysql.Pool | null = null;
  private config: MySQLConfig;

  /**
   * private 생성자 - 싱글톤 패턴 구현
   */
  private constructor() {
    this.config = getMySQLConfig();
    console.log(`[MySQL] Configuration loaded: ${this.config.host}:${this.config.port}`);
  }

  /**
   * MySQLConnection 인스턴스 반환
   * 
   * @returns MySQLConnection 싱글톤 인스턴스
   */
  public static getInstance(): MySQLConnection {
    if (!MySQLConnection.instance) {
      MySQLConnection.instance = new MySQLConnection();
    }
    return MySQLConnection.instance;
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
      console.log('[MySQL] Connection pool already initialized');
      return;
    }

    try {
      console.log('[MySQL] Initializing connection pool...');
      
      // MySQL 연결 풀 생성
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,      // 연결 대기 허용
        connectionLimit: 10,             // 최대 연결 수
        queueLimit: 0,                   // 대기 큐 제한 없음
        enableKeepAlive: true,           // Keep-Alive 활성화
        keepAliveInitialDelay: 0,        // Keep-Alive 초기 지연
        timezone: '+00:00',              // UTC 시간대
        charset: 'utf8mb4',              // UTF-8 4바이트 문자셋 (이모지 지원)
      });

      console.log('[MySQL] Connection pool initialized successfully');
      
      // 연결 테스트
      await this.testConnection();
    } catch (error) {
      console.error('[MySQL] Failed to initialize connection pool:', error);
      throw new Error(`MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const [result] = await this.query('SELECT 1 as test');
      console.log('[MySQL] Connection test successful:', result);
    } catch (error) {
      console.error('[MySQL] Connection test failed:', error);
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
   * const nodes = await db.query('SELECT * FROM nodes');
   * 
   * // 파라미터 사용
   * const node = await db.query(
   *   'SELECT * FROM nodes WHERE id = ?',
   *   [nodeId]
   * );
   * ```
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('[MySQL] Connection pool not initialized. Call initialize() first.');
    }

    try {
      // execute는 Prepared Statement 사용 (안전)
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('[MySQL] Query execution failed:', error);
      console.error('[MySQL] SQL:', sql);
      console.error('[MySQL] Params:', params);
      throw error;
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
   *   await conn.execute('INSERT INTO nodes ...');
   *   await conn.execute('INSERT INTO node_history ...');
   *   // 둘 다 성공하면 자동 커밋, 하나라도 실패하면 롤백
   * });
   * ```
   */
  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('[MySQL] Connection pool not initialized. Call initialize() first.');
    }

    // 연결 풀에서 연결 가져오기
    const connection = await this.pool.getConnection();

    try {
      // 트랜잭션 시작
      await connection.beginTransaction();
      console.log('[MySQL] Transaction started');

      // 콜백 실행
      const result = await callback(connection);

      // 커밋
      await connection.commit();
      console.log('[MySQL] Transaction committed');

      return result;
    } catch (error) {
      // 롤백
      try {
        await connection.rollback();
        console.log('[MySQL] Transaction rolled back');
      } catch (rollbackError) {
        console.error('[MySQL] Failed to rollback transaction:', rollbackError);
      }
      
      console.error('[MySQL] Transaction failed:', error);
      throw error;
    } finally {
      // 연결 반환 (연결 풀로)
      connection.release();
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
        await this.pool.end();
        this.pool = null;
        console.log('[MySQL] Connection pool closed');
      } catch (error) {
        console.error('[MySQL] Failed to close connection pool:', error);
        throw error;
      }
    }
  }

  /**
   * 연결 풀 상태 확인
   * 
   * 현재 연결 풀의 상태를 반환합니다.
   * 
   * @returns 연결 풀 상태 정보
   */
  public getPoolStatus() {
    if (!this.pool) {
      return { initialized: false };
    }

    // MySQL2 Pool은 getConnection을 통해서만 상태 확인 가능
    // 직접적인 상태 조회 메서드는 제공하지 않음
    return {
      initialized: true,
      config: {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      }
    };
  }
}

// 싱글톤 인스턴스 export
export const db = MySQLConnection.getInstance();

// 타입 export
export type { MySQLConfig };
