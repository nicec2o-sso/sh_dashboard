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
  SELECT_ALERTS,
  SEARCH_TEST_HISTORY,
  SEARCH_TEST_HISTORY_COUNT
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

// 새로운 검색 옵션
export interface SearchHistoriesOptions {
  syntheticTestId?: number;
  syntheticTestName?: string;
  nodeId?: number;
  nodeName?: string;
  nodeGroupName?: string;
  tagName?: string;
  notificationEnabled?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
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
   * 통합테스트 실행 이력 검색
   * 다양한 필터 조건으로 이력 검색
   */
  static async searchHistories(
    options: SearchHistoriesOptions
  ): Promise<{ histories: SyntheticTestHistoryRow[]; total: number }> {
    try {
      
      let sql = SEARCH_TEST_HISTORY;
      let where = '';
      
      const bindParams: any = {};
      
      // Synthetic Test ID 필터
      if (options.syntheticTestId) {
        where += ` AND h.MPG_MNG_DOM_SYNT_TEST_ID = :syntheticTestId`;
        bindParams.syntheticTestId = options.syntheticTestId;
      }
      
      // Synthetic Test Name 필터 (LIKE 검색)
      if (options.syntheticTestName) {
        where += ` AND UPPER(st.MNG_DOM_SYNT_TEST_NM) LIKE UPPER(:syntheticTestName)`;
        bindParams.syntheticTestName = `%${options.syntheticTestName}%`;
      }
      
      // 노드 ID 필터
      if (options.nodeId) {
        where += ` AND h.MNG_DOM_NODE_ID = :nodeId`;
        bindParams.nodeId = options.nodeId;
      }
      
      // 노드 이름 필터 (LIKE 검색)
      if (options.nodeName) {
        where += ` AND UPPER(n.MNG_DOM_NODE_NM) LIKE UPPER(:nodeName)`;
        bindParams.nodeName = `%${options.nodeName}%`;
      }
      
      // 노드 그룹 이름 필터 (EXISTS 서브쿼리 사용)
      if (options.nodeGroupName) {
        where += ` AND EXISTS (
          SELECT 1 FROM TWAA0005M00 ngm2 
          JOIN TWAA0004M00 ng2 ON ngm2.MNG_DOM_NODE_GRP_ID = ng2.MNG_DOM_NODE_GRP_ID 
          WHERE ngm2.MNG_DOM_NODE_ID = h.MNG_DOM_NODE_ID 
          AND UPPER(ng2.SNET_MNG_NODE_GRP_NM) LIKE UPPER(:nodeGroupName)
        )`;
        bindParams.nodeGroupName = `%${options.nodeGroupName}%`;
      }
      
      // 태그 필터 (LIKE 검색 - TAGS 컨럼에서)
      if (options.tagName) {
        where += ` AND UPPER(st.TAGS) LIKE UPPER(:tagName)`;
        bindParams.tagName = `%${options.tagName}%`;
      }
      
      // 알림 발생 여부 필터
      console.log('options.notificationEnabled : ',options.notificationEnabled);
      if (options.notificationEnabled !== undefined) {
        if (options.notificationEnabled == false) {
          // 알림 발생: 실패 또는 임계값 초과
          where += ` AND (h.MNG_DOM_SYNT_TEST_SCS_YN = 'N' OR (st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC IS NOT NULL AND h.MNG_DOM_SYNT_TEST_RSP_MLSC > st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC))`;
        } else {
          // 정상: 성공 및 임계값 이하
          where += ` AND h.MNG_DOM_SYNT_TEST_SCS_YN = 'Y' AND (st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC IS NULL OR h.MNG_DOM_SYNT_TEST_RSP_MLSC <= st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC)`;
        }
      }
      
      // 날짜 범위 필터
      if (options.startDate) {
        where += ` AND h.MNG_DOM_SYNT_TEST_EXE_TM >= :startDate`;
        bindParams.startDate = options.startDate;
      }
      
      if (options.endDate) {
        where += ` AND h.MNG_DOM_SYNT_TEST_EXE_TM <= :endDate`;
        bindParams.endDate = options.endDate;
      }
      
      // 정렬: 최신순
      where += ` ORDER BY h.MNG_DOM_SYNT_TEST_EXE_TM DESC`;
      
      sql += where;

      // LIMIT 및 OFFSET
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      // Oracle 페이징
      const pagedSql = `
        SELECT * FROM (
          SELECT a.*, ROWNUM rnum FROM (
            ${sql}
          ) a WHERE ROWNUM <= ${offset + limit}
        ) WHERE rnum > ${offset}
      `;
      
      console.log('Search SQL:', pagedSql);
      console.log('Bind Params:', bindParams);
      
      const histories = await db.query<SyntheticTestHistoryRow>(
        pagedSql,
        bindParams
      );
      
      // 총 개수 조회
      let countSql = SEARCH_TEST_HISTORY_COUNT;
      
      countSql += where;

      console.log('countSql:', countSql);

      const countResult = await db.query<{ total: number }>(countSql, bindParams);
      const total = countResult[0]?.total || 0;
      
      return { histories, total };
    } catch (error) {
      console.error('[SyntheticTestHistoryServiceDB] Error searching histories:', error);
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
