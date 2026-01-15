// src/utils/webClient.ts 또는 src/api/webClient.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// 1. 기본 설정 및 상태 저장 (가변 Base URL을 저장할 변수)
let API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

/**
 * 전역 에러 핸들링 함수 (예: 401 Unauthorized 시 로그아웃 처리)
 * @param error AxiosError 객체
 */
const handleApiError = (error: AxiosError): Promise<AxiosError> => {
  if (error.response) {
    const { status, config } = error.response;
    
    // 401 Unauthorized 처리
    if (status === 401 && !config.url?.includes('auth/login')) {
      console.error('인증 실패(401): 토큰이 만료되었거나 유효하지 않습니다. 로그아웃을 시도합니다.');
      // 실제 애플리케이션에서는 여기서 사용자 로그아웃 로직을 실행해야 합니다.
      // 예: removeTokenFromStorage(); window.location.href = '/login';
    }
    
    // 403 Forbidden 처리 등
    if (status === 403) {
      console.error('권한 없음(403): 접근이 거부되었습니다.');
    }
    
    // 기타 HTTP 상태 코드에 따른 사용자 친화적인 메시지 로깅/처리
    console.error(`API Error - Status: ${status}, URL: ${config.url}`);
    
  } else if (error.request) {
    // 요청은 보내졌으나 응답을 받지 못한 경우 (네트워크 오류 등)
    console.error('API Error: 응답을 받지 못했습니다. 네트워크 상태를 확인하세요.', error.request);
  } else {
    // 요청 설정 중에 발생한 오류
    console.error('API Error: 요청 설정 오류.', error.message);
  }
  
  // 에러를 다시 던져서 호출하는 쪽에서 catch 블록으로 처리할 수 있도록 합니다.
  return Promise.reject(error);
};

// 2. Axios 인스턴스 생성 및 초기 설정
const webClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. 인터셉터 설정 (요청 전 공통 처리)
webClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Authorization 헤더 추가 (JWT 토큰)
    const token = "token"; // 실제 구현에서는 스토리지에서 토큰을 가져와야 합니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. URL 정규화 (WHATWG URL API 사용)
    // axios가 내부적으로 url.parse()를 사용하는 것을 방지하기 위해
    // URL을 명시적으로 처리
    if (config.url && config.baseURL) {
      try {
        // baseURL과 url을 결합하여 완전한 URL 생성
        const fullUrl = new URL(config.url, config.baseURL);
        // 완전한 URL로 설정하고 baseURL은 비움
        config.url = fullUrl.toString();
        config.baseURL = undefined;
      } catch (error) {
        // URL 파싱 실패 시 원본 URL 유지
        console.warn('URL parsing failed, using original URL:', error);
      }
    }
    
    // 3. 수정된 config를 반환
    return config; 
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. 인터셉터 설정 (응답 후 공통 처리)
webClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공적인 응답은 그대로 반환
    return response;
  },
  // 에러 발생 시 위에서 정의한 공통 에러 핸들러 호출
  handleApiError 
);


// --- Base URL 변경 기능 추가 ---

/**
 * webClient 인스턴스의 기본 Base URL을 동적으로 설정합니다.
 * @param newBaseUrl 새로운 Base URL
 */
export const setBaseUrl = (newBaseUrl: string): void => {
  API_BASE_URL = newBaseUrl; // 상태 업데이트
  webClient.defaults.baseURL = newBaseUrl; // Axios 인스턴스 설정 업데이트
  console.log(`WebClient Base URL이 ${newBaseUrl}로 변경되었습니다.`);
};

// 5. 타입 안전성을 위한 래퍼 함수 (WebClient 객체)
/**
 * 범용적인 API 호출을 위한 래퍼 객체입니다.
 * T: 응답 데이터 타입
 * B: 요청 바디 데이터 타입 (POST/PUT/PATCH에서 사용)
 * 
 * 모든 URL은 WHATWG URL API를 사용하여 처리됩니다.
 */
export const WebClient = {
  
  // GET 요청
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    // URL 정규화 (WHATWG URL API)
    const normalizedUrl = normalizeUrl(url, API_BASE_URL);
    const response = await webClient.get<T>(normalizedUrl, { ...config, baseURL: undefined });
    return response.data;
  },
  
  // POST 요청
  post: async <T, B = any>(url: string, data?: B, config?: AxiosRequestConfig): Promise<T> => {
    console.log('POST111111111111111:', url, data, config);
    const normalizedUrl = normalizeUrl(url, API_BASE_URL);
    const response = await webClient.post<T>(normalizedUrl, data, { ...config, baseURL: undefined });
    console.log('POST2222222222222222:', response.data);
    return response.data;
  },

  // PUT 요청
  put: async <T, B = any>(url: string, data?: B, config?: AxiosRequestConfig): Promise<T> => {
    const normalizedUrl = normalizeUrl(url, API_BASE_URL);
    const response = await webClient.put<T>(normalizedUrl, data, { ...config, baseURL: undefined });
    return response.data;
  },

  // PATCH 요청 (부분 업데이트)
  patch: async <T, B = any>(url: string, data?: B, config?: AxiosRequestConfig): Promise<T> => {
    const normalizedUrl = normalizeUrl(url, API_BASE_URL);
    const response = await webClient.patch<T>(normalizedUrl, data, { ...config, baseURL: undefined });
    return response.data;
  },

  // DELETE 요청
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const normalizedUrl = normalizeUrl(url, API_BASE_URL);
    const response = await webClient.delete<T>(normalizedUrl, { ...config, baseURL: undefined });
    return response.data;
  },
};

/**
 * URL을 정규화하는 헬퍼 함수 (WHATWG URL API 사용)
 * @param url 대상 URL
 * @param baseUrl 기본 URL
 * @returns 정규화된 완전한 URL 문자열
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    // 절대 URL인 경우 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // 상대 URL인 경우 baseUrl과 결합
    const fullUrl = new URL(url, baseUrl);
    return fullUrl.toString();
  } catch (error) {
    console.warn('URL normalization failed, using original URL:', error);
    return url;
  }
}

export interface WebClientResponse {
    /**
     * HTTP 응답 상태 코드 (예: 200, 404, 500 등).
     */
    statusCode: number;

    /**
     * 요청부터 응답 완료까지 걸린 시간 (밀리초 단위).
     */
    responseTimeMs: number;
    
    /**
     * HTTP 상태 코드가 2xx 범위인지 여부 등 성공 여부를 나타내는 플래그.
     * (WebClient의 내부 로직에 따라 결정됨)
     */
    success: boolean; 

    /**
     * 외부 API(타겟 노드)로부터 수신한 실제 응답 데이터 (JSON 본문).
     * 데이터가 없거나 실패한 경우 오류 상세 정보가 포함될 수 있습니다.
     */
    data: any;
}

export default webClient;
