// app/api/apis/[id]/execute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ApiService } from '@/services/apiService'; 
import { ApiParameterService } from '@/services/apiParameterService'; 

/**
 * POST /api/apis/[id]/execute - API 실행
 */
export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const apiId = parseInt(contextParams.id, 10);
    
    // 1. 요청 본문(Body) 파싱
    let body;
    try {
        body = await request.json();
    } catch (e) {
        body = {};
    }

    if (!body || !body.parsedParams || typeof body.parsedParams !== 'object') {
        return NextResponse.json(
            { success: false, error: '유효한 API 파라미터(parsedParams)가 요청 본문에 포함되어야 합니다.' },
            { status: 400 }
        );
    }
    
    const parsedParams = body.parsedParams; // 클라이언트가 전달한 실제 파라미터 값
    
    // 2. API 정보 조회
    const api = ApiService.getApiById(apiId);
    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. 파라미터 유효성 검증
    
    // 3-1. apiParameterIds (string[])를 number[]로 변환
    const numericParamIds: number[] = api.apiParameterIds
        .filter(apiId => !isNaN(apiId));
    
    // 3-2. ✅ [변경] ID 목록을 직접 전달하여 유효성 검증 수행
    // 파라미터 상세 정보 조회 로직은 validateParameters 내부로 이동했습니다.
    const validationResult = ApiParameterService.validateParameters(numericParamIds, parsedParams);
    if (!validationResult.valid) {
        return NextResponse.json(
            { 
                success: false, 
                error: '필수 파라미터 누락 또는 유효성 검증 실패',
                data: validationResult,
            },
            { status: 400 }
        );
    }

    // 4. API 실행 (유효성 검증 통과)
    console.log(`Executing API ID ${apiId} with parameters:`, parsedParams);
    const results = await ApiService.executeApi(apiId, body);
  
    return NextResponse.json({
      success: results.success,
      data: {
        apiId: apiId,
        apiName: api.apiName,
        parameters: parsedParams,
        executedAt: new Date().toISOString(),
        results,
      },
    }, { status: results.statusCode });
  } catch (error: any) {
    console.error(`API 실행 중 예외 발생 (ID: ${await context.params.then(p => p.id)}):`, error);

    return NextResponse.json(
      { success: false, error: error.message || 'API 실행 중 알 수 없는 서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}