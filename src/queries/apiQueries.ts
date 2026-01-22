/**
 * API 관리 쿼리
 * 
 * 이 파일은 API 관리 화면에서 사용하는 모든 SQL 쿼리를 관리합니다.
 * API와 API 파라미터 관련 CRUD 작업을 처리합니다.
 */

import oracledb from 'oracledb';

/**
 * API 목록 조회 (태그 포함)
 * LISTAGG를 사용하여 태그를 콤마로 구분된 문자열로 반환
 */
export const SELECT_APIS_WITH_TAGS = `
  SELECT 
    a.API_ID AS "apiId",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS "method",
    a.CREATED_AT AS "createdAt",
    a.UPDATED_AT AS "updatedAt",
    count(ap.API_PARAMETER_ID) AS "apiParameterCount",
    LISTAGG(ap.API_PARAMETER_ID, ',') WITHIN GROUP (ORDER BY ap.API_PARAMETER_ID) AS "apiParameterIds",
    LISTAGG(DISTINCT t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags"
  FROM MT_APIS a
  LEFT JOIN MT_API_PARAMETERS ap ON a.API_ID = ap.API_ID
  LEFT JOIN MT_API_TAG_MEMBERS atm ON a.API_ID = atm.API_ID
  LEFT JOIN MT_TAGS t ON atm.TAG_ID = t.TAG_ID
  GROUP BY a.API_ID, a.API_NAME, a.URI, a.METHOD, a.CREATED_AT, a.UPDATED_AT
  ORDER BY a.CREATED_AT DESC
`;

/**
 * API 목록 조회 (태그 미포함)
 */
export const SELECT_APIS = `
  SELECT 
    a.API_ID AS "apiId",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS "method",
    a.CREATED_AT AS "createdAt",
    a.UPDATED_AT AS "updatedAt",
    LISTAGG(ap.API_PARAMETER_ID, ',') WITHIN GROUP (ORDER BY ap.API_PARAMETER_ID) AS "apiParameterIds"
  FROM MT_APIS a
  LEFT JOIN MT_API_PARAMETERS ap ON a.API_ID = ap.API_ID
  GROUP BY a.API_ID, a.API_NAME, a.URI, a.METHOD, a.CREATED_AT, a.UPDATED_AT
  ORDER BY a.CREATED_AT DESC
`;

/**
 * 특정 API 상세 조회 (태그 포함)
 */
export const SELECT_API_DETAIL_WITH_TAGS = `
  SELECT 
    a.API_ID AS "apiId",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS "method",
    a.CREATED_AT AS "createdAt",
    a.UPDATED_AT AS "updatedAt",
    LISTAGG(DISTINCT t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_NAME) AS "tags",
    ap.API_PARAMETER_ID AS "apiParameterId",
    ap.API_PARAMETER_NAME AS "apiParameterName",
    ap.API_PARAMETER_TYPE AS "apiParameterType",
    ap.API_PARAMETER_REQUIRED AS "apiParameterRequired",
    TO_CHAR(ap.API_PARAMETER_DESC) AS "apiParameterDesc"
  FROM MT_APIS a
  LEFT JOIN MT_API_PARAMETERS ap ON a.API_ID = ap.API_ID
  LEFT JOIN MT_API_TAG_MEMBERS atm ON a.API_ID = atm.API_ID
  LEFT JOIN MT_TAGS t ON atm.TAG_ID = t.TAG_ID
  WHERE a.API_ID = :apiId
  GROUP BY a.API_ID, a.API_NAME, a.URI, a.METHOD, a.CREATED_AT, a.UPDATED_AT,
           ap.API_PARAMETER_ID, ap.API_PARAMETER_NAME, ap.API_PARAMETER_TYPE,
           ap.API_PARAMETER_REQUIRED, TO_CHAR(ap.API_PARAMETER_DESC)
  ORDER BY ap.API_PARAMETER_ID
`;

/**
 * 특정 API 상세 조회
 */
export const SELECT_API_DETAIL = `
  SELECT 
    a.API_ID AS "apiId",
    a.API_NAME AS "apiName",
    a.URI AS "uri",
    a.METHOD AS "method",
    a.CREATED_AT AS "createdAt",
    a.UPDATED_AT AS "updatedAt",
    ap.API_PARAMETER_ID AS "apiParameterId",
    ap.API_PARAMETER_NAME AS "apiParameterName",
    ap.API_PARAMETER_TYPE AS "apiParameterType",
    ap.API_PARAMETER_REQUIRED AS "apiParameterRequired",
    TO_CHAR(ap.API_PARAMETER_DESC) AS "apiParameterDesc"
  FROM MT_APIS a
  LEFT JOIN MT_API_PARAMETERS ap ON a.API_ID = ap.API_ID
  WHERE a.API_ID = :apiId
  ORDER BY ap.API_PARAMETER_ID
`;

/**
 * 특정 API 기본 정보만 조회
 */
export const SELECT_API_BY_ID = `
  SELECT 
    API_ID AS "apiId",
    API_NAME AS "apiName",
    URI AS "uri",
    METHOD AS "method",
    CREATED_AT AS "createdAt",
    UPDATED_AT AS "updatedAt"
  FROM MT_APIS
  WHERE API_ID = :apiId
`;

/**
 * API 생성 (RETURNING INTO 사용)
 */
export const INSERT_API = `
  INSERT INTO MT_APIS (
    API_ID,
    API_NAME,
    URI,
    METHOD,
    CREATED_AT,
    UPDATED_AT
  ) VALUES (
    SEQ_MT_API_ID.NEXTVAL,
    :apiName,
    :uri,
    :method,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  )
  RETURNING API_ID INTO :id
`;

/**
 * OUT 바인드 정의: API 생성
 */
export const INSERT_API_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * API 수정 (RETURNING INTO 사용)
 */
export const UPDATE_API = `
  UPDATE MT_APIS
  SET 
    API_NAME = :apiName,
    URI = :uri,
    METHOD = :method,
    UPDATED_AT = SYSTIMESTAMP
  WHERE API_ID = :apiId
  RETURNING API_ID INTO :updatedId
`;

/**
 * OUT 바인드 정의: API 수정
 */
export const UPDATE_API_BINDS = {
  updatedId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * API 삭제
 */
export const DELETE_API = `
  DELETE FROM MT_APIS
  WHERE API_ID = :apiId
`;

/**
 * API 파라미터 생성 (RETURNING INTO 사용)
 */
export const INSERT_API_PARAMETER = `
  INSERT INTO MT_API_PARAMETERS (
    API_PARAMETER_ID,
    API_ID,
    API_PARAMETER_NAME,
    API_PARAMETER_TYPE,
    API_PARAMETER_REQUIRED,
    API_PARAMETER_DESC,
    CREATED_AT
  ) VALUES (
    SEQ_MT_API_PARAMETER_ID.NEXTVAL,
    :apiId,
    :apiParameterName,
    :apiParameterType,
    :apiParameterRequired,
    :apiParameterDesc,
    SYSTIMESTAMP
  )
  RETURNING API_PARAMETER_ID INTO :id
`;

/**
 * OUT 바인드 정의: API 파라미터 생성
 */
export const INSERT_API_PARAMETER_BINDS = {
  id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
};

/**
 * API 파라미터 수정
 */
export const UPDATE_API_PARAMETER = `
  UPDATE MT_API_PARAMETERS
  SET 
    API_PARAMETER_NAME = :apiParameterName,
    API_PARAMETER_TYPE = :apiParameterType,
    API_PARAMETER_REQUIRED = :apiParameterRequired,
    API_PARAMETER_DESC = :apiParameterDesc
  WHERE API_PARAMETER_ID = :apiParameterId
`;

/**
 * API 파라미터 삭제
 */
export const DELETE_API_PARAMETER = `
  DELETE FROM MT_API_PARAMETERS
  WHERE API_PARAMETER_ID = :apiParameterId
`;

/**
 * 특정 API의 모든 파라미터 삭제
 */
export const DELETE_ALL_API_PARAMETERS = `
  DELETE FROM MT_API_PARAMETERS
  WHERE API_ID = :apiId
`;

/**
 * API 이름 중복 확인
 */
export const CHECK_API_NAME_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM MT_APIS
  WHERE API_NAME = :apiName
  AND (:excludeId IS NULL OR API_ID != :excludeId)
`;

/**
 * API URI + METHOD 조합 중복 확인
 */
export const CHECK_API_URI_METHOD_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM MT_APIS
  WHERE URI = :uri
  AND METHOD = :method
  AND (:excludeId IS NULL OR API_ID != :excludeId)
`;

/**
 * 특정 API의 파라미터 조회 쿼리
 */
export const SELECT_API_PARAMETERS = `
  SELECT 
    API_PARAMETER_ID AS "apiParameterId",
    API_ID AS "apiId",
    API_PARAMETER_NAME AS "apiParameterName",
    API_PARAMETER_TYPE AS "apiParameterType",
    API_PARAMETER_REQUIRED AS "apiParameterRequired",
    TO_CHAR(API_PARAMETER_DESC) AS "apiParameterDesc",
    CREATED_AT AS "createdAt"
  FROM MT_API_PARAMETERS
  WHERE API_ID = :apiId
  ORDER BY API_PARAMETER_ID
`;

/**
 * 파라미터 ID 목록으로 조회
 */
export const SELECT_PARAMETERS_BY_IDS = `
  SELECT 
    API_PARAMETER_ID AS "apiParameterId",
    API_ID AS "apiId",
    API_PARAMETER_NAME AS "apiParameterName",
    API_PARAMETER_TYPE AS "apiParameterType",
    API_PARAMETER_REQUIRED AS "apiParameterRequired",
    TO_CHAR(API_PARAMETER_DESC) AS "apiParameterDesc",
    CREATED_AT AS "createdAt"
  FROM MT_API_PARAMETERS
  WHERE API_PARAMETER_ID IN (:ids)
  ORDER BY API_PARAMETER_ID
`;

/**
 * API가 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_API_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(SYNTHETIC_TEST_NAME, ', ') WITHIN GROUP (ORDER BY SYNTHETIC_TEST_NAME) AS "testNames"
  FROM MT_SYNTHETIC_TESTS
  WHERE API_ID = :apiId
  GROUP BY API_ID
`;
