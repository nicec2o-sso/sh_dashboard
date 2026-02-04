/**
 * Synthetic Test (합성 테스트) 도메인 관련 타입 정의
 * 
 * 이 파일은 합성 테스트와 관련된 모든 타입을 포함합니다.
 * 합성 테스트는 정해진 주기로 자동으로 API를 실행하여 노드의 상태를 모니터링합니다.
 */

/**
 * 합성 테스트를 나타내는 인터페이스
 * 
 * 특정 노드 또는 노드 그룹에 대해 주기적으로 API를 실행하는 테스트 정의입니다.
 * 
 * @property id - 합성 테스트의 고유 식별자
 * @property name - 테스트의 이름 (예: "Web Health Monitor")
 * @property targetId - 대상 노드 또는 그룹의 ID
 * @property targetType - 대상 타입 ('node': 단일 노드, 'group': 노드 그룹)
 * @property apiId - 실행할 API의 ID
 * @property apiParameterValues - API 파라미터 ID와 값을 매핑한 객체 (선택)
 * @property tags - 테스트를 분류하기 위한 태그 배열
 * @property intervalSeconds - 테스트 실행 주기 (초 단위)
 * @property alertThresholdMs - 알림 임계값 (밀리초) - 이 시간을 초과하면 알림 발생
 * @property createdAt - 테스트 생성 일시 (ISO 8601 형식)
 * 
 * @example
 * ```typescript
 * const test: SyntheticTest = {
 *   id: 1,
 *   name: "Web Server Health Check",
 *   targetId: 1,
 *   targetType: "node",
 *   apiId: 3,
 *   tags: ["production", "critical"],
 *   intervalSeconds: 60,
 *   alertThresholdMs: 1000,
 *   createdAt: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export interface SyntheticTest {
  syntheticTestId: number;
  syntheticTestName: string;
  targetId: number;
  targetType: 'node' | 'group';
  apiId: number;
  apiParameterValues?: Record<number, string>; // apiParameterId -> value
  tags: string;
  intervalSeconds: number;
  alertThresholdMs: number;
  createdAt?: string;
}

/**
 * DB에서 반환되는 합성 테스트 실행 이력 Row 인터페이스
 * 
 * 데이터베이스에서 직접 조회한 결과의 타입입니다.
 * success 필드는 DB에서 'Y'/'N' 값으로 반환됩니다.
 * 
 * @property syntheticTestHistoryId - 이력 레코드의 고유 식별자
 * @property syntheticTestId - 이 결과를 생성한 합성 테스트의 ID
 * @property nodeId - API가 실행된 노드의 ID
 * @property statusCode - HTTP 응답 상태 코드
 * @property success - 실행 성공 여부 (DB에서는 'Y' 또는 'N' 값)
 * @property responseTimeMs - 응답 시간 (밀리초)
 * @property executedAt - 실행 일시 (String 객체)
 * @property input - API 실행 시 전달된 입력 데이터 (JSON 문자열)
 * @property output - API 실행 결과 데이터 (JSON 문자열, 선택)
 * @property errorMessage - 오류 발생 시 오류 메시지 (선택)
 */
export interface SyntheticTestHistoryRow {
  syntheticTestHistoryId: number;
  syntheticTestId: number;
  nodeId: number;
  statusCode: number;
  success: 'Y' | 'N'; // DB에서 반환되는 값
  responseTimeMs: number;
  executedAt: string;
  input: string;
  output?: string;
  errorMessage?: string;
}

/**
 * 합성 테스트 실행 이력을 나타내는 인터페이스 (애플리케이션 레벨)
 * 
 * 합성 테스트가 실행될 때마다 생성되는 결과 레코드입니다.
 * 이를 통해 시간에 따른 노드의 상태 변화를 추적할 수 있습니다.
 * SyntheticTestHistoryRow를 변환하여 사용하는 타입입니다.
 * 
 * @property id - 이력 레코드의 고유 식별자
 * @property syntheticTestId - 이 결과를 생성한 합성 테스트의 ID
 * @property nodeId - API가 실행된 노드의 ID
 * @property statusCode - HTTP 응답 상태 코드
 * @property success - 실행 성공 여부 (boolean으로 변환됨)
 * @property responseTimeMs - 응답 시간 (밀리초)
 * @property executedAt - 실행 일시 (ISO 8601 형식)
 * @property input - API 실행 시 전달된 입력 데이터 (JSON 문자열)
 * @property output - API 실행 결과 데이터 (JSON 문자열, 선택)
 * @property errorMessage - 오류 발생 시 오류 메시지 (선택)
 * 
 * @example
 * ```typescript
 * const history: SyntheticTestHistory = {
 *   id: 1,
 *   syntheticTestId: 1,
 *   nodeId: 1,
 *   statusCode: 200,
 *   success: true, // 'Y'를 true로 변환
 *   responseTimeMs: 123,
 *   executedAt: "2024-01-01T12:00:00Z",
 *   input: '{"userId": "123"}',
 *   output: '{"status": "ok"}'
 * };
 * ```
 */
export interface SyntheticTestHistory {
  syntheticTestHistoryId: number;
  syntheticTestId: number;
  nodeId: number;
  statusCode: number;
  success: boolean; // DB의 'Y'/'N'을 boolean으로 변환한 값
  responseTimeMs: number;
  executedAt: string; // ISO 8601 형식 문자열
  input: string; // JSON 문자열 형태
  output?: string; // JSON 문자열 형태
  errorMessage?: string; 
}

export interface CreateSyntheticTestHistory {
  syntheticTestId?: number;
  nodeId: number;
  statusCode: number;
  success: boolean; // 저장 시 'Y'/'N'으로 변환되어 저장됨
  responseTimeMs: number;
  executedAt: string;
  input: string; // JSON 문자열 형태
  output?: string; // JSON 문자열 형태
  errorMessage?: string; 
}

/**
 * DB Row를 애플리케이션 레벨 타입으로 변환하는 유틸리티 함수
 * 
 * @param row - DB에서 조회한 SyntheticTestHistoryRow
 * @returns 변환된 SyntheticTestHistory 객체
 * 
 * @example
 * ```typescript
 * const dbRow: SyntheticTestHistoryRow = {
 *   syntheticTestHistoryId: 1,
 *   syntheticTestId: 1,
 *   nodeId: 1,
 *   statusCode: 200,
 *   success: 'Y', // DB 값
 *   responseTimeMs: 123,
 *   executedAt: new Date(),
 *   input: '{"userId": "123"}'
 * };
 * 
 * const history = convertSyntheticTestHistoryRow(dbRow);
 * console.log(history.success); // true
 * ```
 */
export function convertSyntheticTestHistoryRow(row: SyntheticTestHistoryRow): SyntheticTestHistory {
  return {
    syntheticTestHistoryId: row.syntheticTestHistoryId,
    syntheticTestId: row.syntheticTestId || 0,
    nodeId: row.nodeId,
    statusCode: row.statusCode,
    success: row.success === 'Y', // 'Y'/'N'을 boolean으로 변환
    responseTimeMs: row.responseTimeMs,
    executedAt: row.executedAt,
    input: row.input || '',
    output: row.output,
    errorMessage: row.errorMessage,
  };
}

/**
 * 합성 테스트 생성 시 사용하는 DTO
 * 
 * 새로운 합성 테스트를 생성할 때 필요한 데이터 구조입니다.
 * 
 * @property name - 생성할 테스트의 이름
 * @property targetId - 대상 노드 또는 그룹의 ID
 * @property targetType - 대상 타입
 * @property apiId - 실행할 API의 ID
 * @property tags - 테스트 태그 배열
 * @property intervalSeconds - 실행 주기 (초)
 * @property alertThresholdMs - 알림 임계값 (밀리초)
 * 
 * @example
 * ```typescript
 * const dto: CreateSyntheticTestDto = {
 *   name: "Database Performance Test",
 *   targetId: 2,
 *   targetType: "group",
 *   apiId: 5,
 *   tags: ["database", "performance"],
 *   intervalSeconds: 300,
 *   alertThresholdMs: 2000
 * };
 * ```
 */
export interface CreateSyntheticTestDto {
  syntheticTestName: string;
  targetId: number;
  targetType: 'node' | 'group';
  apiId: number;
  tags: string[];
  intervalSeconds: number;
  alertThresholdMs: number;
}

/**
 * 합성 테스트 수정 시 사용하는 DTO
 * 
 * 기존 합성 테스트의 정보를 업데이트할 때 사용합니다.
 * 모든 필드가 선택적이므로 변경하고자 하는 필드만 전달하면 됩니다.
 * 
 * @property name - 수정할 테스트 이름 (선택)
 * @property targetId - 수정할 대상 ID (선택)
 * @property targetType - 수정할 대상 타입 (선택)
 * @property apiId - 수정할 API ID (선택)
 * @property tags - 수정할 태그 배열 (선택)
 * @property intervalSeconds - 수정할 실행 주기 (선택)
 * @property alertThresholdMs - 수정할 알림 임계값 (선택)
 * 
 * @example
 * ```typescript
 * // 실행 주기만 변경
 * const dto: UpdateSyntheticTestDto = {
 *   intervalSeconds: 600
 * };
 * 
 * // 알림 임계값과 태그 변경
 * const dto2: UpdateSyntheticTestDto = {
 *   alertThresholdMs: 1500,
 *   tags: ["production", "critical", "database"]
 * };
 * ```
 */
export interface UpdateSyntheticTestDto {
  syntheticTestName?: string;
  targetId?: number;
  targetType?: 'node' | 'group';
  apiId?: number;
  tags?: string[];
  intervalSeconds?: number;
  alertThresholdMs?: number;
}
