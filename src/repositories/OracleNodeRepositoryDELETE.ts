/**
 * Oracle Node Repository
 * 
 * Oracle 데이터베이스를 사용하는 Node Repository 구현체
 * INodeRepository 인터페이스를 구현합니다.
 */

import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';
import { INodeRepository } from './INodeRepository';
import { db } from '@/lib/database';
import oracledb from 'oracledb';
import {
  SELECT_ALL_NODES,
  SELECT_NODE_BY_ID,
  SELECT_NODES_BY_IDS,
  SELECT_NODES_BY_STATUS,
  SEARCH_NODES_BY_HOST,
  INSERT_NODE,
  INSERT_NODE_BINDS,
  UPDATE_NODE,
  UPDATE_NODE_BINDS,
  DELETE_NODE,
} from '@/queries/nodeQueries';

export class OracleNodeRepository implements INodeRepository {
  /**
   * 모든 노드 조회
   */
  async findAll(): Promise<Node[]> {
    console.log('[OracleNodeRepository] findAll called');
    
    try {
      const rows = await db.query<Node>(SELECT_ALL_NODES);
      console.log(`[OracleNodeRepository] findAll returned ${rows.length} nodes`);
      return rows;
    } catch (error) {
      console.error('[OracleNodeRepository] findAll error:', error);
      throw new Error(`Failed to fetch nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ID로 노드 조회
   */
  async findById(nodeId: number): Promise<Node | null> {
    console.log(`[OracleNodeRepository] findById called with nodeId: ${nodeId}`);
    
    try {
      const rows = await db.query<Node>(SELECT_NODE_BY_ID, { nodeId });
      
      if (rows.length === 0) {
        console.log(`[OracleNodeRepository] findById: Node with nodeId ${nodeId} not found`);
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error(`[OracleNodeRepository] findById error:`, error);
      throw new Error(`Failed to fetch node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 여러 ID로 노드들 조회
   */
  async findByIds(ids: number[]): Promise<Node[]> {
    console.log(`[OracleNodeRepository] findByIds called with ids:`, ids);
    
    if (ids.length === 0) {
      return [];
    }
    
    try {
      // Oracle IN 절을 위한 동적 파라미터 생성
      const placeholders = ids.map((_, index) => `:nodeId${index}`).join(', ');
      const params: Record<string, number> = {};
      ids.forEach((nodeId, index) => {
        params[`nodeId${index}`] = nodeId;
      });
      
      const sql = SELECT_NODES_BY_IDS.replace(':nodeIds', placeholders);
      const rows = await db.query<Node>(sql, params);
      
      console.log(`[OracleNodeRepository] findByIds returned ${rows.length} nodes`);
      return rows;
    } catch (error) {
      console.error('[OracleNodeRepository] findByIds error:', error);
      throw new Error(`Failed to fetch nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 생성
   */
  async create(dto: CreateNodeDto): Promise<Node> {
    console.log('[OracleNodeRepository] create called with dto:', dto);
    
    try {
      const result = await db.executeReturning(
        INSERT_NODE,
        {
          nodeName: dto.nodeName,
          host: dto.host,
          port: dto.port,
          nodeStatus: dto.nodeStatus || 'active',
          nodeDesc: dto.nodeDesc || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { outBinds: INSERT_NODE_BINDS }
      );
      
      const newId = result.outBinds?.id[0];
      if (!newId) {
        throw new Error('Failed to get generated node ID');
      }
      
      console.log(`[OracleNodeRepository] create: Node created with nodeId: ${newId}`);
      
      const createdNode = await this.findById(newId);
      if (!createdNode) {
        throw new Error('Failed to fetch created node');
      }
      
      return createdNode;
    } catch (error) {
      console.error('[OracleNodeRepository] create error:', error);
      throw new Error(`Failed to create node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 수정
   */
  async update(nodeId: number, dto: UpdateNodeDto): Promise<Node | null> {
    console.log(`[OracleNodeRepository] update called with nodeId: ${nodeId}, dto:`, dto);
    
    try {
      // 기존 노드 확인
      const existingNode = await this.findById(nodeId);
      if (!existingNode) {
        return null;
      }

      // 업데이트할 데이터 병합 (기존 값 유지)
      const updateData = {
        nodeName: dto.nodeName ?? existingNode.nodeName,
        host: dto.host ?? existingNode.host,
        port: dto.port ?? existingNode.port,
        nodeStatus: dto.nodeStatus ?? existingNode.nodeStatus,
        nodeDesc: dto.nodeDesc ?? existingNode.nodeDesc ?? null,
        nodeId,
      };

      await db.executeReturning(
        UPDATE_NODE,
        updateData,
        { outBinds: UPDATE_NODE_BINDS }
      );
      
      console.log(`[OracleNodeRepository] update: Node ${nodeId} updated`);
      
      return await this.findById(nodeId);
    } catch (error) {
      console.error('[OracleNodeRepository] update error:', error);
      throw new Error(`Failed to update node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 노드 삭제
   */
  async delete(nodeId: number): Promise<boolean> {
    console.log(`[OracleNodeRepository] delete called with nodeId: ${nodeId}`);
    
    try {
      await db.query(DELETE_NODE, { nodeId });
      console.log(`[OracleNodeRepository] delete: Node ${nodeId} deleted`);
      return true;
    } catch (error) {
      console.error('[OracleNodeRepository] delete error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      throw new Error(`Failed to delete node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 호스트명으로 노드 검색
   */
  async findByHost(host: string): Promise<Node[]> {
    console.log(`[OracleNodeRepository] findByHost called with host: ${host}`);
    
    try {
      const rows = await db.query<Node>(SEARCH_NODES_BY_HOST, { host: `%${host}%` });
      console.log(`[OracleNodeRepository] findByHost returned ${rows.length} nodes`);
      return rows;
    } catch (error) {
      console.error('[OracleNodeRepository] findByHost error:', error);
      throw new Error(`Failed to search nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 상태별 노드 조회
   */
  async findByStatus(nodeStatus: 'active' | 'inactive' | 'warning' | 'error'): Promise<Node[]> {
    console.log(`[OracleNodeRepository] findByStatus called with nodeStatus: ${nodeStatus}`);
    
    try {
      const rows = await db.query<Node>(SELECT_NODES_BY_STATUS, { nodeStatus });
      console.log(`[OracleNodeRepository] findByStatus returned ${rows.length} nodes`);
      return rows;
    } catch (error) {
      console.error('[OracleNodeRepository] findByStatus error:', error);
      throw new Error(`Failed to fetch nodes by nodeStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
