/**
 * Node API 라우트 (통합 DB 버전)
 * 
 * 환경변수 USE_DATABASE에 따라 자동으로 MySQL 또는 Altibase를 사용합니다.
 * serviceInitializer가 자동으로 적절한 Repository를 선택하므로
 * 이 파일에서는 데이터베이스 타입을 신경 쓸 필요가 없습니다.
 * 
 * 지원하는 작업:
 * - GET /api/nodes - 모든 노드 조회 (필터링 지원)
 * - POST /api/nodes - 노드 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { nodeService, DATABASE_TYPE } from '@/services/serviceInitializer';
import { CreateNodeDto } from '@/types';

/**
 * GET /api/nodes - 모든 노드 조회
 * 
 * 쿼리 파라미터:
 * - status: 상태별 필터링 (healthy, warning, error)
 * - host: 호스트명으로 검색 (부분 일치)
 * 
 * @example
 * GET /api/nodes
 * GET /api/nodes?status=healthy
 * GET /api/nodes?host=192.168
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'healthy' | 'warning' | 'error' | null;
    const host = searchParams.get('host');

    let nodes;
    
    // 필터링
    if (status) {
      nodes = await nodeService.getNodesByStatus(status);
    } else if (host) {
      nodes = await nodeService.searchNodesByHost(host);
    } else {
      nodes = await nodeService.getAllNodes();
    }

    return NextResponse.json({
      success: true,
      database: DATABASE_TYPE, // 현재 사용 중인 DB 타입 포함
      data: nodes,
    });
  } catch (error) {
    console.error('[API /nodes GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        database: DATABASE_TYPE,
        error: '노드 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nodes - 노드 생성
 * 
 * Request Body:
 * {
 *   "name": "Web Server 1",
 *   "host": "192.168.1.10",
 *   "port": 8080,
 *   "description": "Primary web server" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNodeDto = await request.json();

    // 유효성 검증
    if (!body.name || !body.host || !body.port) {
      return NextResponse.json(
        { 
          success: false, 
          database: DATABASE_TYPE,
          error: '필수 필드가 누락되었습니다 (name, host, port)' 
        },
        { status: 400 }
      );
    }

    if (body.port < 1 || body.port > 65535) {
      return NextResponse.json(
        { 
          success: false, 
          database: DATABASE_TYPE,
          error: '올바른 포트 번호를 입력하세요 (1-65535)' 
        },
        { status: 400 }
      );
    }

    // 노드 생성 (Service가 자동으로 적절한 Repository 사용)
    const newNode = await nodeService.createNode(body);

    return NextResponse.json({
      success: true,
      database: DATABASE_TYPE,
      data: newNode,
    }, { status: 201 });
  } catch (error) {
    console.error('[API /nodes POST] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        database: DATABASE_TYPE,
        error: '노드 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
