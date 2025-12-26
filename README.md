# Server Dashboard - Oracle Edition

이 프로젝트는 **Oracle Database 전용**으로 구성된 서버 모니터링 대시보드입니다.

## 🗄️ 데이터베이스

- **Oracle Database** 전용 (ALTIBASE, MySQL 지원 제거됨)
- Oracle Autonomous Database 지원 (Wallet 방식)
- 일반 Oracle Database 지원 (기본 연결 방식)

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 20 이상
- Oracle Database 또는 Oracle Autonomous Database
- Oracle Instant Client (선택사항 - 환경에 따라 필요)

### 2. Oracle Database 준비

#### Option A: Oracle Autonomous Database 사용 (권장)

1. Oracle Cloud Infrastructure (OCI) Console 접속
2. Autonomous Database 생성
3. Wallet 다운로드
4. Wallet 압축 해제

자세한 내용은 [Oracle 마이그레이션 가이드](database/ORACLE_MIGRATION_GUIDE.md)를 참조하세요.

#### Option B: 일반 Oracle Database 사용

1. Oracle Database 설치 및 실행
2. 서비스 이름 확인
3. 연결 정보 준비 (호스트, 포트, 서비스명)

### 3. 프로젝트 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# .env.local 파일 편집 (Wallet 방식)
ORACLE_WALLET_LOCATION=/path/to/wallet
ORACLE_WALLET_PASSWORD=your_wallet_password
ORACLE_CONNECTION_STRING=mydb_high
ORACLE_USER=admin
ORACLE_PASSWORD=your_db_password

# 또는 기본 연결 방식
# ORACLE_HOST=localhost
# ORACLE_PORT=1521
# ORACLE_SERVICE_NAME=ORCLPDB1
# ORACLE_USER=your_username
# ORACLE_PASSWORD=your_password
```

### 4. 데이터베이스 스키마 생성

#### SQL Developer 사용

1. SQL Developer 실행
2. Cloud Wallet으로 연결
3. `database/schema_oracle.sql` 파일 열기
4. F5 (Run Script) 실행

#### SQL*Plus 사용

```bash
# 환경변수 설정 (Wallet 경로)
export TNS_ADMIN=/path/to/wallet  # Linux/Mac
set TNS_ADMIN=C:\path\to\wallet   # Windows

# SQL*Plus 연결
sqlplus admin@mydb_high

# 스키마 실행
@database/schema_oracle.sql
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
src/
├── lib/
│   ├── oracle.ts            # Oracle 연결 관리
│   └── database.ts          # 데이터베이스 인터페이스
├── repositories/
│   ├── INodeRepository.ts   # Repository 인터페이스
│   └── AltibaseNodeRepository.ts  # Repository 구현체
├── services/
│   ├── serviceInitializer.ts  # Service 초기화
│   ├── nodeService.ts
│   ├── apiService.ts
│   └── syntheticTestService.ts
├── app/
│   └── api/
│       ├── nodes/           # Node API 엔드포인트
│       ├── apis/            # API 관리 엔드포인트
│       └── synthetic-tests/ # 합성 테스트 엔드포인트
└── _deprecated/             # 제거된 DB 드라이버
    ├── altibase.ts
    ├── mysql.ts
    └── MySQLNodeRepository.ts
```

## 🔧 주요 기능

### 노드 관리
- ✅ 노드(서버) 등록, 조회, 수정, 삭제
- ✅ 노드 상태 모니터링
- ✅ 노드 그룹 관리

### API 관리
- ✅ API 정의 및 관리
- ✅ API 파라미터 설정
- ✅ API 실행 및 테스트

### 합성 테스트
- ✅ 주기적 자동 테스트
- ✅ 응답 시간 모니터링
- ✅ 알림 임계값 설정
- ✅ 테스트 이력 조회

## 🛠️ 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Oracle Database (oracledb)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts

## 📝 환경변수

### Wallet 방식 (Autonomous Database)

```env
# Oracle Wallet 연결 정보
ORACLE_WALLET_LOCATION=/Users/username/wallet
ORACLE_WALLET_PASSWORD=your_wallet_password
ORACLE_CONNECTION_STRING=mydb_high
ORACLE_USER=admin
ORACLE_PASSWORD=your_db_password

# Next.js 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
LOG_LEVEL=debug
```

### 기본 연결 방식 (일반 Oracle DB)

```env
# Oracle 기본 연결 정보
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=ORCLPDB1
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password

# Next.js 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
LOG_LEVEL=debug
```

## 🔄 데이터베이스 전환

### Wallet 방식 → 기본 방식

```bash
# .env.local 파일 수정
# 1. ORACLE_WALLET_LOCATION 주석 처리
# 2. ORACLE_HOST, ORACLE_PORT, ORACLE_SERVICE_NAME 설정
# 3. 애플리케이션 재시작
npm run dev
```

자동으로 연결 방식이 전환됩니다.

## 🚨 문제 해결

### 1. Wallet을 찾을 수 없음
```
Error: NJS-516: path is not a directory
```

**해결**:
- `ORACLE_WALLET_LOCATION` 경로 확인
- Wallet 디렉토리에 `cwallet.sso` 파일 존재 확인

### 2. TNS 이름을 찾을 수 없음
```
ORA-12154: TNS:could not resolve the connect identifier
```

**해결**:
- `ORACLE_CONNECTION_STRING` 값이 `tnsnames.ora`에 있는지 확인
- 대소문자 확인

### 3. Oracle Client 라이브러리 없음
```
DPI-1047: Cannot locate an Oracle Client library
```

**해결**:
1. [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client/downloads.html) 다운로드 및 설치
2. 환경변수 PATH에 Instant Client 경로 추가
3. 애플리케이션 재시작

### 4. 인증 실패
```
ORA-01017: invalid username/password
```

**해결**:
- 사용자명과 비밀번호 재확인
- Autonomous DB에서 비밀번호 재설정

### 5. 연결 풀 에러
```
NJS-500: connection pool is closing
```

**해결**:
- 애플리케이션 종료 시 연결 풀 정리 코드 추가
- 프로세스 재시작

## 📦 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

## 🗑️ 제거된 기능

- ❌ ALTIBASE 지원 (제거됨)
- ❌ MySQL 지원 (제거됨)
- ❌ 데이터베이스 선택 기능 (Oracle 고정)

ALTIBASE, MySQL 관련 코드는 `src/_deprecated/` 폴더에 보관되어 있습니다.

## 📚 문서

- [Oracle 마이그레이션 가이드](database/ORACLE_MIGRATION_GUIDE.md) - 상세한 설정 가이드
- [API 문서](API_DOCUMENTATION.md) - API 엔드포인트 설명
- [스키마 문서](database/schema_oracle.sql) - 데이터베이스 스키마

## 🔗 유용한 링크

- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Oracle Autonomous Database](https://www.oracle.com/autonomous-database/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 라이센스

MIT

## 🤝 기여

기여는 언제나 환영합니다! 이슈나 PR을 자유롭게 등록해주세요.
