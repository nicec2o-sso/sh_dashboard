/**
 * 노드 그룹 상세 관리 API
 * 
 * 경로: /api/node-groups/[id]
 * 
 * 기능:
 * - GET: 특정 노드 그룹 상세 조회
 * - PUT: 노드 그룹 수정
 * - DELETE: 노드 그룹 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { NodeGroupServiceDB } from '@/services/nodeGroupService.database';

/**
 * GET /api/node-groups/[id]
 * 특정 노드 그룹 상세 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const nodeGroupId = parseInt(contextParams.id);

    const nodeGroup = await NodeGroupServiceDB.getNodeGroupById(nodeGroupId);

    if (!nodeGroup) {
      return NextResponse.json(
        { success: false, error: 'Node group not found' },
        { status: 404 }
      );
    }

    console.log('[NodeGroup Route] Node group detail retrieved:', nodeGroupId);

    return NextResponse.json({
      success: true,
      data: nodeGroup,
    });
  } catch (error) {
    console.error('[NodeGroup Route] Error fetching node group detail:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch node group detail',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/node-groups/[id]
 * 노드 그룹 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const body = await request.json();
    const nodeGroupId = parseInt(contextParams.id);
    
    console.log('[NodeGroup Route] Updating node group:', contextParams.id, body);

    // 서비스 호출로 노드 그룹 수정
    try {
      const updatedNodeGroup = await NodeGroupServiceDB.updateNodeGroup(nodeGroupId, {
        nodeGroupName: body.nodeGroupName,
        nodeGroupDesc: body.nodeGroupDesc,
        nodeIds: body.nodeIds,
      });

      return NextResponse.json({
        success: true,
        data: updatedNodeGroup,
        message: 'Node group updated successfully',
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, error: serviceError.message },
            { status: 404 }
          );
        }
        if (serviceError.message.includes('already exists')) {
          return NextResponse.json(
            { success: false, error: serviceError.message },
            { status: 400 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('[NodeGroup Route] Error updating node group:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update node group',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/node-groups/[id]
 * 노드 그룹 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const nodeGroupId = parseInt(contextParams.id);

    try {
      await NodeGroupServiceDB.deleteNodeGroup(nodeGroupId);

      console.log('[NodeGroup Route] Node group deleted:', nodeGroupId);

      return NextResponse.json({
        success: true,
        message: 'Node group deleted successfully',
        data: { nodeGroupId },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, error: 'Node group not found' },
            { status: 404 }
          );
        } else {
          // 에러 메시지를 그대로 전달
          return NextResponse.json(
            { 
              success: false, 
              message: serviceError.message,
            },
            { status: 400 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('[NodeGroup Route] Error deleting node group:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete node group',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
