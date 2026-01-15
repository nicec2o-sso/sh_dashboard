import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestService } from '@/services/syntheticTestService';
import { SyntheticTestServiceDB } from '@/services/syntheticTestService.database';

/**
 * POST /api/synthetic-tests/[id]/execute - 합성 테스트 실행
 */
export async function POST(
 request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
    console.log(`111111111111111111111h body:`);
  try {
    console.log(`1111111111111111111111D: ${id} with body:`, body);
    const id = parseInt((await context.params).id, 10);
    console.log(`1111111111111111111111D: ${id} with body:`);
    let body = await request.json();
    if(!body) {
      body = {};
    }
    console.log(`1111111111111111111111D: ${id} with body:`, body);
    const test = await SyntheticTestServiceDB.getSyntheticTestById(id);
    if (!test) {
      return NextResponse.json(
        { success: false, error: '합성 테스트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 테스트 실행
    const results = await SyntheticTestService.executeTest(id, body);

    return NextResponse.json({
      success: true,
      data: {
        testId: id,
        testName: test.syntheticTestName,
        executedAt: new Date().toISOString(),
        results,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '테스트 실행 중 오류가 발생했습니다' },
      { status: 400 }
    );
  }
}
