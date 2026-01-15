'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Play, Server, FileText } from 'lucide-react';
import { SyntheticTest, NodeGroup, Api, Node, SyntheticTestHistory } from '@/types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// ----------------------------------------------------------------------
// 📊 SyntheticTestResults 컴포넌트
// ----------------------------------------------------------------------

interface SyntheticTestResultsProps {
  syntheticTestId: number; // SyntheticTestPanel 에서 전달받는 유일한 식별자
  nodeId?: number; // 그룹 테스트인 경우 특정 노드 ID
  nodeName?: string; // 그룹 테스트인 경우 특정 노드 이름
  isGroupTest?: boolean; // 그룹 테스트 여부
  showNodeHeader?: boolean; // 노드 헤더 표시 여부
  onExecute: () => void; // 실행 요청 핸들러
  onNodeClick?: () => void; // 노드 클릭 핸들러
  // ✅ [추가] 시간 범위 필터
  timeRange?: 'all' | '1hour' | '6hours' | '24hours' | '7days' | '30days';
}

interface ChartDataPoint {
  time: string; // 차트에 표시될 시간
  responseTime: number; // 응답 시간
}

interface TestStats {
  totalExecutions: number;
  successRate: string; // % 문자열
  avgResponseTime: string; // ms 문자열
  alertCount: number;
}

export function SyntheticTestResults({ 
  syntheticTestId, 
  nodeId, 
  nodeName, 
  isGroupTest = false,
  showNodeHeader = false,
  onNodeClick,
  timeRange = 'all' // ✅ [추가] 기본값 'all'
}: SyntheticTestResultsProps) {
  // 로딩 상태 및 에러
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 로드될 데이터 상태
  const [test, setTest] = useState<SyntheticTest | null>(null);
  const [api, setApi] = useState<Api | null>(null);
  const [history, setHistory] = useState<SyntheticTestHistory[]>([]);
  
  // ✅ [추가] 상세 보기 다이얼로그 상태
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // SyntheticTest, Api, History 데이터를 동시에 로드하는 함수
  const fetchData = useCallback(async () => {
    setError(null);

    try {
      // 1. Synthetic Test 및 History 로드 (병렬)
      const [testRes, historyRes] = await Promise.all([
        fetch(`/api/synthetic-tests/${syntheticTestId}`),
        fetch(`/api/synthetic-tests/${syntheticTestId}/history`)
      ]);

      if (!testRes.ok) throw new Error(`테스트 정보 로드 실패: ${testRes.status}`);
      if (!historyRes.ok) throw new Error(`테스트 히스토리 로드 실패: ${historyRes.status}`);

      const loadedTest = await testRes.json();
      const loadedHistory = await historyRes.json();

      setTest(loadedTest.data);
      
      // API 응답 형식 처리 (data 속성 확인)
      const historyData = loadedHistory.data || loadedHistory || [];
      
      // 그룹 테스트이고 nodeId가 지정된 경우 해당 노드의 히스토리만 필터링
      if (isGroupTest && nodeId && Array.isArray(historyData)) {
        const filteredHistory = historyData.filter((h: SyntheticTestHistory) => h.nodeId === nodeId);
        setHistory(filteredHistory);
      } else {
        setHistory(Array.isArray(historyData) ? historyData : []);
      }

      // 2. API 정보 로드 (test 정보 로드 후 필요)
      if (loadedTest.data && loadedTest.data.apiId) {
        const apiRes = await fetch(`/api/apis/${loadedTest.data.apiId}`);
        if (!apiRes.ok) throw new Error(`API 정보 로드 실패: ${apiRes.status}`);
        
        const loadedApi = await apiRes.json();
        setApi(loadedApi.data);
      }

    } catch (err) {
      console.error(`테스트 ID ${syntheticTestId} 데이터 로딩 실패:`, err);
      setError(err instanceof Error ? err.message : "알 수 없는 데이터 로드 오류");
    }
  }, [syntheticTestId, nodeId, isGroupTest]);

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
    }, 300000); // 5분

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ✅ [추가] 시간 범위에 따라 히스토리 필터링
  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') {
      return history;
    }

    const now = new Date();
    const timeRangeMs: Record<string, number> = {
      '1hour': 60 * 60 * 1000,
      '6hours': 6 * 60 * 60 * 1000,
      '24hours': 24 * 60 * 60 * 1000,
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = new Date(now.getTime() - timeRangeMs[timeRange]);

    return history.filter((item) => {
      const executedDate = new Date(item.executedAt);
      return executedDate >= cutoffTime;
    });
  }, [history, timeRange]);

  // ------------------------------------
  // 통계 및 차트 데이터 계산 (✅ filteredHistory 사용)
  // ------------------------------------
  const { stats, chartData } = useMemo(() => {
    if (!filteredHistory.length || !test) {
      return {
        stats: { totalExecutions: 0, successRate: 'N/A', avgResponseTime: 'N/A', alertCount: 0 } as TestStats,
        chartData: [] as ChartDataPoint[],
      };
    }

    const totalExecutions = filteredHistory.length;
    let successCount = 0;
    let totalResponseTime = 0;
    let alertCount = 0;

    const chartData: ChartDataPoint[] = filteredHistory
      // 가장 최근 50개의 결과만 사용하고, 시간순으로 정렬 (차트 표시를 위해)
      .slice(0, 50) 
      .reverse() 
      .map((item) => {
        if (item.success === true) {
          successCount++;
        }
        totalResponseTime += item.responseTimeMs;
        
        // 응답 시간이 알럿 기준을 초과하면 알럿으로 간주
        if (item.responseTimeMs > test.alertThresholdMs) {
          alertCount++;
        }

        return {
          // ISO 문자열을 HH:mm:ss 형식으로 포맷 (간단하게)
          time: new Date(item.executedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          responseTime: item.responseTimeMs,
        };
      });

    const avgResponseTime = (totalResponseTime / totalExecutions).toFixed(2);
    const successRate = ((successCount / totalExecutions) * 100).toFixed(1);

    const stats: TestStats = {
      totalExecutions,
      successRate: `${successRate}`,
      avgResponseTime: `${avgResponseTime}`,
      alertCount,
    };

    return { stats, chartData };
  }, [filteredHistory, test]);

  // ------------------------------------
  // Render
  // ------------------------------------

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>테스트 데이터를 로드 중입니다...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-4 text-center text-red-600">
          <p>⚠️ **데이터 로드 실패:** {error}</p>
          <Button variant="link" onClick={fetchData}>다시 시도</Button>
        </CardContent>
      </Card>
    );
  }
  
  // test는 null이 될 수 없지만 TypeScript를 위해 확인
  if (!test || !api) return null; 

  return (
    <Card className="border-l-4 border-l-blue-400">
      {/* 노드 헤더 - 항상 표시 */}
      {showNodeHeader && nodeName && (
        <div className="bg-blue-50 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-white"
              onClick={onNodeClick}
            >
              <Server className="w-3 h-3 mr-1" />
              노드: {nodeName}
            </Badge>
            {stats.alertCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.alertCount} 알럿
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardDescription className="mt-1">
              {/* API 이름 및 실행 기준 정보 */}
              대상 API: **{api.apiName}** (매 **{test.intervalSeconds}초**, 알럿 기준: **{test.alertThresholdMs}ms**)
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[100px]">
            {/* ✅ [추가] 상세 보기 버튼 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsDetailDialogOpen(true)}
              disabled={filteredHistory.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              상세 보기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 응답 시간 차트 */}
        <div className="mb-6">
            <h4 className="text-base font-semibold mb-2">최근 응답 시간 추이</h4>
            {filteredHistory.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500 border rounded-lg">
                    <p>선택한 시간 범위에 실행 기록이 없습니다.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 11 }} />
                        <Tooltip 
                            formatter={(value) => [`${value}ms`, '응답 시간']} 
                            labelFormatter={(label) => `실행 시각: ${label}`}
                        />
                        <Legend verticalAlign="top" height={30} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                        <Line 
                            type="monotone" 
                            dataKey="responseTime" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                            name="응답 시간" 
                        />
                         {/* 알럿 기준선 */}
                         <Line 
                            type="monotone" 
                            dataKey={() => test.alertThresholdMs} // 기준 값을 상수 데이터 키로 사용
                            stroke="#dc2626" 
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={false}
                            legendType="line"
                            name={`기준 (${test.alertThresholdMs}ms)`} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center border-t pt-4">
          <div>
            <div className="text-xl font-bold text-blue-600">{stats.avgResponseTime}ms</div>
            <div className="text-xs text-gray-600">평균 응답시간</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{stats.successRate}%</div>
            <div className="text-xs text-gray-600">성공률</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-600">{stats.totalExecutions}</div>
            <div className="text-xs text-gray-600">총 실행 횟수</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${stats.alertCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {stats.alertCount}
            </div>
            <div className="text-xs text-gray-600">알럿 발생</div>
          </div>
        </div>
      </CardContent>

      {/* ✅ [추가] 상세 보기 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>실행 기록 상세 보기</DialogTitle>
            <DialogDescription>
              {nodeName ? `노드: ${nodeName} | ` : ''}
              총 {filteredHistory.length}개의 실행 기록
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                선택한 시간 범위에 실행 기록이 없습니다.
              </div>
            ) : (
              filteredHistory.slice(0, 20).map((item, index) => (
                <Card 
                  key={`${item.syntheticTestHistoryId || index}`}
                  className="border-l-4"
                  style={{ 
                    borderLeftColor: item.success ? '#10b981' : '#ef4444' 
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.success ? 'default' : 'destructive'}>
                            {item.success ? 'SUCCESS' : 'FAILED'}
                          </Badge>
                          <Badge variant="outline">
                            {item.responseTimeMs}ms
                          </Badge>
                          {item.responseTimeMs > test.alertThresholdMs && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              알럿
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {new Date(item.executedAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Request Data (Input) */}
                    {item.input && (
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <span className="text-blue-600">📤 요청 데이터 (Input)</span>
                        </div>
                        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40 border">
                          {JSON.stringify(item.input, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Response Data (Output) */}
                    {item.output && (
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <span className="text-green-600">📥 응답 데이터 (Output)</span>
                        </div>
                        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40 border">
                          {JSON.stringify(item.output, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error Message (if failed) */}
                    {!item.success && item.errorMessage && (
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                          <span className="text-red-600">❌ 에러 메시지</span>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs border border-red-200 dark:border-red-800">
                          {item.errorMessage}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            {filteredHistory.length > 20 && (
              <div className="text-center text-sm text-gray-500 py-4">
                최근 20개의 실행 기록만 표시됩니다. (총 {filteredHistory.length}개)
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}