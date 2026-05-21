'use client';

import React from 'react';
import { Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { Budget } from '@/types/budget.api';
import { getCategoryIcon } from '@/constants/categoryIcons';
import { formatVietnamsePrice, formatNumber } from '@/lib/format';

interface BudgetProgressCardProps {
  budget: Budget;
  onEdit: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
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

const getAlertLabel = (alertLevel: string): string => {
  const labels: { [key: string]: string } = {
    SAFE: 'Safe',
    CAUTION: 'Caution',
    WARNING: 'Warning',
    EXCEEDED: 'Exceeded',
  };
  return labels[alertLevel] || alertLevel;
};

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  const spentPercentage = Math.min((budget.spent / budget.amountLimit) * 100, 100);
  const alertColor = getAlertColor(budget.alertLevel);

  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        borderColor: colors.border.light,
        backgroundColor: colors.surface.primary,
      }}
    >
      {/* Header with Category and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="p-2 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: colors.surface.secondary,
            }}
          >
            {getCategoryIcon(budget.category)}
          </div>
          <div className="flex-1">
            <Text className="font-semibold" style={{ color: colors.text.primary }}>
              {budget.category}
            </Text>
            <Text className="text-xs" style={{ color: colors.text.tertiary }}>
              {new Date(budget.year, budget.month - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: alertColor + '20', color: alertColor }}
          >
            {getAlertLabel(budget.alertLevel)}
          </div>
        </div>
      </div>

      {/* Amount Info */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <Text className="text-sm" style={{ color: colors.text.secondary }}>
            Spent / Limit
          </Text>
          <Text className="font-semibold" style={{ color: colors.text.primary }}>
            {formatVietnamsePrice(budget.spent)} / {formatVietnamsePrice(budget.amountLimit)}
          </Text>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border.light }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${spentPercentage}%`,
              backgroundColor: alertColor,
            }}
          />
        </div>

        {/* Progress Info */}
        <div className="flex justify-between items-center">
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            {spentPercentage.toFixed(1)}% used
          </Text>
          <Text className="text-xs font-medium" style={{ color: colors.text.primary }}>
            {formatVietnamsePrice(budget.remaining)} remaining
          </Text>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onEdit(budget.budgetId)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: colors.background.primary + '15',
            color: colors.text.primary,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = colors.background.secondary + '25';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = colors.background.primary + '15';
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(budget.budgetId)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: '#EF4444' + '15',
            color: '#EF4444',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#EF4444' + '25';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#EF4444' + '15';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
