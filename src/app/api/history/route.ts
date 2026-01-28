/**
 * Test History Search API
 * 
 * 경로: /api/history
 * 
 * 기능:
 * - GET: 통합테스트 실행 이력 검색
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestHistoryServiceDB } from '@/services/syntheticTestHistoryService.database';

/**
 * GET /api/history
 * 통합테스트 실행 이력 검색
 * 
 * Query Parameters:
 * - syntheticTestId: Synthetic Test ID
 * - syntheticTestName: Synthetic Test Name (검색)
 * - nodeId: Node ID
 * - nodeName: Node Name (검색)
 * - nodeGroupName: Node Group Name (검색)
 * - tagName: Tag name (검색)
 * - notificationEnabled: Y/N/all (알림 발생 여부)
 * - startDate: ISO 8601 date string
 * - endDate: ISO 8601 date string
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters 파싱
    const syntheticTestId = searchParams.get('syntheticTestId');
    const syntheticTestName = searchParams.get('syntheticTestName');
    const nodeId = searchParams.get('nodeId');
    const nodeName = searchParams.get('nodeName');
    const nodeGroupName = searchParams.get('nodeGroupName');
    const tagName = searchParams.get('tagName');
    const notificationEnabled = searchParams.get('notificationEnabled');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');

    // Options 객체 생성
    const options: any = {};

    if (syntheticTestId) {
      options.syntheticTestId = parseInt(syntheticTestId, 10);
    }

    if (syntheticTestName) {
      options.syntheticTestName = syntheticTestName;
    }

    if (nodeId) {
      options.nodeId = parseInt(nodeId, 10);
    }

    if (nodeName) {
      options.nodeName = nodeName;
    }

    if (nodeGroupName) {
      options.nodeGroupName = nodeGroupName;
    }

    if (tagName) {
      options.tagName = tagName;
    }

    if (notificationEnabled && notificationEnabled !== 'all') {
      options.notificationEnabled = notificationEnabled === 'Y';
    }

    if (startDateStr) {
      options.startDate = new Date(startDateStr);
    }

    if (endDateStr) {
      options.endDate = new Date(endDateStr);
    }

    if (limitStr) {
      options.limit = parseInt(limitStr, 10);
    } else {
      options.limit = 50; // 기본값
    }

    if (offsetStr) {
      options.offset = parseInt(offsetStr, 10);
    } else {
      options.offset = 0; // 기본값
    }

    console.log('[History API] Search options:', options);

    // 검색 실행
    const result = await SyntheticTestHistoryServiceDB.searchHistories(options);

    // SUCCESS를 boolean으로 변환
    const histories = result.histories.map(h => ({
      ...h,
      success: h.success === 'Y',
    }));

    console.log('[History API] Found histories:', histories.length, 'Total:', result.total);

    return NextResponse.json({
      success: true,
      data: histories,
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    });
  } catch (error) {
    console.error('[History API] Error searching histories:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search test histories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
