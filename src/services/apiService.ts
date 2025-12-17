import { Api, ApiExecutionResult } from '@/types';
import { WebClientResponse } from './webClient';
import { ApiParameterService } from './apiParameterService';

// 샘플 데이터
let apis: Api[] = [
  {
    id: 1,
    name: 'User List API',
    uri: '/api/users',
    method: 'GET',
    apiParameterIds: [1, 2], // userId, includeDetails
  },
  {
    id: 2,
    name: 'Database Query API',
    uri: '/api/query',
    method: 'POST',
    apiParameterIds: [3, 4, 5], // query, database, timeout
  },
  {
    id: 3,
    name: 'Healthcheck',
    uri: '/api/query',
    method: 'POST',
    apiParameterIds: [3, 4, 5], // query, database, timeout
  },
];

let nextApiId = 3;

export class ApiService {
  /**
   * 모든 API 조회
   */
  static getAllApis(): Api[] {
    return [...apis];
  }

  /**
   * ID로 API 조회
   */
  static getApiById(id: number): Api | null {
    return apis.find(api => api.id === id) || null;
  }

  /**
   * API 생성 (파라미터도 완전히 새로 생성됨)
   * 
   * @param data.parameters - ID 없는 파라미터 데이터, 백엔드에서 새 ID로 생성됨
   */
  static createApi(data: {
    name: string;
    uri: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    parameters?: Array<{
      name: string;
      type: 'query' | 'body';
      required: boolean;
      description: string;
    }>;
  }): Api {
    console.log('ApiService createApi called with data:', data);

    // ✅ 파라미터 생성 (새로운 ID들이 할당됨)
    const parameterIds = data.parameters && data.parameters.length > 0
      ? ApiParameterService.createParameters(data.parameters)
      : [];

    console.log('새로 생성된 파라미터 IDs:', parameterIds);

    const newApi: Api = {
      id: nextApiId++,
      name: data.name,
      uri: data.uri,
      method: data.method,
      apiParameterIds: parameterIds, // ✅ 완전히 새로운 파라미터 ID들
    };

    apis.push(newApi);
    console.log('Created API:', newApi);
    return newApi;
  }

  /**
   * API 실행 메서드 리팩토링
   * @param apiId 실행할 API ID
   * @param parameters 클라이언트에서 전달된 전체 파라미터 객체 { targetNode: Node, parsedParams: Record<string, string> }
   * @returns API 실행 결과 (ApiExecutionResult 인터페이스 사용)
   */
  static async executeApi(
      apiId: number, 
      parameters: { 
          targetNode: { id: number, host: string, port: number, name: string }, 
          parsedParams: Record<string, any> 
      }
  ): Promise<ApiExecutionResult> {

      console.log('ApiService executeApi called with apiId:', apiId, 'parameters:', parameters);
      const api = this.getApiById(apiId);
      if (!api) throw new Error('API를 찾을 수 없습니다');

      // 파라미터 검증 로직은 이미 서버 라우트(apis/[id]/execute/route.ts)에서 처리되었음을 가정합니다.
      
      const url = `http://${parameters.targetNode.host}:${parameters.targetNode.port}${api.uri}`;
      let webClientResponse: WebClientResponse;
      
      // --- 실제 구현 ---
      // const isBodyMethod = api.method === 'POST' || api.method === 'PUT';
      // console.log(`Executing API on Node ${parameters.targetNode.id} - URL: ${url}, Method: ${api.method}, IsBodyMethod: ${isBodyMethod}`);

      // try {
      //     if(api.method === 'GET' || api.method === 'DELETE') {
      //         const queryParams = new URLSearchParams(parameters.parsedParams).toString();
      //         const fullUrl = queryParams ? `${url}?${queryParams}` : url;
  
      //         if (api.method === 'GET') {
      //             console.log(`Sending GET request to URL: ${fullUrl}`);
      //             webClientResponse = await WebClient.get<WebClientResponse>(fullUrl);
      //             console.log(`GET request to ${fullUrl} completed with status ${webClientResponse.statusCode}`);
      //         } else { // DELETE
      //             webClientResponse = await WebClient.delete<WebClientResponse>(fullUrl);
      //         }
            
      //     } else if (isBodyMethod) {
      //         const payload = parameters.parsedParams;
  
      //         if (api.method === 'POST') {
      //             webClientResponse = await WebClient.post<WebClientResponse>(url, { data: payload });
      //         } else { // PUT
      //             webClientResponse = await WebClient.put<WebClientResponse>(url, { data: payload });
      //         }
      //     } else {
      //         throw new Error('지원하지 않는 HTTP 메서드입니다');
      //     }
      // } catch (error) {
      //     // WebClient 통신 자체에 오류가 발생한 경우 (네트워크 오류, 타임아웃 등)
      //     console.log(`WebClient 통신 오류: ${error}`);
          
      //     // ApiExecutionResult 형태로 반환
      //     return {
      //         nodeId: parameters.targetNode.id,
      //         nodeName: parameters.targetNode.name,
      //         statusCode: 500, // 통신 오류도 500으로 처리
      //         success: false,
      //         responseTimeMs: 0,
      //         data: { error: `통신 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      //     };
      // }
      
      // ApiExecutionResult 인터페이스에 맞춰 결과 반환
      // return {
      //     nodeId: parameters.targetNode.id,
      //     nodeName: parameters.targetNode.name,
      //     statusCode: webClientResponse.statusCode,
      //     success: webClientResponse.success, 
      //     responseTimeMs: webClientResponse.responseTimeMs, 
      //     data: webClientResponse.data,
      // };

      // dummy Data
      return {
          nodeId: parameters.targetNode.id,
          nodeName: parameters.targetNode.name,
          statusCode: 200,
          success: true,
          responseTimeMs: 123,
          data: { message: 'API executed successfully (dummy data)' },
      };  
  }

  /**
   * ✅ API 수정 - 파라미터 ID를 유지하면서 내용만 업데이트
   */
  static updateApi(
    id: number,
    data: {
      name?: string;
      uri?: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      parameters?: Array<{
        name: string;
        type: 'query' | 'body';
        required: boolean;
        description: string;
      }>;
    }
  ): Api | null {
    console.log('ApiService updateApi called with id:', id, 'data:', data);

    const apiIndex = apis.findIndex(api => api.id === id);
    if (apiIndex === -1) {
      console.error('API not found:', id);
      return null;
    }

    const existingApi = apis[apiIndex];
    console.log('Existing API:', existingApi);

    // ✅ 파라미터 업데이트 (있는 경우)
    // 기존 parameterIds를 유지하면서 내용만 업데이트
    let updatedParameterIds = existingApi.apiParameterIds;
    
    if (data.parameters !== undefined) {
      if (data.parameters.length > 0) {
        // 파라미터가 있으면 업데이트 (기존 ID 유지)
        updatedParameterIds = ApiParameterService.updateParameters(
          existingApi.apiParameterIds,
          data.parameters
        );
        console.log('Updated parameter IDs:', updatedParameterIds);
      } else {
        // 파라미터가 비어있으면 기존 파라미터 모두 삭제
        if (existingApi.apiParameterIds.length > 0) {
          ApiParameterService.deleteParametersByIds(existingApi.apiParameterIds);
          updatedParameterIds = [];
          console.log('Deleted all parameters');
        }
      }
    }

    // API 정보 업데이트
    apis[apiIndex] = {
      ...existingApi,
      name: data.name ?? existingApi.name,
      uri: data.uri ?? existingApi.uri,
      method: data.method ?? existingApi.method,
      apiParameterIds: updatedParameterIds,
    };

    console.log('Updated API:', apis[apiIndex]);
    return apis[apiIndex];
  }

  /**
   * API 삭제 (연관된 파라미터도 함께 삭제)
   */
  static deleteApi(id: number): boolean {
    console.log('ApiService deleteApi called with id:', id);

    const api = this.getApiById(id);
    if (!api) return false;

    // 연관된 파라미터 삭제
    if (api.apiParameterIds.length > 0) {
      const deletedCount = ApiParameterService.deleteParametersByIds(api.apiParameterIds);
      console.log(`Deleted ${deletedCount} parameters`);
    }

    // API 삭제
    const initialLength = apis.length;
    apis = apis.filter(a => a.id !== id);
    return apis.length < initialLength;
  }

  /**
   * API 이름으로 검색
   */
  static searchApisByName(searchTerm: string): Api[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return apis.filter(api => 
      api.name.toLowerCase().includes(lowerSearchTerm) ||
      api.uri.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Method로 API 조회
   */
  static getApisByMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Api[] {
    return apis.filter(api => api.method === method);
  }
}