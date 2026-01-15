/**
 * Alerts API
 * 
 * 경로: /api/alerts
 * 
 * 기능:
 * - GET: 알럿 목록 조회 (시간 범위 필터링)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyntheticTestHistoryServiceDB } from '@/services/syntheticTestHistoryService.database';

/**
 * GET /api/alerts
 * 알럿 목록 조회
 * 
 * Query Parameters:
 * - timeRange: 1h, 6h, 24h, 7d (기본값: 24h)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 시간 범위 파라미터만 받음
    const timeRange = searchParams.get('timeRange') || '24h';

    // 시간 범위 계산
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    console.log('[Alerts API] Fetching alerts from:', startDate);
    
    // DB에서 알럿 조회
    const alerts = await SyntheticTestHistoryServiceDB.getAlerts(startDate, 100);

    // input에서 apiParameterValues 추출
    const processedAlerts = alerts.map((alert) => {
      let parameterValues = {};
      
      if (alert.input) {
        try {
          const inputData = JSON.parse(alert.input);
          if (inputData.parameters) {
            parameterValues = inputData.parameters;
          }
        } catch (error) {
          console.warn('Failed to parse input JSON:', error);
        }
      }

      return {
        testId: alert.testId,
        testName: alert.testName,
        nodeId: alert.nodeId,
        nodeName: alert.nodeName,
        apiId: alert.apiId,
        apiName: alert.apiName,
        apiUri: alert.apiUri,
        apiMethod: alert.apiMethod,
        parameterValues,
        responseTime: alert.responseTime,
        threshold: alert.threshold,
        timestamp: alert.timestamp,
        statusCode: alert.statusCode,
      };
    });

    console.log('[Alerts API] Alerts retrieved:', processedAlerts.length);

    return NextResponse.json({
      success: true,
      data: processedAlerts,
      count: processedAlerts.length,
    });
  } catch (error) {
    console.error('[Alerts API] Error fetching alerts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
