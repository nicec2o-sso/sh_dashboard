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
    a.MNG_DOM_API_ID AS "apiId",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS "method",
    a.REG_DDTS AS "createdAt",
    a.CHG_DDTS AS "updatedAt",
    count(ap.MNG_DOM_API_INP_ID) AS "apiParameterCount",
    LISTAGG(ap.MNG_DOM_API_INP_ID, ',') WITHIN GROUP (ORDER BY ap.MNG_DOM_API_INP_ID) AS "apiParameterIds",
    LISTAGG(DISTINCT t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags"
  FROM TWAA0007M00 a
  LEFT JOIN TWAA0006M00 ap ON a.MNG_DOM_API_ID = ap.MNG_DOM_API_ID
  LEFT JOIN TWAA0008M00 atm ON a.MNG_DOM_API_ID = atm.MPG_MNG_DOM_API_ID
  LEFT JOIN TWAA0003M00 t ON atm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  GROUP BY a.MNG_DOM_API_ID, a.MNG_DOM_API_NM, a.MNG_DOM_API_URL, a.HTTP_METHD_NM, a.REG_DDTS, a.CHG_DDTS
  ORDER BY a.REG_DDTS DESC
`;

/**
 * API 목록 조회 (태그 미포함)
 */
export const SELECT_APIS = `
  SELECT 
    a.MNG_DOM_API_ID AS "apiId",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS "method",
    a.REG_DDTS AS "createdAt",
    a.CHG_DDTS AS "updatedAt",
    LISTAGG(ap.MNG_DOM_API_INP_ID, ',') WITHIN GROUP (ORDER BY ap.MNG_DOM_API_INP_ID) AS "apiParameterIds"
  FROM TWAA0007M00 a
  LEFT JOIN TWAA0006M00 ap ON a.MNG_DOM_API_ID = ap.MNG_DOM_API_ID
  GROUP BY a.MNG_DOM_API_ID, a.MNG_DOM_API_NM, a.MNG_DOM_API_URL, a.HTTP_METHD_NM, a.REG_DDTS, a.CHG_DDTS
  ORDER BY a.REG_DDTS DESC
`;

/**
 * 특정 API 상세 조회 (태그 포함)
 */
export const SELECT_API_DETAIL_WITH_TAGS = `
  SELECT 
    a.MNG_DOM_API_ID AS "apiId",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS "method",
    a.REG_DDTS AS "createdAt",
    a.CHG_DDTS AS "updatedAt",
    LISTAGG(DISTINCT t.MNG_DOM_TAG_NM, ',') WITHIN GROUP (ORDER BY t.MNG_DOM_TAG_NM) AS "tags",
    ap.MNG_DOM_API_INP_ID AS "apiParameterId",
    ap.MNG_DOM_API_INP_NM AS "apiParameterName",
    ap.MNG_DOM_API_INP_TYP_NM AS "apiParameterType",
    ap.MNG_DOM_API_INP_ESN_YN AS "apiParameterRequired",
    TO_CHAR(ap.MNG_DOM_API_INP_DES_CNTT) AS "apiParameterDesc"
  FROM TWAA0007M00 a
  LEFT JOIN TWAA0006M00 ap ON a.MNG_DOM_API_ID = ap.MNG_DOM_API_ID
  LEFT JOIN TWAA0008M00 atm ON a.MNG_DOM_API_ID = atm.MPG_MNG_DOM_API_ID
  LEFT JOIN TWAA0003M00 t ON atm.MPG_MNG_DOM_TAG_ID = t.MNG_DOM_TAG_ID
  WHERE a.MNG_DOM_API_ID = :apiId
  GROUP BY a.MNG_DOM_API_ID, a.MNG_DOM_API_NM, a.MNG_DOM_API_URL, a.HTTP_METHD_NM, a.REG_DDTS, a.CHG_DDTS,
           ap.MNG_DOM_API_INP_ID, ap.MNG_DOM_API_INP_NM, ap.MNG_DOM_API_INP_TYP_NM,
           ap.MNG_DOM_API_INP_ESN_YN, TO_CHAR(ap.MNG_DOM_API_INP_DES_CNTT)
  ORDER BY ap.MNG_DOM_API_INP_ID
`;

/**
 * 특정 API 상세 조회
 */
export const SELECT_API_DETAIL = `
  SELECT 
    a.MNG_DOM_API_ID AS "apiId",
    a.MNG_DOM_API_NM AS "apiName",
    a.MNG_DOM_API_URL AS "uri",
    a.HTTP_METHD_NM AS "method",
    a.REG_DDTS AS "createdAt",
    a.CHG_DDTS AS "updatedAt",
    ap.MNG_DOM_API_INP_ID AS "apiParameterId",
    ap.MNG_DOM_API_INP_NM AS "apiParameterName",
    ap.MNG_DOM_API_INP_TYP_NM AS "apiParameterType",
    ap.MNG_DOM_API_INP_ESN_YN AS "apiParameterRequired",
    TO_CHAR(ap.MNG_DOM_API_INP_DES_CNTT) AS "apiParameterDesc"
  FROM TWAA0007M00 a
  LEFT JOIN TWAA0006M00 ap ON a.MNG_DOM_API_ID = ap.MNG_DOM_API_ID
  WHERE a.MNG_DOM_API_ID = :apiId
  ORDER BY ap.MNG_DOM_API_INP_ID
`;

/**
 * 특정 API 기본 정보만 조회
 */
export const SELECT_API_BY_ID = `
  SELECT 
    MNG_DOM_API_ID AS "apiId",
    MNG_DOM_API_NM AS "apiName",
    MNG_DOM_API_URL AS "uri",
    HTTP_METHD_NM AS "method",
    REG_DDTS AS "createdAt",
    CHG_DDTS AS "updatedAt"
  FROM TWAA0007M00
  WHERE MNG_DOM_API_ID = :apiId
`;

/**
 * API 생성 (RETURNING INTO 사용)
 */
export const INSERT_API = `
  INSERT INTO TWAA0007M00 (
    MNG_DOM_API_ID,
    MNG_DOM_API_NM,
    MNG_DOM_API_URL,
    HTTP_METHD_NM,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_API_ID),0)+1 FROM TWAA0007M00),
    :apiName,
    :uri,
    :method,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    :clientIp,
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
  RETURNING MNG_DOM_API_ID INTO :id
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
  UPDATE TWAA0007M00
  SET 
    MNG_DOM_API_NM = :apiName,
    MNG_DOM_API_URL = :uri,
    HTTP_METHD_NM = :method,
    CHG_USER_IP = :clientIp,
    CHG_DDTS = SYSTIMESTAMP
  WHERE MNG_DOM_API_ID = :apiId
  RETURNING MNG_DOM_API_ID INTO :updatedId
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
  DELETE FROM TWAA0007M00
  WHERE MNG_DOM_API_ID = :apiId
`;

/**
 * API 파라미터 생성 (RETURNING INTO 사용)
 */
export const INSERT_API_PARAMETER = `
  INSERT INTO TWAA0006M00 (
    MNG_DOM_API_INP_ID,
    MNG_DOM_API_ID,
    MNG_DOM_API_INP_NM,
    MNG_DOM_API_INP_TYP_NM,
    MNG_DOM_API_INP_ESN_YN,
    MNG_DOM_API_INP_DES_CNTT,
    REG_USER_ID,
    REG_DDTS,
    CHG_USER_ID,
    CHG_DDTS,
    CHG_USER_IP,
    CHG_GBL_ID
  ) VALUES (
    (SELECT NVL(MAX(MNG_DOM_API_INP_ID),0)+1 FROM TWAA0006M00),
    :apiId,
    :apiParameterName,
    :apiParameterType,
    :apiParameterRequired,
    :apiParameterDesc,
    'system',
    SYSTIMESTAMP,
    'system',
    SYSTIMESTAMP,
    :clientIp,
    REGEXP_REPLACE(SYS_GUID(),'([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})','\\1\\2\\3-\\4-\\5')
  )
  RETURNING MNG_DOM_API_INP_ID INTO :id
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
  UPDATE TWAA0006M00
  SET 
    MNG_DOM_API_INP_NM = :apiParameterName,
    MNG_DOM_API_INP_TYP_NM = :apiParameterType,
    MNG_DOM_API_INP_ESN_YN = :apiParameterRequired,
    MNG_DOM_API_INP_DES_CNTT = :apiParameterDesc
  WHERE MNG_DOM_API_INP_ID = :apiParameterId
`;

/**
 * API 파라미터 삭제
 */
export const DELETE_API_PARAMETER = `
  DELETE FROM TWAA0006M00
  WHERE MNG_DOM_API_INP_ID = :apiParameterId
`;

/**
 * 특정 API의 모든 파라미터 삭제
 */
export const DELETE_ALL_API_PARAMETERS = `
  DELETE FROM TWAA0006M00
  WHERE MNG_DOM_API_ID = :apiId
`;

/**
 * API 이름 중복 확인
 */
export const CHECK_API_NAME_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM TWAA0007M00
  WHERE MNG_DOM_API_NM = :apiName
  AND (:excludeId IS NULL OR MNG_DOM_API_ID != :excludeId)
`;

/**
 * API MNG_DOM_API_URL + HTTP_METHD_NM 조합 중복 확인
 */
export const CHECK_API_URI_METHOD_EXISTS = `
  SELECT COUNT(*) AS COUNT
  FROM TWAA0007M00
  WHERE MNG_DOM_API_URL = :uri
  AND HTTP_METHD_NM = :method
  AND (:excludeId IS NULL OR MNG_DOM_API_ID != :excludeId)
`;

/**
 * 특정 API의 파라미터 조회 쿼리
 */
export const SELECT_API_PARAMETERS = `
  SELECT 
    MNG_DOM_API_INP_ID AS "apiParameterId",
    MNG_DOM_API_ID AS "apiId",
    MNG_DOM_API_INP_NM AS "apiParameterName",
    MNG_DOM_API_INP_TYP_NM AS "apiParameterType",
    MNG_DOM_API_INP_ESN_YN AS "apiParameterRequired",
    TO_CHAR(MNG_DOM_API_INP_DES_CNTT) AS "apiParameterDesc",
    REG_DDTS AS "createdAt"
  FROM TWAA0006M00
  WHERE MNG_DOM_API_ID = :apiId
  ORDER BY MNG_DOM_API_INP_ID
`;

/**
 * 파라미터 ID 목록으로 조회
 */
export const SELECT_PARAMETERS_BY_IDS = `
  SELECT 
    MNG_DOM_API_INP_ID AS "apiParameterId",
    MNG_DOM_API_ID AS "apiId",
    MNG_DOM_API_INP_NM AS "apiParameterName",
    MNG_DOM_API_INP_TYP_NM AS "apiParameterType",
    MNG_DOM_API_INP_ESN_YN AS "apiParameterRequired",
    TO_CHAR(MNG_DOM_API_INP_DES_CNTT) AS "apiParameterDesc",
    REG_DDTS AS "createdAt"
  FROM TWAA0006M00
  WHERE MNG_DOM_API_INP_ID IN (:ids)
  ORDER BY MNG_DOM_API_INP_ID
`;

/**
 * API가 Synthetic Test에서 사용 중인지 확인
 */
export const CHECK_API_USED_IN_SYNTHETIC_TESTS = `
  SELECT 
    COUNT(*) AS COUNT,
    LISTAGG(MNG_DOM_SYNT_TEST_NM, ', ') WITHIN GROUP (ORDER BY MNG_DOM_SYNT_TEST_NM) AS "testNames"
  FROM TWAA0009M00
  WHERE MNG_DOM_API_ID = :apiId
  GROUP BY MNG_DOM_API_ID
`;
