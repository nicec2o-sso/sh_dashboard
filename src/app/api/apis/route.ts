/**
 * API 관리 API
 * 
 * 경로: /api/apis
 * 
 * 기능:
 * - GET: API 목록 조회 (태그 포함)
 * - POST: 새 API 생성 (태그 지원)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiServiceDB } from '@/services/apiService.database';

/**
 * GET /api/apis
 * API 목록 조회 (태그 포함)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method');

    const apis = await ApiServiceDB.getAllApis(method || undefined);

    console.log('[API Route] APIs retrieved:', apis.length);

    return NextResponse.json({
      success: true,
      data: apis,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'API 목록 조회 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apis
 * 새 API 생성 (태그 지원)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 서비스 호출로 API 생성
    try {
      const newApi = await ApiServiceDB.createApi({
        apiName: body.apiName,
        uri: body.uri,
        method: body.method,
        tags: body.tags,
        parameters: body.parameters,
      });

      return NextResponse.json(
        {
          success: true,
          data: newApi,
          message: 'API created successfully',
        },
        { status: 201 }
      );
    } catch (serviceError) {
      // 비즈니스 로직 에러 처리
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, message: 'API를 찾을 수 없거나 대상이 유효하지 않습니다' },
            { status: 404 }
          );
        } else if (serviceError.message.includes('already exists')) {
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
    console.error('[API Route] Error creating API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create API',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
