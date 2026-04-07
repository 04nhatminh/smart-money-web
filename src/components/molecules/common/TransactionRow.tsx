'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import {
  MdAttachMoney,
  MdFastfood,
  MdHome,
  MdLocalGroceryStore,
  MdShoppingCart,
  MdWaterDrop,
  MdElectricBolt,
  MdMoreVert,
} from 'react-icons/md';

interface TransactionRowProps {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  icon?: React.ReactNode;
}

const getCategoryIcon = (category: string): React.ReactNode => {
  const categoryMap: { [key: string]: React.ReactNode } = {
    salary: <MdAttachMoney className="w-6 h-6" />,
    food: <MdFastfood className="w-6 h-6" />,
    housing: <MdHome className="w-6 h-6" />,
    grocery: <MdLocalGroceryStore className="w-6 h-6" />,
    shopping: <MdShoppingCart className="w-6 h-6" />,
    utilities: <MdWaterDrop className="w-6 h-6" />,
    electricity: <MdElectricBolt className="w-6 h-6" />,
  };
  return categoryMap[category.toLowerCase()] || <MdShoppingCart className="w-6 h-6" />;
};

export const TransactionRow: React.FC<TransactionRowProps> = ({
  id,
  title,
  category,
  date,
  amount,
  type,
  icon,
}) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const amountColor = type === 'income' ? '#10B981' : '#EF4444';
  const amountPrefix = type === 'income' ? '+' : '-';

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border"
      style={{
        borderColor: colors.border.light,
        backgroundColor: colors.surface.primary,
      }}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className="p-3 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: colors.surface.secondary,
          }}
        >
          {icon || getCategoryIcon(category)}
        </div>
        <div className="flex-1">
          <p className="font-semibold" style={{ color: colors.text.primary }}>
            {title}
          </p>
          <div className="flex items-center gap-2">
            <Text className="text-xs" style={{ color: colors.text.secondary }}>
              {formatDate(date)}
            </Text>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: colors.surface.secondary,
                color: colors.text.secondary,
              }}
            >
              {category}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p
          className="font-bold text-lg min-w-24 text-right"
          style={{ color: amountColor }}
        >
          {amountPrefix}${Math.abs(amount).toFixed(2)}
        </p>
        <button
          className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
          style={{ color: colors.text.secondary }}
        >
          <MdMoreVert className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
