'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Node, NodeGroup, SyntheticTest, SyntheticTestHistory, Api, ApiParameter, Tag } from '@/types';

interface Alert {
  testId: number;
  testName: string;
  nodeId: number;
  nodeName: string;
  apiId: number;
  apiName: string;
  apiUri: string;
  apiMethod: string;
  parameterValues: Record<number, string>;
  responseTime: number;
  threshold: number;
  timestamp: string;
  statusCode: number;
}

export function AlertMonitoringPanel() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([]);
  const [tests, setTests] = useState<SyntheticTest[]>([]);
  const [alertData, setAlertData] = useState<Alert[]>([]); // useMemo에서 state로 변경
  const [apis, setApis] = useState<Api[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [apiParameters, setApiParameters] = useState<Record<number, ApiParameter[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 선택된 알럿과 다이얼로그 상태
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 데이터 fetch 함수를 별도로 분리
  const fetchData = useCallback(async () => {
    try {
      // 먼저 기본 데이터 로드
      const [nodesResponse, groupsResponse, testsResponse, apisResponse, tagResponse] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/node-groups'),
        fetch('/api/synthetic-tests'),
        fetch('/api/apis'),
        fetch('/api/tags'),
      ]);

      const nodesData = await nodesResponse.json();
      const groupsData = await groupsResponse.json();
      const testsData = await testsResponse.json();
      const apisData = await apisResponse.json();
      const tagData = await tagResponse.json();

      setNodes(nodesData.data || []);
      setNodeGroups(groupsData.data || []);
      const fetchedTests = testsData.data || [];
      setTests(fetchedTests);
      const fetchedApis = apisData.data || [];
      setApis(fetchedApis);
      const fetchedTags = tagData.data || [];
      setTags(fetchedTags.map((tag: any) => tag.tagName).sort() ? fetchedTags : []);
        
      // API 파라미터 정보 로드
      const parameterPromises = fetchedApis.map((api: Api) =>
        fetch(`/api/apis/${api.apiId}/parameters`)
          .then(res => res.json())
          .then(data => ({ apiId: api.apiId, parameters: data.data || [] }))
      );
      
      const parameterResults = await Promise.all(parameterPromises);
      const parametersMap: Record<number, ApiParameter[]> = {};
      parameterResults.forEach(({ apiId, parameters }) => {
        parametersMap[apiId] = parameters;
      });
      setApiParameters(parametersMap);
      
      setError(null);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError("데이터 로드에 실패했습니다.");
    }
  }, []);

  // 알럿 데이터 조회 함수 - 의존성 배열에 tests를 제거하고 useRef로 참조
  const testsRef = React.useRef<SyntheticTest[]>([]);
  
  // tests가 변경될 때마다 ref 업데이트
  useEffect(() => {
    testsRef.current = tests;
  }, [tests]);

  const fetchAlerts = useCallback(async () => {
    try {
      // 시간 범위 파라미터로 전달
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/alerts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // 클라이언트 사이드에서 태그, 노드, 그룹 필터링
        let filteredAlerts = data.data || [];
        const currentTests = testsRef.current; // ref에서 가져오기
        
        // 태그 필터
        if (selectedTags.length > 0) {
          // 테스트 정보를 조회하여 태그 필터링
          filteredAlerts = filteredAlerts.filter((alert: any) => {
            const test = currentTests.find(t => t.syntheticTestId === alert.testId);
            if (!test || !test.tags) return false;
            
            let testTags: string[] = [];
            if (typeof test.tags === 'string') {
              const trimmed = test.tags.trim();
              if (!trimmed) return false;
              
              if (trimmed.startsWith('[')) {
                try {
                  testTags = JSON.parse(trimmed);
                } catch (e) {
                  testTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
                }
              } else {
                testTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
              }
            } else if (Array.isArray(test.tags)) {
              testTags = test.tags;
            }
            
            return testTags.some(tag => selectedTags.includes(tag));
          });
        }
        
        // 노드 필터
        if (selectedNodes.length > 0) {
          filteredAlerts = filteredAlerts.filter((alert: any) => 
            selectedNodes.includes(alert.nodeId)
          );
        }
        
        // 그룹 필터
        if (selectedGroups.length > 0) {
          filteredAlerts = filteredAlerts.filter((alert: any) => {
            const test = currentTests.find(t => t.syntheticTestId === alert.testId);
            if (!test) return false;
            return test.targetType === 'group' && selectedGroups.includes(test.targetId);
          });
        }
        
        setAlertData(filteredAlerts);
      } else {
        console.error('Failed to fetch alerts:', data.error);
        setAlertData([]);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
      setAlertData([]);
    }
  }, [timeRange, selectedTags, selectedNodes, selectedGroups]); // tests 제거

  // 초기 데이터 로드 - 한 번만 실행
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    }
    initialLoad();
  }, []); // 빈 배열

  // tests가 로드된 후 최초 알럿 조회
  useEffect(() => {
    if (tests.length > 0 && !isLoading) {
      fetchAlerts();
    }
  }, [tests.length, isLoading]); // tests.length만 의존

  // 필터 변경 시 알럿 데이터 재조회
  useEffect(() => {
    if (tests.length > 0) {
      fetchAlerts();
    }
  }, [timeRange, selectedTags, selectedNodes, selectedGroups, fetchAlerts]); // fetchAlerts는 포함 (useCallback으로 안정화됨)

  // 5분마다 자동 갱신
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (tests.length > 0) {
        fetchAlerts();
      }
    }, 300000); // 5분

    return () => clearInterval(intervalId);
  }, [fetchAlerts]); // fetchAlerts는 useCallback으로 안정화됨

  const summary = useMemo(() => {
    const affectedTests = new Set(alertData.map((a) => a.testId)).size;
    const affectedNodes = new Set(alertData.map((a) => a.nodeId)).size;

    return {
      total: alertData.length,
      affectedTests,
      affectedNodes,
    };
  }, [alertData]);

  // 알럿 클릭 핸들러
  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
  };

  // 선택된 알럿의 테스트 정보 가져오기
  const selectedTestInfo = useMemo(() => {
    if (!selectedAlert) return null;
    return tests.find(t => t.syntheticTestId === selectedAlert.testId);
  }, [selectedAlert, tests]);

  // 선택된 테스트의 최근 히스토리 가져오기
  const [selectedTestHistory, setSelectedTestHistory] = useState<SyntheticTestHistory[]>([]);
  
  useEffect(() => {
    if (selectedAlert && isDialogOpen) {
      // 선택된 알럿의 테스트 히스토리 조회
      fetch(`/api/synthetic-tests/${selectedAlert.testId}/history?limit=10`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setSelectedTestHistory(data.data);
          } else {
            setSelectedTestHistory([]);
          }
        })
        .catch(error => {
          console.error('Failed to fetch test history:', error);
          setSelectedTestHistory([]);
        });
    }
  }, [selectedAlert, isDialogOpen]);

  // 파라미터 이름 가져오기 헬퍼 함수
  const getParameterName = (apiId: number, parameterId: number): string => {
    const params = apiParameters[apiId] || [];
    const param = params.find(p => p.apiParameterId === parameterId);
    return param?.apiParameterName || `Param ${parameterId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">오류: {error}</div>;
  }

  return (
      <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{summary.total}</div>
              <div className="text-sm text-gray-600 mt-1">총 알럿</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.affectedTests}</div>
              <div className="text-sm text-gray-600 mt-1">영향받은 테스트</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{summary.affectedNodes}</div>
              <div className="text-sm text-gray-600 mt-1">영향받은 노드</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터</CardTitle>
          <CardDescription>시간 범위, 태그, 노드, 노드 그룹으로 알럿을 필터링합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 시간 범위 필터 */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">시간 범위</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">최근 1시간</SelectItem>
                <SelectItem value="6h">최근 6시간</SelectItem>
                <SelectItem value="24h">최근 24시간</SelectItem>
                <SelectItem value="7d">최근 7일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-semibold mb-3 block">조건 필터 (각 카테고리 내 OR, 카테고리 간 AND)</Label>
            <div className="grid grid-cols-3 gap-6">
              {/* 태그 필터 */}
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">태그</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                  {tags.length === 0 ? (
                    <div className="text-sm text-gray-500">태그 없음</div>
                  ) : (
                    tags.map((tag) => (
                      <div key={tag.tagName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`alert-tag-${tag.tagName}`}
                          checked={selectedTags.includes(tag.tagName)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTags([...selectedTags, tag.tagName]);
                            } else {
                              setSelectedTags(selectedTags.filter(t => t !== tag.tagName));
                            }
                          }}
                        />
                        <label
                          htmlFor={`alert-tag-${tag.tagName}`}
                          className="text-sm cursor-pointer"
                        >
                          {tag.tagName}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 노드 필터 */}
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">노드</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                  {nodes.length === 0 ? (
                    <div className="text-sm text-gray-500">노드 없음</div>
                  ) : (
                    nodes.map((node) => (
                      <div key={node.nodeId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`alert-node-${node.nodeId}`}
                          checked={selectedNodes.includes(node.nodeId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedNodes([...selectedNodes, node.nodeId]);
                            } else {
                              setSelectedNodes(selectedNodes.filter(n => n !== node.nodeId));
                            }
                          }}
                        />
                        <label
                          htmlFor={`alert-node-${node.nodeId}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs font-mono">
                              ID: {node.nodeId}
                            </Badge>
                            <span>{node.nodeName}</span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 노드 그룹 필터 */}
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">노드 그룹</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                  {nodeGroups.length === 0 ? (
                    <div className="text-sm text-gray-500">그룹 없음</div>
                  ) : (
                    nodeGroups.map((group) => (
                      <div key={group.nodeGroupId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`alert-group-${group.nodeGroupId}`}
                          checked={selectedGroups.includes(group.nodeGroupId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.nodeGroupId]);
                            } else {
                              setSelectedGroups(selectedGroups.filter(g => g !== group.nodeGroupId));
                            }
                          }}
                        />
                        <label
                          htmlFor={`alert-group-${group.nodeGroupId}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs font-mono">
                              ID: {group.nodeGroupId}
                            </Badge>
                            <span>{group.nodeGroupName}</span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 필터 초기화 및 선택 개수 표시 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              선택됨: 태그 {selectedTags.length}개, 노드 {selectedNodes.length}개, 그룹 {selectedGroups.length}개
            </div>
            {(selectedTags.length > 0 || selectedNodes.length > 0 || selectedGroups.length > 0) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedNodes([]);
                  setSelectedGroups([]);
                }}
              >
                조건 필터 초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알럿 목록</CardTitle>
          <CardDescription>최근 발생한 알럿들 (클릭하여 상세 정보 확인)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">알럿이 없습니다</div>
            ) : (
              alertData.slice(0, 20).map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAlertClick(alert)}
                  className="p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition-colors border-orange-200 bg-orange-50/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{alert.testName}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <Badge variant="outline" className="text-xs">
                            {alert.statusCode}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">노드:</span>
                            <Badge variant="secondary" className="text-xs font-mono">ID: {alert.nodeId}</Badge>
                            <span className="font-medium">{alert.nodeName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">API:</span>
                            <Badge variant="secondary" className="text-xs font-mono">ID: {alert.apiId}</Badge>
                            <span className="font-medium">{alert.apiName}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5">
                            <span className="text-gray-500">엔드포인트:</span>
                            <Badge variant="outline" className="text-xs">{alert.apiMethod}</Badge>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{alert.apiUri}</code>
                          </div>
                          {Object.keys(alert.parameterValues).length > 0 && (
                            <div className="col-span-2 flex items-start gap-1.5 mt-1">
                              <span className="text-gray-500">파라미터:</span>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(alert.parameterValues).map(([paramId, value]) => (
                                  <Badge key={paramId} variant="secondary" className="text-xs">
                                    {getParameterName(alert.apiId, parseInt(paramId))} = {value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {new Date(alert.timestamp).toLocaleString('ko-KR')}
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        {alert.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-500">
                        기준: {alert.threshold}ms
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 알럿 상세 정보 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              알럿 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedAlert && `${selectedAlert.testName} 테스트의 상세 정보입니다`}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && selectedTestInfo && (
            <div className="space-y-6">
              {/* 알럿 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">알럿 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">발생 시각</div>
                      <div className="font-medium">{new Date(selectedAlert.timestamp).toLocaleString('ko-KR')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">상태 코드</div>
                      <Badge variant="outline">{selectedAlert.statusCode}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">응답 시간</div>
                      <div className="font-medium text-red-600">{selectedAlert.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">알럿 기준</div>
                      <div className="font-medium">{selectedAlert.threshold}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">대상 노드</div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs font-mono">ID: {selectedAlert.nodeId}</Badge>
                        <span className="font-medium">{selectedAlert.nodeName}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">초과율</div>
                      <div className="font-medium">
                        {((selectedAlert.responseTime / selectedAlert.threshold - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">API 이름</div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs font-mono">ID: {selectedAlert.apiId}</Badge>
                        <span className="font-medium">{selectedAlert.apiName}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">메서드</div>
                      <Badge variant="outline">{selectedAlert.apiMethod}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">엔드포인트</div>
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                      {selectedAlert.apiUri}
                    </code>
                  </div>
                  {Object.keys(selectedAlert.parameterValues).length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">파라미터 값</div>
                      <div className="space-y-2">
                        {Object.entries(selectedAlert.parameterValues).map(([paramId, value]) => (
                          <div key={paramId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Badge variant="secondary" className="text-xs">
                              {getParameterName(selectedAlert.apiId, parseInt(paramId))}
                            </Badge>
                            <span className="text-sm">=</span>
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                              {value}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 테스트 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">테스트 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">테스트 이름</div>
                      <div className="font-medium">{selectedTestInfo.syntheticTestName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">대상 타입</div>
                      <Badge variant="outline">
                        {selectedTestInfo.targetType === 'group' ? '그룹' : '노드'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">실행 주기</div>
                      <div className="font-medium">{selectedTestInfo.intervalSeconds}초</div>
                    </div>
                  </div>
                  {selectedTestInfo.tags && (() => {
                    let testTags: string[] = [];
                    
                    if (typeof selectedTestInfo.tags === 'string') {
                      const trimmed = selectedTestInfo.tags.trim();
                      if (trimmed) {
                        // JSON 배열인지 확인
                        if (trimmed.startsWith('[')) {
                          try {
                            testTags = JSON.parse(trimmed);
                          } catch (e) {
                            // JSON 파싱 실패 시 쉼표로 분리
                            testTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
                          }
                        } else {
                          // 쉼표로 구분된 문자열
                          testTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
                        }
                      }
                    } else if (Array.isArray(selectedTestInfo.tags)) {
                      testTags = selectedTestInfo.tags;
                    }
                    
                    return testTags.length > 0 ? (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">태그</div>
                        <div className="flex flex-wrap gap-1">
                          {testTags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>

              {/* 최근 실행 히스토리 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">최근 실행 히스토리 (최대 10개)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedTestHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">히스토리가 없습니다</div>
                    ) : (
                      selectedTestHistory.map((history) => (
                        <div
                          key={history.syntheticTestHistoryId}
                          className={`flex items-center justify-between p-3 border rounded ${
                            history.responseTimeMs > selectedTestInfo.alertThresholdMs
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={history.success ? 'default' : 'destructive'}>
                              {history.statusCode}
                            </Badge>
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(history.executedAt).toLocaleString('ko-KR')}
                              </div>
                              <div className="text-xs text-gray-500">
                                노드 ID: {history.nodeId}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${
                              history.responseTimeMs > selectedTestInfo.alertThresholdMs
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}>
                              {history.responseTimeMs}ms
                            </div>
                            {history.responseTimeMs > selectedTestInfo.alertThresholdMs && (
                              <div className="text-xs text-red-500">기준 초과</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}