'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TestHistory {
  syntheticTestHistoryId: number;
  syntheticTestId: number;
  nodeId: number;
  executedAt: string;
  responseTimeMs: number;
  success: boolean;
  statusCode: number;
  input?: string;
  output?: string;
  syntheticTestName?: string;
  alertThresholdMs?: number;
  nodeName?: string;
}

interface SearchParams {
  nodeName?: string;
  nodeGroupName?: string;
  tagName?: string;
  syntheticTestName?: string;
  notificationEnabled?: string;
  startDate?: string;
  endDate?: string;
}

interface TestHistoryDetailProps {
  initialTestId?: number;
}

export function TestHistoryDetail({ initialTestId }: TestHistoryDetailProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [histories, setHistories] = useState<TestHistory[]>([]);
  const [total, setTotal] = useState(0);
  
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);
  
  // 검색 파라미터
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  
  // 페이징
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 히스토리 검색
  const searchHistories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchParams.nodeGroupName) {
        params.append('nodeGroupName', searchParams.nodeGroupName);
      }
      
      if (searchParams.syntheticTestName) {
        params.append('syntheticTestName', searchParams.syntheticTestName);
      }
      
      if (searchParams.nodeName) {
        params.append('nodeName', searchParams.nodeName);
      }
      
      if (searchParams.tagName) {
        params.append('tagName', searchParams.tagName);
      }
      
      if (searchParams.notificationEnabled) {
        params.append('notificationEnabled', searchParams.notificationEnabled);
      }
      
      if (searchParams.startDate) {
        // 시작일은 00:00:00으로 설정
        const startDate = new Date(searchParams.startDate);
        startDate.setHours(0, 0, 0, 0);
        params.append('startDate', startDate.toISOString());
      }
      
      if (searchParams.endDate) {
        // 종료일은 23:59:59로 설정
        const endDate = new Date(searchParams.endDate);
        endDate.setHours(23, 59, 59, 999);
        params.append('endDate', endDate.toISOString());
      }
      
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      console.log('[TestHistoryDetail] Fetching:', `/api/history?${params.toString()}`);

      const response = await fetch(`/api/history?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TestHistoryDetail] HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        console.log('[TestHistoryDetail] Received', data.data?.length, 'items, total:', data.total);
        console.log('[TestHistoryDetail] Current page:', currentPage, 'Items per page:', itemsPerPage);
        
        // 중복 제거 (혹시 모를 경우를 대비)
        const uniqueHistories = data.data ? 
          Array.from(new Map(data.data.map((h: TestHistory) => [h.syntheticTestHistoryId, h])).values()) 
          : [];
        
        if (uniqueHistories.length !== data.data?.length) {
          console.warn('[TestHistoryDetail] Removed duplicates:', data.data?.length, '->', uniqueHistories.length);
        }
        
        setHistories(uniqueHistories);
        setTotal(data.total || 0);
      } else {
        console.error('[TestHistoryDetail] 검색 실패:', data.error, data.message);
        alert(`검색 실패: ${data.message || data.error}`);
        setHistories([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('[TestHistoryDetail] 히스토리 검색 실패:', error);
      alert(`히스토리 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setHistories([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, currentPage, itemsPerPage]);
  
  // initialTestId가 변경되면 검색 파라미터 업데이트
  useEffect(() => {
    if (initialTestId) {
      setSearchParams(prev => ({
        ...prev,
        syntheticTestId: initialTestId,
      }));
    }
  }, [initialTestId]);

  // initialTestId가 있으면 자동 검색
  useEffect(() => {
    if (initialTestId && histories.length === 0) {
      searchHistories();
    }
  }, [initialTestId]);

  // 페이지 변경 시 검색 (검색 결과가 있을 때만)
  useEffect(() => {
    if (histories.length > 0) {
      searchHistories();
    }
  }, [currentPage]);

  // 페이지당 항목 수 변경 시 첫 페이지로 이동하고 검색 (검색 결과가 있을 때만)
  useEffect(() => {
    if (histories.length > 0) {
      setCurrentPage(1);
      searchHistories();
    }
  }, [itemsPerPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* 검색 조건 */}
      <Card>
        <CardHeader>
          <CardTitle>통합테스트 상세조회</CardTitle>
          {/* 검색 버튼 */}
          <div className="flex justify-end">
            <Button onClick={() => { setCurrentPage(1); searchHistories(); }} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              검색
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>노드</Label>
              </div>
              <Input
                type="text"
                placeholder="노드명 검색"
                value={searchParams.nodeName || ''}
                onChange={(e) => setSearchParams({ ...searchParams, nodeName: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>노드 그룹</Label>
              </div>
              <Input
                type="text"
                placeholder="노드 그룹명 검색"
                value={searchParams.nodeGroupName || ''}
                onChange={(e) => setSearchParams({ ...searchParams, nodeGroupName: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>태그</Label>
              </div>
              <Input
                type="text"
                placeholder="태그명 검색"
                value={searchParams.tagName || ''}
                onChange={(e) => setSearchParams({ ...searchParams, tagName: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Synthetic Test</Label>
              </div>
              <Input
                type="text"
                placeholder="테스트명 검색"
                value={searchParams.syntheticTestName || ''}
                onChange={(e) => setSearchParams({ ...searchParams, syntheticTestName: e.target.value || undefined})}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>알림 여부</Label>
              </div>
              <Select
                value={searchParams.notificationEnabled || "all"}
                onValueChange={(v) => setSearchParams({ 
                  ...searchParams, 
                  notificationEnabled: v === "all" ? undefined : v
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="N">알림 발생</SelectItem>
                  <SelectItem value="Y">정상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>조회 기간</Label>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={searchParams.startDate || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value || undefined })}
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="date"
                  value={searchParams.endDate || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value || undefined })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>검색 결과</CardTitle>
              <CardDescription>
                총 {total}건
              </CardDescription>
            </div>
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
          
        {/* 결과 테이블 */}
        {histories.length > 0 ? (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">실행 시간</th>
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">테스트명</th>
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">노드</th>
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">응답 시간</th>
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">상태</th>
                    <th className="text-left p-3 font-semibold text-sm text-gray-700">상태 코드</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.map((history, index) => {
                    const isAlert = !history.success || (history.alertThresholdMs && history.responseTimeMs > history.alertThresholdMs);
                    
                    return (
                      <tr
                        key={history.syntheticTestHistoryId}
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="p-3 text-sm">
                          {new Date(history.executedAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {history.syntheticTestName}
                        </td>
                        <td className="p-3 text-sm">
                          {history.nodeName}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={isAlert ? 'destructive' : 'secondary'}>
                            {history.responseTimeMs}ms
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={history.success ? 'default' : 'destructive'}>
                            {history.success ? '성공' : '실패'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {history.statusCode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이징 컴포넌트 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        ) : (
          <CardContent className="p-12 text-center text-gray-500">
            {isLoading ? (
              <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            ) : (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>검색 조건을 설정하고 검색 버튼을 클릭하세요</p>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
