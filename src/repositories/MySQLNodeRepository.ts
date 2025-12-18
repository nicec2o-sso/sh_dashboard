/**
 * MySQL Node Repository 구현
 * 
 * INodeRepository 인터페이스를 MySQL 데이터베이스로 구현합니다.
 * 모든 Node 관련 데이터베이스 작업을 캡슐화합니다.
 * 
 * 사용되는 테이블: nodes
 * AUTO_INCREMENT를 사용하여 ID 자동 생성
 */

import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';
import { INodeRepository } from './INodeRepository';
import { db } from '@/lib/mysql';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * MySQL 데이터베이스 Row 타입
 * 
 * MySQL에서 반환되는 컬럼명은 소문자이므로 별도 타입 정의
 */
interface NodeRow extends RowDataPacket {
  id: number;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'warning' | 'error';
  description?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * MySQL Node Repository
 * 
 * MySQL 데이터베이스를 사용하여 Node 데이터를 관리합니다.
 */
export class MySQLNodeRepository implements INodeRepository {
  /**
   * Row 데이터를 Node 객체로 변환
   * 
   * MySQL의 컬럼명(소문자)을 TypeScript 객체(camelCase)로 변환합니다.
   * 
   * @param row - MySQL에서 반환된 Row 데이터
   * @returns Node 객체
   */
  private rowToNode(row: NodeRow): Node {
    return {
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      status: row.status,
      description: row.description,
      createdAt: row.created_at instanceof Date 
        ? row.created_at.toISOString() 
        : new Date(row.created_at).toISOString(),
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
          id, name, host, port, status, 
          description, created_at, updated_at
        FROM nodes
        ORDER BY id
      `;

      const rows = await db.query<NodeRow>(sql);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error('[MySQLNodeRepository] findAll error:', error);
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
          id, name, host, port, status, 
          description, created_at, updated_at
        FROM nodes
        WHERE id = ?
      `;

      const rows = await db.query<NodeRow>(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      return this.rowToNode(rows[0]);
    } catch (error) {
      console.error(`[MySQLNodeRepository] findById(${id}) error:`, error);
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
          id, name, host, port, status, 
          description, created_at, updated_at
        FROM nodes
        WHERE id IN (${placeholders})
        ORDER BY id
      `;

      const rows = await db.query<NodeRow>(sql, ids);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error('[MySQLNodeRepository] findByIds error:', error);
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
          id, name, host, port, status, 
          description, created_at, updated_at
        FROM nodes
        WHERE host LIKE ?
        ORDER BY id
      `;

      // LIKE 검색을 위한 와일드카드 추가
      const searchPattern = `%${host}%`;
      const rows = await db.query<NodeRow>(sql, [searchPattern]);
      
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error(`[MySQLNodeRepository] findByHost(${host}) error:`, error);
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
          id, name, host, port, status, 
          description, created_at, updated_at
        FROM nodes
        WHERE status = ?
        ORDER BY id
      `;

      const rows = await db.query<NodeRow>(sql, [status]);
      return rows.map(row => this.rowToNode(row));
    } catch (error) {
      console.error(`[MySQLNodeRepository] findByStatus(${status}) error:`, error);
      throw new Error(`Failed to fetch nodes by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 생성
   * 
   * AUTO_INCREMENT를 사용하여 자동으로 ID를 생성합니다.
   * 
   * @param data - 생성할 노드 데이터
   * @returns 생성된 노드 객체
   */
  async create(data: CreateNodeDto): Promise<Node> {
    try {
      // INSERT 실행 (ID는 AUTO_INCREMENT로 자동 생성)
      const sql = `
        INSERT INTO nodes (name, host, port, status, description, created_at, updated_at)
        VALUES (?, ?, ?, 'healthy', ?, NOW(), NOW())
      `;

      const result = await db.query<ResultSetHeader>(sql, [
        data.name,
        data.host,
        data.port,
      ]);

      // AUTO_INCREMENT로 생성된 ID 가져오기
      const newId = (result as any).insertId;

      // 생성된 노드 조회
      const createdNode = await this.findById(newId);
      
      if (!createdNode) {
        throw new Error('Failed to retrieve created node');
      }

      console.log(`[MySQLNodeRepository] Created node: ID=${createdNode.id}, Name=${createdNode.name}`);
      return createdNode;
    } catch (error) {
      console.error('[MySQLNodeRepository] create error:', error);
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
        updateFields.push('name = ?');
        updateValues.push(data.name);
      }

      if (data.host !== undefined) {
        updateFields.push('host = ?');
        updateValues.push(data.host);
      }

      if (data.port !== undefined) {
        updateFields.push('port = ?');
        updateValues.push(data.port);
      }

      if (data.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(data.status);
      }

      // 수정할 필드가 없으면 기존 노드 반환
      if (updateFields.length === 0) {
        return existingNode;
      }

      // updated_at은 ON UPDATE CURRENT_TIMESTAMP로 자동 업데이트되지만 명시적으로 추가
      updateFields.push('updated_at = NOW()');

      // WHERE 절을 위한 ID 추가
      updateValues.push(id);

      const sql = `
        UPDATE nodes
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await db.query(sql, updateValues);

      // 수정된 노드 조회 및 반환
      const updatedNode = await this.findById(id);
      
      console.log(`[MySQLNodeRepository] Updated node: ID=${id}`);
      return updatedNode;
    } catch (error) {
      console.error(`[MySQLNodeRepository] update(${id}) error:`, error);
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
        DELETE FROM nodes
        WHERE id = ?
      `;

      await db.query(sql, [id]);

      // 삭제 확인
      const deletedNode = await this.findById(id);
      const success = deletedNode === null;

      if (success) {
        console.log(`[MySQLNodeRepository] Deleted node: ID=${id}`);
      }

      return success;
    } catch (error) {
      console.error(`[MySQLNodeRepository] delete(${id}) error:`, error);
      throw new Error(`Failed to delete node ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
