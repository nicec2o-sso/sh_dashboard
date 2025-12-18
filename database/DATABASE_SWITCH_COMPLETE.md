# 데이터베이스 스위치 기능 완성 보고서 ✅

## 🎯 완성된 기능

**환경변수 하나로 MySQL과 Altibase를 자유롭게 전환**할 수 있습니다!

```env
# .env.local
USE_DATABASE=mysql      # MySQL 사용 ✅
# 또는
USE_DATABASE=altibase   # Altibase 사용 ✅
```

---

## 📦 생성/수정된 파일 목록

### 🆕 새로 생성된 파일 (6개)

| 파일 | 역할 | 라인 수 |
|------|------|---------|
| `src/lib/database.ts` | **핵심 스위치** - DB 자동 선택 | 150줄 |
| `src/lib/mysql.ts` | MySQL 연결 관리 | 250줄 |
| `src/repositories/MySQLNodeRepository.ts` | MySQL Repository 구현 | 350줄 |
| `src/app/api/nodes/route.example.ts` | 통합 DB 사용 예시 | 120줄 |
| `database/schema_mysql.sql` | MySQL 스키마 | 500줄 |
| `database/DATABASE_SWITCH_GUIDE.md` | 스위치 사용 가이드 | 600줄 |

### 🔧 수정된 파일 (2개)

| 파일 | 변경 내용 |
|------|----------|
| `src/services/serviceInitializer.ts` | MySQL/Altibase Repository 자동 선택 |
| `.env.example` | 통합 환경변수 템플릿 |

---

## 🏗️ 아키텍처

### 스위치 메커니즘

```
환경변수 (USE_DATABASE)
    ↓
Database Manager (src/lib/database.ts)
    ↓
┌─────────────┬─────────────┐
│   MySQL     │  Altibase   │
│ Connection  │ Connection  │
└─────────────┴─────────────┘
    ↓               ↓
┌─────────────┬─────────────┐
│   MySQL     │  Altibase   │
│ Repository  │ Repository  │
└─────────────┴─────────────┘
    ↓               ↓
    Service Layer (통합)
    ↓
    API Routes
```

---

## 🚀 사용 방법

### MySQL 사용

```bash
# 1. 환경변수 설정
echo "USE_DATABASE=mysql" > .env.local
echo "MYSQL_HOST=localhost" >> .env.local
echo "MYSQL_PORT=3306" >> .env.local
echo "MYSQL_USER=root" >> .env.local
echo "MYSQL_PASSWORD=password" >> .env.local
echo "MYSQL_DATABASE=mydb" >> .env.local

# 2. 스키마 생성
mysql -u root -p < database/schema_mysql.sql

# 3. 실행
npm run dev

# 로그 확인:
# [DatabaseManager] 🗄️  Selected database: MYSQL
# [ServiceInitializer] ✅ Using MySQLNodeRepository
```

### Altibase 사용

```bash
# 1. 환경변수 설정
echo "USE_DATABASE=altibase" > .env.local
echo "ALTIBASE_HOST=localhost" >> .env.local
echo "ALTIBASE_PORT=20300" >> .env.local
echo "ALTIBASE_USER=sys" >> .env.local
echo "ALTIBASE_PASSWORD=manager" >> .env.local
echo "ALTIBASE_DATABASE=mydb" >> .env.local

# 2. 스키마 생성
isql -s localhost -u sys -p manager -f database/schema.sql

# 3. 실행
npm run dev

# 로그 확인:
# [DatabaseManager] 🗄️  Selected database: ALTIBASE
# [ServiceInitializer] ✅ Using AltibaseNodeRepository
```

---

## 💡 핵심 코드

### 1. Database Manager (스위치)

```typescript
// src/lib/database.ts
class DatabaseManager {
  constructor() {
    // 환경변수에서 DB 타입 읽기
    const envDbType = process.env.USE_DATABASE?.toLowerCase() || 'mysql';
    
    // MySQL 또는 Altibase 인스턴스 선택
    this.dbInstance = this.dbType === 'altibase' ? altibaseDb : mysqlDb;
    
    console.log(`🗄️  Selected database: ${this.dbType.toUpperCase()}`);
  }
}

export const db = DatabaseManager.getInstance();
```

### 2. Service Initializer (Repository 선택)

```typescript
// src/services/serviceInitializer.ts
function createNodeRepository(): INodeRepository {
  switch (DATABASE_TYPE) {
    case 'mysql':
      return new MySQLNodeRepository();    // MySQL 사용
    case 'altibase':
      return new AltibaseNodeRepository(); // Altibase 사용
  }
}

export const nodeService = new NodeService(createNodeRepository());
```

### 3. API Route (투명한 사용)

```typescript
// src/app/api/nodes/route.ts
import { nodeService } from '@/services/serviceInitializer';

export async function GET() {
  // 자동으로 올바른 DB 사용 (MySQL 또는 Altibase)
  const nodes = await nodeService.getAllNodes();
  
  return NextResponse.json({
    success: true,
    database: DATABASE_TYPE,  // 현재 DB 표시
    data: nodes
  });
}
```

---

## 🎨 주요 특징

### 1. ✅ 완전 투명성 (Transparency)
- **API 코드 수정 불필요**
- **Service 코드 수정 불필요**
- **환경변수만 변경**하면 자동 전환

### 2. ✅ 타입 안전성 (Type Safety)
- 동일한 `INodeRepository` 인터페이스
- TypeScript 컴파일 타임 검증
- 에러 사전 방지

### 3. ✅ 확장성 (Scalability)
- **PostgreSQL 추가 예시:**
  ```typescript
  case 'postgresql':
    return new PostgreSQLNodeRepository();
  ```
- **MongoDB 추가 예시:**
  ```typescript
  case 'mongodb':
    return new MongoDBNodeRepository();
  ```

### 4. ✅ 개발자 경험 (DX)
- 명확한 로그 메시지
- API 응답에 DB 정보 포함
- 상세한 문서화

---

## 📊 비교표

### MySQL vs Altibase

| 항목 | MySQL | Altibase |
|------|-------|----------|
| **패키지** | `mysql2` | `odbc` |
| **포트** | 3306 | 20300 |
| **ID 생성** | AUTO_INCREMENT | SEQUENCE |
| **날짜 타입** | DATETIME | DATE |
| **현재 시간** | NOW() / CURRENT_TIMESTAMP | SYSDATE |
| **컬럼명** | 소문자 (`id`, `name`) | 대문자 (`ID`, `NAME`) |
| **BOOLEAN** | TRUE/FALSE | 'Y'/'N' (CHAR) |
| **스키마 파일** | `schema_mysql.sql` | `schema.sql` |

---

## 🔄 전환 시나리오

### 시나리오 1: 개발 환경 (MySQL) → 프로덕션 (Altibase)

```bash
# 개발 (.env.local)
USE_DATABASE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306

# 프로덕션 (.env.production)
USE_DATABASE=altibase
ALTIBASE_HOST=prod-db.company.com
ALTIBASE_PORT=20300
```

**장점**: 개발은 MySQL(빠르고 쉬움), 프로덕션은 Altibase(엔터프라이즈급)

---

### 시나리오 2: 동일 코드베이스, 고객별 DB

```bash
# 고객 A (MySQL 선호)
USE_DATABASE=mysql

# 고객 B (Altibase 라이선스 보유)
USE_DATABASE=altibase
```

**장점**: 하나의 코드로 여러 고객 대응

---

### 시나리오 3: 테스트 환경 분리

```bash
# 단위 테스트 (.env.test)
USE_DATABASE=mysql  # 빠른 테스트

# 통합 테스트 (.env.integration)
USE_DATABASE=altibase  # 실제 환경과 동일
```

**장점**: 테스트 환경 유연성

---

## 🧪 테스트 방법

### 1. 현재 DB 확인

```typescript
import { getDatabaseType, isMySQL, isAltibase } from '@/lib/database';

console.log('Current DB:', getDatabaseType());
// 출력: "mysql" 또는 "altibase"

if (isMySQL()) {
  console.log('Using MySQL!');
}

if (isAltibase()) {
  console.log('Using Altibase!');
}
```

### 2. API 응답 확인

```bash
curl http://localhost:3000/api/nodes

# 응답:
{
  "success": true,
  "database": "mysql",  # ← 현재 DB 표시
  "data": [...]
}
```

### 3. 로그 확인

```
# MySQL 사용 시
[DatabaseManager] 🗄️  Selected database: MYSQL
[MySQL] Configuration loaded: localhost:3306
[ServiceInitializer] ✅ Using MySQLNodeRepository

# Altibase 사용 시
[DatabaseManager] 🗄️  Selected database: ALTIBASE
[Altibase] Configuration loaded: localhost:20300
[ServiceInitializer] ✅ Using AltibaseNodeRepository
```

---

## ⚡ 성능 비교

| 작업 | MySQL | Altibase | 비고 |
|------|-------|----------|------|
| **연결 속도** | ⚡⚡⚡ 빠름 | ⚡⚡ 보통 | TCP/IP vs ODBC |
| **쿼리 속도** | ⚡⚡⚡ 빠름 | ⚡⚡⚡ 빠름 | 비슷한 수준 |
| **트랜잭션** | ⚡⚡⚡ 빠름 | ⚡⚡⚡ 빠름 | 둘 다 우수 |
| **대용량 처리** | ⚡⚡ 보통 | ⚡⚡⚡ 우수 | Altibase 강점 |

---

## 📝 체크리스트

### MySQL 전환 시

- [ ] `npm install mysql2` 실행
- [ ] `.env.local`에 `USE_DATABASE=mysql` 설정
- [ ] MySQL 서버 실행 중
- [ ] `database/schema_mysql.sql` 실행
- [ ] MYSQL_* 환경변수 모두 설정
- [ ] `npm run dev` 실행
- [ ] 로그에 "MYSQL" 표시 확인
- [ ] API 테스트 성공

### Altibase 전환 시

- [ ] `npm install odbc` 실행 (이미 설치됨)
- [ ] `.env.local`에 `USE_DATABASE=altibase` 설정
- [ ] Altibase 서버 실행 중
- [ ] `database/schema.sql` 실행
- [ ] ALTIBASE_* 환경변수 모두 설정
- [ ] `npm run dev` 실행
- [ ] 로그에 "ALTIBASE" 표시 확인
- [ ] API 테스트 성공

---

## 🎯 다음 단계

### 현재 완성된 것
- ✅ MySQL, Altibase 스위치 기능
- ✅ NodeRepository 구현 (두 DB 모두)
- ✅ NodeService 통합
- ✅ Database Manager
- ✅ 상세한 문서

### 추가 작업 필요
- ⏳ ApiRepository (MySQL/Altibase)
- ⏳ NodeGroupRepository (MySQL/Altibase)
- ⏳ SyntheticTestRepository (MySQL/Altibase)
- ⏳ MySQL 샘플 데이터 SQL 수정

---

## 📚 문서 참조

| 문서 | 내용 |
|------|------|
| `database/DATABASE_SWITCH_GUIDE.md` | **스위치 사용 가이드** (이 파일!) |
| `database/MYSQL_MIGRATION_GUIDE.md` | MySQL 상세 가이드 |
| `database/MIGRATION_GUIDE.md` | Altibase 상세 가이드 |
| `database/MYSQL_CONVERSION_CHECKLIST.md` | 변환 체크리스트 |

---

## 🎉 완성!

환경변수 하나로 MySQL과 Altibase를 자유롭게 전환할 수 있습니다!

```bash
# MySQL 사용
echo "USE_DATABASE=mysql" > .env.local
npm run dev

# Altibase 사용
echo "USE_DATABASE=altibase" > .env.local
npm run dev
```

**코드 수정 없이 즉시 전환됩니다!** 🚀

---

## 💬 지원

문제 발생 시:
1. 로그 확인 (`npm run dev` 출력)
2. 환경변수 확인 (`.env.local`)
3. DB 서버 상태 확인
4. 스키마 생성 여부 확인
5. 문서 참조 (`database/*.md`)

Happy Coding! 🎊
