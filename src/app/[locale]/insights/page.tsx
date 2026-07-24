'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { DatePeriodSelector } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useInsights } from '@/hooks/useInsights';
import { InsightCard } from '@/components/organisms/insights/InsightCard';
import { MdInsights, MdRefresh } from 'react-icons/md';

export default function InsightsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());

  const asOf = `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`;

  const { insights, loading, error, reload } = useInsights(asOf);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  if (isInitializing || !isAuthenticated) {
    return null;
  }

  // Group by severity
  const criticalInsights = insights.filter((i) => i.severity === 'CRITICAL');
  const warnInsights = insights.filter((i) => i.severity === 'WARN');
  const infoInsights = insights.filter((i) => i.severity === 'INFO');

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Header Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Heading level={1} className="text-2xl font-bold flex items-center gap-2.5">
              <MdInsights className="w-7 h-7" style={{ color: colors.interactive.primary }} />
              {t('insights.title') || 'Phân tích thông minh (Insights)'}
            </Heading>
            <Text className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              {t('insights.subtitle') || 'Cập nhật tình hình biến động tài chính tự động từ Adaptive Engine'}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <DatePeriodSelector
              currentMonth={currentMonth}
              currentYear={currentYear}
              onChange={(month, year) => {
                setCurrentMonth(month);
                setCurrentYear(year);
              }}
            />

            <button
              onClick={() => reload()}
              disabled={loading}
              className="p-2.5 rounded-xl border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
              style={{
                borderColor: colors.border.light,
                color: colors.text.primary,
              }}
              title={t.has('common.refresh') ? t('common.refresh') : 'Làm mới'}
            >
              <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.has('common.refresh') ? t('common.refresh') : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Loading Shimmer */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl animate-pulse"
                style={{ backgroundColor: `${colors.border.light}40` }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="p-6 rounded-2xl border text-center space-y-2"
            style={{
              backgroundColor: '#EF444410',
              borderColor: '#EF4444',
            }}
          >
            <p className="font-semibold" style={{ color: '#EF4444' }}>
              {error}
            </p>
            <button
              onClick={() => reload()}
              className="text-xs underline font-medium"
              style={{ color: colors.text.primary }}
            >
              {t('common.retry') || 'Thử lại'}
            </button>
          </div>
        ) : insights.length === 0 ? (
          <div
            className="p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3"
            style={{
              backgroundColor: colors.surface.primary,
              borderColor: colors.border.light,
            }}
          >
            <div
              className="p-4 rounded-full"
              style={{ backgroundColor: `${colors.interactive.primary}15` }}
            >
              <MdInsights className="w-10 h-10" style={{ color: colors.interactive.primary }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
              {t('insights.empty_title') || 'Chưa có phân tích mới'}
            </h3>
            <p className="text-sm max-w-md" style={{ color: colors.text.secondary }}>
              {t('insights.empty_subtitle') ||
                'Hệ thống sẽ liên tục theo dõi và cung cấp phân tích tài chính thông minh khi lịch sử chi tiêu của bạn phong phú hơn.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Critical Section */}
            {criticalInsights.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  {t.has('insights.severity.critical')
                    ? t('insights.severity.critical', { count: criticalInsights.length })
                    : `Cần chú ý gấp (${criticalInsights.length})`}
                </h2>
                <div className="flex flex-col space-y-4">
                  {criticalInsights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} locale={locale} />
                  ))}
                </div>
              </div>
            )}

            {/* Warning Section */}
            {warnInsights.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {t.has('insights.severity.warn')
                    ? t('insights.severity.warn', { count: warnInsights.length })
                    : `Cảnh báo xu hướng (${warnInsights.length})`}
                </h2>
                <div className="flex flex-col space-y-4">
                  {warnInsights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} locale={locale} />
                  ))}
                </div>
              </div>
            )}

            {/* Info Section */}
            {infoInsights.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  {t.has('insights.severity.info')
                    ? t('insights.severity.info', { count: infoInsights.length })
                    : `Thông tin tổng hợp (${infoInsights.length})`}
                </h2>
                <div className="flex flex-col space-y-4">
                  {infoInsights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
