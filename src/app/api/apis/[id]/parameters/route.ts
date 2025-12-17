// app/api/apis/[id]/parameters/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ApiService } from '@/services/apiService'; // ApiService 경로를 가정
import { ApiParameterService } from '@/services/apiParameterService'; // ApiParameterService 경로를 가정
import { ApiParameter } from '@/types'; // ApiParameter 인터페이스 경로를 가정

/**
 * GET /api/apis/[id]/parameters
 * 특정 API ID에 연결된 모든 파라미터 상세 정보를 조회합니다.
 * * @param request NextRequest 객체
 * @param context 라우트 파라미터를 포함하는 객체. { params: { id: string } } 형태
 * @returns ApiParameter 상세 정보 목록
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  
    const apiId = parseInt((await context.params).id, 10);
    console.log(`[API Route] GET /apis/${apiId}/parameters called`);

  if (isNaN(apiId)) {
    return NextResponse.json(
      { message: '유효하지 않은 API ID입니다.' },
      { status: 400 }
    );
  }

  try {
    // 1. ApiService를 사용하여 API 객체 자체를 조회합니다.
    const api = ApiService.getApiById(apiId);

    if (!api) {
      return NextResponse.json(
        { message: '요청한 API를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const parameterIds = api.apiParameterIds;

    if (parameterIds.length === 0) {
        return NextResponse.json({
            success: true,
            data: [],
            count: 0,
        });
    }

    // 2. ApiParameterService를 사용하여 ID 목록으로 상세 정보를 조회합니다.
    // NOTE: ApiParameterService.getParametersByIds는 number[]를 받도록 변경되었으므로 변환 필요
    const numericIds = parameterIds.filter(id => !isNaN(id));
    const parameters: ApiParameter[] = ApiParameterService.getParametersByIds(numericIds);
    
    return NextResponse.json({
      success: true,
      data: parameters,
      count: parameters.length,
    });
    
  } catch (error) {
    console.error('Error fetching API parameters:', error);
    return NextResponse.json(
      { message: '서버에서 파라미터 정보를 가져오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}