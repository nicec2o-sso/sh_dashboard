import { NextRequest, NextResponse } from 'next/server';
import { NodeGroupService } from '@/services/nodeGroupService';
import { CreateNodeGroupDto } from '@/types';

/**
 * GET /api/node-groups - 모든 노드 그룹 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const nodeId = searchParams.get('nodeId');

    let groups = NodeGroupService.getAllNodeGroups();

    // 필터링
    if (name) {
      groups = NodeGroupService.searchNodeGroupsByName(name);
    }
    if (nodeId) {
      groups = NodeGroupService.getGroupsByNodeId(parseInt(nodeId));
    }

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 그룹 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/node-groups - 노드 그룹 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNodeGroupDto = await request.json();
    console.log('Received body for creating node group:', body);

    // 유효성 검증
    if (!body.name || !body.description) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    if (!body.nodeIds || body.nodeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개의 노드를 선택해야 합니다' },
        { status: 400 }
      );
    }

  
    const newGroup = NodeGroupService.createNodeGroup(body);
    console.log('Created new node group:', newGroup);

    if (!newGroup) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 노드 ID가 포함되어 있습니다' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newGroup,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '노드 그룹 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}