'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, RefreshCw, Edit, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Api, ApiParameter } from '@/types';

export function ApiManagement() {
  const [apis, setApis] = useState<Api[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopying, setIsCopying] = useState(false); // ✅ 복사 상태 추가
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 수정 중인 API ID
  const [editingApiId, setEditingApiId] = useState<number | null>(null);
  
  // 각 API의 확장/축소 상태
  const [expandedApis, setExpandedApis] = useState<Record<number, boolean>>({});
  
  // API 및 파라미터 폼 상태
  const [newApi, setNewApi] = useState({
    name: '',
    uri: '',
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE',
    parameters: [] as Array<{
      name: string;
      type: 'query' | 'body';
      required: boolean;
      description: string;
    }>
  });

  // 데이터 fetch 함수
  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/apis');
      
      if (!response.ok) {
        throw new Error(`API 데이터 로드 실패: ${response.status}`);
      }
      
      const data = await response.json();
      setApis(data.data || []);
    } catch (e) {
      console.error("Failed to fetch APIs:", e);
      setError(e instanceof Error ? e.message : "API 데이터 로드에 실패했습니다.");
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
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // API 확장/축소 토글
  const toggleApiExpansion = (apiId: number) => {
    setExpandedApis(prev => ({
      ...prev,
      [apiId]: !prev[apiId]
    }));
  };

  // ✅ [개선] 수정 버튼 클릭 핸들러 - 파라미터 로드 개선
  const handleEditClick = async (api: Api) => {
    console.log('수정할 API:', api);
    console.log('API Parameter IDs:', api.apiParameterIds);
    
    setEditingApiId(api.id);
    setIsLoadingParameters(true);
    
    // 기본 API 정보는 즉시 설정
    setNewApi({
      name: api.name,
      uri: api.uri,
      method: api.method,
      parameters: [] // 파라미터는 로딩 중
    });
    
    setShowAddForm(true);
    
    // API 파라미터 로드
    try {
      if (api.apiParameterIds.length === 0) {
        console.log('파라미터가 없는 API입니다.');
        setNewApi(prev => ({
          ...prev,
          parameters: []
        }));
        setIsLoadingParameters(false);
        return;
      }

      console.log(`파라미터 로드 시작: /api/apis/${api.id}/parameters`);
      const response = await fetch(`/api/apis/${api.id}/parameters`);
      
      if (!response.ok) {
        throw new Error(`파라미터 로드 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('파라미터 응답 데이터:', data);
      
      const params = (data.data || []) as ApiParameter[];
      console.log('로드된 파라미터:', params);
      
      if (params.length === 0) {
        console.warn('API에 파라미터 ID는 있지만 실제 데이터가 없습니다.');
      }
      
      setNewApi(prev => ({
        ...prev,
        parameters: params.map(p => ({
          name: p.name,
          type: p.type,
          required: p.required,
          description: p.description || ''
        }))
      }));
      
    } catch (e) {
      const message = e instanceof Error ? e.message : '파라미터 로드 실패';
      console.error('Failed to load API parameters:', message, e);
      alert(`파라미터 로드 중 오류가 발생했습니다: ${message}`);
      
      // 에러가 발생해도 API 기본 정보는 유지하고 파라미터만 비움
      setNewApi(prev => ({
        ...prev,
        parameters: []
      }));
    } finally {
      setIsLoadingParameters(false);
    }
  };

  // ✅ [추가] API 복사 핸들러 - 파라미터도 완전히 새로 생성
  const handleCopyClick = async (api: Api) => {
    if (!confirm('정말 이 API를 복제하시겠습니까 ')) {
      return;
    }
    console.log('복사할 API:', api);
    
    setIsCopying(true);
    setIsLoadingParameters(true);
    
    // 복사본 이름 생성
    const copyName = `${api.name} (복사본)`;
    
    try {
      // ✅ 기존 파라미터 로드 (속성만 복사, ID는 새로 생성됨)
      let parameters: Array<{
        name: string;
        type: 'query' | 'body';
        required: boolean;
        description: string;
      }> = [];

      if (api.apiParameterIds.length > 0) {
        console.log(`파라미터 로드 시작: /api/apis/${api.id}/parameters`);
        const response = await fetch(`/api/apis/${api.id}/parameters`);
        
        if (response.ok) {
          const data = await response.json();
          const params = (data.data || []) as ApiParameter[];
          
          console.log('기존 파라미터:', params);
          
          // ✅ 파라미터 속성만 복사 (ID는 제외 - 새로 생성될 것임)
          parameters = params.map(p => ({
            name: p.name,
            type: p.type,
            required: p.required,
            description: p.description || ''
          }));
          
          console.log('복사할 파라미터 (ID 제외):', parameters);
        }
      }

      // 복사본 생성
      const apiToCopy = {
        name: copyName,
        uri: api.uri,
        method: api.method,
        parameters: parameters // ✅ ID 없는 파라미터 데이터 - 백엔드에서 새 ID로 생성됨
      };

      console.log('API 복사 요청:', apiToCopy);

      const response = await fetch('/api/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiToCopy)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 복사 실패: ${response.status}`);
      }

      const responseData = await response.json();
      const copiedApi = (responseData.data || responseData) as Api;
      
      console.log('복사된 API:', copiedApi);
      console.log('새로 생성된 파라미터 IDs:', copiedApi.apiParameterIds);
      
      setApis(prev => [...prev, copiedApi]);
      
      alert(`API가 성공적으로 복사되었습니다.\n원본 API ID: ${api.id}\n복사본 API ID: ${copiedApi.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 복사에 실패했습니다.';
      console.error("API 복사 실패:", message);
      alert(`API 복사 실패: ${message}`);
    } finally {
      setIsCopying(false);
      setIsLoadingParameters(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setNewApi({
      name: '',
      uri: '',
      method: 'GET',
      parameters: []
    });
    setEditingApiId(null);
    setShowAddForm(false);
    setIsLoadingParameters(false);
  };

  // 파라미터 추가
  const addParameter = () => {
    setNewApi({
      ...newApi,
      parameters: [
        ...newApi.parameters,
        { name: '', type: 'query', required: false, description: '' }
      ]
    });
  };

  // 파라미터 제거
  const removeParameter = (index: number) => {
    setNewApi({
      ...newApi,
      parameters: newApi.parameters.filter((_, i) => i !== index)
    });
  };

  // 파라미터 변경
  const updateParameter = (index: number, field: string, value: any) => {
    const updatedParams = [...newApi.parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value
    };
    setNewApi({
      ...newApi,
      parameters: updatedParams
    });
  };

  // API 생성
  const createApi = async () => {
    if (!newApi.name || !newApi.uri) {
      alert('이름과 URI는 필수 입력 항목입니다.');
      return;
    }

    // 파라미터 유효성 검사
    const invalidParams = newApi.parameters.filter(p => !p.name);
    if (invalidParams.length > 0) {
      alert('모든 파라미터에 이름을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const apiToCreate = {
        name: newApi.name,
        uri: newApi.uri,
        method: newApi.method,
        parameters: newApi.parameters
      };

      console.log('API 생성 요청:', apiToCreate);

      const response = await fetch('/api/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiToCreate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 생성 실패: ${response.status}`);
      }

      const responseData = await response.json();
      const createdApi = (responseData.data || responseData) as Api;
      
      console.log('생성된 API:', createdApi);
      
      setApis(prev => [...prev, createdApi]);
      
      handleCancel();
      alert('API가 성공적으로 등록되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 등록에 실패했습니다.';
      console.error("API 생성 실패:", message);
      alert(`API 등록 실패: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // API 수정 (파라미터 ID는 유지하면서 내용만 업데이트)
  const updateApi = async () => {
    if (!editingApiId || !newApi.name || !newApi.uri) {
      alert('이름과 URI는 필수 입력 항목입니다.');
      return;
    }

    // 파라미터 유효성 검사
    const invalidParams = newApi.parameters.filter(p => !p.name);
    if (invalidParams.length > 0) {
      alert('모든 파라미터에 이름을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const apiToUpdate = {
        name: newApi.name,
        uri: newApi.uri,
        method: newApi.method,
        parameters: newApi.parameters // ✅ 파라미터도 포함 (ID는 유지되며 내용만 업데이트)
      };

      console.log('API 수정 요청 (파라미터 ID 유지):', apiToUpdate);

      const response = await fetch(`/api/apis/${editingApiId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiToUpdate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 수정 실패: ${response.status}`);
      }

      const responseData = await response.json();
      const updatedApi = (responseData.data || responseData) as Api;
      
      console.log('수정된 API:', updatedApi);
      
      setApis(prev => prev.map(api => 
        api.id === editingApiId ? updatedApi : api
      ));
      
      handleCancel();
      alert('API가 성공적으로 수정되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 수정에 실패했습니다.';
      console.error("API 수정 실패:", message);
      alert(`API 수정 실패: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // API 삭제
  const deleteApi = async (id: number) => {
    if (!confirm('정말 이 API를 삭제하시겠습니까? 연관된 테스트도 영향을 받을 수 있습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/apis/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API 삭제 실패: ${response.status}`);
      }

      setApis(prev => prev.filter(a => a.id !== id));
      alert('API가 성공적으로 삭제되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'API 삭제에 실패했습니다.';
      console.error("API 삭제 실패:", message);
      alert(`API 삭제 실패: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-2" />
        <span>API 데이터를 불러오는 중...</span>
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
              <CardTitle>API 관리</CardTitle>
              <CardDescription>시스템에서 사용할 API를 관리합니다 (10초마다 자동 갱신)</CardDescription>
            </div>
            <Button 
              onClick={() => {
                if (showAddForm) {
                  handleCancel();
                } else {
                  setShowAddForm(true);
                }
              }} 
              disabled={isCreating || isUpdating || isLoadingParameters || isCopying}
            >
              {showAddForm ? (
                '취소'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  API 추가
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingApiId ? 'API 수정' : '새 API 등록'}
              {isLoadingParameters && ' (파라미터 로딩 중...)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API 이름 *</Label>
              <Input
                value={newApi.name}
                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                placeholder="예: User List API"
                disabled={isLoadingParameters}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method *</Label>
                <Select
                  value={newApi.method}
                  onValueChange={(v: any) => setNewApi({ ...newApi, method: v })}
                  disabled={isLoadingParameters}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URI *</Label>
                <Input
                  value={newApi.uri}
                  onChange={(e) => setNewApi({ ...newApi, uri: e.target.value })}
                  placeholder="/api/users"
                  disabled={isLoadingParameters}
                />
              </div>
            </div>

            {/* 파라미터 관리 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>파라미터</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addParameter}
                  disabled={isLoadingParameters}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  파라미터 추가
                </Button>
              </div>

              {isLoadingParameters ? (
                <div className="flex items-center justify-center p-4 border rounded">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">파라미터를 불러오는 중...</span>
                </div>
              ) : newApi.parameters.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border rounded text-center">
                  파라미터가 없습니다. "파라미터 추가" 버튼을 클릭하세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {newApi.parameters.map((param, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">이름 *</Label>
                            <Input
                              value={param.name}
                              onChange={(e) => updateParameter(index, 'name', e.target.value)}
                              placeholder="userId"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">타입 *</Label>
                            <Select
                              value={param.type}
                              onValueChange={(v) => updateParameter(index, 'type', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="query">Query</SelectItem>
                                <SelectItem value="body">Body</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">설명</Label>
                          <Input
                            value={param.description}
                            onChange={(e) => updateParameter(index, 'description', e.target.value)}
                            placeholder="파라미터 설명"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={param.required}
                              onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                            />
                            <label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                              필수 항목
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingApiId ? updateApi : createApi} 
                className="flex-1" 
                disabled={isCreating || isUpdating || isLoadingParameters || isCopying}
              >
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingApiId ? '수정 중...' : '등록 중...'}
                  </>
                ) : (
                  editingApiId ? 'API 수정' : 'API 등록'
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={isCreating || isUpdating || isLoadingParameters || isCopying}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {apis.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>등록된 API가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          apis.map((api) => {
            const isExpanded = expandedApis[api.id] ?? false;
            
            return (
              <Card key={api.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs font-mono">
                          ID: {api.id}
                        </Badge>
                        <CardTitle className="text-lg">{api.name}</CardTitle>
                        <Badge variant="outline">
                          {api.method}
                        </Badge>
                      </div>
                      <CardDescription>{api.uri}</CardDescription>
                      {api.apiParameterIds && api.apiParameterIds.length > 0 && (
                        <CardDescription className="mt-1 text-blue-600">
                          {api.apiParameterIds.length}개의 파라미터
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopyClick(api)}
                        disabled={isCopying}
                        title="API 복사"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(api)}
                        title="API 수정"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteApi(api.id)}
                        title="API 삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      {api.apiParameterIds && api.apiParameterIds.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleApiExpansion(api.id)}
                          title={isExpanded ? "파라미터 숨기기" : "파라미터 보기"}
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
                
                {isExpanded && api.apiParameterIds && api.apiParameterIds.length > 0 && (
                  <CardContent>
                    <ApiParametersDisplay apiId={api.id} />
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

// 파라미터 표시 컴포넌트
function ApiParametersDisplay({ apiId }: { apiId: number }) {
  const [parameters, setParameters] = useState<ApiParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParameters() {
      setError(null);
      try {
        const response = await fetch(`/api/apis/${apiId}/parameters`);
        if (!response.ok) {
          throw new Error(`파라미터 로드 실패: ${response.status}`);
        }
        const data = await response.json();
        setParameters(data.data || []);
      } catch (e) {
        const message = e instanceof Error ? e.message : '파라미터 로드 실패';
        console.error('Failed to load parameters:', e);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadParameters();
  }, [apiId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">파라미터 로드 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 text-center p-4 border border-red-300 rounded bg-red-50">
        파라미터 로드 실패: {error}
      </div>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        파라미터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">파라미터 목록</Label>
      <div className="grid gap-2">
        {parameters.map((param) => (
          <div key={param.id} className="p-3 border rounded bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{param.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {param.type}
                  </Badge>
                  {param.required && (
                    <Badge variant="destructive" className="text-xs">
                      필수
                    </Badge>
                  )}
                </div>
                {param.description && (
                  <p className="text-xs text-gray-600">{param.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}