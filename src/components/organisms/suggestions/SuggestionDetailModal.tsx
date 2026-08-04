'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { Suggestion } from '@/types/suggestion.types';
import {
  STATUS_CHIPS,
  askSentence,
  suggestionTitle,
} from '@/lib/suggestionFormat';
import { localizeInsight, getSeverityStyle } from '@/lib/insightFormat';
import { formatVietnamsePrice } from '@/lib/format';
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdLightbulb,
  MdInsights,
  MdArrowForward,
} from 'react-icons/md';

interface SuggestionDetailModalProps {
  suggestion: Suggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond: (id: string, accept: boolean) => Promise<{ success: boolean; error?: string }>;
  projectName?: string | null;
}

export const SuggestionDetailModal: React.FC<SuggestionDetailModalProps> = ({
  suggestion,
  isOpen,
  onClose,
  onRespond,
  projectName,
}) => {
  const t = useTranslations();
  const { colors } = useTheme();

  const [loadingAction, setLoadingAction] = useState<'accept' | 'dismiss' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !suggestion) return null;

  const chipStyle = STATUS_CHIPS[suggestion.status] || STATUS_CHIPS.PENDING;
  const title = suggestionTitle(suggestion.type, t);
  const askText = askSentence(suggestion, t, projectName);

  const insightSnapshot = suggestion.payload?.insightSnapshot;
  const insightText = insightSnapshot ? localizeInsight(insightSnapshot, t) : null;
  const severityStyle = insightSnapshot ? getSeverityStyle(insightSnapshot.severity) : null;

  const action = suggestion.payload?.proposedAction;
  const budgetAdjustments = action?.budgetAdjustments || [];

  const handleAction = async (accept: boolean) => {
    try {
      setErrorMsg(null);
      setLoadingAction(accept ? 'accept' : 'dismiss');
      const res = await onRespond(suggestion.id, accept);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || (accept ? 'Không thể chấp nhận gợi ý' : 'Không thể bỏ qua gợi ý'));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.light,
        }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: colors.border.light }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: `${colors.interactive.primary}15` }}
            >
              <MdLightbulb className="w-6 h-6" style={{ color: colors.interactive.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                {title}
              </h2>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5"
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
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: colors.text.secondary }}
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Ask Sentence / Recommendation Callout */}
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: `${colors.interactive.primary}08`,
              borderColor: `${colors.interactive.primary}30`,
            }}
          >
            <p className="text-base font-semibold leading-relaxed" style={{ color: colors.text.primary }}>
              {askText}
            </p>
          </div>

          {/* Why We're Asking (Insight Snapshot) */}
          {insightSnapshot && insightText && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: colors.text.secondary }}
                >
                  <MdInsights className="w-4 h-4" style={{ color: colors.interactive.primary }} />
                  {t('suggestions.whyAsking') || 'Lý do đưa ra gợi ý này'}
                </span>
                {severityStyle && (
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-semibold"
                    style={{ backgroundColor: severityStyle.badgeBg, color: severityStyle.badgeText }}
                  >
                    {severityStyle.label}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: colors.text.primary }}>
                {insightText}
              </p>
            </div>
          )}

          {/* Multi-budget adjustments table (REBALANCE / REALLOCATE) */}
          {budgetAdjustments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold" style={{ color: colors.text.primary }}>
                {t('suggestions.budgetAdjustments') || 'Chi tiết điều chỉnh ngân sách'}
              </h4>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: colors.border.light }}>
                <table className="w-full text-sm text-left">
                  <thead
                    className="text-xs font-bold uppercase border-b"
                    style={{
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                      color: colors.text.secondary,
                    }}
                  >
                    <tr>
                      <th className="px-4 py-3">{t('suggestions.table.category') || 'Danh mục'}</th>
                      <th className="px-4 py-3">{t('suggestions.table.currentLimit') || 'Hạn mức cũ'}</th>
                      <th className="px-4 py-3 text-right">{t('suggestions.table.newLimit') || 'Hạn mức mới'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
                    {budgetAdjustments.map((adj, idx) => (
                      <tr key={idx} style={{ backgroundColor: colors.surface.primary }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: colors.text.primary }}>
                          {t.has(`categories.${adj.category}`)
                            ? t(`categories.${adj.category}`)
                            : t.has(`categories.${adj.category.toLowerCase()}`)
                            ? t(`categories.${adj.category.toLowerCase()}`)
                            : adj.category}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatVietnamsePrice(adj.currentLimit)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: colors.interactive.primary }}>
                          <span className="inline-flex items-center gap-1">
                            <MdArrowForward className="w-3.5 h-3.5 text-gray-400" />
                            {formatVietnamsePrice(adj.newLimit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Details Grid */}
          {action?.resolvedValue != null && budgetAdjustments.length === 0 && (
            <div
              className="p-4 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              }}
            >
              <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                {t('suggestions.proposedValue') || 'Giá trị đề xuất:'}
              </span>
              <span className="text-base font-bold" style={{ color: colors.interactive.primary }}>
                {formatVietnamsePrice(action.resolvedValue)}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-3"
          style={{
            borderColor: colors.border.light,
            backgroundColor: colors.background.primary,
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
            style={{
              borderColor: colors.border.light,
              color: colors.text.primary,
              backgroundColor: colors.surface.primary,
            }}
          >
            {t('common.close') || 'Đóng'}
          </button>

          {suggestion.status === 'PENDING' && (
            <>
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <MdCancel className="w-4 h-4" />
                {loadingAction === 'dismiss'
                  ? (t('suggestions.dismissing') || 'Đang bỏ qua...')
                  : (t('suggestions.dismiss') || 'Bỏ qua')}
              </button>

              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: colors.interactive.primary }}
              >
                <MdCheckCircle className="w-4 h-4" />
                {loadingAction === 'accept'
                  ? (t('suggestions.accepting') || 'Đang áp dụng...')
                  : (t('suggestions.accept') || 'Chấp nhận & Áp dụng')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
