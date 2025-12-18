# 데이터베이스 스위치 사용 가이드 🔄

## 📋 개요

이 프로젝트는 **환경변수 하나로 MySQL과 Altibase를 자유롭게 전환**할 수 있습니다.

```env
# .env.local
USE_DATABASE=mysql      # MySQL 사용
# 또는
USE_DATABASE=altibase   # Altibase 사용
```

---

## 🎯 지원하는 데이터베이스

| 데이터베이스 | 환경변수 값 | 포트 | 권장 사용 |
|------------|-----------|------|----------|
| **MySQL** | `mysql` | 3306 | ✅ 개발/프로덕션 (권장) |
| **Altibase** | `altibase` | 20300 | ✅ 엔터프라이즈 환경 |

---

## 🚀 빠른 시작

### MySQL 사용하기

#### 1단계: 환경변수 설정
```bash
# .env.local 파일 생성
cat > .env.local << EOF
USE_DATABASE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=mydb
EOF
```

#### 2단계: MySQL 데이터베이스 준비
```bash
# MySQL 서버 시작 (예시)
# Windows: MySQL Workbench 또는 서비스에서 시작
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql

# 스키마 생성
mysql -u root -p < database/schema_mysql.sql

# 샘플 데이터 입력 (선택사항)
mysql -u root -p mydb < database/insert_sample_data_mysql.sql
```

#### 3단계: 애플리케이션 실행
```bash
npm run dev
```

#### 로그 확인
```
[DatabaseManager] 🗄️  Selected database: MYSQL
[DatabaseManager] Initializing MYSQL connection...
[MySQL] Configuration loaded: localhost:3306
[MySQL] Initializing connection pool...
[MySQL] Connection pool initialized successfully
[MySQL] Connection test successful
[DatabaseManager] ✅ MYSQL connection initialized successfully
═══════════════════════════════════════════════════════
[ServiceInitializer] 🎯 Database Type: MYSQL
[ServiceInitializer] 🏗️  Creating Node Repository for: MYSQL
[ServiceInitializer] ✅ Using MySQLNodeRepository
[ServiceInitializer] ✅ Services initialized successfully
═══════════════════════════════════════════════════════
```

---

### Altibase 사용하기

#### 1단계: 환경변수 설정
```bash
# .env.local 파일 수정
cat > .env.local << EOF
USE_DATABASE=altibase
ALTIBASE_HOST=localhost
ALTIBASE_PORT=20300
ALTIBASE_USER=sys
ALTIBASE_PASSWORD=manager
ALTIBASE_DATABASE=mydb
EOF
```

#### 2단계: Altibase 데이터베이스 준비
```bash
# Altibase 서버 시작
server start

# 스키마 생성
isql -s localhost -u sys -p manager -f database/schema.sql

# 샘플 데이터 입력 (선택사항)
isql -s localhost -u sys -p manager -f database/insert_sample_data.sql
```

#### 3단계: 애플리케이션 실행
```bash
npm run dev
```

#### 로그 확인
```
[DatabaseManager] 🗄️  Selected database: ALTIBASE
[DatabaseManager] Initializing ALTIBASE connection...
[Altibase] Configuration loaded: localhost:20300
[Altibase] Initializing connection pool...
[Altibase] Connection pool initialized successfully
[Altibase] Connection test successful
[DatabaseManager] ✅ ALTIBASE connection initialized successfully
═══════════════════════════════════════════════════════
[ServiceInitializer] 🎯 Database Type: ALTIBASE
[ServiceInitializer] 🏗️  Creating Node Repository for: ALTIBASE
[ServiceInitializer] ✅ Using AltibaseNodeRepository
[ServiceInitializer] ✅ Services initialized successfully
═══════════════════════════════════════════════════════
```

---

## 🔄 데이터베이스 전환하기

### MySQL → Altibase 전환

```bash
# 1. 애플리케이션 종료
# Ctrl+C

# 2. 환경변수 변경
# .env.local 파일에서 USE_DATABASE=altibase로 변경

# 3. Altibase 데이터베이스 준비 (최초 1회)
isql -s localhost -u sys -p manager -f database/schema.sql

# 4. 애플리케이션 재시작
npm run dev
```

### Altibase → MySQL 전환

```bash
# 1. 애플리케이션 종료
# Ctrl+C

# 2. 환경변수 변경
# .env.local 파일에서 USE_DATABASE=mysql로 변경

# 3. MySQL 데이터베이스 준비 (최초 1회)
mysql -u root -p < database/schema_mysql.sql

# 4. 애플리케이션 재시작
npm run dev
```

---

## 📊 아키텍처

### 계층 구조

```
┌─────────────────────────────────────────────────────┐
│              API Routes (Next.js)                   │
├─────────────────────────────────────────────────────┤
│              Services (비즈니스 로직)                 │
├─────────────────────────────────────────────────────┤
│          Service Initializer (스위치)               │
│         ┌─────────────┬─────────────┐               │
│         │   MySQL     │  Altibase   │               │
│         │ Repository  │ Repository  │               │
│         └─────────────┴─────────────┘               │
├─────────────────────────────────────────────────────┤
│           Database Manager (통합)                   │
│         ┌─────────────┬─────────────┐               │
│         │   MySQL     │  Altibase   │               │
│         │ Connection  │ Connection  │               │
│         └─────────────┴─────────────┘               │
├─────────────────────────────────────────────────────┤
│              실제 데이터베이스                        │
│         ┌─────────────┬─────────────┐               │
│         │    MySQL    │  Altibase   │               │
│         │   Server    │   Server    │               │
│         └─────────────┴─────────────┘               │
└─────────────────────────────────────────────────────┘
```

### 핵심 파일

| 파일 | 역할 | 설명 |
|------|------|------|
| `src/lib/database.ts` | **스위치** | 환경변수에 따라 DB 선택 |
| `src/lib/mysql.ts` | MySQL 연결 | MySQL 연결 관리 |
| `src/lib/altibase.ts` | Altibase 연결 | Altibase 연결 관리 |
| `src/repositories/MySQLNodeRepository.ts` | MySQL Repository | MySQL 데이터 액세스 |
| `src/repositories/AltibaseNodeRepository.ts` | Altibase Repository | Altibase 데이터 액세스 |
| `src/services/serviceInitializer.ts` | Service 초기화 | Repository 선택 및 주입 |

---

## 🔍 작동 원리

### 1. 환경변수 읽기
```typescript
// src/lib/database.ts
const dbType = process.env.USE_DATABASE || 'mysql';
```

### 2. 데이터베이스 인스턴스 선택
```typescript
// src/lib/database.ts
this.dbInstance = this.dbType === 'altibase' ? altibaseDb : mysqlDb;
```

### 3. Repository 선택
```typescript
// src/services/serviceInitializer.ts
function createNodeRepository(): INodeRepository {
  switch (DATABASE_TYPE) {
    case 'mysql':
      return new MySQLNodeRepository();
    case 'altibase':
      return new AltibaseNodeRepository();
  }
}
```

### 4. Service 사용
```typescript
// src/app/api/nodes/route.ts
import { nodeService } from '@/services/serviceInitializer';

// 자동으로 올바른 Repository 사용
const nodes = await nodeService.getAllNodes();
```

---

## 💡 특징

### 1. 투명성 (Transparency)
- **API 코드 수정 불필요**: 환경변수만 변경하면 됨
- **비즈니스 로직 불변**: Service 레이어는 DB와 무관

### 2. 타입 안전성
- **동일한 인터페이스**: INodeRepository
- **TypeScript 지원**: 컴파일 타임 검증

### 3. 확장성
- **새 DB 추가 용이**: PostgreSQL, MongoDB 등 쉽게 추가 가능
- **Repository 패턴**: 표준 인터페이스 준수

---

## 📝 API 응답에 DB 정보 포함

모든 API 응답에 현재 사용 중인 데이터베이스 정보가 포함됩니다:

```json
{
  "success": true,
  "database": "mysql",  // 또는 "altibase"
  "data": [...]
}
```

이를 통해 프론트엔드에서 현재 어떤 DB를 사용 중인지 확인할 수 있습니다.

---

## ⚠️ 주의사항

### 1. 스키마 호환성
- MySQL과 Altibase는 **별도의 스키마 파일** 사용
- 전환 전 해당 DB의 스키마가 생성되어 있어야 함

### 2. 데이터 마이그레이션
- DB 전환 시 **데이터는 자동으로 이전되지 않음**
- 필요 시 별도의 마이그레이션 스크립트 작성 필요

### 3. 트랜잭션
- 두 DB 간 트랜잭션은 **독립적**
- 동시에 사용 불가 (하나만 선택)

---

## 🧪 테스트

### 현재 DB 확인
```typescript
import { getDatabaseType, isMySQL, isAltibase } from '@/lib/database';

console.log('Current DB:', getDatabaseType());
console.log('Is MySQL?', isMySQL());
console.log('Is Altibase?', isAltibase());
```

### API 테스트
```bash
# 노드 조회 (응답에 database 필드 확인)
curl http://localhost:3000/api/nodes

# 응답:
# {
#   "success": true,
#   "database": "mysql",
#   "data": [...]
# }
```

---

## 🔧 문제 해결

### 문제 1: "Connection failed"
**원인**: 선택한 DB 서버가 실행 중이지 않음

**해결**:
```bash
# MySQL 확인
mysql -u root -p -e "SELECT 1"

# Altibase 확인
isql -s localhost -u sys -p manager -c "SELECT 1 FROM DUAL"
```

### 문제 2: "Table not found"
**원인**: 스키마가 생성되지 않음

**해결**:
```bash
# MySQL
mysql -u root -p < database/schema_mysql.sql

# Altibase
isql -s localhost -u sys -p manager -f database/schema.sql
```

### 문제 3: 환경변수가 반영되지 않음
**원인**: 서버 재시작이 필요함

**해결**:
```bash
# 개발 서버 재시작
# Ctrl+C 후
npm run dev
```

---

## 📚 추가 리소스

- **MySQL 가이드**: `database/MYSQL_MIGRATION_GUIDE.md`
- **Altibase 가이드**: `database/MIGRATION_GUIDE.md`
- **변환 체크리스트**: `database/MYSQL_CONVERSION_CHECKLIST.md`

---

## ✅ 체크리스트

데이터베이스 전환 완료 확인:

### MySQL 사용 시
- [ ] .env.local에 `USE_DATABASE=mysql` 설정
- [ ] MySQL 서버 실행 중
- [ ] schema_mysql.sql 실행 완료
- [ ] MYSQL_* 환경변수 모두 설정
- [ ] npm run dev 정상 실행
- [ ] 로그에 "Selected database: MYSQL" 표시
- [ ] API 테스트 성공

### Altibase 사용 시
- [ ] .env.local에 `USE_DATABASE=altibase` 설정
- [ ] Altibase 서버 실행 중
- [ ] schema.sql 실행 완료
- [ ] ALTIBASE_* 환경변수 모두 설정
- [ ] npm run dev 정상 실행
- [ ] 로그에 "Selected database: ALTIBASE" 표시
- [ ] API 테스트 성공

---

## 🎉 완료!

환경변수 하나로 MySQL과 Altibase를 자유롭게 전환할 수 있습니다! 🚀
