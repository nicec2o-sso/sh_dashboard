// /app/api/synthetic-tests/[id]/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestService } from '@/services/syntheticTestService'; // 서비스 파일 경로 가정

// ----------------------------------------------------------------------
// GET 핸들러 정의 (SyntheticTestService.getTestResults 사용)
// ----------------------------------------------------------------------

/**
 * 특정 Synthetic Test의 실행 히스토리를 가져옵니다.
 * 경로: /api/synthetic-tests/[id]/history
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
    const testId = parseInt((await context.params).id, 10);
    const resolvedParams = await context.params; 
    
    console.log("Received request for Synthetic Test ID:", resolvedParams.id);
    if (isNaN(testId)) {
        // 400 Bad Request: ID가 숫자가 아닌 경우
        return NextResponse.json(
        { error: '유효하지 않은 Synthetic Test ID입니다.' },
        { status: 400 }
        );
    }

    try {
        // SyntheticTestService를 사용하여 테스트 결과를 가져옵니다.
        // SyntheticTestResults 컴포넌트의 요구사항에 따라, 최근 50개의 결과만 가져오도록 limit을 설정합니다.
        const historyData = SyntheticTestService.getTestResults(testId, { limit: 50 });

        if (historyData.length === 0) {
            // 테스트 ID는 유효하지만, 기록이 없는 경우
            return NextResponse.json([], { status: 200 });
        }
        
        // 데이터 반환 (200 OK)
        return NextResponse.json(historyData, { status: 200 });

    } catch (error) {
        console.error(`히스토리 로드 중 오류 발생 (Test ID: ${testId}):`, error);
        // 500 Internal Server Error: 서비스 내부 오류 발생 시
        return NextResponse.json(
        { error: '서버에서 히스토리 데이터를 가져오는 데 실패했습니다.' },
        { status: 500 }
        );
    }
}

// ----------------------------------------------------------------------
// 참고: POST 등의 다른 메서드는 현재 요구사항에 포함되지 않았습니다.
// ----------------------------------------------------------------------
// export async function POST() {}
// export async function PUT() {}
// export async function DELETE() {}