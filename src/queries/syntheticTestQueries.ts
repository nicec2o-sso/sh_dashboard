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
    st.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    st.MNG_DOM_SYNT_TEST_NM AS "syntheticTestName",
    st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM AS "targetType",
    st.SYNT_TEST_MNG_DOM_EXE_TRG_ID AS "targetId",
    st.SYNT_TEST_MNG_DOM_API_ID AS "apiId",
    st.SYNT_TEST_EXE_INTV_TIME_HMS AS "intervalSeconds",
    st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC AS "alertThresholdMs",
    st.MNG_DOM_SYNT_TEST_VTLT_YN AS "syntheticTestEnabled",
    LISTAGG(DISTINCT t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags",
    st.REG_DDTS AS "createdAt",
    st.CHG_DDTS AS "updatedAt",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS "method",
    CASE 
      WHEN st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'node' THEN n.MNG_DOM_NODE_NM
      WHEN st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'group' THEN ng.SNET_MNG_NODE_GRP_NM
      ELSE NULL
    END AS "targetName"
  FROM TWAA0009M00 st
  LEFT JOIN TWAA0007M00 a ON st.SYNT_TEST_MNG_DOM_API_ID = a.MNG_DOM_API_ID
  LEFT JOIN TWAA0001M00 n ON st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'node' AND st.SYNT_TEST_MNG_DOM_EXE_TRG_ID = n.MNG_DOM_NODE_ID
  LEFT JOIN TWAA0004M00 ng ON st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'group' AND st.SYNT_TEST_MNG_DOM_EXE_TRG_ID = ng.MNG_DOM_NODE_GRP_ID
  LEFT JOIN TWAA0010M00 stm ON st.MNG_DOM_SYNT_TEST_ID = stm.MPG_MNG_DOM_SYNT_TEST_ID
  LEFT JOIN TWAA0003M00 t ON stm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  GROUP BY st.MNG_DOM_SYNT_TEST_ID
    ,st.MNG_DOM_SYNT_TEST_NM 
    ,st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM
    ,st.SYNT_TEST_MNG_DOM_EXE_TRG_ID
    ,st.SYNT_TEST_MNG_DOM_API_ID
    ,st.SYNT_TEST_EXE_INTV_TIME_HMS
    ,st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC
    ,st.MNG_DOM_SYNT_TEST_VTLT_YN
    ,st.REG_DDTS
    ,st.CHG_DDTS
    ,a.MNG_DOM_API_NM
    ,a.MNG_DOM_API_URL
    ,a.HTTP_METHD_NM
    ,st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM
    ,n.MNG_DOM_NODE_NM
    ,ng.SNET_MNG_NODE_GRP_NM
  ORDER BY st.REG_DDTS DESC
`;

/**
 * 특정 Synthetic Test 상세 조회
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 조회할 테스트 ID
 */
export const SELECT_SYNTHETIC_TEST_DETAIL = `
  SELECT 
    st.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    st.MNG_DOM_SYNT_TEST_NM AS "syntheticTestName",
    st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM AS "targetType",
    st.SYNT_TEST_MNG_DOM_EXE_TRG_ID AS "targetId",
    st.SYNT_TEST_MNG_DOM_API_ID AS "apiId",
    st.SYNT_TEST_EXE_INTV_TIME_HMS AS "intervalSeconds",
    st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC AS "alertThresholdMs",
    st.MNG_DOM_SYNT_TEST_VTLT_YN AS "syntheticTestEnabled",
    st.REG_DDTS AS "createdAt",
    st.CHG_DDTS AS "updatedAt",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS"method",
    LISTAGG(DISTINCT t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags",
    CASE 
      WHEN st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'node' THEN n.MNG_DOM_NODE_NM
      WHEN st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'group' THEN ng.SNET_MNG_NODE_GRP_NM
      ELSE NULL
    END AS "targetName"
  FROM TWAA0009M00 st
  LEFT JOIN TWAA0007M00 a ON st.SYNT_TEST_MNG_DOM_API_ID = a.MNG_DOM_API_ID
  LEFT JOIN TWAA0001M00 n ON st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'node' AND st.SYNT_TEST_MNG_DOM_EXE_TRG_ID = n.MNG_DOM_NODE_ID
  LEFT JOIN TWAA0004M00 ng ON st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'group' AND st.SYNT_TEST_MNG_DOM_EXE_TRG_ID = ng.MNG_DOM_NODE_GRP_ID
  LEFT JOIN TWAA0010M00 stm ON st.MNG_DOM_SYNT_TEST_ID = stm.MPG_MNG_DOM_SYNT_TEST_ID
  LEFT JOIN TWAA0003M00 t ON stm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  WHERE st.MNG_DOM_SYNT_TEST_ID = :syntheticTestId
  GROUP BY st.MNG_DOM_SYNT_TEST_ID
    ,st.MNG_DOM_SYNT_TEST_NM 
    ,st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM
    ,st.SYNT_TEST_MNG_DOM_EXE_TRG_ID
    ,st.SYNT_TEST_MNG_DOM_API_ID
    ,st.SYNT_TEST_EXE_INTV_TIME_HMS
    ,st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC
    ,st.MNG_DOM_SYNT_TEST_VTLT_YN
    ,st.REG_DDTS
    ,st.CHG_DDTS
    ,a.MNG_DOM_API_NM
    ,a.MNG_DOM_API_URL
    ,a.HTTP_METHD_NM
    ,st.MNG_DOM_SYNT_TEST_TRGT_TYP_NM
    ,n.MNG_DOM_NODE_NM
    ,ng.SNET_MNG_NODE_GRP_NM
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
  INSERT INTO TWAA0009M00 (
    MNG_DOM_SYNT_TEST_ID,
    MNG_DOM_SYNT_TEST_NM,
    MNG_DOM_SYNT_TEST_TRGT_TYP_NM,
    SYNT_TEST_MNG_DOM_EXE_TRG_ID,
    SYNT_TEST_MNG_DOM_API_ID,
    SYNT_TEST_EXE_INTV_TIME_HMS,
    MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC,
    MNG_DOM_SYNT_TEST_VTLT_YN,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_SYNT_TEST_ID),0)+1 FROM TWAA0009M00),
    :syntheticTestName,
    :targetType,
    :targetId,
    :apiId,
    :intervalSeconds,
    :alertThresholdMs,
    :syntheticTestEnabled,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
  RETURNING MNG_DOM_SYNT_TEST_ID INTO :id
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
  UPDATE TWAA0009M00
  SET 
    MNG_DOM_SYNT_TEST_NM = :syntheticTestName,
    MNG_DOM_SYNT_TEST_TRGT_TYP_NM = :targetType,
    SYNT_TEST_MNG_DOM_EXE_TRG_ID = :targetId,
    SYNT_TEST_MNG_DOM_API_ID = :apiId,
    SYNT_TEST_EXE_INTV_TIME_HMS = :intervalSeconds,
    MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC = :alertThresholdMs,
    MNG_DOM_SYNT_TEST_VTLT_YN = :syntheticTestEnabled,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_SYNT_TEST_ID = :syntheticTestId
  RETURNING MNG_DOM_SYNT_TEST_ID INTO :id
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
  DELETE FROM TWAA0009M00
  WHERE MNG_DOM_SYNT_TEST_ID = :syntheticTestId
`;

/**
 * Synthetic Test 활성화/비활성화
 * 
 * 파라미터:
 * - :id (NUMBER): 테스트 ID
 * - :enabled (CHAR): 활성화 여부 (Y, N)
 */
export const UPDATE_SYNTHETIC_TEST_ENABLED = `
  UPDATE TWAA0009M00
  SET 
    MNG_DOM_SYNT_TEST_VTLT_YN = :syntheticTestEnabled,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_SYNT_TEST_ID = :syntheticTestId
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
  INSERT INTO TWAA0011H00 (
    MNG_DOM_SYNT_TEST_EXE_HIST_ID,
    MNG_DOM_SYNT_TEST_ID,
    MNG_DOM_NODE_ID,
    MNG_DOM_SYNT_TEST_HTTP_RSP_CODE,
    MNG_DOM_SYNT_TEST_SCS_YN,
    MNG_DOM_SYNT_TEST_RSP_MLSC,
    MNG_DOM_SYNT_TEST_EXE_TM,
    MNG_DOM_SYNT_TEST_INP_CNTT,
    MNG_DOM_SYNT_TEST_OPRT_CNTT,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_SYNT_TEST_EXE_HIST_ID),0)+1 FROM TWAA0011H00),
    :syntheticTestId,
    :nodeId,
    :statusCode,
    :success,
    :responseTimeMs,
    TO_CHAR(SYSDATE, 'HH24MISS'),
    :input,
    :output,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
  RETURNING MNG_DOM_SYNT_TEST_EXE_HIST_ID INTO :id
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
    h.MNG_DOM_SYNT_TEST_EXE_HIST_ID AS "syntheticTestHistoryId",
    h.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    h.MNG_DOM_NODE_ID AS "nodeId",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE AS "statusCode",
    h.MNG_DOM_SYNT_TEST_SCS_YN AS "success",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC AS "responseTimeMs",
    h.MNG_DOM_SYNT_TEST_EXE_TM AS "executedAt",
    h.MNG_DOM_SYNT_TEST_INP_CNTT AS "input",
    h.MNG_DOM_SYNT_TEST_OPRT_CNTT AS "output",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port"
  FROM TWAA0011H00 h
  LEFT JOIN TWAA0001M00 n ON h.MNG_DOM_NODE_ID = n.MNG_DOM_NODE_ID
  WHERE h.MNG_DOM_SYNT_TEST_ID = :syntheticTestId
  ORDER BY h.REG_DDTS DESC
`;
//  -- FETCH FIRST :limit ROWS ONLY

/**
 * 특정 노드의 테스트 이력 조회
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 노드 ID
 * - :limit (NUMBER, 선택): 조회할 최대 개수
 */
export const SELECT_NODE_TEST_HISTORY = `
  SELECT 
    h.MNG_DOM_SYNT_TEST_EXE_HIST_ID AS "syntheticTestHistoryId",
    h.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    h.MNG_DOM_NODE_ID AS "nodeId",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE AS "statusCode",
    h.MNG_DOM_SYNT_TEST_SCS_YN AS "success",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC AS "responseTimeMs",
    h.MNG_DOM_SYNT_TEST_EXE_TM AS "executedAt",
    h.MNG_DOM_SYNT_TEST_INP_CNTT AS "input",
    h.MNG_DOM_SYNT_TEST_OPRT_CNTT AS "output"
    st.MNG_DOM_SYNT_TEST_NM AS "syntheticTestName",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri"
  FROM TWAA0011H00 h
  LEFT JOIN TWAA0009M00 st ON h.MNG_DOM_SYNT_TEST_ID = st.MNG_DOM_SYNT_TEST_ID
  LEFT JOIN TWAA0007M00 a ON st.SYNT_TEST_MNG_DOM_API_ID = a.MNG_DOM_API_ID
  WHERE h.MNG_DOM_NODE_ID = :nodeId
  ORDER BY h.REG_DDTS DESC
  FETCH FIRST :limit ROWS ONLY
`;

/**
 * 모든 테스트 이력 조회
 */
export const SELECT_ALL_TEST_HISTORY = `
  SELECT 
    h.MNG_DOM_SYNT_TEST_EXE_HIST_ID AS "syntheticTestHistoryId",
    h.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    h.MNG_DOM_NODE_ID AS "nodeId",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE AS "statusCode",
    h.MNG_DOM_SYNT_TEST_SCS_YN AS "success",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC AS "responseTimeMs",
    h.MNG_DOM_SYNT_TEST_EXE_TM AS "executedAt",
    h.MNG_DOM_SYNT_TEST_INP_CNTT AS "input",
    h.MNG_DOM_SYNT_TEST_OPRT_CNTT AS "output"
  FROM TWAA0011H00 h
  ORDER BY h.REG_DDTS DESC
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
    h.MNG_DOM_SYNT_TEST_EXE_HIST_ID AS "syntheticTestHistoryId",
    h.MNG_DOM_SYNT_TEST_ID AS "syntheticTestId",
    h.MNG_DOM_NODE_ID AS "nodeId",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE AS "statusCode",
    h.MNG_DOM_SYNT_TEST_SCS_YN AS "success",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC AS "responseTimeMs",
    h.MNG_DOM_SYNT_TEST_EXE_TM AS "executedAt",
    h.MNG_DOM_SYNT_TEST_INP_CNTT AS "input",
    h.MNG_DOM_SYNT_TEST_OPRT_CNTT AS "output"
  FROM TWAA0011H00 h
  WHERE h.MNG_DOM_SYNT_TEST_ID = :syntheticTestId
    AND (:nodeId IS NULL OR h.MNG_DOM_NODE_ID = :nodeId)
    AND (:startDate IS NULL OR h.MNG_DOM_SYNT_TEST_EXE_TM >= :startDate)
    AND (:endDate IS NULL OR h.MNG_DOM_SYNT_TEST_EXE_TM <= :endDate)
  ORDER BY h.REG_DDTS DESC
  -- FETCH FIRST :limit ROWS ONLY
`;

/**
 * 특정 이력 삭제
 * 
 * 파라미터:
 * - :syntheticTestHistoryId (NUMBER): 삭제할 이력 ID
 */
export const DELETE_TEST_HISTORY = `
  DELETE FROM TWAA0011H00
  WHERE MNG_DOM_SYNT_TEST_EXE_HIST_ID = :syntheticTestHistoryId
`;

/**
 * 특정 테스트의 모든 이력 삭제
 * 
 * 파라미터:
 * - :syntheticTestId (NUMBER): 테스트 ID
 */
export const DELETE_TEST_HISTORIES_BY_TEST_ID = `
  DELETE FROM TWAA0011H00
  WHERE MNG_DOM_SYNT_TEST_ID = :syntheticTestId
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
    SUM(CASE WHEN MNG_DOM_SYNT_TEST_SCS_YN = 'Y' THEN 1 ELSE 0 END) AS "successCount",
    SUM(CASE WHEN MNG_DOM_SYNT_TEST_SCS_YN = 'N' THEN 1 ELSE 0 END) AS "failureCount",
    ROUND(AVG(MNG_DOM_SYNT_TEST_RSP_MLSC), 2) AS "avgResponseTime",
    MIN(MNG_DOM_SYNT_TEST_RSP_MLSC) AS "minResponseTime",
    MAX(MNG_DOM_SYNT_TEST_RSP_MLSC) AS "maxResponseTime"
  FROM TWAA0011H00
  WHERE MNG_DOM_SYNT_TEST_ID = :syntheticTestId
  AND REG_DDTS BETWEEN :startDate AND :endDate
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
  FROM TWAA0009M00
  WHERE MNG_DOM_SYNT_TEST_NM = :syntheticTestName
  AND (:excludeId IS NULL OR MNG_DOM_SYNT_TEST_ID != :excludeId)
`;

/**
 * 오래된 테스트 이력 삭제 (데이터 정리용)
 * 
 * 파라미터:
 * - :retentionDays (NUMBER): 보관 기간 (일)
 */
export const DELETE_OLD_TEST_HISTORY = `
  DELETE FROM TWAA0011H00
  WHERE REG_DDTS < SYSTIMESTAMP - :retentionDays
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
    st.MNG_DOM_SYNT_TEST_ID AS "testId",
    st.MNG_DOM_SYNT_TEST_NM AS "testName",
    h.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    st.SYNT_TEST_MNG_DOM_API_ID AS "apiId",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "apiUri",
    a.HTTP_METHD_NM AS "apiMethod",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC AS "responseTime",
    st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC AS "threshold",
    h.MNG_DOM_SYNT_TEST_EXE_TM AS "timestamp",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE AS "statusCode",
    h.MNG_DOM_SYNT_TEST_INP_CNTT AS "input"
  FROM TWAA0011H00 h
  INNER JOIN TWAA0009M00 st ON h.MNG_DOM_SYNT_TEST_ID = st.MNG_DOM_SYNT_TEST_ID
  INNER JOIN TWAA0001M00 n ON h.MNG_DOM_NODE_ID = n.MNG_DOM_NODE_ID
  INNER JOIN TWAA0007M00 a ON st.SYNT_TEST_MNG_DOM_API_ID = a.MNG_DOM_API_ID
  WHERE h.REG_DDTS >= :startDate
    AND h.MNG_DOM_SYNT_TEST_RSP_MLSC > st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC
    AND h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE != '200'
  ORDER BY h.MNG_DOM_SYNT_TEST_EXE_TM DESC
  -- FETCH FIRST :limit ROWS ONLY
`;

export const SEARCH_TEST_HISTORY = `
  SELECT 
    h.MNG_DOM_SYNT_TEST_EXE_HIST_ID as "syntheticTestHistoryId",
    h.MNG_DOM_SYNT_TEST_ID as "syntheticTestId",
    h.MNG_DOM_NODE_ID as "nodeId",
    h.MNG_DOM_SYNT_TEST_EXE_TM as "executedAt",
    h.MNG_DOM_SYNT_TEST_HTTP_RSP_CODE as "statusCode",
    h.MNG_DOM_SYNT_TEST_SCS_YN as "success",
    h.MNG_DOM_SYNT_TEST_RSP_MLSC as "responseTimeMs",
    h.MNG_DOM_SYNT_TEST_INP_CNTT as "input",
    h.MNG_DOM_SYNT_TEST_OPRT_CNTT as "output",
    st.MNG_DOM_SYNT_TEST_NM as "syntheticTestName",
    st.MNG_DOM_SYNT_TEST_ALT_CRTL_MLSC as "alertThresholdMs",
    n.MNG_DOM_NODE_NM as "nodeName",
    (
      SELECT ng.SNET_MNG_NODE_GRP_NM 
      FROM TWAA0005M00 ngm 
      JOIN TWAA0004M00 ng ON ngm.MPG_MNG_DOM_NODE_GRP_ID = ng.MNG_DOM_NODE_GRP_ID 
      WHERE ngm.MPG_MNG_DOM_NODE_ID = h.MNG_DOM_NODE_ID 
      AND ROWNUM = 1
    ) as "nodeGroupName"
  FROM TWAA0011H00 h
  LEFT JOIN TWAA0009M00 st ON h.MNG_DOM_SYNT_TEST_ID = st.MNG_DOM_SYNT_TEST_ID
  LEFT JOIN TWAA0001M00 n ON h.MNG_DOM_NODE_ID = n.MNG_DOM_NODE_ID
  WHERE 1=1
`;

export const SEARCH_TEST_HISTORY_COUNT = `
  SELECT COUNT(*) as "total"
  FROM TWAA0011H00 h
  LEFT JOIN TWAA0009M00 st ON h.MNG_DOM_SYNT_TEST_ID = st.MNG_DOM_SYNT_TEST_ID
  LEFT JOIN TWAA0001M00 n ON h.MNG_DOM_NODE_ID = n.MNG_DOM_NODE_ID
  WHERE 1=1
`;