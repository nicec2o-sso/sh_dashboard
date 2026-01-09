/**
 * NodeGroup 도메인 관련 타입 정의
 * 
 * 이 파일은 노드 그룹(여러 노드를 묶어서 관리하는 단위)과 관련된 모든 타입을 포함합니다.
 * 노드 그룹을 사용하면 여러 노드에 대해 일괄 작업을 수행할 수 있습니다.
 */

/**
 * 노드 그룹을 나타내는 인터페이스
 * 
 * 여러 노드를 논리적으로 그룹화하여 관리합니다.
 * 예: "Web Cluster", "Backend Services" 등
 * 
 * @property id - 노드 그룹의 고유 식별자
 * @property name - 노드 그룹의 이름
 * @property description - 노드 그룹에 대한 설명
 * @property nodeIds - 이 그룹에 속한 노드들의 ID 배열
 * @property createdAt - 노드 그룹 생성 일시 (ISO 8601 형식)
 */
export interface NodeGroup {
  nodeGroupId: number;
  nodeGroupName: string;
  nodeGroupDesc: string;
  nodeIds: number[];
  createdAt?: string;
}

/**
 * 노드 그룹 생성 시 사용하는 DTO
 * 
 * 새로운 노드 그룹을 생성할 때 필요한 데이터 구조입니다.
 * 
 * @property name - 생성할 노드 그룹의 이름
 * @property description - 노드 그룹에 대한 설명
 * @property nodeIds - 그룹에 포함할 노드들의 ID 배열
 * 
 * @example
 * ```typescript
 * const dto: CreateNodeGroupDto = {
 *   name: "Web Cluster",
 *   description: "All web servers",
 *   nodeIds: [1, 2, 3]
 * };
 * ```
 */
export interface CreateNodeGroupDto {
  nodeGroupName: string;
  nodeGroupDesc: string;
  nodeIds: number[];
}

/**
 * 노드 그룹 수정 시 사용하는 DTO
 * 
 * 기존 노드 그룹의 정보를 업데이트할 때 사용합니다.
 * 모든 필드가 선택적이므로 변경하고자 하는 필드만 전달하면 됩니다.
 * 
 * @property name - 수정할 그룹 이름 (선택)
 * @property description - 수정할 그룹 설명 (선택)
 * @property nodeIds - 수정할 노드 ID 배열 (선택) - 전체 교체됨
 * 
 * @example
 * ```typescript
 * // 그룹 이름만 변경
 * const dto: UpdateNodeGroupDto = {
 *   name: "New Web Cluster"
 * };
 * 
 * // 그룹에 속한 노드 변경
 * const dto2: UpdateNodeGroupDto = {
 *   nodeIds: [1, 2, 3, 4]
 * };
 * ```
 */
export interface UpdateNodeGroupDto {
  nodeGroupName?: string;
  nodeGroupDesc?: string;
  nodeIds?: number[];
}
