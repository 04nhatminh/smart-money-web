'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { Suggestion } from '@/types/suggestion.types';
import {
  STATUS_CHIPS,
  askSentence,
  suggestionTitle,
} from '@/lib/suggestionFormat';
import {
  MdLightbulb,
  MdTrendingUp,
  MdTrendingDown,
  MdTune,
  MdSavings,
  MdAccountBalanceWallet,
  MdSwapHoriz,
  MdSubscriptions,
  MdArrowUpward,
  MdFolderSpecial,
  MdAddCircleOutline,
  MdChevronRight,
} from 'react-icons/md';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onClickDetail: (suggestion: Suggestion) => void;
  projectName?: string | null;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onClickDetail,
  projectName,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const chipStyle = STATUS_CHIPS[suggestion.status] || STATUS_CHIPS.PENDING;

  const renderTypeIcon = () => {
    const iconProps = { className: 'w-6 h-6', style: { color: colors.interactive.primary } };
    switch (suggestion.type) {
      case 'RAISE_BUDGET':
        return <MdTrendingUp {...iconProps} />;
      case 'REDUCE_BUDGET':
        return <MdTrendingDown {...iconProps} />;
      case 'CREATE_BUDGET':
        return <MdAddCircleOutline {...iconProps} />;
      case 'SET_CATEGORY_LIMIT':
        return <MdTune {...iconProps} />;
      case 'CONTRIBUTE_TO_PROJECT':
        return <MdSavings {...iconProps} />;
      case 'REBALANCE_BUDGETS':
        return <MdAccountBalanceWallet {...iconProps} />;
      case 'REALLOCATE_BUDGET':
        return <MdSwapHoriz {...iconProps} />;
      case 'REVIEW_SUBSCRIPTION':
        return <MdSubscriptions {...iconProps} />;
      case 'INCREASE_CONTRIBUTION':
        return <MdArrowUpward {...iconProps} />;
      case 'CREATE_PROJECT':
        return <MdFolderSpecial {...iconProps} />;
      default:
        return <MdLightbulb {...iconProps} />;
    }
  };

  const title = suggestionTitle(suggestion.type, t);
  const ask = askSentence(suggestion, t, projectName);

  return (
    <div
      onClick={() => onClickDetail(suggestion)}
      className="p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between group"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.light,
      }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: chipStyle.bgColor,
                color: chipStyle.color,
                borderColor: chipStyle.borderColor,
                borderWidth: '1px',
              }}
            >
              {t(chipStyle.labelKey)}
            </span>
          </div>

          <span className="text-xs" style={{ color: colors.text.secondary }}>
            {new Date(suggestion.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3 mt-2">
          <div
            className="p-3 rounded-xl shrink-0"
            style={{ backgroundColor: `${colors.interactive.primary}15` }}
          >
            {renderTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-bold truncate"
              style={{ color: colors.text.primary }}
            >
              {title}
            </h3>
            <p
              className="text-sm font-medium mt-1 leading-relaxed line-clamp-2"
              style={{ color: colors.text.secondary }}
            >
              {ask}
            </p>
          </div>
        </div>
      </div>

      {/* Footer link trigger */}
      <div
        className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold transition-colors group-hover:text-indigo-600"
        style={{ borderColor: colors.border.light, color: colors.interactive.primary }}
      >
        <span>{t('suggestions.viewDetail') || 'Xem chi tiết & Thao tác'}</span>
        <MdChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
