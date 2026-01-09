/**
 * useNodeManagement Hook
 * 
 * 노드 관리를 위한 커스텀 훅입니다.
 * 노드 목록 조회, 생성, 수정, 삭제 기능을 캡슐화하여 제공합니다.
 * 
 * @returns {object} 노드 관리 관련 상태와 함수들
 * 
 * @example
 * ```typescript
 * function NodeManagement() {
 *   const {
 *     nodes,
 *     isLoading,
 *     error,
 *     createNode,
 *     updateNode,
 *     deleteNode,
 *     refetch
 *   } = useNodeManagement();
 * 
 *   const handleCreate = async () => {
 *     await createNode({ name: 'New Server', host: '192.168.1.1', port: 8080 });
 *   };
 * 
 *   return <div>...</div>;
 * }
 * ```
 */

import { useState } from 'react';
import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';
import { useApiData } from './useApiData';

export interface UseNodeManagementReturn {
  /** 노드 목록 */
  nodes: Node[];
  /** 초기 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 생성 중 상태 */
  isCreating: boolean;
  /** 수정 중 상태 */
  isUpdating: boolean;
  /** 노드 생성 함수 */
  createNode: (data: CreateNodeDto) => Promise<Node | null>;
  /** 노드 수정 함수 */
  updateNode: (id: number, data: UpdateNodeDto) => Promise<Node | null>;
  /** 노드 삭제 함수 */
  deleteNode: (id: number) => Promise<boolean>;
  /** 데이터 새로고침 함수 */
  refetch: () => Promise<void>;
}

export function useNodeManagement(): UseNodeManagementReturn {
  // useApiData를 사용하여 노드 목록 자동 관리 (10초마다 자동 갱신)
  const { data: nodes, isLoading, error, refetch } = useApiData<Node>('/api/nodes', {
    autoRefresh: true,
    refreshInterval: 10000,
  });

  // 개별 작업 로딩 상태
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * 노드 생성
   * 
   * @param data - 생성할 노드 정보
   * @returns 생성된 노드 객체 또는 null (실패 시)
   * @throws 유효성 검증 실패 시 에러를 throw하지 않고 null 반환 (UI에서 처리)
   */
  const createNode = async (data: CreateNodeDto): Promise<Node | null> => {
    // 유효성 검증
    if (!data.nodeName || !data.host || !data.port) {
      alert('이름, 호스트, 포트는 필수 입력 항목입니다.');
      return null;
    }

    if (data.port < 1 || data.port > 65535) {
      alert('올바른 포트 번호를 입력하세요 (1-65535)');
      return null;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 생성 실패: ${response.status}`);
      }

      const result = await response.json();
      const createdNode = result.data || result;

      // 생성 성공 시 목록 갱신
      await refetch();

      return createdNode;
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 등록에 실패했습니다.';
      console.error('Failed to create node:', e);
      alert(`노드 등록 실패: ${message}`);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 노드 수정
   * 
   * @param id - 수정할 노드의 ID
   * @param data - 수정할 노드 정보
   * @returns 수정된 노드 객체 또는 null (실패 시)
   */
  const updateNode = async (id: number, data: UpdateNodeDto): Promise<Node | null> => {
    // 유효성 검증 (수정 시에는 선택적이지만, 제공된 값은 검증)
    if (data.port !== undefined && (data.port < 1 || data.port > 65535)) {
      alert('올바른 포트 번호를 입력하세요 (1-65535)');
      return null;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 수정 실패: ${response.status}`);
      }

      const result = await response.json();
      const updatedNode = result.data || result;

      // 수정 성공 시 목록 갱신
      await refetch();

      return updatedNode;
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 수정에 실패했습니다.';
      console.error('Failed to update node:', e);
      alert(`노드 수정 실패: ${message}`);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 노드 삭제
   * 
   * @param id - 삭제할 노드의 ID
   * @returns 삭제 성공 여부
   */
  const deleteNode = async (id: number): Promise<boolean> => {
    // 사용자 확인
    if (!confirm('정말 이 노드를 삭제하시겠습니까?')) {
      return false;
    }

    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 삭제 실패: ${response.status}`);
      }

      // 삭제 성공 시 목록 갱신
      await refetch();
      alert('노드가 성공적으로 삭제되었습니다.');

      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 삭제에 실패했습니다.';
      console.error('Failed to delete node:', e);
      alert(`노드 삭제 실패: ${message}`);
      return false;
    }
  };

  return {
    nodes,
    isLoading,
    error,
    isCreating,
    isUpdating,
    createNode,
    updateNode,
    deleteNode,
    refetch,
  };
}
