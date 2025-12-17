import { ApiParameter } from '@/types'; 

// 샘플 데이터
let apiParameters: ApiParameter[] = [
  // ... (기존 샘플 데이터는 유지)
  {
    id: 1,
    name: 'userId',
    type: 'query',
    required: true,
    description: '조회할 사용자 ID',
  },
  {
    id: 2,
    name: 'includeDetails',
    type: 'query',
    required: false,
    description: '상세 정보 포함 여부',
  },
  {
    id: 3,
    name: 'query',
    type: 'body',
    required: true,
    description: '실행할 SQL 쿼리',
  },
  {
    id: 4,
    name: 'database',
    type: 'body',
    required: true,
    description: '대상 데이터베이스',
  },
  {
    id: 5,
    name: 'timeout',
    type: 'body',
    required: false,
    description: '타임아웃 (초)',
  },
];

let nextParameterId = 6;

export class ApiParameterService {
  // --- 조회 및 기본 CRUD 메서드 (수정된 부분: getParametersByIds의 인자를 number[]로 통일) ---

  /**
   * 모든 API 파라미터 조회
   */
  static getAllParameters(): ApiParameter[] {
    return [...apiParameters];
  }

  /**
   * ID로 API 파라미터 조회
   */
  static getParameterById(id: number): ApiParameter | null {
    return apiParameters.find(param => param.id === id) || null;
  }

  /**
   * 여러 ID로 API 파라미터 목록 조회 (인자를 number[]로 통일)
   */
  static getParametersByIds(ids: number[]): ApiParameter[] {
    console.log('ApiParameterService getParametersByIds called with ids:', ids);
    return apiParameters.filter(param => ids.includes(param.id));
  }
  
  /**
   * API 파라미터 생성 (단일)
   */
  static createParameter(data: Omit<ApiParameter, 'id'>): ApiParameter {
    console.log('ApiParameterService createParameter called with data:', data);
    
    const newParameter: ApiParameter = {
      id: nextParameterId++,
      name: data.name,
      type: data.type,
      required: data.required,
      description: data.description,
    };

    apiParameters.push(newParameter);
    return newParameter;
  }

  /**
   * API 파라미터 수정 (단일)
   */
  static updateParameter(
    id: number, 
    data: Partial<Omit<ApiParameter, 'id'>>
  ): ApiParameter | null {
    console.log('ApiParameterService updateParameter called with id:', id, 'data:', data);
    
    const parameterIndex = apiParameters.findIndex(param => param.id === id);
    if (parameterIndex === -1) return null;

    apiParameters[parameterIndex] = {
      ...apiParameters[parameterIndex],
      ...data,
    };

    return apiParameters[parameterIndex];
  }

  /**
   * API 파라미터 삭제 (단일)
   */
  static deleteParameter(id: number): boolean {
    console.log('ApiParameterService deleteParameter called with id:', id);
    const initialLength = apiParameters.length;
    apiParameters = apiParameters.filter(param => param.id !== id);
    return apiParameters.length < initialLength;
  }

  // --- 배치 처리 및 비즈니스 로직 추가 ---

  /**
   * [추가된 기능] API 파라미터 목록을 생성하고, 생성된 ID 목록을 반환합니다.
   * 이는 ApiService.createApi에서 DTO의 parameters 배열을 처리하는 데 사용됩니다.
   */
  static createParameters(data: Omit<ApiParameter, 'id'>[]): number[] {
    console.log('ApiParameterService createParameters (batch) called');
    
    const createdIds: number[] = [];

    for (const paramData of data) {
      // name이 비어있는 파라미터는 무시 (클라이언트 유효성 검사 미비 시 방어 코드)
      if (paramData.name.trim() === '') continue; 
      
      const newParam = this.createParameter(paramData);
      createdIds.push(newParam.id);
    }
    return createdIds;
  }

  /**
   * ✅ [개선] 기존 파라미터 ID를 유지하면서 내용만 업데이트합니다.
   * API의 parameterIds는 변경되지 않습니다.
   * 
   * 동작 방식:
   * 1. 기존 파라미터 ID 순서대로 새 데이터로 업데이트
   * 2. 새 파라미터가 더 많으면 추가 생성
   * 3. 기존 파라미터가 더 많으면 나머지 삭제
   * 
   * @param existingIds - 기존 파라미터 ID 목록
   * @param newParams - 새로운 파라미터 데이터 (id 없음)
   * @returns 업데이트/생성된 파라미터 ID 목록
   */
  static updateParameters(
    existingIds: number[], 
    newParams: Omit<ApiParameter, 'id'>[]
  ): number[] {
    console.log('ApiParameterService updateParameters (batch) called');
    console.log('Existing IDs:', existingIds);
    console.log('New params data:', newParams);

    const resultIds: number[] = [];

    // 빈 이름 파라미터 필터링
    const validNewParams = newParams.filter(p => p.name.trim() !== '');

    // 1. 기존 파라미터를 순서대로 업데이트
    for (let i = 0; i < validNewParams.length; i++) {
      if (i < existingIds.length) {
        // 기존 ID가 있으면 업데이트
        const existingId = existingIds[i];
        const updated = this.updateParameter(existingId, validNewParams[i]);
        
        if (updated) {
          resultIds.push(updated.id);
          console.log(`Updated parameter ${existingId} with new data`);
        } else {
          console.warn(`Failed to update parameter ${existingId}, it may not exist`);
          // 업데이트 실패 시 새로 생성
          const newParam = this.createParameter(validNewParams[i]);
          resultIds.push(newParam.id);
          console.log(`Created new parameter ${newParam.id} instead`);
        }
      } else {
        // 기존 ID가 없으면 새로 생성
        const newParam = this.createParameter(validNewParams[i]);
        resultIds.push(newParam.id);
        console.log(`Created additional parameter ${newParam.id}`);
      }
    }

    // 2. 새 파라미터 개수가 기존보다 적으면 나머지 삭제
    if (validNewParams.length < existingIds.length) {
      const idsToDelete = existingIds.slice(validNewParams.length);
      console.log('Deleting excess parameters:', idsToDelete);
      for (const id of idsToDelete) {
        this.deleteParameter(id);
      }
    }

    console.log('Final parameter IDs:', resultIds);
    return resultIds;
  }

  /**
   * [추가된 기능] 여러 ID로 API 파라미터 목록을 삭제합니다.
   */
  static deleteParametersByIds(ids: number[]): number {
    console.log('ApiParameterService deleteParametersByIds (batch) called');
    let deletedCount = 0;
    for (const id of ids) {
      if (this.deleteParameter(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
  
  // --- 검색 및 유효성 검증 메서드 (기존 로직 유지) ---

  /**
   * 특정 타입의 파라미터 조회
   */
  static getParametersByType(type: 'query' | 'body'): ApiParameter[] {
    return apiParameters.filter(param => param.type === type);
  }

  /**
   * 필수 파라미터만 조회
   */
  static getRequiredParameters(): ApiParameter[] {
    return apiParameters.filter(param => param.required);
  }

  /**
   * 파라미터 이름으로 검색
   */
  static searchParametersByName(searchTerm: string): ApiParameter[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return apiParameters.filter(param => 
      param.name.toLowerCase().includes(lowerSearchTerm) ||
      param.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * 파라미터 유효성 검증 헬퍼 (인자를 number[]로 통일)
   */
  static validateParameters(
    parameterIds: number[], // string[] -> number[]로 변경
    providedParams: Record<string, string>
  ): { valid: boolean; missingRequired: string[]; errors: string[] } {
    console.log('ApiParameterService validateParameters called');
    
    const parameters = this.getParametersByIds(parameterIds);
    const requiredParams = parameters.filter(p => p.required);
    const missingRequired: string[] = [];
    const errors: string[] = [];

    for (const param of requiredParams) {
      // null, undefined, 빈 문자열 모두 유효성 검사
      if (!(param.name in providedParams) || providedParams[param.name] === undefined || providedParams[param.name] === null || String(providedParams[param.name]).trim() === '') {
        missingRequired.push(param.name);
        errors.push(`필수 파라미터가 누락되었습니다: ${param.name}`);
      }
    }

    return {
      valid: missingRequired.length === 0,
      missingRequired,
      errors,
    };
  }
}