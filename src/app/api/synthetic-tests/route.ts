/**
 * Synthetic Tests 관리 API
 * 
 * 경로: /api/synthetic-tests
 * 
 * 기능:
 * - GET: 합성 테스트 목록 조회
 * - POST: 새 합성 테스트 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestServiceDB } from '@/services/syntheticTestService.database';

/**
 * GET /api/synthetic-tests
 * 합성 테스트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const tests = await SyntheticTestServiceDB.getAllSyntheticTests();

    console.log('[SyntheticTest Route] Synthetic tests retrieved:', tests.length);

    return NextResponse.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error('[SyntheticTest Route] Error fetching synthetic tests:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch synthetic tests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthetic-tests
 * 새 합성 테스트 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[SyntheticTest Route] Creating synthetic test:', body);

    // 서비스 호출로 합성 테스트 생성
    try {
      const newTest = await SyntheticTestServiceDB.createSyntheticTest({
        syntheticTestName: body.syntheticTestName,
        targetType: body.targetType,
        targetId: body.targetId,
        apiId: body.apiId,
        intervalSeconds: body.intervalSeconds,
        alertThresholdMs: body.alertThresholdMs,
        syntheticTestEnabled: body.syntheticTestEnabled,
        tags: body.tags,
      });

      return NextResponse.json(
        {
          success: true,
          data: newTest,
          message: 'Synthetic test created successfully',
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
    console.error('[SyntheticTest Route] Error creating synthetic test:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create synthetic test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
