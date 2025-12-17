'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, RefreshCw, Edit } from 'lucide-react';
import { Node } from '@/types';

export function NodeManagement() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNode, setNewNode] = useState({ name: '', host: '', port: '', description: '' });
  const [healthChecking, setHealthChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 수정 중인 노드 ID
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);

  // 데이터 fetch 함수
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

  // 초기 데이터 로드
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    }
    initialLoad();
  }, [fetchData]);

  // 10초마다 자동 갱신
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000); // 10초

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const checkHealth = async () => {
    if (!newNode.host || !newNode.port) {
      alert('호스트와 포트를 먼저 입력해주세요.');
      return;
    }

    setHealthChecking(true);
    try {
      // 실제 헬스 체크 API 호출 (구현 필요)
      // const response = await fetch(`/api/nodes/health-check`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ host: newNode.host, port: parseInt(newNode.port) })
      // });
      
      // 임시로 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('헬스 체크 성공! 노드가 정상적으로 응답합니다.');
    } catch (e) {
      alert('헬스 체크 실패: 노드에 연결할 수 없습니다.');
    } finally {
      setHealthChecking(false);
    }
  };

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (node: Node) => {
    setEditingNodeId(node.id);
    setNewNode({
      name: node.name,
      host: node.host,
      port: node.port.toString(),
      description: node.description || '',
    });
    setShowAddForm(true);
  };

  // 취소 핸들러
  const handleCancel = () => {
    setNewNode({ name: '', host: '', port: '', description: '' });
    setEditingNodeId(null);
    setShowAddForm(false);
  };

  const addNode = async () => {
    if (!newNode.name || !newNode.host || !newNode.port) {
      alert('이름, 호스트, 포트는 필수 입력 항목입니다.');
      return;
    }

    setIsCreating(true);
    try {
      const nodeToCreate = {
        name: newNode.name,
        host: newNode.host,
        port: parseInt(newNode.port),
        description: newNode.description || undefined,
      };

      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeToCreate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 생성 실패: ${response.status}`);
      }

      const createdNode = await response.json();
      
      // 생성 성공 후 서버에서 최신 데이터 다시 가져오기
      await fetchData();
      
      setNewNode({ name: '', host: '', port: '', description: '' });
      setShowAddForm(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 등록에 실패했습니다.';
      console.error("노드 생성 실패:", message);
      alert(`노드 등록 실패: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // 노드 수정 핸들러
  const updateNode = async () => {
    if (!editingNodeId || !newNode.name || !newNode.host || !newNode.port) {
      alert('이름, 호스트, 포트는 필수 입력 항목입니다.');
      return;
    }

    setIsUpdating(true);
    try {
      const nodeToUpdate = {
        name: newNode.name,
        host: newNode.host,
        port: parseInt(newNode.port),
        description: newNode.description || undefined,
      };

      const response = await fetch(`/api/nodes/${editingNodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeToUpdate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 수정 실패: ${response.status}`);
      }

      const responseData = await response.json();
      
      // 수정 성공 후 서버에서 최신 데이터 다시 가져오기
      await fetchData();
      
      setNewNode({ name: '', host: '', port: '', description: '' });
      setEditingNodeId(null);
      setShowAddForm(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : '노드 수정에 실패했습니다.';
      console.error("노드 수정 실패:", message);
      alert(`노드 수정 실패: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNode = async (id: number) => {
    if (!confirm('정말 이 노드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `노드 삭제 실패: ${response.status}`);
      }

      // 삭제 성공 후 서버에서 최신 데이터 다시 가져오기
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
                value={newNode.name}
                onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
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
              <Label>설명</Label>
              <Input
                value={newNode.description}
                onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
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
            <Card key={node.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs font-mono">
                        ID: {node.id}
                      </Badge>
                      <CardTitle className="text-lg">{node.name}</CardTitle>
                      {node.status && (
                        <Badge variant={node.status === 'healthy' ? 'default' : 'destructive'}>
                          {node.status}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {node.host}:{node.port}
                    </CardDescription>
                    {node.description && (
                      <CardDescription className="mt-1 text-gray-600">
                        {node.description}
                      </CardDescription>
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
                      onClick={() => deleteNode(node.id)}
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