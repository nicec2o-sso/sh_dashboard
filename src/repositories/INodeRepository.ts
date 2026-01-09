/**
 * Node Repository 인터페이스
 * 
 * Repository 패턴을 사용하여 데이터 액세스 로직을 추상화합니다.
 * 이 인터페이스를 구현하면 InMemory, Altibase, PostgreSQL 등 다양한 저장소를 사용할 수 있습니다.
 * 
 * 장점:
 * 1. 데이터 소스 변경이 용이 (In-Memory ↔ Database)
 * 2. 테스트 용이성 (Mock 객체 생성 가능)
 * 3. 비즈니스 로직과 데이터 액세스 로직 분리
 * 4. 단일 책임 원칙 (SRP) 준수
 */

import { Node, CreateNodeDto, UpdateNodeDto } from '@/types';

/**
 * Node Repository 인터페이스
 * 
 * 모든 Node 관련 데이터 액세스 작업을 정의합니다.
 */
export interface INodeRepository {
  /**
   * 모든 노드 조회
   * 
   * @returns 모든 노드 배열
   */
  findAll(): Promise<Node[]>;

  /**
   * ID로 노드 조회
   * 
   * @param id - 조회할 노드 ID
   * @returns 노드 객체 또는 null (없으면)
   */
  findById(id: number): Promise<Node | null>;

  /**
   * 여러 ID로 노드들 조회
   * 
   * @param ids - 조회할 노드 ID 배열
   * @returns 노드 배열
   */
  findByIds(ids: number[]): Promise<Node[]>;

  /**
   * 호스트로 노드 검색
   * 
   * @param host - 검색할 호스트 문자열 (부분 일치)
   * @returns 일치하는 노드 배열
   */
  findByHost(host: string): Promise<Node[]>;

  /**
   * 상태별 노드 조회
   * 
   * @param status - 조회할 상태
   * @returns 해당 상태의 노드 배열
   */
  findByStatus(status: 'active' | 'inactive' | 'warning' | 'error'): Promise<Node[]>;

  /**
   * 노드 생성
   * 
   * @param data - 생성할 노드 데이터
   * @returns 생성된 노드 객체
   */
  create(data: CreateNodeDto): Promise<Node>;

  /**
   * 노드 수정
   * 
   * @param id - 수정할 노드 ID
   * @param data - 수정할 데이터
   * @returns 수정된 노드 객체 또는 null (없으면)
   */
  update(id: number, data: UpdateNodeDto): Promise<Node | null>;

  /**
   * 노드 삭제
   * 
   * @param id - 삭제할 노드 ID
   * @returns 삭제 성공 여부
   */
  delete(id: number): Promise<boolean>;
}
