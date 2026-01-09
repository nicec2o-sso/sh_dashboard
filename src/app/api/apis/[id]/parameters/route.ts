/**
 * API Parameters API
 * 
 * 경로: /api/apis/[id]/parameters
 * 
 * 기능:
 * - GET: 특정 API의 모든 파라미터 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiServiceDB } from '@/services/apiService.database';
import { ApiParameterServiceDB } from '@/services/apiParameterService.database';

/**
 * GET /api/apis/[id]/parameters
 * 특정 API ID에 연결된 모든 파라미터 상세 정보를 조회합니다.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const apiId = parseInt(contextParams.id, 10);

    console.log(`[API Route] GET /apis/${apiId}/parameters called`);

    // API 존재 확인
    const api = await ApiServiceDB.getApiById(apiId);
    if (!api) {
      return NextResponse.json(
        { success: false, error: ' 요청한 API를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파라미터 조회
    const parameters = await ApiParameterServiceDB.getParametersByApiId(apiId);

    return NextResponse.json({
      success: true,
      data: parameters,
      count: parameters.length,
    });
  } catch (error) {
    console.error('[API Route] Error fetching API parameters:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버에서 파라미터 정보를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
