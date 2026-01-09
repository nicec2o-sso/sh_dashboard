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
    TAG_ID AS "tagId",
    TAG_NAME AS "tagName",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_TAGS
  WHERE TAG_NAME = :tagName
`;

/**
 * 새 태그 생성 (RETURNING INTO 사용)
 */
export const INSERT_TAG = `
  INSERT INTO MT_TAGS (
    TAG_ID,
    TAG_NAME,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_TAG_ID.NEXTVAL,
    :tagName,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
  RETURNING TAG_ID INTO :id
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
  INSERT INTO MT_NODE_TAG_MEMBERS (
    NODE_TAG_ID,
    TAG_ID,
    NODE_ID,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_NODE_TAG_ID.NEXTVAL,
    :tagId,
    :nodeId,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
`;

/**
 * 특정 노드의 모든 태그 조회
 */
export const SELECT_NODE_TAGS = `
  SELECT 
    t.TAG_ID AS "tagId",
    t.TAG_NAME AS "tagName"
  FROM MT_TAGS t
  INNER JOIN MT_NODE_TAG_MEMBERS ntm ON t.TAG_ID = ntm.TAG_ID
  WHERE ntm.NODE_ID = :nodeId
  ORDER BY t.TAG_NAME
`;

/**
 * 노드의 모든 태그 관계 삭제 (노드 삭제 시 사용)
 */
export const DELETE_NODE_TAG_MEMBERS = `
  DELETE FROM MT_NODE_TAG_MEMBERS
  WHERE NODE_ID = :nodeId
`;

/**
 * 특정 노드의 특정 태그 관계 삭제
 */
export const DELETE_NODE_TAG_MEMBER = `
  DELETE FROM MT_NODE_TAG_MEMBERS
  WHERE NODE_ID = :nodeId AND TAG_ID = :tagId
`;

// ============================================================================
// API 태그 관계
// ============================================================================

/**
 * API-태그 관계 생성
 */
export const INSERT_API_TAG_MEMBER = `
  INSERT INTO MT_API_TAG_MEMBERS (
    API_TAG_ID,
    TAG_ID,
    API_ID,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_API_TAG_ID.NEXTVAL,
    :tagId,
    :apiId,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
`;

/**
 * 특정 API의 모든 태그 조회
 */
export const SELECT_API_TAGS = `
  SELECT 
    t.TAG_ID AS "tagId",
    t.TAG_NAME AS "tagName"
  FROM MT_TAGS t
  INNER JOIN MT_API_TAG_MEMBERS atm ON t.TAG_ID = atm.TAG_ID
  WHERE atm.API_ID = :apiId
  ORDER BY t.TAG_NAME
`;

/**
 * API의 모든 태그 관계 삭제
 */
export const DELETE_API_TAG_MEMBERS = `
  DELETE FROM MT_API_TAG_MEMBERS
  WHERE API_ID = :apiId
`;

/**
 * 특정 API의 특정 태그 관계 삭제
 */
export const DELETE_API_TAG_MEMBER = `
  DELETE FROM MT_API_TAG_MEMBERS
  WHERE API_ID = :apiId AND TAG_ID = :tagId
`;

// ============================================================================
// Synthetic Test 태그 관계
// ============================================================================

/**
 * Synthetic Test-태그 관계 생성
 */
export const INSERT_SYNTHETIC_TEST_TAG_MEMBER = `
  INSERT INTO MT_SYNTHETIC_TEST_TAG_MEMBERS (
    SYNTHETIC_TAG_ID,
    TAG_ID,
    SYNTHETIC_TEST_ID,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_SYNTHETIC_TAG_ID.NEXTVAL,
    :tagId,
    :syntheticTestId,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
`;

/**
 * 특정 Synthetic Test의 모든 태그 조회
 */
export const SELECT_SYNTHETIC_TEST_TAGS = `
  SELECT 
    t.TAG_ID AS "tagId",
    t.TAG_NAME AS "tagName"
  FROM MT_TAGS t
  INNER JOIN MT_SYNTHETIC_TEST_TAG_MEMBERS sttm ON t.TAG_ID = sttm.TAG_ID
  WHERE sttm.SYNTHETIC_TEST_ID = :syntheticTestId
  ORDER BY t.TAG_NAME
`;

/**
 * Synthetic Test의 모든 태그 관계 삭제
 */
export const DELETE_SYNTHETIC_TEST_TAG_MEMBERS = `
  DELETE FROM MT_SYNTHETIC_TEST_TAG_MEMBERS
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId
`;

/**
 * 특정 Synthetic Test의 특정 태그 관계 삭제
 */
export const DELETE_SYNTHETIC_TEST_TAG_MEMBER = `
  DELETE FROM MT_SYNTHETIC_TEST_TAG_MEMBERS
  WHERE SYNTHETIC_TEST_ID = :syntheticTestId AND TAG_ID = :tagId
`;

// ============================================================================
// 공통
// ============================================================================

/**
 * 모든 태그 조회
 */
export const SELECT_ALL_TAGS = `
  SELECT 
    TAG_ID AS "tagId",
    TAG_NAME AS "tagName",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_TAGS
  ORDER BY TAG_NAME
`;

/**
 * 태그 삭제
 */
export const DELETE_TAG = `
  DELETE FROM MT_TAGS
  WHERE TAG_ID = :tagId
`;

/**
 * 태그 사용 여부 확인 (노드, API, Synthetic Test에서 사용 중인지 확인)
 */
export const CHECK_TAG_IN_USE = `
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM MT_NODE_TAG_MEMBERS WHERE TAG_ID = :tagId
      ) OR EXISTS (
        SELECT 1 FROM MT_API_TAG_MEMBERS WHERE TAG_ID = :tagId
      ) OR EXISTS (
        SELECT 1 FROM MT_SYNTHETIC_TEST_TAG_MEMBERS WHERE TAG_ID = :tagId
      ) THEN 1
      ELSE 0
    END AS "IN_USE"
  FROM DUAL
`;

/**
 * 사용되지 않는 태그 삭제 (유지보수용)
 */
export const DELETE_UNUSED_TAGS = `
  DELETE FROM MT_TAGS
  WHERE TAG_ID NOT IN (
    SELECT DISTINCT TAG_ID FROM MT_NODE_TAG_MEMBERS
    UNION
    SELECT DISTINCT TAG_ID FROM MT_API_TAG_MEMBERS
    UNION
    SELECT DISTINCT TAG_ID FROM MT_SYNTHETIC_TEST_TAG_MEMBERS
  )
`;
