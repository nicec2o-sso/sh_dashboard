# Altibase 연결 문제 해결 가이드

## 오류 메시지
```
[Altibase] Failed to initialize connection pool: [Error: [odbc] Error connection to the database]
```

## 원인 및 해결 방법

### 1. Altibase ODBC 드라이버 미설치
**증상:** ODBC 드라이버를 찾을 수 없다는 오류

**해결 방법:**
1. Altibase 공식 웹사이트에서 ODBC 드라이버 다운로드
2. Windows 환경 변수 설정:
   - `ALTIBASE_HOME`: Altibase 설치 디렉토리
   - `PATH`에 `%ALTIBASE_HOME%\bin` 추가
3. 재부팅 또는 터미널 재시작

**확인 방법:**
```bash
# Windows에서 등록된 ODBC 드라이버 확인
reg query "HKLM\SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers"
```

### 2. Altibase 서버가 실행되지 않음
**증상:** 연결 거부 또는 타임아웃 오류

**해결 방법:**
```bash
# Altibase 서버 상태 확인
server status

# 서버 시작
server start

# 서버 포트 확인 (기본 20300)
netstat -ano | findstr :20300
```

### 3. 방화벽/네트워크 문제
**증상:** 연결 시도는 하지만 응답이 없음

**해결 방법:**
1. Windows 방화벽에서 포트 20300 허용
2. localhost 대신 127.0.0.1 사용해보기
3. 원격 서버의 경우 해당 서버의 방화벽 설정 확인

### 4. 인증 실패
**증상:** 로그인 오류 또는 권한 거부

**해결 방법:**
1. `.env.local` 파일의 사용자명/비밀번호 확인
   ```
   ALTIBASE_USER=sys
   ALTIBASE_PASSWORD=manager
   ```
2. Altibase에서 사용자 확인:
   ```sql
   -- isql 또는 다른 클라이언트로 접속
   SELECT user_name FROM system_.sys_users_;
   ```

### 5. DSN 설정 문제
**증상:** DSN을 찾을 수 없다는 오류

**해결 방법 A - DSN 생성:**
1. "ODBC 데이터 원본 관리자(64비트)" 실행
2. 시스템 DSN 탭에서 "추가" 클릭
3. Altibase ODBC 드라이버 선택
4. 데이터 원본 이름을 "ALTIBASE"로 설정
5. 서버 정보 입력 (localhost, 20300 등)

**해결 방법 B - DSN 없이 연결 (권장):**
현재 코드는 이미 DSN 없이 직접 드라이버를 지정하도록 수정되었습니다.
```typescript
DRIVER={Altibase};SERVER=localhost;PORT=20300;USER=sys;PASSWORD=manager
```

### 6. 64비트/32비트 불일치
**증상:** 드라이버를 찾을 수 없거나 아키텍처 관련 오류

**해결 방법:**
- Node.js와 Altibase ODBC 드라이버의 비트 버전 일치 확인
- 일반적으로 64비트 버전 사용 권장
- 32비트 Node.js를 사용한다면 32비트 ODBC 드라이버 필요

## 단계별 연결 테스트

### 1단계: 환경 변수 확인
```bash
# .env.local 파일 내용 확인
cat .env.local
```

### 2단계: Altibase 서버 직접 연결 테스트
```bash
# isql로 직접 연결
isql -s localhost -u sys -p manager
```

### 3단계: ODBC 연결 테스트
```bash
# odbcinst 도구로 드라이버 확인 (Linux/Mac)
odbcinst -q -d

# Windows에서는 ODBC 데이터 원본 관리자 GUI 사용
```

### 4단계: Node.js에서 간단한 연결 테스트
```javascript
// test-connection.js
const odbc = require('odbc');

async function testConnection() {
  try {
    const connectionString = 
      'DRIVER={Altibase};' +
      'SERVER=localhost;' +
      'PORT=20300;' +
      'USER=sys;' +
      'PASSWORD=manager;' +
      'NLS_USE=UTF8';
    
    console.log('Connecting with:', connectionString.replace(/PASSWORD=[^;]+/, 'PASSWORD=***'));
    
    const pool = await odbc.pool(connectionString);
    const result = await pool.query('SELECT 1 FROM DUAL');
    
    console.log('Connection successful!');
    console.log('Result:', result);
    
    await pool.close();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
```

## 자주 발생하는 오류와 해결책

### Error: [odbc] Error connecting to the database
- **원인:** 서버가 실행되지 않았거나, 호스트/포트 정보가 잘못됨
- **해결:** 서버 상태 확인 및 연결 정보 재확인

### Error: IM002 [Microsoft][ODBC Driver Manager] Data source name not found
- **원인:** DSN이 설정되지 않았거나 이름이 다름
- **해결:** DSN 생성 또는 DSN 없는 연결 방식 사용 (현재 코드는 이미 수정됨)

### Error: 28000 [Altibase] Invalid username/password
- **원인:** 사용자명 또는 비밀번호 오류
- **해결:** `.env.local` 파일의 인증 정보 확인

### Error: HYT00 [Altibase] Connection timeout
- **원인:** 네트워크 문제, 방화벽 차단, 서버 과부하
- **해결:** 네트워크 설정 및 서버 상태 확인

## 추가 디버깅 팁

1. **상세 로그 활성화**
   - 코드의 `initialize()` 함수에서 이미 상세 로깅이 추가됨
   - 연결 문자열, 설정 정보, 에러 스택이 출력됨

2. **포트 연결 테스트**
   ```bash
   # telnet으로 포트 접근 가능 여부 확인
   telnet localhost 20300
   ```

3. **Altibase 로그 확인**
   - `$ALTIBASE_HOME/trc/altibase_boot.log`
   - 서버 측 오류 메시지 확인

4. **Node.js 버전 확인**
   ```bash
   node --version
   # odbc 패키지는 Node.js 14 이상 권장
   ```

## 문의 사항
위 방법으로 해결되지 않는 경우:
1. 정확한 에러 메시지 전체 복사
2. 실행 환경 정보 (OS, Node.js 버전, Altibase 버전)
3. `.env.local` 파일 내용 (비밀번호 제외)
4. 콘솔에 출력된 전체 로그

이 정보들과 함께 문의하시면 더 정확한 지원이 가능합니다.
