import { NextRequest, NextResponse } from 'next/server';
import { NodeService } from '@/services/nodeService';

/**
 * POST /api/nodes/[id]/health - 노드 헬스체크
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const nodeId = parseInt(idStr);
    const node = NodeService.getNodeById(nodeId);

    if (!node) {
      return NextResponse.json(
        { success: false, error: '노드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const nodeStatus = await NodeService.checkNodeHealth(nodeId);
    return NextResponse.json({
      success: true,
      data: {
        nodeId: nodeId,
        nodeStatus: nodeStatus,
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
