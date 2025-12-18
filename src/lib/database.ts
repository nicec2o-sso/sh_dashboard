/**
 * 통합 데이터베이스 연결 관리
 * 
 * 환경변수 USE_DATABASE에 따라 Altibase 또는 MySQL 중 하나를 선택하여 사용합니다.
 * 
 * 지원 데이터베이스:
 * - altibase: Altibase 데이터베이스
 * - mysql: MySQL 데이터베이스
 * 
 * 환경변수 설정 (.env.local):
 * ```
 * USE_DATABASE=mysql  # 또는 altibase
 * 
 * # MySQL 설정 (USE_DATABASE=mysql인 경우)
 * MYSQL_HOST=localhost
 * MYSQL_PORT=3306
 * MYSQL_USER=root
 * MYSQL_PASSWORD=password
 * MYSQL_DATABASE=mydb
 * 
 * # Altibase 설정 (USE_DATABASE=altibase인 경우)
 * ALTIBASE_HOST=localhost
 * ALTIBASE_PORT=20300
 * ALTIBASE_USER=sys
 * ALTIBASE_PASSWORD=manager
 * ALTIBASE_DATABASE=mydb
 * ```
 * 
 * 사용 방법:
 * ```typescript
 * import { db } from '@/lib/database';
 * 
 * // 초기화 (애플리케이션 시작 시 한 번)
 * await db.initialize();
 * 
 * // 쿼리 실행
 * const nodes = await db.query('SELECT * FROM nodes');
 * 
 * // 트랜잭션
 * await db.transaction(async (conn) => {
 *   await conn.execute('INSERT INTO nodes ...');
 *   await conn.execute('UPDATE nodes ...');
 * });
 * ```
 */

import { db as altibaseDb } from './altibase';
import { db as mysqlDb } from './mysql';

/**
 * 데이터베이스 타입
 */
export type DatabaseType = 'altibase' | 'mysql';

/**
 * 데이터베이스 인터페이스
 * 
 * Altibase와 MySQL 모두 이 인터페이스를 구현합니다.
 */
export interface IDatabase {
  initialize(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (connection: any) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * 통합 데이터베이스 연결 클래스
 * 
 * 환경변수에 따라 적절한 데이터베이스 인스턴스를 반환합니다.
 */
class DatabaseManager {
  private static instance: DatabaseManager;
  private dbType: DatabaseType;
  private dbInstance: IDatabase;

  /**
   * private 생성자 - 싱글톤 패턴
   */
  private constructor() {
    // 환경변수에서 데이터베이스 타입 읽기
    const envDbType = process.env.USE_DATABASE?.toLowerCase() || 'mysql';
    
    // 유효한 데이터베이스 타입 확인
    if (envDbType !== 'altibase' && envDbType !== 'mysql') {
      console.warn(`[DatabaseManager] Invalid USE_DATABASE value: ${envDbType}, defaulting to mysql`);
      this.dbType = 'mysql';
    } else {
      this.dbType = envDbType as DatabaseType;
    }

    // 적절한 데이터베이스 인스턴스 선택
    this.dbInstance = this.dbType === 'altibase' ? altibaseDb : mysqlDb;

    console.log(`[DatabaseManager] 🗄️  Selected database: ${this.dbType.toUpperCase()}`);
  }

  /**
   * DatabaseManager 인스턴스 반환
   * 
   * @returns DatabaseManager 싱글톤 인스턴스
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 현재 사용 중인 데이터베이스 타입 반환
   * 
   * @returns 'altibase' 또는 'mysql'
   */
  public getType(): DatabaseType {
    return this.dbType;
  }

  /**
   * 데이터베이스 연결 초기화
   * 
   * 애플리케이션 시작 시 한 번 호출합니다.
   * 
   * @throws 초기화 실패 시 에러 발생
   */
  public async initialize(): Promise<void> {
    try {
      console.log(`[DatabaseManager] Initializing ${this.dbType.toUpperCase()} connection...`);
      await this.dbInstance.initialize();
      console.log(`[DatabaseManager] ✅ ${this.dbType.toUpperCase()} connection initialized successfully`);
    } catch (error) {
      console.error(`[DatabaseManager] ❌ Failed to initialize ${this.dbType.toUpperCase()}:`, error);
      throw error;
    }
  }

  /**
   * SQL 쿼리 실행
   * 
   * @param sql - 실행할 SQL 쿼리
   * @param params - 쿼리 파라미터 (선택사항)
   * @returns 쿼리 실행 결과 배열
   * 
   * @example
   * ```typescript
   * const nodes = await db.query('SELECT * FROM nodes WHERE id = ?', [1]);
   * ```
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return await this.dbInstance.query<T>(sql, params);
  }

  /**
   * 트랜잭션 실행
   * 
   * 여러 쿼리를 하나의 트랜잭션으로 실행합니다.
   * 
   * @param callback - 트랜잭션 내에서 실행할 함수
   * @returns 콜백 함수의 반환값
   * 
   * @example
   * ```typescript
   * await db.transaction(async (conn) => {
   *   await conn.execute('INSERT INTO nodes ...');
   *   await conn.execute('UPDATE nodes ...');
   * });
   * ```
   */
  public async transaction<T>(callback: (connection: any) => Promise<T>): Promise<T> {
    return await this.dbInstance.transaction(callback);
  }

  /**
   * 데이터베이스 연결 종료
   * 
   * 애플리케이션 종료 시 호출합니다.
   */
  public async close(): Promise<void> {
    console.log(`[DatabaseManager] Closing ${this.dbType.toUpperCase()} connection...`);
    await this.dbInstance.close();
    console.log(`[DatabaseManager] ✅ ${this.dbType.toUpperCase()} connection closed`);
  }
}

/**
 * 데이터베이스 매니저 싱글톤 인스턴스 export
 * 
 * 애플리케이션 전체에서 이 인스턴스를 사용합니다.
 * 
 * @example
 * ```typescript
 * import { db, getDatabaseType } from '@/lib/database';
 * 
 * // 현재 사용 중인 DB 확인
 * console.log('Using database:', getDatabaseType());
 * 
 * // 쿼리 실행
 * const nodes = await db.query('SELECT * FROM nodes');
 * ```
 */
export const db = DatabaseManager.getInstance();

/**
 * 현재 사용 중인 데이터베이스 타입 반환
 * 
 * @returns 'altibase' 또는 'mysql'
 */
export function getDatabaseType(): DatabaseType {
  return db.getType();
}

/**
 * 데이터베이스 타입 체크 헬퍼 함수
 */
export function isAltibase(): boolean {
  return db.getType() === 'altibase';
}

export function isMySQL(): boolean {
  return db.getType() === 'mysql';
}
