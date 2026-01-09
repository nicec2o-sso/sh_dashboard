import { 
  SyntheticTest, 
  CreateSyntheticTestDto, 
  UpdateSyntheticTestDto,
  ApiExecutionResult,
  SyntheticTestHistory,
  
} from '@/types';
import { ApiService } from './apiService';
import { ApiParameterService } from './apiParameterService';
import { WebClient } from './webClient';

// 샘플 데이터
let syntheticTests: SyntheticTest[] = [
  { 
    syntheticTestId: 1, 
    syntheticTestName: 'Web Health Monitor', 
    targetId: 1, 
    targetType: 'node',
    apiId: 1, 
    tags: ['production', 'critical'], 
    intervalSeconds: 60, 
    alertThresholdMs: 100,
    createdAt: new Date().toISOString(),
  },
  { 
    syntheticTestId: 2, 
    syntheticTestName: 'DB Performance111', 
    targetId: 3, 
    targetType: 'group',
    apiId: 3, 
    tags: ['database', 'OpenSource', 'production'], 
    intervalSeconds: 300, 
    alertThresholdMs: 100,
    createdAt: new Date().toISOString(),
  },
  { 
    syntheticTestId: 3, 
    syntheticTestName: 'DB Performance 333', 
    targetId: 3, 
    targetType: 'group',
    apiId: 3, 
    tags: ['database', 'OpenSource', 'production'], 
    intervalSeconds: 300, 
    alertThresholdMs: 100,
    createdAt: new Date().toISOString(),
  },
  { 
    syntheticTestId: 4, 
    syntheticTestName: 'DB Performance 444', 
    targetId: 3, 
    targetType: 'group',
    apiId: 3, 
    tags: ['database', 'OpenSource', 'production'], 
    apiParameterValues: {3:"value1", 4:"value2"},
    intervalSeconds: 300, 
    alertThresholdMs: 100,
    createdAt: new Date().toISOString(),
  },
];

let nextTestId = 5;
let testHistory: SyntheticTestHistory[] = [];
let nextResultId = 1;

// 샘플 테스트 결과 생성
const generateSampleTestResults = (nodeId: number, syntheticTestId: number, nodeName: string, hours = 24): SyntheticTestHistory[] => {
  const results: SyntheticTestHistory[] = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    results.push({
      syntheticTestHistoryId: nextResultId++,
      syntheticTestId,
      nodeId,
      statusCode: 200,
      success: true,
      responseTimeMs: Math.floor(Math.random() * 300) + 50,
      executedAt: new Date(now - i * 3600000).toISOString(),
      input: JSON.stringify({ message: `Sample input for ${nodeName}` }),
      output: JSON.stringify({ message: `Sample response from ${nodeName}` }),
    });
  }
  return results;
};

// 초기 샘플 결과 생성
testHistory = [
  ...generateSampleTestResults(1, 1, "my-node1"),
  ...generateSampleTestResults(2, 2, "my-node2"),
  ...generateSampleTestResults(3, 2, "my-node3"),
  ...generateSampleTestResults(3, 2, "my-node4"),
  ...generateSampleTestResults(3, 2, "my-node5"),
  ...generateSampleTestResults(4, 2, "my-node6"),
];

export class SyntheticTestService {
  /**
   * 모든 합성 테스트 조회
   */
  static getAllTests(): SyntheticTest[] {
    console.log('SyntheticTestService getAllTests called');
    return [...syntheticTests];
  }

  /**
   * ID로 합성 테스트 조회
   */
  static getTestById(syntheticTestId: number): SyntheticTest | null {
    console.log('SyntheticTestService getTestById called with id:', syntheticTestId);
    return syntheticTests.find(test => test.syntheticTestId === syntheticTestId) || null;
  }

  /**
   * 합성 테스트 생성
   */
  static createTest(dto: CreateSyntheticTestDto): SyntheticTest | null {
    console.log('SyntheticTestService createTest called with dto:', dto);
    // API 존재 여부 확인
    if (!ApiService.getApiById(dto.apiId)) {
      return null;
    }

    const newTest: SyntheticTest = {
      syntheticTestId: nextTestId++,
      syntheticTestName: dto.syntheticTestName,
      targetType: dto.targetType,
      targetId: dto.targetId,
      apiId: dto.apiId,
      tags: dto.tags,
      intervalSeconds: dto.intervalSeconds,
      alertThresholdMs: dto.alertThresholdMs,
      createdAt: new Date().toISOString(),
    };

    syntheticTests.push(newTest);
    return newTest;
  }

  /**
   * 합성 테스트 수정
   */
  static updateTest(syntheticTestId: number, dto: UpdateSyntheticTestDto): SyntheticTest | null {
    console.log('SyntheticTestService updateTest called with id:', syntheticTestId, 'dto:', dto);
    const testIndex = syntheticTests.findIndex(test => test.syntheticTestId === syntheticTestId);
    if (testIndex === -1) return null;

    // API가 변경된 경우 존재 여부 확인
    if (dto.apiId && !ApiService.getApiById(dto.apiId)) {
      return null;
    }

    syntheticTests[testIndex] = {
      ...syntheticTests[testIndex],
      ...dto,
    };

    return syntheticTests[testIndex];
  }

  /**
   * 합성 테스트 삭제
   */
  static deleteTest(syntheticTestId: number): boolean {
    console.log('SyntheticTestService deleteTest called with id:', syntheticTestId);
    const initialLength = syntheticTests.length;
    syntheticTests = syntheticTests.filter(test => test.syntheticTestId !== syntheticTestId);
    
    // 관련 테스트 결과도 삭제
    testHistory = testHistory.filter(result => result.syntheticTestId !== syntheticTestId);
    
    return syntheticTests.length < initialLength;
  }

  /**
   * 태그로 테스트 조회
   */
  static getTestsByTag(tag: string): SyntheticTest[] {
    console.log('SyntheticTestService getTestsByTag called with tag:', tag);
    return syntheticTests.filter(test => test.tags.includes(tag));
  }

  /**
   * API별 테스트 조회
   */
  static getTestsByApi(apiId: number): SyntheticTest[] {
    console.log('SyntheticTestService getTestsByApi called with apiId:', apiId);
    return syntheticTests.filter(test => test.apiId === apiId);
  }

  /**
   * 테스트 실행
   */
  static async executeTest(
    testId: number,
    parameters: { targetNode: any; parsedParams: Record<string, string> }
  ): Promise<ApiExecutionResult> {
    console.log('SyntheticTestService executeTest called with testId:', testId);
    const test = this.getTestById(testId);
    if (!test) throw new Error('테스트를 찾을 수 없습니다');

    const api = ApiService.getApiById(test.apiId);
    if (!api) throw new Error('API를 찾을 수 없습니다');

    // ===== 수정된 부분: ApiParameterService를 사용한 필수 파라미터 검증 =====
    const apiParameters = ApiParameterService.getParametersByIds(api.apiParameterIds);
    const requiredParams = apiParameters.filter(p => p.apiParameterRequired);
    
    for (const param of requiredParams) {
      if (!parameters?.parsedParams || !(param.apiParameterName in parameters.parsedParams)) {
        throw new Error(`필수 파라미터가 누락되었습니다: ${param.apiParameterName}`);
      }
    }
    // ===== 수정 끝 =====

    // 또는 ApiService의 validateApiParameters 메서드 사용 (더 간결한 방법)
    // const validation = ApiService.validateApiParameters(test.apiId, parameters?.parsedParams || {});
    // if (!validation.valid) {
    //   throw new Error(validation.errors.join(', '));
    // }

    const url = `http://${parameters.targetNode.host}:${parameters.targetNode.port}${api.uri}`;
    let apiExecutionResult: ApiExecutionResult;
    
    if (api.method === 'GET') {
      const queryParams = new URLSearchParams(parameters.parsedParams).toString();
      const fullUrl = queryParams ? `${url}?${queryParams}` : url;
      apiExecutionResult = await WebClient.get<ApiExecutionResult>(fullUrl);
      
    } else if (api.method === 'POST') {
      apiExecutionResult = await WebClient.post<ApiExecutionResult>(url, { data: parameters.parsedParams });

    } else if (api.method === 'PUT') {
      apiExecutionResult = await WebClient.put<ApiExecutionResult>(url, { data: parameters.parsedParams });
        
    } else if (api.method === 'DELETE') {
      const queryParams = new URLSearchParams(parameters.parsedParams).toString();
      const fullUrl = queryParams ? `${url}?${queryParams}` : url;
      apiExecutionResult = await WebClient.delete<ApiExecutionResult>(fullUrl);
    } else {
      throw new Error('지원하지 않는 HTTP 메서드입니다');
    }

    return {
      nodeId: parameters.targetNode.id,
      nodeName: parameters.targetNode.name,
      responseTimeMs: apiExecutionResult.responseTimeMs,
      statusCode: apiExecutionResult.statusCode,
      success: apiExecutionResult.success,
      data: apiExecutionResult.data,
    };
  }

  /**
   * 테스트 결과 조회
   */
  static getTestResults(
    syntheticTestId: number, 
    options?: {
      nodeId?: number;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): SyntheticTestHistory[] {
    console.log('SyntheticTestService - SyntheticTestHistory called with syntheticTestId:', syntheticTestId, 'options:', options);
    let results = testHistory.filter(history => history.syntheticTestId === syntheticTestId);

    if (options?.nodeId) {
      results = results.filter(result => result.nodeId === options.nodeId);
    }

    if (options?.startDate) {
      results = results.filter(result => 
        new Date(result.executedAt) >= options.startDate!
      );
    }

    if (options?.endDate) {
      results = results.filter(result => 
        new Date(result.executedAt) <= options.endDate!
      );
    }

    // 최신순 정렬
    results.sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * 노드별 테스트 결과 조회
   */
  static getResultsByNode(nodeId: number, limit?: number): SyntheticTestHistory[] {
    console.log('SyntheticTestService getResultsByNode called with nodeId:', nodeId, 'limit:', limit);
    let results = testHistory.filter(history => history.nodeId === nodeId);
    
    results.sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * 테스트 통계 조회
   */
  static getTestStatistics(testId: number, hours = 24) {
    console.log('SyntheticTestService getTestStatistics called with testId:', testId, 'hours:', hours);
    const startDate = new Date(Date.now() - hours * 3600000);
    const results = this.getTestResults(testId, { startDate });

    if (results.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
      };
    }

    const successCount = results.filter(r => r.success).length;
    const responseTimes = results.map(r => r.responseTimeMs);

    return {
      totalExecutions: results.length,
      successRate: (successCount / results.length) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / results.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
    };
  }

  /**
   * 알림이 필요한 테스트 결과 조회
   */
  static getAlertsForTest(testId: number): SyntheticTestHistory[] {
    console.log('SyntheticTestService getAlertsForTest called with testId:', testId);
    const test = this.getTestById(testId);
    if (!test) return [];

    const recentResults = this.getTestResults(testId, { limit: 10 });
    
    return recentResults.filter(result => 
      !result.success || result.responseTimeMs > test.alertThresholdMs
    );
  }

  /**
   * 모든 활성 테스트의 최근 상태 조회
   */
  static getAllTestsStatus() {
    console.log('SyntheticTestService getAllTestsStatus called');
    return syntheticTests.map(test => {
      const recentResults = this.getTestResults(test.syntheticTestId, { limit: 5 });
      const stats = this.getTestStatistics(test.syntheticTestId, 1); // 최근 1시간

      return {
        test,
        recentResults,
        statistics: stats,
        hasAlerts: this.getAlertsForTest(test.syntheticTestId).length > 0,
      };
    });
  }
}