/**
 * Validation 유틸리티
 * 
 * 이 파일은 API 요청 데이터의 유효성 검사를 위한 헬퍼 함수들을 제공합니다.
 * 모든 검증 함수는 검증 실패 시 명확한 에러 메시지를 포함한 예외를 발생시킵니다.
 */

/**
 * 검증 에러 클래스
 */
export class ValidationError extends Error {
  public readonly field: string;
  public readonly statusCode: number;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * 필수 필드 검증
 * 값이 undefined, null, 빈 문자열이 아닌지 확인합니다.
 * 
 * @param value 검증할 값
 * @param fieldName 필드 이름
 * @throws ValidationError 필드가 비어있을 경우
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }
}

/**
 * 문자열 길이 검증
 * 
 * @param value 검증할 문자열
 * @param fieldName 필드 이름
 * @param minLength 최소 길이 (선택)
 * @param maxLength 최대 길이 (선택)
 * @throws ValidationError 길이가 범위를 벗어날 경우
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(fieldName, `${fieldName} must be a string`);
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be at most ${maxLength} characters long`
    );
  }
}

/**
 * 숫자 범위 검증
 * 
 * @param value 검증할 숫자
 * @param fieldName 필드 이름
 * @param min 최솟값 (선택)
 * @param max 최댓값 (선택)
 * @throws ValidationError 숫자가 아니거나 범위를 벗어날 경우
 */
export function validateNumberRange(
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): void {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ValidationError(fieldName, `${fieldName} must be a valid number`);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(fieldName, `${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(fieldName, `${fieldName} must be at most ${max}`);
  }
}

/**
 * 정수 검증
 * 
 * @param value 검증할 값
 * @param fieldName 필드 이름
 * @throws ValidationError 정수가 아닐 경우
 */
export function validateInteger(value: any, fieldName: string): void {
  const num = Number(value);
  
  if (isNaN(num) || !Number.isInteger(num)) {
    throw new ValidationError(fieldName, `${fieldName} must be an integer`);
  }
}

/**
 * 양의 정수 검증 (1 이상)
 * 
 * @param value 검증할 값
 * @param fieldName 필드 이름
 * @throws ValidationError 양의 정수가 아닐 경우
 */
export function validatePositiveInteger(value: any, fieldName: string): void {
  validateInteger(value, fieldName);
  const num = Number(value);
  
  if (num < 1) {
    throw new ValidationError(fieldName, `${fieldName} must be a positive integer (>= 1)`);
  }
}

/**
 * Enum 값 검증
 * 주어진 값이 허용된 값 목록에 포함되는지 확인합니다.
 * 
 * @param value 검증할 값
 * @param fieldName 필드 이름
 * @param allowedValues 허용된 값 목록
 * @throws ValidationError 허용되지 않은 값일 경우
 */
export function validateEnum(
  value: any,
  fieldName: string,
  allowedValues: any[]
): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
}

/**
 * HTTP 메서드 검증
 * 
 * @param method 검증할 메서드
 * @throws ValidationError 유효하지 않은 메서드일 경우
 */
export function validateHttpMethod(method: string): void {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  validateEnum(method.toUpperCase(), 'method', allowedMethods);
}

/**
 * URI 형식 검증
 * URI가 슬래시(/)로 시작하는지 확인합니다.
 * 
 * @param uri 검증할 URI
 * @param fieldName 필드 이름
 * @throws ValidationError 유효하지 않은 URI 형식일 경우
 */
export function validateUri(uri: string, fieldName: string = 'uri'): void {
  validateRequired(uri, fieldName);
  validateStringLength(uri, fieldName, 1, 500);
  
  if (!uri.startsWith('/')) {
    throw new ValidationError(fieldName, `${fieldName} must start with /`);
  }
}

/**
 * 호스트 주소 검증
 * IP 주소 또는 도메인 형식을 간단히 검증합니다.
 * 
 * @param host 검증할 호스트 주소
 * @throws ValidationError 유효하지 않은 호스트 형식일 경우
 */
export function validateHost(host: string): void {
  validateRequired(host, 'host');
  validateStringLength(host, 'host', 1, 200);
  
  // 간단한 형식 검증 (더 엄격한 검증은 필요에 따라 추가 가능)
  const hostPattern = /^[a-zA-Z0-9.-]+$/;
  if (!hostPattern.test(host)) {
    throw new ValidationError(
      'host',
      'host must be a valid domain or IP address'
    );
  }
}

/**
 * 포트 번호 검증
 * 
 * @param port 검증할 포트 번호
 * @throws ValidationError 유효하지 않은 포트 번호일 경우
 */
export function validatePort(port: any): void {
  validateRequired(port, 'port');
  validateNumberRange(port, 'port', 1, 65535);
  validateInteger(port, 'port');
}

/**
 * 노드 상태 검증
 * 
 * @param status 검증할 상태
 * @throws ValidationError 유효하지 않은 상태일 경우
 */
export function validateNodeStatus(status: string): void {
  const allowedStatuses = ['active', 'inactive', 'warning', 'error'];
  validateEnum(status, 'status', allowedStatuses);
}

/**
 * 대상 타입 검증 (Synthetic Test용)
 * 
 * @param targetType 검증할 대상 타입
 * @throws ValidationError 유효하지 않은 대상 타입일 경우
 */
export function validateTargetType(targetType: string): void {
  const allowedTypes = ['node', 'group'];
  validateEnum(targetType, 'targetType', allowedTypes);
}

/**
 * 파라미터 타입 검증 (API Parameter용)
 * 
 * @param paramType 검증할 파라미터 타입
 * @throws ValidationError 유효하지 않은 파라미터 타입일 경우
 */
export function validateParameterType(paramType: string): void {
  const allowedTypes = ['query', 'body'];
  validateEnum(paramType, 'type', allowedTypes);
}

/**
 * Y/N 값 검증
 * 
 * @param value 검증할 값
 * @param fieldName 필드 이름
 * @throws ValidationError Y 또는 N이 아닐 경우
 */
export function validateYesNo(value: string, fieldName: string): void {
  const allowedValues = ['Y', 'N'];
  validateEnum(value.toUpperCase(), fieldName, allowedValues);
}

/**
 * JSON 문자열 검증
 * 문자열이 유효한 JSON 형식인지 확인합니다.
 * 
 * @param jsonString 검증할 JSON 문자열
 * @param fieldName 필드 이름
 * @throws ValidationError 유효하지 않은 JSON 형식일 경우
 */
export function validateJson(jsonString: string, fieldName: string): void {
  if (!jsonString) return; // 빈 문자열은 허용 (선택적 필드일 경우)
  
  try {
    JSON.parse(jsonString);
  } catch (error) {
    throw new ValidationError(fieldName, `${fieldName} must be valid JSON`);
  }
}

/**
 * 태그 문자열 검증
 * 쉼표로 구분된 태그 문자열의 형식을 검증합니다.
 * 
 * @param tags 검증할 태그 문자열
 * @throws ValidationError 유효하지 않은 태그 형식일 경우
 */
export function validateTags(tags: string | null | undefined): void {
  if (!tags) return; // 태그는 선택적 필드
  
  validateStringLength(tags, 'tags', 0, 500);
  
  // 각 태그는 공백을 제거한 후 1자 이상이어야 함
  const tagArray = tags.split(',').map(t => t.trim());
  const invalidTags = tagArray.filter(t => t.length === 0);
  
  if (invalidTags.length > 0) {
    throw new ValidationError('tags', 'tags must not contain empty values');
  }
}

/**
 * 노드 그룹 데이터 검증
 * 
 * @param data 검증할 노드 그룹 데이터
 */
export function validateNodeGroupData(data: any): void {
  validateRequired(data.nodeGroupName, 'nodeGroupName');
  validateStringLength(data.nodeGroupName, 'nodeGroupName', 1, 200);
  
  if (data.nodeGroupDesc !== undefined && data.nodeGroupDesc !== null) {
    validateStringLength(data.nodeGroupDesc, 'nodeGroupDesc', 0, 1000);
  }
}

/**
 * API 데이터 검증
 * 
 * @param data 검증할 API 데이터
 */
export function validateApiData(data: any): void {
  validateRequired(data.apiName, 'apiName');
  validateStringLength(data.apiName, 'apiName', 1, 200);
  
  validateRequired(data.uri, 'uri');
  validateUri(data.uri, 'uri');
  
  validateRequired(data.method, 'method');
  validateHttpMethod(data.method);
}

/**
 * API 파라미터 데이터 검증
 * 
 * @param data 검증할 API 파라미터 데이터
 */
export function validateApiParameterData(data: any): void {
  validateRequired(data.apiParameterName, 'apiParameterName');
  validateStringLength(data.apiParameterName, 'apiParameterName', 1, 100);
  
  validateRequired(data.apiParameterType, 'apiParameterType');
  validateParameterType(data.apiParameterType);
  
  validateRequired(data.apiParameterRequired, 'apiParameterRequired');
  console.log('[validateApiParameterData] apiParameterRequired:',data.apiParameterRequired);
  validateYesNo(data.apiParameterRequired, 'apiParameterRequired');
  
  if (data.apiParameterDesc !== undefined && data.apiParameterDesc !== null) {
    validateStringLength(data.apiParameterDesc, 'apiParameterDesc', 0, 500);
  }
}

/**
 * Synthetic Test 데이터 검증
 * 
 * @param data 검증할 Synthetic Test 데이터
 */
export function validateSyntheticTestData(data: any): void {
  validateRequired(data.syntheticTestName, 'syntheticTestName');
  validateStringLength(data.syntheticTestName, 'syntheticTestName', 1, 200);
  
  validateRequired(data.targetType, 'targetType');
  validateTargetType(data.targetType);
  
  validateRequired(data.targetId, 'targetId');
  validatePositiveInteger(data.targetId, 'targetId');
  
  validateRequired(data.apiId, 'apiId');
  validatePositiveInteger(data.apiId, 'apiId');
  
  validateRequired(data.intervalSeconds, 'intervalSeconds');
  validateNumberRange(data.intervalSeconds, 'intervalSeconds', 1, 86400); // 1초 ~ 24시간
  
  validateRequired(data.alertThresholdMs, 'alertThresholdMs');
  validateNumberRange(data.alertThresholdMs, 'alertThresholdMs', 1, 60000); // 1ms ~ 60초
  
  if (data.tags !== undefined && data.tags !== null) {
    validateTags(data.tags);
  }
  
  validateRequired(data.syntheticTestEnabled, 'syntheticTestEnabled');
  validateYesNo(data.syntheticTestEnabled, 'syntheticTestEnabled');
}

/**
 * ID 파라미터 검증 (URL 파라미터용)
 * 
 * @param id 검증할 ID
 * @param fieldName 필드 이름
 * @throws ValidationError 유효하지 않은 ID일 경우
 */
export function validateId(id: any, fieldName: string = 'id'): number {
  validateRequired(id, fieldName);
  validatePositiveInteger(id, fieldName);
  return Number(id);
}

/**
 * Validation 에러를 HTTP 응답으로 변환
 * 
 * @param error 발생한 에러
 * @returns Response 객체
 */
export function handleValidationError(error: any): Response {
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        field: error.field,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 일반 에러 처리
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
