/**
 * useApiExecution Hook
 * 
 * API 실행 패널에서 사용하는 복잡한 로직을 캡슐화한 커스텀 훅입니다.
 * - 노드, 노드 그룹, API 목록 관리
 * - API 선택 시 파라미터 자동 로드
 * - 동적 파라미터 입력 관리
 * - API 실행 및 결과 관리
 * 
 * @returns {object} API 실행 관련 상태와 함수들
 * 
 * @example
 * ```typescript
 * function ApiExecutionPanel() {
 *   const {
 *     // 데이터
 *     nodes,
 *     nodeGroups,
 *     apis,
 *     selectedApiParameters,
 *     executionResult,
 *     
 *     // 선택 상태
 *     selectedTarget,
 *     setSelectedTarget,
 *     selectedApiId,
 *     setSelectedApiId,
 *     
 *     // 파라미터
 *     dynamicParams,
 *     handleDynamicParamChange,
 *     
 *     // 실행
 *     executeApi,
 *     executionStatus,
 *     
 *     // 로딩
 *     isLoading
 *   } = useApiExecution();
 * 
 *   return <div>...</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Node, NodeGroup, Api, ApiParameter, ApiExecutionResult } from '@/types';
import { useApiData } from './useApiData';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface UseApiExecutionReturn {
  // 데이터
  nodes: Node[];
  nodeGroups: NodeGroup[];
  apis: Api[];
  selectedApiParameters: ApiParameter[];
  executionResult: ApiExecutionResult[];
  
  // 선택 상태
  selectedTarget: string;
  setSelectedTarget: (target: string) => void;
  selectedApiId: string;
  setSelectedApiId: (apiId: string) => void;
  
  // 파라미터
  dynamicParams: Record<string, string>;
  handleDynamicParamChange: (paramName: string, value: string) => void;
  
  // 실행
  executeApi: () => Promise<void>;
  executionStatus: ExecutionStatus;
  
  // 로딩
  isLoading: boolean;
  isParameterLoading: boolean;
  error: string | null;
}

export function useApiExecution(): UseApiExecutionReturn {
  // 데이터 로드 (자동 갱신 없음 - 실행 패널은 수동으로 관리)
  const { data: nodes, isLoading: nodesLoading } = useApiData<Node>('/api/nodes');
  const { data: nodeGroups, isLoading: groupsLoading } = useApiData<NodeGroup>('/api/node-groups');
  const { data: apis, isLoading: apisLoading } = useApiData<Api>('/api/apis');

  // 선택 상태
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedApiId, setSelectedApiId] = useState<string>('');

  // 파라미터 관련 상태
  const [selectedApiParameters, setSelectedApiParameters] = useState<ApiParameter[]>([]);
  const [isParameterLoading, setIsParameterLoading] = useState(false);
  const [dynamicParams, setDynamicParams] = useState<Record<string, string>>({});

  // 실행 관련 상태
  const [executionResult, setExecutionResult] = useState<ApiExecutionResult[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // 전체 로딩 상태
  const isLoading = nodesLoading || groupsLoading || apisLoading;

  /**
   * 선택된 대상으로부터 실제 타겟 노드 목록 추출
   * 
   * @param target - 선택된 대상 문자열 (형식: "node-{id}" 또는 "group-{id}")
   * @returns 타겟 노드 배열
   */
  const getTargetNodes = useCallback((target: string): Node[] => {
    if (!target) return [];

    const [type, idStr] = target.split('-');
    const targetId = parseInt(idStr);

    if (type === 'group') {
      const group = nodeGroups.find(g => g.id === targetId);
      if (group) {
        return nodes.filter(n => group.nodeIds.includes(n.id));
      }
    } else if (type === 'node') {
      const node = nodes.find(n => n.id === targetId);
      if (node) return [node];
    }

    return [];
  }, [nodes, nodeGroups]);

  /**
   * API 선택 시 해당 API의 파라미터 로드
   */
  useEffect(() => {
    if (!selectedApiId) {
      setSelectedApiParameters([]);
      setDynamicParams({});
      return;
    }

    async function fetchParameters() {
      setIsParameterLoading(true);
      try {
        const response = await fetch(`/api/apis/${selectedApiId}/parameters`);

        if (!response.ok) {
          throw new Error(`파라미터 로드 실패: ${response.status}`);
        }

        const data = await response.json();
        setSelectedApiParameters(data.data || []);
        
        // 파라미터 변경 시 기존 입력값 초기화
        setDynamicParams({});
      } catch (e) {
        console.error(`Error loading parameters for API ${selectedApiId}:`, e);
        setSelectedApiParameters([]);
        setDynamicParams({});
      } finally {
        setIsParameterLoading(false);
      }
    }

    fetchParameters();
  }, [selectedApiId]);

  /**
   * 동적 파라미터 값 변경 핸들러
   * 
   * @param paramName - 파라미터 이름
   * @param value - 파라미터 값
   */
  const handleDynamicParamChange = useCallback((paramName: string, value: string) => {
    setDynamicParams(prev => ({
      ...prev,
      [paramName]: value,
    }));
  }, []);

  /**
   * API 변경 핸들러
   * API가 변경되면 실행 결과와 파라미터를 초기화합니다.
   */
  const handleApiChange = useCallback((apiId: string) => {
    setExecutionResult([]);
    setSelectedApiId(apiId);
    setDynamicParams({});
  }, []);

  /**
   * 빈 값을 제외한 파라미터만 추출
   * 
   * @param params - 원본 파라미터 객체
   * @returns 빈 값이 제거된 파라미터 객체
   */
  const getCleanedParams = useCallback((params: Record<string, string>): Record<string, string> => {
    const cleaned: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim() !== '') {
        cleaned[key] = value.trim();
      }
    });
    return cleaned;
  }, []);

  /**
   * API 실행 함수
   * 
   * 선택된 노드 또는 노드 그룹의 모든 노드에 대해 API를 실행하고 결과를 수집합니다.
   */
  const executeApi = useCallback(async () => {
    // 유효성 검증
    if (!selectedApiId || !selectedTarget) {
      alert('실행할 대상과 API를 모두 선택해주세요.');
      return;
    }

    setExecutionStatus('running');
    setExecutionResult([]);
    setError(null);

    const targetNodes = getTargetNodes(selectedTarget);

    if (targetNodes.length === 0) {
      setExecutionStatus('error');
      setError('선택된 대상 노드가 없습니다.');
      setExecutionResult([{
        nodeId: 0,
        nodeName: '시스템',
        success: false,
        responseTimeMs: 0,
        statusCode: 0,
        data: { error: '선택된 대상 노드가 없습니다.' },
      }]);
      return;
    }

    const cleanedParams = getCleanedParams(dynamicParams);
    const executionEndpoint = `/api/apis/${selectedApiId}/execute`;

    let hasError = false;
    const results: ApiExecutionResult[] = [];

    // 각 노드에 대해 API 실행
    for (const targetNode of targetNodes) {
      console.log(`Executing API ID ${selectedApiId} on Node ID ${targetNode.id} with params:`, cleanedParams);
      
      try {
        const response = await fetch(executionEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetNode: targetNode,
            parsedParams: cleanedParams,
          }),
        });

        const resultData = await response.json();

        if (!response.ok || !resultData.success) {
          const errorMessage = `노드 ${targetNode.name} (${targetNode.id}) API 호출 실패: HTTP ${response.status}. ${resultData.data?.error || resultData.data?.message || '알 수 없는 오류'}`;

          results.push({
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            success: false,
            responseTimeMs: resultData.data?.results?.responseTimeMs || 0,
            statusCode: response.status,
            data: { error: errorMessage, details: resultData.data },
          });
          hasError = true;
        } else {
          console.log(`Node ID: ${targetNode.id} API executed successfully:`, resultData);
          results.push({
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            success: true,
            responseTimeMs: resultData.data?.results?.responseTimeMs || 0,
            statusCode: resultData.statusCode || response.status,
            data: resultData.data,
          });
        }
      } catch (e) {
        console.error(`노드 ID: ${targetNode.id} API 실행 중 오류 발생:`, e);
        hasError = true;

        results.push({
          nodeId: targetNode.id,
          nodeName: targetNode.name,
          success: false,
          responseTimeMs: 0,
          statusCode: 0,
          data: { error: (e as Error).message },
        });
      }
    }

    setExecutionStatus(hasError ? 'error' : 'success');
    setExecutionResult(results);
  }, [selectedApiId, selectedTarget, dynamicParams, getTargetNodes, getCleanedParams]);

  return {
    // 데이터
    nodes,
    nodeGroups,
    apis,
    selectedApiParameters,
    executionResult,

    // 선택 상태
    selectedTarget,
    setSelectedTarget,
    selectedApiId,
    setSelectedApiId: handleApiChange,

    // 파라미터
    dynamicParams,
    handleDynamicParamChange,

    // 실행
    executeApi,
    executionStatus,

    // 로딩
    isLoading,
    isParameterLoading,
    error,
  };
}
