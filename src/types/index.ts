/**
 * 공통 타입 정의 및 통합 Export
 * 
 * 이 파일은 프로젝트 전체에서 사용되는 모든 타입을 한 곳에서 import할 수 있도록 재export합니다.
 * 각 도메인별로 분리된 타입 파일들을 통합하여 제공합니다.
 * 
 * @example
 * ```typescript
 * // 개별 import 대신
 * import { Node } from '@/types/node.types';
 * import { Api } from '@/types/api.types';
 * 
 * // 통합 import 사용 가능
 * import { Node, Api } from '@/types';
 * ```
 */

// Node 도메인 타입
export type {
  Node,
  CreateNodeDto,
  UpdateNodeDto
} from './node.types';

// NodeGroup 도메인 타입
export type {
  NodeGroup,
  CreateNodeGroupDto,
  UpdateNodeGroupDto
} from './node-group.types';

// API 도메인 타입
export type {
  Api,
  ApiParameter,
  ApiParameterInput,
  ApiExecutionResult,
  CreateApiDto,
  UpdateApiDto,
  ManageApiParameterDto,
  ValidateApiParametersDto,
  ExecuteApiDto
} from './api.types';

// SyntheticTest 도메인 타입
export type {
  SyntheticTest,
  SyntheticTestHistory,
  SyntheticTestHistoryRow,
  CreateSyntheticTestHistory,
  CreateSyntheticTestDto,
  UpdateSyntheticTestDto
} from './synthetic-test.types';

export {
  convertSyntheticTestHistoryRow
} from './synthetic-test.types';

// Node 도메인 타입
export type {
  Tag
} from './tag.types';