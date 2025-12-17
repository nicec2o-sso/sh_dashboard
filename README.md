# 서버 모니터링 시스템 - 3계층 아키텍처

## 📁 프로젝트 구조

```
monitoring-app/
├── src/
│   ├── types/
│   │   └── index.ts                          # 타입 정의 (Domain Models & DTOs)
│   │
│   ├── services/                             # Service 계층 (비즈니스 로직)
│   │   ├── index.ts                          # Service 통합 export
│   │   ├── nodeService.ts                    # 노드 관리 서비스
│   │   ├── nodeGroupService.ts               # 노드 그룹 관리 서비스
│   │   ├── apiService.ts                     # API 관리 및 실행 서비스
│   │   └── syntheticTestService.ts           # 합성 테스트 관리 서비스
│   │
│   ├── api/                                  # API 계층 (Controller/Route Handlers)
│   │   ├── nodes/
│   │   │   ├── route.ts                      # GET(목록), POST(생성)
│   │   │   └── [id]/
│   │   │       ├── route.ts                  # GET(상세), PATCH(수정), DELETE(삭제)
│   │   │       └── health/
│   │   │           └── route.ts              # POST(헬스체크)
│   │   │
│   │   ├── node-groups/
│   │   │   ├── route.ts                      # GET(목록), POST(생성)
│   │   │   └── [id]/
│   │   │       ├── route.ts                  # GET(상세), PATCH(수정), DELETE(삭제)
│   │   │       └── nodes/
│   │   │           └── route.ts              # POST(노드 추가), DELETE(노드 제거)
│   │   │
│   │   ├── apis/
│   │   │   ├── route.ts                      # GET(목록), POST(생성)
│   │   │   └── [id]/
│   │   │       ├── route.ts                  # GET(상세), PATCH(수정), DELETE(삭제)
│   │   │       └── execute/
│   │   │           └── route.ts              # POST(API 실행)
│   │   │
│   │   ├── synthetic-tests/
│   │   │   ├── route.ts                      # GET(목록), POST(생성)
│   │   │   └── [id]/
│   │   │       ├── route.ts                  # GET(상세), PATCH(수정), DELETE(삭제)
│   │   │       ├── execute/
│   │   │       │   └── route.ts              # POST(테스트 실행), GET(결과 조회)
│   │   │       └── statistics/
│   │   │           └── route.ts              # GET(통계 조회)
│   │   │
│   │   └── monitoring/
│   │       └── status/
│   │           └── route.ts                  # GET(전체 모니터링 상태)
│   │
│   ├── app/                                  # UI 계층 (Presentation Layer)
│   │   └── page.tsx                          # 메인 대시보드 페이지
│   │
│   └── components/                           # 재사용 가능한 UI 컴포넌트
│       └── ui/                               # shadcn/ui 컴포넌트들
│
└── README.md                                 # 이 문서
```

---

## 🏗️ 계층별 역할

### 1️⃣ **Types 계층** (`src/types/`)
- **역할**: 애플리케이션의 모든 타입 정의
- **포함 내용**:
  - Domain Models: Node, NodeGroup, Api, SyntheticTest, TestResult 등
  - DTOs: CreateNodeDto, UpdateNodeDto 등 API 요청/응답 타입
  - Interfaces: ApiParameter, ApiExecutionResult 등

### 2️⃣ **Service 계층** (`src/services/`)
- **역할**: 비즈니스 로직 처리 및 데이터 관리
- **책임**:
  - 데이터 CRUD 작업
  - 비즈니스 규칙 적용
  - 데이터 유효성 검증
  - 도메인 로직 실행 (API 실행, 테스트 실행 등)
  - 데이터 변환 및 계산
  
- **주요 서비스**:
  - `NodeService`: 노드 관리 (생성, 조회, 수정, 삭제, 헬스체크)
  - `NodeGroupService`: 노드 그룹 관리 (그룹 CRUD, 노드 추가/제거)
  - `ApiService`: API 관리 (API CRUD, 실행, 대상 조회)
  - `SyntheticTestService`: 합성 테스트 관리 (테스트 CRUD, 실행, 결과 조회, 통계)

### 3️⃣ **API 계층** (`src/api/`)
- **역할**: HTTP 요청 처리 및 라우팅 (Controller)
- **책임**:
  - HTTP 요청 수신 및 파싱
  - 요청 유효성 검증
  - Service 계층 호출
  - HTTP 응답 생성
  - 에러 핸들링
  
- **엔드포인트 구조**:

#### **노드 관리**
```
GET    /api/nodes                    # 노드 목록 조회
POST   /api/nodes                    # 노드 생성
GET    /api/nodes/[id]               # 노드 상세 조회
PATCH  /api/nodes/[id]               # 노드 수정
DELETE /api/nodes/[id]               # 노드 삭제
POST   /api/nodes/[id]/health        # 노드 헬스체크
```

#### **노드 그룹 관리**
```
GET    /api/node-groups              # 노드 그룹 목록 조회
POST   /api/node-groups              # 노드 그룹 생성
GET    /api/node-groups/[id]         # 노드 그룹 상세 조회
PATCH  /api/node-groups/[id]         # 노드 그룹 수정
DELETE /api/node-groups/[id]         # 노드 그룹 삭제
POST   /api/node-groups/[id]/nodes   # 노드 그룹에 노드 추가
DELETE /api/node-groups/[id]/nodes/[nodeId]  # 노드 그룹에서 노드 제거
```

#### **API 관리**
```
GET    /api/apis                     # API 목록 조회
POST   /api/apis                     # API 생성
GET    /api/apis/[id]                # API 상세 조회
PATCH  /api/apis/[id]                # API 수정
DELETE /api/apis/[id]                # API 삭제
POST   /api/apis/[id]/execute        # API 실행
```

#### **합성 테스트 관리**
```
GET    /api/synthetic-tests          # 합성 테스트 목록 조회
POST   /api/synthetic-tests          # 합성 테스트 생성
GET    /api/synthetic-tests/[id]     # 합성 테스트 상세 조회
PATCH  /api/synthetic-tests/[id]     # 합성 테스트 수정
DELETE /api/synthetic-tests/[id]     # 합성 테스트 삭제
POST   /api/synthetic-tests/[id]/execute      # 테스트 실행
GET    /api/synthetic-tests/[id]/execute      # 테스트 결과 조회
GET    /api/synthetic-tests/[id]/statistics   # 테스트 통계 조회
```

#### **모니터링**
```
GET    /api/monitoring/status        # 전체 모니터링 상태 조회
```

### 4️⃣ **UI 계층** (`src/app/`)
- **역할**: 사용자 인터페이스 렌더링
- **책임**:
  - UI 컴포넌트 렌더링
  - 사용자 입력 처리
  - API 호출 (fetch)
  - 상태 관리 (React hooks)

---

## 🔄 데이터 흐름

```
사용자 인터랙션 (UI)
        ↓
    API 호출 (fetch)
        ↓
   API 라우트 (Controller)
        ↓
   Service 계층 (비즈니스 로직)
        ↓
   데이터 저장소 (메모리/DB)
        ↓
   Service 계층 (데이터 반환)
        ↓
   API 라우트 (JSON 응답)
        ↓
    UI 업데이트
```

---

## 🎯 주요 도메인

### 1. **노드 (Node)**
- 서버 인스턴스를 나타내는 기본 단위
- 속성: id, name, host, port, status
- 기능: 생성, 조회, 수정, 삭제, 헬스체크

### 2. **노드 그룹 (NodeGroup)**
- 여러 노드를 논리적으로 그룹화
- 속성: id, name, description, nodeIds
- 기능: 생성, 조회, 수정, 삭제, 노드 추가/제거

### 3. **API**
- 노드 또는 그룹에 대한 HTTP API 정의
- 속성: id, name, uri, method, targetType, targetId, parameters
- 기능: 생성, 조회, 수정, 삭제, 실행

### 4. **합성 테스트 (SyntheticTest)**
- API를 정기적으로 실행하여 모니터링
- 속성: id, name, apiId, targetType, targetId, intervalSeconds, alertThresholdMs, tags
- 기능: 생성, 조회, 수정, 삭제, 실행, 결과 조회, 통계 조회

### 5. **테스트 결과 (TestResult)**
- 합성 테스트 실행 결과
- 속성: id, testId, nodeId, responseTimeMs, statusCode, success, executedAt
- 기능: 조회, 필터링, 통계 계산

---

## 🔑 핵심 기능

### Service 계층 주요 메서드

#### NodeService
```typescript
- getAllNodes(): Node[]
- getNodeById(id): Node | null
- createNode(dto): Node
- updateNode(id, dto): Node | null
- deleteNode(id): boolean
- checkNodeHealth(id): Promise<boolean>
- getNodesByStatus(status): Node[]
```

#### NodeGroupService
```typescript
- getAllNodeGroups(): NodeGroup[]
- getNodeGroupById(id): NodeGroup | null
- createNodeGroup(dto): NodeGroup | null
- updateNodeGroup(id, dto): NodeGroup | null
- deleteNodeGroup(id): boolean
- addNodeToGroup(groupId, nodeId): NodeGroup | null
- removeNodeFromGroup(groupId, nodeId): NodeGroup | null
- getNodesInGroup(groupId): Node[] | null
```

#### ApiService
```typescript
- getAllApis(): Api[]
- getApiById(id): Api | null
- createApi(dto): Api | null
- updateApi(id, dto): Api | null
- deleteApi(id): boolean
- executeApi(apiId, parameters): Promise<ApiExecutionResult[]>
- getApisByTarget(targetType, targetId): Api[]
```

#### SyntheticTestService
```typescript
- getAllTests(): SyntheticTest[]
- getTestById(id): SyntheticTest | null
- createTest(dto): SyntheticTest | null
- updateTest(id, dto): SyntheticTest | null
- deleteTest(id): boolean
- executeTest(testId): Promise<TestResult[]>
- getTestResults(testId, options): TestResult[]
- getTestStatistics(testId, hours): Statistics
- getAlertsForTest(testId): TestResult[]
```

---

## 🚀 사용 방법

### 1. Service 계층 사용 예시
```typescript
import { NodeService } from '@/services';

// 노드 생성
const newNode = NodeService.createNode({
  name: 'API Server',
  host: '192.168.1.100',
  port: 8080
});

// 모든 노드 조회
const nodes = NodeService.getAllNodes();

// 헬스체크
await NodeService.checkNodeHealth(1);
```

### 2. API 호출 예시 (UI에서)
```typescript
// 노드 생성
const response = await fetch('/api/nodes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'API Server',
    host: '192.168.1.100',
    port: 8080
  })
});

const result = await response.json();
```

---

## 🛡️ 에러 처리

### API 응답 형식
```typescript
// 성공
{
  success: true,
  data: { ... }
}

// 실패
{
  success: false,
  error: "에러 메시지"
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

---

## 📝 향후 개선사항

1. **데이터베이스 통합**
   - 현재 메모리 저장소를 PostgreSQL/MongoDB로 대체
   
2. **인증/인가**
   - JWT 기반 인증 추가
   - 역할 기반 접근 제어 (RBAC)

3. **실시간 모니터링**
   - WebSocket을 통한 실시간 업데이트
   - 알림 시스템 구현

4. **테스트**
   - Unit 테스트 (Jest)
   - Integration 테스트
   - E2E 테스트 (Playwright)

5. **로깅 및 모니터링**
   - 구조화된 로깅 (Winston, Pino)
   - APM 통합 (Datadog, New Relic)

6. **캐싱**
   - Redis를 통한 캐싱 레이어
   
7. **배포**
   - Docker 컨테이너화
   - CI/CD 파이프라인 구축

---

## 📚 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: React, shadcn/ui, Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 🤝 기여 가이드

1. 새로운 도메인 추가 시:
   - `types/index.ts`에 타입 정의
   - `services/`에 Service 클래스 생성
   - `api/`에 라우트 핸들러 생성
   - UI 컴포넌트 작성

2. 코드 스타일:
   - ESLint 규칙 준수
   - Prettier로 포맷팅
   - 명확한 변수명과 함수명 사용
   - JSDoc 주석 작성

---

## 📄 라이선스

MIT License