# 태그 멤버십 테이블 추가 가이드

## 개요

현재 프로젝트에서 노드(`MT_NODES`)는 `MT_NODE_TAG_MEMBERS` 테이블을 통해 태그를 관리하고 있습니다. API와 Synthetic Test도 동일한 방식으로 태그를 관리하기 위해 별도의 멤버십 테이블이 필요합니다.

## 필요한 테이블

### 1. MT_API_TAG_MEMBERS
- API와 태그 간의 다대다 관계 관리
- 하나의 API가 여러 태그를 가질 수 있음

### 2. MT_SYNTHETIC_TEST_TAG_MEMBERS  
- Synthetic Test와 태그 간의 다대다 관계 관리
- 하나의 테스트가 여러 태그를 가질 수 있음

## 실행 방법

### SQL*Plus 또는 SQL Developer
```bash
sqlplus username/password@connection_string @database/add_tag_members_tables.sql
```

### Oracle Cloud Console (Autonomous Database)
1. Oracle Cloud Console에 로그인
2. Autonomous Database 선택
3. "Database Actions" → "SQL" 클릭
4. `database/add_tag_members_tables.sql` 파일 내용을 복사하여 붙여넣기
5. "Run Script" (F5) 실행

## 생성되는 객체

### 시퀀스
```sql
SEQ_MT_API_TAG_ID
SEQ_MT_SYNTHETIC_TEST_TAG_ID
```

### 테이블
```sql
MT_API_TAG_MEMBERS
  - API_TAG_ID (PK)
  - TAG_ID (FK → MT_TAGS)
  - API_ID (FK → MT_APIS)
  - CREATED_AT
  - UPDATED_AT

MT_SYNTHETIC_TEST_TAG_MEMBERS
  - SYNTHETIC_TEST_TAG_ID (PK)
  - TAG_ID (FK → MT_TAGS)
  - SYNTHETIC_TEST_ID (FK → MT_SYNTHETIC_TESTS)
  - CREATED_AT
  - UPDATED_AT
```

## 데이터 마이그레이션 (선택사항)

기존에 `MT_APIS.TAGS` 또는 `MT_SYNTHETIC_TESTS.TAGS` 컬럼에 데이터가 있다면 마이그레이션이 필요합니다:

### API 태그 마이그레이션 예시
```sql
-- 콤마로 구분된 태그 문자열을 개별 관계로 변환
DECLARE
  CURSOR api_cursor IS
    SELECT API_ID, TAGS FROM MT_APIS WHERE TAGS IS NOT NULL;
  v_tag_name VARCHAR2(200);
  v_tag_id NUMBER;
  v_pos NUMBER;
  v_tags VARCHAR2(500);
BEGIN
  FOR api_rec IN api_cursor LOOP
    v_tags := api_rec.TAGS || ',';
    
    WHILE INSTR(v_tags, ',') > 0 LOOP
      v_pos := INSTR(v_tags, ',');
      v_tag_name := TRIM(SUBSTR(v_tags, 1, v_pos - 1));
      v_tags := SUBSTR(v_tags, v_pos + 1);
      
      IF LENGTH(v_tag_name) > 0 THEN
        -- 태그 확인/생성
        BEGIN
          SELECT TAG_ID INTO v_tag_id FROM MT_TAGS WHERE TAG_NAME = v_tag_name;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            INSERT INTO MT_TAGS (TAG_ID, TAG_NAME, CREATED_AT, UPDATED_AT)
            VALUES (SEQ_MT_TAG_ID.NEXTVAL, v_tag_name, SYSTIMESTAMP, SYSTIMESTAMP)
            RETURNING TAG_ID INTO v_tag_id;
        END;
        
        -- 관계 생성
        BEGIN
          INSERT INTO MT_API_TAG_MEMBERS (API_TAG_ID, TAG_ID, API_ID, CREATED_AT, UPDATED_AT)
          VALUES (SEQ_MT_API_TAG_ID.NEXTVAL, v_tag_id, api_rec.API_ID, SYSTIMESTAMP, SYSTIMESTAMP);
        EXCEPTION
          WHEN DUP_VAL_ON_INDEX THEN
            NULL; -- 중복 무시
        END;
      END IF;
    END LOOP;
  END LOOP;
  
  COMMIT;
  DBMS_OUTPUT.PUT_LINE('API tags migration completed');
END;
/
```

### Synthetic Test 태그 마이그레이션 예시
```sql
-- 위와 유사한 로직으로 SYNTHETIC_TEST_ID 사용
DECLARE
  CURSOR test_cursor IS
    SELECT SYNTHETIC_TEST_ID, TAGS FROM MT_SYNTHETIC_TESTS WHERE TAGS IS NOT NULL;
  v_tag_name VARCHAR2(200);
  v_tag_id NUMBER;
  v_pos NUMBER;
  v_tags VARCHAR2(500);
BEGIN
  FOR test_rec IN test_cursor LOOP
    v_tags := test_rec.TAGS || ',';
    
    WHILE INSTR(v_tags, ',') > 0 LOOP
      v_pos := INSTR(v_tags, ',');
      v_tag_name := TRIM(SUBSTR(v_tags, 1, v_pos - 1));
      v_tags := SUBSTR(v_tags, v_pos + 1);
      
      IF LENGTH(v_tag_name) > 0 THEN
        BEGIN
          SELECT TAG_ID INTO v_tag_id FROM MT_TAGS WHERE TAG_NAME = v_tag_name;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            INSERT INTO MT_TAGS (TAG_ID, TAG_NAME, CREATED_AT, UPDATED_AT)
            VALUES (SEQ_MT_TAG_ID.NEXTVAL, v_tag_name, SYSTIMESTAMP, SYSTIMESTAMP)
            RETURNING TAG_ID INTO v_tag_id;
        END;
        
        BEGIN
          INSERT INTO MT_SYNTHETIC_TEST_TAG_MEMBERS (
            SYNTHETIC_TEST_TAG_ID, TAG_ID, SYNTHETIC_TEST_ID, CREATED_AT, UPDATED_AT
          ) VALUES (
            SEQ_MT_SYNTHETIC_TEST_TAG_ID.NEXTVAL, v_tag_id, test_rec.SYNTHETIC_TEST_ID, 
            SYSTIMESTAMP, SYSTIMESTAMP
          );
        EXCEPTION
          WHEN DUP_VAL_ON_INDEX THEN
            NULL;
        END;
      END IF;
    END LOOP;
  END LOOP;
  
  COMMIT;
  DBMS_OUTPUT.PUT_LINE('Synthetic test tags migration completed');
END;
/
```

## TAGS 컬럼 삭제 (마이그레이션 후)

데이터 마이그레이션이 완료되면 기존 TAGS 컬럼을 삭제할 수 있습니다:

```sql
-- 백업 권장
CREATE TABLE MT_APIS_BACKUP AS SELECT * FROM MT_APIS;
CREATE TABLE MT_SYNTHETIC_TESTS_BACKUP AS SELECT * FROM MT_SYNTHETIC_TESTS;

-- TAGS 컬럼 삭제
ALTER TABLE MT_APIS DROP COLUMN TAGS;
ALTER TABLE MT_SYNTHETIC_TESTS DROP COLUMN TAGS;
```

## 확인

테이블과 시퀀스가 정상적으로 생성되었는지 확인:

```sql
-- 테이블 확인
SELECT table_name FROM user_tables 
WHERE table_name IN (
  'MT_API_TAG_MEMBERS',
  'MT_SYNTHETIC_TEST_TAG_MEMBERS'
)
ORDER BY table_name;

-- 시퀀스 확인
SELECT sequence_name FROM user_sequences 
WHERE sequence_name IN (
  'SEQ_MT_API_TAG_ID',
  'SEQ_MT_SYNTHETIC_TEST_TAG_ID'
)
ORDER BY sequence_name;

-- 데이터 확인 (마이그레이션 후)
SELECT 'API Tags' AS TYPE, COUNT(*) AS COUNT FROM MT_API_TAG_MEMBERS
UNION ALL
SELECT 'Test Tags' AS TYPE, COUNT(*) AS COUNT FROM MT_SYNTHETIC_TEST_TAG_MEMBERS;
```

## 애플리케이션 코드

테이블 생성 후에는 애플리케이션 코드를 업데이트하여 새로운 멤버십 테이블을 사용하도록 해야 합니다. 코드는 노드 태그 처리와 동일한 방식으로 작동합니다.

## 주의사항

1. **백업**: 프로덕션 환경에서는 반드시 데이터를 백업한 후 실행
2. **외래 키**: SYNTHETIC_TEST_ID 컬럼명이 실제 테이블과 일치하는지 확인 필요
3. **마이그레이션**: 기존 TAGS 데이터가 있다면 반드시 마이그레이션 후 컬럼 삭제
4. **테스트**: 개발 환경에서 먼저 테스트 후 프로덕션 적용

## 문제 해결

### FK 제약 조건 에러
```sql
-- MT_SYNTHETIC_TESTS의 실제 PK 컬럼명 확인
SELECT column_name FROM user_cons_columns
WHERE constraint_name = (
  SELECT constraint_name FROM user_constraints
  WHERE table_name = 'MT_SYNTHETIC_TESTS' AND constraint_type = 'P'
);
```

컬럼명이 `ID`라면 스크립트의 `SYNTHETIC_TEST_ID`를 `ID`로 변경해야 합니다.
