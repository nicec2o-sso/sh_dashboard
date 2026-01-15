/**
 * Synthetic Tests 관리 쿼리
 * 
 * 이 파일은 Synthetic Tests 관리 화면에서 사용하는 모든 SQL 쿼리를 관리합니다.
 * 합성 테스트와 테스트 실행 이력 관련 CRUD 작업을 처리합니다.
 */

import oracledb from 'oracledb';

/**
 * Synthetic Tests 목록 조회
 * 모든 합성 테스트와 연관된 API, 대상 정보를 함께 조회합니다.
 */
export const SELECT_SYNTHETIC_TESTS = `
  SELECT 
    st.SYNTHETIC_TEST_ID AS "syntheticTestId",
    st.SYNTHETIC_TEST_NAME AS "syntheticTestName",
    st.TARGET_TYPE AS "targetType",
    st.TARGET_ID AS "targetId",
    st.API_ID AS "apiId",
    st.INTERVAL_SECONDS AS "intervalSeconds",
    st.ALERT_THRESHOLD_MS AS "alertThresholdMs",
    st.TAGS AS "tags",
    st.SYNTHETIC_TEST_ENABLED AS "syntheticTestEnabled",
    st.CREATED_AT AS "createdAt",
    st.UPDATED_AT AS "updatedAt",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS "method",
    CASE 
      WHEN st.TARGET_TYPE = 'node' THEN n.NODE_NAME
      WHEN st.TARGET_TYPE = 'group' THEN ng.NODE_GROUP_NAME
      ELSE NULL
    END AS "targetName"
  FROM MT_SYNTHETIC_TESTS st
  LEFT JOIN MT_APIS a ON st.API_ID = a.API_ID
  LEFT JOIN MT_NODES n ON st.TARGET_TYPE = 'node' AND st.TARGET_ID = n.NODE_ID
  LEFT JOIN MT_NODE_GROUPS ng ON st.TARGET_TYPE = 'group' AND st.TARGET_ID = ng.NODE_GROUP_ID
  ORDER BY st.CREATED_AT DESC
`;

/**
 * 특정 Synthetic Test 상세 조회
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 조회할 테스트 ID
 */
export const SELECT_SYNTHETIC_TEST_DETAIL = `
  SELECT 
    st.SYNTHETIC_TEST_ID AS "syntheticTestId",
    st.SYNTHETIC_TEST_NAME AS "syntheticTestName",
    st.TARGET_TYPE AS "targetType",
    st.TARGET_ID AS "targetId",
    st.API_ID AS "apiId",
    st.INTERVAL_SECONDS AS "intervalSeconds",
    st.ALERT_THRESHOLD_MS AS "alertThresholdMs",
    st.TAGS AS "tags",
    st.SYNTHETIC_TEST_ENABLED AS "syntheticTestEnabled",
    st.CREATED_AT AS "createdAt",
    st.UPDATED_AT AS "updatedAt",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS"method",
    CASE 
      WHEN st.TARGET_TYPE = 'node' THEN n.NODE_NAME
      WHEN st.TARGET_TYPE = 'group' THEN ng.NODE_GROUP_NAME
      ELSE NULL
    END AS "targetName"
  FROM MT_SYNTHETIC_TESTS st
  LEFT JOIN MT_APIS a ON st.API_ID = a.API_ID
  LEFT JOIN MT_NODES n ON st.TARGET_TYPE = 'node' AND st.TARGET_ID = n.NODE_ID
  LEFT JOIN MT_NODE_GROUPS ng ON st.TARGET_TYPE = 'group' AND st.TARGET_ID = ng.NODE_GROUP_ID
  WHERE st.SYNTHETIC_TEST_ID = :syntheticTestId
`;

/**
 * Synthetic Test 생성 (RETURNING INTO 사용)
 * 새로운 합성 테스트를 생성하고 생성된 ID를 반환합니다.
 * 
 * 파라미터:
 * - :name (VARCHAR2): 테스트 이름
 * - :targetType (VARCHAR2): 대상 타입 (node, group)
 * - :targetId (NUMBER): 대상 ID
 * - :apiId (NUMBER): API ID
 * - :intervalSeconds (NUMBER): 실행 주기 (초)
 * - :alertThresholdMs (NUMBER): 알림 임계값 (밀리초)
 * - :enabled (CHAR): 활성화 여부 (Y, N)
 * 
 * 반환값:
 * - :id (NUMBER): 생성된 테스트 ID
 */
export const INSERT_SYNTHETIC_TEST = `
  INSERT INTO MT_SYNTHETIC_TESTS (
    SYNTHETIC_TEST_ID,
    SYNTHETIC_TEST_NAME,
    TARGET_TYPE,
    TARGET_ID,
    API_ID,
    INTERVAL_SECONDS,
    ALERT_THRESHOLD_MS,
    TAGS,
    SYNTHETIC_TEST_ENABLED,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_SYNTHETIC_TEST_ID.NEXTVAL,
    :syntheticTestName,
    :targetType,
    :targetId,
    :apiId,
    :intervalSeconds,
    :alertThresholdMs,
    :tags,
    :syntheticTestEnabled,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
  RETURNING SYNTHETIC_TEST_ID INTO :id
`;

/**
 * OUT 바인드 정의: Synthetic Test 생성
 */
export const INSERT_SYNTHETIC_TEST_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * Synthetic Test 수정 (RETURNING INTO 사용)
 * 기존 합성 테스트 정보를 수정하고 수정된 ID를 반환합니다.
 * 
 * 파라미터:
 * - :id (NUMBER): 수정할 테스트 ID
 * - :name (VARCHAR2): 새 테스트 이름
 * - :targetType (VARCHAR2): 새 대상 타입
 * - :targetId (NUMBER): 새 대상 ID
 * - :apiId (NUMBER): 새 API ID
 * - :intervalSeconds (NUMBER): 새 실행 주기
 * - :alertThresholdMs (NUMBER): 새 알림 임계값
 * - :enabled (CHAR): 새 활성화 여부
 * 
 * 반환값:
 * - :updatedId (NUMBER): 수정된 테스트 ID
 */
export const UPDATE_SYNTHETIC_TEST = `
  UPDATE MT_SYNTHETIC_TESTS
  SET 
    SYNTHETIC_TEST_NAME = :syntheticTestName,
    TARGET_TYPE = :targetType,
    TARGET_ID = :targetId,
    API_ID = :apiId,
    INTERVAL_SECONDS = :intervalSeconds,
    ALERT_THRESHOLD_MS = :alertThresholdMs,
    TAGS = :tags,
    SYNTHETIC_TEST_ENABLED = :syntheticTestEnabled,
    UPDATED_AT = SYSTIMESTAMP
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId
  RETURNING SYNTHETIC_TEST_ID INTO :id
`;

/**
 * OUT 바인드 정의: Synthetic Test 수정
 */
export const UPDATE_SYNTHETIC_TEST_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * Synthetic Test 삭제
 * CASCADE 제약조건으로 인해 MT_SYNTHETIC_TEST_HISTORY도 자동 삭제됩니다.
 * 
 * 파라미터:
 * - :id (NUMBER): 삭제할 테스트 ID
 */
export const DELETE_SYNTHETIC_TEST = `
  DELETE FROM MT_SYNTHETIC_TESTS
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId
`;

/**
 * Synthetic Test 활성화/비활성화
 * 
 * 파라미터:
 * - :id (NUMBER): 테스트 ID
 * - :enabled (CHAR): 활성화 여부 (Y, N)
 */
export const UPDATE_SYNTHETIC_TEST_ENABLED = `
  UPDATE MT_SYNTHETIC_TESTS
  SET 
    SYNTHETIC_TEST_ENABLED = :syntheticTestEnabled,
    UPDATED_AT = SYSTIMESTAMP
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId
`;

/**
 * Synthetic Test 실행 이력 저장 (RETURNING INTO 사용)
 * 테스트 실행 결과를 저장하고 생성된 이력 ID를 반환합니다.
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID (수동 테스트는 NULL)
 * - :nodeId (NUMBER): 실행된 노드 ID
 * - :statusCode (NUMBER): HTTP 응답 상태 코드
 * - :success (CHAR): 성공 여부 (Y, N)
 * - :responseTimeMs (NUMBER): 응답 시간 (밀리초)
 * - :input (VARCHAR2): 입력 데이터 (JSON)
 * - :output (VARCHAR2): 출력 데이터 (JSON)
 * 
 * 반환값:
 * - :id (NUMBER): 생성된 이력 ID
 */
export const INSERT_TEST_HISTORY = `
  INSERT INTO MT_SYNTHETIC_TEST_HISTORY (
    SYNTHETIC_TEST_HISTORY_ID,
    SYNTHETIC_TEST_ID,
    NODE_ID,
    STATUS_CODE,
    SUCCESS,
    RESPONSE_TIME_MS,
    EXECUTED_AT,
    INPUT,
    OUTPUT
  ) VALUES (
    SEQ_MT_TEST_HISTORY_ID.NEXTVAL,
    :syntheticTestId,
    :nodeId,
    :statusCode,
    :success,
    :responseTimeMs,
    SYSTIMESTAMP,
    :input,
    :output
  )
  RETURNING SYNTHETIC_TEST_HISTORY_ID INTO :id
`;

/**
 * OUT 바인드 정의: 테스트 이력 저장
 */
export const INSERT_TEST_HISTORY_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * 특정 테스트의 실행 이력 조회
 * 최근 실행 이력부터 조회합니다.
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID
 * - :limit (NUMBER, 선택): 조회할 최대 개수 (기본값: 100)
 */
export const SELECT_TEST_HISTORY = `
  SELECT 
    h.SYNTHETIC_TEST_HISTORY_ID AS "syntheticTestHistoryId",
    h.SYNTHETIC_TEST_ID AS "syntheticTestId",
    h.NODE_ID AS "nodeId",
    h.STATUS_CODE AS "statusCode",
    h.SUCCESS AS "success",
    h.RESPONSE_TIME_MS AS "responseTimeMs",
    h.EXECUTED_AT AS "executedAt",
    h.INPUT AS "input",
    h.OUTPUT AS "output",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port"
  FROM MT_SYNTHETIC_TEST_HISTORY h
  LEFT JOIN MT_NODES n ON h.NODE_ID = n.NODE_ID
  WHERE h.SYNTHETIC_TEST_ID = :syntheticTestId
  ORDER BY h.EXECUTED_AT DESC
  FETCH FIRST :limit ROWS ONLY
`;

/**
 * 특정 노드의 테스트 이력 조회
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 노드 ID
 * - :limit (NUMBER, 선택): 조회할 최대 개수
 */
export const SELECT_NODE_TEST_HISTORY = `
  SELECT 
    h.SYNTHETIC_TEST_HISTORY_ID AS "syntheticTestHistoryId",
    h.SYNTHETIC_TEST_ID AS "syntheticTestId",
    h.NODE_ID AS "nodeId",
    h.STATUS_CODE AS "statusCode",
    h.SUCCESS AS "success",
    h.RESPONSE_TIME_MS AS "responseTimeMs",
    h.EXECUTED_AT AS "executedAt",
    h.INPUT AS "input",
    h.OUTPUT AS "output"
    st.SYNTHETIC_TEST_NAME AS "syntheticTestName",
    a.API_NAME AS "apiName",
    a.URI AS "uri"
  FROM MT_SYNTHETIC_TEST_HISTORY h
  LEFT JOIN MT_SYNTHETIC_TESTS st ON h.SYNTHETIC_TEST_ID = st.SYNTHETIC_TEST_ID
  LEFT JOIN MT_APIS a ON st.API_ID = a.API_ID
  WHERE h.NODE_ID = :nodeId
  ORDER BY h.EXECUTED_AT DESC
  FETCH FIRST :limit ROWS ONLY
`;

/**
 * 모든 테스트 이력 조회
 */
export const SELECT_ALL_TEST_HISTORY = `
  SELECT 
    h.SYNTHETIC_TEST_HISTORY_ID AS "syntheticTestHistoryId",
    h.SYNTHETIC_TEST_ID AS "syntheticTestId",
    h.NODE_ID AS "nodeId",
    h.STATUS_CODE AS "statusCode",
    h.SUCCESS AS "success",
    h.RESPONSE_TIME_MS AS "responseTimeMs",
    h.EXECUTED_AT AS "executedAt",
    h.INPUT AS "input",
    h.OUTPUT AS "output"
  FROM MT_SYNTHETIC_TEST_HISTORY h
  ORDER BY h.EXECUTED_AT DESC
`;

/**
 * 특정 테스트의 이력 조회 (필터 옵션 포함)
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID
 * - :nodeId (NUMBER, 선택): 노드 ID
 * - :startDate (TIMESTAMP, 선택): 시작 일시
 * - :endDate (TIMESTAMP, 선택): 종료 일시
 * - :limit (NUMBER, 선택): 조회할 최대 개수
 */
export const SELECT_TEST_HISTORY_WITH_FILTERS = `
  SELECT 
    h.SYNTHETIC_TEST_HISTORY_ID AS "syntheticTestHistoryId",
    h.SYNTHETIC_TEST_ID AS "syntheticTestId",
    h.NODE_ID AS "nodeId",
    h.STATUS_CODE AS "statusCode",
    h.SUCCESS AS "success",
    h.RESPONSE_TIME_MS AS "responseTimeMs",
    h.EXECUTED_AT AS "executedAt",
    h.INPUT AS "input",
    h.OUTPUT AS "output"
  FROM MT_SYNTHETIC_TEST_HISTORY h
  WHERE h.SYNTHETIC_TEST_ID = :syntheticTestId
    AND (:nodeId IS NULL OR h.NODE_ID = :nodeId)
    AND (:startDate IS NULL OR h.EXECUTED_AT >= :startDate)
    AND (:endDate IS NULL OR h.EXECUTED_AT <= :endDate)
  ORDER BY h.EXECUTED_AT DESC
  FETCH FIRST :limit ROWS ONLY
`;

/**
 * 특정 이력 삭제
 * 
 * 파라미터:
 * - :syntheticTestHistoryId (NUMBER): 삭제할 이력 ID
 */
export const DELETE_TEST_HISTORY = `
  DELETE FROM MT_SYNTHETIC_TEST_HISTORY
  WHERE SYNTHETIC_TEST_HISTORY_ID = :syntheticTestHistoryId
`;

/**
 * 특정 테스트의 모든 이력 삭제
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID
 */
export const DELETE_TEST_HISTORIES_BY_TEST_ID = `
  DELETE FROM MT_SYNTHETIC_TEST_HISTORY
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId
`;

/**
 * 테스트 이력 통계 조회
 * 특정 기간 동안의 성공률, 평균 응답시간 등을 조회합니다.
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID
 * - :startDate (TIMESTAMP): 시작 일시
 * - :endDate (TIMESTAMP): 종료 일시
 */
export const SELECT_TEST_HISTORY_STATS = `
  SELECT 
    COUNT(*) AS "totalCount",
    SUM(CASE WHEN SUCCESS = 'Y' THEN 1 ELSE 0 END) AS "successCount",
    SUM(CASE WHEN SUCCESS = 'N' THEN 1 ELSE 0 END) AS "failureCount",
    ROUND(AVG(RESPONSE_TIME_MS), 2) AS "avgResponseTime",
    MIN(RESPONSE_TIME_MS) AS "minResponseTime",
    MAX(RESPONSE_TIME_MS) AS "maxResponseTime"
  FROM MT_SYNTHETIC_TEST_HISTORY
  WHERE TEST_ID = :syntheticTestId
  AND EXECUTED_AT BETWEEN :startDate AND :endDate
`;

/**
 * Synthetic Test 이름 중복 확인
 * 
 * 파라미터:
 * - :syntheticTestName (VARCHAR2): 확인할 테스트 이름
 * - :excludeId (NUMBER, 선택): 제외할 테스트 ID (수정 시 자신 제외)
 */
export const CHECK_SYNTHETIC_TEST_NAME_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM MT_SYNTHETIC_TESTS
  WHERE SYNTHETIC_TEST_NAME = :syntheticTestName
  AND (:excludeId IS NULL OR SYNTHETIC_TEST_ID != :excludeId)
`;

/**
 * 오래된 테스트 이력 삭제 (데이터 정리용)
 * 
 * 파라미터:
 * - :retentionDays (NUMBER): 보관 기간 (일)
 */
export const DELETE_OLD_TEST_HISTORY = `
  DELETE FROM MT_SYNTHETIC_TEST_HISTORY
  WHERE EXECUTED_AT < SYSTIMESTAMP - :retentionDays
`;

/**
 * 알럿 목록 조회 (임계값 초과 테스트만)
 * 시간 범위 내에 실행된 히스토리 중 responseTimeMs가 alertThresholdMs를 초과한 건들만 조회
 * 
 * 파라미터:
 * - :startDate (TIMESTAMP): 시작 일시
 * - :limit (NUMBER, 선택): 조회할 최대 개수 (기본값: 100)
 */
export const SELECT_ALERTS = `
  SELECT 
    st.SYNTHETIC_TEST_ID AS "testId",
    st.SYNTHETIC_TEST_NAME AS "testName",
    h.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    st.API_ID AS "apiId",
    a.API_NAME AS "apiName",
    a.URI AS "apiUri",
    a.METHOD AS "apiMethod",
    h.RESPONSE_TIME_MS AS "responseTime",
    st.ALERT_THRESHOLD_MS AS "threshold",
    h.EXECUTED_AT AS "timestamp",
    h.STATUS_CODE AS "statusCode",
    h.INPUT AS "input"
  FROM MT_SYNTHETIC_TEST_HISTORY h
  INNER JOIN MT_SYNTHETIC_TESTS st ON h.SYNTHETIC_TEST_ID = st.SYNTHETIC_TEST_ID
  INNER JOIN MT_NODES n ON h.NODE_ID = n.NODE_ID
  INNER JOIN MT_APIS a ON st.API_ID = a.API_ID
  WHERE h.EXECUTED_AT >= :startDate
    AND h.RESPONSE_TIME_MS > st.ALERT_THRESHOLD_MS
    AND h.STATUS_CODE != '200'
  ORDER BY h.EXECUTED_AT DESC
  FETCH FIRST :limit ROWS ONLY
`;
