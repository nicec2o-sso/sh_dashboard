import { NextRequest, NextResponse } from 'next/server';
import { ApiService } from '@/services/apiService';
import { CreateApiDto } from '@/types';

/**
 * GET /api/apis - 모든 API 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method') as 'GET' | 'POST' | 'PUT' | 'DELETE' | null;
    
    let apis = ApiService.getAllApis();

    if (method) {
      apis = ApiService.getApisByMethod(method);
    }
    
    return NextResponse.json({
      success: true,
      data: apis,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apis - API 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateApiDto = await request.json();

    // 유효성 검증
    if (!body.name || !body.uri || !body.method) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }



    // URI 형식 검증
    if (!body.uri.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'URI는 /로 시작해야 합니다' },
        { status: 400 }
      );
    }

    const newApi = ApiService.createApi(body);

    if (!newApi) {
      return NextResponse.json(
        { success: false, error: '대상 노드 또는 그룹을 찾을 수 없습니다' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newApi,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}