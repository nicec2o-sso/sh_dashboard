/**
 * IP 주소 관련 유틸리티 함수
 */

import { NextRequest } from 'next/server';

/**
 * Next.js Request에서 클라이언트 IP 주소 추출
 * 프록시/로드밸런서 환경을 고려하여 실제 클라이언트 IP를 반환
 * 
 * @param request - Next.js Request 객체
 * @returns 클라이언트 IP 주소 (추출 실패 시 '127.0.0.1')
 */
export function getClientIP(request: NextRequest): string {
  // 우선순위대로 헤더 확인
  const headers = [
    'x-forwarded-for',      // 일반 프록시
    'x-real-ip',            // Nginx
    'cf-connecting-ip',     // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
    'forwarded',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for는 여러 IP가 쉼표로 구분될 수 있음
      // 첫 번째 IP가 실제 클라이언트 IP
      const ip = value.split(',')[0].trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  // 헤더에서 찾지 못한 경우 기본값 반환
  return '127.0.0.1';
}

/**
 * IPv4 주소 유효성 검증
 * 
 * @param ip - 검증할 IP 주소
 * @returns 유효한 IPv4 주소 여부
 */
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}
