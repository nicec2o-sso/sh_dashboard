/**
 * Node Service (Database Version)
 * 
 * 데이터베이스 기반 노드 관리 서비스
 */

import { db } from '@/lib/oracle';
import oracledb from 'oracledb';
import {
  INSERT_NODE,
  UPDATE_NODE,
  DELETE_NODE,
  CHECK_NODE_NAME_EXISTS,
  CHECK_NODE_HOST_PORT_EXISTS,
  SELECT_ALL_NODES_WITH_TAGS,
  SELECT_NODE_BY_ID_WITH_TAGS,
} from '@/queries/nodeQueries';
import {
  SELECT_TAG_BY_NAME,
  INSERT_TAG,
  DELETE_NODE_TAG_MEMBERS,
  INSERT_NODE_TAG_MEMBER,
} from '@/queries/tagQueries';

export interface Node {
  nodeId: number;
  nodeName: string;
  host: string;
  port: number;
  nodeStatus: string;
  nodeDesc?: string;
  tags?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNodeInput {
  nodeName: string;
  host: string;
  port: number;
  nodeStatus?: string;
  nodeDesc?: string;
  tags?: string;
}

export interface UpdateNodeInput {
  nodeName?: string;
  host?: string;
  port?: number;
  nodeStatus?: string;
  nodeDesc?: string;
  tags?: string;
}

export class NodeServiceDB {
  /**
   * 모든 노드 조회 (태그 포함)
   */
  static async getAllNodes(): Promise<Node[]> {
    try {
      console.log(`SELECT_ALL_NODES_WITH_TAGS : `,SELECT_ALL_NODES_WITH_TAGS);
      const nodes = await db.query<Node>(SELECT_ALL_NODES_WITH_TAGS);
      
      return nodes.map(node => ({
        ...node,
        tags: node.tags || ''
      }));
    } catch (error) {
      console.error('[NodeService] Error fetching nodes:', error);
      throw error;
    }
  }

  /**
   * 특정 노드 조회 (태그 포함)
   */
  static async getNodeById(nodeId: number): Promise<Node | null> {
    try {
      console.log(`SELECT_NODE_BY_ID_WITH_TAGS : `,SELECT_NODE_BY_ID_WITH_TAGS);
      const nodes = await db.query<Node>(SELECT_NODE_BY_ID_WITH_TAGS, { nodeId });
      
      if (nodes.length === 0) {
        return null;
      }

      return {
        ...nodes[0],
        tags: nodes[0].tags || ''
      };
    } catch (error) {
      console.error('[NodeService] Error fetching node by ID:', error);
      throw error;
    }
  }

  /**
   * 노드 이름 중복 확인
   */
  static async checkNodeNameExists(nodeName: string, excludeId?: number): Promise<boolean> {
    try {
      console.log(`CHECK_NODE_NAME_EXISTS : `,CHECK_NODE_NAME_EXISTS,nodeName, excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_NODE_NAME_EXISTS,
        { nodeName, excludeId: excludeId || null }
      );
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[NodeService] Error checking node name:', error);
      throw error;
    }
  }

  /**
   * 노드 HOST + PORT 중복 확인
   */
  static async checkNodeHostPortExists(
    host: string,
    port: number,
    excludeId?: number
  ): Promise<boolean> {
    try {
      console.log(`CHECK_NODE_HOST_PORT_EXISTS : `,CHECK_NODE_HOST_PORT_EXISTS,host, port, excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_NODE_HOST_PORT_EXISTS,
        { host, port, excludeId: excludeId || null }
      );
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[NodeService] Error checking host+port:', error);
      throw error;
    }
  }

  /**
   * 새 노드 생성
   */
  static async createNode(data: CreateNodeInput): Promise<Node> {
    try {
      // 중복 확인
      const nameExists = await this.checkNodeNameExists(data.nodeName);
      if (nameExists) {
        throw new Error('Node name already exists');
      }

      const hostPortExists = await this.checkNodeHostPortExists(data.host, data.port);
      if (hostPortExists) {
        throw new Error('Node with same host and port already exists');
      }

      // 트랜잭션으로 노드 생성
      const nodeId = await db.transaction(async (conn) => {
        // 1. 노드 생성
        console.log(`INSERT_NODE : `,INSERT_NODE,data);
        const insertResult = await conn.execute(
          INSERT_NODE,
          {
            nodeName: data.nodeName,
            host: data.host,
            port: data.port,
            nodeStatus: data.nodeStatus || 'active',
            nodeDesc: data.nodeDesc || null,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: false }
        );

        const nodeId = insertResult.outBinds?.id?.[0];
        if (!nodeId) {
          throw new Error('Failed to get generated node ID');
        }

        console.log('[NodeService] Node created with ID:', nodeId);

        // 2. 태그 처리
        if (data.tags && data.tags.trim()) {
          await this.processNodeTagsInTransaction(conn, nodeId, data.tags);
        }

        return nodeId;
      });

      // 생성된 노드 조회
      const newNode = await this.getNodeById(nodeId);
      if (!newNode) {
        throw new Error('Failed to fetch created node');
      }

      return newNode;
    } catch (error) {
      console.error('[NodeService] Error creating node:', error);
      throw error;
    }
  }

  /**
   * 노드 수정
   */
  static async updateNode(nodeId: number, data: UpdateNodeInput): Promise<Node> {
    try {
      // 노드 존재 확인
      const existingNode = await this.getNodeById(nodeId);
      if (!existingNode) {
        throw new Error('Node not found');
      }

      // 중복 확인
      if (data.nodeName) {
        const nameExists = await this.checkNodeNameExists(data.nodeName, nodeId);
        if (nameExists) {
          throw new Error('Node name already exists');
        }
      }

      if (data.host || data.port !== undefined) {
        const hostToCheck = data.host || existingNode.host;
        const portToCheck = data.port !== undefined ? data.port : existingNode.port;
        const hostPortExists = await this.checkNodeHostPortExists(hostToCheck, portToCheck, nodeId);
        if (hostPortExists) {
          throw new Error('Node with same host and port already exists');
        }
      }

      // 트랜잭션으로 수정
      await db.transaction(async (conn) => {
        // 1. 기본 정보 수정
        console.log(`UPDATE_NODE : `,UPDATE_NODE,data,existingNode);
        const updateResult = await conn.execute(
          UPDATE_NODE,
          {
            nodeId,
            nodeName: data.nodeName || existingNode.nodeName,
            host: data.host || existingNode.host,
            port: data.port !== undefined ? data.port : existingNode.port,
            nodeStatus: data.nodeStatus || existingNode.nodeStatus,
            nodeDesc: data.nodeDesc !== undefined ? data.nodeDesc : existingNode.nodeDesc,
            updatedId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: false }
        );

        const updatedId = updateResult.outBinds?.updatedId?.[0];
        if (!updatedId) {
          throw new Error('Failed to update node');
        }

        // 2. 태그 처리
        if (data.tags !== undefined) {
          console.log(`DELETE_NODE_TAG_MEMBERS : `,DELETE_NODE_TAG_MEMBERS,nodeId);
          await conn.execute(DELETE_NODE_TAG_MEMBERS, { nodeId }, { autoCommit: true });

          if (data.tags && data.tags.trim()) {
            await this.processNodeTagsInTransaction(conn, nodeId, data.tags);
          }
        }
      });

      // 수정된 노드 조회
      const updatedNode = await this.getNodeById(nodeId);
      if (!updatedNode) {
        throw new Error('Failed to fetch updated node');
      }

      return updatedNode;
    } catch (error) {
      console.error('[NodeService] Error updating node:', error);
      throw error;
    }
  }

  /**
   * 노드 삭제
   */
  static async deleteNode(nodeId: number): Promise<void> {
    try {
      console.log(`DELETE_NODE : `,DELETE_NODE,nodeId);
      const rowsAffected = await db.execute(DELETE_NODE, { nodeId }, true);

      if (rowsAffected === 0) {
        throw new Error('Node not found');
      }

      console.log('[NodeService] Node deleted:', nodeId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ORA-02292')) {
        throw new Error('Cannot delete node because it is referenced by other records');
      }
      console.error('[NodeService] Error deleting node:', error);
      throw error;
    }
  }

  /**
   * 트랜잭션 내에서 태그 처리
   */
  private static async processNodeTagsInTransaction(
    conn: any,
    nodeId: number,
    tagsString: string
  ): Promise<void> {
    const tagNames = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    for (const tagName of tagNames) {
      try {
        console.log(`SELECT_TAG_BY_NAME : `,SELECT_TAG_BY_NAME,tagName);
        const existingTagResult = await conn.execute(
          SELECT_TAG_BY_NAME,
          { tagName },
          { autoCommit: false, outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let tagId: number;

        if (existingTagResult.rows && existingTagResult.rows.length > 0) {
          tagId = (existingTagResult.rows[0] as any).tagId;
        } else {
          console.log(`INSERT_TAG : `,INSERT_TAG,tagName);
          const insertTagResult = await conn.execute(
            INSERT_TAG,
            {
              tagName,
              id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: false }
          );

          tagId = insertTagResult.outBinds?.id?.[0];
          if (!tagId) {
            throw new Error(`Failed to create tag: ${tagName}`);
          }
        }

        try {
          console.log(`INSERT_NODE_TAG_MEMBER : `,INSERT_NODE_TAG_MEMBER,tagName);
          await conn.execute(
            INSERT_NODE_TAG_MEMBER,
            { tagId, nodeId },
            { autoCommit: false }
          );
        } catch (err) {
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
