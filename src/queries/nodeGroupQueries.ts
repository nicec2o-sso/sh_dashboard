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
    ng.MNG_DOM_NODE_GRP_ID AS "nodeGroupId",
    ng.SNET_MNG_NODE_GRP_NM AS "nodeGroupName",
    ng.MNG_DOM_NODE_GRP_DES_CNTT AS "nodeGroupDesc",
    ng.REG_DDTS AS "createdAt",
    ng.CHG_DDTS AS "updatedAt",
    COUNT(ngm.MNG_DOM_NODE_ID) AS "nodeCount",
    LISTAGG(ngm.MNG_DOM_NODE_ID, ',') WITHIN GROUP (ORDER BY ngm.MNG_DOM_NODE_ID) AS "nodeIdsStr"
  FROM TWAA0004M00 ng
  LEFT JOIN TWAA0005M00 ngm ON ng.MNG_DOM_NODE_GRP_ID = ngm.MNG_DOM_NODE_GRP_ID
  GROUP BY ng.MNG_DOM_NODE_GRP_ID, ng.SNET_MNG_NODE_GRP_NM, ng.MNG_DOM_NODE_GRP_DES_CNTT, ng.REG_DDTS, ng.CHG_DDTS
  ORDER BY ng.REG_DDTS DESC
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
    ng.MNG_DOM_NODE_GRP_ID AS "nodeGroupId",
    ng.SNET_MNG_NODE_GRP_NM AS "nodeGroupName",
    ng.MNG_DOM_NODE_GRP_DES_CNTT AS "nodeGroupDesc",
    ng.REG_DDTS AS "createdAt",
    ng.CHG_DDTS AS "updatedAt",
    n.MNG_DOM_NODE_ID AS "nodeId",
    n.MNG_DOM_NODE_NM AS "nodeName",
    n.MNG_DOM_NODE_HST_IP AS "host",
    n.MNG_DOM_NODE_HST_PORT_NO AS "port",
    n.MNG_DOM_NODE_STAT_TYP_CODE AS "nodeStatus"
  FROM TWAA0004M00 ng
  LEFT JOIN TWAA0005M00 ngm ON ng.MNG_DOM_NODE_GRP_ID = ngm.MNG_DOM_NODE_GRP_ID
  LEFT JOIN TWAA0001M00 n ON ngm.MNG_DOM_NODE_ID = n.MNG_DOM_NODE_ID
  WHERE ng.MNG_DOM_NODE_GRP_ID = :nodeGroupId
  ORDER BY n.MNG_DOM_NODE_NM
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
  INSERT INTO TWAA0004M00 (
    MNG_DOM_NODE_GRP_ID,
    SNET_MNG_NODE_GRP_NM,
    MNG_DOM_NODE_GRP_DES_CNTT,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_NODE_GRP_ID),0)+1 FROM TWAA0004M00),
    :nodeGroupName,
    :nodeGroupDesc,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    'SYSTEM'
  )
  RETURNING MNG_DOM_NODE_GRP_ID INTO :id
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
  UPDATE TWAA0004M00
  SET 
    SNET_MNG_NODE_GRP_NM = :nodeGroupName,
    MNG_DOM_NODE_GRP_DES_CNTT = :nodeGroupDesc,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_NODE_GRP_ID = :nodeGroupId
  RETURNING MNG_DOM_NODE_GRP_ID INTO :id
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
  DELETE FROM TWAA0004M00
  WHERE MNG_DOM_NODE_GRP_ID = :nodeGroupId
`;

/**
 * 노드 그룹에 노드 추가
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 노드 그룹 ID
 * - :nodeId (NUMBER): 추가할 노드 ID
 */
export const INSERT_NODE_GROUP_MEMBER = `
  INSERT INTO TWAA0005M00 (
    MNG_DOM_NODE_GRP_MMB_MPG_ID,
    MNG_DOM_NODE_GRP_ID,
    MNG_DOM_NODE_ID,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    :nodeGroupId,
    :nodeId,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    'SYSTEM'
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
  DELETE FROM TWAA0005M00
  WHERE MNG_DOM_NODE_GRP_ID = :nodeGroupId AND MNG_DOM_NODE_ID = :nodeId
`;

/**
 * 노드 그룹의 모든 멤버 제거
 * 그룹 멤버를 일괄 변경할 때 사용합니다.
 * 
 * 파라미터:
 * - :nodeGroupId (NUMBER): 노드 그룹 ID
 */
export const DELETE_ALL_NODE_GROUP_MEMBERS = `
  DELETE FROM TWAA0005M00
  WHERE MNG_DOM_NODE_GRP_ID = :nodeGroupId
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
    MNG_DOM_NODE_ID,
    MNG_DOM_NODE_NM,
    MNG_DOM_NODE_HST_IP,
    MNG_DOM_NODE_HST_PORT_NO,
    MNG_DOM_NODE_STAT_TYP_CODE
  FROM TWAA0001M00
  WHERE MNG_DOM_NODE_ID NOT IN (
    SELECT MNG_DOM_NODE_ID 
    FROM TWAA0005M00 
    WHERE MNG_DOM_NODE_GRP_ID = :nodeGroupId
  )
  ORDER BY MNG_DOM_NODE_NM
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
  FROM TWAA0004M00
  WHERE SNET_MNG_NODE_GRP_NM = :nodeGroupName
  AND (:excludeId IS NULL OR MNG_DOM_NODE_GRP_ID != :excludeId)
`;

/**
 * 노드 그룹이 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_NODE_GROUP_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(MNG_DOM_SYNT_TEST_NM, ', ') WITHIN GROUP (ORDER BY MNG_DOM_SYNT_TEST_NM) AS "testNames"
  FROM TWAA0009M00
  WHERE MNG_DOM_SYNT_TEST_TRGT_TYP_NM = 'group'
    AND SYNT_TEST_MNG_DOM_EXE_TRG_ID = :nodeGroupId
  GROUP BY MNG_DOM_SYNT_TEST_TRGT_TYP_NM, SYNT_TEST_MNG_DOM_EXE_TRG_ID
`;
