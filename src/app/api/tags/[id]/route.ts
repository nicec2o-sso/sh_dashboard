/**
 * 태그 상세 관리 API
 * 
 * 경로: /api/tags/[id]
 * 
 * 기능:
 * - DELETE: 태그 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagServiceDB } from '@/services/tagService.database';

/**
 * DELETE /api/tags/[id]
 * 태그 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const contextParams = await context.params;
    const tagId = parseInt(contextParams.id);

    try {
      await TagServiceDB.deleteTag(tagId);

      console.log('[Tag Route] Tag deleted:', tagId);

      return NextResponse.json({
        success: true,
        message: '태그가 삭제되었습니다',
        data: { tagId },
      });
    } catch (serviceError) {
      // 비즈니스 로직 에러 처리
      if (serviceError instanceof Error) {
        if (serviceError.message.includes('not found')) {
          return NextResponse.json(
            { success: false, message: '태그를 찾을 수 없습니다' },
            { status: 404 }
          );
        } else if (serviceError.message.includes('referenced by') || serviceError.message.includes('in use')) {
          return NextResponse.json(
            { 
              success: false, 
              message: '해당 태그는 노드, API 또는 Synthetic Test에서 사용 중이므로 삭제할 수 없습니다',
            },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { 
              success: false, 
              message: serviceError.message || '태그 삭제 중 오류가 발생했습니다',
            },
            { status: 400 }
          );
        }
      }
      throw serviceError;
    }
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
