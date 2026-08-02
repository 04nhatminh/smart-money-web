'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { formatVietnamsePrice } from '@/lib/format';
import { getCookie } from '@/lib/auth';
import { useLocale, useTranslations } from 'next-intl';
import { MdClose, MdAutoAwesome, MdCheck, MdError, MdRefresh } from 'react-icons/md';
import { UserFinancialModal } from '.';
import { useUserFinancial, useBudgets } from '@/hooks';

interface GenerateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface BudgetCategorySuggestion {
  category: string;
  ratio: number;
  amount: number;
}

export const GenerateBudgetModal: React.FC<GenerateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const { getUserFinancial } = useUserFinancial();
  const { listBudgets } = useBudgets();
  const locale = useLocale();
  const t = useTranslations();

  // Onboarding sub-modals
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  // States
  const [step, setStep] = useState<'CHECKING' | 'READY' | 'LOADING' | 'SUGGESTION' | 'ERROR'>('CHECKING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>(t('generateBudgetModal.initializing'));
  const [jobId, setJobId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BudgetCategorySuggestion[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [spendableEnvelope, setSpendableEnvelope] = useState<number>(0);
  const [surplusToSavings, setSurplusToSavings] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentBudgets, setCurrentBudgets] = useState<any[]>([]);
  const [reason, setReason] = useState<string | null>(null);

  const getFormattedPeriod = () => {
    if (locale === 'vi') {
      return `Tháng ${selectedMonth}/${selectedYear}`;
    }
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString(locale, { month: 'long' });
    return `${monthName} ${selectedYear}`;
  };

  // Check setup flags saved in cookies or user object
  const checkSetupStatus = async () => {
    // Check locally saved user state first, fallback to cookies
    const financialCookie = getCookie('financial_setup_completed');

    let financialSetupCompleted = user?.financialSetupCompleted || financialCookie === 'true';

    // If not completed according to local state, verify with backend directly
    if (!financialSetupCompleted) {
      setStep('CHECKING');
      try {
        const financialRes = await getUserFinancial();

        if (financialRes.success && financialRes.data) {
          financialSetupCompleted = true;
          // Sync with local state
          updateUser({ financialSetupCompleted: true });
        }
      } catch (err) {
        console.error('Failed to verify setup status with backend:', err);
      }
    }

    if (!financialSetupCompleted) {
      setErrorMsg(
        t('generateBudgetModal.pleaseCompleteSetup')
      );
      setStep('ERROR');
    } else {
      setErrorMsg(null);
      setStep('READY');
    }
  };

  const loadCurrentBudgets = async (m: number, y: number) => {
    try {
      const res = await listBudgets(m, y);
      if (res.success && res.data) {
        const budgetList = res.data.items || res.data.content || res.data.budgets || [];
        setCurrentBudgets(budgetList);
      }
    } catch (e) {
      console.error('Failed to load current budgets in modal:', e);
    }
  };

  const getCurrentBudgetForCategory = (suggestionCategory: string) => {
    let normalized = suggestionCategory;
    if (normalized === 'TRANSPORT') {
      normalized = 'TRANSPORTATION';
    }
    const match = currentBudgets.find((b) => {
      let bCat = b.category;
      if (bCat === 'TRANSPORT') {
        bCat = 'TRANSPORTATION';
      }
      return bCat === normalized;
    });
    return match ? match.amountLimit : 0;
  };

  useEffect(() => {
    if (isOpen) {
      checkSetupStatus();
      const currentM = new Date().getMonth() + 1;
      const currentY = new Date().getFullYear();
      setSelectedMonth(currentM);
      setSelectedYear(currentY);
      loadCurrentBudgets(currentM, currentY);
    } else {
      // Reset state on close
      setStep('CHECKING');
      setErrorMsg(null);
      setJobId(null);
      setSuggestions([]);
      setCurrentBudgets([]);
      setReason(null);
    }
  }, [isOpen, user]);

  const handleGenerateClick = async () => {
    setStep('LOADING');
    setErrorMsg(null);
    setLoadingStatus('Calculating budget allocation plan...');

    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.budgets.computeAllocation, {});
      const payload = response.data || response;

      const planData = payload.allocations ? payload : (payload.data || payload);
      if (planData && Array.isArray(planData.allocations)) {
        const allocations = planData.allocations || [];
        const envelope = Number(planData.envelope ?? planData.safeSpending) || 0;
        const totalAmt = allocations.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

        const categorySuggestions: BudgetCategorySuggestion[] = allocations.map((item: any) => {
          const amt = Number(item.amount) || 0;
          return {
            category: item.category,
            amount: amt,
            ratio: totalAmt > 0 ? amt / totalAmt : 0,
          };
        });

        setTotalBudget(totalAmt);
        setSpendableEnvelope(envelope);
        setSurplusToSavings(Number(planData.surplusToSavings) || 0);
        setSuggestions(categorySuggestions);
        setReason(
          planData.coldStart
            ? 'Based on general budget template (cold start).'
            : planData.overCommitted
            ? 'Your commitments equal or exceed your target envelope.'
            : 'Based on your transaction history and financial commitments.'
        );
        setStep('SUGGESTION');
      } else {
        throw new Error(payload?.message || 'Failed to compute budget allocation');
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to calculate budget allocation';
      setErrorMsg(msg);
      setStep('ERROR');
    }
  };

  const handleConfirmBudgets = async () => {
    setStep('LOADING');
    setLoadingStatus('Saving generated budget categories...');

    try {
      // Map CATEGORY names (e.g. TRANSPORT to TRANSPORTATION)
      const mappedBudgets = suggestions.map((item) => {
        let categoryName = item.category;
        if (categoryName === 'TRANSPORT') {
          categoryName = 'TRANSPORTATION';
        }
        return {
          category: categoryName,
          amountLimit: item.amount,
        };
      });

      const requestPayload = {
        budgets: mappedBudgets,
        month: selectedMonth,
        year: selectedYear,
      };

      // Calls PUT /api/v1/budgets/bulk
      const response = await apiClient.put<any>(API_ENDPOINTS.budgets.createBulk, requestPayload);

      if (response && (response.success || response.data || response.status === 200)) {
        setStep('CHECKING');
        onClose();
        onSuccess?.();
      } else {
        throw new Error('Failed to update budgets list');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to confirm and save budgets');
      setStep('ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          pointerEvents: 'auto',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 10000 }}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto overflow-y-auto max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 rounded-t-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <div className="flex items-center gap-2">
              <MdAutoAwesome className="w-6 h-6" style={{ color: colors.interactive.primary }} />
              <Heading level={3} className="m-0">
                {locale === 'vi' ? 'Tự Động Tạo Ngân Sách AI' : 'AI Budget Generation'}
              </Heading>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity hover:cursor-pointer"
              aria-label="Close modal"
            >
              <MdClose size={24} style={{ color: colors.text.secondary }} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* STEP: ERROR or SETUP MISSING */}
            {step === 'ERROR' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border flex gap-3" style={{ borderColor: '#EF4444', backgroundColor: '#FEE2E2' }}>
                  <MdError className="w-6 h-6 flex-shrink-0" style={{ color: '#DC2626' }} />
                  <Text className="text-sm font-semibold whitespace-pre-line" style={{ color: '#7F1D1D' }}>
                    {errorMsg}
                  </Text>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    {locale === 'vi' ? 'Đóng' : 'Close'}
                  </Button>
                  {errorMsg?.includes('complete') && (
                    <Button variant="primary" className="flex-1" onClick={() => setIsFinancialModalOpen(true)}>
                      {locale === 'vi' ? 'Thiết Lập Hồ Sơ' : 'Setup Profile'}
                    </Button>
                  )}
                  {!errorMsg?.includes('complete') && (
                    <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={checkSetupStatus}>
                      <MdRefresh className="w-5 h-5" /> {locale === 'vi' ? 'Thử Lại' : 'Retry Check'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* STEP: READY TO GENERATE */}
            {step === 'READY' && (
              <div className="space-y-6 text-center py-4">
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${colors.interactive.primary}15` }}>
                  <MdAutoAwesome className="w-10 h-10" style={{ color: colors.interactive.primary }} />
                </div>
                <div className="space-y-2">
                  <Heading level={4} style={{ color: colors.text.primary }}>
                    {locale === 'vi' ? 'Sẵn Sàng Tạo Ngân Sách Thông Minh' : 'Ready to Build Your Smart Budget'}
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-sm px-4">
                    {locale === 'vi'
                      ? 'Trợ lý AI của chúng tôi sẽ phân tích hồ sơ tài chính, chi tiết thu nhập hàng tháng và lịch sử giao dịch của bạn để phân bổ một kế hoạch ngân sách tùy chỉnh tối ưu hóa cho nhu cầu của bạn.'
                      : 'Our AI assistant will analyze your financial profile, monthly income details, and transaction history to allocate a custom budget plan optimized for your needs.'}
                  </Text>
                </div>

                {/* Period selection (Fixed to current month/year) */}
                <div className="max-w-xs mx-auto space-y-2 text-center pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-center" style={{ color: colors.text.secondary }}>
                    {locale === 'vi' ? 'Tháng / Năm Ngân Sách' : 'Budget Month / Year'}
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-lg border font-semibold text-sm text-center"
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                      color: colors.text.primary
                    }}
                  >
                    {getFormattedPeriod()}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    {locale === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={handleGenerateClick}>
                    <MdAutoAwesome className="w-5 h-5" style={{ color: colors.text.inverse }} />
                    <span>{locale === 'vi' ? 'Tạo Ngay' : 'Generate Now'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: LOADING & WEBSOCKET PROGRESS */}
            {step === 'LOADING' && (
              <div className="space-y-6 text-center py-8">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${colors.interactive.primary}33`, borderTopColor: colors.interactive.primary }} />
                </div>
                <div className="space-y-2">
                  <Text className="font-semibold text-lg" style={{ color: colors.text.primary }}>
                    {locale === 'vi' ? 'Đang Tạo Kế Hoạch Ngân Sách' : 'Generating Budget Plan'}
                  </Text>
                  <Text style={{ color: colors.text.secondary }} className="text-sm animate-pulse">
                    {loadingStatus}
                  </Text>
                </div>
              </div>
            )}

            {/* STEP: SUGGESTIONS RECEIVED */}
            {step === 'SUGGESTION' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: `${colors.interactive.primary}10`, borderColor: `${colors.interactive.primary}30` }}>
                  <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                    {locale === 'vi' ? 'Tổng Ngân Sách Đề Xuất (Theo Danh Mục)' : 'Total Recommended Category Budget'}
                  </Text>
                  <Heading level={2} className="mt-1" style={{ color: colors.interactive.primary }}>
                    {formatVietnamsePrice(totalBudget)}
                  </Heading>
                </div>

                {reason && (
                  <div className="p-4 rounded-xl border text-left text-sm" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <Text className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: colors.interactive.primary }}>
                      {locale === 'vi' ? 'Lý do thay đổi từ AI:' : 'AI Reasoning:'}
                    </Text>
                    <Text style={{ color: colors.text.secondary }} className="italic">
                      {reason}
                    </Text>
                  </div>
                )}

                <Heading level={4} style={{ color: colors.text.primary }} className="mb-2">
                  {locale === 'vi' ? 'Chi Tiết Phân Bổ' : 'Allocation Breakdown'}
                </Heading>

                <div className="divide-y max-h-60 overflow-y-auto pr-1" style={{ borderColor: colors.border.light }}>
                  {suggestions.map((item, idx) => {
                    const currentLimit = getCurrentBudgetForCategory(item.category);
                    return (
                      <div key={idx} className="flex justify-between py-3">
                        <div>
                          <Text className="font-bold text-sm" style={{ color: colors.text.primary }}>
                            {item.category}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.text.secondary }}>
                            {locale === 'vi' ? 'Tỷ lệ phân bổ:' : 'Allocation ratio:'} {(item.ratio * 100).toFixed(1)}%
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text className="text-xs" style={{ color: colors.text.secondary, textDecoration: 'line-through' }}>
                            {formatVietnamsePrice(currentLimit)}
                          </Text>
                          <Text className="font-extrabold text-sm" style={{ color: colors.interactive.primary }}>
                            {formatVietnamsePrice(item.amount)}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {spendableEnvelope > 0 && (
                  <div className="p-3.5 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <div className="flex justify-between items-center">
                      <Text style={{ color: colors.text.secondary }}>
                        {locale === 'vi' ? 'Hạn mức chi tiêu tối đa (Income Envelope):' : 'Max Spendable Limit (Envelope):'}
                      </Text>
                      <Text className="font-bold" style={{ color: colors.text.primary }}>
                        {formatVietnamsePrice(spendableEnvelope)}
                      </Text>
                    </div>
                    {surplusToSavings > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: colors.border.light }}>
                        <Text style={{ color: colors.interactive.primary }}>
                          {locale === 'vi' ? 'Thặng dư dự kiến chuyển vào tiết kiệm:' : 'Projected Surplus to Savings:'}
                        </Text>
                        <Text className="font-bold" style={{ color: colors.interactive.primary }}>
                          {formatVietnamsePrice(surplusToSavings)}
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: colors.background.secondary, color: colors.text.tertiary }}>
                  {locale === 'vi'
                    ? `Xác nhận sẽ cập nhật hàng loạt các danh mục ngân sách cho ${getFormattedPeriod()}.`
                    : `Confirming will bulk update your budget categories for ${getFormattedPeriod()}.`}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('READY')}>
                    {locale === 'vi' ? 'Quay Lại' : 'Back'}
                  </Button>
                  <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={handleConfirmBudgets}>
                    <MdCheck className="w-5 h-5" /> {locale === 'vi' ? 'Xác Nhận & Áp Dụng' : 'Confirm & Apply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals for setup */}
      <UserFinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => {
          setIsFinancialModalOpen(false);
          checkSetupStatus();
        }}
      />
    </>
  );
};
