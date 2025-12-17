import { NextRequest, NextResponse } from 'next/server';
import { NodeService } from '@/services/nodeService';
import { UpdateNodeDto } from '@/types';

/**
 * GET /api/nodes/[id] - 특정 노드 조회
 */
export async function GET(
  request: NextRequest,
   context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);

    const node = NodeService.getNodeById(id);

    if (!node) {
      return NextResponse.json(
        { success: false, error: '노드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: node,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/nodes/[id] - 노드 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);
    const body: UpdateNodeDto = await request.json();

    // 포트 유효성 검증
    if (body.port !== undefined && (body.port < 1 || body.port > 65535)) {
      return NextResponse.json(
        { success: false, error: '올바른 포트 번호를 입력하세요 (1-65535)' },
        { status: 400 }
      );
    }

    const updatedNode = NodeService.updateNode(id, body);

    if (!updatedNode) {
      return NextResponse.json(
        { success: false, error: '노드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedNode,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id] - 노드 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);

    const deleted = NodeService.deleteNode(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '노드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '노드가 삭제되었습니다',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}