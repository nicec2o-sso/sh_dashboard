import { NextRequest, NextResponse } from 'next/server';
import { ApiService } from '@/services/apiService';
import { UpdateApiDto } from '@/types';

/**
 * GET /api/apis/[id] - 특정 API 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);
    const api = ApiService.getApiById(id);

    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: api,
    });
  
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/apis/[id] - API 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);
    const body: UpdateApiDto = await request.json();

    // URI 형식 검증
    if (body.uri && !body.uri.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'URI는 /로 시작해야 합니다' },
        { status: 400 }
      );
    }

    const updatedApi = ApiService.updateApi(id, body);

    if (!updatedApi) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없거나 대상이 유효하지 않습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedApi,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apis/[id] - API 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const id = parseInt(contextParams.id, 10);
    const deleted = ApiService.deleteApi(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'API를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API가 삭제되었습니다',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}