/**
 * 노드 관리 쿼리
 * 
 * 이 파일은 노드 관리에 사용하는 모든 SQL 쿼리를 관리합니다.
 */

import oracledb from 'oracledb';

/**
 * 모든 노드 조회 (태그 포함)
 */
export const SELECT_ALL_NODES_WITH_TAGS = `
  SELECT 
    n.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port",
    n.MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
   -- n.NODE_DESC AS "nodeDesc",
    n.REG_DDTS AS "createdAt",
    n.CHG_DDTS AS "updatedAt",
    LISTAGG(t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags"
  FROM TWAA0001M00 n
  LEFT JOIN TWAA0002M00 ntm ON n.MNG_DOM_NODE_ID = ntm.MPG_MNG_DOM_NODE_ID
  LEFT JOIN TWAA0003M00 t ON ntm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  GROUP BY n.MNG_DOM_NODE_ID, n.MNG_DOM_NODE_NM, n.MNG_DOM_NODE_HST_IP, n.MNG_DOM_NODE_HST_PORT_NO, n.MNG_DOM_NODE_STAT_TYP_CODE, n.REG_DDTS, n.CHG_DDTS
  ORDER BY n.REG_DDTS DESC
`;

/**
 * 모든 노드 조회
 */
export const SELECT_ALL_NODES = `
  SELECT 
    MNG_DOM_NODE_ID AS "nodeId",
    MNG_DOM_NODE_NM AS "nodeName",
    MNG_DOM_NODE_HST_IP AS "host",
    MNG_DOM_NODE_HST_PORT_NO AS "port",
    MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  NODE_DESC AS "nodeDesc",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0001M00
  ORDER BY REG_DDTS DESC
`;

/**
 * 특정 노드 조회 (태그 포함)
 */
export const SELECT_NODE_BY_ID_WITH_TAGS = `
  SELECT 
    n.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port",
    n.MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  n.NODE_DESC AS "nodeDesc",
    n.REG_DDTS AS "createdAt",
    n.CHG_DDTS AS "updatedAt",
    LISTAGG(t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags"
  FROM TWAA0001M00 n
  LEFT JOIN TWAA0002M00 ntm ON n.MNG_DOM_NODE_ID = ntm.MPG_MNG_DOM_NODE_ID
  LEFT JOIN TWAA0003M00 t ON ntm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  WHERE n.MNG_DOM_NODE_ID = :nodeId
  GROUP BY n.MNG_DOM_NODE_ID, n.MNG_DOM_NODE_NM, n.MNG_DOM_NODE_HST_IP, n.MNG_DOM_NODE_HST_PORT_NO, n.MNG_DOM_NODE_STAT_TYP_CODE, n.REG_DDTS, n.CHG_DDTS
`;

/**
 * 특정 노드 조회
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 조회할 노드 ID
 */
export const SELECT_NODE_BY_ID = `
  SELECT 
    MNG_DOM_NODE_ID AS "nodeId",
    MNG_DOM_NODE_NM AS "nodeName",
    MNG_DOM_NODE_HST_IP AS "host",
    MNG_DOM_NODE_HST_PORT_NO AS "port",
    MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  NODE_DESC AS "nodeDesc",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_ID = :nodeId
`;

/**
 * 여러 노드 ID로 조회
 * 
 * 파라미터:
 * - :nodeIds (배열): 조회할 노드 ID 배열
 */
export const SELECT_NODES_BY_IDS = `
  SELECT 
    MNG_DOM_NODE_ID AS "nodeId",
    MNG_DOM_NODE_NM AS "nodeName",
    MNG_DOM_NODE_HST_IP AS "host",
    MNG_DOM_NODE_HST_PORT_NO AS "port",
    MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  NODE_DESC AS "nodeDesc",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_ID IN (:nodeIds)
`;

/**
 * 상태별 노드 조회 (태그 포함)
 */
export const SELECT_NODES_BY_STATUS_WITH_TAGS = `
  SELECT 
    n.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port",
    n.MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  n.NODE_DESC AS "nodeDesc",
    n.REG_DDTS AS "createdAt",
    n.CHG_DDTS AS "updatedAt",
    LISTAGG(t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags"
  FROM TWAA0001M00 n
  LEFT JOIN TWAA0002M00 ntm ON n.MNG_DOM_NODE_ID = ntm.MPG_MNG_DOM_NODE_ID
  LEFT JOIN TWAA0003M00 t ON ntm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  WHERE n.MNG_DOM_NODE_STAT_TYP_CODE = :nodeStatus
  GROUP BY n.MNG_DOM_NODE_ID, n.MNG_DOM_NODE_NM, n.MNG_DOM_NODE_HST_IP, n.MNG_DOM_NODE_HST_PORT_NO, n.MNG_DOM_NODE_STAT_TYP_CODE, n.REG_DDTS, n.CHG_DDTS
  ORDER BY n.REG_DDTS DESC
`;

/**
 * 상태별 노드 조회
 * 
 * 파라미터:
 * - :nodeStatus (VARCHAR2): 노드 상태 (active, inactive, warning, error)
 */
export const SELECT_NODES_BY_STATUS = `
  SELECT 
    MNG_DOM_NODE_ID AS "nodeId",
    MNG_DOM_NODE_NM AS "nodeName",
    MNG_DOM_NODE_HST_IP AS "host",
    MNG_DOM_NODE_HST_PORT_NO AS "port",
    MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  NODE_DESC AS "nodeDesc",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_STAT_TYP_CODE = :nodeStatus
  ORDER BY REG_DDTS DESC
`;

/**
 * 호스트명으로 노드 검색 (태그 포함)
 */
export const SEARCH_NODES_BY_HOST_WITH_TAGS = `
  SELECT 
    n.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port",
    n.MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  n.NODE_DESC AS "nodeDesc",
    n.REG_DDTS AS "createdAt",
    n.CHG_DDTS AS "updatedAt",
    LISTAGG(t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags"
  FROM TWAA0001M00 n
  LEFT JOIN TWAA0002M00 ntm ON n.MNG_DOM_NODE_ID = ntm.MPG_MNG_DOM_NODE_ID
  LEFT JOIN TWAA0003M00 t ON ntm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  WHERE n.MNG_DOM_NODE_HST_IP LIKE :host
  GROUP BY n.MNG_DOM_NODE_ID, n.MNG_DOM_NODE_NM, n.MNG_DOM_NODE_HST_IP, n.MNG_DOM_NODE_HST_PORT_NO, n.MNG_DOM_NODE_STAT_TYP_CODE, n.REG_DDTS, n.CHG_DDTS
  ORDER BY n.REG_DDTS DESC
`;

/**
 * 호스트명으로 노드 검색
 * 
 * 파라미터:
 * - :host (VARCHAR2): 검색할 호스트명 (부분 일치)
 */
export const SEARCH_NODES_BY_HOST = `
  SELECT 
    MNG_DOM_NODE_ID AS "nodeId",
    MNG_DOM_NODE_NM AS "nodeName",
    MNG_DOM_NODE_HST_IP AS "host",
    MNG_DOM_NODE_HST_PORT_NO AS "port",
    MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus",
  --  NODE_DESC AS "nodeDesc",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_HST_IP LIKE :host
  ORDER BY REG_DDTS DESC
`;

/**
 * 새 노드 생성 (RETURNING INTO 사용)
 * 
 * 파라미터:
 * - :nodeName (VARCHAR2): 노드 이름
 * - :host (VARCHAR2): 호스트 주소
 * - :port (NUMBER): 포트 번호
 * - :nodeStatus (VARCHAR2): 노드 상태 (기본값: 'active')
 * - :nodeDesc (VARCHAR2): 노드 설명 (선택)
 * 
 * 반환값:
 * - :nodeId (NUMBER): 생성된 노드 ID
 */
export const INSERT_NODE = `
  INSERT INTO TWAA0001M00 (
    MNG_DOM_NODE_ID,
    MNG_DOM_NODE_NM,
    MNG_DOM_NODE_HST_IP,
    MNG_DOM_NODE_HST_PORT_NO,
    MNG_DOM_NODE_STAT_TYP_CODE,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_NODE_ID),0)+1 FROM TWAA0001M00),
    :nodeName,
    :host,
    :port,
    :nodeStatus,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    'SYSTEM'
  )
  RETURNING MNG_DOM_NODE_ID INTO :id
`;

/**
 * 노드 수정 (RETURNING INTO 사용)
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 수정할 노드 ID
 * - :nodeName (VARCHAR2): 새 노드 이름
 * - :host (VARCHAR2): 새 호스트 주소
 * - :port (NUMBER): 새 포트 번호
 * - :nodeStatus (VARCHAR2): 새 노드 상태
 * - :nodeDesc (VARCHAR2): 새 노드 설명
 * 
 * 반환값:
 * - :nodeId (NUMBER): 수정된 노드 ID
 */
export const UPDATE_NODE = `
  UPDATE TWAA0001M00
  SET 
    MNG_DOM_NODE_NM = :nodeName,
    MNG_DOM_NODE_HST_IP = :host,
    MNG_DOM_NODE_HST_PORT_NO = :port,
    MNG_DOM_NODE_STAT_TYP_CODE = :nodeStatus,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_NODE_ID = :nodeId
  RETURNING MNG_DOM_NODE_ID INTO :updatedId
`;

/**
 * 노드 상태만 수정
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 수정할 노드 ID
 * - :nodeStatus (VARCHAR2): 새 노드 상태
 */
export const UPDATE_NODE_STATUS = `
  UPDATE TWAA0001M00
  SET 
    MNG_DOM_NODE_STAT_TYP_CODE = :nodeStatus,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_NODE_ID = :nodeId
`;

/**
 * 노드 삭제
 * CASCADE 제약조건으로 인해 관련 데이터도 자동 삭제됩니다.
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 삭제할 노드 ID
 */
export const DELETE_NODE = `
  DELETE FROM TWAA0001M00
  WHERE MNG_DOM_NODE_ID = :nodeId
`;

/**
 * 노드 이름 중복 확인
 * 
 * 파라미터:
 * - :nodeName (VARCHAR2): 확인할 노드 이름
 * - :excludeId (NUMBER, 선택): 제외할 노드 ID (수정 시 자신 제외)
 */
export const CHECK_NODE_NAME_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_NM = :nodeName
  AND (:excludeId IS NULL OR MNG_DOM_NODE_ID != :excludeId)
`;

/**
 * 호스트:포트 조합 중복 확인
 * 
 * 파라미터:
 * - :host (VARCHAR2): 확인할 호스트
 * - :port (NUMBER): 확인할 포트
 * - :excludeId (NUMBER, 선택): 제외할 노드 ID (수정 시 자신 제외)
 */
export const CHECK_HOST_PORT_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_HST_IP = :host AND MNG_DOM_NODE_HST_PORT_NO = :port
  AND (:excludeId IS NULL OR MNG_DOM_NODE_ID != :excludeId)
`;

export const CHECK_NODE_HOST_PORT_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_HST_IP = :host
  AND MNG_DOM_NODE_HST_PORT_NO = :port
  AND (:excludeId IS NULL OR MNG_DOM_NODE_ID != :excludeId)
`;

/**
 * 노드가 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_NODE_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(MNG_DOM_SYNT_TEST_NM, ', ') WITHIN GROUP (ORDER BY MNG_DOM_SYNT_TEST_NM) AS "testNames"
  FROM TWAA0009M00
  WHERE MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'node'
    AND SYNT_TEST_MNG_DOM_EXE_TRG_ID = :nodeId
  GROUP BY MNG_DOM_SYNT_TEST_TRGT_TYP_NM, SYNT_TEST_MNG_DOM_EXE_TRG_ID
`;
