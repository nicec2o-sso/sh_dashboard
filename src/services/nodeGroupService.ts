import { NodeGroup, CreateNodeGroupDto, UpdateNodeGroupDto } from '@/types';
import { NodeService } from './nodeService';

// 샘플 데이터
let nodeGroups: NodeGroup[] = [
  { 
    nodeGroupId: 1, 
    nodeGroupName: 'Web Cluster', 
    nodeGroupDesc: 'All web servers', 
    nodeIds: [1, 2],
    createdAt: new Date().toISOString()
  },
  { 
    nodeGroupId: 2, 
    nodeGroupName: 'Backend Services', 
    nodeGroupDesc: 'Database and cache', 
    nodeIds: [3, 4],
    createdAt: new Date().toISOString()
  },
  { 
    nodeGroupId: 3, 
    nodeGroupName: 'Health check!', 
    nodeGroupDesc: 'Nodes for synthetic testing', 
    nodeIds: [1, 2, 3],
    createdAt: new Date().toISOString()
  },
];

let nextId = 4;

export class NodeGroupService {
  /**
   * 모든 노드 그룹 조회
   */
  static getAllNodeGroups(): NodeGroup[] {
    console.log('NodeGroupService getAllNodeGroups called');
    return [...nodeGroups];
  }

  /**
   * ID로 노드 그룹 조회
   */
  static getNodeGroupById(nodeGroupId: number): NodeGroup | null {
    console.log('NodeGroupService getNodeGroupById called with id:', nodeGroupId);
    return nodeGroups.find(group => group.nodeGroupId === nodeGroupId) || null;
  }

  /**
   * 노드 그룹 생성
   */
  static createNodeGroup(dto: CreateNodeGroupDto): NodeGroup | null {
    console.log('NodeGroupService createNodeGroup called with dto:', dto);
    // 유효성 검증: 모든 노드 ID가 존재하는지 확인
    const validNodeIds = dto.nodeIds.filter(nodeId => 
      NodeService.getNodeById(nodeId) !== null
    );

    if (validNodeIds.length !== dto.nodeIds.length) {
      return null; // 존재하지 않는 노드 ID가 포함됨
    }

    const newGroup: NodeGroup = {
      nodeGroupId: nextId++,
      nodeGroupName: dto.nodeGroupName,
      nodeGroupDesc: dto.nodeGroupDesc,
      nodeIds: dto.nodeIds,
      createdAt: new Date().toISOString(),
    };

    nodeGroups.push(newGroup);
    return newGroup;
  }

  /**
   * 노드 그룹 수정
   */
  static updateNodeGroup(nodeGroupId: number, dto: UpdateNodeGroupDto): NodeGroup | null {
    console.log('NodeGroupService updateNodeGroup called with nodeGroupId:', nodeGroupId, 'dto:', dto);
    const groupIndex = nodeGroups.findIndex(group => group.nodeGroupId === nodeGroupId);
    if (groupIndex === -1) return null;

    // nodeIds가 제공된 경우 유효성 검증
    if (dto.nodeIds) {
      const validNodeIds = dto.nodeIds.filter(nodeId => 
        NodeService.getNodeById(nodeId) !== null
      );

      if (validNodeIds.length !== dto.nodeIds.length) {
        return null; // 존재하지 않는 노드 ID가 포함됨
      }
    }

    nodeGroups[groupIndex] = {
      ...nodeGroups[groupIndex],
      ...dto,
    };

    console.log('NodeGroupService updateNodeGroup updated group:', nodeGroups[groupIndex]);
    return nodeGroups[groupIndex];
  }

  /**
   * 노드 그룹 삭제
   */
  static deleteNodeGroup(nodeGroupId: number): boolean {
    console.log('NodeGroupService deleteNodeGroup called with nodeGroupId:', nodeGroupId);
    const initialLength = nodeGroups.length;
    nodeGroups = nodeGroups.filter(group => group.nodeGroupId !== nodeGroupId);
    return nodeGroups.length < initialLength;
  }

  /**
   * 노드 그룹에 노드 추가
   */
  static addNodeToGroup(groupId: number, nodeId: number): NodeGroup | null {
    console.log('NodeGroupService addNodeToGroup called with groupId:', groupId, 'nodeId:', nodeId);
    const group = this.getNodeGroupById(groupId);
    if (!group) return null;

    // 노드 존재 여부 확인
    if (!NodeService.getNodeById(nodeId)) return null;

    // 이미 포함되어 있는지 확인
    if (group.nodeIds.includes(nodeId)) return group;

    const updatedNodeIds = [...group.nodeIds, nodeId];
    return this.updateNodeGroup(groupId, { nodeIds: updatedNodeIds });
  }

  /**
   * 노드 그룹에서 노드 제거
   */
  static removeNodeFromGroup(groupId: number, nodeId: number): NodeGroup | null {
    console.log('NodeGroupService removeNodeFromGroup called with groupId:', groupId, 'nodeId:', nodeId);
    const group = this.getNodeGroupById(groupId);
    if (!group) return null;

    const updatedNodeIds = group.nodeIds.filter(nodeId => nodeId !== nodeId);
    return this.updateNodeGroup(groupId, { nodeIds: updatedNodeIds });
  }

  /**
   * 특정 노드가 속한 모든 그룹 조회
   */
  static getGroupsByNodeId(nodeId: number): NodeGroup[] {
    console.log('NodeGroupService getGroupsByNodeId called with nodeId:', nodeId);
    return nodeGroups.filter(group => group.nodeIds.includes(nodeId));
  }

  /**
   * 그룹 내 모든 노드 조회
   */
  static getNodesInGroup(groupId: number) {
    console.log('NodeGroupService getNodesInGroup called with groupId:', groupId);
    const group = this.getNodeGroupById(groupId);
    if (!group) return null;

    return NodeService.getNodesByIds(group.nodeIds);
  }

  /**
   * 그룹명으로 검색
   */
  static searchNodeGroupsByName(nodeGroupName: string): NodeGroup[] {
    console.log('NodeGroupService searchNodeGroupsByName called with nodeGroupName:', nodeGroupName);
    return nodeGroups.filter(group => 
      group.nodeGroupName.toLowerCase().includes(nodeGroupName.toLowerCase())
    );
  }
}