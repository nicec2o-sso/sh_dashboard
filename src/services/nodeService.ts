import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';

// 샘플 데이터 (실제 환경에서는 DB로 대체)
let nodes: Node[] = [
  { id: 1, name: 'Web Server 1', host: '192.168.1.10', port: 8080, status: 'healthy', createdAt: new Date().toISOString() , description: 'Primary web server'},
  { id: 2, name: 'Web Server 2', host: '192.168.1.2', port: 8080, status: 'warning', createdAt: new Date().toISOString() , description: 'Secondary web server'},
  { id: 3, name: 'DB Server', host: '192.11.33.4', port: 5432, status: 'error', createdAt: new Date().toISOString() , description: 'PostgreSQL database server'},
  { id: 4, name: 'Cache Server', host: '194.168.1.5', port: 6379, status: 'healthy', createdAt: new Date().toISOString() , description: 'Redis cache server'},
  { id: 5, name: 'API Server', host: '10.2.14.111', port: 3000, status: 'healthy', createdAt: new Date().toISOString() , description: 'Backend API server'},
];

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
    console.log
    return nodes.find(node => node.id === id) || null;
  }

  /**
   * 여러 ID로 노드들 조회
   */
  static getNodesByIds(ids: number[]): Node[] {
    console.log
    return nodes.filter(node => ids.includes(node.id));
  }

  /**
   * 노드 생성
   */
  static createNode(dto: CreateNodeDto): Node {
    console.log('NodeService createNode called with dto:', dto);
    const newNode: Node = {
      id: nextId++,
      name: dto.name,
      host: dto.host,
      port: dto.port,
      status: 'healthy',
      createdAt: new Date().toISOString(),
    };
    nodes.push(newNode);
    return newNode;
  }

  /**
   * 노드 수정
   */
  static updateNode(id: number, dto: UpdateNodeDto): Node | null {
    
    const nodeIndex = nodes.findIndex(node => node.id === id);
    if (nodeIndex === -1) return null;

    console.log('NodeService updateNode called with id:', id, 'dto:', dto, 'nodes before update:', nodes[nodeIndex]);
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
  static deleteNode(id: number): boolean {
    console.log('NodeService deleteNode called with id:', id);
    console.log('Nodes before deletion:', nodes);
    const initialLength = nodes.length;
    nodes = nodes.filter(node => node.id !== id);
    return nodes.length < initialLength;
  }

  /**
   * 노드 상태 업데이트
   */
  static updateNodeStatus(id: number, status: 'healthy' | 'warning' | 'error'): Node | null {
    console.log('NodeService updateNodeStatus called with id:', id, 'status:', status);
    return this.updateNode(id, { status });
  }

  /**
   * 노드 헬스체크
   */
  static async checkNodeHealth(id: number): Promise<boolean> {
    console.log('NodeService checkNodeHealth called with id:', id);
    // 실제 환경에서는 실제 헬스체크 로직 구현
    const node = this.getNodeById(id);
    if (!node) return false;

    // 시뮬레이션: 90% 확률로 성공
    const isHealthy = Math.random() > 0.1;
    const newStatus = isHealthy ? 'healthy' : 'error';
    this.updateNodeStatus(id, newStatus);
    
    return isHealthy;
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
  static getNodesByStatus(status: 'healthy' | 'warning' | 'error'): Node[] {
    return nodes.filter(node => node.status === status);
  }
}