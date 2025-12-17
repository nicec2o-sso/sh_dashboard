/**
 * useApiManagement Hook
 * 
 * API 관리를 위한 커스텀 훅입니다.
 * API 목록 조회, 생성, 수정, 삭제, 복사 기능을 캡슐화하여 제공합니다.
 * API 파라미터도 함께 관리합니다.
 * 
 * @returns {object} API 관리 관련 상태와 함수들
 * 
 * @example
 * ```typescript
 * function ApiManagement() {
 *   const {
 *     apis,
 *     isLoading,
 *     createApi,
 *     updateApi,
 *     deleteApi,
 *     copyApi,
 *     loadApiParameters
 *   } = useApiManagement();
 * 
 *   return <div>...</div>;
 * }
 * ```
 */

import { useState } from 'react';
import { Api, ApiParameter, CreateApiDto, UpdateApiDto } from '@/types';
import { useApiData } from './useApiData';

export interface UseApiManagementReturn {
  /** API 목록 */
  apis: Api[];
  /** 초기 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 생성 중 상태 */
  isCreating: boolean;
  /** 수정 중 상태 */
  isUpdating: boolean;
  /** 복사 중 상태 */
  isCopying: boolean;
  /** API 생성 함수 */
  createApi: (data: CreateApiDto) => Promise<Api | null>;
  /** API 수정 함수 */
  updateApi: (id: number, data: UpdateApiDto) => Promise<Api | null>;
  /** API 삭제 함수 */
  deleteApi: (id: number) => Promise<boolean>;
  /** API 복사 함수 */
  copyApi: (api: Api) => Promise<Api | null>;
  /** API 파라미터 로드 함수 */
  loadApiParameters: (apiId: number) => Promise<ApiParameter[]>;
  /** 데이터 새로고침 함수 */
  refetch: () => Promise<void>;
}

export function useApiManagement(): UseApiManagementReturn {
  // useApiData를 사용하여 API 목록 자동 관리 (10초마다 자동 갱신)
  const { data: apis, isLoading, error, refetch } = useApiData<Api>('/api/apis', {
    autoRefresh: true,
    refreshInterval: 10000,
  });

  // 개별 작업 로딩 상태
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  /**
   * API 파라미터 로드
   * 
   * @param apiId - 파라미터를 로드할 API의 ID
   * @returns API 파라미터 배열
   */
  const loadApiParameters = async (apiId: number): Promise<ApiParameter[]> => {
    try {
      const response = await fetch(`/api/apis/${apiId}/parameters`);

      if (!response.ok) {
        throw new Error(`파라미터 로드 실패: ${response.status}`);
      }

      const data = await response.json();
      return (data.data || []) as ApiParameter[];
    } catch (e) {
      const message = e instanceof Error ? e.message : '파라미터 로드 실패';
      console.error('Failed to load API parameters:', e);
      throw new Error(message);
    }
  };

  /**
   * API 생성
   * 
   * @param data - 생성할 API 정보 (파라미터 포함)
   * @returns 생성된 API 객체 또는 null (실패 시)
   */
  const createApi = async (data: CreateApiDto): Promise<Api | null> => {
    // 유효성 검증
    if (!data.name || !data.uri) {
      alert('이름과 URI는 필수 입력 항목입니다.');
      return null;
    }

    // URI 형식 검증
    if (!data.uri.startsWith('/')) {
      alert('URI는 /로 시작해야 합니다.');
      return null;
    }

    // 파라미터 검증
    const invalidParams = data.parameters.filter(p => !p.name);
    if (invalidParams.length > 0) {
      alert('모든 파라미터에 이름을 입력해주세요.');
      return null;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 생성 실패: ${response.status}`);
      }

      const result = await response.json();
      const createdApi = result.data || result;

      // 생성 성공 시 목록 갱신
      await refetch();

      return createdApi;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 등록에 실패했습니다.';
      console.error('Failed to create API:', e);
      alert(`API 등록 실패: ${message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * API 수정
   * 
   * @param id - 수정할 API의 ID
   * @param data - 수정할 API 정보 (파라미터 포함)
   * @returns 수정된 API 객체 또는 null (실패 시)
   */
  const updateApi = async (id: number, data: UpdateApiDto): Promise<Api | null> => {
    // 유효성 검증
    if (data.name !== undefined && !data.name) {
      alert('API 이름은 비워둘 수 없습니다.');
      return null;
    }

    if (data.uri !== undefined && !data.uri.startsWith('/')) {
      alert('URI는 /로 시작해야 합니다.');
      return null;
    }

    // 파라미터 검증
    if (data.parameters) {
      const invalidParams = data.parameters.filter(p => !p.name);
      if (invalidParams.length > 0) {
        alert('모든 파라미터에 이름을 입력해주세요.');
        return null;
      }
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/apis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 수정 실패: ${response.status}`);
      }

      const result = await response.json();
      const updatedApi = result.data || result;

      // 수정 성공 시 목록 갱신
      await refetch();

      return updatedApi;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 수정에 실패했습니다.';
      console.error('Failed to update API:', e);
      alert(`API 수정 실패: ${message}`);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * API 삭제
   * 
   * @param id - 삭제할 API의 ID
   * @returns 삭제 성공 여부
   */
  const deleteApi = async (id: number): Promise<boolean> => {
    // 사용자 확인
    if (!confirm('정말 이 API를 삭제하시겠습니까? 연관된 테스트도 영향을 받을 수 있습니다.')) {
      return false;
    }

    try {
      const response = await fetch(`/api/apis/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 삭제 실패: ${response.status}`);
      }

      // 삭제 성공 시 목록 갱신
      await refetch();
      alert('API가 성공적으로 삭제되었습니다.');

      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 삭제에 실패했습니다.';
      console.error('Failed to delete API:', e);
      alert(`API 삭제 실패: ${message}`);
      return false;
    }
  };

  /**
   * API 복사
   * 
   * 기존 API를 복사하여 새로운 API를 생성합니다.
   * 파라미터도 함께 복사되며, 새로운 ID가 할당됩니다.
   * 
   * @param api - 복사할 API 객체
   * @returns 복사된 API 객체 또는 null (실패 시)
   */
  const copyApi = async (api: Api): Promise<Api | null> => {
    // 사용자 확인
    if (!confirm('정말 이 API를 복제하시겠습니까?')) {
      return null;
    }

    setIsCopying(true);
    try {
      // 기존 파라미터 로드
      let parameters: Array<{
        name: string;
        type: 'query' | 'body';
        required: boolean;
        description: string;
      }> = [];

      if (api.apiParameterIds.length > 0) {
        const loadedParams = await loadApiParameters(api.id);
        
        // 파라미터 속성만 복사 (ID는 제외)
        parameters = loadedParams.map(p => ({
          name: p.name,
          type: p.type,
          required: p.required,
          description: p.description || '',
        }));
      }

      // 복사본 생성
      const copyName = `${api.name} (복사본)`;
      const apiToCopy = {
        name: copyName,
        uri: api.uri,
        method: api.method,
        parameters,
      };

      const response = await fetch('/api/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiToCopy),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 복사 실패: ${response.status}`);
      }

      const result = await response.json();
      const copiedApi = result.data || result;

      // 복사 성공 시 목록 갱신
      await refetch();
      alert(`API가 성공적으로 복사되었습니다.\n원본 API ID: ${api.id}\n복사본 API ID: ${copiedApi.id}`);

      return copiedApi;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 복사에 실패했습니다.';
      console.error('Failed to copy API:', e);
      alert(`API 복사 실패: ${message}`);
      return null;
    } finally {
      setIsCopying(false);
    }
  };

  return {
    apis,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isCopying,
    createApi,
    updateApi,
    deleteApi,
    copyApi,
    loadApiParameters,
    refetch,
  };
}
