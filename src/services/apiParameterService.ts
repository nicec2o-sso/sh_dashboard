import { ApiParameter, ApiParameterInput } from '@/types'; 

// 샘플 데이터
let apiParameters: ApiParameter[] = [];

let nextParameterId = 0;

export class ApiParameterService {
  static getAllParameters(): ApiParameter[] {
    return [...apiParameters];
  }

  static getParameterById(apiParameterId: number): ApiParameter | null {
    return apiParameters.find(param => param.apiParameterId === apiParameterId) || null;
  }

  static getParametersByIds(ids: number[]): ApiParameter[] {
    console.log('ApiParameterService getParametersByIds called with ids:', ids);
    return apiParameters.filter(param => ids.includes(param.apiParameterId));
  }
  
  static createParameter(data: ApiParameterInput): ApiParameter {
    console.log('ApiParameterService createParameter called with data:', data);
    
    const newParameter: ApiParameter = {
      apiParameterId: nextParameterId++,
      apiParameterName: data.apiParameterName,
      apiParameterType: data.apiParameterType,
      apiParameterRequired: data.apiParameterRequired,
      apiParameterDesc: data.apiParameterDesc,
    };

    apiParameters.push(newParameter);
    return newParameter;
  }

  static updateParameter(
    apiParameterId: number, 
    data: Partial<ApiParameterInput>
  ): ApiParameter | null {
    console.log('ApiParameterService updateParameter called with apiParameterId:', apiParameterId, 'data:', data);
    
    const parameterIndex = apiParameters.findIndex(param => param.apiParameterId === apiParameterId);
    if (parameterIndex === -1) return null;

    apiParameters[parameterIndex] = {
      ...apiParameters[parameterIndex],
      ...data,
    };

    return apiParameters[parameterIndex];
  }

  static deleteParameter(apiParameterId: number): boolean {
    console.log('ApiParameterService deleteParameter called with apiParameterId:', apiParameterId);
    const initialLength = apiParameters.length;
    apiParameters = apiParameters.filter(param => param.apiParameterId !== apiParameterId);
    return apiParameters.length < initialLength;
  }

  static createParameters(data: ApiParameterInput[]): number[] {
    console.log('ApiParameterService createParameters (batch) called');
    
    const createdIds: number[] = [];

    for (const paramData of data) {
      if (paramData.apiParameterName.trim() === '') continue; 
      
      const newParam = this.createParameter(paramData);
      createdIds.push(newParam.apiParameterId);
    }
    return createdIds;
  }

  static updateParameters(
    existingIds: number[], 
    newParams: ApiParameterInput[]
  ): number[] {
    console.log('ApiParameterService updateParameters (batch) called');
    console.log('Existing IDs:', existingIds);
    console.log('New params data:', newParams);

    const resultIds: number[] = [];
    const validNewParams = newParams.filter(p => p.apiParameterName.trim() !== '');

    for (let i = 0; i < validNewParams.length; i++) {
      if (i < existingIds.length) {
        const existingId = existingIds[i];
        const updated = this.updateParameter(existingId, validNewParams[i]);
        
        if (updated) {
          resultIds.push(updated.apiParameterId);
          console.log(`Updated parameter ${existingId} with new data`);
        } else {
          console.warn(`Failed to update parameter ${existingId}, it may not exist`);
          const newParam = this.createParameter(validNewParams[i]);
          resultIds.push(newParam.apiParameterId);
          console.log(`Created new parameter ${newParam.apiParameterId} instead`);
        }
      } else {
        const newParam = this.createParameter(validNewParams[i]);
        resultIds.push(newParam.apiParameterId);
        console.log(`Created additional parameter ${newParam.apiParameterId}`);
      }
    }

    if (validNewParams.length < existingIds.length) {
      const idsToDelete = existingIds.slice(validNewParams.length);
      console.log('Deleting excess parameters:', idsToDelete);
      for (const apiParameterId of idsToDelete) {
        this.deleteParameter(apiParameterId);
      }
    }

    console.log('Final parameter IDs:', resultIds);
    return resultIds;
  }

  static deleteParametersByIds(ids: number[]): number {
    console.log('ApiParameterService deleteParametersByIds (batch) called');
    let deletedCount = 0;
    for (const apiParameterId of ids) {
      if (this.deleteParameter(apiParameterId)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  static getParametersByType(apiParameterType: 'query' | 'body'): ApiParameter[] {
    return apiParameters.filter(param => param.apiParameterType === apiParameterType);
  }

  static getRequiredParameters(): ApiParameter[] {
    return apiParameters.filter(param => param.apiParameterRequired);
  }

  static searchParametersByName(searchTerm: string): ApiParameter[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return apiParameters.filter(param => 
      param.apiParameterName.toLowerCase().includes(lowerSearchTerm) ||
      param.apiParameterDesc?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  static validateParameters(
    parameterIds: number[],
    providedParams: Record<string, string>
  ): { valid: boolean; missingRequired: string[]; errors: string[] } {
    console.log('ApiParameterService validateParameters called');
    
    const parameters = this.getParametersByIds(parameterIds);
    const requiredParams = parameters.filter(p => p.apiParameterRequired);
    const missingRequired: string[] = [];
    const errors: string[] = [];

    for (const param of requiredParams) {
      if (!(param.apiParameterName in providedParams) || providedParams[param.apiParameterName] === undefined || providedParams[param.apiParameterName] === null || String(providedParams[param.apiParameterName]).trim() === '') {
        missingRequired.push(param.apiParameterName);
        errors.push(`필수 파라미터가 누락되었습니다: ${param.apiParameterName}`);
      }
    }

    return {
      valid: missingRequired.length === 0,
      missingRequired,
      errors,
    };
  }
}
