/**
 * Tag 도메인 관련 타입 정의
 */

/**
 * @property tagId - 태그 고유 식별자
 * @property tagName - 태그의 이름
 * @property createdAt - 태그 생성 일시 (ISO 8601 형식)
 */
export interface Tag {
  tagId: number;
  tagName: string;
  createdAt?: string;
}
