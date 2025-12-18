/**
 * Service 인스턴스 초기화 및 Export
 * 
 * 이 파일은 Repository와 Service 인스턴스를 생성하고 export합니다.
 * 애플리케이션 전체에서 하나의 Service 인스턴스를 공유합니다 (싱글톤 패턴).
 * 
 * 환경 변수 USE_DATABASE에 따라 저장소를 선택합니다:
 * - 'mysql': MySQL 데이터베이스 사용 (기본값)
 * - 'altibase': Altibase 데이터베이스 사용
 * 
 * 환경변수 설정 (.env.local):
 * ```
 * # 데이터베이스 선택
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
 * import { nodeService, DATABASE_TYPE } from '@/services/serviceInitializer';
 * 
 * console.log('Using database:', DATABASE_TYPE);
 * const nodes = await nodeService.getAllNodes();
 * ```
 */

import { INodeRepository } from '@/repositories/INodeRepository';
import { AltibaseNodeRepository } from '@/repositories/AltibaseNodeRepository';
import { MySQLNodeRepository } from '@/repositories/MySQLNodeRepository';
import { NodeService } from './nodeService.refactored';
import { getDatabaseType } from '@/lib/database';

/**
 * 현재 사용 중인 데이터베이스 타입
 * 
 * 환경변수 USE_DATABASE의 값입니다.
 */
export const DATABASE_TYPE = getDatabaseType();

/**
 * Node Repository 인스턴스 생성
 * 
 * 환경에 따라 적절한 Repository 구현체를 선택합니다.
 * 
 * @returns INodeRepository 구현체
 */
function createNodeRepository(): INodeRepository {
  console.log(`[ServiceInitializer] 🏗️  Creating Node Repository for: ${DATABASE_TYPE.toUpperCase()}`);
  
  switch (DATABASE_TYPE) {
    case 'mysql':
      console.log('[ServiceInitializer] ✅ Using MySQLNodeRepository');
      return new MySQLNodeRepository();
    
    case 'altibase':
      console.log('[ServiceInitializer] ✅ Using AltibaseNodeRepository');
      return new AltibaseNodeRepository();
    
    default:
      // 기본값은 MySQL
      console.warn(`[ServiceInitializer] ⚠️  Unknown database type: ${DATABASE_TYPE}, defaulting to MySQL`);
      return new MySQLNodeRepository();
  }
}

/**
 * Node Service 싱글톤 인스턴스
 * 
 * 애플리케이션 전체에서 공유되는 단일 인스턴스입니다.
 * Repository를 주입받아 생성됩니다.
 */
const nodeRepository = createNodeRepository();
export const nodeService = new NodeService(nodeRepository);

/**
 * 다른 Service들도 동일한 패턴으로 추가
 * 
 * TODO: 다음 Service들을 리팩토링하고 여기에 추가
 * - apiService
 * - nodeGroupService
 * - syntheticTestService
 * 
 * 예시:
 * ```typescript
 * // API Repository 생성 함수
 * function createApiRepository(): IApiRepository {
 *   switch (DATABASE_TYPE) {
 *     case 'mysql':
 *       return new MySQLApiRepository();
 *     case 'altibase':
 *       return new AltibaseApiRepository();
 *     default:
 *       return new MySQLApiRepository();
 *   }
 * }
 * 
 * // API Service 인스턴스
 * const apiRepository = createApiRepository();
 * export const apiService = new ApiService(apiRepository);
 * ```
 */

// 로깅
console.log('═══════════════════════════════════════════════════════');
console.log(`[ServiceInitializer] 🎯 Database Type: ${DATABASE_TYPE.toUpperCase()}`);
console.log('[ServiceInitializer] ✅ Services initialized successfully');
console.log('═══════════════════════════════════════════════════════');
