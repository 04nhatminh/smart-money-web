'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { useInsights } from '@/hooks/useInsights';
import { InsightCard } from '@/components/organisms/insights/InsightCard';
import { MdInsights, MdChevronRight } from 'react-icons/md';

export const InsightsPreviewWidget: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const { insights, loading, error } = useInsights();

  if (loading || error || insights.length === 0) {
    return null;
  }

  // Pick the top critical or warning insight
  const topInsight = insights[0];

  return (
    <div
      className="p-5 rounded-2xl border space-y-4 shadow-sm"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${colors.interactive.primary}15` }}
          >
            <MdInsights className="w-5 h-5" style={{ color: colors.interactive.primary }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
              {t('insights.title') || 'Phân tích thông minh (Insights)'}
            </h3>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {t('insights.subtitle') || 'Cập nhật tình hình biến động tài chính tự động'}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/${locale}/insights`)}
          className="text-xs font-bold transition-colors hover:underline flex items-center gap-1"
          style={{ color: colors.interactive.primary }}
        >
          <span>{t.has('suggestions.see_all') ? t('suggestions.see_all') : 'Xem tất cả'}</span>
          <MdChevronRight className="w-4 h-4" />
        </button>
      </div>

      <InsightCard insight={topInsight} locale={locale} />
    </div>
  );
};
