'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { useSuggestions } from '@/hooks/useSuggestions';
import { askSentence, suggestionTitle } from '@/lib/suggestionFormat';
import { SuggestionDetailModal } from './SuggestionDetailModal';
import { Suggestion } from '@/types/suggestion.types';
import { MdLightbulb, MdChevronRight, MdArrowForward } from 'react-icons/md';

export const PendingSuggestionsWidget: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const { suggestions, loading, error, respondToSuggestion } = useSuggestions('PENDING');

  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (loading || error || suggestions.length === 0) {
    return null;
  }

  const topSuggestion = suggestions[0];
  const title = suggestionTitle(topSuggestion.type, t);
  const ask = askSentence(topSuggestion, t);

  const handleOpenDetail = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setIsDetailOpen(true);
  };

  return (
    <>
      <div
        className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-all hover:shadow-md"
        style={{
          backgroundColor: `${colors.interactive.primary}08`,
          borderColor: `${colors.interactive.primary}25`,
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="p-3 rounded-2xl shrink-0 mt-0.5"
            style={{ backgroundColor: `${colors.interactive.primary}18` }}
          >
            <MdLightbulb className="w-6 h-6" style={{ color: colors.interactive.primary }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.interactive.primary }}>
                {t.has('suggestions.aiSuggestionsCount')
                  ? t('suggestions.aiSuggestionsCount', { count: suggestions.length })
                  : `Gợi ý AI (${suggestions.length})`}
              </span>
            </div>
            <h4 className="text-sm font-bold truncate mt-0.5" style={{ color: colors.text.primary }}>
              {title}
            </h4>
            <p className="text-xs font-medium line-clamp-1 mt-0.5" style={{ color: colors.text.secondary }}>
              {ask}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => handleOpenDetail(topSuggestion)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:shadow-md flex items-center gap-1.5"
            style={{ backgroundColor: colors.interactive.primary }}
          >
            <span>{t.has('suggestions.reviewNow') ? t('suggestions.reviewNow') : 'Duyệt ngay'}</span>
            <MdArrowForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => router.push(`/${locale}/suggestions`)}
            className="p-2 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: colors.text.secondary }}
            title={t.has('suggestions.see_all') ? t('suggestions.see_all') : 'Xem tất cả gợi ý'}
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <SuggestionDetailModal
        suggestion={selectedSuggestion}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSuggestion(null);
        }}
        onRespond={respondToSuggestion}
      />
    </>
  );
};
