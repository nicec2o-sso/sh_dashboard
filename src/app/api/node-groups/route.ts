/**
 * 노드 그룹 관리 API
 * 
 * 경로: /api/node-groups
 * 
 * 기능:
 * - GET: 노드 그룹 목록 조회
 * - POST: 새 노드 그룹 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { NodeGroupServiceDB } from '@/services/nodeGroupService.database';

/**
 * GET /api/node-groups
 * 노드 그룹 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const nodeGroups = await NodeGroupServiceDB.getAllNodeGroups();

    console.log('[NodeGroup Route] Node groups retrieved:', nodeGroups.length);

    return NextResponse.json({
      success: true,
      data: nodeGroups,
    });
  } catch (error) {
    console.error('[NodeGroup Route] Error fetching node groups:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch node groups',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/node-groups
 * 새 노드 그룹 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[NodeGroup Route] Creating node group:', body);

    // 서비스 호출로 노드 그룹 생성
    try {
      const newNodeGroup = await NodeGroupServiceDB.createNodeGroup({
        nodeGroupName: body.nodeGroupName,
        nodeGroupDesc: body.nodeGroupDesc,
        nodeIds: body.nodeIds,
      });

      return NextResponse.json(
        {
          success: true,
          data: newNodeGroup,
          message: 'Node group created successfully',
        },
        { status: 201 }
      );
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('already exists')) {
          return NextResponse.json(
            { 
              success: false, 
              error: serviceError.message,
            },
            { status: 400 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('[NodeGroup Route] Error creating node group:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create node group',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
