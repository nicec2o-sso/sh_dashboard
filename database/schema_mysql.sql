/**
 * MySQL 데이터베이스 테이블 생성 스크립트
 * 
 * 이 파일은 프로젝트에 필요한 모든 테이블을 생성하는 SQL 스크립트입니다.
 * MySQL에서 직접 실행하거나, 마이그레이션 도구로 사용할 수 있습니다.
 * 
 * 실행 순서:
 * 1. 데이터베이스 생성 및 선택
 * 2. 기존 테이블 삭제 (DROP TABLE)
 * 3. 테이블 생성 (CREATE TABLE)
 * 4. 인덱스는 테이블 정의 내에 포함
 * 
 * 실행 방법:
 * 1. MySQL 접속: mysql -u root -p
 * 2. 스크립트 실행: source /path/to/schema_mysql.sql
 * 
 * 또는
 * mysql -u root -p < database/schema_mysql.sql
 */

-- ============================================================================
-- 0. 데이터베이스 생성 및 선택
-- ============================================================================

-- 데이터베이스 생성 (존재하지 않는 경우)
CREATE DATABASE IF NOT EXISTS mydb
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 선택
USE mydb;

-- 현재 사용 중인 데이터베이스 확인
SELECT DATABASE() AS current_database;

-- ============================================================================
-- 1. 기존 테이블 삭제 (재생성을 위해)
-- ============================================================================

-- 외래키 때문에 역순으로 삭제
SET FOREIGN_KEY_CHECKS = 0;  -- 외래키 체크 임시 비활성화

DROP TABLE IF EXISTS synthetic_test_history;
DROP TABLE IF EXISTS synthetic_tests;
DROP TABLE IF EXISTS api_parameters;
DROP TABLE IF EXISTS apis;
DROP TABLE IF EXISTS node_group_members;
DROP TABLE IF EXISTS node_groups;
DROP TABLE IF EXISTS nodes;

SET FOREIGN_KEY_CHECKS = 1;  -- 외래키 체크 다시 활성화

-- ============================================================================
-- 2. 테이블 생성
-- ============================================================================

/**
 * nodes 테이블
 * 
 * 시스템 노드(서버, 인스턴스 등)의 정보를 저장합니다.
 * 
 * 컬럼 설명:
 * - id: 노드 고유 식별자 (AUTO_INCREMENT)
 * - name: 노드 이름 (예: "Web Server 1")
 * - host: 호스트 주소 (IP 또는 도메인)
 * - port: 포트 번호 (1-65535)
 * - status: 노드 상태 (healthy, warning, error)
 * - description: 노드 설명 (선택사항)
 * - created_at: 생성 일시 (자동)
 * - updated_at: 수정 일시 (자동 업데이트)
 */
CREATE TABLE nodes (
  id            INT           AUTO_INCREMENT,
  name          VARCHAR(200)  NOT NULL,
  host          VARCHAR(255)  NOT NULL,
  port          INT           NOT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'healthy',
  description   VARCHAR(1000),
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Primary Key
  PRIMARY KEY (id),
  
  -- 인덱스 (검색 성능 향상)
  INDEX idx_nodes_name (name),
  INDEX idx_nodes_host (host),
  
  -- CHECK 제약조건 (MySQL 8.0.16+)
  CHECK (status IN ('healthy', 'warning', 'error')),
  CHECK (port BETWEEN 1 AND 65535)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='시스템 노드 정보 테이블';

/**
 * node_groups 테이블
 * 
 * 여러 노드를 논리적으로 그룹화하여 관리합니다.
 * 
 * 컬럼 설명:
 * - id: 노드 그룹 고유 식별자
 * - name: 그룹 이름
 * - description: 그룹 설명
 * - created_at: 생성 일시
 * - updated_at: 수정 일시
 */
CREATE TABLE node_groups (
  id            INT           AUTO_INCREMENT,
  name          VARCHAR(200)  NOT NULL,
  description   VARCHAR(1000),
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_node_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='노드 그룹 정보 테이블';

/**
 * node_group_members 테이블
 * 
 * 노드 그룹과 노드 간의 다대다 관계를 관리합니다.
 * 하나의 노드는 여러 그룹에 속할 수 있습니다.
 * 
 * 컬럼 설명:
 * - group_id: 노드 그룹 ID (FK)
 * - node_id: 노드 ID (FK)
 * - created_at: 그룹 멤버 추가 일시
 */
CREATE TABLE node_group_members (
  group_id      INT       NOT NULL,
  node_id       INT       NOT NULL,
  created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (group_id, node_id),
  INDEX idx_ngm_node (node_id),
  
  FOREIGN KEY (group_id) REFERENCES node_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='노드 그룹 멤버십 테이블 (다대다 관계)';

/**
 * apis 테이블
 * 
 * 노드에 대해 실행할 수 있는 HTTP API를 정의합니다.
 * 
 * 컬럼 설명:
 * - id: API 고유 식별자
 * - name: API 이름
 * - uri: API URI 경로 (예: "/api/users")
 * - method: HTTP 메서드 (GET, POST, PUT, DELETE)
 * - created_at: 생성 일시
 * - updated_at: 수정 일시
 */
CREATE TABLE apis (
  id            INT           AUTO_INCREMENT,
  name          VARCHAR(200)  NOT NULL,
  uri           VARCHAR(500)  NOT NULL,
  method        VARCHAR(10)   NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_apis_name (name),
  INDEX idx_apis_method (method),
  
  CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='API 정의 테이블';

/**
 * api_parameters 테이블
 * 
 * API 요청 시 필요한 파라미터를 정의합니다.
 * 
 * 컬럼 설명:
 * - id: 파라미터 고유 식별자
 * - api_id: 소속된 API ID (FK)
 * - name: 파라미터 이름 (예: "userId")
 * - type: 파라미터 타입 (query, body)
 * - required: 필수 여부 (BOOLEAN)
 * - description: 파라미터 설명
 * - created_at: 생성 일시
 */
CREATE TABLE api_parameters (
  id            INT           AUTO_INCREMENT,
  api_id        INT           NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  type          VARCHAR(20)   NOT NULL,
  required      BOOLEAN       NOT NULL DEFAULT FALSE,
  description   VARCHAR(500),
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_aparam_api (api_id),
  
  FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE,
  CHECK (type IN ('query', 'body'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='API 파라미터 정의 테이블';

/**
 * synthetic_tests 테이블
 * 
 * 주기적으로 자동 실행되는 합성 테스트를 정의합니다.
 * 노드 또는 노드 그룹에 대해 API를 주기적으로 실행하여 상태를 모니터링합니다.
 * 
 * 컬럼 설명:
 * - id: 테스트 고유 식별자
 * - name: 테스트 이름
 * - target_type: 대상 타입 (node, group)
 * - target_id: 대상 ID (nodes.id 또는 node_groups.id)
 * - api_id: 실행할 API ID (FK)
 * - interval_seconds: 실행 주기 (초)
 * - alert_threshold_ms: 알림 임계값 (밀리초)
 * - tags: 테스트 태그 (쉼표로 구분, 예: "production,critical")
 * - enabled: 활성화 여부 (BOOLEAN)
 * - created_at: 생성 일시
 * - updated_at: 수정 일시
 */
CREATE TABLE synthetic_tests (
  id                    INT           AUTO_INCREMENT,
  name                  VARCHAR(200)  NOT NULL,
  target_type           VARCHAR(10)   NOT NULL,
  target_id             INT           NOT NULL,
  api_id                INT           NOT NULL,
  interval_seconds      INT           NOT NULL,
  alert_threshold_ms    INT           NOT NULL,
  tags                  VARCHAR(500),
  enabled               BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  INDEX idx_stest_target (target_type, target_id),
  INDEX idx_stest_api (api_id),
  INDEX idx_stest_enabled (enabled),
  
  FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE,
  CHECK (target_type IN ('node', 'group'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='합성 테스트 정의 테이블';

/**
 * synthetic_test_history 테이블
 * 
 * 합성 테스트 실행 이력을 저장합니다.
 * 시간에 따른 노드 상태 변화를 추적할 수 있습니다.
 * 
 * 컬럼 설명:
 * - id: 이력 고유 식별자
 * - test_id: 합성 테스트 ID (FK)
 * - node_id: 실행된 노드 ID (FK)
 * - status_code: HTTP 응답 상태 코드
 * - success: 성공 여부 (BOOLEAN)
 * - response_time_ms: 응답 시간 (밀리초)
 * - executed_at: 실행 일시
 * - input: 입력 데이터 (JSON 문자열)
 * - output: 출력 데이터 (JSON 문자열)
 * - error_message: 에러 메시지 (실패 시)
 */
CREATE TABLE synthetic_test_history (
  id                INT           AUTO_INCREMENT,
  test_id           INT           NOT NULL,
  node_id           INT           NOT NULL,
  status_code       INT           NOT NULL,
  success           BOOLEAN       NOT NULL,
  response_time_ms  INT           NOT NULL,
  executed_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  input             TEXT,
  output            TEXT,
  error_message     VARCHAR(1000),
  
  PRIMARY KEY (id),
  
  -- 테스트별 이력 조회 성능 향상 (최신순 정렬)
  INDEX idx_thist_test (test_id, executed_at DESC),
  
  -- 노드별 이력 조회 성능 향상
  INDEX idx_thist_node (node_id, executed_at DESC),
  
  -- 실행 일시 기준 정렬 성능 향상
  INDEX idx_thist_executed (executed_at DESC),
  
  FOREIGN KEY (test_id) REFERENCES synthetic_tests(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='합성 테스트 실행 이력 테이블';

-- ============================================================================
-- 3. 테이블 생성 완료 확인
-- ============================================================================

-- 생성된 테이블 목록 조회
SHOW TABLES;

-- 각 테이블의 구조 확인 (예시)
-- DESC nodes;
-- DESC apis;
-- DESC synthetic_tests;

-- 완료 메시지
SELECT '✅ MySQL 테이블 생성 완료!' AS message;
SELECT '다음 단계: insert_sample_data_mysql.sql 실행' AS next_step;
