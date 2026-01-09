# 프로젝트 수정 완료 보고서

## 수정 날짜: 2026-01-05

## 주요 변경 사항

### 1. 트랜잭션 커밋 처리 개선 ✅
- **위치**: 모든 API 라우트 (`/api/nodes`, `/api/apis`, `/api/synthetic-tests`)
- **변경 내용**: 
  - `db.transaction()` 메서드를 사용하여 모든 DML 작업을 트랜잭션으로 처리
  - 트랜잭션 내부에서 `autoCommit: false` 설정
  - 트랜잭션 성공 시 자동 커밋, 실패 시 자동 롤백
  - 복잡한 작업(노드 생성 + 태그 처리, API 생성 + 파라미터 추가 등)도 원자적으로 처리

### 2. 태그 처리 기능 추가 ✅

#### 2.1 노드 관리 (`/api/nodes`)
- **이미 구현됨**: 콤마로 구분된 태그 처리
- **개선 사항**: 트랜잭션 내에서 태그 처리하도록 변경
- **기능**:
  - 태그가 DB에 없으면 `MT_TAGS` 테이블에 INSERT
  - 태그가 이미 있으면 재사용
  - `MT_NODE_TAG_MEMBERS` 테이블에 노드-태그 관계 생성
  - 중복 관계는 무시 (ORA-00001 에러 처리)

#### 2.2 Synthetic Test 관리 (`/api/synthetic-tests`)
- **신규 추가**: 테스트 생성 시 태그 처리
- **기능**:
  - `tags` 필드를 통해 콤마로 구분된 태그 입력
  - 태그 확인 및 생성 로직 추가
  - 테스트 레코드에 태그 문자열 저장

#### 2.3 API 관리 (`/api/apis`)
- **신규 추가**: API 생성 및 수정 시 태그 처리
- **변경 사항**:
  - `INSERT_API`, `UPDATE_API` 쿼리에 `TAGS` 컬럼 추가
  - `SELECT_APIS`, `SELECT_API_DETAIL` 쿼리에 `TAGS` 컬럼 추가
  - 태그 확인 및 생성 로직 추가
  - API 수정 시 태그도 업데이트 가능

### 3. API 파라미터 추가 기능 수정 ✅
- **문제**: 파라미터 추가 시 값 입력이 안 되는 문제
- **해결**:
  - `INSERT_API_PARAMETER` 쿼리의 바인드 변수명 통일
  - `:name` → `:apiParameterName`
  - `:type` → `:apiParameterType`
  - `:required` → `:apiParameterRequired`
  - `:description` → `:apiParameterDesc`
  - 트랜잭션 처리로 일관성 보장

### 4. 아키텍처 개선 ✅

#### 4.1 Repository 패턴 제거
- **삭제된 파일**:
  - `src/repositories/OracleNodeRepository.ts`
  - `src/repositories/INodeRepository.ts`
  - `src/services/nodeService.refactored.ts`
- **이유**: 
  - 불필요한 추상화 레이어 제거
  - 코드 복잡도 감소
  - 유지보수성 향상

#### 4.2 직접 DB 접근 패턴 적용
- **변경 사항**:
  - 모든 라우트에서 `db` 모듈 직접 사용
  - `src/lib/oracle.ts`의 `db` 인스턴스 활용
  - 쿼리는 `src/queries/*.ts` 파일에서 관리
- **장점**:
  - 명확한 데이터 흐름
  - 트랜잭션 관리 용이
  - 디버깅 용이

#### 4.3 노드 라우트 완전 재작성
- **파일**: 
  - `src/app/api/nodes/route.ts`
  - `src/app/api/nodes/[id]/route.ts`
- **변경 사항**:
  - `nodeService` 대신 `db` 직접 사용
  - 트랜잭션으로 모든 작업 처리
  - 태그 처리 로직 통합

### 5. Oracle execute 리턴값 처리 개선 ✅

#### 5.1 문제점
- `conn.execute()` 호출 후 리턴값을 제대로 가져오지 못함
- `outBinds` 접근 시 `undefined` 발생

#### 5.2 해결 방법
```typescript
// 이전 (문제)
const result = await conn.execute(INSERT_API, params);
const apiId = result.outBinds.id; // undefined 발생 가능

// 개선 (해결)
const result = await conn.execute(
  INSERT_API,
  params,
  {
    autoCommit: false,
    bindDefs: INSERT_API_BINDS, // OUT 바인드 정의 필수
  }
);
const apiId = result.outBinds?.id?.[0]; // 안전한 접근

if (!apiId) {
  throw new Error('Failed to get generated ID');
}
```

#### 5.3 적용된 쿼리
- `INSERT_NODE` - 노드 생성
- `INSERT_API` - API 생성
- `INSERT_API_PARAMETER` - 파라미터 생성
- `INSERT_TAG` - 태그 생성
- `INSERT_SYNTHETIC_TEST` - 테스트 생성
- `UPDATE_NODE` - 노드 수정
- `UPDATE_API` - API 수정

## 데이터베이스 스키마 확인사항

### 필요한 테이블
1. **MT_TAGS** - 태그 마스터 테이블
   - `TAG_ID` (PK)
   - `TAG_NAME` (UNIQUE)
   - `CREATED_AT`
   - `UPDATED_AT`

2. **MT_NODE_TAG_MEMBERS** - 노드-태그 관계 테이블
   - `NODE_TAG_ID` (PK)
   - `TAG_ID` (FK → MT_TAGS)
   - `NODE_ID` (FK → MT_NODES)
   - `CREATED_AT`
   - `UPDATED_AT`
   - UNIQUE 제약: (TAG_ID, NODE_ID)

3. **MT_APIS** - API 테이블
   - `TAGS` 컬럼 필요 (VARCHAR2)

4. **MT_SYNTHETIC_TESTS** - 테스트 테이블
   - `TAGS` 컬럼 필요 (VARCHAR2)

### 시퀀스
- `SEQ_MT_TAG_ID` - 태그 ID 생성
- `SEQ_MT_NODE_TAG_ID` - 노드-태그 관계 ID 생성

## 테스트 체크리스트

### 1. 노드 관리
- [ ] 노드 생성 시 태그 추가 (예: "production,critical,web")
- [ ] 노드 수정 시 태그 변경
- [ ] 노드 조회 시 태그 포함
- [ ] 노드 삭제 시 트랜잭션 롤백 테스트

### 2. API 관리
- [ ] API 생성 시 파라미터 추가
- [ ] API 생성 시 태그 추가
- [ ] API 수정 시 태그 변경
- [ ] API 조회 시 태그 포함
- [ ] 파라미터 값 입력 확인

### 3. Synthetic Test 관리
- [ ] 테스트 생성 시 태그 추가
- [ ] 테스트 조회 시 태그 배열로 반환
- [ ] 트랜잭션 롤백 테스트

### 4. 트랜잭션 테스트
- [ ] 노드 생성 중 태그 에러 시 전체 롤백
- [ ] API 생성 중 파라미터 에러 시 전체 롤백
- [ ] 복잡한 작업의 원자성 확인

## API 사용 예시

### 노드 생성 (태그 포함)
```bash
POST /api/nodes
{
  "nodeName": "Web Server 1",
  "host": "192.168.1.10",
  "port": 8080,
  "nodeDesc": "Production web server",
  "tags": "production,critical,web"
}
```

### API 생성 (파라미터 + 태그)
```bash
POST /api/apis
{
  "name": "Get User Info",
  "uri": "/api/users/:id",
  "method": "GET",
  "tags": "public,read-only",
  "parameters": [
    {
      "name": "id",
      "type": "query",
      "required": "Y",
      "description": "User ID"
    }
  ]
}
```

### Synthetic Test 생성 (태그 포함)
```bash
POST /api/synthetic-tests
{
  "name": "Health Check",
  "targetType": "node",
  "targetId": 1,
  "apiId": 1,
  "intervalSeconds": 60,
  "alertThresholdMs": 1000,
  "tags": "monitoring,critical",
  "enabled": "Y"
}
```

## 주의사항

1. **Oracle 바인드 변수**
   - OUT 바인드 사용 시 반드시 `bindDefs` 설정
   - `outBinds`는 배열 형태로 반환됨 (`outBinds.id[0]`)

2. **트랜잭션 관리**
   - `autoCommit: false` 명시
   - `db.transaction()` 사용 권장
   - 에러 발생 시 자동 롤백

3. **태그 처리**
   - 콤마(`,`)로 구분
   - 공백은 자동으로 trim
   - 중복 태그는 자동으로 무시

4. **쿼리 파라미터 네이밍**
   - 테이블 컬럼명과 바인드 변수명 일치시키기
   - camelCase vs SNAKE_CASE 혼용 주의

## 문제 발생 시 디버깅

### 1. 트랜잭션이 커밋되지 않는 경우
```typescript
// 확인사항
console.log('[DEBUG] Transaction started');
// ... 작업 ...
console.log('[DEBUG] Transaction committed');
```

### 2. OUT 바인드가 undefined인 경우
```typescript
// 확인사항
console.log('[DEBUG] Bind defs:', INSERT_NODE_BINDS);
console.log('[DEBUG] Out binds:', result.outBinds);
console.log('[DEBUG] ID:', result.outBinds?.id?.[0]);
```

### 3. 태그가 생성되지 않는 경우
```typescript
// 확인사항
console.log('[DEBUG] Tag name:', tagName);
console.log('[DEBUG] Existing tag:', existingTagResult);
console.log('[DEBUG] New tag ID:', tagId);
```

## 완료 상태

- ✅ 트랜잭션 커밋 처리
- ✅ 노드 태그 등록
- ✅ Synthetic Test 태그 등록
- ✅ API 태그 등록
- ✅ API 파라미터 추가 수정
- ✅ OracleNodeRepository 제거
- ✅ 직접 DB 접근 패턴 적용
- ✅ execute 리턴값 처리 개선

## 다음 단계

1. 프론트엔드 UI에서 태그 입력 필드 추가
2. 태그 자동완성 기능 구현
3. 태그로 필터링 기능 추가
4. 태그 관리 화면 추가 (선택사항)
5. 통합 테스트 작성
