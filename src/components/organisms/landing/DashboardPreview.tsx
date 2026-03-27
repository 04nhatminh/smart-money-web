'use client';

import React from 'react';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';

export const DashboardPreview: React.FC = () => {
  const { colors } = useTheme();
  const t = useTranslations();

  return (
    <section className="py-16 md:py-24 transition-colors" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Heading level={2}>{t('finance.dashboard.title')}</Heading>
        </div>

        {/* Dashboard Card */}
        <div
          className="rounded-lg shadow-lg p-8 border"
          style={{
            backgroundColor: colors.surface.primary,
            borderColor: colors.border.light,
            minHeight: '400px',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Spending Trend Chart */}
            <div className="lg:col-span-1">
              <Text className="font-semibold mb-4">
                {t('finance.dashboard.monthlySpending')}
              </Text>
              <div
                className="h-48 rounded flex items-center justify-center"
                style={{
                  backgroundColor: colors.background.secondary,
                  border: `2px dashed ${colors.border.light}`,
                }}
              >
                <Text variant="caption" style={{ color: colors.text.tertiary }}>
                  Line Chart Placeholder
                </Text>
              </div>
            </div>

            {/* Spending by Category Pie Chart */}
            <div className="lg:col-span-1">
              <Text className="font-semibold mb-4">
                {t('finance.dashboard.spendingByCategory')}
              </Text>
              <div
                className="h-48 rounded flex items-center justify-center"
                style={{
                  backgroundColor: colors.background.secondary,
                  border: `2px dashed ${colors.border.light}`,
                }}
              >
                <Text variant="caption" style={{ color: colors.text.tertiary }}>
                  Pie Chart Placeholder
                </Text>
              </div>
            </div>

            {/* Budget vs Actual Bar Chart */}
            <div className="lg:col-span-1">
              <Text className="font-semibold mb-4">
                {t('finance.dashboard.budgetVsActual')}
              </Text>
              <div
                className="h-48 rounded flex items-center justify-center"
                style={{
                  backgroundColor: colors.background.secondary,
                  border: `2px dashed ${colors.border.light}`,
                }}
              >
                <Text variant="caption" style={{ color: colors.text.tertiary }}>
                  Bar Chart Placeholder
                </Text>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-8 pt-8 border-t" style={{ borderColor: colors.border.light }}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.interactive.primary }}
              />
              <Text variant="caption">{t('finance.dashboard.planned')}</Text>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.interactive.secondary }}
              />
              <Text variant="caption">{t('finance.dashboard.actual')}</Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
