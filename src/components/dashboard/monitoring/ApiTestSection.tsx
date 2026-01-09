'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TestTube, Loader2 } from 'lucide-react';
import { Node, NodeGroup, Api, ApiParameter, ApiExecutionResult } from '@/types';

interface ApiTestSectionProps {
  selectedApiId: string;
  targetType: 'node' | 'group';
  targetId: string;
  apis: Api[];
  nodes: Node[];
  nodeGroups: NodeGroup[];
  // ✅ [추가] 파라미터 값 관리
  apiParameterValues?: Record<number, string>;
  onParameterValuesChange?: (values: Record<number, string>) => void;
}

/**
 * 선택된 대상으로부터 실제 타겟 노드 목록을 반환하는 헬퍼 함수
 */
const getTargetNodesFromTestConfig = (
  targetType: 'node' | 'group',
  targetId: string,
  nodes: Node[],
  nodeGroups: NodeGroup[]
): Node[] => {
  if (!targetId) return [];
  
  const id = parseInt(targetId);
  
  if (targetType === 'group') {
    const group = nodeGroups.find(g => g.nodeGroupId === id);
    if (group) {
      return nodes.filter(n => group.nodeIds.includes(n.nodeId));
    }
  } else {
    const node = nodes.find(n => n.nodeId === id);
    if (node) return [node];
  }
  return [];
};

export function ApiTestSection({ 
  selectedApiId, 
  targetType, 
  targetId, 
  apis, 
  nodes, 
  nodeGroups,
  apiParameterValues = {}, // ✅ [추가] 기본값 빈 객체
  onParameterValuesChange // ✅ [추가]
}: ApiTestSectionProps) {
  // ✅ [제거] const [apiParams, setApiParams] = useState<Record<string, string>>({});
  const [testExecutionResult, setTestExecutionResult] = useState<ApiExecutionResult[]>([]);
  const [isTestExecuting, setIsTestExecuting] = useState(false);
  
  // ✅ [추가] 선택된 API의 파라미터 상세 정보를 저장하는 상태
  const [selectedApiParameters, setSelectedApiParameters] = useState<ApiParameter[]>([]);
  const [isParameterLoading, setIsParameterLoading] = useState(false); // 파라미터 로딩 상태

  // 선택된 API 찾기
  const selectedApi = useMemo(() => {
    return apis.find(api => api.apiId.toString() === selectedApiId);
  }, [apis, selectedApiId]);

  // ✅ [추가] API 선택 시 파라미터 상세 정보 로드 (GET /api/apis/[id]/parameters 사용)
  useEffect(() => {
    if (!selectedApiId) {
      setSelectedApiParameters([]);
      return;
    }

    async function fetchParameters() {
      setIsParameterLoading(true);
      try {
        // API 선택 시 해당 API의 파라미터만 동적으로 로드
        const response = await fetch(`/api/apis/${selectedApiId}/parameters`);
        
        if (!response.ok) {
          throw new Error(`파라미터 로드 실패: ${response.status}`);
        }
        
        const data = await response.json();
        setSelectedApiParameters(data.data || []);

      } catch (e) {
        console.error(`Error loading parameters for API ${selectedApiId}:`, e);
        setSelectedApiParameters([]); 
      } finally {
        setIsParameterLoading(false);
      }
    }

    fetchParameters();

  }, [selectedApiId]); 

  // API 변경 시 결과 초기화
  useEffect(() => {
    setTestExecutionResult([]);
  }, [selectedApiId]);

  // ✅ [수정] 파라미터 변경 핸들러 - 이제 parameterId를 사용
  const handleParamChange = useCallback((parameterId: number, value: string) => {
    if (onParameterValuesChange) {
      const newValues = {
        ...apiParameterValues,
        [parameterId]: value
      };
      onParameterValuesChange(newValues);
    }
  }, [apiParameterValues, onParameterValuesChange]);

  // ✅ [수정] 빈 값을 제외한 최종 파라미터를 계산하는 헬퍼 함수
  // parameterId를 paramName으로 변환하여 반환
  const getCleanedParams = useCallback((paramValues: Record<number, string>): Record<string, string> => {
    const cleaned: Record<string, string> = {};
    
    Object.entries(paramValues).forEach(([paramIdStr, value]) => {
      if (value && value.trim() !== '') {
        const paramId = parseInt(paramIdStr);
        const param = selectedApiParameters.find(p => p.apiParameterId === paramId);
        if (param) {
          cleaned[param.apiParameterName] = value.trim();
        }
      }
    });
    
    return cleaned;
  }, [selectedApiParameters]);

  // API 테스트 실행
  const handleTestApi = async () => {
    if (!selectedApiId || !targetId) {
      alert('API와 대상을 선택해주세요.');
      return;
    }

    setIsTestExecuting(true);
    setTestExecutionResult([]);

    const targetNodes = getTargetNodesFromTestConfig(
      targetType,
      targetId,
      nodes,
      nodeGroups
    );

    if (targetNodes.length === 0) {
      setTestExecutionResult([{
        nodeId: 0,
        nodeName: "시스템",
        success: false,
        responseTimeMs: 0,
        statusCode: 0,
        data: { error: "선택된 대상 노드가 없습니다." },
      }]);
      setIsTestExecuting(false);
      return;
    }

    const cleanedParams = getCleanedParams(apiParameterValues);
    const EXECUTION_ENDPOINT = `/api/apis/${selectedApiId}/execute`;
    const tmpExecutionResult: ApiExecutionResult[] = [];

    for (const targetNode of targetNodes) {
      console.log(`Executing API ID ${selectedApiId} on Node ID ${targetNode.nodeId} with params:`, cleanedParams);
      try {
        const response = await fetch(EXECUTION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            targetNode: targetNode, 
            parsedParams: cleanedParams 
          }),
        });

        const resultData = await response.json();
        
        if (!response.ok || !resultData.success) {
          const errorMessage = `노드 ${targetNode.nodeName} (${targetNode.nodeId}) API 호출 실패: HTTP ${response.status}. ${resultData.data?.error || resultData.data?.message || '알 수 없는 오류'}`;
          
          tmpExecutionResult.push({
            nodeId: targetNode.nodeId,
            nodeName: targetNode.nodeName,
            success: false,
            responseTimeMs: resultData.data?.results?.responseTimeMs || 0,
            statusCode: response.status,
            data: { 
              error: errorMessage, 
              details: resultData.data 
            },
          });
        } else {
          console.log(`Node ID: ${targetNode.nodeId} API executed successfully:`, resultData);
          tmpExecutionResult.push({ 
            nodeId: targetNode.nodeId, 
            nodeName: targetNode.nodeName,
            success: true,
            responseTimeMs: resultData.data?.results?.responseTimeMs || 0,
            statusCode: resultData.statusCode || response.status,
            data: resultData.data,
          });
        }
      } catch (e) {
        console.error(`노드 ID: ${targetNode.nodeId} API 테스트 중 오류 발생:`, e);
        tmpExecutionResult.push({
          nodeId: targetNode.nodeId,
          nodeName: targetNode.nodeName,
          success: false,
          responseTimeMs: 0,
          statusCode: 0,
          data: { error: (e as Error).message }
        });
      }
    }

    setTestExecutionResult(tmpExecutionResult);
    setIsTestExecuting(false);
  };

  if (!selectedApiId) {
    return null;
  }

  const cleanedParamsDebug = getCleanedParams(apiParameterValues);

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TestTube className="w-4 h-4" />
          API 테스트
        </CardTitle>
        <CardDescription>
          테스트 생성 전에 선택한 API를 실행해볼 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API 파라미터 입력 */}
        <div>
          <Label>API 파라미터</Label>
          
          {/* ✅ [변경] 파라미터 로딩 상태에 따른 UI 분기 */}
          {isParameterLoading ? (
            <div className="text-sm text-gray-500 mt-2 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              파라미터 정보 로드 중...
            </div>
          ) : selectedApiParameters.length > 0 ? (
            <div className="space-y-3 mt-2">
              {selectedApiParameters.map((param) => (
                <div key={param.apiParameterId}>
                  <Label 
                    htmlFor={`test-param-${param.apiParameterId}`} 
                    className="flex justify-between items-center text-sm"
                  >
                    <span>
                      {param.apiParameterName}
                      <span className="text-gray-500 font-normal ml-1">
                        ({param.apiParameterType})
                      </span>
                      {param.apiParameterRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </span>
                    {param.apiParameterDesc && (
                      <span className="text-xs text-gray-400">{param.apiParameterDesc}</span>
                    )}
                  </Label>
                  <Input
                    id={`test-param-${param.apiParameterId}`}
                    placeholder={`값 입력${param.apiParameterRequired ? ' (필수)' : ''}`}
                    value={apiParameterValues[param.apiParameterId] || ''}
                    onChange={(e) => handleParamChange(param.apiParameterId, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              {selectedApi 
                ? '이 API는 정의된 파라미터가 없습니다.' 
                : 'API를 먼저 선택해주세요.'}
            </p>
          )}
          
          {/* 디버깅: 최종 전달 파라미터 */}
          {selectedApi && (
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
              최종 전달 파라미터: 
              <br/>
              {JSON.stringify(cleanedParamsDebug, null, 2)}
            </p>
          )}
        </div>

        {/* 테스트 실행 버튼 */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleTestApi}
          // ✅ [변경] 파라미터 로딩 중에는 버튼 비활성화
          disabled={isTestExecuting || !targetId || isParameterLoading}
        >
          {isTestExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              API 테스트 실행 중...
            </>
          ) : !targetId ? (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              대상을 먼저 선택해주세요
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              API 테스트 실행
            </>
          )}
        </Button>

        {/* 테스트 결과 표시 */}
        {testExecutionResult.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base">테스트 결과</Label>
              <span className="text-sm text-gray-600">
                총 {testExecutionResult.length}개 노드 
                (성공: {testExecutionResult.filter(r => r.success).length}개)
              </span>
            </div>

            <div className="space-y-3">
              {testExecutionResult.map((result, idx) => {
                // 해당 노드의 상세 정보 찾기
                const nodeDetail = nodes.find(n => n.nodeId === result.nodeId);
                
                return (
                  <Card 
                    key={idx}
                    className="border-l-4 transition-shadow hover:shadow-md"
                    style={{ borderLeftColor: result.success ? '#10b981' : '#ef4444' }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-sm font-semibold">{result.nodeName}</CardTitle>
                          {nodeDetail && (
                            <>
                              <p className="text-xs text-gray-500 mt-1">
                                {nodeDetail.host}:{nodeDetail.port}
                              </p>
                              {nodeDetail.nodeDesc && (
                                <p className="text-xs text-gray-600 mt-1">{nodeDetail.nodeDesc}</p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Badge variant={result.success ? 'default' : 'destructive'} className="text-xs">
                            {result.success ? 'SUCCESS' : 'ERROR'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.statusCode}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {result.responseTimeMs} ms
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}