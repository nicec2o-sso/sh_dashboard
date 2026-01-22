/**
 * 노드 그룹 관리 쿼리
 * 
 * 이 파일은 노드 그룹 관리 화면에서 사용하는 모든 SQL 쿼리를 관리합니다.
 * 각 쿼리는 명확한 목적과 파라미터 설명을 포함합니다.
 */

import oracledb from 'oracledb';

/**
 * 노드 그룹 목록 조회
 * 모든 노드 그룹과 각 그룹에 속한 노드 수를 함께 조회합니다.
 */
export const SELECT_NODE_GROUPS = `
  SELECT 
    ng.NODE_GROUP_ID AS "nodeGroupId",
    ng.NODE_GROUP_NAME AS "nodeGroupName",
    ng.NODE_GROUP_DESC AS "nodeGroupDesc",
    ng.CREATED_AT AS "createdAt",
    ng.UPDATED_AT AS "updatedAt",
    COUNT(ngm.NODE_ID) AS "nodeCount",
    LISTAGG(ngm.NODE_ID, ',') WITHIN GROUP (ORDER BY ngm.NODE_ID) AS "nodeIdsStr"
  FROM MT_NODE_GROUPS ng
  LEFT JOIN MT_NODE_GROUP_MEMBERS ngm ON ng.NODE_GROUP_ID = ngm.NODE_GROUP_ID
  GROUP BY ng.NODE_GROUP_ID, ng.NODE_GROUP_NAME, ng.NODE_GROUP_DESC, ng.CREATED_AT, ng.UPDATED_AT
  ORDER BY ng.CREATED_AT DESC
`;

/**
 * 특정 노드 그룹 상세 조회
 * 그룹 정보와 속한 노드들의 상세 정보를 함께 조회합니다.
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 조회할 노드 그룹 ID
 */
export const SELECT_NODE_GROUP_DETAIL = `
  SELECT 
    ng.NODE_GROUP_ID AS "nodeGroupId",
    ng.NODE_GROUP_NAME AS "nodeGroupName",
    ng.NODE_GROUP_DESC AS "nodeGroupDesc",
    ng.CREATED_AT AS "createdAt",
    ng.UPDATED_AT AS "updatedAt",
    n.NODE_ID AS "nodeId",
    n.NODE_NAME AS "nodeName",
    n.HOST AS "host",
    n.PORT AS "port",
    n.NODE_STATUS AS "nodeStatus",
    n.NODE_DESC AS "nodeDesc"
  FROM MT_NODE_GROUPS ng
  LEFT JOIN MT_NODE_GROUP_MEMBERS ngm ON ng.NODE_GROUP_ID = ngm.NODE_GROUP_ID
  LEFT JOIN MT_NODES n ON ngm.NODE_ID = n.NODE_ID
  WHERE ng.NODE_GROUP_ID = :nodeGroupId
  ORDER BY n.NODE_NAME
`;

/**
 * 노드 그룹 생성 (RETURNING INTO 사용)
 * 새로운 노드 그룹을 생성하고 생성된 ID를 반환합니다.
 * 
 * 파라미터:
 * - :name (VARCHAR2): 그룹 이름
 * - :description (VARCHAR2): 그룹 설명 (선택)
 * 
 * 반환값:
 * - :id (NUMBER): 생성된 그룹 ID
 */
export const INSERT_NODE_GROUP = `
  INSERT INTO MT_NODE_GROUPS (
    NODE_GROUP_ID,
    NODE_GROUP_NAME,
    NODE_GROUP_DESC,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_NODE_GROUP_ID.NEXTVAL,
    :nodeGroupName,
    :nodeGroupDesc,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
  RETURNING NODE_GROUP_ID INTO :id
`;

/**
 * OUT 바인드 정의: 노드 그룹 생성
 */
export const INSERT_NODE_GROUP_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * 노드 그룹 수정 (RETURNING INTO 사용)
 * 기존 노드 그룹 정보를 수정하고 수정된 ID를 반환합니다.
 * 
 * 파라미터:
 * - :id (NUMBER): 수정할 그룹 ID
 * - :name (VARCHAR2): 새 그룹 이름
 * - :description (VARCHAR2): 새 그룹 설명 (선택)
 * 
 * 반환값:
 * - :updatedId (NUMBER): 수정된 그룹 ID
 */
export const UPDATE_NODE_GROUP = `
  UPDATE MT_NODE_GROUPS
  SET 
    NODE_GROUP_NAME = :nodeGroupName,
    NODE_GROUP_DESC = :nodeGroupDesc,
    UPDATED_AT = SYSTIMESTAMP
  WHERE NODE_GROUP_ID = :nodeGroupId
  RETURNING NODE_GROUP_ID INTO :id
`;

/**
 * OUT 바인드 정의: 노드 그룹 수정
 */
export const UPDATE_NODE_GROUP_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * 노드 그룹 삭제
 * CASCADE 제약조건으로 인해 MT_NODE_GROUP_MEMBERS도 자동 삭제됩니다.
 * 
 * 파라미터:
 * - :id (NUMBER): 삭제할 그룹 ID
 */
export const DELETE_NODE_GROUP = `
  DELETE FROM MT_NODE_GROUPS
  WHERE NODE_GROUP_ID = :nodeGroupId
`;

/**
 * 노드 그룹에 노드 추가
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 노드 그룹 ID
 * - :nodeId (NUMBER): 추가할 노드 ID
 */
export const INSERT_NODE_GROUP_MEMBER = `
  INSERT INTO MT_NODE_GROUP_MEMBERS (
    NODE_GROUP_ID,
    NODE_ID,
    CREATED_AT
  ) VALUES (
    :nodeGroupId,
    :nodeId,
    SYSTIMESTAMP
  )
`;

/**
 * 노드 그룹에서 노드 제거
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 노드 그룹 ID
 * - :nodeId (NUMBER): 제거할 노드 ID
 */
export const DELETE_NODE_GROUP_MEMBER = `
  DELETE FROM MT_NODE_GROUP_MEMBERS
  WHERE NODE_GROUP_ID = :nodeGroupId AND NODE_ID = :nodeId
`;

/**
 * 노드 그룹의 모든 멤버 제거
 * 그룹 멤버를 일괄 변경할 때 사용합니다.
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 노드 그룹 ID
 */
export const DELETE_ALL_NODE_GROUP_MEMBERS = `
  DELETE FROM MT_NODE_GROUP_MEMBERS
  WHERE NODE_GROUP_ID = :nodeGroupId
`;

/**
 * 그룹에 속하지 않은 노드 목록 조회
 * 노드 추가 시 선택 가능한 노드 목록을 조회합니다.
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 현재 노드 그룹 ID
 */
export const SELECT_AVAILABLE_NODES = `
  SELECT 
    NODE_ID,
    NODE_NAME,
    HOST,
    PORT,
    NODE_STATUS,
    NODE_DESC
  FROM MT_NODES
  WHERE NODE_ID NOT IN (
    SELECT NODE_ID 
    FROM MT_NODE_GROUP_MEMBERS 
    WHERE NODE_GROUP_ID = :nodeGroupId
  )
  ORDER BY NODE_NAME
`;

/**
 * 노드 그룹 이름 중복 확인
 * 
 * 파라미터:
 * - :name (VARCHAR2): 확인할 그룹 이름
 * - :excludeId (NUMBER, 선택): 제외할 그룹 ID (수정 시 자신 제외)
 */
export const CHECK_NODE_GROUP_NAME_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM MT_NODE_GROUPS
  WHERE NODE_GROUP_NAME = :nodeGroupName
  AND (:excludeId IS NULL OR NODE_GROUP_ID != :excludeId)
`;

/**
 * 노드 그룹이 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(SYNTHETIC_TEST_NAME, ', ') WITHIN GROUP (ORDER BY SYNTHETIC_TEST_NAME) AS "testNames"
  FROM MT_SYNTHETIC_TESTS
  WHERE TARGET_TYPE = 'group'
    AND TARGET_ID = :nodeGroupId
  GROUP BY TARGET_TYPE, TARGET_ID
`;
