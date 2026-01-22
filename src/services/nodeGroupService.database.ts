/**
 * Node Group Service (Database Version)
 * 
 * 데이터베이스 기반 노드 그룹 관리 서비스
 */

import { db } from '@/lib/oracle';
import oracledb from 'oracledb';
import {
  SELECT_NODE_GROUPS,
  SELECT_NODE_GROUP_DETAIL,
  INSERT_NODE_GROUP,
  UPDATE_NODE_GROUP,
  DELETE_NODE_GROUP,
  INSERT_NODE_GROUP_MEMBER,
  DELETE_ALL_NODE_GROUP_MEMBERS,
  CHECK_NODE_GROUP_NAME_EXISTS,
  CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS,
} from '@/queries/nodeGroupQueries';

export interface NodeGroup {
  nodeGroupId: number;
  nodeGroupName: string;
  nodeGroupDesc?: string;
  nodeCount: number;
  nodeIds: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NodeGroupDetail extends NodeGroup {
  nodes: Array<{
    nodeId: number;
    nodeName: string;
    host: string;
    port: number;
    nodeStatus: string;
    nodeDesc?: string;
  }>;
}

export interface CreateNodeGroupInput {
  nodeGroupName: string;
  nodeGroupDesc?: string;
  nodeIds?: number[];
}

export interface UpdateNodeGroupInput {
  nodeGroupName?: string;
  nodeGroupDesc?: string;
  nodeIds?: number[];
}

export class NodeGroupServiceDB {
  /**
   * 모든 노드 그룹 조회
   */
  static async getAllNodeGroups(): Promise<NodeGroup[]> {
    try {
      const groups = await db.query<any>(SELECT_NODE_GROUPS);

      return groups.map(group => ({
        nodeGroupId: group.nodeGroupId,
        nodeGroupName: group.nodeGroupName,
        nodeGroupDesc: group.nodeGroupDesc,
        nodeCount: group.nodeCount || 0,
        nodeIds: group.nodeIdsStr 
          ? group.nodeIdsStr.split(',').map((id: string) => parseInt(id, 10))
          : [],
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      }));
    } catch (error) {
      console.error('[NodeGroupService] Error fetching node groups:', error);
      throw error;
    }
  }

  /**
   * 특정 노드 그룹 상세 조회
   */
  static async getNodeGroupById(nodeGroupId: number): Promise<NodeGroupDetail | null> {
    try {
      console.log(`SELECT_NODE_GROUP_DETAIL : `,SELECT_NODE_GROUP_DETAIL,nodeGroupId);
      const rows = await db.query<any>(SELECT_NODE_GROUP_DETAIL, { nodeGroupId });

      if (rows.length === 0) {
        return null;
      }

      const firstRow = rows[0];
      const nodes = rows
        .filter(row => row.nodeId)
        .map(row => ({
          nodeId: row.nodeId,
          nodeName: row.nodeName,
          host: row.host,
          port: row.port,
          nodeStatus: row.nodeStatus,
          nodeDesc: row.nodeDesc,
        }));

      return {
        nodeGroupId: firstRow.nodeGroupId,
        nodeGroupName: firstRow.nodeGroupName,
        nodeGroupDesc: firstRow.nodeGroupDesc,
        nodeCount: nodes.length,
        nodeIds: nodes.map(n => n.nodeId),
        createdAt: firstRow.createdAt,
        updatedAt: firstRow.updatedAt,
        nodes,
      };
    } catch (error) {
      console.error('[NodeGroupService] Error fetching node group by ID:', error);
      throw error;
    }
  }

  /**
   * 노드 그룹 이름 중복 확인
   */
  static async checkNodeGroupNameExists(
    nodeGroupName: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      console.log(`CHECK_NODE_GROUP_NAME_EXISTS : `,CHECK_NODE_GROUP_NAME_EXISTS,nodeGroupName, excludeId);
      const result = await db.query<{ COUNT: number }>(
        CHECK_NODE_GROUP_NAME_EXISTS,
        { nodeGroupName, excludeId: excludeId || null }
      );
      return result[0]?.COUNT > 0;
    } catch (error) {
      console.error('[NodeGroupService] Error checking node group name:', error);
      throw error;
    }
  }

  /**
   * 새 노드 그룹 생성
   */
  static async createNodeGroup(data: CreateNodeGroupInput): Promise<NodeGroupDetail> {
    try {
      // 중복 확인
      const nameExists = await this.checkNodeGroupNameExists(data.nodeGroupName);
      if (nameExists) {
        throw new Error('Node group name already exists');
      }

      // 트랜잭션으로 노드 그룹 생성
      const nodeGroupId = await db.transaction(async (conn) => {
        // 1. 노드 그룹 생성
        console.log(`INSERT_NODE_GROUP : `,INSERT_NODE_GROUP,data);
        const insertResult = await conn.execute(
          INSERT_NODE_GROUP,
          {
            nodeGroupName: data.nodeGroupName,
            nodeGroupDesc: data.nodeGroupDesc || null,
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          },
          { autoCommit: false }
        );

        const nodeGroupId = insertResult.outBinds?.id?.[0];
        if (!nodeGroupId) {
          throw new Error('Failed to get generated node group ID');
        }

        console.log('[NodeGroupService] Node group created with ID:', nodeGroupId);

        // 2. 노드 멤버 추가
        if (data.nodeIds && data.nodeIds.length > 0) {
          for (const nodeId of data.nodeIds) {
            console.log(`INSERT_NODE_GROUP_MEMBER : `,INSERT_NODE_GROUP_MEMBER,nodeGroupId, nodeId);
            await conn.execute(
              INSERT_NODE_GROUP_MEMBER,
              { nodeGroupId, nodeId },
              { autoCommit: false }
            );
          }
          console.log('[NodeGroupService] Node members added:', data.nodeIds.length);
        }

        return nodeGroupId;
      });

      // 생성된 노드 그룹 조회
      const newNodeGroup = await this.getNodeGroupById(nodeGroupId);
      if (!newNodeGroup) {
        throw new Error('Failed to fetch created node group');
      }

      return newNodeGroup;
    } catch (error) {
      console.error('[NodeGroupService] Error creating node group:', error);
      throw error;
    }
  }

  /**
   * 노드 그룹 수정
   */
  static async updateNodeGroup(
    nodeGroupId: number,
    data: UpdateNodeGroupInput
  ): Promise<NodeGroupDetail> {
    try {
      // 노드 그룹 존재 확인
      const existingGroup = await this.getNodeGroupById(nodeGroupId);
      if (!existingGroup) {
        throw new Error('Node group not found');
      }

      // 중복 확인
      if (data.nodeGroupName) {
        const nameExists = await this.checkNodeGroupNameExists(data.nodeGroupName, nodeGroupId);
        if (nameExists) {
          throw new Error('Node group name already exists');
        }
      }

      // 트랜잭션으로 수정
      await db.transaction(async (conn) => {
        // 1. 기본 정보 수정
        if (data.nodeGroupName || data.nodeGroupDesc !== undefined) {
          console.log(`UPDATE_NODE_GROUP : `,UPDATE_NODE_GROUP,nodeGroupId, data);
          const updateResult = await conn.execute(
            UPDATE_NODE_GROUP,
            {
              nodeGroupId,
              nodeGroupName: data.nodeGroupName || existingGroup.nodeGroupName,
              nodeGroupDesc: data.nodeGroupDesc !== undefined 
                ? data.nodeGroupDesc 
                : existingGroup.nodeGroupDesc,
              id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: false }
          );

          const updatedId = updateResult.outBinds?.id?.[0];
          if (!updatedId) {
            throw new Error('Failed to update node group');
          }
        }

        // 2. 노드 멤버 교체
        if (data.nodeIds !== undefined) {
          // 기존 멤버 모두 삭제
          await conn.execute(
            DELETE_ALL_NODE_GROUP_MEMBERS,
            { nodeGroupId },
            { autoCommit: false }
          );

          // 새 멤버 추가
          if (data.nodeIds.length > 0) {
            for (const nodeId of data.nodeIds) {
              await conn.execute(
                INSERT_NODE_GROUP_MEMBER,
                { nodeGroupId, nodeId },
                { autoCommit: false }
              );
            }
          }
        }
      });

      // 수정된 노드 그룹 조회
      const updatedGroup = await this.getNodeGroupById(nodeGroupId);
      if (!updatedGroup) {
        throw new Error('Failed to fetch updated node group');
      }

      return updatedGroup;
    } catch (error) {
      console.error('[NodeGroupService] Error updating node group:', error);
      throw error;
    }
  }

  /**
   * 노드 그룹 삭제
   */
  static async deleteNodeGroup(nodeGroupId: number): Promise<void> {
    try {
      // 1. Synthetic Test에서 사용 중인지 확인
      console.log(`CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS : `, CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS, nodeGroupId);
      const usageResult = await db.query<{ COUNT: number; testNames: string }>(
        CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS,
        { nodeGroupId }
      );
      
      if (usageResult[0]?.COUNT > 0) {
        throw new Error(`이 노드 그룹은 ${usageResult[0]?.testNames}에서 사용 중이므로 삭제할 수 없습니다.`);
      }
    
      console.log(`DELETE_NODE_GROUP : `,DELETE_NODE_GROUP,nodeGroupId);
      const rowsAffected = await db.execute(DELETE_NODE_GROUP, { nodeGroupId }, true);

      if (rowsAffected === 0) {
        throw new Error('Node group not found');
      }

      console.log('[NodeGroupService] Node group deleted:', nodeGroupId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ORA-02292')) {
        throw new Error('Cannot delete node group because it is referenced by other records');
      }
      console.error('[NodeGroupService] Error deleting node group:', error);
      throw error;
    }
  }
}
