/**
 * Node 도메인 관련 타입 정의
 * 
 * 이 파일은 시스템 노드(서버, 인스턴스 등)와 관련된 모든 타입을 포함합니다.
 * - Node: 단일 노드의 정보를 나타내는 인터페이스
 * - CreateNodeDto: 노드 생성 시 필요한 데이터 전송 객체
 * - UpdateNodeDto: 노드 수정 시 사용하는 데이터 전송 객체
 */

/**
 * 시스템 노드를 나타내는 인터페이스
 * 
 * @property id - 노드의 고유 식별자
 * @property name - 노드의 이름 (예: "Web Server 1")
 * @property host - 노드의 호스트 주소 (IP 또는 도메인)
 * @property port - 노드의 포트 번호
 * @property status - 노드의 현재 상태 (healthy: 정상, warning: 경고, error: 오류)
 * @property description - 노드에 대한 추가 설명 (선택사항)
 * @property tags - 노드의 태그 목록 (선택사항)
 * @property createdAt - 노드 생성 일시 (ISO 8601 형식)
 */
export interface Node {
  nodeId: number;
  nodeName: string;
  host: string;
  port: number;
  nodeStatus: 'active' | 'inactive' | 'warning' | 'error';
  nodeDesc?: string;
  tags?: string; // 태그 문자열 (콤마로 구분)
  createdAt?: string;
}

/**
 * 노드 생성 시 사용하는 DTO (Data Transfer Object)
 * 
 * 새로운 노드를 생성할 때 클라이언트에서 서버로 전달되는 데이터 구조입니다.
 * id, status, createdAt은 서버에서 자동으로 생성되므로 포함되지 않습니다.
 * 
 * @property name - 생성할 노드의 이름
 * @property host - 생성할 노드의 호스트 주소
 * @property port - 생성할 노드의 포트 번호
 * @property tags - 태그 문자열 (콤마로 구분, 선택사항)
 */
export interface CreateNodeDto {
  nodeName: string;
  host: string;
  port: number;
  nodeStatus?: 'active' | 'inactive' | 'warning' | 'error';
  nodeDesc?: string;
  tags?: string; // 태그 문자열 추가
}

/**
 * 노드 수정 시 사용하는 DTO
 * 
 * 기존 노드의 정보를 업데이트할 때 사용합니다.
 * 모든 필드가 선택적(optional)이므로 변경하고자 하는 필드만 전달하면 됩니다.
 * 
 * @property name - 수정할 노드 이름 (선택)
 * @property host - 수정할 호스트 주소 (선택)
 * @property port - 수정할 포트 번호 (선택)
 * @property status - 수정할 노드 상태 (선택)
 */
export interface UpdateNodeDto {
  nodeName?: string;
  host?: string;
  port?: number;
  nodeStatus?: 'active' | 'inactive' | 'warning' | 'error';
  nodeDesc?: string;
  tags?: string; // 태그 문자열 추가
}
