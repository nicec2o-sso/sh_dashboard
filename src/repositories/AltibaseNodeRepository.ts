/**
 * Altibase Node Repository 구현
 * 
 * INodeRepository 인터페이스를 Altibase 데이터베이스로 구현합니다.
 * 모든 Node 관련 데이터베이스 작업을 캡슐화합니다.
 * 
 * 사용되는 테이블: NODES
 * 사용되는 시퀀스: SEQ_NODE_ID
 */

import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';
import { INodeRepository } from './INodeRepository';
import { db } from '@/lib/altibase';

/**
 * Altibase 데이터베이스 Row 타입
 * 
 * Altibase에서 반환되는 컬럼명은 대문자이므로 별도 타입 정의
 */
interface NodeRow {
  ID: number;
  NAME: string;
  HOST: string;
  PORT: number;
  STATUS: 'healthy' | 'warning' | 'error';
  DESCRIPTION?: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

/**
 * Altibase Node Repository
 * 
 * Altibase 데이터베이스를 사용하여 Node 데이터를 관리합니다.
 */
export class AltibaseNodeRepository implements INodeRepository {
  /**
   * Row 데이터를 Node 객체로 변환
   * 
   * Altibase의 컬럼명(대문자)을 TypeScript 객체(camelCase)로 변환합니다.
   * 
   * @param row - Altibase에서 반환된 Row 데이터
   * @returns Node 객체
   */
  private rowToNode(row: NodeRow): Node {
    return {
      id: row.ID,
      name: row.NAME,
      host: row.HOST,
      port: row.PORT,
      status: row.STATUS,
      description: row.DESCRIPTION,
      createdAt: row.CREATED_AT.toISOString(),
    };
  }

  /**
   * 모든 노드 조회
   * 
   * @returns 모든 노드 배열
   */
  async findAll(): Promise<Node[]> {
    try {
      const sql = `
        SELECT 
          ID, NAME, HOST, PORT, STATUS, 
          DESCRIPTION, CREATED_AT, UPDATED_AT
        FROM NODES
        ORDER BY ID
      `;

      const rows = await db.query<NodeRow>(sql);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error('[AltibaseNodeRepository] findAll error:', error);
      throw new Error(`Failed to fetch all nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ID로 노드 조회
   * 
   * @param id - 조회할 노드 ID
   * @returns 노드 객체 또는 null
   */
  async findById(id: number): Promise<Node | null> {
    try {
      const sql = `
        SELECT 
          ID, NAME, HOST, PORT, STATUS, 
          DESCRIPTION, CREATED_AT, UPDATED_AT
        FROM NODES
        WHERE ID = ?
      `;

      const rows = await db.query<NodeRow>(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      return this.rowToNode(rows[0]);
    } catch (error) {
      console.error(`[AltibaseNodeRepository] findById(${id}) error:`, error);
      throw new Error(`Failed to fetch node ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 여러 ID로 노드들 조회
   * 
   * @param ids - 조회할 노드 ID 배열
   * @returns 노드 배열
   */
  async findByIds(ids: number[]): Promise<Node[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      // IN 절을 위한 placeholder 생성 (?, ?, ?)
      const placeholders = ids.map(() => '?').join(', ');
      
      const sql = `
        SELECT 
          ID, NAME, HOST, PORT, STATUS, 
          DESCRIPTION, CREATED_AT, UPDATED_AT
        FROM NODES
        WHERE ID IN (${placeholders})
        ORDER BY ID
      `;

      const rows = await db.query<NodeRow>(sql, ids);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error('[AltibaseNodeRepository] findByIds error:', error);
      throw new Error(`Failed to fetch nodes by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 호스트로 노드 검색 (부분 일치)
   * 
   * @param host - 검색할 호스트 문자열
   * @returns 일치하는 노드 배열
   */
  async findByHost(host: string): Promise<Node[]> {
    try {
      const sql = `
        SELECT 
          ID, NAME, HOST, PORT, STATUS, 
          DESCRIPTION, CREATED_AT, UPDATED_AT
        FROM NODES
        WHERE HOST LIKE ?
        ORDER BY ID
      `;

      // LIKE 검색을 위한 와일드카드 추가
      const searchPattern = `%${host}%`;
      const rows = await db.query<NodeRow>(sql, [searchPattern]);
      
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error(`[AltibaseNodeRepository] findByHost(${host}) error:`, error);
      throw new Error(`Failed to search nodes by host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 상태별 노드 조회
   * 
   * @param status - 조회할 상태
   * @returns 해당 상태의 노드 배열
   */
  async findByStatus(status: 'healthy' | 'warning' | 'error'): Promise<Node[]> {
    try {
      const sql = `
        SELECT 
          ID, NAME, HOST, PORT, STATUS, 
          DESCRIPTION, CREATED_AT, UPDATED_AT
        FROM NODES
        WHERE STATUS = ?
        ORDER BY ID
      `;

      const rows = await db.query<NodeRow>(sql, [status]);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error(`[AltibaseNodeRepository] findByStatus(${status}) error:`, error);
      throw new Error(`Failed to fetch nodes by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 생성
   * 
   * 시퀀스를 사용하여 자동으로 ID를 생성합니다.
   * 
   * @param data - 생성할 노드 데이터
   * @returns 생성된 노드 객체
   */
  async create(data: CreateNodeDto): Promise<Node> {
    try {
      // 트랜잭션으로 실행
      const result = await db.transaction(async (conn) => {
        // 1. 새 ID 생성
        const idResult = await conn.query<{ NEXTVAL: number }>('SELECT SEQ_NODE_ID.NEXTVAL AS NEXTVAL FROM DUAL');
        const newId = idResult[0].NEXTVAL;

        // 2. 노드 삽입
        const sql = `
          INSERT INTO NODES (
            ID, NAME, HOST, PORT, STATUS, 
            DESCRIPTION, CREATED_AT, UPDATED_AT
          )
          VALUES (?, ?, ?, ?, 'healthy', ?, SYSDATE, SYSDATE)
        `;

        await conn.query(sql, [
          newId,
          data.name,
          data.host,
          data.port,
          data.description || null,
        ]);

        // 3. 생성된 노드 조회
        const selectSql = `
          SELECT 
            ID, NAME, HOST, PORT, STATUS, 
            DESCRIPTION, CREATED_AT, UPDATED_AT
          FROM NODES
          WHERE ID = ?
        `;

        const rows = await conn.query<NodeRow>(selectSql, [newId]);
        return this.rowToNode(rows[0]);
      });

      console.log(`[AltibaseNodeRepository] Created node: ID=${result.id}, Name=${result.name}`);
      return result;
    } catch (error) {
      console.error('[AltibaseNodeRepository] create error:', error);
      throw new Error(`Failed to create node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 수정
   * 
   * @param id - 수정할 노드 ID
   * @param data - 수정할 데이터
   * @returns 수정된 노드 객체 또는 null
   */
  async update(id: number, data: UpdateNodeDto): Promise<Node | null> {
    try {
      // 노드 존재 여부 확인
      const existingNode = await this.findById(id);
      if (!existingNode) {
        return null;
      }

      // 동적 UPDATE 쿼리 생성
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (data.name !== undefined) {
        updateFields.push('NAME = ?');
        updateValues.push(data.name);
      }

      if (data.host !== undefined) {
        updateFields.push('HOST = ?');
        updateValues.push(data.host);
      }

      if (data.port !== undefined) {
        updateFields.push('PORT = ?');
        updateValues.push(data.port);
      }

      if (data.status !== undefined) {
        updateFields.push('STATUS = ?');
        updateValues.push(data.status);
      }

      // 수정할 필드가 없으면 기존 노드 반환
      if (updateFields.length === 0) {
        return existingNode;
      }

      // UPDATED_AT 자동 업데이트
      updateFields.push('UPDATED_AT = SYSDATE');

      // WHERE 절을 위한 ID 추가
      updateValues.push(id);

      const sql = `
        UPDATE NODES
        SET ${updateFields.join(', ')}
        WHERE ID = ?
      `;

      await db.query(sql, updateValues);

      // 수정된 노드 조회 및 반환
      const updatedNode = await this.findById(id);
      
      console.log(`[AltibaseNodeRepository] Updated node: ID=${id}`);
      return updatedNode;
    } catch (error) {
      console.error(`[AltibaseNodeRepository] update(${id}) error:`, error);
      throw new Error(`Failed to update node ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 삭제
   * 
   * 외래키 제약조건으로 인해 관련 데이터도 함께 삭제됩니다 (CASCADE).
   * 
   * @param id - 삭제할 노드 ID
   * @returns 삭제 성공 여부
   */
  async delete(id: number): Promise<boolean> {
    try {
      const sql = `
        DELETE FROM NODES
        WHERE ID = ?
      `;

      await db.query(sql, [id]);

      // 삭제 확인
      const deletedNode = await this.findById(id);
      const success = deletedNode === null;

      if (success) {
        console.log(`[AltibaseNodeRepository] Deleted node: ID=${id}`);
      }

      return success;
    } catch (error) {
      console.error(`[AltibaseNodeRepository] delete(${id}) error:`, error);
      throw new Error(`Failed to delete node ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
