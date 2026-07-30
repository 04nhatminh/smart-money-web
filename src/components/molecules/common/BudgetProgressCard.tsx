'use client';

import React from 'react';
import { Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { Budget } from '@/types/budget.api';
import { getCategoryIcon, getCategoryColor } from '@/constants/categoryIcons';
import { formatVietnamsePrice } from '@/lib/format';
import { useTranslations, useLocale } from 'next-intl';

interface BudgetProgressCardProps {
  budget: Budget;
}

const getAlertColor = (alertLevel: string): string => {
  const colors: { [key: string]: string } = {
    SAFE: '#10B981', // Green
    CAUTION: '#F59E0B', // Amber
    WARNING: '#EF4444', // Red
    EXCEEDED: '#8B5CF6', // Purple
  };
  return colors[alertLevel] || '#6B7280';
};

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budget,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const locale = useLocale();

  const spentPercentage = Math.min((budget.spent / budget.amountLimit) * 100, 100);
  const formattedPercent = spentPercentage % 1 === 0 ? spentPercentage.toFixed(0) : spentPercentage.toFixed(1);
  const alertColor = getAlertColor(budget.alertLevel);
  const categoryColor = getCategoryColor(budget.category);

  return (
    <div
      className="rounded-xl p-5 border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderColor: colors.border.light,
        backgroundColor: colors.surface.primary,
        borderLeft: `4px solid ${categoryColor}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = alertColor + '80';
        e.currentTarget.style.boxShadow = `0 10px 20px -10px ${alertColor}30`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.border.light;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header with Category and Status */}
        <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3.5 flex-1">
          <div
            className="p-2.5 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: categoryColor + '15',
              color: categoryColor,
            }}
          >
            {getCategoryIcon(budget.category)}
          </div>
          <div className="flex-1">
            <Text className="font-semibold text-base" style={{ color: colors.text.primary }}>
              {t.has(`categories.${budget.category}`) ? t(`categories.${budget.category}`) : budget.category}
            </Text>
            <Text className="text-xs" style={{ color: colors.text.tertiary }}>
              {new Date(budget.year, budget.month - 1).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300"
            style={{ backgroundColor: alertColor + '18', color: alertColor }}
          >
            {t(`budgets.status.${budget.alertLevel}`)}
          </div>
        </div>
      </div>

      {/* Amount Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            {t('budgets.spentLimit')}
          </Text>
          <Text className="font-bold text-base" style={{ color: colors.text.primary }}>
            {formatVietnamsePrice(budget.spent)} <span className="text-xs font-normal" style={{ color: colors.text.tertiary }}>/ {formatVietnamsePrice(budget.amountLimit)}</span>
          </Text>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border.light }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${spentPercentage}%`,
              backgroundColor: alertColor,
              boxShadow: `0 0 8px ${alertColor}60`,
            }}
          />
        </div>

        {/* Progress Info */}
        <div className="flex justify-between items-center pt-1">
          <Text className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
            {t('budgets.used', { percent: formattedPercent })}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: budget.remaining < 0 ? '#EF4444' : '#10B981' }}>
            {budget.remaining < 0 
              ? t('budgets.overspent', { amount: formatVietnamsePrice(Math.abs(budget.remaining)) })
              : t('budgets.remainingAmount', { amount: formatVietnamsePrice(budget.remaining) })
            }
          </Text>
        </div>
      </div>
    </div>
  );
};
