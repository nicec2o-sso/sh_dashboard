# API 엔드포인트 상세 문서

## 목차
- [노드 관리 API](#노드-관리-api)
- [노드 그룹 관리 API](#노드-그룹-관리-api)
- [API 관리 API](#api-관리-api)
- [합성 테스트 관리 API](#합성-테스트-관리-api)
- [모니터링 API](#모니터링-api)

---

## 노드 관리 API

### 1. 노드 목록 조회
```
GET /api/nodes
```

**Query Parameters:**
- `status` (optional): 'healthy' | 'warning' | 'error' - 상태별 필터링
- `host` (optional): string - 호스트명으로 검색

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Web Server 1",
      "host": "192.168.1.10",
      "port": 8080,
      "status": "healthy",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 노드 생성
```
POST /api/nodes
```

**Request Body:**
```json
{
  "name": "API Server",
  "host": "192.168.1.100",
  "port": 8080
}
```

**Validation:**
- `name`: required, non-empty string
- `host`: required, non-empty string
- `port`: required, number (1-65535)

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "API Server",
    "host": "192.168.1.100",
    "port": 8080,
    "status": "healthy",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 노드 상세 조회
```
GET /api/nodes/[id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Web Server 1",
    "host": "192.168.1.10",
    "port": 8080,
    "status": "healthy",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 노드 수정
```
PATCH /api/nodes/[id]
```

**Request Body:** (모든 필드 optional)
```json
{
  "name": "Updated Server",
  "host": "192.168.1.200",
  "port": 9090,
  "status": "warning"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Server",
    "host": "192.168.1.200",
    "port": 9090,
    "status": "warning",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. 노드 삭제
```
DELETE /api/nodes/[id]
```

**Response:**
```json
{
  "success": true,
  "message": "노드가 삭제되었습니다"
}
```

### 6. 노드 헬스체크
```
POST /api/nodes/[id]/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "isHealthy": true,
    "status": "healthy",
    "checkedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 노드 그룹 관리 API

### 1. 노드 그룹 목록 조회
```
GET /api/node-groups
```

**Query Parameters:**
- `name` (optional): string - 이름으로 검색
- `nodeId` (optional): number - 특정 노드가 속한 그룹 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Web Cluster",
      "description": "All web servers",
      "nodeIds": [1, 2],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 노드 그룹 생성
```
POST /api/node-groups
```

**Request Body:**
```json
{
  "name": "API Cluster",
  "description": "API server cluster",
  "nodeIds": [1, 2, 3]
}
```

**Validation:**
- `name`: required, non-empty string
- `description`: required, non-empty string
- `nodeIds`: required, non-empty array, 모든 노드 ID가 존재해야 함

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "API Cluster",
    "description": "API server cluster",
    "nodeIds": [1, 2, 3],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 노드 그룹 상세 조회
```
GET /api/node-groups/[id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Web Cluster",
    "description": "All web servers",
    "nodeIds": [1, 2],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "nodes": [
      {
        "id": 1,
        "name": "Web Server 1",
        "host": "192.168.1.10",
        "port": 8080,
        "status": "healthy"
      }
    ]
  }
}
```

### 4. 노드 그룹 수정
```
PATCH /api/node-groups/[id]
```

**Request Body:** (모든 필드 optional)
```json
{
  "name": "Updated Cluster",
  "description": "Updated description",
  "nodeIds": [1, 2, 3, 4]
}
```

### 5. 노드 그룹 삭제
```
DELETE /api/node-groups/[id]
```

### 6. 노드 그룹에 노드 추가
```
POST /api/node-groups/[id]/nodes
```

**Request Body:**
```json
{
  "nodeId": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Web Cluster",
    "description": "All web servers",
    "nodeIds": [1, 2, 5],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. 노드 그룹에서 노드 제거
```
DELETE /api/node-groups/[id]/nodes/[nodeId]
```

---

## API 관리 API

### 1. API 목록 조회
```
GET /api/apis
```

**Query Parameters:**
- `targetType` (optional): 'node' | 'group'
- `targetId` (optional): number
- `method` (optional): 'GET' | 'POST' | 'PUT' | 'DELETE'
- `uri` (optional): string - URI로 검색
- `name` (optional): string - 이름으로 검색

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Health Check",
      "uri": "/health",
      "method": "GET",
      "targetType": "group",
      "targetId": 1,
      "parameters": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. API 생성
```
POST /api/apis
```

**Request Body:**
```json
{
  "name": "User API",
  "uri": "/api/users",
  "method": "POST",
  "targetType": "node",
  "targetId": 1,
  "parameters": [
    {
      "name": "userId",
      "type": "body",
      "required": true,
      "description": "사용자 ID"
    },
    {
      "name": "filter",
      "type": "query",
      "required": false,
      "description": "필터링 조건"
    }
  ]
}
```

**Validation:**
- `name`: required, non-empty string
- `uri`: required, must start with '/'
- `method`: required, 'GET' | 'POST' | 'PUT' | 'DELETE'
- `targetType`: required, 'node' | 'group'
- `targetId`: required, must exist
- `parameters`: array of ApiParameter objects

**Response:** (201 Created)

### 3. API 상세 조회
```
GET /api/apis/[id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Health Check",
    "uri": "/health",
    "method": "GET",
    "targetType": "group",
    "targetId": 1,
    "parameters": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "targetInfo": {
      "type": "그룹",
      "name": "Web Cluster"
    }
  }
}
```

### 4. API 수정
```
PATCH /api/apis/[id]
```

### 5. API 삭제
```
DELETE /api/apis/[id]
```

### 6. API 실행
```
POST /api/apis/[id]/execute
```

**Request Body:**
```json
{
  "parameters": {
    "period": "24h",
    "format": "json"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiId": 1,
    "apiName": "Get Metrics",
    "executedAt": "2024-01-01T00:00:00.000Z",
    "results": [
      {
        "nodeId": 1,
        "nodeName": "Web Server 1",
        "success": true,
        "responseTime": 125,
        "statusCode": 200,
        "data": {
          "status": "ok",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      }
    ]
  }
}
```

---

## 합성 테스트 관리 API

### 1. 합성 테스트 목록 조회
```
GET /api/synthetic-tests
```

**Query Parameters:**
- `tag` (optional): string - 태그로 필터링
- `targetType` (optional): 'node' | 'group'
- `targetId` (optional): number
- `apiId` (optional): number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Web Health Monitor",
      "targetType": "group",
      "targetId": 1,
      "apiId": 1,
      "tags": ["production", "critical"],
      "intervalSeconds": 60,
      "alertThresholdMs": 200,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 합성 테스트 생성
```
POST /api/synthetic-tests
```

**Request Body:**
```json
{
  "name": "DB Health Check",
  "targetType": "node",
  "targetId": 3,
  "apiId": 3,
  "tags": ["database", "critical"],
  "intervalSeconds": 300,
  "alertThresholdMs": 150
}
```

**Validation:**
- `name`: required, non-empty string
- `targetType`: required, 'node' | 'group'
- `targetId`: required, must exist
- `apiId`: required, must exist
- `tags`: array of strings
- `intervalSeconds`: required, minimum 10
- `alertThresholdMs`: required, minimum 0

**Response:** (201 Created)

### 3. 합성 테스트 상세 조회
```
GET /api/synthetic-tests/[id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test": {
      "id": 1,
      "name": "Web Health Monitor",
      "targetType": "group",
      "targetId": 1,
      "apiId": 1,
      "tags": ["production", "critical"],
      "intervalSeconds": 60,
      "alertThresholdMs": 200,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "statistics": {
      "totalExecutions": 145,
      "successRate": 98.6,
      "averageResponseTime": 125.5,
      "maxResponseTime": 280,
      "minResponseTime": 45
    },
    "hasAlerts": false,
    "alertCount": 0
  }
}
```

### 4. 합성 테스트 수정
```
PATCH /api/synthetic-tests/[id]
```

### 5. 합성 테스트 삭제
```
DELETE /api/synthetic-tests/[id]
```

### 6. 합성 테스트 실행
```
POST /api/synthetic-tests/[id]/execute
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": 1,
    "testName": "Web Health Monitor",
    "executedAt": "2024-01-01T00:00:00.000Z",
    "results": [
      {
        "id": "1-1-1001",
        "testId": 1,
        "nodeId": 1,
        "responseTimeMs": 125,
        "statusCode": 200,
        "success": true,
        "executedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 7. 테스트 결과 조회
```
GET /api/synthetic-tests/[id]/execute
```

**Query Parameters:**
- `nodeId` (optional): number - 특정 노드의 결과만 조회
- `limit` (optional): number - 결과 개수 제한
- `hours` (optional): number - 최근 N시간 결과 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": 1,
    "testName": "Web Health Monitor",
    "totalResults": 145,
    "results": [
      {
        "id": "1-1-1001",
        "testId": 1,
        "nodeId": 1,
        "responseTimeMs": 125,
        "statusCode": 200,
        "success": true,
        "executedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 8. 테스트 통계 조회
```
GET /api/synthetic-tests/[id]/statistics
```

**Query Parameters:**
- `hours` (optional): number - 통계 기간 (기본값: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": 1,
    "testName": "Web Health Monitor",
    "period": "24시간",
    "statistics": {
      "totalExecutions": 145,
      "successRate": 98.6,
      "averageResponseTime": 125.5,
      "maxResponseTime": 280,
      "minResponseTime": 45
    },
    "alerts": {
      "count": 2,
      "recent": [
        {
          "id": "1-1-1050",
          "testId": 1,
          "nodeId": 1,
          "responseTimeMs": 280,
          "statusCode": 200,
          "success": false,
          "executedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 모니터링 API

### 1. 전체 모니터링 상태 조회
```
GET /api/monitoring/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "nodes": {
      "total": 4,
      "byStatus": {
        "healthy": 3,
        "warning": 1,
        "error": 0
      }
    },
    "tests": {
      "total": 2,
      "withAlerts": 1
    },
    "testsStatus": [
      {
        "test": {
          "id": 1,
          "name": "Web Health Monitor",
          "targetType": "group",
          "targetId": 1,
          "apiId": 1,
          "tags": ["production", "critical"],
          "intervalSeconds": 60,
          "alertThresholdMs": 200
        },
        "recentResults": [...],
        "statistics": {...},
        "hasAlerts": false
      }
    ]
  }
}
```

---

## 공통 에러 응답

### 400 Bad Request
```json
{
  "success": false,
  "error": "필수 필드가 누락되었습니다"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "노드를 찾을 수 없습니다"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "서버 내부 오류가 발생했습니다"
}
```

---

## 개발 팁

### 1. Postman/Thunder Client 사용
모든 엔드포인트를 Postman 컬렉션으로 import하여 테스트할 수 있습니다.

### 2. 필터링 조합
여러 쿼리 파라미터를 조합하여 복잡한 필터링이 가능합니다:
```
GET /api/apis?targetType=node&method=GET&name=health
```

### 3. 페이징 (향후 구현)
현재는 전체 데이터를 반환하지만, 향후 `page`, `limit` 파라미터 추가 예정

### 4. 정렬 (향후 구현)
`sortBy`, `sortOrder` 파라미터를 통한 정렬 기능 추가 예정