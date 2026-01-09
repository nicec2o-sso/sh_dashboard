/**
 * 태그 관리 API
 * 
 * 경로: /api/tags
 * 
 * 기능:
 * - GET: 모든 태그 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagServiceDB } from '@/services/tagService.database';

/**
 * GET /api/tags
 * 모든 태그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const tags = await TagServiceDB.getAllTags();

    console.log('[Tag Route] Tags retrieved:', tags.length);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('[Tag Route] Error fetching tags:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tags',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
