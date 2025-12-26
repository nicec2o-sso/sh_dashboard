/**
 * Service 인스턴스 초기화 및 Export (Altibase 전용)
 * 
 * 이 파일은 Repository와 Service 인스턴스를 생성하고 export합니다.
 * Altibase만 사용하도록 단순화되었습니다.
 * 
 * 환경변수 설정 (.env.local):
 * ```
 * ALTIBASE_HOST=localhost
 * ALTIBASE_PORT=20300
 * ALTIBASE_USER=sys
 * ALTIBASE_PASSWORD=manager
 * ALTIBASE_DATABASE=mydb
 * ```
 * 
 * 사용 방법:
 * ```typescript
 * import { nodeService, DATABASE_TYPE } from '@/services/serviceInitializer';
 * 
 * console.log('Using database:', DATABASE_TYPE); // 'altibase'
 * const nodes = await nodeService.getAllNodes();
 * ```
 */

import { INodeRepository } from '@/repositories/INodeRepository';
import { AltibaseNodeRepository } from '@/repositories/AltibaseNodeRepository';
import { NodeService } from './nodeService.refactored';
import { getDatabaseType } from '@/lib/database';

/**
 * 현재 사용 중인 데이터베이스 타입 (항상 'altibase')
 */
export const DATABASE_TYPE = getDatabaseType();

/**
 * Node Repository 인스턴스 생성
 * 
 * Altibase Repository를 반환합니다.
 * 
 * @returns AltibaseNodeRepository 인스턴스
 */
function createNodeRepository(): INodeRepository {
  console.log('[ServiceInitializer] 🏗️  Creating Node Repository for: ALTIBASE');
  console.log('[ServiceInitializer] ✅ Using AltibaseNodeRepository');
  return new AltibaseNodeRepository();
}

/**
 * Node Service 싱글톤 인스턴스
 * 
 * 애플리케이션 전체에서 공유되는 단일 인스턴스입니다.
 * AltibaseNodeRepository를 주입받아 생성됩니다.
 */
const nodeRepository = createNodeRepository();
export const nodeService = new NodeService(nodeRepository);

/**
 * 다른 Service들도 동일한 패턴으로 추가 가능
 * 
 * 예시:
 * ```typescript
 * function createApiRepository(): IApiRepository {
 *   return new AltibaseApiRepository();
 * }
 * 
 * const apiRepository = createApiRepository();
 * export const apiService = new ApiService(apiRepository);
 * ```
 */

// 로깅
console.log('═══════════════════════════════════════════════════════');
console.log('[ServiceInitializer] 🎯 Database Type: ALTIBASE');
console.log('[ServiceInitializer] ✅ Services initialized successfully');
console.log('═══════════════════════════════════════════════════════');
