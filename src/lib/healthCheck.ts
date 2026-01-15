/**
 * 호스트 헬스 체크 유틸리티
 * IP 주소와 URL(도메인)을 구분하여 적절한 헬스 체크를 수행합니다.
 */

/**
 * IP 주소 형식인지 확인하는 헬퍼 함수
 */
export function isIPAddress(host: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(host) || ipv6Regex.test(host);
}

/**
 * IP 주소에 대한 헬스 체크
 * 브라우저에서는 실제 ICMP ping이 불가능하므로 HTTP 요청으로 대체
 */
export async function checkIPHealth(host: string, port: number): Promise<{
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
}> {
  const startTime = Date.now();
  
  try {
    // 브라우저에서는 ICMP ping이 불가능하므로 HTTP HEAD 요청으로 대체
    const healthUrl = `http://${host}:${port}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });
    
    const responseTimeMs = Date.now() - startTime;
    
    if (response.ok || response.status === 404) {
      // 404도 서버가 응답한 것이므로 헬스 체크 성공으로 간주
      return {
        success: true,
        responseTimeMs,
      };
    } else {
      return {
        success: false,
        responseTimeMs,
        errorMessage: `HTTP ${response.status} ${response.statusText}`,
      };
    }
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    
    return {
      success: false,
      responseTimeMs,
      errorMessage: error.message || '연결 실패',
    };
  }
}

/**
 * URL(도메인)에 대한 헬스 체크
 */
export async function checkURLHealth(host: string, port: number): Promise<{
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
}> {
  const startTime = Date.now();
  
  try {
    // HTTP GET 요청으로 헬스 체크
    const healthUrl = `http://${host}:${port}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });
    
    const responseTimeMs = Date.now() - startTime;
    
    if (response.ok || response.status === 404) {
      // 404도 서버가 응답한 것이므로 헬스 체크 성공으로 간주
      return {
        success: true,
        responseTimeMs,
      };
    } else {
      return {
        success: false,
        responseTimeMs,
        errorMessage: `HTTP ${response.status} ${response.statusText}`,
      };
    }
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    
    return {
      success: false,
      responseTimeMs,
      errorMessage: error.message || '연결 실패',
    };
  }
}

/**
 * 호스트 헬스 체크 (IP 또는 URL에 따라 자동 선택)
 */
export async function checkHostHealth(host: string, port: number): Promise<{
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  checkType: 'ip' | 'url';
}> {
  const isIP = isIPAddress(host);
  const checkType = isIP ? 'ip' : 'url';
  
  console.log(`호스트 헬스 체크 시작: ${host}:${port} (타입: ${checkType})`);
  
  let healthCheckResult;
  
  if (isIP) {
    healthCheckResult = await checkIPHealth(host, port);
  } else {
    healthCheckResult = await checkURLHealth(host, port);
  }
  
  console.log(`호스트 헬스 체크 완료: ${host}:${port}`, healthCheckResult);
  
  return {
    ...healthCheckResult,
    checkType,
  };
}
