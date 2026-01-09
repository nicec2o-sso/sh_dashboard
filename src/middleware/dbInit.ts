/**
 * 데이터베이스 초기화 미들웨어
 * 
 * 이 파일은 더 이상 필요하지 않습니다.
 * oracle.ts가 자동으로 초기화를 처리합니다.
 * 
 * 하위 호환성을 위해 파일은 유지하지만 실제 초기화는 하지 않습니다.
 */

import { db } from '@/lib/oracle';

let initPromise: Promise<void> | null = null;

/**
 * 데이터베이스 초기화 보장
 * 
 * 참고: oracle.ts의 자동 초기화로 인해 이 함수는 더 이상 필수가 아닙니다.
 * 하지만 명시적으로 초기화를 원하는 경우 사용할 수 있습니다.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = db.initialize();
  }
  
  await initPromise;
}
