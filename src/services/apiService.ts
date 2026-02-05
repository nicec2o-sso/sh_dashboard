import { Api, ApiExecutionResult, ApiParameterInput } from '@/types';
import { WebClient, WebClientResponse } from './webClient';
import { ApiParameterService } from './apiParameterService';
import { ApiServiceDB } from '@/services/apiService.database';
import { ApiParameterServiceDB } from './apiParameterService.database';
import { checkHostHealth } from '@/lib/healthCheck';

// 샘플 데이터
let apis: Api[] = [];

let nextApiId = 4;

export class ApiService {
  static getAllApis(): Api[] {
    return [...apis];
  }

  static createApi(data: {
    apiName: string;
    uri: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    parameters?: ApiParameterInput[];
  }): Api {
    console.log('ApiService createApi called with data:', data);

    const parameterIds = data.parameters && data.parameters.length > 0
      ? ApiParameterService.createParameters(data.parameters)
      : [];

    console.log('새로 생성된 파라미터 IDs:', parameterIds);

    const newApi: Api = {
      apiId: nextApiId++,
      apiName: data.apiName,
      uri: data.uri,
      method: data.method,
      tags: '',
      apiParameterIds: parameterIds,
    };

    apis.push(newApi);
    console.log('Created API:', newApi);
    return newApi;
  }

  static async executeApi(
      apiId: number, 
      parameters: { 
          targetNode: { nodeId: number, host: string, port: number, nodeName: string }, 
          parsedParams: Record<string, any>,
          syntheticTestId?: number,
          clientIp?: string
      }
  ): Promise<ApiExecutionResult> {
      console.log('ApiService executeApi called with apiId:', apiId, 'parameters:', parameters);
      const api = await ApiServiceDB.getApiById(apiId);
      if (!api) throw new Error('API를 찾을 수 없습니다');

      // API 파라미터 검증
      console.log('api:', api, 'apiParameterIds:', api.apiParameterIds);
      const apiParameters = await ApiParameterServiceDB.getParametersByIds(api.apiParameterIds);
      console.log('apiParameters:', apiParameters);
      const requiredParams = apiParameters.filter(p => p.apiParameterRequired);
      console.log('requiredParams:', requiredParams);
      
      console.log('필수 파라미터 검증');
      for (const param of requiredParams) {
          if (!parameters?.parsedParams || !(param.apiParameterName in parameters.parsedParams)) {
              throw new Error(`필수 파라미터가 누락되었습니다: ${param.apiParameterName}`);
          }
      }

      // // ===== 호스트 헬스 체크 =====
      // console.log('호스트 헬스 체크 시작...');
      // const healthCheck = await checkHostHealth(parameters.targetNode.host, parameters.targetNode.port);
      
      // if (!healthCheck.success) {
      //     const errorMessage = healthCheck.errorMessage || '호스트 연결 실패';
      //     console.error('호스트 헬스 체크 실패:', errorMessage);
          
      //     // 헬스 체크 실패 시 히스토리에 저장
      //     if (parameters.syntheticTestId) {
      //         try {
      //             const { SyntheticTestHistoryService } = await import('./syntheticTestHistoryService');
      //             await SyntheticTestHistoryService.createHistory({
      //                 syntheticTestId: parameters.syntheticTestId,
      //                 nodeId: parameters.targetNode.nodeId,
      //                 statusCode: 503, // Service Unavailable
      //                 success: false,
      //                 responseTimeMs: healthCheck.responseTimeMs,
      //                 input: JSON.stringify({
      //                     apiId,
      //                     method: api.method,
      //                     uri: api.uri,
      //                     parameters: parameters.parsedParams,
      //                     targetNode: {
      //                         nodeId: parameters.targetNode.nodeId,
      //                         host: parameters.targetNode.host,
      //                         port: parameters.targetNode.port,
      //                         nodeName: parameters.targetNode.nodeName
      //                     },
      //                     healthCheck: {
      //                         checkType: healthCheck.checkType,
      //                         success: false,
      //                     }
      //                 }),
      //                 errorMessage: `[${healthCheck.checkType.toUpperCase()} 헬스 체크 실패] ${errorMessage}`,
      //             });
      //         } catch (saveError) {
      //             console.error('히스토리 저장 중 오류:', saveError);
      //         }
      //     }
          
      //     throw new Error(`[${healthCheck.checkType.toUpperCase()} 헬스 체크 실패] ${errorMessage}`);
      // }
      
      // console.log(`호스트 헬스 체크 성공 (${healthCheck.checkType}): ${healthCheck.responseTimeMs}ms`);
      // // ===== 헬스 체크 끝 =====

      const startTime = Date.now();
      console.log('startTime:', startTime);
      const input = JSON.stringify({
          apiId,
          method: api.method,
          uri: api.uri,
          parameters: parameters.parsedParams,
          targetNode: {
              nodeId: parameters.targetNode.nodeId,
              host: parameters.targetNode.host,
              port: parameters.targetNode.port,
              nodeName: parameters.targetNode.nodeName
          }
          //,healthCheck: {
          //     checkType: healthCheck.checkType,
          //     success: true,
          //     responseTimeMs: healthCheck.responseTimeMs,
          // }
      });
      console.log('input:', input);

      let result: ApiExecutionResult;

      try {
          // 실제 API 호출
          console.log(`Calling API : ${api.method} ${api.uri} on node ${parameters.targetNode.nodeName} (${parameters.targetNode.host}:${parameters.targetNode.port}) with params:`, parameters.parsedParams);
          
          // WHATWG URL API 사용하여 URL 생성
          const baseUrl = new URL(`http://${parameters.targetNode.host}:${parameters.targetNode.port}${api.uri}`);
          let responseData: WebClientResponse;

          if (api.method === 'GET') {
              // URL 객체의 searchParams를 사용하여 쿼리 파라미터 추가
              console.log('GET:', baseUrl.toString(),parameters.parsedParams);
              Object.entries(parameters.parsedParams).forEach(([key, value]) => {
                  baseUrl.searchParams.append(key, String(value));
              });
              console.log('GET:', baseUrl.toString());
              responseData = await WebClient.get<WebClientResponse>(baseUrl.toString());
          } else if (api.method === 'POST') {
              console.log('POST:', baseUrl.toString(), parameters.parsedParams);
              responseData = await WebClient.post<WebClientResponse>(baseUrl.toString(), parameters.parsedParams);
          } else if (api.method === 'PUT') {
              console.log('PUT:', baseUrl.toString(), parameters.parsedParams);
              responseData = await WebClient.put<WebClientResponse>(baseUrl.toString(), parameters.parsedParams);
          } else if (api.method === 'DELETE') {
              // URL 객체의 searchParams를 사용하여 쿼리 파라미터 추가
              console.log('DELETE:', baseUrl.toString(),parameters.parsedParams);
              Object.entries(parameters.parsedParams).forEach(([key, value]) => {
                  baseUrl.searchParams.append(key, String(value));
              });
              console.log('DELETE:', baseUrl.toString());
              responseData = await WebClient.delete<WebClientResponse>(baseUrl.toString());
          } else {
              throw new Error('지원하지 않는 HTTP 메서드입니다');
          }

          const responseTimeMs = Date.now() - startTime;
          console.log('responseTimeMs:', responseTimeMs);

          result = {
              nodeId: parameters.targetNode.nodeId,
              nodeName: parameters.targetNode.nodeName,
              statusCode: responseData.statusCode,
              success: responseData.success,
              responseTimeMs,
              data: responseData.data,
          };

          // MT_SYNTHETIC_TEST_HISTORY 테이블에 저장 (성공한 경우)
          const { SyntheticTestHistoryServiceDB } = await import('./syntheticTestHistoryService.database');
          await SyntheticTestHistoryServiceDB.createHistory({
              syntheticTestId: parameters.syntheticTestId,
              nodeId: parameters.targetNode.nodeId,
              statusCode: result.statusCode,
              success: result.success,
              responseTimeMs: result.responseTimeMs,
              input,
              output: JSON.stringify(result.data),
              clientIp: parameters.clientIp || '0.0.0.0',
          });

          return result;

      } catch (error: any) {
          const responseTimeMs = Date.now() - startTime;
          const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다';
          
          result = {
              nodeId: parameters.targetNode.nodeId,
              nodeName: parameters.targetNode.nodeName,
              statusCode: error.response?.status || 500,
              success: false,
              responseTimeMs,
              data: null,
          };

          // MT_SYNTHETIC_TEST_HISTORY 테이블에 저장 (실패한 경우)
          // syntheticTestId가 없는 경우(수동 테스트)도 저장
          try {
              const { SyntheticTestHistoryServiceDB } = await import('./syntheticTestHistoryService.database');
              await SyntheticTestHistoryServiceDB.createHistory({
                  syntheticTestId: parameters.syntheticTestId, // undefined도 허용
                  nodeId: parameters.targetNode.nodeId,
                  statusCode: result.statusCode,
                  success: false,
                  responseTimeMs: result.responseTimeMs,
                  input,
                  output: errorMessage,
                  clientIp: parameters.clientIp || '0.0.0.0',
              });
          } catch (saveError) {
              console.error('히스토리 저장 중 오류:', saveError);
          }

          // 에러를 그대로 throw하여 화면에서 출력할 수 있도록 함
          throw new Error(errorMessage);
      }
  }

  static updateApi(
    apiId: number,
    data: {
      apiName?: string;
      uri?: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      parameters?: ApiParameterInput[];
    }
  ): Api | null {
    console.log('ApiService updateApi called with apiId:', apiId, 'data:', data);

    const apiIndex = apis.findIndex(api => api.apiId === apiId);
    if (apiIndex === -1) {
      console.error('API not found:', apiId);
      return null;
    }

    const existingApi = apis[apiIndex];
    console.log('Existing API:', existingApi);

    let updatedParameterIds = existingApi.apiParameterIds;
    
    if (data.parameters !== undefined) {
      if (data.parameters.length > 0) {
        updatedParameterIds = ApiParameterService.updateParameters(
          existingApi.apiParameterIds,
          data.parameters
        );
        console.log('Updated parameter IDs:', updatedParameterIds);
      } else {
        if (existingApi.apiParameterIds.length > 0) {
          ApiParameterService.deleteParametersByIds(existingApi.apiParameterIds);
          updatedParameterIds = [];
          console.log('Deleted all parameters');
        }
      }
    }

    apis[apiIndex] = {
      ...existingApi,
      apiName: data.apiName ?? existingApi.apiName,
      uri: data.uri ?? existingApi.uri,
      method: data.method ?? existingApi.method,
      apiParameterIds: updatedParameterIds,
    };

    console.log('Updated API:', apis[apiIndex]);
    return apis[apiIndex];
  }

  static deleteApi(apiId: number): boolean {
    console.log('ApiService deleteApi called with apiId:', apiId);

    const api = this.getApiById(apiId);
    if (!api) return false;

    if (api.apiParameterIds.length > 0) {
      const deletedCount = ApiParameterService.deleteParametersByIds(api.apiParameterIds);
      console.log(`Deleted ${deletedCount} parameters`);
    }

    const initialLength = apis.length;
    apis = apis.filter(a => a.apiId !== apiId);
    return apis.length < initialLength;
  }

  static searchApisByName(searchTerm: string): Api[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return apis.filter(api => 
      api.apiName.toLowerCase().includes(lowerSearchTerm) ||
      api.uri.toLowerCase().includes(lowerSearchTerm)
    );
  }

  static getApisByMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Api[] {
    return apis.filter(api => api.method === method);
  }

  static getApiById(apiId: number): Api | null {
    return apis.find(api => api.apiId === apiId) || null;
  }
}
