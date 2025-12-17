import { NextRequest, NextResponse } from 'next/server';
import { NodeService } from '@/services/nodeService';
import { CreateNodeDto, UpdateNodeDto } from '@/types';

/**
 * GET /api/nodes - 모든 노드 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'healthy' | 'warning' | 'error' | null;
    const host = searchParams.get('host');

    let nodes = NodeService.getAllNodes();
    
    // 필터링
    if (status) {
      nodes = NodeService.getNodesByStatus(status);
    }
    if (host) {
      nodes = NodeService.searchNodesByHost(host);
    }

    return NextResponse.json({
      success: true,
      data: nodes,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nodes - 노드 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNodeDto = await request.json();

    // 유효성 검증
    if (!body.name || !body.host || !body.port) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    if (body.port < 1 || body.port > 65535) {
      return NextResponse.json(
        { success: false, error: '올바른 포트 번호를 입력하세요 (1-65535)' },
        { status: 400 }
      );
    }

    const newNode = NodeService.createNode(body);

    return NextResponse.json({
      success: true,
      data: newNode,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}