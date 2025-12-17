import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestService } from '@/services/syntheticTestService';
import { UpdateSyntheticTestDto } from '@/types';

/**
 * GET /api/synthetic-tests/[id] - 특정 합성 테스트 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await context.params).id, 10);
    const test = SyntheticTestService.getTestById(id);

    if (!test) {
      return NextResponse.json(
        { success: false, error: '합성 테스트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 최근 통계 정보도 함께 반환
    const statistics = SyntheticTestService.getTestStatistics(id, 24);
    const alerts = SyntheticTestService.getAlertsForTest(id);

    return NextResponse.json({
      success: true,
      data: {
        test,
        statistics,
        hasAlerts: alerts.length > 0,
        alertCount: alerts.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '합성 테스트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/synthetic-tests/[id] - 합성 테스트 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await context.params).id, 10);

    const body: UpdateSyntheticTestDto = await request.json();

    // 유효성 검증
    if (body.intervalSeconds !== undefined && body.intervalSeconds < 10) {
      return NextResponse.json(
        { success: false, error: '실행 간격은 최소 10초 이상이어야 합니다' },
        { status: 400 }
      );
    }

    if (body.alertThresholdMs !== undefined && body.alertThresholdMs < 0) {
      return NextResponse.json(
        { success: false, error: '알림 임계값은 0 이상이어야 합니다' },
        { status: 400 }
      );
    }

    const updatedTest = SyntheticTestService.updateTest(id, body);
    

    if (!updatedTest) {
      return NextResponse.json(
        { success: false, error: '합성 테스트를 찾을 수 없거나 참조하는 리소스가 유효하지 않습니다' },
        { status: 404 }
      );
    }

    console.log(`Synthetic test with ID ${id} updated:`, updatedTest);
    return NextResponse.json({
      success: true,
      data: updatedTest,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '합성 테스트 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synthetic-tests/[id] - 합성 테스트 삭제
 */
export async function DELETE(
  request: NextRequest,
   context: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await context.params).id, 10);
    const deleted = SyntheticTestService.deleteTest(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '합성 테스트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '합성 테스트가 삭제되었습니다',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '합성 테스트 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}