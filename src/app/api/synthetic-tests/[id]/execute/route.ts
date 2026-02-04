import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestService } from '@/services/syntheticTestService';
import { SyntheticTestServiceDB } from '@/services/syntheticTestService.database';
import { NodeServiceDB } from '@/services/nodeService.database';
import { NodeGroupServiceDB } from '@/services/nodeGroupService.database';
import { ApiServiceDB } from '@/services/apiService.database';

/**
 * POST /api/synthetic-tests/[id]/execute - 합성 테스트 실행
 */
export async function POST(
 request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await context.params).id, 10);
    let body = await request.json();
    if(!body) {
      body = {};
    }
    
    const test = await SyntheticTestServiceDB.getSyntheticTestById(id);
    if (!test) {
      return NextResponse.json(
        { success: false, error: '합성 테스트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 대상 노드 목록 가져오기
    let targetNodes: any[] = [];
    if (test.targetType === 'node') {
      const node = await NodeServiceDB.getNodeById(test.targetId);
      if (node) targetNodes = [node];
    } else {
      const group = await NodeGroupServiceDB.getNodeGroupById(test.targetId);
      if (group) {
        for (const nodeId of group.nodeIds) {
          const node = await NodeServiceDB.getNodeById(nodeId);
          if (node) targetNodes.push(node);
        }
      }
    }

    if (targetNodes.length === 0) {
      return NextResponse.json(
        { success: false, error: '실행할 대상 노드가 없습니다' },
        { status: 400 }
      );
    }

    // API 정보 가져오기
    const api = await ApiServiceDB.getApiById(test.apiId);
    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 각 노드에 대해 테스트 실행 및 히스토리 저장
    const results = [];
    for (const node of targetNodes) {
      try {
        const result = await SyntheticTestService.executeTest(id, {
          targetNode: node,
          parsedParams: body || {}
        });

        // ✅ 히스토리 저장
        await SyntheticTestServiceDB.createTestHistory({
          syntheticTestId: id,  // ✅ 이제 undefined가 아님!
          nodeId: node.nodeId,
          statusCode: result.statusCode || 0,
          success: result.success ? 'Y' : 'N',
          responseTimeMs: result.responseTimeMs || 0,
          input: JSON.stringify(body || {}),
          output: JSON.stringify(result.data || {})
        });

        results.push(result);
      } catch (error) {
        console.error(`Node ${node.nodeId} 테스트 실행 실패:`, error);
        
        // 실패한 경우에도 히스토리 저장
        await SyntheticTestServiceDB.createTestHistory({
          syntheticTestId: id,
          nodeId: node.nodeId,
          statusCode: 0,
          success: 'N',
          responseTimeMs: 0,
          input: JSON.stringify(body || {}),
          output: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
        });

        results.push({
          nodeId: node.nodeId,
          nodeName: node.nodeName,
          success: false,
          statusCode: 0,
          responseTimeMs: 0,
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        testId: id,
        testName: test.syntheticTestName,
        executedAt: new Date().toISOString().substring(11, 19).split(':').join(''),
        results,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '테스트 실행 중 오류가 발생했습니다' },
      { status: 400 }
    );
  }
}
