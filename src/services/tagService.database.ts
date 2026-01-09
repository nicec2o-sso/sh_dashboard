/**
 * Tag Service (Database Version)
 * 
 * 데이터베이스 기반 태그 관리 서비스
 */

import { db } from '@/lib/oracle';

import {
  SELECT_ALL_TAGS,
  DELETE_TAG,
  CHECK_TAG_IN_USE,
} from '@/queries/tagQueries';
export interface Tag {
  tagId: number;
  tagName: string;
  createdAt?: Date;
}

export class TagServiceDB {
  /**
   * 모든 태그 조회
   */
  static async getAllTags(): Promise<Tag[]> {
    try {
      console.log('SELECT_ALL_TAGS:', SELECT_ALL_TAGS);
      const tags = await db.query<Tag>(SELECT_ALL_TAGS);
      return tags;
    } catch (error) {
      console.error('[TagService] Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * 태그 사용 여부 확인
   */
  static async isTagInUse(tagId: number): Promise<boolean> {
    try {
      console.log('CHECK_TAG_IN_USE:', CHECK_TAG_IN_USE, tagId);
      const result = await db.query<{ IN_USE: number }>(CHECK_TAG_IN_USE, { tagId });
      return result.length > 0 && result[0].IN_USE > 0;
    } catch (error) {
      console.error('[TagService] Error checking tag usage:', error);
      throw error;
    }
  }

  /**
   * 태그 삭제
   */
  static async deleteTag(tagId: number): Promise<void> {
    try {
      // 태그 사용 여부 확인
      const inUse = await this.isTagInUse(tagId);
      if (inUse) {
        throw new Error('Tag is in use and cannot be deleted');
      }

      console.log('DELETE_TAG:', DELETE_TAG, tagId);
      const rowsAffected = await db.execute(DELETE_TAG, { tagId }, true);

      if (rowsAffected === 0) {
        throw new Error('Tag not found');
      }

      console.log('[TagService] Tag deleted:', tagId);
    } catch (error) {
      console.error('[TagService] Error deleting tag:', error);
      throw error;
    }
  }
}
