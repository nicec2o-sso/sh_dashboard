
// ==================== 도메인 타입 정의 ====================

export interface Node {
  id: number;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'warning' | 'error';
  description?: string;
  createdAt?: string;
}

export interface NodeGroup {
  id: number;
  name: string;
  description: string;
  nodeIds: number[];
  createdAt?: string;
}

export interface ApiParameter {
  id: number;
  name: string;
  type: 'query' | 'body';
  required: boolean;
  description?: string;
}

export interface Api {
  id: number;
  name: string;
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiParameterIds: number[];
  createdAt?: string;
}

export interface SyntheticTest {
  id: number;
  name: string;
  targetId: number;
  targetType: 'node' | 'group';
  apiId: number;
  apiParameterValues?: Record<number, string>; // apiParameterId -> value
  tags: string[];
  intervalSeconds: number;
  alertThresholdMs: number;
  createdAt?: string;
}

export interface SyntheticTestHistory {
  id: number;
  syntheticTestId: number;
  nodeId: number;
  statusCode: number;
  success: boolean;
  responseTimeMs: number;
  executedAt: string;
  input: string; // JSON 문자열 형태
  output?: string; // JSON 문자열 형태
  errorMessage?: string; 
}

export interface ApiExecutionResult {
  nodeId: number;
  nodeName: string;
  responseTimeMs: number;
  success: boolean;
  statusCode: number;
  data?: any;
}

// ==================== DTO 타입 ====================

export interface CreateNodeDto {
  name: string;
  host: string;
  port: number;
}

export interface UpdateNodeDto {
  name?: string;
  host?: string;
  port?: number;
  status?: 'healthy' | 'warning' | 'error';
}

export interface CreateNodeGroupDto {
  name: string;
  description: string;
  nodeIds: number[];
}

export interface UpdateNodeGroupDto {
  name?: string;
  description?: string;
  nodeIds?: number[];
}
export interface CreateApiDto {
  name: string;
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameters: ApiParameter[];
}

export interface UpdateApiDto {
  name?: string;
  uri?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  targetId?: number;
  // 파라미터 상세 정보 (수정 시 파라미터 객체 전체를 받음)
  parameters?: ApiParameter[]; 
}

// 기존 로직의 add/removeParameterToApi 함수를 위해 DTO를 추가로 정의했습니다.
export interface ManageApiParameterDto {
  parameterId: string;
}

// API 파라미터 검증을 위한 DTO
export interface ValidateApiParametersDto {
  providedParams: Record<string, string>;
}

export interface CreateSyntheticTestDto {
  name: string;
  targetId: number;
  targetType: 'node' | 'group';
  apiId: number;
  tags: string[];
  intervalSeconds: number;
  alertThresholdMs: number;
}

export interface UpdateSyntheticTestDto {
  name?: string;
  targetId?: number;
  targetType?: 'node' | 'group';
  apiId?: number;
  tags?: string[];
  intervalSeconds?: number;
  alertThresholdMs?: number;
}

export interface ExecuteApiDto {
  apiId: number;
  parameters?: Record<string, any>;
}