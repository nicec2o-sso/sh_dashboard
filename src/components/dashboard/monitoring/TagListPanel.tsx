'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { Tag, Node, Api, SyntheticTest } from '@/types';

interface TagWithUsage extends Tag {
  nodes: Node[];
  apis: Api[];
  tests: SyntheticTest[];
}

// 모달 데이터 타입
interface ModalData {
  isOpen: boolean;
  title: string;
  type: 'nodes' | 'apis' | 'tests';
  items: Node[] | Api[] | SyntheticTest[];
}

export function TagListPanel() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [tests, setTests] = useState<SyntheticTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 모달 상태
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    title: '',
    type: 'nodes',
    items: [],
  });

  // 데이터 fetch 함수
  const fetchData = useCallback(async () => {
    try {
      const [tagsResponse, nodesResponse, apisResponse, testsResponse] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/nodes'),
        fetch('/api/apis'),
        fetch('/api/synthetic-tests'),
      ]);

      const tagsData = await tagsResponse.json();
      const nodesData = await nodesResponse.json();
      const apisData = await apisResponse.json();
      const testsData = await testsResponse.json();

      setTags(tagsData.data || []);
      setNodes(nodesData.data || []);
      setApis(apisData.data || []);
      setTests(testsData.data || []);
      
      setError(null);
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError("데이터 로드에 실패했습니다.");
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

  // 5분마다 자동 갱신
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // 태그 파싱 헬퍼 함수
  const parseTags = (tagData: string | string[] | null | undefined): string[] => {
    if (!tagData) return [];
    
    let parsedTags: string[] = [];
    if (typeof tagData === 'string') {
      const trimmed = tagData.trim();
      if (trimmed) {
        if (trimmed.startsWith('[')) {
          try {
            parsedTags = JSON.parse(trimmed);
          } catch (e) {
            parsedTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
          }
        } else {
          parsedTags = trimmed.split(',').map(t => t.trim()).filter(t => t);
        }
      }
    } else if (Array.isArray(tagData)) {
      parsedTags = tagData;
    }
    
    return parsedTags;
  };

  // 태그별 사용 정보 계산
  const tagsWithUsage = useMemo(() => {
    return tags.map((tag) => {
      // 노드에서 태그 사용 확인
      const nodesUsingTag = nodes.filter((node) => {
        const nodeTags = parseTags(node.tags);
        return nodeTags.includes(tag.tagName);
      });

      // API에서 태그 사용 확인
      const apisUsingTag = apis.filter((api) => {
        const apiTags = parseTags(api.tags);
        return apiTags.includes(tag.tagName);
      });

      // Synthetic Test에서 태그 사용 확인
      const testsUsingTag = tests.filter((test) => {
        const testTags = parseTags(test.tags);
        return testTags.includes(tag.tagName);
      });

      return {
        ...tag,
        nodes: nodesUsingTag,
        apis: apisUsingTag,
        tests: testsUsingTag,
      } as TagWithUsage;
    });
  }, [tags, nodes, apis, tests]);

  // 검색 필터링
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tagsWithUsage;
    }

    const query = searchQuery.toLowerCase();
    return tagsWithUsage.filter((tag) => {
      // 태그명으로 검색
      if (tag.tagName.toLowerCase().includes(query)) {
        return true;
      }

      // 노드명으로 검색
      if (tag.nodes.some(node => node.nodeName.toLowerCase().includes(query))) {
        return true;
      }

      // API명으로 검색
      if (tag.apis.some(api => api.apiName.toLowerCase().includes(query))) {
        return true;
      }

      // 테스트명으로 검색
      if (tag.tests.some(test => test.syntheticTestName.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    });
  }, [tagsWithUsage, searchQuery]);

  // 페이징 계산
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTags = filteredTags.slice(startIndex, endIndex);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // 더보기 클릭 핸들러
  const handleShowMore = (type: 'nodes' | 'apis' | 'tests', items: Node[] | Api[] | SyntheticTest[], tagName: string) => {
    let title = '';
    switch (type) {
      case 'nodes':
        title = `"${tagName}" 태그를 사용하는 노드 목록`;
        break;
      case 'apis':
        title = `"${tagName}" 태그를 사용하는 API 목록 `;
        break;
      case 'tests':
        title = `"${tagName}" 태그를 사용하는 Synthetic Test 목록 `;
        break;
    }
    
    setModalData({
      isOpen: true,
      title,
      type,
      items,
    });
  };

  // 태그 삭제 함수
  const deleteTag = async (tagId: number, tagName: string) => {
    if (!confirm(`"${tagName}" 태그를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = `태그 삭제 실패: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        
        throw new Error(errorMessage);
      }

      // 삭제 성공 시 목록에서 제거
      setTags(prev => prev.filter(t => t.tagId !== tagId));
      alert('태그가 성공적으로 삭제되었습니다.');
    } catch (e) {
      const message = e instanceof Error ? e.message : '태그 삭제에 실패했습니다.';
      console.error("태그 삭제 실패:", message);
      alert(`태그 삭제 실패: ${message}`);
    }
  };

  // 통계
  const stats = useMemo(() => {
    const totalTags = tags.length;
    const usedTags = tagsWithUsage.filter(
      tag => tag.nodes.length > 0 || tag.apis.length > 0 || tag.tests.length > 0
    ).length;
    const unusedTags = totalTags - usedTags;

    return { totalTags, usedTags, unusedTags };
  }, [tags.length, tagsWithUsage]);

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
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-1">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalTags}</div>
              <div className="text-sm text-gray-600 mt-1">전체 태그</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.usedTags}</div>
              <div className="text-sm text-gray-600 mt-1">사용 중인 태그</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.unusedTags}</div>
              <div className="text-sm text-gray-600 mt-1">미사용 태그</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">검색</CardTitle>
          <CardDescription>태그명, 노드명, API명, 테스트명으로 검색할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-gray-600 mt-2">
              검색 결과: {filteredTags.length}개
            </div>
          )}
        </CardContent>
      </Card>

      {/* 테이블 형식 태그 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>태그 목록</CardTitle>
            {/* 페이지당 항목 수 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">페이지당 항목 수:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 태그가 없습니다'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left p-3 font-semibold text-sm text-gray-700 w-40">
                        태그명
                      </th>
                      <th className="text-left p-3 font-semibold text-sm text-gray-700">
                        노드명
                      </th>
                      <th className="text-left p-3 font-semibold text-sm text-gray-700">
                        API명
                      </th>
                      <th className="text-left p-3 font-semibold text-sm text-gray-700">
                        Synthetic Test명
                      </th>
                      <th className="text-center p-3 font-semibold text-sm text-gray-700 w-24">
                        상태
                      </th>
                      <th className="text-center p-3 font-semibold text-sm text-gray-700 w-20">
                        삭제
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTags.map((tag, index) => (
                      <tr
                        key={tag.tagId}
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        {/* 태그명 */}
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{tag.tagName}</div>
                        </td>

                        {/* 노드 */}
                        <td className="p-3">
                          {tag.nodes.length === 0 ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : (
                            <div className="space-y-1">
                              {tag.nodes.slice(0, 2).map((node) => (
                                <div key={node.nodeId} className="flex items-center gap-1">
                                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                    {node.nodeName}
                                  </span>
                                </div>
                              ))}
                              {tag.nodes.length > 2 && (
                                <button
                                  onClick={() => handleShowMore('nodes', tag.nodes, tag.tagName)}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  +{tag.nodes.length - 2}개 더보기
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* API */}
                        <td className="p-3">
                          {tag.apis.length === 0 ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : (
                            <div className="space-y-1">
                              {tag.apis.slice(0, 2).map((api) => (
                                <div key={api.apiId} className="flex items-center gap-1">
                                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                    {api.apiName}
                                  </span>
                                </div>
                              ))}
                              {tag.apis.length > 2 && (
                                <button
                                  onClick={() => handleShowMore('apis', tag.apis, tag.tagName)}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  +{tag.apis.length - 2}개 더보기
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Synthetic Test */}
                        <td className="p-3">
                          {tag.tests.length === 0 ? (
                            <span className="text-xs text-gray-400">-</span>
                          ) : (
                            <div className="space-y-1">
                              {tag.tests.slice(0, 2).map((test) => (
                                <div key={test.syntheticTestId} className="flex items-center gap-1">
                                  <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                    {test.syntheticTestName}
                                  </span>
                                </div>
                              ))}
                              {tag.tests.length > 2 && (
                                <button
                                  onClick={() => handleShowMore('tests', tag.tests, tag.tagName)}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  +{tag.tests.length - 2}개 더보기
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 상태 */}
                        <td className="p-3 text-center">
                          {tag.nodes.length === 0 && tag.apis.length === 0 && tag.tests.length === 0 ? (
                            <Badge variant="outline" className="text-gray-500 bg-gray-100">
                              미사용
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">
                              사용중
                            </Badge>
                          )}
                        </td>

                        {/* 삭제 버튼 */}
                        <td className="p-3 text-center">
                          {tag.nodes.length === 0 && tag.apis.length === 0 && tag.tests.length === 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTag(tag.tagId, tag.tagName)}
                              className="hover:bg-red-50"
                              title="태그 삭제"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>  
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이징 컴포넌트 */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTags.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 더보기 모달 */}
      <Dialog open={modalData.isOpen} onOpenChange={(open) => setModalData({ ...modalData, isOpen: open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalData.title}</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse">
              <tbody>
                {modalData.type === 'nodes' && (
                  (modalData.items as Node[]).map((node, index) => (
                    <tr
                      key={node.nodeId}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">{node.nodeName}</td>
                    </tr>
                  ))
                )}
                
                {modalData.type === 'apis' && (
                  (modalData.items as Api[]).map((api, index) => (
                    <tr
                      key={api.apiId}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">{api.apiName}</td>
                    </tr>
                  ))
                )}
                
                {modalData.type === 'tests' && (
                  (modalData.items as SyntheticTest[]).map((test, index) => (
                    <tr
                      key={test.syntheticTestId}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">{test.syntheticTestName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setModalData({ ...modalData, isOpen: false })}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
