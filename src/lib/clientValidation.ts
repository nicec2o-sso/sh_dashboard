/**
 * 프론트엔드 Validation 유틸리티
 * 
 * 이 파일은 React 컴포넌트에서 사용할 validation 함수들을 제공합니다.
 * 사용자에게 친화적인 에러 메시지를 제공합니다.
 */

/**
 * 노드 생성/수정 데이터 검증
 */
export function validateNodeData(data: {
  nodeName?: string;
  host?: string;
  port?: string | number;
  nodeDesc?: string;
  tags?: string;
}): string | null {
  // 노드 이름 검증
  if (data.nodeName !== undefined) {
    if (!data.nodeName || data.nodeName.trim() === '') {
      return '노드 이름은 필수 항목입니다.';
    }
    if (data.nodeName.length > 50) {
      return '노드 이름은 50자 이하여야 합니다.';
    }
  }

  // 호스트 검증
  if (data.host !== undefined) {
    if (!data.host || data.host.trim() === '') {
      return '호스트는 필수 항목입니다.';
    }
    if (data.host.length > 100) {
      return '호스트는 100자 이하여야 합니다.';
    }
    // 간단한 호스트 형식 검증
    // const hostPattern = /^[a-zA-Z0-9.-]+$/;
    const hostPattern = /^(\/[a-zA-Z0-9._~%!$&'()*+,;=:@-]*)+$/; // 김병규님 요청으로 변경처리 1.16일
    if (!hostPattern.test(data.host)) {
      return '올바른 호스트 형식이 아닙니다 (예: example.com, 192.168.1.1)';
    }
  }

  // 포트 검증
  if (data.port !== undefined) {
    const port = typeof data.port === 'string' ? parseInt(data.port) : data.port;
    if (isNaN(port)) {
      return '포트는 숫자여야 합니다.';
    }
    if (port < 1 || port > 65535) {
      return '포트는 1-65535 사이의 값이어야 합니다.';
    }
  }

  // 설명 검증
  if (data.nodeDesc !== undefined && data.nodeDesc !== null && data.nodeDesc.length > 100) {
    return '설명은 100자 이하여야 합니다.';
  }

  // 태그 검증
  if (data.tags !== undefined && data.tags !== null) {
    if (data.tags.length > 500) {
      return '태그는 500자 이하여야 합니다.';
    }
    // 빈 태그 검증
    const tagArray = data.tags.split(',').map(t => t.trimStart().trimEnd());
    if (tagArray.some(t => t.length === 0)) {
      return '태그에 빈 값이 포함되어 있습니다.';
    }
  }

  return null;
}

/**
 * 노드 그룹 생성/수정 데이터 검증
 */
export function validateNodeGroupData(data: {
  nodeGroupName?: string;
  nodeGroupDesc?: string;
  nodeIds?: number[];
}): string | null {
  // 그룹 이름 검증
  if (data.nodeGroupName !== undefined) {
    if (!data.nodeGroupName || data.nodeGroupName.trim() === '') {
      return '그룹 이름은 필수 항목입니다.';
    }
    if (data.nodeGroupName.length > 50) {
      return '그룹 이름은 50자 이하여야 합니다.';
    }
  }

  // 설명 검증
  if (data.nodeGroupDesc !== undefined && data.nodeGroupDesc !== null && data.nodeGroupDesc.length > 200) {
    return '설명은 200자 이하여야 합니다.';
  }

  // 노드 ID 배열 검증
  if (data.nodeIds !== undefined) {
    if (!Array.isArray(data.nodeIds)) {
      return '노드 ID는 배열이어야 합니다.';
    }
    if (data.nodeIds.length === 0) {
      return '최소 하나의 노드를 선택해야 합니다.';
    }
  }

  return null;
}

/**
 * API 생성/수정 데이터 검증
 */
export function validateApiData(data: {
  apiName?: string;
  uri?: string;
  method?: string;
  tags?: string;
  parameters?: any[];
}): string | null {
  // API 이름 검증
  if (data.apiName !== undefined) {
    if (!data.apiName || data.apiName.trim() === '') {
      return 'API 이름은 필수 항목입니다.';
    }
    if (data.apiName.length > 50) {
      return 'API 이름은 50자 이하여야 합니다.';
    }
  }

  // URI 검증
  if (data.uri !== undefined) {
    if (!data.uri || data.uri.trim() === '') {
      return 'URI는 필수 항목입니다.';
    }
    if (!data.uri.startsWith('/')) {
      return 'URI는 / 로 시작해야 합니다.';
    }
    //const urlPattern = /^\/[a-zA-Z\/]+$/;
    const urlPattern = /^(\/[a-zA-Z0-9._~%!$&'()*+,;=:@-]*)+$/; // 김병규님 요청으로 변경처리 1.16일
    if (!urlPattern.test(data.uri)) {
      return 'URI패턴이 아닙니다.';
    }
    if (data.uri.length > 200) {
      return 'URI는 200자 이하여야 합니다.';
    }
  }

  // Method 검증
  if (data.method !== undefined) {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!allowedMethods.includes(data.method.toUpperCase())) {
      return 'Method는 GET, POST, PUT, DELETE 중 하나여야 합니다.';
    }
  }

  // 태그 검증
  if (data.tags !== undefined && data.tags !== null) {
    if (data.tags.length > 500) {
      return '태그는 500자 이하여야 합니다.';
    }
    // 빈 태그 검증
    const tagArray = data.tags.split(',').map(t => t.trimStart().trimEnd());
    if (tagArray.some(t => t.length === 0)) {
      return '태그에 빈 값이 포함되어 있습니다.';
    }
  }

  // 파라미터 검증
  if (data.parameters !== undefined && data.parameters !== null) {
    if (!Array.isArray(data.parameters)) {
      return '파라미터는 배열이어야 합니다.';
    }
    
    for (let i = 0; i < data.parameters.length; i++) {
      const param = data.parameters[i];
      const paramError = validateApiParameterData(param);
      if (paramError) {
        return `파라미터 ${i + 1}: ${paramError}`;
      }
    }
  }

  return null;
}

/**
 * API 파라미터 검증
 */
export function validateApiParameterData(param: {
  apiParameterName?: string;
  apiParameterType?: string;
  apiParameterRequired?: string;
  apiParameterDesc?: string;
}): string | null {
  // 파라미터 이름 검증
  if (!param.apiParameterName || param.apiParameterName.trim() === '') {
    return '파라미터 이름은 필수 항목입니다.';
  }
  if (param.apiParameterName.length > 40) {
    return '파라미터 이름은 40자 이하여야 합니다.';
  }

  // 파라미터 타입 검증
  if (!param.apiParameterType) {
    return '파라미터 타입은 필수 항목입니다.';
  }
  const allowedTypes = ['query', 'body'];
  if (!allowedTypes.includes(param.apiParameterType)) {
    return '파라미터 타입은 query 또는 body여야 합니다.';
  }

  // 필수 여부 검증
  if (!param.apiParameterRequired) {
    return '파라미터 필수 여부는 필수 항목입니다.';
  }
  const allowedRequired = ['Y', 'N'];
  if (!allowedRequired.includes(param.apiParameterRequired.toUpperCase())) {
    return '파라미터 필수 여부는 Y 또는 N이어야 합니다.';
  }

  // 설명 검증
  if (param.apiParameterDesc !== undefined && param.apiParameterDesc !== null && param.apiParameterDesc.length > 100) {
    return '파라미터 설명은 100자 이하여야 합니다.';
  }

  return null;
}

/**
 * Synthetic Test 생성/수정 데이터 검증
 */
export function validateSyntheticTestData(data: {
  syntheticTestName?: string;
  targetType?: string;
  targetId?: number | string;
  apiId?: number | string;
  intervalSeconds?: number | string;
  alertThresholdMs?: number | string;
  tags?: string;
}): string | null {
  // 테스트 이름 검증
  if (data.syntheticTestName !== undefined) {
    if (!data.syntheticTestName || data.syntheticTestName.trim() === '') {
      return '테스트 이름은 필수 항목입니다.';
    }
    if (data.syntheticTestName.length > 50) {
      return '테스트 이름은 50자 이하여야 합니다.';
    }
  }

  // 대상 타입 검증
  if (data.targetType !== undefined) {
    const allowedTypes = ['node', 'group'];
    if (!allowedTypes.includes(data.targetType)) {
      return '대상 타입은 node 또는 group이어야 합니다.';
    }
  }

  // 대상 ID 검증
  if (data.targetId !== undefined) {
    const targetId = typeof data.targetId === 'string' ? parseInt(data.targetId) : data.targetId;
    if (isNaN(targetId) || targetId < 1) {
      return '대상 선택은 필수 입니다.';
    }
  }

  // API ID 검증
  if (data.apiId !== undefined) {
    const apiId = typeof data.apiId === 'string' ? parseInt(data.apiId) : data.apiId;
    if (isNaN(apiId) || apiId < 1) {
      return 'API는 필수입니다.';
    }
  }

  // 실행 간격 검증
  if (data.intervalSeconds !== undefined) {
    const interval = typeof data.intervalSeconds === 'string' ? parseInt(data.intervalSeconds) : data.intervalSeconds;
    if (isNaN(interval) || interval < 1) {
      return '실행 간격은 1초 이상이어야 합니다.';
    }
    if (interval > 86400) {
      return '실행 간격은 86400초(24시간) 이하여야 합니다.';
    }
  }

  // 알럿 기준 검증
  if (data.alertThresholdMs !== undefined) {
    const threshold = typeof data.alertThresholdMs === 'string' ? parseInt(data.alertThresholdMs) : data.alertThresholdMs;
    if (isNaN(threshold) || threshold < 1) {
      return '알럿 기준은 1ms 이상이어야 합니다.';
    }
    if (threshold > 60000) {
      return '알럿 기준은 60000ms(60초) 이하여야 합니다.';
    }
  }

  // 태그 검증
  if (data.tags !== undefined && data.tags !== null) {
    if (data.tags.length > 500) {
      return '태그는 500자 이하여야 합니다.';
    }
    // 빈 태그 허용
    // const tagArray = data.tags.split(',').map(t => t.trimStart().trimEnd());
    // if (tagArray.some(t => t.length === 0)) {
    //   return '태그에 빈 값이 포함되어 있습니다.';
    // }
  }

  return null;
}
