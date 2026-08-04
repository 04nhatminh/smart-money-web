'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { Insight } from '@/types/insight.types';
import { getSeverityStyle, localizeInsight, formatPeriod, formatInsightParams } from '@/lib/insightFormat';
import { MdWarning, MdInfo, MdError, MdInsights } from 'react-icons/md';

interface InsightCardProps {
  insight: Insight;
  locale?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, locale = 'vi' }) => {
  const t = useTranslations();
  const { colors } = useTheme();
  const severityStyle = getSeverityStyle(insight.severity);

  const getSeverityIcon = () => {
    switch (insight.severity) {
      case 'CRITICAL':
        return <MdError className="w-5 h-5" style={{ color: severityStyle.color }} />;
      case 'WARN':
        return <MdWarning className="w-5 h-5" style={{ color: severityStyle.color }} />;
      case 'INFO':
      default:
        return <MdInfo className="w-5 h-5" style={{ color: severityStyle.color }} />;
    }
  };

  const formattedText = localizeInsight(insight, t);
  const periodText = formatPeriod(insight.period, locale);
  const formattedParams = formatInsightParams(insight.metrics);

  const badgeLabel = t.has(`insights.badge.${insight.severity.toLowerCase()}`)
    ? t(`insights.badge.${insight.severity.toLowerCase()}`)
    : severityStyle.label;

  return (
    <div
      className="p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.light,
      }}
    >
      <div>
        {/* Top Header Badge & Period */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: severityStyle.badgeBg,
                color: severityStyle.badgeText,
              }}
            >
              {getSeverityIcon()}
              {badgeLabel}
            </span>

            {insight.category && (
              <span
                className="px-2.5 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${colors.interactive.primary}15`,
                  color: colors.interactive.primary,
                }}
              >
                {t.has(`categories.${insight.category}`)
                  ? t(`categories.${insight.category}`)
                  : t.has(`categories.${insight.category.toLowerCase()}`)
                  ? t(`categories.${insight.category.toLowerCase()}`)
                  : insight.category}
              </span>
            )}
          </div>

          <span
            className="text-xs font-medium"
            style={{ color: colors.text.secondary }}
          >
            {periodText}
          </span>
        </div>

        {/* Narrative / Main Body */}
        <div className="flex gap-3 items-start my-2">
          <div
            className="p-2.5 rounded-xl shrink-0 mt-0.5"
            style={{ backgroundColor: `${severityStyle.color}15` }}
          >
            <MdInsights className="w-5 h-5" style={{ color: severityStyle.color }} />
          </div>
          <p
            className="text-sm sm:text-base font-medium leading-relaxed"
            style={{ color: colors.text.primary }}
          >
            {formattedText}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      {Object.keys(formattedParams).length > 0 && (
        <div
          className="mt-4 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          style={{ borderColor: colors.border.light }}
        >
          {Object.entries(formattedParams).map(([key, val]) => {
            const translatedKey = t.has(`insights.metrics.${key}`)
              ? t(`insights.metrics.${key}`)
              : key.replace(/([A-Z])/g, ' $1').trim();

            return (
              <div
                key={key}
                className="p-2.5 rounded-xl border transition-colors"
                style={{
                  backgroundColor: colors.surface.secondary,
                  borderColor: colors.border.light,
                }}
              >
                <div
                  className="text-[11px] font-bold truncate uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                  title={translatedKey}
                >
                  {translatedKey}
                </div>
                <div
                  className="text-xs sm:text-sm font-bold truncate mt-1"
                  style={{ color: colors.text.primary }}
                >
                  {String(val)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
