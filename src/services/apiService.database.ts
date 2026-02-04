/**
 * API Service (Database Version)
 * 
 * 데이터베이스 기반 API 관리 서비스
 * 모든 비즈니스 로직을 처리하고 DB 작업을 수행합니다.
 */

import { db } from '@/lib/oracle';
import oracledb from 'oracledb';
import {
  SELECT_APIS_WITH_TAGS,
  SELECT_API_DETAIL_WITH_TAGS,
  INSERT_API,
  UPDATE_API,
  DELETE_API,
  DELETE_ALL_API_PARAMETERS,
  INSERT_API_PARAMETER,
  CHECK_API_NAME_EXISTS,
  CHECK_API_URI_METHOD_EXISTS,
  CHECK_API_USED_IN_SYNTHETIC_TESTS,
} from '@/queries/apiQueries';
import {
  SELECT_TAG_BY_NAME,
  INSERT_TAG,
  DELETE_API_TAG_MEMBERS,
  INSERT_API_TAG_MEMBER,
} from '@/queries/tagQueries';
import { Api, ApiParameter } from '@/types';
import { tr } from 'date-fns/locale';

export interface CreateApiInput {
  apiName: string;
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  tags?: string;
  clientIp: string;
  parameters?: Array<{
    apiParameterName: string;
    apiParameterType: 'query' | 'body';
    apiParameterRequired: 'Y' | 'N';
    apiParameterDesc?: string;
  }>;
}

export interface UpdateApiInput {
  apiName?: string;
  uri?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  tags?: string;
  clientIp: string;
  parameters?: Array<{
    apiParameterName: string;
    apiParameterType: 'query' | 'body';
    apiParameterRequired: 'Y' | 'N';
    apiParameterDesc?: string;
  }>;
}

export class ApiServiceDB {
  /**
   * 모든 API 조회 (태그 포함)
   */
  static async getAllApis(method?: string): Promise<Api[]> {
    try {
      let apis;
      
      if (method) {
        console.log(`SELECT_APIS_WITH_TAGS : `,SELECT_APIS_WITH_TAGS.replace( 'ORDER BY a.CREATED_AT DESC','HAVING a.METHOD = :method ORDER BY a.CREATED_AT DESC'));
        apis = await db.query(
          SELECT_APIS_WITH_TAGS.replace(
            'ORDER BY a.CREATED_AT DESC',
            'HAVING a.METHOD = :method ORDER BY a.CREATED_AT DESC'
          ),
          { method: method.toUpperCase() }
        );
      } else {
        console.log(`SELECT_APIS_WITH_TAGS : `,SELECT_APIS_WITH_TAGS);
        apis = await db.query(SELECT_APIS_WITH_TAGS);
      }

      // LISTAGG NULL 처리
      return apis.map((api: any) => ({
        ...api,
        tags: api.tags || ''
      }));
    } catch (error) {
      console.error('[ApiService] Error fetching APIs:', error);
      throw error;
    }
  }

  /**
   * 특정 API 상세 조회 (파라미터 포함)
   */
  static async getApiById(apiId: number): Promise<Api | null> {
    try {
      console.log(`SELECT_API_DETAIL_WITH_TAGS : `,SELECT_API_DETAIL_WITH_TAGS, apiId);
      const rows = await db.query(SELECT_API_DETAIL_WITH_TAGS, { apiId });

      if (rows.length === 0) {
        return null;
      }

      const firstRow: any = rows[0];
      const apiData: Api = {
        apiId: firstRow.apiId,
        apiName: firstRow.apiName,
        uri: firstRow.uri,
        method: firstRow.method,
        tags: firstRow.tags || '',
        createdAt: firstRow.createdAt,
        apiParameterIds: rows
          .filter((row: any) => row.apiParameterId)
          .map((row: any) => row.apiParameterId),
      };

      return apiData;
    } catch (error) {
      console.error('[ApiService] Error fetching API by ID:', error);
      throw error;
    }
  }

  /**
   * API 이름 중복 확인
   */
  static async checkApiNameExists(apiName: string, excludeId?: number): Promise<boolean> {
    try {
      console.log(`CHECK_API_NAME_EXISTS : `,CHECK_API_NAME_EXISTS, apiName,excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_API_NAME_EXISTS,
        { apiName, excludeId: excludeId || null }
      );
      
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[ApiService] Error checking API name:', error);
      throw error;
    }
  }

  /**
   * API URI + METHOD 중복 확인
   */
  static async checkApiUriMethodExists(
    uri: string,
    method: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      console.log(`CHECK_API_URI_METHOD_EXISTS : `,CHECK_API_URI_METHOD_EXISTS, uri,method,excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_API_URI_METHOD_EXISTS,
        { uri, method: method.toUpperCase(), excludeId: excludeId || null }
      );
      
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[ApiService] Error checking URI+METHOD:', error);
      throw error;
    }
  }

  /**
   * 새 API 생성
   */
  static async createApi(data: CreateApiInput): Promise<Api> {
    try {
      console.log('[ApiService] Creating API with data:', data);  
      // 중복 확인
      const nameExists = await this.checkApiNameExists(data.apiName);
      if (nameExists) {
        throw new Error('API name already exists');
      }

      // URI+METHOD 중복 확인 제외 copy된 API는 같은 URI+METHOD 허용
      if(!data.apiName.includes('복사본')) {
        const uriMethodExists = await this.checkApiUriMethodExists(data.uri, data.method);
        if (uriMethodExists) {
          throw new Error('API with same URI and method already exists');
        }
      }

      // 트랜잭션으로 API 생성
      const apiId = await db.transaction(async (conn) => {
        // 1. API 생성
        console.log(`INSERT_API : `,INSERT_API,data);
        const insertResult = await conn.execute(
          INSERT_API,
          {
            apiName: data.apiName,
            uri: data.uri,
            method: data.method.toUpperCase(),
            clientIp: data.clientIp,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: true }
        );

        const apiId = insertResult.outBinds?.id?.[0];
        if (!apiId) {
          throw new Error('Failed to get generated API ID');
        }

        console.log('[ApiService] API created with ID:', apiId);

        // 2. 태그 처리
        if (data.tags && data.tags.trim()) {
          await this.processApiTagsInTransaction(conn, apiId, data.tags);
        }

        // 3. 파라미터 추가
        if (data.parameters && data.parameters.length > 0) {
          for (const param of data.parameters) {
            console.log(`INSERT_API_PARAMETER : `,INSERT_API_PARAMETER,apiId,param);
            await conn.execute(
              INSERT_API_PARAMETER,
              {
                apiId,
                apiParameterName: param.apiParameterName,
                apiParameterType: param.apiParameterType,
                apiParameterRequired: param.apiParameterRequired,
                apiParameterDesc: param.apiParameterDesc || null,
                clientIp: data.clientIp,
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
              },
              { autoCommit: true }
            );
          }
          console.log('[ApiService] Parameters added:', data.parameters.length);
        }

        return apiId;
      });

      // 생성된 API 조회
      const newApi = await this.getApiById(apiId);
      if (!newApi) {
        throw new Error('Failed to fetch created API');
      }

      return newApi;
    } catch (error) {
      console.error('[ApiService] Error creating API:', error);
      throw error;
    }
  }

  /**
   * API 수정
   */
  static async updateApi(apiId: number, data: UpdateApiInput): Promise<Api> {
    try {
      // API 존재 확인
      const existingApi = await this.getApiById(apiId);
      if (!existingApi) {
        throw new Error('API not found');
      }

      // 중복 확인
      if (data.apiName) {
        const nameExists = await this.checkApiNameExists(data.apiName, apiId);
        if (nameExists) {
          throw new Error('같은 API이름이 이미 존재합니다');
        }
      }

      if (data.uri || data.method) {
        const uriToCheck = data.uri || existingApi.uri;
        const methodToCheck = data.method || existingApi.method;
        const uriMethodExists = await this.checkApiUriMethodExists(
          uriToCheck,
          methodToCheck,
          apiId
        );
        if (uriMethodExists) {
          throw new Error('같은 URI와 Method가 이미 존재합니다');
        }
      }

      // 트랜잭션으로 수정
      await db.transaction(async (conn) => {
        // 1. 기본 정보 수정
        if (data.apiName !== undefined || data.uri !== undefined || data.method !== undefined) {
          console.log(`UPDATE_API : `,UPDATE_API,apiId,data,existingApi);
          const updateResult = await conn.execute(
            UPDATE_API,
            {
              apiId,
              apiName: data.apiName || existingApi.apiName,
              uri: data.uri || existingApi.uri,
              method: (data.method || existingApi.method).toUpperCase(),
              clientIp: data.clientIp,
              updatedId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
          );

          const updatedId = (updateResult.outBinds as any)?.updatedId?.[0];
          if (!updatedId) {
            throw new Error('Failed to update API');
          }
        }

        // 2. 태그 처리
        if (data.tags !== undefined) {
          await conn.execute(DELETE_API_TAG_MEMBERS, { apiId }, { autoCommit: true });

          if (data.tags && data.tags.trim()) {
            await this.processApiTagsInTransaction(conn, apiId, data.tags,data.clientIp);
          }
        }

        // 3. 파라미터 교체
        if (data.parameters !== undefined) {
          await conn.execute(DELETE_ALL_API_PARAMETERS, { apiId }, { autoCommit: true });

          for (const param of data.parameters) {
            console.log(`INSERT_API_PARAMETER : `,INSERT_API_PARAMETER,apiId,param);
            await conn.execute(
              INSERT_API_PARAMETER,
              {
                apiId,
                apiParameterName: param.apiParameterName,
                apiParameterType: param.apiParameterType,
                apiParameterRequired: param.apiParameterRequired,
                apiParameterDesc: param.apiParameterDesc || null,
                clientIp: data.clientIp,
                id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
              },
              { autoCommit: true }
            );
          }
        }
      });

      // 수정된 API 조회
      const updatedApi = await this.getApiById(apiId);
      if (!updatedApi) {
        throw new Error('Failed to fetch updated API');
      }

      return updatedApi;
    } catch (error) {
      console.error('[ApiService] Error updating API:', error);
      throw error;
    }
  }

  /**
   * API 삭제
   */
  static async deleteApi(apiId: number): Promise<void> {
    try {
      // 1. Synthetic Test에서 사용 중인지 확인
      console.log(`CHECK_API_USED_IN_SYNTHETIC_TESTS : `, CHECK_API_USED_IN_SYNTHETIC_TESTS, apiId);
      const usageResult = await db.query<{ COUNT: number; testNames: string }>(
        CHECK_API_USED_IN_SYNTHETIC_TESTS,
        { apiId }
      );

      if (usageResult[0]?.COUNT > 0) {
        throw new Error(`이 API는 ${usageResult[0]?.testNames}에서 사용 중이므로 삭제할 수 없습니다.`);
      }

      // 2. 사용 중이 아니면 삭제 진행
      console.log(`DELETE_API : `,DELETE_API,apiId);
      const rowsAffected = await db.execute(DELETE_API, { apiId }, true);

      if (rowsAffected === 0) {
        throw new Error('API not found');
      }

      console.log('[ApiService] API deleted:', apiId);
    } catch (error) {
      console.error('[ApiService] Error deleting API:', error);
      throw error;
    }
  }

  /**
   * 트랜잭션 내에서 태그 처리
   */
  private static async processApiTagsInTransaction(
    conn: any,
    apiId: number,
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
          console.log(`INSERT_API_TAG_MEMBER : `,INSERT_API_TAG_MEMBER,tagId, apiId,clientIp);
          await conn.execute(
            INSERT_API_TAG_MEMBER,
            { tagId, apiId, clientIp },
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
