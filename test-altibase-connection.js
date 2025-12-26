/**
 * Altibase 연결 테스트 스크립트
 * 
 * 이 스크립트는 Altibase 데이터베이스 연결을 독립적으로 테스트합니다.
 * Next.js 애플리케이션을 실행하기 전에 연결 문제를 진단하는 데 사용하세요.
 * 
 * 사용법:
 * node test-altibase-connection.js
 */

const odbc = require('odbc');
require('dotenv').config({ path: '.env.local' });

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(colors.green, '✓', message);
}

function logError(message) {
  log(colors.red, '✗', message);
}

function logInfo(message) {
  log(colors.blue, 'ℹ', message);
}

function logWarning(message) {
  log(colors.yellow, '⚠', message);
}

async function testAltibaseConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('  Altibase Connection Test');
  console.log('='.repeat(60) + '\n');

  // 1. 환경 변수 확인
  logInfo('Step 1: Checking environment variables...');
  
  const config = {
    host: process.env.ALTIBASE_HOST || 'localhost',
    port: process.env.ALTIBASE_PORT || '20300',
    user: process.env.ALTIBASE_USER || 'sys',
    password: process.env.ALTIBASE_PASSWORD || 'manager',
    database: process.env.ALTIBASE_DATABASE || 'mydb',
  };

  console.log('  Configuration:');
  console.log(`    Host:     ${config.host}`);
  console.log(`    Port:     ${config.port}`);
  console.log(`    User:     ${config.user}`);
  console.log(`    Password: ${'*'.repeat(config.password.length)}`);
  console.log(`    Database: ${config.database}`);
  console.log();

  if (!process.env.ALTIBASE_HOST) {
    logWarning('ALTIBASE_HOST not set, using default: localhost');
  }
  if (!process.env.ALTIBASE_USER) {
    logWarning('ALTIBASE_USER not set, using default: sys');
  }
  if (!process.env.ALTIBASE_PASSWORD) {
    logWarning('ALTIBASE_PASSWORD not set, using default: manager');
  }

  // 2. 연결 문자열 생성
  logInfo('Step 2: Building connection string...');
  
  // DSN 없는 방식 (권장)
  const connectionString = 
    `DRIVER={Altibase};` +
    `SERVER=${config.host};` +
    `PORT=${config.port};` +
    `USER=${config.user};` +
    `PASSWORD=${config.password};` +
    `NLS_USE=UTF8;` +
    `LongDataCompat=yes`;

  const maskedConnectionString = connectionString.replace(
    /PASSWORD=[^;]+/,
    'PASSWORD=***'
  );
  console.log(`  Connection string: ${maskedConnectionString}`);
  console.log();

  // 3. ODBC 드라이버 확인
  logInfo('Step 3: Checking ODBC drivers...');
  try {
    // ODBC 드라이버 목록 조회는 일부 시스템에서 지원되지 않을 수 있음
    logInfo('Attempting to list installed ODBC drivers...');
    // 이 부분은 시스템에 따라 작동하지 않을 수 있음
  } catch (error) {
    logWarning('Could not list ODBC drivers (this is normal on some systems)');
  }
  console.log();

  // 4. 연결 테스트
  logInfo('Step 4: Testing database connection...');
  let pool = null;
  
  try {
    console.log('  Attempting to create connection pool...');
    pool = await odbc.pool({
      connectionString: connectionString,
      connectionTimeout: 10,
      loginTimeout: 10,
    });
    
    logSuccess('Connection pool created successfully!');
    console.log();

    // 5. 쿼리 실행 테스트
    logInfo('Step 5: Testing query execution...');
    
    console.log('  Executing: SELECT 1 FROM DUAL');
    const result = await pool.query('SELECT 1 FROM DUAL');
    logSuccess('Query executed successfully!');
    console.log('  Result:', JSON.stringify(result, null, 2));
    console.log();

    // 6. 시스템 정보 조회
    logInfo('Step 6: Fetching database information...');
    
    try {
      const versionResult = await pool.query("SELECT PRODUCT_VERSION FROM V$VERSION WHERE PRODUCT_NAME = 'Altibase'");
      if (versionResult && versionResult.length > 0) {
        logSuccess(`Altibase version: ${versionResult[0].PRODUCT_VERSION}`);
      }
    } catch (error) {
      logWarning('Could not fetch database version (this is not critical)');
    }
    console.log();

    // 7. 연결 풀 종료
    logInfo('Step 7: Closing connection pool...');
    await pool.close();
    logSuccess('Connection pool closed successfully!');
    console.log();

    // 최종 성공 메시지
    console.log('='.repeat(60));
    logSuccess('ALL TESTS PASSED! Altibase connection is working properly.');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);

  } catch (error) {
    console.log();
    console.log('='.repeat(60));
    logError('CONNECTION TEST FAILED!');
    console.log('='.repeat(60) + '\n');
    
    logError('Error details:');
    console.log('  Name:    ', error.name);
    console.log('  Message: ', error.message);
    
    if (error.odbcErrors) {
      console.log('  ODBC Errors:', JSON.stringify(error.odbcErrors, null, 2));
    }
    
    if (error.stack) {
      console.log('\n  Stack trace:');
      console.log(error.stack);
    }
    
    console.log('\n' + '='.repeat(60));
    logInfo('Troubleshooting suggestions:');
    console.log('='.repeat(60));
    
    const suggestions = [
      '1. Verify Altibase server is running:',
      '   - Run: server status',
      '   - Or: netstat -ano | findstr :20300',
      '',
      '2. Check ODBC driver installation:',
      '   - Ensure Altibase ODBC driver is installed',
      '   - Check ALTIBASE_HOME environment variable',
      '   - Verify PATH includes %ALTIBASE_HOME%\\bin',
      '',
      '3. Verify connection credentials:',
      '   - Check .env.local file',
      '   - Try connecting with isql: isql -s localhost -u sys -p manager',
      '',
      '4. Check firewall settings:',
      '   - Ensure port 20300 is not blocked',
      '   - Try using 127.0.0.1 instead of localhost',
      '',
      '5. Review detailed troubleshooting guide:',
      '   - See ALTIBASE_CONNECTION_TROUBLESHOOTING.md',
    ];
    
    suggestions.forEach(s => console.log(`  ${s}`));
    console.log();
    
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
    
    process.exit(1);
  }
}

// 스크립트 실행
console.log();
logInfo('Starting Altibase connection test...');
console.log();

testAltibaseConnection().catch(error => {
  logError('Unexpected error:');
  console.error(error);
  process.exit(1);
});
