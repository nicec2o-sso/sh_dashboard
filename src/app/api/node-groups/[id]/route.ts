import { NextRequest, NextResponse } from 'next/server';
import { NodeGroupService } from '@/services/nodeGroupService';
import { UpdateNodeGroupDto } from '@/types';

/**
 * GET /api/node-groups/[id] - 특정 노드 그룹 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 그룹 ID입니다' },
        { status: 400 }
      );
    }

    const group = NodeGroupService.getNodeGroupById(id);

    if (!group) {
      return NextResponse.json(
        { success: false, error: '노드 그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Get node group error:', error);
    return NextResponse.json(
      { success: false, error: '노드 그룹 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/node-groups/[id] - 노드 그룹 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 그룹 ID입니다' },
        { status: 400 }
      );
    }

    const body: UpdateNodeGroupDto = await request.json();
    console.log('Received body for updating node group:', body);

    // 유효성 검증
    if (body.name !== undefined && !body.name) {
      return NextResponse.json(
        { success: false, error: '그룹 이름은 비어있을 수 없습니다' },
        { status: 400 }
      );
    }

    if (body.nodeIds !== undefined && body.nodeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개의 노드를 선택해야 합니다' },
        { status: 400 }
      );
    }

    const updatedGroup = NodeGroupService.updateNodeGroup(id, body);

    if (!updatedGroup) {
      return NextResponse.json(
        { success: false, error: '노드 그룹을 찾을 수 없거나 수정에 실패했습니다' },
        { status: 404 }
      );
    }

    console.log('Updated node group:', updatedGroup);

    return NextResponse.json({
      success: true,
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Update node group error:', error);
    return NextResponse.json(
      { success: false, error: '노드 그룹 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/node-groups/[id] - 노드 그룹 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 그룹 ID입니다' },
        { status: 400 }
      );
    }

    const deleted = NodeGroupService.deleteNodeGroup(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '노드 그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log('Deleted node group with id:', id);

    return NextResponse.json({
      success: true,
      message: '노드 그룹이 성공적으로 삭제되었습니다',
      data: { id },
    });
  } catch (error) {
    console.error('Delete node group error:', error);
    return NextResponse.json(
      { success: false, error: '노드 그룹 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}