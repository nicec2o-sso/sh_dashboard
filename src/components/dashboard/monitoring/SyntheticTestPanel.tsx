'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, ChevronDown, ChevronUp, Server, Layers, Edit, Trash2 } from 'lucide-react';
import { SyntheticTestResults } from '@/components/dashboard/monitoring/SyntheticTestResults'; 
import { ApiTestSection } from '@/components/dashboard/monitoring/ApiTestSection';
import { SyntheticTest, NodeGroup, Api, Node } from '@/types';
import { Badge } from '@/components/ui/badge';
import { validateSyntheticTestData } from '@/lib/clientValidation';

// ----------------------------------------------------------------------
// 🚀 SyntheticTestPanel Component
// ----------------------------------------------------------------------

export function SyntheticTestPanel() {
  const [subView, setSubView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  // ✅ [추가] 시간 범위 필터
  const [timeRange, setTimeRange] = useState<'all' | '1hour' | '6hours' | '24hours' | '7days' | '30days'>('all');
  
  // 데이터 로딩 및 작업 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API 호출을 통해 받아올 데이터 상태
  const [tests, setTests] = useState<SyntheticTest[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeGroups, setNodeGroups] = useState<NodeGroup[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // 각 테스트의 확장/축소 상태
  const [expandedTests, setExpandedTests] = useState<Record<number, boolean>>({});
  
  // 다이얼로그 상태
  const [selectedTarget, setSelectedTarget] = useState<{type: 'node' | 'group', data: Node | NodeGroup} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // 삭제 확인 다이얼로그 상태
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    testId: number | null;
    testName: string;
  }>({
    isOpen: false,
    testId: null,
    testName: '',
  });

  // 수정 중인 테스트 ID
  const [editingTestId, setEditingTestId] = useState<number | null>(null);

  const [newTest, setNewTest] = useState({
    syntheticTestName: '',
    targetType: 'node' as 'node' | 'group',
    targetId: '', 
    apiId: '', 
    tags: '', 
    intervalSeconds: 60,
    alertThresholdMs: 200,
    apiParameterValues: {} as Record<number, string>, // ✅ [추가]
  });

  // ------------------------------------
  // 1. 초기 데이터 로딩 (useEffect + 실제 fetch)
  // ------------------------------------
  const fetchData = useCallback(async () => {
    setError(null);

    const endpoints = {
        tests: '/api/synthetic-tests',
        nodes: '/api/nodes',
        nodeGroups: '/api/node-groups',
        apis: '/api/apis',
        tags: '/api/tags',
    };

    try {
        const results = await Promise.all(
            Object.values(endpoints).map(url => 
                fetch(url).then(res => {
                    if (!res.ok) {
                        throw new Error(`API 호출 실패: ${url} (${res.status})`);
                    }
                    return res.json();
                })
            )
        );

        console.log('results:', results);
        const loadedTests = results[0]?.data || [];
        // 각 테스트의 tags가 없으면 빈 배열로 초기화
        const sanitizedTests = (loadedTests as SyntheticTest[]).map(test => ({
          ...test,
          tags: test.tags || []
        }));
        setTests(sanitizedTests);

        setNodes(results[1].data as Node[]);
        setNodeGroups(results[2].data as NodeGroup[]);
        setApis(results[3].data as Api[]);
        
        // 태그 데이터 처리
        const loadedTags = results[4]?.data || [];
        const tagNames = loadedTags.map((tag: any) => tag.tagName).sort();
        setAllTags(tagNames);

    } catch (err) {
      console.error("데이터 로딩 중 오류 발생:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    }
    initialLoad();
  }, [fetchData]);

  // 5분마다 자동 갱신 (백그라운드)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000); // 10초

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ------------------------------------
  // 2. 파생 데이터 및 핸들러
  // ------------------------------------
  
  const filteredTests = useMemo(() => {
    let filtered = tests;
    
    // 태그 필터 (OR 조건 - 선택된 태그 중 하나라도 있으면 포함)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((test) => {
        // 1. 테스트 자체의 태그 확인
        // tags가 문자열인 경우 배열로 변환
        const testTags = typeof test.tags === 'string' 
          ? test.tags.split(',').map(t => t.trim()).filter(Boolean)
          : (Array.isArray(test.tags) ? test.tags : []);
        const testHasTag = testTags.some(tag => selectedTags.includes(tag));
        
        // 2. 테스트 대상 노드들의 태그 확인
        let targetNodeHasTag = false;
        
        if (test.targetType === 'node') {
          // 단일 노드 테스트: 해당 노드의 태그 확인
          const node = nodes.find(n => n.nodeId === test.targetId);
          if (node && node.tags) {
            const nodeTags = node.tags.split(',').map(t => t.trim());
            targetNodeHasTag = nodeTags.some(tag => selectedTags.includes(tag));
          }
        } else if (test.targetType === 'group') {
          // 그룹 테스트: 그룹에 속한 노드들의 태그 확인
          const group = nodeGroups.find(g => g.nodeGroupId === test.targetId);
          if (group) {
            targetNodeHasTag = group.nodeIds.some(nodeId => {
              const node = nodes.find(n => n.nodeId === nodeId);
              if (node && node.tags) {
                const nodeTags = node.tags.split(',').map(t => t.trim());
                return nodeTags.some(tag => selectedTags.includes(tag));
              }
              return false;
            });
          }
        }
        
        // 테스트 태그 또는 대상 노드 태그 중 하나라도 매칭되면 포함
        return testHasTag || targetNodeHasTag;
      });
    }
    
    // 노드 필터 (OR 조건 - 선택된 노드 중 하나라도 해당하면 포함)
    if (selectedNodes.length > 0) {
      filtered = filtered.filter((test) => {
        if (test.targetType === 'node') {
          return selectedNodes.includes(test.targetId);
        } else if (test.targetType === 'group') {
          const group = nodeGroups.find(g => g.nodeGroupId === test.targetId);
          return group ? group.nodeIds.some(nodeId => selectedNodes.includes(nodeId)) : false;
        }
        return false;
      });
    }
    
    // 노드 그룹 필터 (OR 조건 - 선택된 그룹 중 하나라도 해당하면 포함)
    if (selectedGroups.length > 0) {
      filtered = filtered.filter((test) => {
        return test.targetType === 'group' && selectedGroups.includes(test.targetId);
      });
    }
    
    return filtered;
  }, [selectedTags, selectedNodes, selectedGroups, tests, nodes, nodeGroups]);

  // 각 테스트에 대해 표시할 노드 목록 계산
  const testWithNodes = useMemo(() => {
    return filteredTests.map((test) => {
      if (test.targetType === 'group') {
        const group = nodeGroups.find(g => g.nodeGroupId === test.targetId);
        const targetNodes = group 
          ? group.nodeIds.map(nodeId => nodes.find(n => n.nodeId === nodeId)).filter(Boolean) as Node[]
          : [];
        
        return {
          test,
          nodes: targetNodes,
          isGroupTest: true,
          targetData: group,
          targetName: group?.nodeGroupName || 'Unknown Group'
        };
      } else {
        const node = nodes.find(n => n.nodeId === test.targetId);
        return {
          test,
          nodes: node ? [node] : [],
          isGroupTest: false,
          targetData: node,
          targetName: node?.nodeName || 'Unknown Node'
        };
      }
    });
  }, [filteredTests, nodes, nodeGroups]);

  // 테스트 확장/축소 토글
  const toggleTestExpansion = (testId: number) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  // 그룹/노드 클릭 핸들러
  const handleTargetClick = (type: 'node' | 'group', data: Node | NodeGroup) => {
    setSelectedTarget({ type, data });
    setIsDialogOpen(true);
  };

  // ✅ [수정] 수정 버튼 클릭 핸들러 - API 정보를 더 안전하게 세팅
  const handleEditClick = (test: SyntheticTest) => {
    // API가 실제로 존재하는지 확인
    // alert(JSON.stringify(test));
    const apiExists = apis.find(api => api.apiId === test.apiId);
    if (!apiExists) {
      console.warn(`테스트의 API ID ${test.apiId}를 찾을 수 없습니다. 사용 가능한 API 목록:`, apis.map(a => a.apiId));
    }
    
    setEditingTestId(test.syntheticTestId);
    setNewTest({
      syntheticTestName: test.syntheticTestName,
      targetType: test.targetType,
      targetId: String(test.targetId), // String()을 사용하여 더 안전하게 변환
      apiId: String(test.apiId), 
      tags: test.tags,
      intervalSeconds: test.intervalSeconds,
      alertThresholdMs: test.alertThresholdMs,
      apiParameterValues: test.apiParameterValues || {},
    });
    setSubView('edit');
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (test: SyntheticTest) => {
    setDeleteConfirmDialog({
      isOpen: true,
      testId: test.syntheticTestId,
      testName: test.syntheticTestName,
    });
  };

  const handleCreateTest = async () => {
    // ✅ 클라이언트 Validation 추가
    const validationError = validateSyntheticTestData({
      syntheticTestName: newTest.syntheticTestName,
      targetType: newTest.targetType,
      targetId: Number(newTest.targetId),
      apiId: Number(newTest.apiId),
      tags: newTest.tags, 
      intervalSeconds: Number(newTest.intervalSeconds),
      alertThresholdMs: Number(newTest.alertThresholdMs),
    });

    if (validationError) {
      alert(validationError);
      return;
    }
  
    setIsCreating(true);
    try {
        const testToCreate: Omit<SyntheticTest, 'syntheticTestId' | 'createdAt'> = {
            syntheticTestName: newTest.syntheticTestName,
            targetType: newTest.targetType,
            targetId: Number(newTest.targetId),
            apiId: Number(newTest.apiId),
            tags: newTest.tags, 
            intervalSeconds: Number(newTest.intervalSeconds),
            alertThresholdMs: Number(newTest.alertThresholdMs),
            apiParameterValues: newTest.apiParameterValues, // ✅ [추가]
        };

        const response = await fetch('/api/synthetic-tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testToCreate)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Test 생성 API 호출 실패: ${response.status}`);
        }

        // ✅ [수정] API 응답 구조 처리 개선
        const responseData = await response.json();
        const createdTest = (responseData.data || responseData) as SyntheticTest;
        
        console.log('Created test:', createdTest);
        
        setTests(prev => [...prev, createdTest]);
        
        setNewTest({ 
          syntheticTestName: '', 
          targetType: 'node', 
          targetId: '', 
          apiId: '', 
          tags: '', 
          intervalSeconds: 60, 
          alertThresholdMs: 200,
          apiParameterValues: {} // ✅ [추가]
        });
        setSubView('list');

    } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류로 테스트 생성에 실패했습니다.';
        console.error("테스트 생성 실패:", message);
        alert(`테스트 생성 실패: ${message}`);
    } finally {
        setIsCreating(false);
    }
  };

  // 테스트 수정 핸들러
  const handleUpdateTest = async () => {

    // ✅ 클라이언트 Validation 추가
    const validationError = validateSyntheticTestData({
      syntheticTestName: newTest.syntheticTestName,
      targetType: newTest.targetType,
      targetId: Number(newTest.targetId),
      apiId: Number(newTest.apiId),
      tags: newTest.tags, 
      intervalSeconds: Number(newTest.intervalSeconds),
      alertThresholdMs: Number(newTest.alertThresholdMs),
    });

    if (validationError) {
      alert(validationError);
      return;
    }
  
    setIsUpdating(true);
    try {

        const testToUpdate: Omit<SyntheticTest, 'syntheticTestId' | 'createdAt'> = {
            syntheticTestName: newTest.syntheticTestName,
            targetType: newTest.targetType,
            targetId: Number(newTest.targetId),
            apiId: Number(newTest.apiId),
            tags: newTest.tags, 
            intervalSeconds: Number(newTest.intervalSeconds),
            alertThresholdMs: Number(newTest.alertThresholdMs),
            apiParameterValues: newTest.apiParameterValues, // ✅ [추가]
        };

        const response = await fetch(`/api/synthetic-tests/${editingTestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testToUpdate)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Test 수정 API 호출 실패: ${response.status}`);
        }

        // ✅ [수정] API 응답 구조 처리 개선 및 디버깅 코드 제거
        const responseData = await response.json();
        const updatedTest = (responseData.data || responseData) as SyntheticTest;
        
        console.log('Updated test:', updatedTest);
        
        // 기존 테스트 목록에서 업데이트
        setTests(prev => prev.map(test => 
          test.syntheticTestId === editingTestId ? updatedTest : test
        ));
        
        setNewTest({ 
          syntheticTestName: '', 
          targetType: 'node', 
          targetId: '', 
          apiId: '', 
          tags: '', 
          intervalSeconds: 60, 
          alertThresholdMs: 200,
          apiParameterValues: {} // ✅ [추가]
        });
        setEditingTestId(null);
        setSubView('list');

    } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류로 테스트 수정에 실패했습니다.';
        console.error("테스트 수정 실패:", message);
        alert(`테스트 수정 실패: ${message}`);
    } finally {
        setIsUpdating(false);
    }
  };

  // 테스트 삭제 핸들러
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDialog.testId) return;
    
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/synthetic-tests/${deleteConfirmDialog.testId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Test 삭제 API 호출 실패: ${response.status}`);
        }

        // 성공 시 테스트 목록에서 제거
        setTests(prev => prev.filter(test => test.syntheticTestId !== deleteConfirmDialog.testId));
        
        // 다이얼로그 닫기
        setDeleteConfirmDialog({
          isOpen: false,
          testId: null,
          testName: '',
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류로 테스트 삭제에 실패했습니다.';
        console.error("테스트 삭제 실패:", message);
        alert(`테스트 삭제 실패: ${message}`);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleExecuteTest = async (testId: number) => {
    console.log(`Executing test ${testId} via POST /api/synthetic-tests/${testId}/execute`);
    
    try {
        const response = await fetch(`/api/synthetic-tests/${testId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.message || `Test 실행 API 호출 실패: ${response.status}`);
        }

        console.log(`테스트 ${testId} 실행 요청 성공.`);

    } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류로 테스트 실행에 실패했습니다.';
        console.error(`테스트 ${testId} 실행 실패:`, message);
        alert(`테스트 실행 요청 실패: ${message}`);
    }
  };

  // 생성/수정 취소 핸들러
  const handleCancel = () => {
    setNewTest({ 
      syntheticTestName: '', 
      targetType: 'node', 
      targetId: '', 
      apiId: '', 
      tags: '', 
      intervalSeconds: 60, 
      alertThresholdMs: 200,
      apiParameterValues: {} // ✅ [추가]
    });
    setEditingTestId(null);
    setSubView('list');
  };

  // ------------------------------------
  // 3. Render
  // ------------------------------------
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Synthetic Tests</CardTitle>
              <CardDescription>주기적으로 실행되는 모니터링 테스트를 관리합니다 (10초마다 자동 갱신)</CardDescription>
            </div>
            <Button 
              onClick={() => {
                if (subView === 'list') {
                  setSubView('create');
                } else {
                  handleCancel();
                }
              }} 
              disabled={isLoading || isCreating || isUpdating}
            >
              {subView === 'list' ? (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  테스트 추가
                </>
              ) : (
                '목록으로'
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 로딩 및 에러 상태 표시 */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>데이터를 불러오는 중...</span>
        </div>
      ) : error ? (
        <Card className="border-red-500">
             <CardContent className="p-4 text-center text-red-600">
                <p>⚠️ **데이터 로드 오류:** {error}</p>
                <Button variant="link" onClick={fetchData}>다시 시도</Button>
            </CardContent>
        </Card>
      ) : (
        <>
           {/* *************************************
            * Synthetic Test 목록 시작
            *****************************************/}
          {subView === 'list' ? (
            <>
              {/* 필터 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">필터</CardTitle>
                  <CardDescription>시간, 태그, 노드, 노드 그룹으로 테스트를 필터링합니다. 시간 필터는 테스트 실행 기록(히스토리)에 적용됩니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* ✅ [추가] 시간 범위 필터 */}
                  <div className="mb-6">
                    <Label className="text-sm font-semibold mb-2 block">실행 기록 시간 범위</Label>
                    <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 기간</SelectItem>
                        <SelectItem value="1hour">최근 1시간</SelectItem>
                        <SelectItem value="6hours">최근 6시간</SelectItem>
                        <SelectItem value="24hours">최근 24시간</SelectItem>
                        <SelectItem value="7days">최근 7일</SelectItem>
                        <SelectItem value="30days">최근 30일</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">선택한 기간의 테스트 실행 결과만 차트와 통계에 표시됩니다</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* 태그 필터 */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">태그</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                        {allTags.length === 0 ? (
                          <div className="text-sm text-gray-500">태그 없음</div>
                        ) : (
                          allTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={selectedTags.includes(tag)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTags([...selectedTags, tag]);
                                  } else {
                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`tag-${tag}`}
                                className="text-sm cursor-pointer"
                              >
                                {tag}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 노드 필터 */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">노드</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                        {nodes.length === 0 ? (
                          <div className="text-sm text-gray-500">노드 없음</div>
                        ) : (
                          nodes.map((node) => (
                            <div key={node.nodeId} className="flex items-center space-x-2">
                              <Checkbox
                                id={`node-${node.nodeId}`}
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
                                htmlFor={`node-${node.nodeId}`}
                                className="text-sm cursor-pointer"
                              >
                                <div>{node.nodeName}</div>
                                {node.nodeDesc && (
                                  <div className="text-xs text-gray-500">{node.nodeDesc}</div>
                                )}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 노드 그룹 필터 */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">노드 그룹</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                        {nodeGroups.length === 0 ? (
                          <div className="text-sm text-gray-500">그룹 없음</div>
                        ) : (
                          nodeGroups.map((group) => (
                            <div key={group.nodeGroupId} className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-${group.nodeGroupId}`}
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
                                htmlFor={`group-${group.nodeGroupId}`}
                                className="text-sm cursor-pointer"
                              >
                                {group.nodeGroupName}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 필터 초기화 및 선택 개수 표시 */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <div>테스트 필터: 태그 {selectedTags.length}개, 노드 {selectedNodes.length}개, 그룹 {selectedGroups.length}개</div>
                      <div className="text-xs text-blue-600 mt-1">
                        실행 기록: {timeRange === 'all' ? '전체 기간' : 
                          timeRange === '1hour' ? '최근 1시간' :
                          timeRange === '6hours' ? '최근 6시간' :
                          timeRange === '24hours' ? '최근 24시간' :
                          timeRange === '7days' ? '최근 7일' : '최근 30일'}
                      </div>
                    </div>
                    {(timeRange !== 'all' || selectedTags.length > 0 || selectedNodes.length > 0 || selectedGroups.length > 0) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setTimeRange('all');
                          setSelectedTags([]);
                          setSelectedNodes([]);
                          setSelectedGroups([]);
                        }}
                      >
                        전체 필터 초기화
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {testWithNodes.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <p>표시할 Synthetic Test가 없습니다.</p>
                  </CardContent>
                </Card>
              ) : (
                testWithNodes.map(({ test, nodes: targetNodes, isGroupTest, targetData, targetName }) => {
                  const isExpanded = expandedTests[test.syntheticTestId] ?? true; // 기본값: 확장
                  
                  return (
                    <Card key={test.syntheticTestId}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{test.syntheticTestName}</CardTitle>
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => targetData && handleTargetClick(isGroupTest ? 'group' : 'node', targetData)}
                              >
                                {isGroupTest ? (
                                  <><Layers className="w-3 h-3 mr-1" /> 그룹</>
                                ) : (
                                  <><Server className="w-3 h-3 mr-1" /> 노드</>
                                )}
                              </Badge>
                              {isGroupTest && (
                                <Badge variant="secondary">
                                  {targetNodes.length}개 노드
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              대상: {targetName} | 실행 주기: {test.intervalSeconds}초 | 알럿 기준: {test.alertThresholdMs}ms
                            </CardDescription>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {/* 태그가 문자열인 경우 배열로 변환 */}
                              {(() => {
                                const testTags = typeof test.tags === 'string' 
                                  ? test.tags.split(',').map(t => t.trim()).filter(Boolean)
                                  : (Array.isArray(test.tags) ? test.tags : []);
                                return testTags.map((tag, index) => (
                                  <Badge key={`${test.syntheticTestId}-tag-${index}`} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ));
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* 수정 버튼 */}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditClick(test)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {/* 삭제 버튼 */}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(test)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            {/* 확장/축소 버튼 */}
                            {targetNodes.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleTestExpansion(test.syntheticTestId)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    축소
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    확장
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="space-y-4">
                          {targetNodes.map((node, nodeIndex) => (
                            <SyntheticTestResults 
                              key={`test-${test.syntheticTestId}-node-${node.nodeId}-idx-${nodeIndex}`}
                              syntheticTestId={test.syntheticTestId}
                              nodeId={node.nodeId}
                              nodeName={node.nodeName}
                              isGroupTest={isGroupTest}
                              showNodeHeader={true}
                              onExecute={() => handleExecuteTest(test.syntheticTestId)}
                              onNodeClick={() => handleTargetClick('node', node)}
                              timeRange={timeRange}
                            />
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </>
          ) : (
            /* *************************************
            * Synthetic Test 테스트 생성/수정 뷰 시작
            *****************************************/
            <Card>
              <CardHeader>
                <CardTitle>{subView === 'edit' ? '테스트 수정' : '새 Synthetic Test 생성'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* 테스트 이름 */}
                <div>
                  <Label>테스트 이름<span className="text-red-500">*</span></Label>
                  <Input
                    value={newTest.syntheticTestName}
                    onChange={(e) => setNewTest({ ...newTest, syntheticTestName: e.target.value })}
                    placeholder="예: Web Health Monitor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 대상 타입 선택 */}
                  <div>
                    <Label>대상 타입<span className="text-red-500">*</span></Label>
                    <Select
                      value={newTest.targetType}
                      onValueChange={(v: 'node' | 'group') => setNewTest({ ...newTest, targetType: v, targetId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="node">노드</SelectItem>
                        <SelectItem value="group">노드 그룹</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 대상 선택 */}
                  <div>
                    <Label>대상 선택<span className="text-red-500">*</span></Label>
                    <Select value={newTest.targetId} onValueChange={(v) => setNewTest({ ...newTest, targetId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {newTest.targetType === 'group'
                          ? nodeGroups.map((g) => (
                              <SelectItem key={g.nodeGroupId} value={g.nodeGroupId.toString()}>
                                {g.nodeGroupName}
                              </SelectItem>
                            ))
                          : nodes.map((n) => (
                              <SelectItem key={n.nodeId} value={n.nodeId.toString()}>
                                {n.nodeName}{n.nodeDesc ? ` - ${n.nodeDesc}` : ''}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* API 선택 */}
                <div>
                  <Label>API<span className="text-red-500">*</span></Label>
                  <Select 
                    value={newTest.apiId} 
                    onValueChange={(v) => setNewTest({ 
                      ...newTest, 
                      apiId: v,
                      apiParameterValues: {} // ✅ [추가] API 변경 시 파라미터 값 초기화
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="API 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {apis.map((api) => (
                        <SelectItem key={api.apiId} value={api.apiId.toString()}>
                          [{api.method}] {api.apiName} ({api.uri})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API 테스트 섹션 */}
                {newTest.apiId && (
                  <ApiTestSection
                    selectedApiId={newTest.apiId}
                    targetType={newTest.targetType}
                    targetId={newTest.targetId}
                    apis={apis}
                    nodes={nodes}
                    nodeGroups={nodeGroups}
                    apiParameterValues={newTest.apiParameterValues} // ✅ [추가]
                    onParameterValuesChange={(values) => setNewTest({ ...newTest, apiParameterValues: values })} // ✅ [추가]
                  />
                )}

                {/* 태그 입력 */}
                <div>
                  <Label>태그 (쉼표로 구분)</Label>
                  <Input
                    value={newTest.tags}
                    onChange={(e) => setNewTest({ ...newTest, tags: e.target.value })}
                    placeholder="예: production, critical"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 실행 간격 */}
                  <div>
                    <Label>실행 간격 (초)<span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={newTest.intervalSeconds}
                      onChange={(e) => setNewTest({ ...newTest, intervalSeconds: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* 알럿 기준 */}
                  <div>
                    <Label>알럿 기준 (밀리초)<span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={newTest.alertThresholdMs}
                      onChange={(e) => setNewTest({ ...newTest, alertThresholdMs: parseInt(e.target.value) || 0 })}
                      placeholder="예: 200"
                    />
                    <p className="text-xs text-gray-500 mt-1">이 값을 초과하면 알럿으로 표시됩니다</p>
                  </div>
                </div>

                {/* 생성/수정 버튼 */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={subView === 'edit' ? handleUpdateTest : handleCreateTest} 
                    disabled={isCreating || isUpdating}
                  >
                    {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {subView === 'edit' ? '테스트 수정' : '테스트 생성'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isCreating || isUpdating}
                  >
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteConfirmDialog({ isOpen: open, testId: null, testName: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테스트 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 &quot;{deleteConfirmDialog.testName}&quot; 테스트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-semibold">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmDialog({ isOpen: false, testId: null, testName: '' })}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 그룹/노드 상세 정보 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTarget?.type === 'group' ? (
                <><Layers className="w-5 h-5" /> 그룹 상세 정보</>
              ) : (
                <><Server className="w-5 h-5" /> 노드 상세 정보</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTarget?.type === 'group' ? '노드 그룹' : '노드'}의 상세 정보입니다
            </DialogDescription>
          </DialogHeader>

          {selectedTarget && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">ID</div>
                      <div className="font-medium">{selectedTarget?.type === 'group' ? (selectedTarget.data as NodeGroup).nodeGroupId : (selectedTarget.data as Node).nodeId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">이름</div>
                      <div className="font-medium">{selectedTarget?.type === 'group' ? (selectedTarget.data as NodeGroup).nodeGroupName : (selectedTarget.data as Node).nodeName}</div>
                    </div>
                  </div>

                  {selectedTarget.type === 'node' && 'host' in selectedTarget.data && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">호스트</div>
                        <div className="font-medium">{selectedTarget.data.host}</div>
                      </div>
                      {selectedTarget.data.nodeDesc && (
                        <div>
                          <div className="text-sm text-gray-600">설명</div>
                          <div className="font-medium">{selectedTarget.data.nodeDesc}</div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTarget.type === 'group' && 'nodeIds' in selectedTarget.data && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">포함된 노드 ({selectedTarget.data.nodeIds.length}개)</div>
                      <div className="space-y-2">
                        {selectedTarget.data.nodeIds.map((nodeId: number) => {
                          const node = nodes.find(n => n.nodeId === nodeId);
                          return node ? (
                            <div key={nodeId} className="p-3 border rounded">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium">{node.nodeName}</div>
                                <Badge variant="outline">ID: {node.nodeId}</Badge>
                              </div>
                              <div className="text-sm text-gray-500">{node.host}</div>
                              {node.nodeDesc && (
                                <div className="text-sm text-gray-600 mt-1">{node.nodeDesc}</div>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}