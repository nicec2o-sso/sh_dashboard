# Oracle 연결 자동 초기화 - 근본적인 해결

## 📋 문제점

```
Error: [Oracle] Connection pool not initialized. Call initialize() first.
```

이 에러는 다음과 같은 상황에서 발생했습니다:
- API 라우트에서 `db.query()` 호출
- 하지만 연결 풀이 초기화되지 않음
- `ensureDatabaseInitialized()` 호출을 누락하거나 타이밍 이슈

## ✅ 근본적인 해결 방법

### 핵심 개념: **자동 초기화 (Auto-Initialization)**

모든 쿼리 실행 메서드(`query`, `execute`, `transaction`, `executeReturning`)가 실행되기 **전에 자동으로** 연결 풀을 초기화합니다.

### 구현 방식

#### 1. 자동 초기화 메커니즘

```typescript
class OracleConnection {
  private pool: oracledb.Pool | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  // 모든 쿼리 실행 전에 자동 호출
  private async ensureInitialized(): Promise<void> {
    if (this.pool) {
      return; // 이미 초기화됨 ✅
    }

    if (this.isInitializing) {
      // 다른 요청이 초기화 중이면 대기
      await this.initPromise;
      return;
    }

    // 초기화 시작
    this.isInitializing = true;
    this.initPromise = this.doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  public async query<T>(sql: string, params?: any): Promise<T[]> {
    await this.ensureInitialized(); // 👈 자동 초기화!
    
    // 이제 pool이 확실히 초기화되어 있음
    const connection = await this.pool!.getConnection();
    // ... 쿼리 실행
  }
}
```

#### 2. 중복 초기화 방지

**시나리오**: 10개의 API 요청이 동시에 들어옴

```
Request 1: ensureInitialized() → 초기화 시작 ⏳
Request 2: ensureInitialized() → Request 1 대기 ⏸
Request 3: ensureInitialized() → Request 1 대기 ⏸
...
Request 1: 초기화 완료! ✅
Request 2~10: 초기화된 pool 사용 ✅
```

**핵심 로직**:
```typescript
if (this.isInitializing) {
  // 다른 요청이 초기화 중
  await this.initPromise; // 완료될 때까지 대기
  return; // 초기화 완료, pool 사용 가능
}
```

#### 3. 모든 메서드에 적용

```typescript
// ✅ 자동 초기화 적용
public async query(...) {
  await this.ensureInitialized();
  // ...
}

public async execute(...) {
  await this.ensureInitialized();
  // ...
}

public async transaction(...) {
  await this.ensureInitialized();
  // ...
}

public async executeReturning(...) {
  await this.ensureInitialized();
  // ...
}
```

## 🎯 사용 방법

### 이전 (수동 초기화 필요)

```typescript
// ❌ 잘못된 예
export async function GET(request: NextRequest) {
  // initialize() 호출 안 함
  const nodes = await db.query(SELECT_NODES); // 에러 발생! ❌
}

// ✅ 올바른 예 (하지만 번거로움)
export async function GET(request: NextRequest) {
  await ensureDatabaseInitialized(); // 매번 호출 필요
  const nodes = await db.query(SELECT_NODES);
}
```

### 현재 (자동 초기화)

```typescript
// ✅ 초기화 호출 없이도 작동!
export async function GET(request: NextRequest) {
  const nodes = await db.query(SELECT_NODES); // 자동 초기화! ✅
  return NextResponse.json({ data: nodes });
}

// ✅ ensureDatabaseInitialized() 호출해도 됨 (선택사항)
export async function GET(request: NextRequest) {
  await ensureDatabaseInitialized(); // 내부적으로 자동 초기화만 수행
  const nodes = await db.query(SELECT_NODES);
  return NextResponse.json({ data: nodes });
}
```

## 🔍 작동 흐름

### 시나리오 1: 첫 번째 API 요청

```
1. 클라이언트 → GET /api/nodes
2. route.ts: db.query(SELECT_NODES) 호출
3. ensureInitialized() 자동 호출
   ├─ pool이 null? YES
   ├─ isInitializing? NO
   └─ 초기화 시작 ⏳
4. doInitialize() 실행
   ├─ oracledb.createPool() 생성
   ├─ 연결 테스트
   └─ pool 초기화 완료 ✅
5. 쿼리 실행
6. 결과 반환
```

### 시나리오 2: 두 번째 API 요청 (이미 초기화됨)

```
1. 클라이언트 → GET /api/apis
2. route.ts: db.query(SELECT_APIS) 호출
3. ensureInitialized() 자동 호출
   ├─ pool이 null? NO ✅
   └─ 즉시 반환 (0.001ms)
4. 쿼리 실행
5. 결과 반환
```

### 시나리오 3: 동시에 10개 요청

```
1. 10개 요청 동시 도착
2. Request 1: ensureInitialized()
   ├─ pool이 null? YES
   ├─ isInitializing = true
   └─ 초기화 시작 ⏳
3. Request 2-10: ensureInitialized()
   ├─ pool이 null? YES
   ├─ isInitializing? YES (Request 1이 초기화 중)
   └─ initPromise 대기 ⏸
4. Request 1: 초기화 완료 ✅
5. Request 2-10: 대기 해제, pool 사용 ✅
6. 모든 요청 정상 처리
```

## 📊 성능 비교

### 초기화 오버헤드

| 상황 | 오버헤드 | 설명 |
|-----|---------|------|
| 첫 요청 | ~200-500ms | 연결 풀 생성 + 테스트 |
| 두 번째 이후 | ~0.001ms | pool 존재 확인만 |
| 동시 요청 | 첫 요청만 | 나머지는 대기 후 사용 |

### 메모리 사용

- **연결 풀**: 최소 2개, 최대 10개 연결 유지
- **싱글톤**: 전체 애플리케이션에서 하나의 pool만 사용
- **효율적**: 사용하지 않는 연결은 60초 후 자동 해제

## 🛡️ 에러 처리

### 초기화 실패

```typescript
try {
  const nodes = await db.query(SELECT_NODES);
} catch (error) {
  // 초기화 실패 또는 쿼리 실패
  console.error('Database error:', error);
}
```

초기화 실패 시:
- `pool`은 `null`로 유지
- 다음 요청에서 재시도 가능
- 명확한 에러 메시지 출력

### 연결 실패

```typescript
private async doInitialize(): Promise<void> {
  try {
    this.pool = await oracledb.createPool(poolConfig);
    await this.query('SELECT 1 FROM DUAL'); // 연결 테스트
    console.log('[Oracle] ✅ Connection pool initialized successfully');
  } catch (error) {
    this.pool = null; // 실패 시 null로 초기화
    console.error('[Oracle] ❌ Failed to initialize:', error);
    throw error;
  }
}
```

## 🎁 추가 기능

### 1. 연결 테스트

초기화 시 자동으로 연결 테스트:
```typescript
await this.query('SELECT 1 AS num FROM DUAL');
console.log('[Oracle] ✅ Connection test passed');
```

### 2. 상태 확인

```typescript
const status = db.getPoolStatus();
console.log('Pool statistics:', status);
```

### 3. 명시적 초기화 (선택사항)

```typescript
// 앱 시작 시 미리 초기화하고 싶다면
await db.initialize();
```

## 🔧 설정

### 연결 풀 설정

```typescript
poolConfig = {
  poolMin: 2,        // 최소 연결 수
  poolMax: 10,       // 최대 연결 수
  poolIncrement: 1,  // 증가 단위
  poolTimeout: 60,   // 타임아웃 (초)
};
```

### 환경 변수

**Wallet 방식** (Autonomous Database):
```env
ORACLE_WALLET_LOCATION=/path/to/wallet
ORACLE_WALLET_PASSWORD=password
ORACLE_CONNECTION_STRING=mydb_high
ORACLE_USER=ADMIN
ORACLE_PASSWORD=password
```

**기본 방식**:
```env
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USER=system
ORACLE_PASSWORD=password
```

## ✅ 장점

### 1. 개발자 경험 향상
- ❌ 더 이상 `ensureDatabaseInitialized()` 호출 불필요
- ✅ `db.query()` 바로 사용 가능
- ✅ 코드가 간결해짐

### 2. 에러 방지
- ❌ "Connection pool not initialized" 에러 근절
- ✅ 어떤 API에서든 안전하게 DB 접근
- ✅ 초기화 타이밍 이슈 해결

### 3. 성능 최적화
- ✅ 중복 초기화 방지
- ✅ 연결 풀 재사용
- ✅ 최소한의 오버헤드

### 4. 확장성
- ✅ 동시 요청 처리 안정적
- ✅ 새로운 API 추가 시 걱정 없음
- ✅ 유지보수 용이

## 📝 요약

| 항목 | 이전 | 현재 |
|-----|------|------|
| 초기화 방식 | 수동 (`ensureDatabaseInitialized()`) | 자동 (첫 쿼리 시) |
| 코드 복잡도 | 높음 (매번 호출 필요) | 낮음 (신경 쓸 필요 없음) |
| 에러 발생 가능성 | 높음 (호출 누락 시) | 없음 (자동 처리) |
| 동시 요청 처리 | 문제 가능성 있음 | 안전함 (중복 방지) |
| 성능 | 동일 | 동일 (오버헤드 무시 가능) |

## 🎯 결론

**더 이상 연결 초기화를 신경 쓸 필요가 없습니다!**

```typescript
// 그냥 이렇게만 쓰면 됩니다 ✅
export async function GET() {
  const data = await db.query('SELECT * FROM TABLE');
  return NextResponse.json({ data });
}
```

자동 초기화가 모든 것을 처리합니다! 🎉
