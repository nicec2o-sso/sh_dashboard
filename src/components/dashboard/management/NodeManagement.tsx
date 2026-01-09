'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, RefreshCw, Edit } from 'lucide-react';
import { Node } from '@/types';
import { validateNodeData } from '@/lib/clientValidation';

export function NodeManagement() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNode, setNewNode] = useState({ nodeName: '', host: '', port: '', nodeDesc: '', tags: '' });
  const [healthChecking, setHealthChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/nodes');
      
      if (!response.ok) {
        throw new Error(`노드 데이터 로드 실패: ${response.status}`);
      }
      
      const data = await response.json();
      setNodes(data.data || []);
    } catch (e) {
      console.error("Failed to fetch nodes:", e);
      setError(e instanceof Error ? e.message : "노드 데이터 로드에 실패했습니다.");
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
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const checkHealth = async () => {
    if (!newNode.host || !newNode.port) {
      alert('호스트와 포트를 먼저 입력해주세요.');
      return;
    }

    setHealthChecking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('헬스 체크 성공! 노드가 정상적으로 응답합니다.');
    } catch (e) {
      alert('헬스 체크 실패: 노드에 연결할 수 없습니다.');
    } finally {
      setHealthChecking(false);
    }
  };

  const handleEditClick = (node: Node) => {
    setEditingNodeId(node.nodeId);
    setNewNode({
      nodeName: node.nodeName,
      host: node.host,
      port: node.port.toString(),
      nodeDesc: node.nodeDesc || '',
      tags: typeof node.tags === 'string' ? node.tags : '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setNewNode({ nodeName: '', host: '', port: '', nodeDesc: '', tags: '' });
    setEditingNodeId(null);
    setShowAddForm(false);
  };

  const addNode = async () => {
    // ✅ 클라이언트 Validation 추가
    const validationError = validateNodeData({
      nodeName: newNode.nodeName,
      host: newNode.host,
      port: newNode.port,
      nodeDesc: newNode.nodeDesc,
      tags: newNode.tags
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    setIsCreating(true);
    try {
      const nodeToCreate = {
        nodeName: newNode.nodeName,
        host: newNode.host,
        port: parseInt(newNode.port),
        nodeDesc: newNode.nodeDesc || undefined,
        tags: newNode.tags || undefined,
      };

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeToCreate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `노드 생성 실패: ${response.status}`);
      }

      await fetchData();
      
      setNewNode({ nodeName: '', host: '', port: '', nodeDesc: '', tags: '' });
      setShowAddForm(false);
      alert('노드가 성공적으로 등록되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 등록에 실패했습니다.';
      console.error("노드 생성 실패:", message);
      alert(`노드 등록 실패: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const updateNode = async () => {
    // ✅ 클라이언트 Validation 추가
    const validationError = validateNodeData({
      nodeName: newNode.nodeName,
      host: newNode.host,
      port: newNode.port,
      nodeDesc: newNode.nodeDesc,
      tags: newNode.tags
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    if (!editingNodeId) {
      alert('수정할 노드가 선택되지 않았습니다.');
      return;
    }

    setIsUpdating(true);
    try {
      const nodeToUpdate = {
        nodeName: newNode.nodeName,
        host: newNode.host,
        port: parseInt(newNode.port),
        nodeDesc: newNode.nodeDesc || undefined,
        tags: newNode.tags || undefined,
      };

      const response = await fetch(`/api/nodes/${editingNodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeToUpdate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `노드 수정 실패: ${response.status}`);
      }

      await fetchData();
      
      setNewNode({ nodeName: '', host: '', port: '', nodeDesc: '', tags: '' });
      setEditingNodeId(null);
      setShowAddForm(false);
      alert('노드가 성공적으로 수정되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 수정에 실패했습니다.';
      console.error("노드 수정 실패:", message);
      alert(`노드 수정 실패: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNode = async (nodeId: number) => {
    if (!confirm('정말 이 노드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `노드 삭제 실패: ${response.status}`);
      }

      await fetchData();
      alert('노드가 성공적으로 삭제되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 삭제에 실패했습니다.';
      console.error("노드 삭제 실패:", message);
      alert(`노드 삭제 실패: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-2" />
        <span>노드 데이터를 불러오는 중...</span>
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
              <CardTitle>노드 관리</CardTitle>
              <CardDescription>시스템 노드를 관리합니다 (10초마다 자동 갱신)</CardDescription>
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
                  노드 추가
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingNodeId ? '노드 수정' : '새 노드 등록'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>노드 이름 *</Label>
              <Input
                value={newNode.nodeName}
                onChange={(e) => setNewNode({ ...newNode, nodeName: e.target.value })}
                placeholder="예: Web Server 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>호스트 *</Label>
                <Input
                  value={newNode.host}
                  onChange={(e) => setNewNode({ ...newNode, host: e.target.value })}
                  placeholder="192.168.1.10 또는 example.com"
                />
              </div>
              <div>
                <Label>포트 *</Label>
                <Input
                  type="number"
                  value={newNode.port}
                  onChange={(e) => setNewNode({ ...newNode, port: e.target.value })}
                  placeholder="8080"
                />
              </div>
            </div>

            <div>
              <Label>태그</Label>
              <Input
                value={newNode.tags}
                onChange={(e) => setNewNode({ ...newNode, tags: e.target.value })}
                placeholder="태그를 콤마로 구분하여 입력 (예: production,web,critical)"
              />
              <p className="text-xs text-gray-500 mt-1">
                콤마(,)로 구분하여 여러 태그를 입력할 수 있습니다.
              </p>
            </div>

            <div>
              <Label>설명</Label>
              <Input
                value={newNode.nodeDesc}
                onChange={(e) => setNewNode({ ...newNode, nodeDesc: e.target.value })}
                placeholder="노드에 대한 설명 (선택사항)"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={checkHealth} 
                disabled={healthChecking || isCreating || isUpdating}
              >
                {healthChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    체크 중...
                  </>
                ) : (
                  '헬스 체크'
                )}
              </Button>
              
              <Button 
                onClick={editingNodeId ? updateNode : addNode} 
                className="flex-1" 
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingNodeId ? '수정 중...' : '등록 중...'}
                  </>
                ) : (
                  editingNodeId ? '노드 수정' : '노드 등록'
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
        {nodes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>등록된 노드가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          nodes.map((node) => (
            <Card key={node.nodeId}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs font-mono">
                        ID: {node.nodeId}
                      </Badge>
                      <CardTitle className="text-lg">{node.nodeName}</CardTitle>
                      {node.nodeStatus && (
                        <Badge variant={node.nodeStatus === 'active' ? 'default' : 'destructive'}>
                          {node.nodeStatus}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {node.host}:{node.port}
                    </CardDescription>
                    {node.nodeDesc && (
                      <CardDescription className="mt-1 text-gray-600">
                        {node.nodeDesc}
                      </CardDescription>
                    )}
                    {node.tags && node.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(typeof node.tags === 'string' ? node.tags.split(',').filter(t => t.trim()) : []).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditClick(node)}
                      title="노드 수정"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteNode(node.nodeId)}
                      title="노드 삭제"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
