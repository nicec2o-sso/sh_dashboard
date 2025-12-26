/**
 * 데이터베이스 초기화 유틸리티
 * 
 * API 라우트에서 호출하여 데이터베이스 연결을 보장합니다.
 */

import { db } from '@/lib/database';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * 데이터베이스 초기화 (한 번만 실행)
 * 
 * 여러 API 라우트에서 동시에 호출해도 한 번만 초기화됩니다.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  // 이미 초기화되었으면 즉시 반환
  if (isInitialized) {
    return;
  }

  // 초기화 중이면 해당 Promise 반환 (중복 초기화 방지)
  if (initializationPromise) {
    return initializationPromise;
  }

  // 새로운 초기화 시작
  initializationPromise = (async () => {
    try {
      console.log('[DB Init] Starting database initialization...');
      await db.initialize();
      isInitialized = true;
      console.log('[DB Init] ✅ Database initialized successfully');
    } catch (error) {
      console.error('[DB Init] ❌ Database initialization failed:', error);
      initializationPromise = null; // 실패 시 다시 시도할 수 있도록
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * 데이터베이스 초기화 상태 확인
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}
