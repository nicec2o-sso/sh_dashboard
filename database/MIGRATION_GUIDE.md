# Altibase 데이터베이스 마이그레이션 가이드 📚

## 목차
1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [Altibase 설치 및 설정](#altibase-설치-및-설정)
4. [데이터베이스 스키마 생성](#데이터베이스-스키마-생성)
5. [샘플 데이터 입력](#샘플-데이터-입력)
6. [Node.js 패키지 설치](#nodejs-패키지-설치)
7. [환경변수 설정](#환경변수-설정)
8. [데이터베이스 초기화](#데이터베이스-초기화)
9. [API 라우트 수정](#api-라우트-수정)
10. [테스트](#테스트)
11. [문제 해결](#문제-해결)

---

## 개요

이 가이드는 In-Memory 데이터 저장 방식을 Altibase 데이터베이스로 전환하는 과정을 설명합니다.

### 주요 변경사항
- ✅ **Repository 패턴 도입**: 데이터 액세스 로직 추상화
- ✅ **의존성 주입**: Service에 Repository 주입
- ✅ **Altibase ODBC 연결**: odbc 패키지 사용
- ✅ **완전한 SQL 스키마**: 테이블, 시퀀스, 인덱스, 제약조건
- ✅ **샘플 데이터**: 개발/테스트용 초기 데이터

### 아키텍처
```
API Routes → Services → Repositories → Altibase Database
                ↓
            (추상화)
```

---

## 사전 준비

### 필요한 소프트웨어
1. **Altibase 서버** (버전 7.1 이상 권장)
2. **Altibase ODBC 드라이버**
3. **Node.js** (버전 18 이상)
4. **npm** 또는 **yarn**

### 확인 사항
```bash
# Node.js 버전 확인
node --version  # v18.0.0 이상

# npm 버전 확인
npm --version

# Altibase 서버 상태 확인 (Altibase 서버에서)
server status
```

---

## Altibase 설치 및 설정

### 1. Altibase 서버 설치

공식 웹사이트에서 다운로드: https://altibase.com

```bash
# Linux 예시
cd /path/to/altibase/install/package
tar xvf altibase-server-7.x.x.tar.gz
cd altibase-server

# 환경 변수 설정
export ALTIBASE_HOME=/path/to/altibase
export PATH=$ALTIBASE_HOME/bin:$PATH
export LD_LIBRARY_PATH=$ALTIBASE_HOME/lib:$LD_LIBRARY_PATH
```

### 2. Altibase 서버 시작

```bash
# Altibase 서버 시작
server start

# 상태 확인
server status

# 결과 예시:
# -----------------------------------------------
#      Altibase Client Query utility.
#      Release Version 7.x.x.x.x
# -----------------------------------------------
# ISQL_CONNECTION = TCP, SERVER = localhost, PORT_NO = 20300
# [Connected]
```

### 3. ODBC 드라이버 설정

#### Windows
1. Altibase ODBC 드라이버 설치 (설치 파일 실행)
2. ODBC 데이터 소스 관리자 실행
3. 시스템 DSN 탭에서 "추가" 클릭
4. "Altibase" 드라이버 선택
5. DSN 이름: `ALTIBASE`
6. 서버: `localhost` (또는 서버 IP)
7. 포트: `20300`
8. 테스트 연결 확인

#### Linux/macOS
```bash
# ODBC 설정 파일 편집
vi ~/.odbc.ini

# 또는 시스템 전체 설정
sudo vi /etc/odbc.ini
```

**/etc/odbc.ini 또는 ~/.odbc.ini 내용:**
```ini
[ALTIBASE]
Description = Altibase ODBC Driver
Driver = /path/to/altibase/lib/libaltibase_odbc-64bit-ul64.so
Server = localhost
Port = 20300
```

---

## 데이터베이스 스키마 생성

### 1. Altibase iSQL 접속

```bash
# iSQL 실행
isql -s localhost -u sys -p manager

# 또는 포트 지정
isql -s localhost:20300 -u sys -p manager
```

### 2. 데이터베이스 생성 (필요한 경우)

```sql
-- 데이터베이스 생성 (Altibase는 기본 DB 사용)
-- 필요시 별도 Tablespace 생성
CREATE TABLESPACE MY_TABLESPACE
  DATAFILE '/path/to/datafile.dbf'
  SIZE 100M
  AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED;
```

### 3. 스키마 생성 스크립트 실행

```bash
# 프로젝트 루트에서
cd database

# 스크립트 실행
isql -s localhost -u sys -p manager -f schema.sql

# 결과 확인
# - 테이블 6개 생성
# - 시퀀스 6개 생성
# - 인덱스 생성
# - 제약조건 생성
```

### 4. 생성된 테이블 확인

```sql
-- 테이블 목록 조회
SELECT TABLE_NAME FROM SYSTEM_.SYS_TABLES_
WHERE USER_NAME = 'SYS'
ORDER BY TABLE_NAME;

-- 결과:
-- NODES
-- NODE_GROUPS
-- NODE_GROUP_MEMBERS
-- APIS
-- API_PARAMETERS
-- SYNTHETIC_TESTS
-- SYNTHETIC_TEST_HISTORY
```

### 5. 테이블 구조 확인

```sql
-- 특정 테이블 구조 확인
DESC NODES;

-- 결과:
-- [ COLUMN INFO ]
-- NAME                 TYPE                 IS NULL
-- --------------------------------------------------------
-- ID                   INTEGER              NOT NULL
-- NAME                 VARCHAR(200)         NOT NULL
-- HOST                 VARCHAR(255)         NOT NULL
-- PORT                 INTEGER              NOT NULL
-- STATUS               VARCHAR(20)          NOT NULL
-- DESCRIPTION          VARCHAR(1000)
-- CREATED_AT           DATE                 NOT NULL
-- UPDATED_AT           DATE                 NOT NULL
```

---

## 샘플 데이터 입력

### 1. 샘플 데이터 스크립트 실행

```bash
# 프로젝트 루트/database 폴더에서
isql -s localhost -u sys -p manager -f insert_sample_data.sql

# 또는 iSQL 내에서
iSQL> @/path/to/insert_sample_data.sql
```

### 2. 입력된 데이터 확인

```sql
-- 노드 확인
SELECT ID, NAME, HOST, PORT, STATUS FROM NODES;

-- 결과 예시:
-- ID  NAME            HOST            PORT  STATUS
-- --  --------------  --------------  ----  -------
-- 1   Web Server 1    192.168.1.10    8080  healthy
-- 2   Web Server 2    192.168.1.11    8080  warning
-- 3   DB Server       192.11.33.4     5432  error
-- 4   Cache Server    194.168.1.5     6379  healthy
-- 5   API Server      10.2.14.111     3000  healthy

-- API 확인
SELECT ID, NAME, URI, METHOD FROM APIS;

-- 노드 그룹 확인
SELECT 
  NG.NAME AS GROUP_NAME,
  N.NAME AS NODE_NAME
FROM NODE_GROUP_MEMBERS NGM
JOIN NODE_GROUPS NG ON NGM.GROUP_ID = NG.ID
JOIN NODES N ON NGM.NODE_ID = N.ID
ORDER BY NG.ID;
```

---

## Node.js 패키지 설치

### 1. ODBC 패키지 설치

```bash
# 프로젝트 루트에서
npm install odbc

# 또는 yarn
yarn add odbc
```

### 2. 빌드 도구 설치 (필요시)

ODBC 패키지는 네이티브 모듈이므로 컴파일이 필요합니다.

#### Windows
- Visual Studio Build Tools 설치
- 또는 npm install --global windows-build-tools

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install build-essential unixodbc-dev

# CentOS/RHEL
sudo yum install gcc make unixODBC-devel
```

#### macOS
```bash
# Xcode Command Line Tools
xcode-select --install

# Homebrew로 unixODBC 설치
brew install unixodbc
```

### 3. 설치 확인

```bash
# node_modules 확인
ls node_modules/odbc

# 테스트 스크립트 실행 (나중에 작성)
npm run test:db
```

---

## 환경변수 설정

### 1. .env.local 파일 생성

```bash
# 프로젝트 루트에서
cp .env.example .env.local
```

### 2. .env.local 파일 수정

```env
# 데이터베이스 타입
USE_DATABASE=altibase

# Altibase 연결 정보
ALTIBASE_HOST=localhost
ALTIBASE_PORT=20300
ALTIBASE_USER=sys
ALTIBASE_PASSWORD=manager
ALTIBASE_DATABASE=mydb

# Next.js 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. 환경변수 확인

```typescript
// test-env.ts 파일 생성
console.log('USE_DATABASE:', process.env.USE_DATABASE);
console.log('ALTIBASE_HOST:', process.env.ALTIBASE_HOST);
console.log('ALTIBASE_PORT:', process.env.ALTIBASE_PORT);

// 실행
npx ts-node test-env.ts
```

---

## 데이터베이스 초기화

### 1. 데이터베이스 연결 초기화

애플리케이션 시작 시 데이터베이스 연결을 초기화해야 합니다.

**src/app/layout.tsx 수정:**

```typescript
import { db } from '@/lib/altibase';

// 서버 컴포넌트에서 초기화
async function initializeDatabase() {
  try {
    await db.initialize();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // 프로덕션 환경에서는 적절한 에러 처리 필요
  }
}

// Layout 컴포넌트에서 호출
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await initializeDatabase();
  
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

### 2. Service 초기화 확인

```typescript
// src/services/serviceInitializer.ts가 자동으로 실행됨
// 로그에서 확인:
// [ServiceInitializer] Creating Node Repository: altibase
// [ServiceInitializer] Services initialized with altibase database
```

---

## API 라우트 수정

### 기존 API 라우트를 새로운 Service로 변경

**src/app/api/nodes/route.ts 수정 전:**

```typescript
import { NodeService } from '@/services/nodeService';

export async function GET() {
  // static 메서드 호출
  const nodes = NodeService.getAllNodes();
  return NextResponse.json({ success: true, data: nodes });
}
```

**수정 후:**

```typescript
import { nodeService } from '@/services/serviceInitializer';

export async function GET() {
  try {
    // 인스턴스 메서드 호출 (async)
    const nodes = await nodeService.getAllNodes();
    return NextResponse.json({ success: true, data: nodes });
  } catch (error) {
    console.error('Failed to get nodes:', error);
    return NextResponse.json(
      { success: false, error: '노드 조회 실패' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // async 메서드 호출
    const newNode = await nodeService.createNode(body);
    
    return NextResponse.json({ success: true, data: newNode }, { status: 201 });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '노드 생성 실패' },
      { status: 500 }
    );
  }
}
```

### 주요 변경사항
1. ✅ `NodeService.method()` → `nodeService.method()`
2. ✅ 모든 메서드에 `await` 추가
3. ✅ `try-catch`로 에러 처리
4. ✅ `serviceInitializer`에서 import

---

## 테스트

### 1. 개발 서버 시작

```bash
npm run dev

# 로그 확인:
# [Altibase] Configuration loaded: localhost:20300
# [Altibase] Initializing connection pool...
# [Altibase] Connection pool initialized successfully
# [Altibase] Connection test successful
# [ServiceInitializer] Creating Node Repository: altibase
# [ServiceInitializer] Services initialized with altibase database
```

### 2. API 테스트

```bash
# 노드 목록 조회
curl http://localhost:3000/api/nodes

# 노드 생성
curl -X POST http://localhost:3000/api/nodes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Server","host":"10.0.0.1","port":8080}'

# 노드 수정
curl -X PUT http://localhost:3000/api/nodes/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"warning"}'

# 노드 삭제
curl -X DELETE http://localhost:3000/api/nodes/1
```

### 3. 브라우저에서 테스트

1. http://localhost:3000 접속
2. 노드 관리 탭 클릭
3. 노드 추가/수정/삭제 테스트
4. 개발자 도구 네트워크 탭에서 API 호출 확인

### 4. 데이터베이스 확인

```sql
-- iSQL에서 확인
SELECT * FROM NODES ORDER BY ID;

-- 변경사항이 DB에 반영되는지 확인
```

---

## 문제 해결

### 문제 1: ODBC 드라이버를 찾을 수 없음

```
Error: [unixODBC][Driver Manager]Data source name not found, and no default driver specified
```

**해결방법:**
1. ODBC 드라이버가 설치되어 있는지 확인
2. odbc.ini 파일 경로 및 내용 확인
3. DSN 이름이 정확한지 확인 (대소문자 구분)

```bash
# ODBC 드라이버 목록 확인
odbcinst -q -d

# DSN 목록 확인
odbcinst -q -s
```

### 문제 2: Altibase 서버 연결 실패

```
Error: [Altibase] Failed to initialize connection pool: connection timeout
```

**해결방법:**
1. Altibase 서버가 실행 중인지 확인
   ```bash
   server status
   ```

2. 방화벽 설정 확인
   ```bash
   # 포트 20300이 열려있는지 확인
   telnet localhost 20300
   ```

3. 연결 정보 확인 (.env.local)
   - ALTIBASE_HOST
   - ALTIBASE_PORT
   - ALTIBASE_USER
   - ALTIBASE_PASSWORD

### 문제 3: 트랜잭션 타임아웃

```
Error: Transaction timeout
```

**해결방법:**
1. Altibase 서버 설정 확인
   ```sql
   -- 타임아웃 설정 확인
   SELECT * FROM V$PROPERTY WHERE NAME LIKE '%TIMEOUT%';
   
   -- 타임아웃 늘리기 (필요시)
   ALTER SYSTEM SET QUERY_TIMEOUT = 600;
   ```

2. 코드에서 타임아웃 설정 조정
   ```typescript
   // lib/altibase.ts
   this.pool = await odbc.pool({
     connectionString: this.connectionString,
     connectionTimeout: 30, // 30초로 증가
     loginTimeout: 30,
   });
   ```

### 문제 4: 메모리 부족

```
Error: Cannot allocate memory
```

**해결방법:**
1. Altibase 메모리 설정 증가
   ```sql
   -- 메모리 설정 확인
   SELECT * FROM V$PROPERTY WHERE NAME LIKE '%MEM%';
   
   -- 메모리 증가 (예: 2GB)
   ALTER SYSTEM SET MEMORY_MAX_DB_SIZE = 2G;
   ```

2. 연결 풀 크기 조정
   ```typescript
   // 연결 풀 최대 크기 제한
   // (odbc 패키지는 기본적으로 제한이 없으므로 조심)
   ```

### 문제 5: 시퀀스 값이 증가하지 않음

```
Error: Duplicate key value violates unique constraint
```

**해결방법:**
1. 시퀀스 현재 값 확인
   ```sql
   SELECT SEQ_NODE_ID.CURRVAL FROM DUAL;
   ```

2. 시퀀스 리셋 (필요시)
   ```sql
   -- 기존 최대 ID 확인
   SELECT MAX(ID) FROM NODES;
   
   -- 시퀀스 재생성
   DROP SEQUENCE SEQ_NODE_ID;
   CREATE SEQUENCE SEQ_NODE_ID START WITH 100 INCREMENT BY 1;
   ```

---

## 다음 단계

### 1. 나머지 Service 리팩토링

다음 Service들도 동일한 방식으로 리팩토링하세요:
- `ApiService` → `AltibaseApiRepository`
- `NodeGroupService` → `AltibaseNodeGroupRepository`
- `SyntheticTestService` → `AltibaseSyntheticTestRepository`

### 2. 트랜잭션 처리

복잡한 비즈니스 로직에서 트랜잭션 사용:

```typescript
// Service에서 트랜잭션 사용 예시
async createNodeWithHistory(dto: CreateNodeDto) {
  return await db.transaction(async (conn) => {
    // 1. 노드 생성
    const node = await this.repository.create(dto);
    
    // 2. 히스토리 기록
    await conn.query(
      'INSERT INTO NODE_HISTORY (NODE_ID, ACTION) VALUES (?, ?)',
      [node.id, 'created']
    );
    
    return node;
  });
}
```

### 3. 캐싱 추가

자주 조회되는 데이터는 캐싱 적용:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // 60초 TTL

async getAllNodes(): Promise<Node[]> {
  const cacheKey = 'all_nodes';
  
  // 캐시에서 조회
  const cached = cache.get<Node[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // DB에서 조회
  const nodes = await this.repository.findAll();
  
  // 캐시에 저장
  cache.set(cacheKey, nodes);
  
  return nodes;
}
```

### 4. 로깅 강화

구조화된 로깅 도입:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 사용
logger.info('Node created', { nodeId: node.id, name: node.name });
```

### 5. 모니터링

APM 도구 추가:
- New Relic
- Datadog
- Sentry

---

## 체크리스트 ✅

마이그레이션 완료 확인:

- [ ] Altibase 서버 설치 및 실행 확인
- [ ] ODBC 드라이버 설치 및 DSN 설정
- [ ] 스키마 생성 (schema.sql 실행)
- [ ] 샘플 데이터 입력 (insert_sample_data.sql 실행)
- [ ] odbc 패키지 설치
- [ ] .env.local 파일 생성 및 설정
- [ ] Repository 패턴 구현
- [ ] Service 레이어 리팩토링
- [ ] API 라우트 수정 (async/await 추가)
- [ ] 데이터베이스 연결 초기화
- [ ] API 테스트 (CRUD 작업)
- [ ] 에러 처리 추가
- [ ] 로깅 확인

모든 항목을 완료하면 프로덕션 배포 준비 완료! 🎉

---

## 참고 자료

- [Altibase 공식 문서](https://altibase.com/kr/resources/documents/)
- [ODBC 패키지 문서](https://www.npmjs.com/package/odbc)
- [Repository 패턴 설명](https://martinfowler.com/eaaCatalog/repository.html)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
