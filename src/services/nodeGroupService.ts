import { NodeGroup, CreateNodeGroupDto, UpdateNodeGroupDto } from '@/types';
import { NodeService } from './nodeService';

// 샘플 데이터
let nodeGroups: NodeGroup[] = [
  { 
    id: 1, 
    name: 'Web Cluster', 
    description: 'All web servers', 
    nodeIds: [1, 2],
    createdAt: new Date().toISOString()
  },
  { 
    id: 2, 
    name: 'Backend Services', 
    description: 'Database and cache', 
    nodeIds: [3, 4],
    createdAt: new Date().toISOString()
  },
  { 
    id: 3, 
    name: 'Health check!', 
    description: 'Nodes for synthetic testing', 
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
  static getNodeGroupById(id: number): NodeGroup | null {
    console.log('NodeGroupService getNodeGroupById called with id:', id);
    return nodeGroups.find(group => group.id === id) || null;
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
      id: nextId++,
      name: dto.name,
      description: dto.description,
      nodeIds: dto.nodeIds,
      createdAt: new Date().toISOString(),
    };

    nodeGroups.push(newGroup);
    return newGroup;
  }

  /**
   * 노드 그룹 수정
   */
  static updateNodeGroup(id: number, dto: UpdateNodeGroupDto): NodeGroup | null {
    console.log('NodeGroupService updateNodeGroup called with id:', id, 'dto:', dto);
    const groupIndex = nodeGroups.findIndex(group => group.id === id);
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
  static deleteNodeGroup(id: number): boolean {
    console.log('NodeGroupService deleteNodeGroup called with id:', id);
    const initialLength = nodeGroups.length;
    nodeGroups = nodeGroups.filter(group => group.id !== id);
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

    const updatedNodeIds = group.nodeIds.filter(id => id !== nodeId);
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
  static searchNodeGroupsByName(name: string): NodeGroup[] {
    console.log('NodeGroupService searchNodeGroupsByName called with name:', name);
    return nodeGroups.filter(group => 
      group.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}