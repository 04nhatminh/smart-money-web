'use client';

import React from 'react';
import { Button, Text } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        className='min-w-20'
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t('common.pagination.previous')}
      </Button>
      <Text variant="caption" weight="medium" style={{ color: colors.text.primary }} className='px-4'>
        {t('common.pagination.pageOf', { current: currentPage, total: totalPages })}
      </Text>
      <Button
        variant="secondary"
        size="sm"
        className='min-w-20'
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('common.pagination.next')}
      </Button>
    </div>
  );
};
