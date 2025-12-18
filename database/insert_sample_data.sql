/**
 * Altibase 샘플 데이터 입력 스크립트
 * 
 * 이 파일은 개발 및 테스트를 위한 샘플 데이터를 데이터베이스에 입력합니다.
 * schema.sql을 먼저 실행한 후 이 스크립트를 실행하세요.
 * 
 * 포함된 샘플 데이터:
 * 1. 노드 (5개)
 * 2. 노드 그룹 (3개)
 * 3. 노드 그룹 멤버십
 * 4. API (3개)
 * 5. API 파라미터
 * 6. 합성 테스트 (3개)
 * 7. 테스트 이력 (샘플)
 * 
 * 실행 방법:
 * 1. Altibase iSQL 접속: isql -s localhost -u sys -p manager
 * 2. 스크립트 실행: @/path/to/insert_sample_data.sql
 */

-- ============================================================================
-- 1. 노드 (NODES) 샘플 데이터
-- ============================================================================

-- 웹 서버 1
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_ID.NEXTVAL,
  'Web Server 1',
  '192.168.1.10',
  8080,
  'healthy',
  'Primary web server',
  SYSDATE,
  SYSDATE
);

-- 웹 서버 2
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_ID.NEXTVAL,
  'Web Server 2',
  '192.168.1.11',
  8080,
  'warning',
  'Secondary web server',
  SYSDATE,
  SYSDATE
);

-- 데이터베이스 서버
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_ID.NEXTVAL,
  'DB Server',
  '192.11.33.4',
  5432,
  'error',
  'PostgreSQL database server',
  SYSDATE,
  SYSDATE
);

-- 캐시 서버
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_ID.NEXTVAL,
  'Cache Server',
  '194.168.1.5',
  6379,
  'healthy',
  'Redis cache server',
  SYSDATE,
  SYSDATE
);

-- API 서버
INSERT INTO NODES (ID, NAME, HOST, PORT, STATUS, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_ID.NEXTVAL,
  'API Server',
  '10.2.14.111',
  3000,
  'healthy',
  'Backend API server',
  SYSDATE,
  SYSDATE
);

-- 확인
SELECT '✅ 노드 5개 입력 완료' AS STATUS FROM DUAL;
SELECT ID, NAME, HOST, PORT, STATUS FROM NODES ORDER BY ID;

-- ============================================================================
-- 2. 노드 그룹 (NODE_GROUPS) 샘플 데이터
-- ============================================================================

-- 웹 클러스터 그룹
INSERT INTO NODE_GROUPS (ID, NAME, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_GROUP_ID.NEXTVAL,
  'Web Cluster',
  'All web servers',
  SYSDATE,
  SYSDATE
);

-- 백엔드 서비스 그룹
INSERT INTO NODE_GROUPS (ID, NAME, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_GROUP_ID.NEXTVAL,
  'Backend Services',
  'Database and cache servers',
  SYSDATE,
  SYSDATE
);

-- 헬스 체크 그룹
INSERT INTO NODE_GROUPS (ID, NAME, DESCRIPTION, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_NODE_GROUP_ID.NEXTVAL,
  'Health Check',
  'Nodes for synthetic testing',
  SYSDATE,
  SYSDATE
);

-- 확인
SELECT '✅ 노드 그룹 3개 입력 완료' AS STATUS FROM DUAL;
SELECT ID, NAME, DESCRIPTION FROM NODE_GROUPS ORDER BY ID;

-- ============================================================================
-- 3. 노드 그룹 멤버십 (NODE_GROUP_MEMBERS) 샘플 데이터
-- ============================================================================

-- Web Cluster (그룹 1): Web Server 1, 2
INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (1, 1, SYSDATE);

INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (1, 2, SYSDATE);

-- Backend Services (그룹 2): DB Server, Cache Server
INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (2, 3, SYSDATE);

INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (2, 4, SYSDATE);

-- Health Check (그룹 3): Web Server 1, 2, DB Server
INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (3, 1, SYSDATE);

INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (3, 2, SYSDATE);

INSERT INTO NODE_GROUP_MEMBERS (GROUP_ID, NODE_ID, CREATED_AT)
VALUES (3, 3, SYSDATE);

-- 확인
SELECT '✅ 노드 그룹 멤버십 7개 입력 완료' AS STATUS FROM DUAL;

SELECT 
  NG.NAME AS GROUP_NAME,
  N.NAME AS NODE_NAME,
  N.HOST,
  N.PORT
FROM NODE_GROUP_MEMBERS NGM
JOIN NODE_GROUPS NG ON NGM.GROUP_ID = NG.ID
JOIN NODES N ON NGM.NODE_ID = N.ID
ORDER BY NG.ID, N.ID;

-- ============================================================================
-- 4. API (APIS) 샘플 데이터
-- ============================================================================

-- User List API
INSERT INTO APIS (ID, NAME, URI, METHOD, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_API_ID.NEXTVAL,
  'User List API',
  '/api/users',
  'GET',
  SYSDATE,
  SYSDATE
);

-- Database Query API
INSERT INTO APIS (ID, NAME, URI, METHOD, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_API_ID.NEXTVAL,
  'Database Query API',
  '/api/query',
  'POST',
  SYSDATE,
  SYSDATE
);

-- Healthcheck API
INSERT INTO APIS (ID, NAME, URI, METHOD, CREATED_AT, UPDATED_AT)
VALUES (
  SEQ_API_ID.NEXTVAL,
  'Healthcheck',
  '/api/health',
  'GET',
  SYSDATE,
  SYSDATE
);

-- 확인
SELECT '✅ API 3개 입력 완료' AS STATUS FROM DUAL;
SELECT ID, NAME, URI, METHOD FROM APIS ORDER BY ID;

-- ============================================================================
-- 5. API 파라미터 (API_PARAMETERS) 샘플 데이터
-- ============================================================================

-- User List API (API ID: 1) 파라미터
INSERT INTO API_PARAMETERS (ID, API_ID, NAME, TYPE, REQUIRED, DESCRIPTION, CREATED_AT)
VALUES (
  SEQ_API_PARAMETER_ID.NEXTVAL,
  1,
  'userId',
  'query',
  'N',
  'Filter by user ID',
  SYSDATE
);

INSERT INTO API_PARAMETERS (ID, API_ID, NAME, TYPE, REQUIRED, DESCRIPTION, CREATED_AT)
VALUES (
  SEQ_API_PARAMETER_ID.NEXTVAL,
  1,
  'includeDetails',
  'query',
  'N',
  'Include detailed user information',
  SYSDATE
);

-- Database Query API (API ID: 2) 파라미터
INSERT INTO API_PARAMETERS (ID, API_ID, NAME, TYPE, REQUIRED, DESCRIPTION, CREATED_AT)
VALUES (
  SEQ_API_PARAMETER_ID.NEXTVAL,
  2,
  'query',
  'body',
  'Y',
  'SQL query to execute',
  SYSDATE
);

INSERT INTO API_PARAMETERS (ID, API_ID, NAME, TYPE, REQUIRED, DESCRIPTION, CREATED_AT)
VALUES (
  SEQ_API_PARAMETER_ID.NEXTVAL,
  2,
  'database',
  'body',
  'Y',
  'Target database name',
  SYSDATE
);

INSERT INTO API_PARAMETERS (ID, API_ID, NAME, TYPE, REQUIRED, DESCRIPTION, CREATED_AT)
VALUES (
  SEQ_API_PARAMETER_ID.NEXTVAL,
  2,
  'timeout',
  'body',
  'N',
  'Query timeout in seconds',
  SYSDATE
);

-- Healthcheck API (API ID: 3)는 파라미터 없음

-- 확인
SELECT '✅ API 파라미터 5개 입력 완료' AS STATUS FROM DUAL;

SELECT 
  A.NAME AS API_NAME,
  AP.NAME AS PARAM_NAME,
  AP.TYPE,
  AP.REQUIRED,
  AP.DESCRIPTION
FROM API_PARAMETERS AP
JOIN APIS A ON AP.API_ID = A.ID
ORDER BY A.ID, AP.ID;

-- ============================================================================
-- 6. 합성 테스트 (SYNTHETIC_TESTS) 샘플 데이터
-- ============================================================================

-- Web Health Monitor (단일 노드 대상)
INSERT INTO SYNTHETIC_TESTS (
  ID, NAME, TARGET_TYPE, TARGET_ID, API_ID,
  INTERVAL_SECONDS, ALERT_THRESHOLD_MS, TAGS, ENABLED,
  CREATED_AT, UPDATED_AT
)
VALUES (
  SEQ_SYNTHETIC_TEST_ID.NEXTVAL,
  'Web Health Monitor',
  'node',
  1,  -- Web Server 1
  1,  -- User List API
  60,
  1000,
  'production,critical',
  'Y',
  SYSDATE,
  SYSDATE
);

-- DB Performance Test (그룹 대상)
INSERT INTO SYNTHETIC_TESTS (
  ID, NAME, TARGET_TYPE, TARGET_ID, API_ID,
  INTERVAL_SECONDS, ALERT_THRESHOLD_MS, TAGS, ENABLED,
  CREATED_AT, UPDATED_AT
)
VALUES (
  SEQ_SYNTHETIC_TEST_ID.NEXTVAL,
  'DB Performance',
  'group',
  3,  -- Health Check 그룹
  2,  -- Database Query API
  300,
  2000,
  'database,performance,production',
  'Y',
  SYSDATE,
  SYSDATE
);

-- Healthcheck Test
INSERT INTO SYNTHETIC_TESTS (
  ID, NAME, TARGET_TYPE, TARGET_ID, API_ID,
  INTERVAL_SECONDS, ALERT_THRESHOLD_MS, TAGS, ENABLED,
  CREATED_AT, UPDATED_AT
)
VALUES (
  SEQ_SYNTHETIC_TEST_ID.NEXTVAL,
  'Healthcheck Test',
  'node',
  5,  -- API Server
  3,  -- Healthcheck API
  30,
  500,
  'monitoring,api',
  'Y',
  SYSDATE,
  SYSDATE
);

-- 확인
SELECT '✅ 합성 테스트 3개 입력 완료' AS STATUS FROM DUAL;

SELECT 
  ST.ID,
  ST.NAME,
  ST.TARGET_TYPE,
  ST.TARGET_ID,
  A.NAME AS API_NAME,
  ST.INTERVAL_SECONDS,
  ST.ENABLED
FROM SYNTHETIC_TESTS ST
JOIN APIS A ON ST.API_ID = A.ID
ORDER BY ST.ID;

-- ============================================================================
-- 7. 테스트 이력 (SYNTHETIC_TEST_HISTORY) 샘플 데이터
-- ============================================================================

-- 최근 24시간 동안의 샘플 이력 생성
-- 실제 환경에서는 테스트 실행 시 자동으로 생성됨

-- Web Health Monitor 이력 (테스트 ID: 1, 노드 ID: 1)
INSERT INTO SYNTHETIC_TEST_HISTORY (
  ID, TEST_ID, NODE_ID, STATUS_CODE, SUCCESS,
  RESPONSE_TIME_MS, EXECUTED_AT, INPUT, OUTPUT
)
VALUES (
  SEQ_TEST_HISTORY_ID.NEXTVAL,
  1,
  1,
  200,
  'Y',
  85,
  SYSDATE - 1/24,  -- 1시간 전
  '{"userId":"123"}',
  '{"status":"ok","count":10}'
);

INSERT INTO SYNTHETIC_TEST_HISTORY (
  ID, TEST_ID, NODE_ID, STATUS_CODE, SUCCESS,
  RESPONSE_TIME_MS, EXECUTED_AT, INPUT, OUTPUT
)
VALUES (
  SEQ_TEST_HISTORY_ID.NEXTVAL,
  1,
  1,
  200,
  'Y',
  92,
  SYSDATE - 2/24,  -- 2시간 전
  '{"userId":"123"}',
  '{"status":"ok","count":12}'
);

-- DB Performance 이력 (테스트 ID: 2, 여러 노드)
INSERT INTO SYNTHETIC_TEST_HISTORY (
  ID, TEST_ID, NODE_ID, STATUS_CODE, SUCCESS,
  RESPONSE_TIME_MS, EXECUTED_AT, INPUT, OUTPUT
)
VALUES (
  SEQ_TEST_HISTORY_ID.NEXTVAL,
  2,
  1,
  200,
  'Y',
  150,
  SYSDATE - 3/24,  -- 3시간 전
  '{"query":"SELECT * FROM users","database":"main"}',
  '{"rows":100,"time":150}'
);

INSERT INTO SYNTHETIC_TEST_HISTORY (
  ID, TEST_ID, NODE_ID, STATUS_CODE, SUCCESS,
  RESPONSE_TIME_MS, EXECUTED_AT, INPUT, OUTPUT, ERROR_MESSAGE
)
VALUES (
  SEQ_TEST_HISTORY_ID.NEXTVAL,
  2,
  3,
  500,
  'N',
  2500,
  SYSDATE - 4/24,  -- 4시간 전
  '{"query":"SELECT * FROM users","database":"main"}',
  NULL,
  'Connection timeout'
);

-- Healthcheck 이력 (테스트 ID: 3, 노드 ID: 5)
INSERT INTO SYNTHETIC_TEST_HISTORY (
  ID, TEST_ID, NODE_ID, STATUS_CODE, SUCCESS,
  RESPONSE_TIME_MS, EXECUTED_AT, INPUT, OUTPUT
)
VALUES (
  SEQ_TEST_HISTORY_ID.NEXTVAL,
  3,
  5,
  200,
  'Y',
  45,
  SYSDATE - 5/24,  -- 5시간 전
  '{}',
  '{"status":"healthy","uptime":3600}'
);

-- 확인
SELECT '✅ 테스트 이력 5개 입력 완료' AS STATUS FROM DUAL;

SELECT 
  STH.ID,
  ST.NAME AS TEST_NAME,
  N.NAME AS NODE_NAME,
  STH.STATUS_CODE,
  STH.SUCCESS,
  STH.RESPONSE_TIME_MS,
  TO_CHAR(STH.EXECUTED_AT, 'YYYY-MM-DD HH24:MI:SS') AS EXECUTED_AT
FROM SYNTHETIC_TEST_HISTORY STH
JOIN SYNTHETIC_TESTS ST ON STH.TEST_ID = ST.ID
JOIN NODES N ON STH.NODE_ID = N.ID
ORDER BY STH.EXECUTED_AT DESC;

-- ============================================================================
-- 최종 확인 및 통계
-- ============================================================================

SELECT '========================================' AS SEPARATOR FROM DUAL;
SELECT '샘플 데이터 입력 완료!' AS STATUS FROM DUAL;
SELECT '========================================' AS SEPARATOR FROM DUAL;

-- 테이블별 데이터 카운트
SELECT 'NODES' AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM NODES
UNION ALL
SELECT 'NODE_GROUPS', COUNT(*) FROM NODE_GROUPS
UNION ALL
SELECT 'NODE_GROUP_MEMBERS', COUNT(*) FROM NODE_GROUP_MEMBERS
UNION ALL
SELECT 'APIS', COUNT(*) FROM APIS
UNION ALL
SELECT 'API_PARAMETERS', COUNT(*) FROM API_PARAMETERS
UNION ALL
SELECT 'SYNTHETIC_TESTS', COUNT(*) FROM SYNTHETIC_TESTS
UNION ALL
SELECT 'SYNTHETIC_TEST_HISTORY', COUNT(*) FROM SYNTHETIC_TEST_HISTORY;

-- 커밋
COMMIT;

SELECT '✅ 모든 데이터 커밋 완료' AS STATUS FROM DUAL;
