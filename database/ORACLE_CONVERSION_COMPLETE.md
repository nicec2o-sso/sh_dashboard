# Oracle Database 전환 작업 완료 보고서

## 📋 작업 개요

**날짜**: 2024년 12월 26일
**작업 내용**: ALTIBASE, MySQL 제거 및 Oracle Database로 전환
**현재 상태**: Oracle Autonomous Database (Wallet 방식) 지원
**향후 계획**: 기본 연결 방식으로 전환 가능하도록 구현 완료

---

## ✅ 완료된 작업

### 1. Oracle 연결 라이브러리 구현

**파일**: `src/lib/oracle.ts`

- ✅ Oracle Autonomous Database (Wallet 방식) 지원
- ✅ 일반 Oracle Database (기본 연결 방식) 지원
- ✅ 자동 연결 방식 감지 (환경변수 기반)
- ✅ 연결 풀 관리 (싱글톤 패턴)
- ✅ 트랜잭션 지원
- ✅ 에러 핸들링
- ✅ 상세한 로깅

**주요 기능**:
```typescript
// 초기화
await db.initialize();

// 쿼리 실행 (Named 바인딩)
const nodes = await db.query('SELECT * FROM NODES WHERE ID = :id', { id: 1 });

// 쿼리 실행 (Positional 바인딩)
const nodes = await db.query('SELECT * FROM NODES WHERE ID = :1', [1]);

// 트랜잭션
await db.transaction(async (conn) => {
  await conn.execute('INSERT INTO NODES ...');
  await conn.execute('UPDATE NODES ...');
});
```

### 2. 데이터베이스 추상화 레이어 업데이트

**파일**: `src/lib/database.ts`

- ✅ Oracle 전용으로 단순화
- ✅ ALTIBASE, MySQL 관련 코드 제거
- ✅ 타입 안정성 유지
- ✅ 기존 인터페이스 호환성 유지

### 3. 환경변수 설정

**파일**: `.env.local`, `.env.example`

#### Wallet 방식 (현재)
```env
ORACLE_WALLET_LOCATION=/path/to/wallet
ORACLE_WALLET_PASSWORD=your_wallet_password
ORACLE_CONNECTION_STRING=mydb_high
ORACLE_USER=admin
ORACLE_PASSWORD=your_db_password
```

#### 기본 연결 방식 (추후)
```env
# ORACLE_WALLET_LOCATION 주석 처리하면 자동으로 기본 방식 사용
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=ORCLPDB1
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password
```

### 4. Oracle 스키마 생성

**파일**: `database/schema_oracle.sql`

- ✅ 7개 테이블 정의
- ✅ 6개 시퀀스 생성 (Auto Increment 대체)
- ✅ 외래키 제약조건
- ✅ 인덱스 최적화
- ✅ 상세한 주석
- ✅ PL/SQL 블록으로 에러 핸들링

**테이블 목록**:
1. `NODES` - 노드 정보
2. `NODE_GROUPS` - 노드 그룹
3. `NODE_GROUP_MEMBERS` - 노드-그룹 관계
4. `APIS` - API 정의
5. `API_PARAMETERS` - API 파라미터
6. `SYNTHETIC_TESTS` - 합성 테스트
7. `SYNTHETIC_TEST_HISTORY` - 테스트 이력

### 5. 마이그레이션 가이드 작성

**파일**: `database/ORACLE_MIGRATION_GUIDE.md`

- ✅ Oracle Autonomous Database 설정 방법
- ✅ Wallet 다운로드 및 설정
- ✅ 환경 설정 가이드
- ✅ 스키마 마이그레이션 절차
- ✅ SQL 문법 차이점 설명
- ✅ 트러블슈팅 가이드
- ✅ 기본 연결 방식 전환 방법

### 6. README 업데이트

**파일**: `README.md`

- ✅ Oracle Database 중심으로 재작성
- ✅ 빠른 시작 가이드
- ✅ 환경 설정 예시
- ✅ 문제 해결 가이드
- ✅ 유용한 링크 추가

### 7. 제거된 항목 정리

**이동된 파일**:
- `src/lib/altibase.ts` → `src/_deprecated/altibase.ts`
- `src/_deprecated/mysql.ts` (이미 존재)
- `src/_deprecated/MySQLNodeRepository.ts` (이미 존재)

---

## 🔄 마이그레이션 경로

```
현재 상태: Oracle Autonomous Database (Wallet)
    │
    ├─ 환경변수 설정 (ORACLE_WALLET_LOCATION 등)
    ├─ Wallet 파일 다운로드 및 설정
    └─ 스키마 생성 (schema_oracle.sql)
    
향후 전환: 일반 Oracle Database (기본 연결)
    │
    ├─ 환경변수 수정 (ORACLE_HOST, ORACLE_PORT 등)
    ├─ ORACLE_WALLET_LOCATION 제거/주석
    └─ 애플리케이션 재시작 (자동 전환)
```

---

## 📝 주요 변경 사항

### SQL 문법 차이

| 항목 | ALTIBASE/MySQL | Oracle |
|------|----------------|--------|
| 날짜 함수 | SYSDATE | SYSTIMESTAMP |
| 자동 증가 | AUTO_INCREMENT | SEQUENCE.NEXTVAL |
| 페이징 | LIMIT/OFFSET | FETCH/OFFSET ROWS |
| 파라미터 | ? (Positional) | :name (Named) 또는 :1 (Positional) |
| 문자열 타입 | VARCHAR | VARCHAR2 |
| 숫자 타입 | INTEGER | NUMBER |
| 날짜 타입 | DATE | TIMESTAMP |

### 코드 변경 예시

#### 자동 증가 컬럼 사용

**이전 (ALTIBASE/MySQL)**:
```sql
INSERT INTO NODES (NAME, HOST, PORT) 
VALUES ('Node1', 'localhost', 8080)
```

**이후 (Oracle)**:
```sql
INSERT INTO NODES (ID, NAME, HOST, PORT) 
VALUES (SEQ_NODE_ID.NEXTVAL, 'Node1', 'localhost', 8080)
```

#### 파라미터 바인딩

**이전 (ALTIBASE/MySQL)**:
```typescript
await db.query('SELECT * FROM NODES WHERE ID = ?', [nodeId]);
```

**이후 (Oracle)**:
```typescript
// Named 바인딩 (권장)
await db.query('SELECT * FROM NODES WHERE ID = :id', { id: nodeId });

// Positional 바인딩
await db.query('SELECT * FROM NODES WHERE ID = :1', [nodeId]);
```

---

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

`oracledb` 패키지가 자동으로 설치됩니다.

### 2. Wallet 설정

1. OCI Console에서 Autonomous Database Wallet 다운로드
2. Wallet 압축 해제 (예: `./wallet`)
3. `.env.local` 파일 설정:

```env
ORACLE_WALLET_LOCATION=/Users/username/my-project_raw/wallet
ORACLE_WALLET_PASSWORD=your_wallet_password
ORACLE_CONNECTION_STRING=mydb_high
ORACLE_USER=admin
ORACLE_PASSWORD=your_db_password
```

### 3. 스키마 생성

```bash
# SQL*Plus
export TNS_ADMIN=/path/to/wallet
sqlplus admin@mydb_high @database/schema_oracle.sql

# 또는 SQL Developer에서 schema_oracle.sql 실행
```

### 4. 애플리케이션 실행

```bash
npm run dev
```

콘솔에서 다음 메시지 확인:
```
[Database] 🎯 Using Oracle Database
[Oracle] Using Wallet connection mode
[Oracle] Connection pool initialized successfully
[Oracle] Connection test successful
```

---

## 🔍 테스트 방법

### 1. 연결 테스트

개발 서버를 실행하면 자동으로 연결 테스트가 수행됩니다.

### 2. API 테스트

```bash
# 노드 목록 조회
curl http://localhost:3000/api/nodes

# 노드 생성
curl -X POST http://localhost:3000/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Node",
    "host": "localhost",
    "port": 8080,
    "status": "active"
  }'
```

### 3. 데이터베이스 직접 확인

```sql
-- 테이블 확인
SELECT table_name FROM user_tables ORDER BY table_name;

-- 노드 데이터 확인
SELECT * FROM NODES;

-- 시퀀스 확인
SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'SEQ_%';
```

---

## 🎯 향후 작업

### 기본 연결 방식으로 전환할 때

1. `.env.local` 파일 수정:
   ```env
   # ORACLE_WALLET_LOCATION 주석 처리 또는 삭제
   # ORACLE_WALLET_LOCATION=/path/to/wallet
   
   # 기본 연결 정보 추가
   ORACLE_HOST=localhost
   ORACLE_PORT=1521
   ORACLE_SERVICE_NAME=ORCLPDB1
   ORACLE_USER=your_username
   ORACLE_PASSWORD=your_password
   ```

2. 애플리케이션 재시작:
   ```bash
   npm run dev
   ```

3. 자동으로 기본 연결 방식으로 전환됨:
   ```
   [Oracle] Using basic connection mode
   [Oracle] Connect string: localhost:1521/ORCLPDB1
   ```

---

## 📚 참고 문서

### 프로젝트 문서
- [README.md](../README.md) - 프로젝트 개요
- [ORACLE_MIGRATION_GUIDE.md](ORACLE_MIGRATION_GUIDE.md) - 상세 마이그레이션 가이드
- [schema_oracle.sql](schema_oracle.sql) - Oracle 스키마

### 외부 문서
- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Oracle Autonomous Database](https://www.oracle.com/autonomous-database/)

---

## ⚠️ 주의사항

### 1. Oracle Instant Client

환경에 따라 Oracle Instant Client 설치가 필요할 수 있습니다:

- **Windows**: [다운로드](https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html) 후 PATH에 추가
- **Mac**: `brew install instantclient-basic`
- **Linux**: 배포판에 맞는 패키지 설치

### 2. Wallet 보안

- Wallet 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- Wallet 비밀번호는 안전하게 관리하세요
- 프로덕션 환경에서는 환경변수 또는 시크릿 관리 서비스 사용 권장

### 3. 연결 풀 관리

애플리케이션 종료 시 연결 풀을 정리해야 합니다:

```typescript
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

---

## 🐛 알려진 이슈

현재 알려진 이슈는 없습니다.

문제 발견 시 GitHub Issues에 등록해주세요.

---

## ✨ 요약

- ✅ ALTIBASE, MySQL 제거 완료
- ✅ Oracle Database 전용으로 전환 완료
- ✅ Wallet 방식 (Autonomous DB) 지원
- ✅ 기본 연결 방식 지원 준비 완료
- ✅ 자동 연결 방식 전환 구현
- ✅ 상세한 문서화 완료
- ✅ 테스트 가능한 상태

**다음 단계**: Wallet 설정 후 애플리케이션 실행 및 테스트

---

**작성자**: AI Assistant  
**검토자**: 프로젝트 오너  
**승인일**: 2024년 12월 26일
