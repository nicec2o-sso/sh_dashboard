import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestService } from '@/services/syntheticTestService';
import { CreateSyntheticTestDto } from '@/types';

/**
 * GET /api/synthetic-tests - 모든 합성 테스트 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const targetType = searchParams.get('targetType') as 'node' | 'group' | null;
    const targetId = searchParams.get('targetId');
    const apiId = searchParams.get('apiId');

    let tests = SyntheticTestService.getAllTests();

    // 필터링
    if (tag) {
      tests = SyntheticTestService.getTestsByTag(tag);
    }
    if (apiId) {
      tests = SyntheticTestService.getTestsByApi(parseInt(apiId));
    }

    return NextResponse.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '합성 테스트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthetic-tests - 합성 테스트 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSyntheticTestDto = await request.json();

    // 유효성 검증
    if (!body.name ||  !body.apiId) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    if (!body.targetId) {
      return NextResponse.json(
        { success: false, error: '대상을 선택해야 합니다' },
        { status: 400 }
      );
    }

    if (body.intervalSeconds < 10) {
      return NextResponse.json(
        { success: false, error: '실행 간격은 최소 10초 이상이어야 합니다' },
        { status: 400 }
      );
    }

    if (body.alertThresholdMs < 0) {
      return NextResponse.json(
        { success: false, error: '알림 임계값은 0 이상이어야 합니다' },
        { status: 400 }
      );
    }

    const newTest = SyntheticTestService.createTest(body);

    if (!newTest) {
      return NextResponse.json(
        { success: false, error: 'API 또는 대상을 찾을 수 없습니다' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newTest,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '합성 테스트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}