/**
 * API 및 Synthetic Test 태그 멤버십 테이블 추가 스크립트
 * 
 * 기존 schema_oracle.sql에 추가로 실행해야 하는 스크립트입니다.
 * MT_API_TAG_MEMBERS와 MT_SYNTHETIC_TEST_TAG_MEMBERS 테이블을 생성합니다.
 * 
 * 실행 방법:
 * sqlplus username/password@connection_string @add_tag_members_tables.sql
 */

SET ECHO ON
SET SERVEROUTPUT ON

BEGIN
  DBMS_OUTPUT.PUT_LINE('===========================================');
  DBMS_OUTPUT.PUT_LINE('Adding Tag Membership Tables');
  DBMS_OUTPUT.PUT_LINE('===========================================');
END;
/

-- ============================================================================
-- 1. 시퀀스 생성
-- ============================================================================

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 1: Creating sequences...');
END;
/

-- API 태그 멤버십 시퀀스
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_MT_API_TAG_ID';
  DBMS_OUTPUT.PUT_LINE('  - Dropped existing sequence: SEQ_MT_API_TAG_ID');
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE SEQ_MT_API_TAG_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  NOCACHE
  NOCYCLE;

BEGIN
  DBMS_OUTPUT.PUT_LINE('  - Created sequence: SEQ_MT_API_TAG_ID');
END;
/

-- Synthetic Test 태그 멤버십 시퀀스
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_MT_SYNTHETIC_TEST_TAG_ID';
  DBMS_OUTPUT.PUT_LINE('  - Dropped existing sequence: SEQ_MT_SYNTHETIC_TEST_TAG_ID');
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

CREATE SEQUENCE SEQ_MT_SYNTHETIC_TEST_TAG_ID
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 999999999
  NOCACHE
  NOCYCLE;

BEGIN
  DBMS_OUTPUT.PUT_LINE('  - Created sequence: SEQ_MT_SYNTHETIC_TEST_TAG_ID');
END;
/

-- ============================================================================
-- 2. 테이블 생성
-- ============================================================================

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 2: Creating tag membership tables...');
END;
/

/**
 * MT_API_TAG_MEMBERS 테이블
 * 
 * API와 태그 간의 다대다 관계를 관리합니다.
 * 하나의 API는 여러 태그를 가질 수 있습니다.
 * 
 * 컬럼 설명:
 * - API_TAG_ID: API-태그 관계 고유 식별자
 * - TAG_ID: 태그 ID (FK)
 * - API_ID: API ID (FK)
 * - CREATED_AT: 관계 생성 일시
 * - UPDATED_AT: 관계 수정 일시
 */
CREATE TABLE MT_API_TAG_MEMBERS (
  API_TAG_ID    NUMBER(10)    NOT NULL,
  TAG_ID        NUMBER(10)    NOT NULL,
  API_ID        NUMBER(10)    NOT NULL,
  CREATED_AT    TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT    TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT PK_MT_API_TAG_MEMBERS PRIMARY KEY (API_TAG_ID),
  CONSTRAINT UK_API_TAG_MEMBERS UNIQUE (TAG_ID, API_ID),
  CONSTRAINT FK_ATM_TAG FOREIGN KEY (TAG_ID) REFERENCES MT_TAGS(TAG_ID) ON DELETE CASCADE,
  CONSTRAINT FK_ATM_API FOREIGN KEY (API_ID) REFERENCES MT_APIS(API_ID) ON DELETE CASCADE
);

CREATE INDEX IDX_ATM_API ON MT_API_TAG_MEMBERS(API_ID);
CREATE INDEX IDX_ATM_TAG ON MT_API_TAG_MEMBERS(TAG_ID);

COMMENT ON TABLE MT_API_TAG_MEMBERS IS 'API-태그 멤버십 테이블 (다대다 관계)';
COMMENT ON COLUMN MT_API_TAG_MEMBERS.API_TAG_ID IS 'API-태그 관계 고유 식별자';
COMMENT ON COLUMN MT_API_TAG_MEMBERS.TAG_ID IS '태그 ID (FK)';
COMMENT ON COLUMN MT_API_TAG_MEMBERS.API_ID IS 'API ID (FK)';

BEGIN
  DBMS_OUTPUT.PUT_LINE('  - Created table: MT_API_TAG_MEMBERS');
END;
/

/**
 * MT_SYNTHETIC_TEST_TAG_MEMBERS 테이블
 * 
 * Synthetic Test와 태그 간의 다대다 관계를 관리합니다.
 * 하나의 테스트는 여러 태그를 가질 수 있습니다.
 * 
 * 컬럼 설명:
 * - SYNTHETIC_TEST_TAG_ID: 테스트-태그 관계 고유 식별자
 * - TAG_ID: 태그 ID (FK)
 * - SYNTHETIC_TEST_ID: Synthetic Test ID (FK)
 * - CREATED_AT: 관계 생성 일시
 * - UPDATED_AT: 관계 수정 일시
 */
CREATE TABLE MT_SYNTHETIC_TEST_TAG_MEMBERS (
  SYNTHETIC_TEST_TAG_ID   NUMBER(10)    NOT NULL,
  TAG_ID                  NUMBER(10)    NOT NULL,
  SYNTHETIC_TEST_ID       NUMBER(10)    NOT NULL,
  CREATED_AT              TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  UPDATED_AT              TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT PK_MT_SYNTHETIC_TEST_TAG_MEMBERS PRIMARY KEY (SYNTHETIC_TEST_TAG_ID),
  CONSTRAINT UK_SYNTHETIC_TEST_TAG_MEMBERS UNIQUE (TAG_ID, SYNTHETIC_TEST_ID),
  CONSTRAINT FK_STTM_TAG FOREIGN KEY (TAG_ID) REFERENCES MT_TAGS(TAG_ID) ON DELETE CASCADE,
  CONSTRAINT FK_STTM_TEST FOREIGN KEY (SYNTHETIC_TEST_ID) REFERENCES MT_SYNTHETIC_TESTS(SYNTHETIC_TEST_ID) ON DELETE CASCADE
);

CREATE INDEX IDX_STTM_TEST ON MT_SYNTHETIC_TEST_TAG_MEMBERS(SYNTHETIC_TEST_ID);
CREATE INDEX IDX_STTM_TAG ON MT_SYNTHETIC_TEST_TAG_MEMBERS(TAG_ID);

COMMENT ON TABLE MT_SYNTHETIC_TEST_TAG_MEMBERS IS 'Synthetic Test-태그 멤버십 테이블 (다대다 관계)';
COMMENT ON COLUMN MT_SYNTHETIC_TEST_TAG_MEMBERS.SYNTHETIC_TEST_TAG_ID IS '테스트-태그 관계 고유 식별자';
COMMENT ON COLUMN MT_SYNTHETIC_TEST_TAG_MEMBERS.TAG_ID IS '태그 ID (FK)';
COMMENT ON COLUMN MT_SYNTHETIC_TEST_TAG_MEMBERS.SYNTHETIC_TEST_ID IS 'Synthetic Test ID (FK)';

BEGIN
  DBMS_OUTPUT.PUT_LINE('  - Created table: MT_SYNTHETIC_TEST_TAG_MEMBERS');
END;
/

-- ============================================================================
-- 3. 기존 TAGS 컬럼에서 데이터 마이그레이션 (선택사항)
-- ============================================================================

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 3: Data migration (if needed)...');
  DBMS_OUTPUT.PUT_LINE('  - Skipping migration. Manual migration required if TAGS columns have data.');
END;
/

-- ============================================================================
-- 4. TAGS 컬럼 삭제 (선택사항 - 기존 데이터 마이그레이션 후 실행)
-- ============================================================================

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 4: Dropping TAGS columns (optional)...');
  DBMS_OUTPUT.PUT_LINE('  - Skipping. Run manually after data migration:');
  DBMS_OUTPUT.PUT_LINE('    ALTER TABLE MT_APIS DROP COLUMN TAGS;');
  DBMS_OUTPUT.PUT_LINE('    ALTER TABLE MT_SYNTHETIC_TESTS DROP COLUMN TAGS;');
END;
/

-- ============================================================================
-- 완료 메시지
-- ============================================================================

BEGIN
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('===========================================');
  DBMS_OUTPUT.PUT_LINE('Tag Membership Tables Created Successfully!');
  DBMS_OUTPUT.PUT_LINE('===========================================');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Created:');
  DBMS_OUTPUT.PUT_LINE('  - MT_API_TAG_MEMBERS table');
  DBMS_OUTPUT.PUT_LINE('  - MT_SYNTHETIC_TEST_TAG_MEMBERS table');
  DBMS_OUTPUT.PUT_LINE('  - SEQ_MT_API_TAG_ID sequence');
  DBMS_OUTPUT.PUT_LINE('  - SEQ_MT_SYNTHETIC_TEST_TAG_ID sequence');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next steps:');
  DBMS_OUTPUT.PUT_LINE('  1. Update application code to use new tables');
  DBMS_OUTPUT.PUT_LINE('  2. Migrate existing TAGS column data if needed');
  DBMS_OUTPUT.PUT_LINE('  3. Drop TAGS columns after migration');
  DBMS_OUTPUT.PUT_LINE('');
END;
/

-- 생성된 테이블 확인
SELECT 'Created Tables:' AS INFO FROM DUAL;
SELECT table_name FROM user_tables 
WHERE table_name IN (
  'MT_API_TAG_MEMBERS',
  'MT_SYNTHETIC_TEST_TAG_MEMBERS'
)
ORDER BY table_name;

-- 생성된 시퀀스 확인
SELECT 'Created Sequences:' AS INFO FROM DUAL;
SELECT sequence_name FROM user_sequences 
WHERE sequence_name IN (
  'SEQ_MT_API_TAG_ID',
  'SEQ_MT_SYNTHETIC_TEST_TAG_ID'
)
ORDER BY sequence_name;
