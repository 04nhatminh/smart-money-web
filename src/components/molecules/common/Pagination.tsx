'use client';

import React from 'react';
import { Button, Text } from '@/components/atoms';
import { useTheme } from '@/context';

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

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        className='min-w-20'
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <Text variant="caption" weight="medium" style={{ color: colors.text.primary }} className='px-4'>
        Page {currentPage} of {totalPages}
      </Text>
      <Button
        variant="secondary"
        size="sm"
        className='min-w-20'
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};
