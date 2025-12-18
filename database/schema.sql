/**
 * Altibase 데이터베이스 테이블 생성 스크립트
 * 
 * 이 파일은 프로젝트에 필요한 모든 테이블을 생성하는 SQL 스크립트입니다.
 * Altibase에서 직접 실행하거나, 마이그레이션 스크립트로 사용할 수 있습니다.
 * 
 * 실행 순서:
 * 1. 기존 테이블 삭제 (DROP TABLE)
 * 2. 시퀀스 생성 (CREATE SEQUENCE)
 * 3. 테이블 생성 (CREATE TABLE)
 * 4. 인덱스 생성 (CREATE INDEX)
 * 5. 외래키 제약조건 생성 (ALTER TABLE ADD CONSTRAINT)
 * 
 * 실행 방법:
 * 1. Altibase iSQL 접속: isql -s localhost -u sys -p manager
 * 2. 스크립트 실행: @/path/to/schema.sql
 * 
 * 또는 코드에서 실행:
 * await db.query(CREATE_TABLES_SQL);
 */

-- ============================================================================
-- 1. 기존 테이블 및 시퀀스 삭제 (재생성을 위해)
-- ============================================================================

-- 외래키 때문에 역순으로 삭제
DROP TABLE IF EXISTS SYNTHETIC_TEST_HISTORY CASCADE;
DROP TABLE IF EXISTS SYNTHETIC_TESTS CASCADE;
DROP TABLE IF EXISTS API_PARAMETERS CASCADE;
DROP TABLE IF EXISTS APIS CASCADE;
DROP TABLE IF EXISTS NODE_GROUPS CASCADE;
DROP TABLE IF EXISTS NODE_GROUP_MEMBERS CASCADE;
DROP TABLE IF EXISTS NODES CASCADE;

-- 시퀀스 삭제
DROP SEQUENCE IF EXISTS SEQ_NODE_ID;
DROP SEQUENCE IF EXISTS SEQ_NODE_GROUP_ID;
DROP SEQUENCE IF EXISTS SEQ_API_ID;
DROP SEQUENCE IF EXISTS SEQ_API_PARAMETER_ID;
DROP SEQUENCE IF EXISTS SEQ_SYNTHETIC_TEST_ID;
DROP SEQUENCE IF EXISTS SEQ_TEST_HISTORY_ID;

-- ============================================================================
-- 2. 시퀀스 생성 (Auto Increment를 위한 시퀀스)
-- ============================================================================

/**
 * 노드 ID 시퀀스
 * 시작값: 1, 증가값: 1, 최대값: 999999999
 */
CREATE SEQUENCE SEQ_NODE_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

/**
 * 노드 그룹 ID 시퀀스
 */
CREATE SEQUENCE SEQ_NODE_GROUP_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

/**
 * API ID 시퀀스
 */
CREATE SEQUENCE SEQ_API_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

/**
 * API 파라미터 ID 시퀀스
 */
CREATE SEQUENCE SEQ_API_PARAMETER_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

/**
 * 합성 테스트 ID 시퀀스
 */
CREATE SEQUENCE SEQ_SYNTHETIC_TEST_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

/**
 * 테스트 이력 ID 시퀀스
 */
CREATE SEQUENCE SEQ_TEST_HISTORY_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  CACHE 20;

-- ============================================================================
-- 3. 테이블 생성
-- ============================================================================

/**
 * NODES 테이블
 * 
 * 시스템 노드(서버, 인스턴스 등)의 정보를 저장합니다.
 * 
 * 컬럼 설명:
 * - ID: 노드 고유 식별자 (Primary Key)
 * - NAME: 노드 이름 (예: "Web Server 1")
 * - HOST: 호스트 주소 (IP 또는 도메인)
 * - PORT: 포트 번호 (1-65535)
 * - STATUS: 노드 상태 (healthy, warning, error)
 * - DESCRIPTION: 노드 설명 (선택사항)
 * - CREATED_AT: 생성 일시
 * - UPDATED_AT: 수정 일시
 */
CREATE TABLE NODES (
  ID            INTEGER       NOT NULL,
  NAME          VARCHAR(200)  NOT NULL,
  HOST          VARCHAR(255)  NOT NULL,
  PORT          INTEGER       NOT NULL,
  STATUS        VARCHAR(20)   DEFAULT 'healthy' NOT NULL,
  DESCRIPTION   VARCHAR(1000),
  CREATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  UPDATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  
  -- 제약 조건
  CONSTRAINT PK_NODES PRIMARY KEY (ID),
  CONSTRAINT CHK_NODES_STATUS CHECK (STATUS IN ('healthy', 'warning', 'error')),
  CONSTRAINT CHK_NODES_PORT CHECK (PORT BETWEEN 1 AND 65535)
);

-- 노드 이름 인덱스 (검색 성능 향상)
CREATE INDEX IDX_NODES_NAME ON NODES(NAME);

-- 노드 호스트 인덱스 (검색 성능 향상)
CREATE INDEX IDX_NODES_HOST ON NODES(HOST);

COMMENT ON TABLE NODES IS '시스템 노드 정보 테이블';
COMMENT ON COLUMN NODES.ID IS '노드 고유 식별자';
COMMENT ON COLUMN NODES.NAME IS '노드 이름';
COMMENT ON COLUMN NODES.HOST IS '호스트 주소 (IP 또는 도메인)';
COMMENT ON COLUMN NODES.PORT IS '포트 번호';
COMMENT ON COLUMN NODES.STATUS IS '노드 상태 (healthy, warning, error)';

/**
 * NODE_GROUPS 테이블
 * 
 * 여러 노드를 논리적으로 그룹화하여 관리합니다.
 * 
 * 컬럼 설명:
 * - ID: 노드 그룹 고유 식별자
 * - NAME: 그룹 이름
 * - DESCRIPTION: 그룹 설명
 * - CREATED_AT: 생성 일시
 * - UPDATED_AT: 수정 일시
 */
CREATE TABLE NODE_GROUPS (
  ID            INTEGER       NOT NULL,
  NAME          VARCHAR(200)  NOT NULL,
  DESCRIPTION   VARCHAR(1000),
  CREATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  UPDATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  
  CONSTRAINT PK_NODE_GROUPS PRIMARY KEY (ID)
);

CREATE INDEX IDX_NODE_GROUPS_NAME ON NODE_GROUPS(NAME);

COMMENT ON TABLE NODE_GROUPS IS '노드 그룹 정보 테이블';

/**
 * NODE_GROUP_MEMBERS 테이블
 * 
 * 노드 그룹과 노드 간의 다대다 관계를 관리합니다.
 * 하나의 노드는 여러 그룹에 속할 수 있습니다.
 * 
 * 컬럼 설명:
 * - GROUP_ID: 노드 그룹 ID (FK)
 * - NODE_ID: 노드 ID (FK)
 * - CREATED_AT: 그룹 멤버 추가 일시
 */
CREATE TABLE NODE_GROUP_MEMBERS (
  GROUP_ID      INTEGER NOT NULL,
  NODE_ID       INTEGER NOT NULL,
  CREATED_AT    DATE    DEFAULT SYSDATE NOT NULL,
  
  CONSTRAINT PK_NODE_GROUP_MEMBERS PRIMARY KEY (GROUP_ID, NODE_ID),
  CONSTRAINT FK_NGM_GROUP FOREIGN KEY (GROUP_ID) REFERENCES NODE_GROUPS(ID) ON DELETE CASCADE,
  CONSTRAINT FK_NGM_NODE FOREIGN KEY (NODE_ID) REFERENCES NODES(ID) ON DELETE CASCADE
);

CREATE INDEX IDX_NGM_NODE ON NODE_GROUP_MEMBERS(NODE_ID);

COMMENT ON TABLE NODE_GROUP_MEMBERS IS '노드 그룹 멤버십 테이블 (다대다 관계)';

/**
 * APIS 테이블
 * 
 * 노드에 대해 실행할 수 있는 HTTP API를 정의합니다.
 * 
 * 컬럼 설명:
 * - ID: API 고유 식별자
 * - NAME: API 이름
 * - URI: API URI 경로 (예: "/api/users")
 * - METHOD: HTTP 메서드 (GET, POST, PUT, DELETE)
 * - CREATED_AT: 생성 일시
 * - UPDATED_AT: 수정 일시
 */
CREATE TABLE APIS (
  ID            INTEGER       NOT NULL,
  NAME          VARCHAR(200)  NOT NULL,
  URI           VARCHAR(500)  NOT NULL,
  METHOD        VARCHAR(10)   NOT NULL,
  CREATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  UPDATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  
  CONSTRAINT PK_APIS PRIMARY KEY (ID),
  CONSTRAINT CHK_APIS_METHOD CHECK (METHOD IN ('GET', 'POST', 'PUT', 'DELETE'))
);

CREATE INDEX IDX_APIS_NAME ON APIS(NAME);
CREATE INDEX IDX_APIS_METHOD ON APIS(METHOD);

COMMENT ON TABLE APIS IS 'API 정의 테이블';

/**
 * API_PARAMETERS 테이블
 * 
 * API 요청 시 필요한 파라미터를 정의합니다.
 * 
 * 컬럼 설명:
 * - ID: 파라미터 고유 식별자
 * - API_ID: 소속된 API ID (FK)
 * - NAME: 파라미터 이름 (예: "userId")
 * - TYPE: 파라미터 타입 (query, body)
 * - REQUIRED: 필수 여부 (Y/N)
 * - DESCRIPTION: 파라미터 설명
 * - CREATED_AT: 생성 일시
 */
CREATE TABLE API_PARAMETERS (
  ID            INTEGER       NOT NULL,
  API_ID        INTEGER       NOT NULL,
  NAME          VARCHAR(100)  NOT NULL,
  TYPE          VARCHAR(20)   NOT NULL,
  REQUIRED      CHAR(1)       DEFAULT 'N' NOT NULL,
  DESCRIPTION   VARCHAR(500),
  CREATED_AT    DATE          DEFAULT SYSDATE NOT NULL,
  
  CONSTRAINT PK_API_PARAMETERS PRIMARY KEY (ID),
  CONSTRAINT FK_APARAM_API FOREIGN KEY (API_ID) REFERENCES APIS(ID) ON DELETE CASCADE,
  CONSTRAINT CHK_APARAM_TYPE CHECK (TYPE IN ('query', 'body')),
  CONSTRAINT CHK_APARAM_REQUIRED CHECK (REQUIRED IN ('Y', 'N'))
);

CREATE INDEX IDX_APARAM_API ON API_PARAMETERS(API_ID);

COMMENT ON TABLE API_PARAMETERS IS 'API 파라미터 정의 테이블';

/**
 * SYNTHETIC_TESTS 테이블
 * 
 * 주기적으로 자동 실행되는 합성 테스트를 정의합니다.
 * 노드 또는 노드 그룹에 대해 API를 주기적으로 실행하여 상태를 모니터링합니다.
 * 
 * 컬럼 설명:
 * - ID: 테스트 고유 식별자
 * - NAME: 테스트 이름
 * - TARGET_TYPE: 대상 타입 (node, group)
 * - TARGET_ID: 대상 ID (NODES.ID 또는 NODE_GROUPS.ID)
 * - API_ID: 실행할 API ID (FK)
 * - INTERVAL_SECONDS: 실행 주기 (초)
 * - ALERT_THRESHOLD_MS: 알림 임계값 (밀리초)
 * - TAGS: 테스트 태그 (쉼표로 구분, 예: "production,critical")
 * - ENABLED: 활성화 여부 (Y/N)
 * - CREATED_AT: 생성 일시
 * - UPDATED_AT: 수정 일시
 */
CREATE TABLE SYNTHETIC_TESTS (
  ID                    INTEGER       NOT NULL,
  NAME                  VARCHAR(200)  NOT NULL,
  TARGET_TYPE           VARCHAR(10)   NOT NULL,
  TARGET_ID             INTEGER       NOT NULL,
  API_ID                INTEGER       NOT NULL,
  INTERVAL_SECONDS      INTEGER       NOT NULL,
  ALERT_THRESHOLD_MS    INTEGER       NOT NULL,
  TAGS                  VARCHAR(500),
  ENABLED               CHAR(1)       DEFAULT 'Y' NOT NULL,
  CREATED_AT            DATE          DEFAULT SYSDATE NOT NULL,
  UPDATED_AT            DATE          DEFAULT SYSDATE NOT NULL,
  
  CONSTRAINT PK_SYNTHETIC_TESTS PRIMARY KEY (ID),
  CONSTRAINT FK_STEST_API FOREIGN KEY (API_ID) REFERENCES APIS(ID) ON DELETE CASCADE,
  CONSTRAINT CHK_STEST_TARGET_TYPE CHECK (TARGET_TYPE IN ('node', 'group')),
  CONSTRAINT CHK_STEST_ENABLED CHECK (ENABLED IN ('Y', 'N'))
);

CREATE INDEX IDX_STEST_TARGET ON SYNTHETIC_TESTS(TARGET_TYPE, TARGET_ID);
CREATE INDEX IDX_STEST_API ON SYNTHETIC_TESTS(API_ID);
CREATE INDEX IDX_STEST_ENABLED ON SYNTHETIC_TESTS(ENABLED);

COMMENT ON TABLE SYNTHETIC_TESTS IS '합성 테스트 정의 테이블';

/**
 * SYNTHETIC_TEST_HISTORY 테이블
 * 
 * 합성 테스트 실행 이력을 저장합니다.
 * 시간에 따른 노드 상태 변화를 추적할 수 있습니다.
 * 
 * 컬럼 설명:
 * - ID: 이력 고유 식별자
 * - TEST_ID: 합성 테스트 ID (FK)
 * - NODE_ID: 실행된 노드 ID (FK)
 * - STATUS_CODE: HTTP 응답 상태 코드
 * - SUCCESS: 성공 여부 (Y/N)
 * - RESPONSE_TIME_MS: 응답 시간 (밀리초)
 * - EXECUTED_AT: 실행 일시
 * - INPUT: 입력 데이터 (JSON 문자열)
 * - OUTPUT: 출력 데이터 (JSON 문자열)
 * - ERROR_MESSAGE: 에러 메시지 (실패 시)
 */
CREATE TABLE SYNTHETIC_TEST_HISTORY (
  ID                INTEGER       NOT NULL,
  TEST_ID           INTEGER       NOT NULL,
  NODE_ID           INTEGER       NOT NULL,
  STATUS_CODE       INTEGER       NOT NULL,
  SUCCESS           CHAR(1)       NOT NULL,
  RESPONSE_TIME_MS  INTEGER       NOT NULL,
  EXECUTED_AT       DATE          DEFAULT SYSDATE NOT NULL,
  INPUT             VARCHAR(4000),
  OUTPUT            VARCHAR(4000),
  ERROR_MESSAGE     VARCHAR(1000),
  
  CONSTRAINT PK_TEST_HISTORY PRIMARY KEY (ID),
  CONSTRAINT FK_THIST_TEST FOREIGN KEY (TEST_ID) REFERENCES SYNTHETIC_TESTS(ID) ON DELETE CASCADE,
  CONSTRAINT FK_THIST_NODE FOREIGN KEY (NODE_ID) REFERENCES NODES(ID) ON DELETE CASCADE,
  CONSTRAINT CHK_THIST_SUCCESS CHECK (SUCCESS IN ('Y', 'N'))
);

-- 테스트별 이력 조회 성능 향상
CREATE INDEX IDX_THIST_TEST ON SYNTHETIC_TEST_HISTORY(TEST_ID, EXECUTED_AT DESC);

-- 노드별 이력 조회 성능 향상
CREATE INDEX IDX_THIST_NODE ON SYNTHETIC_TEST_HISTORY(NODE_ID, EXECUTED_AT DESC);

-- 실행 일시 기준 정렬 성능 향상
CREATE INDEX IDX_THIST_EXECUTED ON SYNTHETIC_TEST_HISTORY(EXECUTED_AT DESC);

COMMENT ON TABLE SYNTHETIC_TEST_HISTORY IS '합성 테스트 실행 이력 테이블';

-- ============================================================================
-- 완료 메시지
-- ============================================================================

-- Altibase에서는 PRINT 대신 SELECT로 메시지 출력
SELECT '테이블 생성 완료!' AS MESSAGE FROM DUAL;
SELECT '다음 단계: insert_sample_data.sql 실행' AS NEXT_STEP FROM DUAL;
