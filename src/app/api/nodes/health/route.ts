import { NextRequest, NextResponse } from 'next/server';
import { NodeService } from '@/services/nodeService';

/**
 * POST /api/nodes/[id]/health - 노드 헬스체크
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const node = NodeService.getNodeById(id);

    if (!node) {
      return NextResponse.json(
        { success: false, error: '노드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const isHealthy = await NodeService.checkNodeHealth(id);
    const updatedNode = NodeService.getNodeById(id);

    return NextResponse.json({
      success: true,
      data: {
        nodeId: id,
        isHealthy,
        status: updatedNode?.status,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '헬스체크 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}