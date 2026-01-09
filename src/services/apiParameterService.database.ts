/**
 * API Parameter Service (Database Version)
 * 
 * 데이터베이스 기반 API 파라미터 관리 서비스
 */

import { db } from '@/lib/oracle';
import { ApiParameter } from '@/types';

import {
  SELECT_API_PARAMETERS,
  SELECT_PARAMETERS_BY_IDS,
} from '@/queries/apiQueries';

export class ApiParameterServiceDB {
  /**
   * 특정 API의 모든 파라미터 조회
   */
  static async getParametersByApiId(apiId: number): Promise<ApiParameter[]> {
    try {
      const parameters = await db.query<ApiParameter>(SELECT_API_PARAMETERS, { apiId });
      return parameters;
    } catch (error) {
      console.error('[ApiParameterService] Error fetching parameters:', error);
      throw error;
    }
  }

  /**
   * 파라미터 ID 목록으로 조회
   */
  static async getParametersByIds(ids: number[]): Promise<ApiParameter[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      // Oracle IN 절을 위한 쿼리 생성
      const placeholders = ids.map((_, index) => `:id${index}`).join(', ');
      const query = SELECT_PARAMETERS_BY_IDS.replace(':ids', placeholders);
      
      // 바인드 파라미터 생성
      const binds: Record<string, number> = {};
      ids.forEach((id, index) => {
        binds[`id${index}`] = id;
      });

      const parameters = await db.query<ApiParameter>(query, binds);
      return parameters;
    } catch (error) {
      console.error('[ApiParameterService] Error fetching parameters by IDs:', error);
      throw error;
    }
  }
}
