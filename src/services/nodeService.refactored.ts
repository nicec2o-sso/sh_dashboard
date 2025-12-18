/**
 * Node Service (Repository 패턴 적용)
 * 
 * 기존의 In-Memory 방식에서 Repository 패턴을 사용하도록 리팩토링되었습니다.
 * 이제 데이터 저장소를 쉽게 교체할 수 있습니다 (In-Memory ↔ Altibase ↔ PostgreSQL 등).
 * 
 * 변경사항:
 * - static 메서드에서 인스턴스 메서드로 변경
 * - Repository 인터페이스를 통한 데이터 액세스
 * - 의존성 주입(Dependency Injection) 패턴 적용
 * 
 * 사용 방법:
 * ```typescript
 * // Repository 인스턴스 생성
 * const repository = new AltibaseNodeRepository();
 * 
 * // Service 인스턴스 생성 (의존성 주입)
 * const nodeService = new NodeService(repository);
 * 
 * // 사용
 * const nodes = await nodeService.getAllNodes();
 * ```
 */

import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';
import { INodeRepository } from '@/repositories/INodeRepository';

export class NodeService {
  /**
   * Node Repository 인스턴스
   * 
   * 생성자를 통해 주입받습니다 (Dependency Injection).
   */
  private repository: INodeRepository;

  /**
   * NodeService 생성자
   * 
   * @param repository - Node Repository 구현체
   * 
   * @example
   * ```typescript
   * // Altibase 사용
   * const altibaseRepo = new AltibaseNodeRepository();
   * const nodeService = new NodeService(altibaseRepo);
   * 
   * // In-Memory 사용 (테스트 또는 개발)
   * const inMemoryRepo = new InMemoryNodeRepository();
   * const nodeService = new NodeService(inMemoryRepo);
   * ```
   */
  constructor(repository: INodeRepository) {
    this.repository = repository;
  }

  /**
   * 모든 노드 조회
   * 
   * @returns 모든 노드 배열
   */
  async getAllNodes(): Promise<Node[]> {
    console.log('[NodeService] getAllNodes called');
    return await this.repository.findAll();
  }

  /**
   * ID로 노드 조회
   * 
   * @param id - 조회할 노드 ID
   * @returns 노드 객체 또는 null
   */
  async getNodeById(id: number): Promise<Node | null> {
    console.log(`[NodeService] getNodeById called with id: ${id}`);
    return await this.repository.findById(id);
  }

  /**
   * 여러 ID로 노드들 조회
   * 
   * @param ids - 조회할 노드 ID 배열
   * @returns 노드 배열
   */
  async getNodesByIds(ids: number[]): Promise<Node[]> {
    console.log(`[NodeService] getNodesByIds called with ids: ${ids.join(', ')}`);
    return await this.repository.findByIds(ids);
  }

  /**
   * 노드 생성
   * 
   * @param dto - 생성할 노드 정보
   * @returns 생성된 노드 객체
   */
  async createNode(dto: CreateNodeDto): Promise<Node> {
    console.log('[NodeService] createNode called with dto:', dto);
    
    // 비즈니스 로직 검증
    if (!dto.name || !dto.host || !dto.port) {
      throw new Error('Name, host, and port are required');
    }

    if (dto.port < 1 || dto.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    return await this.repository.create(dto);
  }

  /**
   * 노드 수정
   * 
   * @param id - 수정할 노드 ID
   * @param dto - 수정할 노드 정보
   * @returns 수정된 노드 객체 또는 null
   */
  async updateNode(id: number, dto: UpdateNodeDto): Promise<Node | null> {
    console.log(`[NodeService] updateNode called with id: ${id}, dto:`, dto);
    
    // 비즈니스 로직 검증
    if (dto.port !== undefined && (dto.port < 1 || dto.port > 65535)) {
      throw new Error('Port must be between 1 and 65535');
    }

    return await this.repository.update(id, dto);
  }

  /**
   * 노드 삭제
   * 
   * @param id - 삭제할 노드 ID
   * @returns 삭제 성공 여부
   */
  async deleteNode(id: number): Promise<boolean> {
    console.log(`[NodeService] deleteNode called with id: ${id}`);
    return await this.repository.delete(id);
  }

  /**
   * 노드 상태 업데이트
   * 
   * @param id - 노드 ID
   * @param status - 새로운 상태
   * @returns 수정된 노드 객체 또는 null
   */
  async updateNodeStatus(id: number, status: 'healthy' | 'warning' | 'error'): Promise<Node | null> {
    console.log(`[NodeService] updateNodeStatus called with id: ${id}, status: ${status}`);
    return await this.updateNode(id, { status });
  }

  /**
   * 노드 헬스체크
   * 
   * 실제 환경에서는 노드에 HTTP 요청을 보내 상태를 확인합니다.
   * 현재는 시뮬레이션으로 구현되어 있습니다.
   * 
   * @param id - 체크할 노드 ID
   * @returns 헬스체크 성공 여부
   */
  async checkNodeHealth(id: number): Promise<boolean> {
    console.log(`[NodeService] checkNodeHealth called with id: ${id}`);
    
    const node = await this.getNodeById(id);
    if (!node) {
      return false;
    }

    // TODO: 실제 헬스체크 로직 구현
    // const response = await fetch(`http://${node.host}:${node.port}/health`);
    // const isHealthy = response.ok;

    // 시뮬레이션: 90% 확률로 성공
    const isHealthy = Math.random() > 0.1;
    const newStatus = isHealthy ? 'healthy' : 'error';
    
    await this.updateNodeStatus(id, newStatus);
    
    return isHealthy;
  }

  /**
   * 호스트명으로 노드 검색
   * 
   * @param host - 검색할 호스트 문자열 (부분 일치)
   * @returns 일치하는 노드 배열
   */
  async searchNodesByHost(host: string): Promise<Node[]> {
    console.log(`[NodeService] searchNodesByHost called with host: ${host}`);
    return await this.repository.findByHost(host);
  }

  /**
   * 상태별 노드 조회
   * 
   * @param status - 조회할 상태
   * @returns 해당 상태의 노드 배열
   */
  async getNodesByStatus(status: 'healthy' | 'warning' | 'error'): Promise<Node[]> {
    console.log(`[NodeService] getNodesByStatus called with status: ${status}`);
    return await this.repository.findByStatus(status);
  }
}
