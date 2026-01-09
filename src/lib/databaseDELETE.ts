/**
 * Oracle 데이터베이스 연결 관리 (단일 DB 버전)
 * 
 * 이 파일은 Oracle DB와의 연결을 관리합니다.
 * ALTIBASE, MySQL 지원이 제거되고 Oracle만 사용합니다.
 * 
 * 환경변수 설정 (.env.local):
 * 
 * Wallet 방식 (Autonomous Database - 현재):
 * ```
 * ORACLE_WALLET_LOCATION=/path/to/wallet
 * ORACLE_WALLET_PASSWORD=your_wallet_password
 * ORACLE_CONNECTION_STRING=mydb_high
 * ORACLE_USER=admin
 * ORACLE_PASSWORD=your_password
 * ```
 * 
 * 기본 연결 방식 (추후 전환 예정):
 * ```
 * ORACLE_HOST=localhost
 * ORACLE_PORT=1521
 * ORACLE_SERVICE_NAME=ORCLPDB1
 * ORACLE_USER=your_user
 * ORACLE_PASSWORD=your_password
 * ```
 * 
 * 사용 방법:
 * ```typescript
 * import { db } from '@/lib/database';
 * 
 * // 초기화 (애플리케이션 시작 시 한 번)
 * await db.initialize();
 * 
 * // 쿼리 실행 (Named 바인딩)
 * const nodes = await db.query('SELECT * FROM NODES WHERE ID = :id', { id: 1 });
 * 
 * // 쿼리 실행 (Positional 바인딩)
 * const nodes = await db.query('SELECT * FROM NODES WHERE ID = :1', [1]);
 * 
 * // 트랜잭션
 * await db.transaction(async (conn) => {
 *   await conn.execute('INSERT INTO NODES ...');
 *   await conn.execute('UPDATE NODES ...');
 * });
 * ```
 */

import { db as oracleDb } from './oracle';

/**
 * 데이터베이스 타입 (Oracle 고정)
 */
export type DatabaseType = 'oracle';

/**
 * 데이터베이스 인터페이스
 */
export interface IDatabase {
  initialize(): Promise<void>;
  query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<T[]>;
  transaction<T>(callback: (connection: any) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * 데이터베이스 타입 반환 (항상 'oracle')
 * 
 * @returns 'oracle'
 */
export function getDatabaseType(): DatabaseType {
  return 'oracle';
}

/**
 * Oracle 사용 여부 확인 (항상 true)
 */
export function isOracle(): boolean {
  return true;
}

// Oracle 인스턴스를 직접 export
export const db = oracleDb;

console.log('═══════════════════════════════════════════════════════');
console.log('[Database] 🎯 Using Oracle Database');
console.log('═══════════════════════════════════════════════════════');
