'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2 } from 'lucide-react';
// types.ts 파일에서 해당 인터페이스를 가져온다고 가정
import { Node, NodeGroup, Api, ApiParameter, ApiExecutionResult } from '@/types'; 

/**
 * 선택된 대상 ID 문자열로부터 실제 타겟 노드 목록을 반환하는 헬퍼 함수
 */
const getTargetNodes = (selectedTarget: string, nodes: Node[], nodeGroups: NodeGroup[]): Node[] => {
    if (!selectedTarget) return [];
    
    const [type, idStr] = selectedTarget.split('-');
    const targetId = parseInt(idStr);

    if (type === 'group') {
        const group = nodeGroups.find(g => g.nodeGroupId === targetId);
        // NOTE: NodeGroup 타입에 nodeIds가 있다고 가정
        if (group && (group as any).nodeIds) {
            return nodes.filter(n => (group as any).nodeIds.includes(n.nodeId)); 
        }
    } else if (type === 'node') {
        const node = nodes.find(n => n.nodeId === targetId);
        if (node) return [node];
    }
    return [];
};

export function ApiExecutionPanel() {
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([]);
    const [apis, setApis] = useState<Api[]>([]);
    
    // ✅ [변경] 전체 파라미터 상태 제거 (apiParameters)
    
    // ✅ [추가] 선택된 API의 파라미터 상세 정보를 저장하는 상태
    const [selectedApiParameters, setSelectedApiParameters] = useState<ApiParameter[]>([]);
    const [isParameterLoading, setIsParameterLoading] = useState(false); // 파라미터 로딩 상태

    const [executionResult, setExecutionResult] = useState<ApiExecutionResult[]>([]);
    const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [dynamicParams, setDynamicParams] = useState<Record<string, string>>({});
    const [selectedApiId, setSelectedApiId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(true); // 초기 데이터 로딩 상태
    const [error, setError] = useState<string | null>(null);

    // 선택된 API 객체를 useMemo로 캐싱 (유지)
    const selectedApi = useMemo(() => {
        return apis.find(api => api.apiId.toString() === selectedApiId);
    }, [apis, selectedApiId]);

    // ✅ [변경] 1. 초기 데이터 로드: api-parameters 호출 제거
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);
            try {
                // api-parameters 호출 제거
                const [nodesResponse, groupsResponse, apisResponse] = await Promise.all([
                    fetch('/api/nodes'),
                    fetch('/api/node-groups'),
                    fetch('/api/apis'),
                ]);

                const nodesData = await nodesResponse.json();
                const groupsData = await groupsResponse.json();
                const apisData = await apisResponse.json();
                
                setNodes(Array.isArray(nodesData.data) ? nodesData.data : []);
                setNodeGroups(Array.isArray(groupsData.data) ? groupsData.data : []);
                setApis(Array.isArray(apisData.data) ? apisData.data : []);
            } catch (e) {
                console.error("Failed to fetch data:", e);
                setError("데이터 로드에 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // ✅ [추가] 2. API 선택 시 파라미터 상세 정보 로드 (GET /api/apis/[id]/parameters 사용)
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

    // 동적 파라미터 변경 핸들러 (유지)
    const handleDynamicParamChange = useCallback((paramName: string, value: string) => {
        setDynamicParams((prev) => ({
            ...prev,
            [paramName]: value,
        }));
    }, []);

    // API 변경 핸들러 (유지)
    const handleApiChange = useCallback((value: string) => {
        setExecutionResult([]);
        setSelectedApiId(value);
        setDynamicParams({});
    }, []);

    // 빈 값을 제외한 최종 파라미터를 계산하는 헬퍼 함수 (유지)
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
     * API 실행 로직 (유지)
     */
    const executeApi = async () => {
        if (!selectedApiId || !selectedTarget) {
            alert('실행할 대상과 API를 모두 선택해주세요.');
            return;
        }

        setExecutionStatus('running');
        setExecutionResult([]);

        const targetNodes = getTargetNodes(selectedTarget, nodes, nodeGroups);

        if (targetNodes.length === 0) {
            setExecutionStatus('error');
            setExecutionResult([{
                nodeId: 0,
                nodeName: "시스템",
                success: false,
                responseTimeMs: 0,
                statusCode: 0,
                data: { error: "선택된 대상 노드가 없습니다." },
            }]);
            return;
        }

        const cleanedParams = getCleanedParams(dynamicParams);
        const EXECUTION_ENDPOINT = `/api/apis/${selectedApiId}/execute`;

        let hasError = false;
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
                        data: { error: errorMessage, details: resultData.data },
                    });
                    hasError = true;
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
                console.error(`노드 ID: ${targetNode.nodeId} API 실행 중 오류 발생:`, e);
                hasError = true;
                
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

        setExecutionStatus(hasError ? 'error' : 'success');
        setExecutionResult(tmpExecutionResult);
    };
    
    // 로딩 및 오류 화면 (유지)
    if (isLoading) {
        return (
            <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                데이터를 로드하는 중입니다...
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">오류: {error}</div>;
    }

    const cleanedParamsDebug = getCleanedParams(dynamicParams);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>API 실행 패널 🚀</CardTitle>
                    <CardDescription>
                        노드 또는 노드 그룹을 선택하여 API를 실행하고 결과를 확인합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 대상 선택 */}
                        <div>
                            <Label htmlFor="target-select">대상 선택</Label>
                            <Select 
                                value={selectedTarget} 
                                onValueChange={setSelectedTarget}
                            >
                                <SelectTrigger id="target-select">
                                    <SelectValue placeholder="노드/그룹 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">그룹</h3>
                                    {nodeGroups.map((group) => (
                                        <SelectItem key={`group-${group.nodeGroupId}`} value={`group-${group.nodeGroupId}`}>
                                            그룹: {group.nodeGroupName} ({group.nodeIds?.length || 0}개 노드)
                                        </SelectItem>
                                    ))}
                                    <h3 className="px-2 py-1 text-sm font-semibold text-gray-500">노드</h3>
                                    {nodes.map((node) => (
                                        <SelectItem key={`node-${node.nodeId}`} value={`node-${node.nodeId}`}>
                                            노드: {node.nodeName}{node.nodeDesc ? ` - ${node.nodeDesc}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* API 선택 */}
                        <div>
                            <Label htmlFor="api-select">API 선택</Label>
                            <Select value={selectedApiId} onValueChange={handleApiChange}>
                                <SelectTrigger id="api-select">
                                    <SelectValue placeholder="API 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {apis.map((api) => (
                                        <SelectItem key={api.apiId} value={api.apiId.toString()}>
                                            {api.apiName} ({api.method} {api.uri})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 파라미터 입력 */}
                    <div>
                        <Label>API 파라미터 입력</Label>
                        
                        {/* ✅ [변경] 파라미터 로딩 상태에 따른 UI 분기 */}
                        {isParameterLoading ? (
                            <div className="text-sm text-gray-500 mt-2 flex items-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                파라미터 정보 로드 중...
                            </div>
                        ) : selectedApiParameters.length > 0 ? (
                            <div className="space-y-3 mt-1">
                                {selectedApiParameters.map((param) => (
                                    <div key={param.apiParameterId}>
                                        <Label 
                                            htmlFor={`param-${param.apiParameterName}`} 
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <span>
                                                {param.apiParameterName}{' '}
                                                <span className="text-gray-500 font-normal">
                                                    ({param.apiParameterType})
                                                </span>
                                                {param.apiParameterRequired && (
                                                    <span className="text-red-500 ml-1 font-bold">*</span>
                                                )}
                                            </span>
                                            {param.apiParameterDesc && (
                                                <span className="text-xs text-gray-400">
                                                    {param.apiParameterDesc}
                                                </span>
                                            )}
                                        </Label>
                                        <Input
                                            id={`param-${param.apiParameterName}`}
                                            placeholder={`값 입력${param.apiParameterRequired ? ' (필수)' : ''}`}
                                            value={dynamicParams[param.apiParameterName] || ''}
                                            onChange={(e) => handleDynamicParamChange(param.apiParameterName, e.target.value)}
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
                        
                        {/* 디버깅: 최종 파라미터 */}
                        {selectedApi && (
                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                                최종 전달 파라미터: 
                                <br />
                                {JSON.stringify(cleanedParamsDebug)}
                            </p>
                        )}
                    </div>

                    {/* 실행 버튼 */}
                    <Button 
                        className="w-full"
                        onClick={executeApi} 
                        // ✅ [변경] 파라미터 로딩 중에는 버튼 비활성화
                        disabled={executionStatus === 'running' || !selectedApiId || !selectedTarget || isParameterLoading}
                    >
                        {executionStatus === 'running' ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                API 실행 중...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                API 실행
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* 실행 결과 패널 */}
            {executionResult.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>실행 결과 📝</CardTitle>
                        <CardDescription>
                            총 {executionResult.length}개 노드에 대한 실행 결과입니다. 
                            (성공: {executionResult.filter(r => r.success).length}개)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {executionResult.map((result, idx) => {
                                const nodeDetail = nodes.find(n => n.nodeId === result.nodeId);
                                
                                return (
                                    <Card 
                                        key={idx} 
                                        className="border-l-4 transition-shadow hover:shadow-md" 
                                        style={{ 
                                            borderLeftColor: result.success ? '#10b981' : '#ef4444' 
                                        }}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle className="text-base font-semibold">
                                                        {result.nodeName}
                                                    </CardTitle>
                                                    {nodeDetail && (
                                                        <>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {nodeDetail.host}:{nodeDetail.port}
                                                            </p>
                                                            {nodeDetail.nodeDesc && (
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {nodeDetail.nodeDesc}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Badge variant={result.success ? 'default' : 'destructive'}>
                                                        {result.success ? 'SUCCESS' : 'ERROR'}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {result.statusCode}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {result.responseTimeMs} ms
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                                                {
                                                    JSON.stringify(result.data, null, 2)
                                                }
                                            </pre>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}