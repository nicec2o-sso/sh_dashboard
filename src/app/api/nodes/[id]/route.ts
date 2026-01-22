/**
 * 노드 상세 관리 API
 * 
 * 경로: /api/nodes/[id]
 * 
 * 기능:
 * - GET: 특정 노드 상세 조회
 * - PUT: 노드 수정
 * - DELETE: 노드 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { NodeServiceDB } from '@/services/nodeService.database';

/**
 * GET /api/nodes/[id]
 * 특정 노드 상세 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const nodeId = parseInt(contextParams.id);

    const node = await NodeServiceDB.getNodeById(nodeId);

    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    console.log('[Node Route] Node detail retrieved:', nodeId);

    return NextResponse.json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error('[Node Route] Error fetching node detail:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch node detail',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/nodes/[id]
 * 노드 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const body = await request.json();
    const nodeId = parseInt(contextParams.id);
    
    console.log('[Node Route] Updating node:', contextParams.id, body);

    // 서비스 호출로 노드 수정
    try {
      const updatedNode = await NodeServiceDB.updateNode(nodeId, {
        nodeName: body.nodeName,
        host: body.host,
        port: body.port,
        nodeStatus: body.nodeStatus,
        nodeDesc: body.nodeDesc,
        tags: body.tags,
      });

      return NextResponse.json({
        success: true,
        data: updatedNode,
        message: 'Node updated successfully',
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
    console.error('[Node Route] Error updating node:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update node',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id]
 * 노드 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const nodeId = parseInt(contextParams.id);

    try {
      await NodeServiceDB.deleteNode(nodeId);

      console.log('[Node Route] Node deleted:', nodeId);

      return NextResponse.json({
        success: true,
        message: 'Node deleted successfully',
        data: { nodeId },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, error: 'Node not found' },
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
    console.error('[Node Route] Error deleting node:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete node',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
