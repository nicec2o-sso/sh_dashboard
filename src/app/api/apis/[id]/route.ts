/**
 * API 상세 관리 API
 * 
 * 경로: /api/apis/[id]
 * 
 * 기능:
 * - GET: 특정 API 상세 조회 (태그 포함)
 * - PUT: API 수정 (태그 지원)
 * - DELETE: API 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiServiceDB } from '@/services/apiService.database';

/**
 * GET /api/apis/[id]
 * 특정 API 상세 조회 (태그 포함)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const apiId = parseInt(contextParams.id);

    const api = await ApiServiceDB.getApiById(apiId);

    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log('[API Route] API 상세 retrieved:', apiId);

    return NextResponse.json({
      success: true,
      data: api,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'API 조회 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/apis/[id]
 * API 수정 (태그 지원)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const body = await request.json();
    const apiId = parseInt(contextParams.id);
    
    console.log('[API Route] Updating API:', contextParams.id, body);

    // 서비스 호출로 API 수정
    try {
      const updatedApi = await ApiServiceDB.updateApi(apiId, {
        apiName: body.apiName,
        uri: body.uri,
        method: body.method,
        tags: body.tags,
        parameters: body.parameters,
      });

      return NextResponse.json({
        success: true,
        data: updatedApi,
        message: 'success',
      });
    } catch (serviceError) {
      // 비즈니스 로직 에러 처리
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, message: 'API를 찾을 수 없거나 대상이 유효하지 않습니다' },
            { status: 404 }
          );
        } else if (serviceError.message.includes('already exists')) {
          // 중복 에러 처리
          return NextResponse.json(
            { success: false, message: serviceError.message },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { success: false, message: serviceError.message || 'API 수정 중 오류가 발생했습니다' },
            { status: 500 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apis/[id]
 * API 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const apiId = parseInt(contextParams.id);

    try {
      await ApiServiceDB.deleteApi(apiId);

      console.log('[API Route] API deleted:', apiId);

      return NextResponse.json({
        success: true,
        message: 'API가 삭제되었습니다',
        data: { apiId },
      });
    } catch (serviceError) {
      // 비즈니스 로직 에러 처리
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, message: 'API를 찾을 수 없습니다' },
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
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'API 삭제 중 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}
