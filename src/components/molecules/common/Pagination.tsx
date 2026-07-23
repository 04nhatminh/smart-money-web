'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { BORDER_RADIUS, SHADOWS, TRANSITIONS } from '@/constants';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

interface PageButtonProps {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  className?: string;
}

const PageButton: React.FC<PageButtonProps> = ({
  children,
  active = false,
  disabled = false,
  ariaLabel,
  onClick,
  className = '',
}) => {
  const { colors, colorScheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: active
          ? colors.interactive.primary
          : isHovered && !disabled
          ? colors.interactive.secondary
          : colors.interactive.secondary + '70',
        color: active
          ? colors.palette.white
          : disabled
          ? colors.text.secondary + '50'
          : colors.text.primary,
        borderRadius: BORDER_RADIUS.xl,
        boxShadow: active ? SHADOWS.sm : isHovered && !disabled ? SHADOWS.sm : 'none',
        transition: TRANSITIONS.base,
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'none',
        filter: isHovered && !disabled
          ? (colorScheme === 'dark' ? 'brightness(1.15)' : 'brightness(0.96)')
          : 'none',
      }}
      className={`h-8 sm:h-9 px-2 sm:px-3 min-w-[32px] sm:min-w-[36px] inline-flex items-center justify-center text-xs sm:text-sm font-semibold select-none cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none shrink-0 ${className}`}
    >
      {children}
    </button>
  );
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const [jumpInput, setJumpInput] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange?.(pageNum);
      setShowJumpInput(false);
      setJumpInput('');
    }
  };

  // Compact page distribution without redundant First/Last buttons
  const getPageItems = (): { value: number | '...'; hideOnMobile?: boolean }[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => ({ value: i + 1 }));
    }

    if (currentPage <= 3) {
      return [
        { value: 1 },
        { value: 2 },
        { value: 3, hideOnMobile: currentPage !== 3 },
        { value: 4, hideOnMobile: true },
        { value: '...' },
        { value: totalPages },
      ];
    }

    if (currentPage >= totalPages - 2) {
      return [
        { value: 1 },
        { value: '...' },
        { value: totalPages - 3, hideOnMobile: true },
        { value: totalPages - 2, hideOnMobile: currentPage !== totalPages - 2 },
        { value: totalPages - 1 },
        { value: totalPages },
      ];
    }

    return [
      { value: 1 },
      { value: '...' },
      { value: currentPage - 1, hideOnMobile: true },
      { value: currentPage },
      { value: currentPage + 1, hideOnMobile: true },
      { value: '...' },
      { value: totalPages },
    ];
  };

  const pageItems = getPageItems();

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 select-none w-full max-w-full overflow-hidden py-1">
      {/* Previous Button */}
      <PageButton
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        ariaLabel={t('common.pagination.previous')}
        className="gap-1 !px-2 sm:!px-3"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">{t('common.pagination.previous')}</span>
      </PageButton>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageItems.map((item, index) => {
          if (item.value === '...') {
            return (
              <div key={`ellipsis-${index}`} className="relative">
                {showJumpInput ? (
                  <form onSubmit={handleJumpSubmit} className="inline-flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpInput}
                      onChange={(e) => setJumpInput(e.target.value)}
                      placeholder="#"
                      autoFocus
                      onBlur={() => setShowJumpInput(false)}
                      className="w-10 sm:w-11 h-8 sm:h-9 text-center text-xs sm:text-sm font-semibold rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.interactive.primary,
                        backgroundColor: colors.surface.primary,
                        color: colors.text.primary,
                      }}
                    />
                  </form>
                ) : (
                  <PageButton
                    onClick={() => setShowJumpInput(true)}
                    ariaLabel="Nhập số trang"
                    className="!px-1 sm:!px-2 !min-w-[28px] sm:!min-w-[34px] text-xs"
                  >
                    ...
                  </PageButton>
                )}
              </div>
            );
          }

          const isCurrent = item.value === currentPage;
          return (
            <PageButton
              key={`page-${item.value}`}
              active={isCurrent}
              onClick={() => handlePageClick(item.value as number)}
              ariaLabel={`Trang ${item.value}`}
              className={`!px-2 sm:!px-2.5 !min-w-[30px] sm:!min-w-[34px] ${item.hideOnMobile ? 'hidden sm:inline-flex' : ''}`}
            >
              {item.value}
            </PageButton>
          );
        })}
      </div>

      {/* Next Button */}
      <PageButton
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        ariaLabel={t('common.pagination.next')}
        className="gap-1 !px-2 sm:!px-3"
      >
        <span className="hidden sm:inline">{t('common.pagination.next')}</span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </PageButton>
    </div>
  );
};
