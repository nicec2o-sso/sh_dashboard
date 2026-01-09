import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';

// 샘플 데이터 (실제 환경에서는 DB로 대체)
let nodes: Node[] = [];

let nextId = 6;

export class NodeService {
  /**
   * 모든 노드 조회
   */
  static getAllNodes(): Node[] {
    console.log('NodeService getAllNodes called');
    return [...nodes];
  }

  /**
   * ID로 노드 조회
   */
  static getNodeById(id: number): Node | null {
    return nodes.find(node => node.nodeId === id) || null;
  }

  /**
   * 여러 ID로 노드들 조회
   */
  static getNodesByIds(ids: number[]): Node[] {
    return nodes.filter(node => ids.includes(node.nodeId));
  }

  /**
   * 노드 생성
   */
  static createNode(dto: CreateNodeDto): Node {
    console.log('NodeService createNode called with dto:', dto);
    const newNode: Node = {
      nodeId: nextId++, 
      nodeName: dto.nodeName,
      host: dto.host,
      port: dto.port,
      nodeStatus: 'active',
      createdAt: new Date().toISOString(),
    };
    nodes.push(newNode);
    return newNode;
  }

  /**
   * 노드 수정
   */
  static updateNode(nodeId: number, dto: UpdateNodeDto): Node | null {
    
    const nodeIndex = nodes.findIndex(node => node.nodeId === nodeId);
    if (nodeIndex === -1) return null;

    console.log('NodeService updateNode called with id:', nodeId, 'dto:', dto, 'nodes before update:', nodes[nodeIndex]);
    nodes[nodeIndex] = {
      ...nodes[nodeIndex],
      ...dto,
    };

    console.log('NodeService updateNode updated node:', nodes[nodeIndex]);
    return nodes[nodeIndex];
  }

  /**
   * 노드 삭제
   */
  static deleteNode(nodeId: number): boolean {
    console.log('NodeService deleteNode called with id:', nodeId);
    console.log('Nodes before deletion:', nodes);
    const initialLength = nodes.length;
    nodes = nodes.filter(node => node.nodeId !== nodeId);
    return nodes.length < initialLength;
  }

  /**
   * 노드 상태 업데이트
   */
  static updateNodeStatus(nodeId: number, nodeStatus: 'active' | 'inactive' | 'warning' | 'error'): Node | null {
    console.log('NodeService updateNodeStatus called with id:', nodeId, 'status:', nodeStatus);
    return this.updateNode(nodeId, { nodeStatus });
  }

  /**
   * 노드 헬스체크
   */
  static async checkNodeHealth(nodeId: number): Promise<string> {
    console.log('NodeService checkNodeHealth called with id:', nodeId);
    // 실제 환경에서는 실제 헬스체크 로직 구현
    const node = this.getNodeById(nodeId);
    if (!node) return 'error';

    // 시뮬레이션: 90% 확률로 성공
    const isHealthy = Math.random() > 0.1;
    const newStatus = isHealthy ? 'active' : 'error';
    this.updateNodeStatus(nodeId, newStatus);
    
    return newStatus;
  }

  /**
   * 호스트명으로 노드 검색
   */
  static searchNodesByHost(host: string): Node[] {
    console.log ('NodeService searchNodesByHost called with host:', host);
    return nodes.filter(node => node.host.includes(host));
  }

  /**
   * 상태별 노드 조회
   */
  static getNodesByStatus(nodeStatus: 'active' | 'inactive' | 'warning' | 'error'): Node[] {
    return nodes.filter(node => node.nodeStatus === nodeStatus);
  }
}