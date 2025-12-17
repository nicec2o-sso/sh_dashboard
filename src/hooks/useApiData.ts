/**
 * useApiData Hook
 * 
 * 범용 데이터 fetching을 위한 커스텀 훅입니다.
 * 모든 API 엔드포인트에서 재사용 가능하며, 로딩 상태, 에러 처리, 데이터 갱신을 자동으로 관리합니다.
 * 
 * @template T - 응답 데이터의 타입
 * @param endpoint - 데이터를 가져올 API 엔드포인트 경로
 * @param options - 추가 옵션 (autoRefresh: 자동 갱신 여부, refreshInterval: 갱신 주기)
 * 
 * @returns {object} 데이터 fetching 상태와 제어 함수들
 * @returns {T[]} data - 가져온 데이터 배열
 * @returns {boolean} isLoading - 초기 로딩 상태 (첫 데이터 로드 시에만 true)
 * @returns {string | null} error - 에러 메시지 (에러 없으면 null)
 * @returns {function} refetch - 데이터를 수동으로 다시 가져오는 함수
 * @returns {boolean} isRefreshing - 백그라운드 갱신 중인지 여부 (초기 로딩과 구분)
 * 
 * @example
 * ```typescript
 * // 기본 사용
 * const { data: nodes, isLoading, error, refetch } = useApiData<Node>('/api/nodes');
 * 
 * // 자동 갱신 사용 (10초마다)
 * const { data: apis, isLoading } = useApiData<Api>('/api/apis', {
 *   autoRefresh: true,
 *   refreshInterval: 10000
 * });
 * 
 * // 수동 갱신
 * <Button onClick={refetch}>새로고침</Button>
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseApiDataOptions {
  /** 자동 갱신 활성화 여부 (기본값: false) */
  autoRefresh?: boolean;
  /** 자동 갱신 주기 (밀리초, 기본값: 10000ms = 10초) */
  refreshInterval?: number;
}

export interface UseApiDataReturn<T> {
  /** 가져온 데이터 배열 */
  data: T[];
  /** 초기 로딩 상태 (첫 데이터 로드 시에만 true) */
  isLoading: boolean;
  /** 에러 메시지 (에러 없으면 null) */
  error: string | null;
  /** 데이터를 수동으로 다시 가져오는 함수 */
  refetch: () => Promise<void>;
  /** 백그라운드 갱신 중인지 여부 (초기 로딩과 구분) */
  isRefreshing: boolean;
}

export function useApiData<T>(
  endpoint: string,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const { autoRefresh = false, refreshInterval = 10000 } = options;

  // 상태 관리
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩
  const [isRefreshing, setIsRefreshing] = useState(false); // 백그라운드 갱신
  const [error, setError] = useState<string | null>(null);

  // 첫 로드 여부를 추적하기 위한 ref
  const isFirstLoad = useRef(true);

  /**
   * 데이터를 가져오는 핵심 함수
   * 
   * 성공 시: data 상태 업데이트, error null로 초기화
   * 실패 시: error 상태 업데이트, 데이터는 유지 (이전 데이터 보존)
   */
  const fetchData = useCallback(async () => {
    // 첫 로드가 아니면 백그라운드 갱신 표시
    if (!isFirstLoad.current) {
      setIsRefreshing(true);
    }

    setError(null); // 이전 에러 초기화

    try {
      const response = await fetch(endpoint);

      // HTTP 에러 체크
      if (!response.ok) {
        throw new Error(`데이터 로드 실패: HTTP ${response.status}`);
      }

      const result = await response.json();

      // 응답 데이터 검증 (result.data가 배열인지 확인)
      if (!result.data || !Array.isArray(result.data)) {
        console.warn(`Unexpected response format from ${endpoint}:`, result);
        setData([]);
      } else {
        setData(result.data);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '데이터 로드에 실패했습니다.';
      console.error(`Failed to fetch data from ${endpoint}:`, e);
      setError(errorMessage);
      // 에러 발생 시에도 기존 데이터는 유지 (사용자가 계속 볼 수 있도록)
    } finally {
      // 첫 로드 완료
      if (isFirstLoad.current) {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
      setIsRefreshing(false);
    }
  }, [endpoint]);

  /**
   * 컴포넌트 마운트 시 데이터 로드
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * 자동 갱신 설정
   * autoRefresh가 true인 경우 refreshInterval마다 데이터를 다시 가져옴
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    // cleanup: 컴포넌트 언마운트 또는 의존성 변경 시 interval 제거
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    isRefreshing,
  };
}
