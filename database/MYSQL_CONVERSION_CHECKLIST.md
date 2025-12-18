# Altibase → MySQL 변경 체크리스트 ✅

## 📋 변경 파일 목록

### 수정이 필요한 파일

| 순번 | 파일 경로 | 변경 내용 | 난이도 |
|-----|----------|----------|--------|
| 1 | `package.json` | odbc 제거, mysql2 추가 | ⭐ 쉬움 |
| 2 | `.env.local` | ALTIBASE_* → MYSQL_* | ⭐ 쉬움 |
| 3 | `src/lib/altibase.ts` → `src/lib/mysql.ts` | MySQL 연결 코드 작성 | ⭐⭐ 보통 |
| 4 | `database/schema.sql` → `database/schema_mysql.sql` | MySQL 문법 변경 | ⭐⭐⭐ 어려움 |
| 5 | `database/insert_sample_data.sql` | MySQL 문법 변경 | ⭐⭐ 보통 |
| 6 | `src/repositories/AltibaseNodeRepository.ts` | MySQLNodeRepository.ts 생성 | ⭐⭐⭐ 어려움 |
| 7 | `src/services/serviceInitializer.ts` | import 경로 변경 | ⭐ 쉬움 |

---

## 🔄 단계별 변경 가이드

### 1단계: 패키지 변경

```bash
# 기존 패키지 제거
npm uninstall odbc

# MySQL 패키지 설치
npm install mysql2

# package.json 확인
npm list mysql2
```

**변경 결과:**
```json
{
  "dependencies": {
    "mysql2": "^3.x.x"  // 추가됨
    // "odbc": "^x.x.x"  // 제거됨
  }
}
```

---

### 2단계: 환경변수 변경

**파일: `.env.local`**

```bash
# ❌ 제거
USE_DATABASE=altibase
ALTIBASE_HOST=localhost
ALTIBASE_PORT=20300
ALTIBASE_USER=sys
ALTIBASE_PASSWORD=manager
ALTIBASE_DATABASE=mydb

# ✅ 추가
USE_DATABASE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mydb
```

---

### 3단계: 데이터베이스 연결 파일 변경

**파일: `src/lib/altibase.ts` → `src/lib/mysql.ts` (새 파일)**

✅ **이미 생성됨**: `src/lib/mysql.ts`

**주요 변경사항:**

| 항목 | Altibase | MySQL |
|-----|----------|-------|
| import | `import odbc from 'odbc'` | `import mysql from 'mysql2/promise'` |
| 연결 방식 | ODBC 연결 문자열 | 연결 옵션 객체 |
| 풀 생성 | `odbc.pool()` | `mysql.createPool()` |
| 쿼리 실행 | `connection.query()` | `pool.execute()` |
| 트랜잭션 | `beginTransaction()` | `beginTransaction()` (동일) |

---

### 4단계: SQL 스키마 변경

**파일: `database/schema.sql` → `database/schema_mysql.sql` (새 파일)**

✅ **이미 생성됨**: `database/schema_mysql.sql`

**주요 변경사항:**

#### A. 시퀀스 → AUTO_INCREMENT

```sql
-- ❌ Altibase
CREATE SEQUENCE SEQ_NODE_ID START WITH 1;

CREATE TABLE NODES (
  ID INTEGER NOT NULL,
  ...
);

INSERT INTO NODES (ID, ...) VALUES (SEQ_NODE_ID.NEXTVAL, ...);

-- ✅ MySQL
CREATE TABLE nodes (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- 시퀀스 불필요
  ...
);

INSERT INTO nodes (name, ...) VALUES ('Web Server 1', ...);  -- ID 생략
```

#### B. 데이터 타입 변경

| Altibase | MySQL |
|----------|-------|
| `INTEGER` | `INT` |
| `DATE` | `DATETIME` |
| `CHAR(1)` | `BOOLEAN` 또는 `CHAR(1)` |
| `SYSDATE` | `CURRENT_TIMESTAMP` 또는 `NOW()` |

#### C. 컬럼명 및 테이블명

```sql
-- Altibase: 대문자
CREATE TABLE NODES (
  ID INTEGER,
  NAME VARCHAR(200),
  ...
);

-- MySQL: 소문자 권장 (Linux에서 대소문자 구분)
CREATE TABLE nodes (
  id INT,
  name VARCHAR(200),
  ...
);
```

#### D. 자동 타임스탬프

```sql
-- ❌ Altibase
CREATED_AT DATE DEFAULT SYSDATE NOT NULL,
UPDATED_AT DATE DEFAULT SYSDATE NOT NULL,

-- ✅ MySQL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
```

#### E. CHECK 제약조건

```sql
-- MySQL 8.0.16+ 지원
CHECK (status IN ('healthy', 'warning', 'error'))

-- MySQL 5.7 이하: 애플리케이션에서 검증
```

#### F. 문자 인코딩

```sql
-- 반드시 utf8mb4 사용 (이모지 지원)
CREATE TABLE nodes (
  ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5단계: 샘플 데이터 SQL 변경

**파일: `database/insert_sample_data.sql`**

**변경사항:**

```sql
-- ❌ Altibase
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, CREATED_AT, UPDATED_AT)
VALUES (SEQ_NODE_ID.NEXTVAL, 'Web Server 1', '192.168.1.10', 8080, 'healthy', SYSDATE, SYSDATE);

-- ✅ MySQL
INSERT INTO nodes (name, host, port, status, created_at, updated_at)
VALUES ('Web Server 1', '192.168.1.10', 8080, 'healthy', NOW(), NOW());
-- ID는 AUTO_INCREMENT로 자동 생성
```

**CHAR(1) → BOOLEAN 변경 시:**

```sql
-- ❌ Altibase
ENABLED = 'Y'

-- ✅ MySQL
enabled = TRUE  -- 또는 1
```

---

### 6단계: Repository 파일 변경

**파일: `src/repositories/AltibaseNodeRepository.ts` → `src/repositories/MySQLNodeRepository.ts` (새 파일)**

**주요 변경사항:**

#### A. import 변경

```typescript
// ❌ 제거
import { db } from '@/lib/altibase';

// ✅ 추가
import { db } from '@/lib/mysql';
```

#### B. Row 타입 변경

```typescript
// ❌ Altibase - 대문자
interface NodeRow {
  ID: number;
  NAME: string;
  HOST: string;
  ...
}

// ✅ MySQL - 소문자
interface NodeRow {
  id: number;
  name: string;
  host: string;
  ...
}
```

#### C. rowToNode 메서드 변경

```typescript
// ❌ Altibase
private rowToNode(row: NodeRow): Node {
  return {
    id: row.ID,      // 대문자
    name: row.NAME,
    host: row.HOST,
    ...
  };
}

// ✅ MySQL
private rowToNode(row: NodeRow): Node {
  return {
    id: row.id,      // 소문자
    name: row.name,
    host: row.host,
    ...
  };
}
```

#### D. ID 생성 방식 변경 (중요!)

```typescript
// ❌ Altibase - 시퀀스 사용
async create(data: CreateNodeDto): Promise<Node> {
  return await db.transaction(async (conn) => {
    // 1. 시퀀스로 ID 생성
    const idResult = await conn.query<{ NEXTVAL: number }>(
      'SELECT SEQ_NODE_ID.NEXTVAL AS NEXTVAL FROM DUAL'
    );
    const newId = idResult[0].NEXTVAL;

    // 2. ID 포함하여 INSERT
    await conn.query(
      'INSERT INTO NODES (ID, NAME, HOST, PORT, ...) VALUES (?, ?, ?, ?, ...)',
      [newId, data.name, data.host, data.port, ...]
    );

    // 3. 생성된 노드 조회
    const rows = await conn.query('SELECT * FROM NODES WHERE ID = ?', [newId]);
    return this.rowToNode(rows[0]);
  });
}

// ✅ MySQL - AUTO_INCREMENT 사용
async create(data: CreateNodeDto): Promise<Node> {
  try {
    // 1. ID 없이 INSERT (AUTO_INCREMENT)
    const sql = `
      INSERT INTO nodes (name, host, port, status, description)
      VALUES (?, ?, ?, 'healthy', ?)
    `;

    const [result] = await db.query<mysql.ResultSetHeader>(sql, [
      data.name,
      data.host,
      data.port,
      data.description || null,
    ]);

    // 2. 자동 생성된 ID 가져오기
    const newId = result.insertId;

    // 3. 생성된 노드 조회
    const nodes = await this.findById(newId);
    return nodes!;
  } catch (error) {
    console.error('[MySQLNodeRepository] create error:', error);
    throw error;
  }
}
```

#### E. UPDATE 시 UPDATED_AT 처리

```typescript
// ❌ Altibase - 수동 설정
updateFields.push('UPDATED_AT = SYSDATE');

// ✅ MySQL - ON UPDATE CURRENT_TIMESTAMP 설정되어 있으면 생략 가능
// 명시적으로 설정하려면:
updateFields.push('updated_at = CURRENT_TIMESTAMP');
```

#### F. 날짜 변환

```typescript
// MySQL은 DATETIME을 문자열로 반환하므로 변환 필요
createdAt: row.created_at instanceof Date 
  ? row.created_at.toISOString() 
  : new Date(row.created_at).toISOString(),
```

---

### 7단계: Service Initializer 변경

**파일: `src/services/serviceInitializer.ts`**

```typescript
// ❌ 제거
import { AltibaseNodeRepository } from '@/repositories/AltibaseNodeRepository';

// ✅ 추가
import { MySQLNodeRepository } from '@/repositories/MySQLNodeRepository';

function createNodeRepository(): INodeRepository {
  console.log(`[ServiceInitializer] Creating Node Repository: ${DATABASE_TYPE}`);
  
  switch (DATABASE_TYPE.toLowerCase()) {
    case 'mysql':
      return new MySQLNodeRepository();  // ✅ 추가
    
    case 'altibase':
      return new AltibaseNodeRepository();  // 유지 (호환성)
    
    default:
      console.warn(`Unknown database type: ${DATABASE_TYPE}, using MySQL`);
      return new MySQLNodeRepository();  // ✅ 기본값 변경
  }
}
```

---

## 🗂️ 파일 체크리스트

### 생성해야 할 파일

- [x] `src/lib/mysql.ts` - MySQL 연결 관리 (✅ 이미 생성됨)
- [x] `database/schema_mysql.sql` - MySQL 스키마 (✅ 이미 생성됨)
- [ ] `database/insert_sample_data_mysql.sql` - MySQL 샘플 데이터
- [ ] `src/repositories/MySQLNodeRepository.ts` - MySQL Repository

### 수정해야 할 파일

- [ ] `.env.local` - 환경변수 변경
- [ ] `package.json` - 패키지 변경 (npm install)
- [ ] `src/services/serviceInitializer.ts` - import 경로 변경
- [ ] `database/insert_sample_data.sql` - MySQL 문법 변경

---

## 🚀 실행 순서

### 1. 환경 준비

```bash
# 1-1. MySQL 패키지 설치
npm install mysql2

# 1-2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일 수정 (MYSQL_* 설정)
```

### 2. 데이터베이스 초기화

```bash
# 2-1. MySQL 서버 접속
mysql -u root -p

# 2-2. 스키마 생성
mysql> source /path/to/database/schema_mysql.sql

# 또는
mysql -u root -p < database/schema_mysql.sql

# 2-3. 샘플 데이터 입력
mysql> source /path/to/database/insert_sample_data_mysql.sql
```

### 3. 코드 변경

```bash
# 3-1. Repository 파일 생성
# src/repositories/MySQLNodeRepository.ts 작성

# 3-2. Service Initializer 수정
# src/services/serviceInitializer.ts import 변경

# 3-3. 변경사항 확인
git diff
```

### 4. 테스트 및 실행

```bash
# 4-1. 개발 서버 시작
npm run dev

# 4-2. 로그 확인
# [MySQL] Configuration loaded: localhost:3306
# [MySQL] Initializing connection pool...
# [MySQL] Connection pool initialized successfully
# [MySQL] Connection test successful

# 4-3. API 테스트
curl http://localhost:3000/api/nodes
```

---

## ⚠️ 주의사항

### MySQL 버전별 차이

| 기능 | MySQL 5.7 | MySQL 8.0+ |
|-----|-----------|------------|
| CHECK 제약조건 | ❌ 미지원 | ✅ 지원 |
| Window Functions | ❌ 미지원 | ✅ 지원 |
| CTE (WITH) | ❌ 미지원 | ✅ 지원 |
| JSON 함수 | 제한적 | 완전 지원 |

**권장: MySQL 8.0 이상 사용**

### 문자 인코딩

```sql
-- ❌ 잘못된 설정
CREATE TABLE nodes (...) CHARSET=utf8;  -- utf8은 3바이트만 지원 (이모지 ❌)

-- ✅ 올바른 설정
CREATE TABLE nodes (...) CHARSET=utf8mb4;  -- 4바이트 지원 (이모지 ✅)
```

### 대소문자 구분

- **Windows/macOS**: 테이블명 대소문자 구분 안 함
- **Linux**: 테이블명 대소문자 구분 함

**해결:** 모두 소문자 사용 권장

```sql
-- ✅ 권장
CREATE TABLE nodes (...);
SELECT * FROM nodes;

-- ❌ 비권장 (Linux에서 에러)
CREATE TABLE NODES (...);
SELECT * FROM nodes;  -- 에러: Table 'mydb.nodes' doesn't exist
```

---

## 🔍 문제 해결

### 문제 1: 연결 실패

```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**해결:**
```bash
# MySQL 서버 접속
mysql -u root -p

# 사용자 확인
SELECT user, host FROM mysql.user;

# 권한 부여
GRANT ALL PRIVILEGES ON mydb.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 2: 테이블이 존재하지 않음

```
Error: ER_NO_SUCH_TABLE: Table 'mydb.NODES' doesn't exist
```

**해결:**
- 테이블명은 소문자 사용 (`nodes`, not `NODES`)
- 스키마가 제대로 생성되었는지 확인
```sql
SHOW TABLES;
```

### 문제 3: AUTO_INCREMENT 초기화

```sql
-- 현재 AUTO_INCREMENT 값 확인
SHOW TABLE STATUS LIKE 'nodes';

-- AUTO_INCREMENT 값 변경
ALTER TABLE nodes AUTO_INCREMENT = 100;
```

---

## 📚 참고 자료

- ✅ **MySQL 공식 문서**: https://dev.mysql.com/doc/
- ✅ **mysql2 패키지**: https://www.npmjs.com/package/mysql2
- ✅ **생성된 파일**:
  - `src/lib/mysql.ts` - MySQL 연결 코드
  - `database/schema_mysql.sql` - MySQL 스키마
  - `database/MYSQL_MIGRATION_GUIDE.md` - 상세 가이드

---

## ✅ 최종 체크리스트

작업 완료 확인:

- [ ] MySQL 서버 설치 및 실행
- [ ] npm install mysql2
- [ ] .env.local 파일 생성 및 MySQL 설정
- [ ] database/schema_mysql.sql 실행
- [ ] database/insert_sample_data_mysql.sql 수정 및 실행
- [ ] src/lib/mysql.ts 확인 (이미 생성됨)
- [ ] src/repositories/MySQLNodeRepository.ts 생성
- [ ] src/services/serviceInitializer.ts 수정
- [ ] npm run dev 실행 및 로그 확인
- [ ] API 테스트 (CRUD 작업)
- [ ] 데이터베이스 확인

모두 완료하면 MySQL로 완전히 전환 완료! 🎉
