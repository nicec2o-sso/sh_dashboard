import { Api, ApiExecutionResult, ApiParameterInput } from '@/types';
import { WebClientResponse } from './webClient';
import { ApiParameterService } from './apiParameterService';

// 샘플 데이터
let apis: Api[] = [];

let nextApiId = 4;

export class ApiService {
  static getAllApis(): Api[] {
    return [...apis];
  }

  static getApiById(apiId: number): Api | null {
    return apis.find(api => api.apiId === apiId) || null;
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
          parsedParams: Record<string, any> 
      }
  ): Promise<ApiExecutionResult> {
      console.log('ApiService executeApi called with apiId:', apiId, 'parameters:', parameters);
      const api = this.getApiById(apiId);
      if (!api) throw new Error('API를 찾을 수 없습니다');

      // dummy Data
      return {
          nodeId: parameters.targetNode.nodeId,
          nodeName: parameters.targetNode.nodeName,
          statusCode: 200,
          success: true,
          responseTimeMs: 123,
          data: { message: 'API executed successfully (dummy data)' },
      };  
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
}
