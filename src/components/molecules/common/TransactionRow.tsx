'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import { formatVietnamsePrice } from '@/lib/format';
import { getCategoryIcon } from '@/constants/categoryIcons';
import {
  MdEdit,
  MdDelete,
} from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface TransactionRowProps {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'INCOME' | 'EXPENSE';
  icon?: React.ReactNode;
  showTimeOnly?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  id,
  title,
  category,
  date,
  amount,
  type,
  icon,
  showTimeOnly = false,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const formatDate = (dateString: string) => {
    try {
      // Parse format: dd/mm/yyyy hh:mm or ISO
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/;
      const match = dateString.match(regex);

      if (match) {
        const [, day, month, year, hour, minute] = match;
        if (showTimeOnly) {
          return `${hour}:${minute}`;
        }
        return `${day}/${month}/${year} ${hour}:${minute}`;
      }

      // Fallback parse Date object if ISO string
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        if (showTimeOnly) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
      }

      return dateString;
    } catch {
      return dateString;
    }
  };

  const normalizedType = type.toLowerCase() as 'income' | 'expense';
  const amountColor = normalizedType === 'income' ? '#10B981' : '#EF4444';
  const amountPrefix = normalizedType === 'income' ? '+' : '-';

  // Category & Type Icon background tints
  const getCategoryTint = () => {
    if (normalizedType === 'income') {
      return { bg: '#10B98118', text: '#10B981' };
    }
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('food') || catLower.includes('dining') || catLower.includes('ăn')) {
      return { bg: '#F59E0B18', text: '#D97706' };
    }
    if (catLower.includes('cloth') || catLower.includes('shop') || catLower.includes('sắm')) {
      return { bg: '#EC489918', text: '#DB2777' };
    }
    if (catLower.includes('project') || catLower.includes('dự án')) {
      return { bg: '#8B5CF618', text: '#7C3AED' };
    }
    if (catLower.includes('bill') || catLower.includes('util') || catLower.includes('điện')) {
      return { bg: '#3B82F618', text: '#2563EB' };
    }
    return { bg: `${colors.interactive.primary}15`, text: colors.interactive.primary };
  };

  const tint = getCategoryTint();

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border gap-3 sm:gap-4 transition-colors hover:shadow-sm"
      style={{
        borderColor: colors.border.light,
        backgroundColor: colors.surface.primary,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
          style={{
            backgroundColor: tint.bg,
            color: tint.text,
          }}
        >
          {icon || getCategoryIcon(category)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate text-sm sm:text-base" style={{ color: colors.text.primary }}>
            {t.has(`categories.${title}`) ? t(`categories.${title}`) : title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: colors.text.secondary }}>
              {formatDate(date)}
            </span>
            {normalizedType === 'expense' && (
              <span
                className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap truncate max-w-[140px]"
                style={{
                  backgroundColor: `${colors.surface.secondary}`,
                  color: colors.text.secondary,
                }}
              >
                {t.has(`categories.${category}`) ? t(`categories.${category}`) : category}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderTopColor: `${colors.border.light}60` }}>
        <p
          className="font-bold text-base sm:text-lg text-left sm:text-right sm:min-w-24 tracking-tight"
          style={{ color: amountColor }}
        >
          {amountPrefix}{formatVietnamsePrice(Math.abs(amount))}
        </p>
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80 hover:cursor-pointer"
              style={{
                color: colors.interactive.primary,
                backgroundColor: `${colors.interactive.primary}10`,
              }}
              title="Edit"
            >
              <MdEdit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80 hover:cursor-pointer"
              style={{
                color: colors.interactive.danger,
                backgroundColor: `${colors.interactive.danger}10`,
              }}
              title="Delete"
            >
              <MdDelete className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
