'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, RefreshCw, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { Node, NodeGroup } from '@/types';
import { validateNodeGroupData } from '@/lib/clientValidation';

export function NodeGroupManagement() {
  const [groups, setGroups] = useState<NodeGroup[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    nodeGroupName: '',
    nodeGroupDesc: '',
    nodeIds: [] as number[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [groupsResponse, nodesResponse] = await Promise.all([
        fetch('/api/node-groups'),
        fetch('/api/nodes'),
      ]);

      if (!groupsResponse.ok) {
        throw new Error(`노드 그룹 데이터 로드 실패: ${groupsResponse.status}`);
      }
      if (!nodesResponse.ok) {
        throw new Error(`노드 데이터 로드 실패: ${nodesResponse.status}`);
      }

      const groupsData = await groupsResponse.json();
      const nodesData = await nodesResponse.json();

      setGroups(groupsData.data || []);
      setNodes(nodesData.data || []);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError(e instanceof Error ? e.message : "데이터 로드에 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    }
    initialLoad();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const toggleGroupExpansion = (groupId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleEditClick = (group: NodeGroup) => {
    setEditingGroupId(group.nodeGroupId);
    setNewGroup({
      nodeGroupName: group.nodeGroupName,
      nodeGroupDesc: group.nodeGroupDesc || '',
      nodeIds: [...group.nodeIds],
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setNewGroup({ nodeGroupName: '', nodeGroupDesc: '', nodeIds: [] });
    setEditingGroupId(null);
    setShowAddForm(false);
  };

  const addGroup = async () => {
    // ✅ 클라이언트 Validation 추가
    const validationError = validateNodeGroupData({
      nodeGroupName: newGroup.nodeGroupName,
      nodeGroupDesc: newGroup.nodeGroupDesc,
      nodeIds: newGroup.nodeIds
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    setIsCreating(true);
    try {
      const groupToCreate = {
        nodeGroupName: newGroup.nodeGroupName,
        nodeGroupDesc: newGroup.nodeGroupDesc || undefined,
        nodeIds: newGroup.nodeIds,
      };

      const response = await fetch('/api/node-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupToCreate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `그룹 생성 실패: ${response.status}`);
      }

      await fetchData();
      
      setNewGroup({ nodeGroupName: '', nodeGroupDesc: '', nodeIds: [] });
      setShowAddForm(false);
      alert('노드 그룹이 성공적으로 생성되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '그룹 생성에 실패했습니다.';
      console.error("그룹 생성 실패:", message);
      alert(`그룹 생성 실패: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const updateGroup = async () => {
    // ✅ 클라이언트 Validation 추가
    const validationError = validateNodeGroupData({
      nodeGroupName: newGroup.nodeGroupName,
      nodeGroupDesc: newGroup.nodeGroupDesc,
      nodeIds: newGroup.nodeIds
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    if (!editingGroupId) {
      alert('수정할 그룹이 선택되지 않았습니다.');
      return;
    }

    setIsUpdating(true);
    try {
      const groupToUpdate = {
        nodeGroupName: newGroup.nodeGroupName,
        nodeGroupDesc: newGroup.nodeGroupDesc || undefined,
        nodeIds: newGroup.nodeIds,
      };

      const response = await fetch(`/api/node-groups/${editingGroupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupToUpdate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `그룹 수정 실패: ${response.status}`);
      }

      await fetchData();
      
      setNewGroup({ nodeGroupName: '', nodeGroupDesc: '', nodeIds: [] });
      setEditingGroupId(null);
      setShowAddForm(false);
      alert('노드 그룹이 성공적으로 수정되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '그룹 수정에 실패했습니다.';
      console.error("그룹 수정 실패:", message);
      alert(`그룹 수정 실패: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('정말 이 노드 그룹을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/node-groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `그룹 삭제 실패: ${response.status}`);
      }

      await fetchData();
      alert('노드 그룹이 성공적으로 삭제되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '그룹 삭제에 실패했습니다.';
      alert(`그룹 삭제 실패: ${message}`);
    }
  };

  const toggleNodeSelection = (nodeId: number) => {
    const nodeIds = newGroup.nodeIds.includes(nodeId)
      ? newGroup.nodeIds.filter((id) => id !== nodeId)
      : [...newGroup.nodeIds, nodeId];
    setNewGroup({ ...newGroup, nodeIds });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-2" />
        <span>노드 그룹 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">⚠️ 데이터 로드 오류: {error}</p>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>노드 그룹 관리</CardTitle>
              <CardDescription>노드 그룹을 관리합니다 (10초마다 자동 갱신)</CardDescription>
            </div>
            <Button 
              onClick={() => {
                if (showAddForm) {
                  handleCancel();
                } else {
                  setShowAddForm(true);
                }
              }}
              disabled={isCreating || isUpdating}
            >
              {showAddForm ? '취소' : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  그룹 추가
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingGroupId ? '노드 그룹 수정' : '새 노드 그룹 생성'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>그룹 이름 <span className="text-red-500">*</span></Label>
              <Input
                value={newGroup.nodeGroupName}
                onChange={(e) => setNewGroup({ ...newGroup, nodeGroupName: e.target.value })}
                placeholder="예: Web Cluster"
              />
            </div>

            <div>
              <Label>설명</Label>
              <Input
                value={newGroup.nodeGroupDesc}
                onChange={(e) => setNewGroup({ ...newGroup, nodeGroupDesc: e.target.value })}
                placeholder="그룹 설명 (선택사항)"
              />
            </div>

            <div>
              <Label>포함할 노드 <span className="text-red-500">*</span></Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                {nodes.length === 0 ? (
                  <div className="text-sm text-gray-500">사용 가능한 노드가 없습니다.</div>
                ) : (
                  nodes.map((node) => (
                    <div key={node.nodeId} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`node-${node.nodeId}`}
                        checked={newGroup.nodeIds.includes(node.nodeId)}
                        onCheckedChange={() => toggleNodeSelection(node.nodeId)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={`node-${node.nodeId}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-mono">
                            ID: {node.nodeId}
                          </Badge>
                          <span className="font-medium">{node.nodeName}</span>
                          <span className="text-gray-500">({node.host})</span>
                        </div>
                        {node.nodeDesc && (
                          <div className="text-xs text-gray-500 mt-1">{node.nodeDesc}</div>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                선택된 노드: {newGroup.nodeIds.length}개
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingGroupId ? updateGroup : addGroup} 
                className="flex-1" 
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingGroupId ? '수정 중...' : '생성 중...'}
                  </>
                ) : (
                  editingGroupId ? '그룹 수정' : '그룹 생성'
                )}
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

      <div className="grid gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>등록된 노드 그룹이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroups[group.nodeGroupId] ?? true;
            const groupNodes = group.nodeIds
              .map(nodeId => nodes.find(n => n.nodeId === nodeId))
              .filter(Boolean) as Node[];

            return (
              <Card key={group.nodeGroupId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs font-mono">
                          ID: {group.nodeGroupId}
                        </Badge>
                        <CardTitle className="text-lg">{group.nodeGroupName}</CardTitle>
                        <Badge variant="outline">{group.nodeIds.length}개 노드</Badge>
                      </div>
                      {group.nodeGroupDesc && (
                        <CardDescription className="mt-1">{group.nodeGroupDesc}</CardDescription>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(group)}
                        title="그룹 수정"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteGroup(group.nodeGroupId)}
                        title="그룹 삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      {group.nodeIds.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleGroupExpansion(group.nodeGroupId)}
                          title={isExpanded ? "노드 목록 숨기기" : "노드 목록 보기"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    {group.nodeIds.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center p-4">
                        포함된 노드가 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">포함된 노드 목록</Label>
                        <div className="grid gap-2">
                          {groupNodes.map((node) => (
                            <div key={node.nodeId} className="p-3 border rounded bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-xs font-mono">
                                      ID: {node.nodeId}
                                    </Badge>
                                    <span className="font-medium">{node.nodeName}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">{node.host}</div>
                                  {node.nodeDesc && (
                                    <div className="text-xs text-gray-500 mt-1">{node.nodeDesc}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {group.nodeIds.filter(nodeGroupId => !groupNodes.find(n => n.nodeId === nodeGroupId)).map((nodeId) => (
                            <div key={nodeId} className="p-3 border border-red-200 rounded bg-red-50">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs font-mono">
                                  ID: {nodeId}
                                </Badge>
                                <span className="text-sm text-red-600">(삭제된 노드)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
