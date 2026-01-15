/**
 * Synthetic Test History Service (Database Version)
 * 
 * 데이터베이스 기반 합성 테스트 히스토리 관리 서비스
 */

import { db } from '@/lib/oracle';
import oracledb from 'oracledb';
import { 
  SyntheticTestHistory, 
  SyntheticTestHistoryRow,
  convertSyntheticTestHistoryRow 
} from '@/types';
import { 
  INSERT_TEST_HISTORY, 
  SELECT_TEST_HISTORY_WITH_FILTERS,
  SELECT_NODE_TEST_HISTORY,
  SELECT_ALL_TEST_HISTORY,
  DELETE_TEST_HISTORY,
  DELETE_TEST_HISTORIES_BY_TEST_ID,
  SELECT_ALERTS
} from '@/queries/syntheticTestQueries';

// Export 타입들
export interface CreateTestHistoryInput {
  syntheticTestId?: number; // 수동 테스트 실행 시에는 없을 수 있음
  nodeId: number;
  statusCode: number;
  success: boolean;
  responseTimeMs: number;
  input: string;
  output?: string;
}

// TestHistoryRow는 이제 types에서 SyntheticTestHistoryRow로 import

export interface GetHistoriesOptions {
  nodeId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AlertRow {
  testId: number;
  testName: string;
  nodeId: number;
  nodeName: string;
  apiId: number;
  apiName: string;
  apiUri: string;
  apiMethod: string;
  responseTime: number;
  threshold: number;
  timestamp: Date;
  statusCode: number;
  input?: string;
}

// convertToSyntheticTestHistory는 이제 types에서 convertSyntheticTestHistoryRow로 import
// 하위 호환성을 위해 별칭 함수 제공
export const convertToSyntheticTestHistory = convertSyntheticTestHistoryRow;

export class SyntheticTestHistoryServiceDB {
  /**
   * 테스트 실행 이력 저장
   * syntheticTestId가 없는 경우(수동 테스트)는 null로 저장
   */
  static async createHistory(data: CreateTestHistoryInput): Promise<number> {
    try {
      const historyId = await db.transaction(async (conn) => {
        console.log('INSERT_TEST_HISTORY : ',INSERT_TEST_HISTORY, data);
        
        const insertResult = await conn.execute(
          INSERT_TEST_HISTORY,
          {
            syntheticTestId: data.syntheticTestId || null, // 수동 테스트는 null
            nodeId: data.nodeId,
            statusCode: data.statusCode,
            success: data.success ? 'Y' : 'N',
            responseTimeMs: data.responseTimeMs,
            input: data.input,
            output: data.output || null,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: false }
        );

        const historyId = insertResult.outBinds?.id?.[0];
        if (!historyId) {
          throw new Error('Failed to get generated history ID');
        }

        console.log('[SyntheticTestHistoryServiceDB] Test history created with ID:', historyId);
        return historyId;
      });

      return historyId;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error creating test history:', error);
      throw error;
    }
  }

  /**
   * 테스트별 실행 이력 조회 (필터 옵션 포함)
   */
  static async getHistoriesByTestId(
    syntheticTestId: number,
    options?: GetHistoriesOptions
  ): Promise<SyntheticTestHistoryRow[]> {
    try {
      console.log('[SyntheticTestHistoryServiceDB] Getting histories for test:', syntheticTestId, 'options:', options);
      
      console.log('SELECT_TEST_HISTORY_WITH_FILTERS : ',SELECT_TEST_HISTORY_WITH_FILTERS, syntheticTestId, options);
      const histories = await db.query<SyntheticTestHistoryRow>(
        SELECT_TEST_HISTORY_WITH_FILTERS,
        {
          syntheticTestId,
          nodeId: options?.nodeId || null,
          startDate: options?.startDate || null,
          endDate: options?.endDate || null,
          limit: options?.limit || 100,
        }
      );

      return histories;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error fetching histories by test ID:', error);
      throw error;
    }
  }

  /**
   * 노드별 테스트 이력 조회
   */
  static async getHistoriesByNodeId(nodeId: number, limit?: number): Promise<SyntheticTestHistoryRow[]> {
    try {
      
      console.log('SELECT_NODE_TEST_HISTORY : ',SELECT_NODE_TEST_HISTORY, nodeId);
      const histories = await db.query<SyntheticTestHistoryRow>(
        SELECT_NODE_TEST_HISTORY,
        {
          nodeId,
          limit: limit || 100,
        }
      );

      return histories;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error fetching histories by node ID:', error);
      throw error;
    }
  }

  /**
   * 모든 이력 조회
   */
  static async getAllHistories(): Promise<SyntheticTestHistoryRow[]> {
    try {
      console.log('[SyntheticTestHistoryServiceDB] Getting all histories');
      
      console.log('SELECT_ALL_TEST_HISTORY : ',SELECT_ALL_TEST_HISTORY);
      const histories = await db.query<SyntheticTestHistoryRow>(SELECT_ALL_TEST_HISTORY);

      return histories;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error fetching all histories:', error);
      throw error;
    }
  }

  /**
   * 특정 이력 삭제
   */
  static async deleteHistory(syntheticTestHistoryId: number): Promise<boolean> {
    try {
      console.log('DELETE_TEST_HISTORY : ',DELETE_TEST_HISTORY, syntheticTestHistoryId);
      const rowsAffected = await db.execute(
        DELETE_TEST_HISTORY,
        { syntheticTestHistoryId },
        true
      );

      return rowsAffected > 0;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error deleting history:', error);
      throw error;
    }
  }

  /**
   * 테스트별 모든 이력 삭제
   */
  static async deleteHistoriesByTestId(syntheticTestId: number): Promise<number> {
    try {
      console.log('DELETE_TEST_HISTORIES_BY_TEST_ID : ',DELETE_TEST_HISTORIES_BY_TEST_ID, syntheticTestId);
      const rowsAffected = await db.execute(
        DELETE_TEST_HISTORIES_BY_TEST_ID,
        { syntheticTestId },
        true
      );

      return rowsAffected;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error deleting histories by test ID:', error);
      throw error;
    }
  }

  /**
   * 알럿 목록 조회 (임계값 초과 테스트만)
   * @param startDate 시작 일시
   * @param limit 조회할 최대 개수 (기본값: 100)
   */
  static async getAlerts(startDate: Date, limit: number = 100): Promise<AlertRow[]> {
    try {
      console.log('SELECT_ALERTS:',SELECT_ALERTS, startDate, limit);
      
      const alerts = await db.query<AlertRow>(
        SELECT_ALERTS,
        {
          startDate,
          limit,
        }
      );

      return alerts;
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error fetching alerts:', error);
      throw error;
    }
  }
}
