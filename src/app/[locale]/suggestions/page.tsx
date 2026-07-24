'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionCard } from '@/components/organisms/suggestions/SuggestionCard';
import { SuggestionDetailModal } from '@/components/organisms/suggestions/SuggestionDetailModal';
import { Suggestion, SuggestionStatus } from '@/types/suggestion.types';
import { MdLightbulb, MdRefresh, MdInbox } from 'react-icons/md';

const TABS: { status?: SuggestionStatus; labelKey: string }[] = [
  { status: 'PENDING', labelKey: 'suggestions.tabs.pending' },
  { status: 'ACCEPTED', labelKey: 'suggestions.tabs.accepted' },
  { status: 'DISMISSED', labelKey: 'suggestions.tabs.dismissed' },
  { status: 'EXPIRED', labelKey: 'suggestions.tabs.expired' },
];

export default function SuggestionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<SuggestionStatus>('PENDING');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { suggestions, loading, error, reload, respondToSuggestion } = useSuggestions(activeTab);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  if (isInitializing || !isAuthenticated) {
    return null;
  }

  const handleOpenDetail = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedSuggestion(null);
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={1} className="text-2xl font-bold flex items-center gap-2.5">
              <MdLightbulb className="w-7 h-7" style={{ color: colors.interactive.primary }} />
              {t('suggestions.title') || 'Gợi ý AI & Khuyến nghị'}
            </Heading>
            <Text className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              {t('suggestions.subtitle') || 'Danh sách gợi ý hành động tài chính được cá nhân hóa cho bạn'}
            </Text>
          </div>

          <button
            onClick={() => reload()}
            disabled={loading}
            className="p-2.5 rounded-xl border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
            style={{
              borderColor: colors.border.light,
              color: colors.text.primary,
            }}
          >
            <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh') || 'Làm mới'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          className="flex items-center gap-2 p-1.5 rounded-2xl border overflow-x-auto"
          style={{
            backgroundColor: colors.surface.primary,
            borderColor: colors.border.light,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.status;
            return (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status!)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive ? 'shadow-xs' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive ? colors.interactive.primary : 'transparent',
                  color: isActive ? '#ffffff' : colors.text.secondary,
                }}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl animate-pulse"
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
        ) : suggestions.length === 0 ? (
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
              <MdInbox className="w-10 h-10" style={{ color: colors.interactive.primary }} />
            </div>
            <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
              {t('suggestions.empty_title') || 'Không có gợi ý nào ở mục này'}
            </h3>
            <p className="text-sm max-w-md" style={{ color: colors.text.secondary }}>
              {t('suggestions.empty_subtitle') ||
                'Khi hệ thống phát hiện cơ hội tối ưu ngân sách hoặc tiết kiệm, các gợi ý mới sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onClickDetail={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      <SuggestionDetailModal
        suggestion={selectedSuggestion}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onRespond={respondToSuggestion}
      />
    </SidebarLayout>
  );
}
