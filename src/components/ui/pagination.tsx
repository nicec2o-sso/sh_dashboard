import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  // 페이지 번호 배열 생성 (현재 페이지 주변만 표시)
  const getPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => {
      // 첫 페이지, 마지막 페이지, 현재 페이지 주변 2개씩 표시
      return (
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 2 && page <= currentPage + 2)
      );
    });
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center border-t pt-4 mt-4">
      {/* 오른쪽: 페이지 네비게이션 */}
      <div className="flex items-center gap-2">
        {/* 첫 페이지로 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          title="첫 페이지"
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* 이전 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          title="이전 페이지"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* 페이지 번호들 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index, array) => {
            // 페이지 번호 사이에 ... 표시
            const prevPage = array[index - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span className="px-2 text-gray-400 text-sm">...</span>
                )}
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={`h-8 w-8 p-0 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </Button>
              </React.Fragment>
            );
          })}
        </div>

        {/* 다음 페이지 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="다음 페이지"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* 마지막 페이지로 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          title="마지막 페이지"
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
