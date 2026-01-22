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
    n.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port",
    n.NODE_STATUS AS "nodeStatus",
    n.NODE_DESC AS "nodeDesc",
    n.CREATED_AT AS "createdAt",
    n.UPDATED_AT AS "updatedAt",
    LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags"
  FROM MT_NODES n
  LEFT JOIN MT_NODE_TAG_MEMBERS ntm ON n.NODE_ID = ntm.NODE_ID
  LEFT JOIN MT_TAGS t ON ntm.TAG_ID = t.TAG_ID
  GROUP BY n.NODE_ID, n.NODE_NAME, n.HOST, n.PORT, n.NODE_STATUS, n.NODE_DESC, n.CREATED_AT, n.UPDATED_AT
  ORDER BY n.CREATED_AT DESC
`;

/**
 * 모든 노드 조회
 */
export const SELECT_ALL_NODES = `
  SELECT 
    NODE_ID AS "nodeId",
    NODE_NAME AS "nodeName",
    HOST AS "host",
    PORT AS "port",
    NODE_STATUS AS "nodeStatus",
    NODE_DESC AS "nodeDesc",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_NODES
  ORDER BY CREATED_AT DESC
`;

/**
 * 특정 노드 조회 (태그 포함)
 */
export const SELECT_NODE_BY_ID_WITH_TAGS = `
  SELECT 
    n.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port",
    n.NODE_STATUS AS "nodeStatus",
    n.NODE_DESC AS "nodeDesc",
    n.CREATED_AT AS "createdAt",
    n.UPDATED_AT AS "updatedAt",
    LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags"
  FROM MT_NODES n
  LEFT JOIN MT_NODE_TAG_MEMBERS ntm ON n.NODE_ID = ntm.NODE_ID
  LEFT JOIN MT_TAGS t ON ntm.TAG_ID = t.TAG_ID
  WHERE n.NODE_ID = :nodeId
  GROUP BY n.NODE_ID, n.NODE_NAME, n.HOST, n.PORT, n.NODE_STATUS, n.NODE_DESC, n.CREATED_AT, n.UPDATED_AT
`;

/**
 * 특정 노드 조회
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 조회할 노드 ID
 */
export const SELECT_NODE_BY_ID = `
  SELECT 
    NODE_ID AS "nodeId",
    NODE_NAME AS "nodeName",
    HOST AS "host",
    PORT AS "port",
    NODE_STATUS AS "nodeStatus",
    NODE_DESC AS "nodeDesc",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_NODES
  WHERE NODE_ID = :nodeId
`;

/**
 * 여러 노드 ID로 조회
 * 
 * 파라미터:
 * - :nodeIds (배열): 조회할 노드 ID 배열
 */
export const SELECT_NODES_BY_IDS = `
  SELECT 
    NODE_ID AS "nodeId",
    NODE_NAME AS "nodeName",
    HOST AS "host",
    PORT AS "port",
    NODE_STATUS AS "nodeStatus",
    NODE_DESC AS "nodeDesc",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_NODES
  WHERE NODE_ID IN (:nodeIds)
`;

/**
 * 상태별 노드 조회 (태그 포함)
 */
export const SELECT_NODES_BY_STATUS_WITH_TAGS = `
  SELECT 
    n.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port",
    n.NODE_STATUS AS "nodeStatus",
    n.NODE_DESC AS "nodeDesc",
    n.CREATED_AT AS "createdAt",
    n.UPDATED_AT AS "updatedAt",
    LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags"
  FROM MT_NODES n
  LEFT JOIN MT_NODE_TAG_MEMBERS ntm ON n.NODE_ID = ntm.NODE_ID
  LEFT JOIN MT_TAGS t ON ntm.TAG_ID = t.TAG_ID
  WHERE n.NODE_STATUS = :nodeStatus
  GROUP BY n.NODE_ID, n.NODE_NAME, n.HOST, n.PORT, n.NODE_STATUS, n.NODE_DESC, n.CREATED_AT, n.UPDATED_AT
  ORDER BY n.CREATED_AT DESC
`;

/**
 * 상태별 노드 조회
 * 
 * 파라미터:
 * - :nodeStatus (VARCHAR2): 노드 상태 (active, inactive, warning, error)
 */
export const SELECT_NODES_BY_STATUS = `
  SELECT 
    NODE_ID AS "nodeId",
    NODE_NAME AS "nodeName",
    HOST AS "host",
    PORT AS "port",
    NODE_STATUS AS "nodeStatus",
    NODE_DESC AS "nodeDesc",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_NODES
  WHERE NODE_STATUS = :nodeStatus
  ORDER BY CREATED_AT DESC
`;

/**
 * 호스트명으로 노드 검색 (태그 포함)
 */
export const SEARCH_NODES_BY_HOST_WITH_TAGS = `
  SELECT 
    n.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port",
    n.NODE_STATUS AS "nodeStatus",
    n.NODE_DESC AS "nodeDesc",
    n.CREATED_AT AS "createdAt",
    n.UPDATED_AT AS "updatedAt",
    LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags"
  FROM MT_NODES n
  LEFT JOIN MT_NODE_TAG_MEMBERS ntm ON n.NODE_ID = ntm.NODE_ID
  LEFT JOIN MT_TAGS t ON ntm.TAG_ID = t.TAG_ID
  WHERE n.HOST LIKE :host
  GROUP BY n.NODE_ID, n.NODE_NAME, n.HOST, n.PORT, n.NODE_STATUS, n.NODE_DESC, n.CREATED_AT, n.UPDATED_AT
  ORDER BY n.CREATED_AT DESC
`;

/**
 * 호스트명으로 노드 검색
 * 
 * 파라미터:
 * - :host (VARCHAR2): 검색할 호스트명 (부분 일치)
 */
export const SEARCH_NODES_BY_HOST = `
  SELECT 
    NODE_ID AS "nodeId",
    NODE_NAME AS "nodeName",
    HOST AS "host",
    PORT AS "port",
    NODE_STATUS AS "nodeStatus",
    NODE_DESC AS "nodeDesc",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_NODES
  WHERE HOST LIKE :host
  ORDER BY CREATED_AT DESC
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
  INSERT INTO MT_NODES (
    NODE_ID,
    NODE_NAME,
    HOST,
    PORT,
    NODE_STATUS,
    NODE_DESC,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_NODE_ID.NEXTVAL,
    :nodeName,
    :host,
    :port,
    :nodeStatus,
    :nodeDesc,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
  RETURNING NODE_ID INTO :id
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
  UPDATE MT_NODES
  SET 
    NODE_NAME = :nodeName,
    HOST = :host,
    PORT = :port,
    NODE_STATUS = :nodeStatus,
    NODE_DESC = :nodeDesc,
    UPDATED_AT = SYSTIMESTAMP
  WHERE NODE_ID = :nodeId
  RETURNING NODE_ID INTO :updatedId
`;

/**
 * 노드 상태만 수정
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 수정할 노드 ID
 * - :nodeStatus (VARCHAR2): 새 노드 상태
 */
export const UPDATE_NODE_STATUS = `
  UPDATE MT_NODES
  SET 
    NODE_STATUS = :nodeStatus,
    UPDATED_AT = SYSTIMESTAMP
  WHERE NODE_ID = :nodeId
`;

/**
 * 노드 삭제
 * CASCADE 제약조건으로 인해 관련 데이터도 자동 삭제됩니다.
 * 
 * 파라미터:
 * - :nodeId (NUMBER): 삭제할 노드 ID
 */
export const DELETE_NODE = `
  DELETE FROM MT_NODES
  WHERE NODE_ID = :nodeId
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
  FROM MT_NODES
  WHERE NODE_NAME = :nodeName
  AND (:excludeId IS NULL OR NODE_ID != :excludeId)
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
  FROM MT_NODES
  WHERE HOST = :host AND PORT = :port
  AND (:excludeId IS NULL OR NODE_ID != :excludeId)
`;

export const CHECK_NODE_HOST_PORT_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM MT_NODES
  WHERE HOST = :host
  AND PORT = :port
  AND (:excludeId IS NULL OR NODE_ID != :excludeId)
`;

/**
 * 노드가 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_NODE_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(SYNTHETIC_TEST_NAME, ', ') WITHIN GROUP (ORDER BY SYNTHETIC_TEST_NAME) AS "testNames"
  FROM MT_SYNTHETIC_TESTS
  WHERE TARGET_TYPE = 'node'
    AND TARGET_ID = :nodeId
  GROUP BY TARGET_TYPE, TARGET_ID
`;
