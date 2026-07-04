'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { formatVietnamsePrice } from '@/lib/format';
import { getCookie } from '@/lib/auth';
import { MdClose, MdAutoAwesome, MdCheck, MdError, MdRefresh } from 'react-icons/md';
import { UserFinancialModal } from '.';
import { useUserFinancial } from '@/hooks';

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
  const { subscribe } = useWebSocket();
  const { getUserFinancial } = useUserFinancial();

  // Onboarding sub-modals
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  // States
  const [step, setStep] = useState<'CHECKING' | 'READY' | 'LOADING' | 'SUGGESTION' | 'ERROR'>('CHECKING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing budget assistant...');
  const [jobId, setJobId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BudgetCategorySuggestion[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
        `Please complete the financial setup before generating a budget plan.`
      );
      setStep('ERROR');
    } else {
      setErrorMsg(null);
      setStep('READY');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkSetupStatus();
      setSelectedMonth(new Date().getMonth() + 1);
      setSelectedYear(new Date().getFullYear());
    } else {
      // Reset state on close
      setStep('CHECKING');
      setErrorMsg(null);
      setJobId(null);
      setSuggestions([]);
    }
  }, [isOpen, user]);

  // Handle WebSocket subscription
  useEffect(() => {
    if (!jobId || step !== 'LOADING') return;

    console.log(`[GenerateBudgetModal] Subscribing to job: ${jobId}`);
    setLoadingStatus('AI is analyzing your profile and transactions...');

    const unsubscribe = subscribe(jobId, (data) => {
      console.log('[GenerateBudgetModal] WS data received:', data);

      if ((data.status === 'SUCCESS' || data.status === 'COMPLETED') && data.result) {
        let resultObj = data.result;
        if (typeof resultObj === 'string') {
          try {
            resultObj = JSON.parse(resultObj);
          } catch (e) {
            console.error('Failed to parse WS result string:', e);
          }
        }
        setTotalBudget(resultObj.totalBudget || 0);
        setSuggestions(resultObj.categories || []);
        setStep('SUGGESTION');
      } else if (data.status === 'FAILED' || data.status === 'ERROR') {
        setErrorMsg(data.error || 'AI budget allocation failed. Please try again.');
        setStep('ERROR');
      } else {
        setLoadingStatus(data.statusMessage || 'Processing budget allocation...');
      }
    });

    // Timeout fallback after 60 seconds
    const timer = setTimeout(() => {
      if (step === 'LOADING') {
        setErrorMsg('Request timed out. Please check your network connection.');
        setStep('ERROR');
        unsubscribe();
      }
    }, 60000);

    // Polling fallback in case WS fails or message is missed
    const pollInterval = setInterval(async () => {
      try {
        console.log(`[GenerateBudgetModal] Polling job status: ${jobId}`);
        const response = await apiClient.get<any>(`/api/v1/ai/${jobId}`);
        const data = response.data || response;
        console.log('[GenerateBudgetModal] Polled data:', data);

        if (data) {
          if ((data.status === 'SUCCESS' || data.status === 'COMPLETED') && data.result) {
            let resultObj = data.result;
            if (typeof resultObj === 'string') {
              try {
                resultObj = JSON.parse(resultObj);
              } catch (e) {
                console.error('Failed to parse polled result string:', e);
              }
            }
            setTotalBudget(resultObj.totalBudget || 0);
            setSuggestions(resultObj.categories || []);
            setStep('SUGGESTION');
          } else if (data.status === 'FAILED' || data.status === 'ERROR') {
            setErrorMsg(data.error || 'AI budget allocation failed. Please try again.');
            setStep('ERROR');
          } else if (data.statusMessage) {
            setLoadingStatus(data.statusMessage);
          }
        }
      } catch (err) {
        console.error('[GenerateBudgetModal] Error polling job status:', err);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearInterval(pollInterval);
    };
  }, [jobId, step]);

  const handleGenerateClick = async () => {
    setStep('LOADING');
    setErrorMsg(null);
    setLoadingStatus('Creating budget allocation request...');

    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.ai.generateBudget, {});

      const payload = response.data || response;
      if (payload && payload.jobId) {
        setJobId(payload.jobId);
      } else if (payload && payload.data && payload.data.jobId) {
        setJobId(payload.data.jobId);
      } else {
        throw new Error('Invalid response format: missing jobId');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initiate AI budget generation');
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
                AI Budget Generation
              </Heading>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity"
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
                    Close
                  </Button>
                  {errorMsg?.includes('complete') && (
                    <Button variant="primary" className="flex-1" onClick={() => setIsFinancialModalOpen(true)}>
                      Setup Profile
                    </Button>
                  )}
                  {!errorMsg?.includes('complete') && (
                    <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={checkSetupStatus}>
                      <MdRefresh className="w-5 h-5" /> Retry Check
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
                    Ready to Build Your Smart Budget
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-sm px-4">
                    Our AI assistant will analyze your financial profile, monthly income details, and transaction history to allocate a custom budget plan optimized for your needs.
                  </Text>
                </div>

                {/* Period selection (Fixed to current month/year) */}
                <div className="max-w-xs mx-auto space-y-2 text-center pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-center" style={{ color: colors.text.secondary }}>
                    Budget Month / Year
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-lg border font-semibold text-sm text-center"
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                      color: colors.text.primary
                    }}
                  >
                    Month {selectedMonth} / {selectedYear}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={handleGenerateClick}>
                    <MdAutoAwesome className="w-5 h-5" style={{ color: colors.text.inverse }} />
                    <span>Generate Now</span>
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
                    Generating Budget Plan
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
                    AI Recommended Total Budget
                  </Text>
                  <Heading level={2} className="mt-1" style={{ color: colors.interactive.primary }}>
                    {formatVietnamsePrice(totalBudget)}
                  </Heading>
                </div>

                <Heading level={4} style={{ color: colors.text.primary }} className="mb-2">
                  Allocation Breakdown
                </Heading>

                <div className="divide-y max-h-60 overflow-y-auto pr-1" style={{ borderColor: colors.border.light }}>
                  {suggestions.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-3">
                      <div>
                        <Text className="font-bold text-sm" style={{ color: colors.text.primary }}>
                          {item.category}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.text.secondary }}>
                          Allocation ratio: {(item.ratio * 100).toFixed(1)}%
                        </Text>
                      </div>
                      <Text className="font-extrabold text-sm" style={{ color: colors.interactive.primary }}>
                        {formatVietnamsePrice(item.amount)}
                      </Text>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: colors.background.secondary, color: colors.text.tertiary }}>
                  Confirming will bulk update your budget categories for {selectedMonth}/{selectedYear}.
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('READY')}>
                    Back
                  </Button>
                  <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={handleConfirmBudgets}>
                    <MdCheck className="w-5 h-5" /> Confirm & Apply
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
