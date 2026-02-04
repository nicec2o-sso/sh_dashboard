/**
 * 태그 관리 쿼리
 * 
 * 이 파일은 태그와 노드/API/Synthetic Test 태그 관계 관리에 사용하는 SQL 쿼리를 포함합니다.
 */

import oracledb from 'oracledb';

/**
 * 태그 이름으로 태그 조회
 */
export const SELECT_TAG_BY_NAME = `
  SELECT 
    MNG_DOM_TAG_ID AS "tagId",
    MNG_DOM_TAG_NM AS "tagName",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0003M00
  WHERE MNG_DOM_TAG_NM = :tagName
`;

/**
 * 새 태그 생성 (RETURNING INTO 사용)
 */
export const INSERT_TAG = `
  INSERT INTO TWAA0003M00 (
    MNG_DOM_TAG_ID,
    MNG_DOM_TAG_NM,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_TAG_ID),0)+1 FROM TWAA0003M00),
    :tagName,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
  RETURNING MNG_DOM_TAG_ID INTO :id
`;

/**
 * OUT 바인드 정의: 태그 생성
 */
export const INSERT_TAG_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

// ============================================================================
// 노드 태그 관계
// ============================================================================

/**
 * 노드-태그 관계 생성
 */
export const INSERT_NODE_TAG_MEMBER = `
  INSERT INTO TWAA0002M00 (
    MNG_DOM_NODE_TAG_MPG_ID,
    MPG_MNG_DOM_TAG_ID,
    MPG_MNG_DOM_NODE_ID,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_NODE_TAG_MPG_ID),0)+1 FROM TWAA0002M00),
    :tagId,
    :nodeId,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
`;

/**
 * 특정 노드의 모든 태그 조회
 */
export const SELECT_NODE_TAGS = `
  SELECT 
    t.MNG_DOM_TAG_ID AS "tagId",
    t.MNG_DOM_TAG_NM AS "tagName"
  FROM TWAA0003M00 t
  INNER JOIN TWAA0002M00 ntm ON t.MNG_DOM_TAG_ID = ntm.MPG_MNG_DOM_TAG_ID
  WHERE ntm.MPG_MNG_DOM_NODE_ID = :nodeId
  ORDER BY t.MNG_DOM_TAG_NM
`;

/**
 * 노드의 모든 태그 관계 삭제 (노드 삭제 시 사용)
 */
export const DELETE_NODE_TAG_MEMBERS = `
  DELETE FROM TWAA0002M00
  WHERE MPG_MNG_DOM_NODE_ID = :nodeId
`;

/**
 * 특정 노드의 특정 태그 관계 삭제
 */
export const DELETE_NODE_TAG_MEMBER = `
  DELETE FROM TWAA0002M00
  WHERE MPG_MNG_DOM_NODE_ID = :nodeId AND MPG_MNG_DOM_TAG_ID = :tagId
`;

// ============================================================================
// API 태그 관계
// ============================================================================

/**
 * API-태그 관계 생성
 */
export const INSERT_API_TAG_MEMBER = `
  INSERT INTO TWAA0008M00 (
    MNG_DOM_API_TAG_MPG_ID,
    MPG_MNG_DOM_TAG_ID,
    MPG_MNG_DOM_API_ID,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_API_TAG_MPG_ID),0)+1 FROM TWAA0008M00),
    :tagId,
    :apiId,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
`;

/**
 * 특정 API의 모든 태그 조회
 */
export const SELECT_API_TAGS = `
  SELECT 
    t.MNG_DOM_TAG_ID AS "tagId",
    t.MNG_DOM_TAG_NM AS "tagName"
  FROM TWAA0003M00 t
  INNER JOIN TWAA0008M00 atm ON t.MNG_DOM_TAG_ID = atm.MPG_MNG_DOM_TAG_ID
  WHERE atm.MPG_MNG_DOM_API_ID = :apiId
  ORDER BY t.MNG_DOM_TAG_NM
`;

/**
 * API의 모든 태그 관계 삭제
 */
export const DELETE_API_TAG_MEMBERS = `
  DELETE FROM TWAA0008M00
  WHERE MPG_MNG_DOM_API_ID = :apiId
`;

/**
 * 특정 API의 특정 태그 관계 삭제
 */
export const DELETE_API_TAG_MEMBER = `
  DELETE FROM TWAA0008M00
  WHERE MPG_MNG_DOM_API_ID = :apiId AND MPG_MNG_DOM_TAG_ID = :tagId
`;

// ============================================================================
// Synthetic Test 태그 관계
// ============================================================================

/**
 * Synthetic Test-태그 관계 생성
 */
export const INSERT_SYNTHETIC_TEST_TAG_MEMBER = `
  INSERT INTO TWAA0010M00 (
    MNG_DOM_SYNT_TEST_TAG_MPG_ID,
    MPG_MNG_DOM_TAG_ID,
    MPG_MNG_DOM_SYNT_TEST_ID,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_SYNT_TEST_TAG_MPG_ID),0)+1 FROM TWAA0010M00),
    :tagId,
    :syntheticTestId,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    '127.0.0.1',
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
`;

/**
 * 특정 Synthetic Test의 모든 태그 조회
 */
export const SELECT_SYNTHETIC_TEST_TAGS = `
  SELECT 
    t.MNG_DOM_TAG_ID AS "tagId",
    t.MNG_DOM_TAG_NM AS "tagName"
  FROM TWAA0003M00 t
  INNER JOIN TWAA0010M00 sttm ON t.MNG_DOM_TAG_ID = sttm.MPG_MNG_DOM_TAG_ID
  WHERE sttm.MPG_MNG_DOM_SYNT_TEST_ID = :syntheticTestId
  ORDER BY t.MNG_DOM_TAG_NM
`;

/**
 * Synthetic Test의 모든 태그 관계 삭제
 */
export const DELETE_SYNTHETIC_TEST_TAG_MEMBERS = `
  DELETE FROM TWAA0010M00
  WHERE MPG_MNG_DOM_SYNT_TEST_ID = :syntheticTestId
`;

/**
 * 특정 Synthetic Test의 특정 태그 관계 삭제
 */
export const DELETE_SYNTHETIC_TEST_TAG_MEMBER = `
  DELETE FROM TWAA0010M00
  WHERE MPG_MNG_DOM_SYNT_TEST_ID = :syntheticTestId AND MPG_MNG_DOM_TAG_ID = :tagId
`;

// ============================================================================
// 공통
// ============================================================================

/**
 * 모든 태그 조회
 */
export const SELECT_ALL_TAGS = `
  SELECT 
    MNG_DOM_TAG_ID AS "tagId",
    MNG_DOM_TAG_NM AS "tagName",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0003M00
  ORDER BY MNG_DOM_TAG_NM
`;

/**
 * 태그 삭제
 */
export const DELETE_TAG = `
  DELETE FROM TWAA0003M00
  WHERE MNG_DOM_TAG_ID = :tagId
`;

/**
 * 태그 사용 여부 확인 (노드, API, Synthetic Test에서 사용 중인지 확인)
 */
export const CHECK_TAG_IN_USE = `
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM TWAA0002M00 WHERE MPG_MNG_DOM_TAG_ID = :tagId
      ) OR EXISTS (
        SELECT 1 FROM TWAA0008M00 WHERE MPG_MNG_DOM_TAG_ID = :tagId
      ) OR EXISTS (
        SELECT 1 FROM TWAA0010M00 WHERE MPG_MNG_DOM_TAG_ID = :tagId
      ) THEN 1
      ELSE 0
    END AS "IN_USE"
  FROM DUAL
`;

/**
 * 사용되지 않는 태그 삭제 (유지보수용)
 */
export const DELETE_UNUSED_TAGS = `
  DELETE FROM TWAA0003M00
  WHERE MNG_DOM_TAG_ID NOT IN (
    SELECT DISTINCT MNG_DOM_TAG_ID FROM TWAA0002M00
    UNION
    SELECT DISTINCT MNG_DOM_TAG_ID FROM TWAA0008M00
    UNION
    SELECT DISTINCT MNG_DOM_TAG_ID FROM TWAA0010M00
  )
`;
