/**
 * Synthetic Test History API
 * 
 * 경로: /api/synthetic-tests/[id]/history
 * 
 * 기능:
 * - GET: 특정 합성 테스트의 실행 이력 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  SyntheticTestServiceDB,
  convertTestHistoryToResponse 
} from '@/services/syntheticTestService.database';

/**
 * GET /api/synthetic-tests/[id]/history
 * 특정 합성 테스트의 실행 이력 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const { searchParams } = new URL(request.url);
    
    const syntheticTestId = parseInt(contextParams.id, 10);

    // limit 파라미터 처리
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid limit parameter. Must be between 1 and 1000.',
        },
        { status: 400 }
      );
    }

    const history = await SyntheticTestServiceDB.getTestHistory(syntheticTestId, limit);

    // DB 결과를 클라이언트용 형식으로 변환 (success: 'Y'/'N' -> boolean)
    const responseData = history.map(convertTestHistoryToResponse);

    console.log('[SyntheticTest Route] Test history retrieved:', syntheticTestId, responseData.length);

    return NextResponse.json({
      success: true,
      data: responseData,
      count: responseData.length,
    });
  } catch (error) {
    console.error('[SyntheticTest Route] Error fetching test history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch test history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
