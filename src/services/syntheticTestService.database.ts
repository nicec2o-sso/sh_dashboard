/**
 * Synthetic Test Service (Database Version)
 * 
 * 데이터베이스 기반 합성 테스트 관리 서비스
 */

import { db } from '@/lib/oracle';
import oracledb from 'oracledb';
import {
  SELECT_SYNTHETIC_TESTS,
  SELECT_SYNTHETIC_TEST_DETAIL,
  INSERT_SYNTHETIC_TEST,
  UPDATE_SYNTHETIC_TEST,
  DELETE_SYNTHETIC_TEST,
  UPDATE_SYNTHETIC_TEST_ENABLED,
  INSERT_TEST_HISTORY,
  SELECT_TEST_HISTORY,
  CHECK_SYNTHETIC_TEST_NAME_EXISTS,
} from '@/queries/syntheticTestQueries';

import {
  SELECT_TAG_BY_NAME,
  INSERT_TAG,
  DELETE_SYNTHETIC_TEST_TAG_MEMBERS,
  INSERT_SYNTHETIC_TEST_TAG_MEMBER,
} from '@/queries/tagQueries';
export interface SyntheticTest {
  syntheticTestId: number;
  syntheticTestName: string;
  targetType: 'node' | 'group';
  targetId: number;
  targetName?: string;
  apiId: number;
  apiName?: string;
  uri?: string;
  method?: string;
  intervalSeconds: number;
  alertThresholdMs: number;
  tags?: string;
  syntheticTestEnabled: 'Y' | 'N';
  createdAt?: Date;
  updatedAt?: Date;
}

// TestHistory는 DB에서 조회한 원본 데이터 (success: 'Y' | 'N')
export interface TestHistory {
  syntheticTestHistoryId: number;
  syntheticTestId: number;
  nodeId: number;
  nodeName?: string;
  host?: string;
  port?: number;
  statusCode: number;
  success: 'Y' | 'N'; // DB 원본 값
  responseTimeMs: number;
  executedAt: string;
  input?: string;
  output?: string;
}

// 클라이언트로 전송할 변환된 데이터 (success: boolean)
export interface TestHistoryResponse {
  syntheticTestHistoryId: number;
  syntheticTestId: number;
  nodeId: number;
  nodeName?: string;
  host?: string;
  port?: number;
  statusCode: number;
  success: boolean; // 'Y'/'N'을 boolean으로 변환
  responseTimeMs: number;
  executedAt: string; // ISO 8601 문자열
  input?: string;
  output?: string;
}

/**
 * DB의 TestHistory를 클라이언트용 TestHistoryResponse로 변환
 */
export function convertTestHistoryToResponse(history: TestHistory): TestHistoryResponse {
  return {
    syntheticTestHistoryId: history.syntheticTestHistoryId,
    syntheticTestId: history.syntheticTestId,
    nodeId: history.nodeId,
    nodeName: history.nodeName,
    host: history.host,
    port: history.port,
    statusCode: history.statusCode,
    success: history.success === 'Y', // 'Y'/'N'을 boolean으로 변환
    responseTimeMs: history.responseTimeMs,
    executedAt: history.executedAt,
    input: history.input,
    output: history.output,
  };
}

export interface CreateSyntheticTestInput {
  syntheticTestName: string;
  targetType: 'node' | 'group';
  targetId: number;
  apiId: number;
  intervalSeconds: number;
  alertThresholdMs: number;
  tags?: string;
  syntheticTestEnabled?: 'Y' | 'N';
  clientIp: string;
}

export interface UpdateSyntheticTestInput {
  syntheticTestName?: string;
  targetType?: 'node' | 'group';
  targetId?: number;
  apiId?: number;
  intervalSeconds?: number;
  alertThresholdMs?: number;
  tags?: string;
  syntheticTestEnabled?: 'Y' | 'N';
  clientIp: string;
}

export interface CreateTestHistoryInput {
  syntheticTestId?: number; // ✅ optional - API 미리보기에서는 null/undefined
  nodeId: number;
  statusCode: number;
  success: 'Y' | 'N';
  responseTimeMs: number;
  input?: string;
  output?: string;
  clientIp: string;
}

export class SyntheticTestServiceDB {
  /**
   * 모든 합성 테스트 조회
   */
  static async getAllSyntheticTests(): Promise<SyntheticTest[]> {
    try {
      console.log('SELECT_SYNTHETIC_TESTS:', SELECT_SYNTHETIC_TESTS);
      const tests = await db.query<SyntheticTest>(SELECT_SYNTHETIC_TESTS);
      return tests;
    } catch (error) {
      console.error('[SyntheticTestService] Error fetching synthetic tests:', error);
      throw error;
    }
  }

  /**
   * 특정 합성 테스트 조회
   */
  static async getSyntheticTestById(syntheticTestId: number): Promise<SyntheticTest | null> {
    try {
      console.log('SELECT_SYNTHETIC_TEST_DETAIL:', SELECT_SYNTHETIC_TEST_DETAIL,syntheticTestId);
      const tests = await db.query<SyntheticTest>(
        SELECT_SYNTHETIC_TEST_DETAIL,
        { syntheticTestId }
      );

      if (tests.length === 0) {
        return null;
      }

      return tests[0];
    } catch (error) {
      console.error('[SyntheticTestService] Error fetching synthetic test by ID:', error);
      throw error;
    }
  }

  /**
   * 합성 테스트 이름 중복 확인
   */
  static async checkSyntheticTestNameExists(
    syntheticTestName: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      console.log('CHECK_SYNTHETIC_TEST_NAME_EXISTS:', CHECK_SYNTHETIC_TEST_NAME_EXISTS,syntheticTestName, excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_SYNTHETIC_TEST_NAME_EXISTS,
        { syntheticTestName, excludeId: excludeId || null }
      );
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[SyntheticTestService] Error checking test name:', error);
      throw error;
    }
  }

  /**
   * 새 합성 테스트 생성
   */
  static async createSyntheticTest(data: CreateSyntheticTestInput): Promise<SyntheticTest> {
    try {
      // 중복 확인
      const nameExists = await this.checkSyntheticTestNameExists(data.syntheticTestName);
      if (nameExists) {
        throw new Error('Synthetic test name already exists');
      }

      // 테스트 생성
      const syntheticTestId = await db.transaction(async (conn) => {
        console.log('INSERT_SYNTHETIC_TEST:', INSERT_SYNTHETIC_TEST,data);
        const insertResult = await conn.execute(
          INSERT_SYNTHETIC_TEST,
          {
            syntheticTestName: data.syntheticTestName,
            targetType: data.targetType,
            targetId: data.targetId,
            apiId: data.apiId,
            intervalSeconds: data.intervalSeconds,
            alertThresholdMs: data.alertThresholdMs,
            // tags: data.tags,
            syntheticTestEnabled: data.syntheticTestEnabled || 'Y',
            clientIp: data.clientIp,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true }
        );

        const syntheticTestId = insertResult.outBinds?.id?.[0];
        if (!syntheticTestId) {
          throw new Error('Failed to get generated synthetic test ID');
        }

        console.log('[SyntheticTestService] Synthetic test created with ID:', syntheticTestId);
        return syntheticTestId;
      });

      // 생성된 테스트 조회
      const newTest = await this.getSyntheticTestById(syntheticTestId);
      if (!newTest) {
        throw new Error('Failed to fetch created synthetic test');
      }

      return newTest;
    } catch (error) {
      console.error('[SyntheticTestService] Error creating synthetic test:', error);
      throw error;
    }
  }

  /**
   * 합성 테스트 수정
   */
  static async updateSyntheticTest(
    syntheticTestId: number,
    data: UpdateSyntheticTestInput
  ): Promise<SyntheticTest> {
    try {
      // 테스트 존재 확인
      const existingTest = await this.getSyntheticTestById(syntheticTestId);
      if (!existingTest) {
        throw new Error('Synthetic test not found');
      }

      // 중복 확인
      if (data.syntheticTestName) {
        const nameExists = await this.checkSyntheticTestNameExists(
          data.syntheticTestName,
          syntheticTestId
        );
        if (nameExists) {
          throw new Error('Synthetic test name already exists');
        }
      }

      // 수정
      await db.transaction(async (conn) => {
        console.log('UPDATE_SYNTHETIC_TEST:', UPDATE_SYNTHETIC_TEST,syntheticTestId,data,existingTest);
        const updateResult = await conn.execute(
          UPDATE_SYNTHETIC_TEST,
          {
            syntheticTestId,
            syntheticTestName: data.syntheticTestName || existingTest.syntheticTestName,
            targetType: data.targetType || existingTest.targetType,
            targetId: data.targetId !== undefined ? data.targetId : existingTest.targetId,
            apiId: data.apiId !== undefined ? data.apiId : existingTest.apiId,
            // tags: data.tags !== undefined ? data.tags : existingTest.tags,
            intervalSeconds: data.intervalSeconds !== undefined 
              ? data.intervalSeconds 
              : existingTest.intervalSeconds,
            alertThresholdMs: data.alertThresholdMs !== undefined 
              ? data.alertThresholdMs 
              : existingTest.alertThresholdMs,
            syntheticTestEnabled: data.syntheticTestEnabled || existingTest.syntheticTestEnabled,
            clientIp: data.clientIp,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true }
        );

        // 2. 태그 처리
        if (data.tags !== undefined) {
          console.log('DELETE_SYNTHETIC_TEST_TAG_MEMBERS:', DELETE_SYNTHETIC_TEST_TAG_MEMBERS,syntheticTestId,data,existingTest);
          await conn.execute(DELETE_SYNTHETIC_TEST_TAG_MEMBERS, { syntheticTestId }, { autoCommit: true });

          if (data.tags && data.tags.trim()) {
            await this.processSyntheticTagsInTransaction(conn, syntheticTestId, data.tags, data.clientIp);
          }
        }

        const updatedId = updateResult.outBinds?.id?.[0];
        if (!updatedId) {
          throw new Error('Failed to update synthetic test');
        }
      });

      // 수정된 테스트 조회
      const updatedTest = await this.getSyntheticTestById(syntheticTestId);
      if (!updatedTest) {
        throw new Error('Failed to fetch updated synthetic test');
      }

      return updatedTest;
    } catch (error) {
      console.error('[SyntheticTestService] Error updating synthetic test:', error);
      throw error;
    }
  }

  /**
   * 합성 테스트 삭제
   */
  static async deleteSyntheticTest(syntheticTestId: number): Promise<void> {
    try {
      console.log('DELETE_SYNTHETIC_TEST:', DELETE_SYNTHETIC_TEST,syntheticTestId);
      const rowsAffected = await db.execute(DELETE_SYNTHETIC_TEST, { syntheticTestId }, true);

      if (rowsAffected === 0) {
        throw new Error('Synthetic test not found');
      }

      console.log('[SyntheticTestService] Synthetic test deleted:', syntheticTestId);
    } catch (error) {
      console.error('[SyntheticTestService] Error deleting synthetic test:', error);
      throw error;
    }
  }

  /**
   * 합성 테스트 활성화/비활성화
   */
  static async toggleSyntheticTestEnabled(
    syntheticTestId: number,
    enabled: 'Y' | 'N'
  ): Promise<void> {
    try {
      console.log('UPDATE_SYNTHETIC_TEST_ENABLED:', UPDATE_SYNTHETIC_TEST_ENABLED,syntheticTestId,enabled);
      const rowsAffected = await db.execute(
        UPDATE_SYNTHETIC_TEST_ENABLED,
        { syntheticTestId, syntheticTestEnabled: enabled },
        true
      );

      if (rowsAffected === 0) {
        throw new Error('Synthetic test not found');
      }

      console.log('[SyntheticTestService] Test enabled status updated:', syntheticTestId, enabled);
    } catch (error) {
      console.error('[SyntheticTestService] Error toggling test enabled:', error);
      throw error;
    }
  }

  /**
   * 테스트 실행 이력 저장
   */
  static async createTestHistory(data: CreateTestHistoryInput): Promise<number> {
    try {
      // ✅ syntheticTestId가 없으면 저장하지 않음 (API 테스트 실행)
      if (!data.syntheticTestId || data.syntheticTestId === 0) {
        console.log('[SyntheticTestService] Skipping history save - no syntheticTestId (preview mode)');
        return 0;
      }

      const historyId = await db.transaction(async (conn) => {
        console.log('INSERT_TEST_HISTORY:', INSERT_TEST_HISTORY,data);
        const insertResult = await conn.execute(
          INSERT_TEST_HISTORY,
          {
            syntheticTestId: data.syntheticTestId,
            nodeId: data.nodeId,
            statusCode: data.statusCode,
            success: data.success,
            responseTimeMs: data.responseTimeMs,
            input: data.input || null,
            output: data.output || null,
            clientIp: data.clientIp,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true }
        );

        const historyId = insertResult.outBinds?.id?.[0];
        if (!historyId) {
          throw new Error('Failed to get generated history ID');
        }

        return historyId;
      });

      console.log('[SyntheticTestService] Test history created with ID:', historyId);
      return historyId;
    } catch (error) {
      console.error('[SyntheticTestService] Error creating test history:', error);
      throw error;
    }
  }

  /**
   * 특정 테스트의 실행 이력 조회
   */
  static async getTestHistory(
    syntheticTestId: number,
    limit: number = 100
  ): Promise<TestHistory[]> {
    try {
      console.log('SELECT_TEST_HISTORY:', SELECT_TEST_HISTORY,syntheticTestId, limit);
      const history = await db.query<TestHistory>(SELECT_TEST_HISTORY, {
        syntheticTestId,
     //   limit,
      });

      return history;
    } catch (error) {
      console.error('[SyntheticTestService] Error fetching test history:', error);
      throw error;
    }
  }

  /**
   * 트랜잭션 내에서 태그 처리
   */
  private static async processSyntheticTagsInTransaction(
    conn: any,
    syntheticTestId: number,
    tagsString: string,
    clientIp: string
  ): Promise<void> {
    const tagNames = tagsString
      .split(',')
      .map(tag => tag.trimStart().trimEnd())
      .filter(tag => tag.length > 0);

    for (const tagName of tagNames) {
      try {
        // 1. 기존 태그 조회
        console.log(`SELECT_TAG_BY_NAME : `,SELECT_TAG_BY_NAME,tagName);
        const existingTagResult = await conn.execute(
          SELECT_TAG_BY_NAME,
          { tagName },
          { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let tagId: number;

        if (existingTagResult.rows && existingTagResult.rows.length > 0) {
          tagId = (existingTagResult.rows[0] as any).tagId;
        } else {
          // 2. 새 태그 생성
          console.log(`INSERT_TAG : `,INSERT_TAG,tagName,clientIp);
          const insertTagResult = await conn.execute(
            INSERT_TAG,
            {
              tagName,
              clientIp,
              id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
          );

          tagId = insertTagResult.outBinds?.id?.[0];
          if (!tagId) {
            throw new Error(`Failed to create tag: ${tagName}`);
          }
        }

        // 3. API-태그 관계 생성
        try {
          console.log(`INSERT_SYNTHETIC_TEST_TAG_MEMBER : `,INSERT_SYNTHETIC_TEST_TAG_MEMBER,tagId, syntheticTestId,clientIp);
          await conn.execute(
            INSERT_SYNTHETIC_TEST_TAG_MEMBER,
            { tagId, syntheticTestId, clientIp },
            { autoCommit: true }
          );
          
        } catch (err) {
          // 중복 키 오류는 무시
          if (err instanceof Error && !err.message.includes('ORA-00001')) {
            throw err;
          }
        }
      } catch (err) {
        console.error(`Failed to process tag "${tagName}":`, err);
        throw err;
      }
    }
  }
}
