# MySQL 전환 가이드

## 1. 패키지 변경

### 제거할 패키지
```bash
npm uninstall odbc
```

### 설치할 패키지
```bash
# Option 1: mysql2 (추천 - 더 빠르고 Promise 지원)
npm install mysql2

# Option 2: mysql (레거시)
npm install mysql
```

---

## 2. 데이터베이스 연결 파일 수정

**파일: `src/lib/altibase.ts` → `src/lib/mysql.ts`로 변경**

### 주요 변경사항:

#### A. import 문 변경
```typescript
// ❌ 제거
import odbc from 'odbc';

// ✅ 추가
import mysql from 'mysql2/promise';
```

#### B. 연결 설정 변경
```typescript
// ❌ Altibase 연결 문자열
const connectionString = `DSN=ALTIBASE;SERVER=${host};PORT=${port};...`;

// ✅ MySQL 연결 옵션
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'mydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

#### C. 연결 풀 생성 변경
```typescript
// ❌ ODBC 풀
this.pool = await odbc.pool({
  connectionString: this.connectionString,
  connectionTimeout: 10,
});

// ✅ MySQL 풀
this.pool = mysql.createPool(this.config);
```

#### D. 쿼리 실행 변경
```typescript
// ❌ ODBC 방식
const connection = await this.pool.connect();
const result = await connection.query(sql, params);
await connection.close();

// ✅ MySQL 방식
const [rows] = await this.pool.execute(sql, params);
return rows;
```

---

## 3. SQL 스키마 파일 수정

**파일: `database/schema.sql`**

### A. 시퀀스를 AUTO_INCREMENT로 변경

```sql
-- ❌ Altibase 시퀀스
DROP SEQUENCE IF EXISTS SEQ_NODE_ID;
CREATE SEQUENCE SEQ_NODE_ID START WITH 1 INCREMENT BY 1;

-- ✅ MySQL AUTO_INCREMENT
-- 시퀀스 제거, 테이블에서 AUTO_INCREMENT 사용
```

### B. 테이블 정의 변경

```sql
-- ❌ Altibase
CREATE TABLE NODES (
  ID            INTEGER       NOT NULL,
  NAME          VARCHAR(200)  NOT NULL,
  ...
  CONSTRAINT PK_NODES PRIMARY KEY (ID)
);

-- ✅ MySQL
CREATE TABLE NODES (
  ID            INT           AUTO_INCREMENT PRIMARY KEY,  -- AUTO_INCREMENT 추가
  NAME          VARCHAR(200)  NOT NULL,
  HOST          VARCHAR(255)  NOT NULL,
  PORT          INT           NOT NULL,
  STATUS        VARCHAR(20)   DEFAULT 'healthy' NOT NULL,
  DESCRIPTION   VARCHAR(1000),
  CREATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP NOT NULL,  -- DATE → DATETIME
  UPDATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,  -- 자동 업데이트
  
  -- INDEX를 테이블 정의 내에 포함 가능
  INDEX IDX_NODES_NAME (NAME),
  INDEX IDX_NODES_HOST (HOST),
  
  -- CHECK 제약조건 (MySQL 8.0.16+)
  CHECK (STATUS IN ('healthy', 'warning', 'error')),
  CHECK (PORT BETWEEN 1 AND 65535)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### C. CHAR(1) → BOOLEAN 변경 (선택사항)

```sql
-- ❌ Altibase
REQUIRED      CHAR(1)       DEFAULT 'N' NOT NULL,
CONSTRAINT CHK_APARAM_REQUIRED CHECK (REQUIRED IN ('Y', 'N'))

-- ✅ MySQL (Option 1 - BOOLEAN 사용, 더 권장)
REQUIRED      BOOLEAN       DEFAULT FALSE NOT NULL,

-- ✅ MySQL (Option 2 - CHAR 유지)
REQUIRED      CHAR(1)       DEFAULT 'N' NOT NULL,
CHECK (REQUIRED IN ('Y', 'N'))
```

### D. DATE → DATETIME 변경

```sql
-- ❌ Altibase
CREATED_AT    DATE          DEFAULT SYSDATE NOT NULL,

-- ✅ MySQL
CREATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP NOT NULL,
```

### E. SYSDATE → CURRENT_TIMESTAMP

```sql
-- ❌ Altibase
DEFAULT SYSDATE

-- ✅ MySQL
DEFAULT CURRENT_TIMESTAMP
```

### F. CASCADE 동작 확인

```sql
-- MySQL은 CASCADE 지원하지만 명시적으로 작성
FOREIGN KEY (NODE_ID) REFERENCES NODES(ID) ON DELETE CASCADE
```

---

## 4. Repository 파일 수정

**파일: `src/repositories/AltibaseNodeRepository.ts` → `src/repositories/MySQLNodeRepository.ts`**

### A. ID 생성 방식 변경

```typescript
// ❌ Altibase - 시퀀스 사용
const idResult = await conn.query<{ NEXTVAL: number }>(
  'SELECT SEQ_NODE_ID.NEXTVAL AS NEXTVAL FROM DUAL'
);
const newId = idResult[0].NEXTVAL;

await conn.query(sql, [newId, data.name, data.host, ...]);

// ✅ MySQL - AUTO_INCREMENT 사용
const sql = `
  INSERT INTO NODES (NAME, HOST, PORT, STATUS, DESCRIPTION)
  VALUES (?, ?, ?, 'healthy', ?)
`;

const [result] = await conn.execute(sql, [data.name, data.host, data.port, data.description]);
const newId = result.insertId;  // 자동 생성된 ID
```

### B. Row 타입 변경

```typescript
// ❌ Altibase - 컬럼명 대문자
interface NodeRow {
  ID: number;
  NAME: string;
  HOST: string;
  ...
}

// ✅ MySQL - 컬럼명 소문자 (기본값)
interface NodeRow {
  id: number;
  name: string;
  host: string;
  ...
}

// 또는 MySQL 쿼리 시 AS로 대문자 지정 가능
SELECT ID as ID, NAME as NAME, ...
```

### C. rowToNode 메서드 수정

```typescript
// ❌ Altibase
private rowToNode(row: NodeRow): Node {
  return {
    id: row.ID,  // 대문자
    name: row.NAME,
    ...
  };
}

// ✅ MySQL
private rowToNode(row: NodeRow): Node {
  return {
    id: row.id,  // 소문자
    name: row.name,
    ...
  };
}
```

### D. 날짜 변환

```typescript
// ❌ Altibase
createdAt: row.CREATED_AT.toISOString(),

// ✅ MySQL - 이미 Date 객체이거나 문자열
createdAt: row.created_at instanceof Date 
  ? row.created_at.toISOString() 
  : new Date(row.created_at).toISOString(),
```

### E. UPDATE 시 UPDATED_AT

```typescript
// ❌ Altibase - 수동으로 SYSDATE 설정
updateFields.push('UPDATED_AT = SYSDATE');

// ✅ MySQL - AUTO UPDATE가 설정되어 있으면 생략 가능
// 또는 명시적으로
updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');
```

---

## 5. 환경변수 수정

**파일: `.env.local`**

```env
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

## 6. Service Initializer 수정

**파일: `src/services/serviceInitializer.ts`**

```typescript
// ❌ 제거
import { AltibaseNodeRepository } from '@/repositories/AltibaseNodeRepository';

// ✅ 추가
import { MySQLNodeRepository } from '@/repositories/MySQLNodeRepository';

function createNodeRepository(): INodeRepository {
  switch (DATABASE_TYPE.toLowerCase()) {
    case 'mysql':
      return new MySQLNodeRepository();
    
    case 'altibase':
      return new AltibaseNodeRepository();
    
    default:
      return new MySQLNodeRepository();  // 기본값 변경
  }
}
```

---

## 7. 샘플 데이터 입력 SQL 수정

**파일: `database/insert_sample_data.sql`**

### A. 시퀀스 제거

```sql
-- ❌ 제거
INSERT INTO NODES (ID, NAME, HOST, PORT, ...)
VALUES (SEQ_NODE_ID.NEXTVAL, 'Web Server 1', ...);

-- ✅ ID 컬럼 제거 (AUTO_INCREMENT)
INSERT INTO NODES (NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES ('Web Server 1', '192.168.1.10', 8080, 'healthy', 'Primary web server', NOW(), NOW());
```

### B. SYSDATE → NOW()

```sql
-- ❌ Altibase
CREATED_AT, UPDATED_AT) VALUES (..., SYSDATE, SYSDATE);

-- ✅ MySQL
CREATED_AT, UPDATED_AT) VALUES (..., NOW(), NOW());
```

### C. CHAR(1) 값 변경 (BOOLEAN 사용 시)

```sql
-- ❌ Altibase
ENABLED = 'Y'

-- ✅ MySQL (BOOLEAN 사용 시)
ENABLED = TRUE

-- ✅ MySQL (CHAR 유지 시)
ENABLED = 'Y'
```

---

## 8. 트랜잭션 처리 변경

**파일: `src/lib/mysql.ts`**

```typescript
// ❌ ODBC 트랜잭션
const connection = await this.pool.connect();
await connection.beginTransaction();
// ... 작업
await connection.commit();

// ✅ MySQL 트랜잭션
const connection = await this.pool.getConnection();
await connection.beginTransaction();
try {
  // ... 작업
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();  // 연결 반환
}
```

---

## 9. 테스트 연결 쿼리 변경

```typescript
// ❌ Altibase
await this.query('SELECT 1 FROM DUAL');

// ✅ MySQL
await this.query('SELECT 1');
```

---

## 10. 데이터 타입 매핑

| Altibase | MySQL |
|----------|-------|
| INTEGER | INT |
| VARCHAR(n) | VARCHAR(n) |
| DATE | DATETIME |
| CHAR(1) | CHAR(1) 또는 BOOLEAN |
| SYSDATE | CURRENT_TIMESTAMP / NOW() |
| SEQUENCE.NEXTVAL | AUTO_INCREMENT |

---

## 빠른 변경 요약

### 핵심 변경사항 5가지

1. **패키지**: `odbc` → `mysql2`
2. **연결**: ODBC 연결 문자열 → MySQL 연결 옵션
3. **ID 생성**: 시퀀스 → AUTO_INCREMENT
4. **날짜**: DATE/SYSDATE → DATETIME/CURRENT_TIMESTAMP
5. **컬럼명**: 대문자 → 소문자 (또는 AS로 지정)

### 변경 순서

1. `npm install mysql2`
2. `.env.local` 수정 (MySQL 설정)
3. `src/lib/altibase.ts` → `src/lib/mysql.ts` 작성
4. `database/schema.sql` 수정 (MySQL 문법)
5. `database/insert_sample_data.sql` 수정
6. `src/repositories/MySQLNodeRepository.ts` 작성
7. `src/services/serviceInitializer.ts` 수정
8. MySQL 서버에서 스키마 실행
9. 애플리케이션 재시작 및 테스트

---

## 주의사항

### MySQL 버전 확인
- **MySQL 5.7**: CHECK 제약조건 미지원 → 애플리케이션에서 검증
- **MySQL 8.0+**: CHECK 제약조건 지원

### 문자 인코딩
- 반드시 `utf8mb4` 사용 (이모지 지원)
- Collation: `utf8mb4_unicode_ci` 또는 `utf8mb4_general_ci`

### 대소문자 구분
- **Linux/Unix**: 테이블명 대소문자 구분
- **Windows**: 대소문자 구분 안 함
- 통일성을 위해 소문자 권장

---

이 가이드를 따라 수정하시면 MySQL로 완전히 전환할 수 있습니다!
