/**
 * 노드 관리 API
 * 
 * 경로: /api/nodes
 * 
 * 기능:
 * - GET: 노드 목록 조회
 * - POST: 새 노드 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { NodeServiceDB } from '@/services/nodeService.database';

/**
 * GET /api/nodes
 * 노드 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const nodes = await NodeServiceDB.getAllNodes();

    console.log('[Node Route] Nodes retrieved:', nodes.length);

    return NextResponse.json({
      success: true,
      data: nodes,
    });
  } catch (error) {
    console.error('[Node Route] Error fetching nodes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch nodes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nodes
 * 새 노드 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Node Route] Creating node:', body);

    // 서비스 호출로 노드 생성
    try {
      const newNode = await NodeServiceDB.createNode({
        nodeName: body.nodeName,
        host: body.host,
        port: body.port,
        nodeStatus: body.nodeStatus,
        nodeDesc: body.nodeDesc,
        tags: body.tags,
      });

      return NextResponse.json(
        {
          success: true,
          data: newNode,
          message: 'Node created successfully',
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
    console.error('[Node Route] Error creating node:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create node',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
