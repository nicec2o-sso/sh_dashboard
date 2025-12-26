# Oracle Database 마이그레이션 가이드

이 문서는 ALTIBASE/MySQL에서 Oracle Database로의 마이그레이션 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [변경 사항](#변경-사항)
3. [Oracle Autonomous Database 설정](#oracle-autonomous-database-설정)
4. [환경 설정](#환경-설정)
5. [스키마 마이그레이션](#스키마-마이그레이션)
6. [애플리케이션 변경 사항](#애플리케이션-변경-사항)
7. [테스트](#테스트)
8. [기본 연결 방식으로 전환](#기본-연결-방식으로-전환)

## 개요

### 마이그레이션 배경

- ALTIBASE 및 MySQL 지원 제거
- Oracle Autonomous Database로 통합
- 향후 일반 Oracle Database로 전환 예정

### 지원하는 연결 방식

1. **Wallet 방식** (현재)
   - Oracle Autonomous Database 전용
   - 보안 연결 (TLS/SSL)
   - Wallet 파일 필요

2. **기본 연결 방식** (추후)
   - 일반 Oracle Database
   - 호스트, 포트, 서비스 이름으로 연결

## 변경 사항

### 삭제된 항목

- ❌ ALTIBASE 지원 제거
  - `src/lib/altibase.ts` → `src/_deprecated/altibase.ts`
  - ALTIBASE 관련 환경변수
  
- ❌ MySQL 지원 제거
  - `src/_deprecated/mysql.ts`
  - MySQL 관련 환경변수

### 추가된 항목

- ✅ Oracle 지원 추가
  - `src/lib/oracle.ts` - Oracle 연결 라이브러리
  - `src/lib/database.ts` - Oracle 전용 추상화
  - `database/schema_oracle.sql` - Oracle 스키마

### 수정된 항목

- 🔄 `package.json` - oracledb 패키지 추가
- 🔄 `.env.local` - Oracle 환경변수 설정
- 🔄 `.env.example` - Oracle 설정 예시

## Oracle Autonomous Database 설정

### 1. OCI Console 접속

1. https://cloud.oracle.com 접속
2. Oracle Cloud Infrastructure Console 로그인

### 2. Autonomous Database 생성 (이미 있다면 Skip)

1. **메뉴** → **Oracle Database** → **Autonomous Database**
2. **Create Autonomous Database** 클릭
3. 설정 입력:
   - **Display name**: 원하는 이름
   - **Database name**: 원하는 이름 (예: MYDB)
   - **Workload type**: Transaction Processing 또는 Data Warehouse
   - **Deployment type**: Shared Infrastructure
   - **Database version**: 19c 또는 21c
   - **OCPU count**: 1 (최소)
   - **Storage**: 1TB (최소)
4. **Administrator Credentials** 설정
   - **Username**: ADMIN (고정)
   - **Password**: 강력한 비밀번호 설정 (대소문자+숫자+특수문자)
5. **Network Access**: "Secure access from everywhere" 선택
6. **License Type**: License Included 또는 BYOL
7. **Create Autonomous Database** 클릭

### 3. Wallet 다운로드

1. Autonomous Database 인스턴스 선택
2. **DB Connection** 버튼 클릭
3. **Download Wallet** 선택
4. **Wallet Password** 입력 및 확인
   - 이 비밀번호는 나중에 `ORACLE_WALLET_PASSWORD`로 사용됩니다
5. **Download** 클릭하여 `Wallet_[DB이름].zip` 다운로드

### 4. Wallet 압축 해제

```bash
# 프로젝트 루트에 wallet 디렉토리 생성
mkdir wallet

# Wallet 압축 해제 (Windows)
unzip Wallet_MYDB.zip -d wallet

# Wallet 압축 해제 (Mac/Linux)
unzip Wallet_MYDB.zip -d wallet
```

Wallet 디렉토리 구조:
```
wallet/
├── cwallet.sso          # 자동 로그인 지갑
├── ewallet.p12          # PKCS12 지갑
├── tnsnames.ora         # TNS 연결 정보
├── sqlnet.ora           # SQL*Net 설정
├── ojdbc.properties     # JDBC 속성
├── keystore.jks         # Java Keystore
└── truststore.jks       # Java Truststore
```

### 5. TNS 연결 문자열 확인

`wallet/tnsnames.ora` 파일을 열어 연결 문자열 확인:

```
mydb_high = (description=...)
mydb_medium = (description=...)
mydb_low = (description=...)
```

연결 문자열 선택:
- **mydb_high**: 최고 성능 (높은 우선순위)
- **mydb_medium**: 균형 잡힌 성능
- **mydb_low**: 비용 효율적 (낮은 우선순위)

## 환경 설정

### 1. Node.js Oracle 클라이언트 설치 (선택사항)

Oracle Instant Client가 필요할 수 있습니다:

#### Windows
1. [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html) 다운로드
2. 압축 해제 (예: `C:\oracle\instantclient_19_x`)
3. 환경변수 설정:
   ```
   PATH에 C:\oracle\instantclient_19_x 추가
   ```

#### Mac (Homebrew)
```bash
brew tap InstantClientTap/instantclient
brew install instantclient-basic
```

#### Linux
```bash
# Oracle Linux/RHEL/CentOS
yum install oracle-instantclient-basic

# Ubuntu/Debian
# Oracle 웹사이트에서 .deb 패키지 다운로드 후 설치
dpkg -i oracle-instantclient-basic-*.deb
```

### 2. 환경변수 설정 (.env.local)

```bash
# ============================================================================
# Wallet 방식 (현재 사용)
# ============================================================================

# Wallet 디렉토리 절대 경로
ORACLE_WALLET_LOCATION=/Users/username/my-project_raw/wallet

# Wallet 비밀번호 (다운로드 시 설정한 비밀번호)
ORACLE_WALLET_PASSWORD=YourWalletPassword123

# TNS 연결 문자열 (tnsnames.ora에서 확인)
ORACLE_CONNECTION_STRING=mydb_high

# 데이터베이스 사용자명 (ADMIN 또는 생성한 사용자)
ORACLE_USER=admin

# 데이터베이스 비밀번호
ORACLE_PASSWORD=YourDbPassword123!

# ============================================================================
# Next.js 설정
# ============================================================================

NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. NPM 패키지 설치

```bash
npm install
```

Oracle 패키지가 이미 `package.json`에 포함되어 있습니다:
```json
{
  "dependencies": {
    "oracledb": "^6.10.0"
  }
}
```

## 스키마 마이그레이션

### 1. SQL Developer 또는 SQL*Plus로 연결

#### SQL Developer 사용

1. SQL Developer 실행
2. **New Connection** 클릭
3. 연결 정보 입력:
   - **Connection Name**: My Autonomous DB
   - **Connection Type**: Cloud Wallet
   - **Configuration File**: `wallet` 디렉토리 선택
   - **Username**: admin
   - **Password**: 데이터베이스 비밀번호
   - **Service**: mydb_high (또는 다른 서비스)
4. **Test** 클릭하여 연결 확인
5. **Connect** 클릭

#### SQL*Plus 사용 (터미널)

```bash
# 환경변수 설정 (Linux/Mac)
export TNS_ADMIN=/path/to/wallet

# 환경변수 설정 (Windows)
set TNS_ADMIN=C:\path\to\wallet

# SQL*Plus 연결
sqlplus admin@mydb_high
# 비밀번호 입력
```

### 2. 스키마 생성

#### 방법 1: SQL 파일 직접 실행

```bash
# SQL*Plus에서
@database/schema_oracle.sql

# SQL Developer에서
# 1. schema_oracle.sql 파일 열기
# 2. F5 (Run Script) 실행
```

#### 방법 2: 스크립트 복사 & 붙여넣기

1. `database/schema_oracle.sql` 내용 복사
2. SQL Worksheet에 붙여넣기
3. 실행 (F5 또는 Run Script 버튼)

### 3. 스키마 확인

```sql
-- 생성된 테이블 확인
SELECT table_name 
FROM user_tables 
WHERE table_name IN (
  'NODES', 
  'NODE_GROUPS', 
  'NODE_GROUP_MEMBERS', 
  'APIS', 
  'API_PARAMETERS', 
  'SYNTHETIC_TESTS', 
  'SYNTHETIC_TEST_HISTORY'
)
ORDER BY table_name;

-- 생성된 시퀀스 확인
SELECT sequence_name 
FROM user_sequences 
WHERE sequence_name LIKE 'SEQ_%'
ORDER BY sequence_name;

-- 외래키 제약조건 확인
SELECT constraint_name, table_name, constraint_type
FROM user_constraints
WHERE constraint_type = 'R'
ORDER BY table_name;
```

## 애플리케이션 변경 사항

### 주요 SQL 문법 차이

#### 1. 날짜 함수

```sql
-- ALTIBASE/MySQL
SYSDATE

-- Oracle (변경 없음)
SYSDATE
SYSTIMESTAMP  -- 더 정밀한 타임스탬프
```

#### 2. 문자열 연결

```sql
-- ALTIBASE/MySQL
CONCAT(str1, str2)

-- Oracle (두 방식 모두 가능)
CONCAT(str1, str2)
str1 || str2
```

#### 3. LIMIT (페이징)

```sql
-- ALTIBASE/MySQL
SELECT * FROM NODES LIMIT 10 OFFSET 20;

-- Oracle
SELECT * FROM NODES 
ORDER BY ID
FETCH FIRST 10 ROWS ONLY 
OFFSET 20 ROWS;

-- 또는 ROWNUM 사용
SELECT * FROM (
  SELECT ROWNUM rn, t.* FROM (
    SELECT * FROM NODES ORDER BY ID
  ) t WHERE ROWNUM <= 30
) WHERE rn > 20;
```

#### 4. 자동 증가 컬럼

```sql
-- ALTIBASE/MySQL
AUTO_INCREMENT

-- Oracle (시퀀스 사용)
SEQ_NODE_ID.NEXTVAL

-- 예시
INSERT INTO NODES (ID, NAME, HOST, PORT) 
VALUES (SEQ_NODE_ID.NEXTVAL, 'Node1', 'localhost', 8080);
```

#### 5. 파라미터 바인딩

```typescript
// ALTIBASE/MySQL (Positional)
await db.query('SELECT * FROM NODES WHERE ID = ?', [nodeId]);

// Oracle (Named 바인딩 권장)
await db.query('SELECT * FROM NODES WHERE ID = :id', { id: nodeId });

// Oracle (Positional 바인딩도 가능)
await db.query('SELECT * FROM NODES WHERE ID = :1', [nodeId]);
```

### 코드에서 주의할 점

1. **시퀀스 사용**
   ```typescript
   // 새 노드 생성
   const sql = `
     INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS)
     VALUES (SEQ_NODE_ID.NEXTVAL, :name, :host, :port, :status)
     RETURNING ID INTO :id
   `;
   
   const result = await db.query(sql, {
     name: 'Node1',
     host: 'localhost',
     port: 8080,
     status: 'active',
     id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
   });
   ```

2. **날짜 처리**
   ```typescript
   // TIMESTAMP 컬럼은 자동으로 Date 객체로 변환됨
   const nodes = await db.query('SELECT * FROM NODES');
   console.log(nodes[0].CREATED_AT); // Date 객체
   ```

3. **CLOB/BLOB 처리**
   ```typescript
   // CLOB은 자동으로 문자열로 변환됨 (설정 완료)
   // 큰 데이터는 스트리밍 사용 권장
   ```

## 테스트

### 1. 연결 테스트

```bash
npm run dev
```

콘솔에서 다음 메시지 확인:
```
[Oracle] Configuration loaded
[Oracle] Initializing connection pool...
[Oracle] Connection pool initialized successfully
[Oracle] Connection test successful
```

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

# 노드 조회
curl http://localhost:3000/api/nodes/1
```

### 3. 데이터베이스 직접 확인

```sql
-- 노드 확인
SELECT * FROM NODES;

-- 시퀀스 현재 값 확인
SELECT SEQ_NODE_ID.CURRVAL FROM DUAL;
```

## 기본 연결 방식으로 전환

추후 일반 Oracle Database로 전환할 때 사용합니다.

### 1. 환경변수 수정 (.env.local)

```bash
# ============================================================================
# 기본 연결 방식 (Wallet 없음)
# ============================================================================

# ORACLE_WALLET_LOCATION 주석 처리 또는 삭제
# ORACLE_WALLET_LOCATION=/path/to/wallet
# ORACLE_WALLET_PASSWORD=password

# Oracle 서버 정보
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=ORCLPDB1

# 사용자 정보
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password
```

### 2. 애플리케이션 재시작

```bash
npm run dev
```

자동으로 기본 연결 방식으로 전환됩니다:
```
[Oracle] Using basic connection mode
[Oracle] Connect string: localhost:1521/ORCLPDB1
```

## 트러블슈팅

### 문제 1: Wallet을 찾을 수 없음

**에러**: `Error: NJS-516: path is not a directory`

**해결**:
1. `ORACLE_WALLET_LOCATION`이 올바른 절대 경로인지 확인
2. Wallet 디렉토리에 `cwallet.sso` 파일이 있는지 확인

### 문제 2: TNS 이름을 찾을 수 없음

**에러**: `ORA-12154: TNS:could not resolve the connect identifier`

**해결**:
1. `ORACLE_CONNECTION_STRING` 값이 `tnsnames.ora`에 있는지 확인
2. 대소문자 확인 (보통 소문자)

### 문제 3: 인증 실패

**에러**: `ORA-01017: invalid username/password`

**해결**:
1. 사용자명과 비밀번호 재확인
2. Autonomous DB에서 사용자 비밀번호 재설정

### 문제 4: Oracle Client를 찾을 수 없음

**에러**: `DPI-1047: Cannot locate an Oracle Client library`

**해결**:
1. Oracle Instant Client 설치
2. 환경변수 PATH에 Instant Client 경로 추가
3. 애플리케이션 재시작

### 문제 5: 연결 풀 에러

**에러**: `NJS-500: connection pool is closing`

**해결**:
```typescript
// 애플리케이션 종료 시 연결 풀 정리
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

## 추가 리소스

- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Oracle Autonomous Database](https://www.oracle.com/autonomous-database/)
- [Oracle SQL Developer](https://www.oracle.com/database/sqldeveloper/)

## 지원

문제가 발생하면 다음을 확인하세요:

1. Oracle 공식 문서
2. node-oracledb GitHub Issues
3. Oracle Community Forums
4. 프로젝트 README.md
