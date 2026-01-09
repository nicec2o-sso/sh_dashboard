/**
 * Synthetic Test 상세 관리 API
 * 
 * 경로: /api/synthetic-tests/[id]
 * 
 * 기능:
 * - GET: 특정 합성 테스트 상세 조회
 * - PUT: 합성 테스트 수정
 * - DELETE: 합성 테스트 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestServiceDB } from '@/services/syntheticTestService.database';

/**
 * GET /api/synthetic-tests/[id]
 * 특정 합성 테스트 상세 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const syntheticTestId = parseInt(contextParams.id);

    const test = await SyntheticTestServiceDB.getSyntheticTestById(syntheticTestId);

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Synthetic test not found' },
        { status: 404 }
      );
    }

    console.log('[SyntheticTest Route] Test detail retrieved:', syntheticTestId);

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('[SyntheticTest Route] Error fetching test detail:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch synthetic test detail',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/synthetic-tests/[id]
 * 합성 테스트 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const body = await request.json();
    const syntheticTestId = parseInt(contextParams.id);
    
    console.log('[SyntheticTest Route] Updating test:', contextParams.id, body);

    // 서비스 호출로 합성 테스트 수정
    try {
      const updatedTest = await SyntheticTestServiceDB.updateSyntheticTest(syntheticTestId, {
        syntheticTestName: body.syntheticTestName,
        targetType: body.targetType,
        targetId: body.targetId,
        apiId: body.apiId,
        tags: body.tags,
        intervalSeconds: body.intervalSeconds,
        alertThresholdMs: body.alertThresholdMs,
        syntheticTestEnabled: body.syntheticTestEnabled,
      });

      return NextResponse.json({
        success: true,
        data: updatedTest,
        message: 'Synthetic test updated successfully',
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
    console.error('[SyntheticTest Route] Error updating test:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update synthetic test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synthetic-tests/[id]
 * 합성 테스트 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const syntheticTestId = parseInt(contextParams.id);

    try {
      await SyntheticTestServiceDB.deleteSyntheticTest(syntheticTestId);

      console.log('[SyntheticTest Route] Test deleted:', syntheticTestId);

      return NextResponse.json({
        success: true,
        message: 'Synthetic test deleted successfully',
        data: { syntheticTestId },
      });
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, error: 'Synthetic test not found' },
            { status: 404 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('[SyntheticTest Route] Error deleting test:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete synthetic test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
