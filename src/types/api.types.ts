/**
 * API 도메인 관련 타입 정의
 * 
 * 이 파일은 API 정의, API 파라미터, API 실행 결과와 관련된 모든 타입을 포함합니다.
 * API는 노드에 대해 실행할 수 있는 HTTP 요청을 정의합니다.
 */

/**
 * API 파라미터를 나타내는 인터페이스
 * 
 * API 요청 시 필요한 파라미터를 정의합니다.
 * 
 * @property id - 파라미터의 고유 식별자
 * @property name - 파라미터 이름 (예: "userId", "query")
 * @property type - 파라미터 전달 방식 (query: URL 쿼리 스트링, body: 요청 본문)
 * @property required - 필수 파라미터 여부
 * @property description - 파라미터에 대한 설명 (선택사항)
 */
export interface ApiParameter {
  apiParameterId: number;
  apiParameterName: string;
  apiParameterType: 'query' | 'body';
  apiParameterRequired: string;
  apiParameterDesc?: string;
}

/**
 * API를 나타내는 인터페이스
 * 
 * 노드에 대해 실행할 수 있는 HTTP API를 정의합니다.
 * 
 * @property id - API의 고유 식별자
 * @property name - API의 이름 (예: "User List API")
 * @property uri - API의 URI 경로 (예: "/api/users")
 * @property method - HTTP 메서드 (GET, POST, PUT, DELETE)
 * @property apiParameterIds - 이 API가 사용하는 파라미터들의 ID 배열
 * @property createdAt - API 생성 일시 (ISO 8601 형식)
 */
export interface Api {
  apiId: number;
  apiName: string;
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  tags: string;
  apiParameterIds: number[];
  createdAt?: string;
  apiParameterCount?: number;
}

/**
 * API 실행 결과를 나타내는 인터페이스
 * 
 * 노드에 대해 API를 실행한 후 반환되는 결과를 표현합니다.
 * 
 * @property nodeId - API를 실행한 노드의 ID
 * @property nodeName - API를 실행한 노드의 이름
 * @property responseTimeMs - 응답 시간 (밀리초)
 * @property success - 실행 성공 여부
 * @property statusCode - HTTP 상태 코드 (200, 404, 500 등)
 * @property data - 응답 데이터 (JSON 형태)
 */
export interface ApiExecutionResult {
  nodeId: number;
  nodeName: string;
  responseTimeMs: number;
  success: boolean;
  statusCode: number;
  data?: any;
}

/**
 * API 생성/수정 시 파라미터 정의용 간소화된 인터페이스
 */
export interface ApiParameterInput {
  apiParameterName: string;
  apiParameterType: 'query' | 'body';
  apiParameterRequired: string;
  apiParameterDesc?: string;
}

/**
 * API 생성 시 사용하는 DTO
 * 
 * 새로운 API를 정의할 때 필요한 데이터 구조입니다.
 * 파라미터 정보도 함께 전달하여 API와 파라미터를 동시에 생성합니다.
 * 
 * @property name - 생성할 API의 이름
 * @property uri - API의 URI 경로 (반드시 '/'로 시작)
 * @property method - HTTP 메서드
 * @property parameters - API 파라미터 배열 (ID 없이 정의만 전달)
 * 
 * @example
 * ```typescript
 * const dto: CreateApiDto = {
 *   apiName: "Get User Info",
 *   uri: "/api/user",
 *   method: "GET",
 *   parameters: [
 *     {
 *       apiParameterName: "userId",
 *       apiParameterType: "query",
 *       apiParameterRequired: true,
 *       apiParameterDesc: "사용자 ID"
 *     }
 *   ]
 * };
 * ```
 */
export interface CreateApiDto {
  apiName: string;
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  tags: string;
  parameters?: ApiParameterInput[];
}

/**
 * API 수정 시 사용하는 DTO
 * 
 * 기존 API의 정보를 업데이트할 때 사용합니다.
 * 파라미터를 함께 전달하면 파라미터 ID는 유지하면서 내용만 업데이트됩니다.
 * 
 * @property apiName - 수정할 API 이름 (선택)
 * @property uri - 수정할 URI 경로 (선택)
 * @property method - 수정할 HTTP 메서드 (선택)
 * @property targetId - (사용 안 함, 레거시 필드)
 * @property parameters - 수정할 파라미터 배열 (선택) - 전체 교체됨
 * 
 * @example
 * ```typescript
 * // API 이름만 변경
 * const dto: UpdateApiDto = {
 *   apiName: "Updated API Name"
 * };
 * 
 * // 파라미터 전체 교체
 * const dto2: UpdateApiDto = {
 *   parameters: [
 *     { 
 *       apiParameterName: "newParam", 
 *       apiParameterType: "body", 
 *       apiParameterRequired: false,
 *       apiParameterDesc: "설명"
 *     }
 *   ]
 * };
 * ```
 */
export interface UpdateApiDto {
  apiName?: string;
  uri?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  tags?: string;
  targetId?: number;
  parameters?: ApiParameterInput[];
}

/**
 * API 파라미터 관리 DTO (레거시)
 * 
 * @deprecated 현재 사용되지 않는 인터페이스입니다.
 * API 파라미터는 CreateApiDto와 UpdateApiDto를 통해 관리됩니다.
 */
export interface ManageApiParameterDto {
  parameterId: string;
}

/**
 * API 파라미터 검증 DTO
 * 
 * API 실행 전 파라미터 검증을 위해 사용합니다.
 * 
 * @property providedParams - 사용자가 제공한 파라미터 객체 (키-값 쌍)
 */
export interface ValidateApiParametersDto {
  providedParams: Record<string, string>;
}

/**
 * API 실행 DTO
 * 
 * API를 실행할 때 전달하는 데이터 구조입니다.
 * 
 * @property apiId - 실행할 API의 ID
 * @property parameters - API 실행 시 전달할 파라미터 객체 (선택)
 * 
 * @example
 * ```typescript
 * const dto: ExecuteApiDto = {
 *   apiId: 1,
 *   parameters: {
 *     userId: "12345",
 *     includeDetails: "true"
 *   }
 * };
 * ```
 */
export interface ExecuteApiDto {
  apiId: number;
  parameters?: Record<string, any>;
}
