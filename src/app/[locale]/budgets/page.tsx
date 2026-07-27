'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Alert, Skeleton } from '@/components/atoms';
import { BudgetProgressCard, DatePeriodSelector, GenerateBudgetModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Budget } from '@/types/budget.api';
import { formatVietnamsePrice } from '@/lib/format';
import { MdAutoAwesome } from 'react-icons/md';

export default function BudgetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();
  const { listBudgets, isLoading } = useBudgets();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isGenerateBudgetModalOpen, setIsGenerateBudgetModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load budgets
  useEffect(() => {
    if (isAuthenticated) {
      loadBudgets();
    }
  }, [isAuthenticated, currentMonth, currentYear]);

  const loadBudgets = async () => {
    try {
      setError(null);
      const result = await listBudgets(currentMonth, currentYear);

      if (result.success && result.data) {
        const budgetList = result.data.items || result.data.content || result.data.budgets || [];
        setBudgets(budgetList);
      } else {
        setError(result.error || t('budgets.failedLoad'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('budgets.failedLoad');
      setError(errorMsg);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(parseInt(e.target.value));
  };

  if (isInitializing) {
    return (
      <SidebarLayout>
        <Heading level={2}>{t('common.loading')}</Heading>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate summary statistics
  const totalLimit = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  return (
    <SidebarLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={2}>{t('budgets.title')}</Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              {t('budgets.subtitle')}
            </Text>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setIsGenerateBudgetModalOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
              style={{
                border: `2px solid ${colors.interactive.primary}`,
                color: colors.interactive.primary,
                backgroundColor: 'transparent',
                borderRadius: '0.75rem',
              }}
            >
              <MdAutoAwesome className="w-5 h-5" />
              {t('budgets.generateBudget')}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} />
        )}

        {/* Month and Year Selector */}
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              {t('budgets.selectMonthYear')}
            </label>
            <DatePeriodSelector
              currentMonth={currentMonth}
              currentYear={currentYear}
              onChange={(month, year) => {
                setCurrentMonth(month);
                setCurrentYear(year);
              }}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              {t('budgets.totalBudget')}
            </Text>
            {isLoading ? (
              <Skeleton height={28} width="60%" className="mt-2" />
            ) : (
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text.primary }}>
                {formatVietnamsePrice(totalLimit)}
              </Text>
            )}
          </div>

          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              {t('budgets.totalSpent')}
            </Text>
            {isLoading ? (
              <Skeleton height={28} width="60%" className="mt-2" />
            ) : (
              <Text className="text-2xl font-bold mt-2" style={{ color: '#EF4444' }}>
                {formatVietnamsePrice(totalSpent)}
              </Text>
            )}
          </div>

          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              {t('budgets.remaining')}
            </Text>
            {isLoading ? (
              <Skeleton height={28} width="60%" className="mt-2" />
            ) : (
              <Text className="text-2xl font-bold mt-2" style={{ color: '#10B981' }}>
                {formatVietnamsePrice(totalRemaining)}
              </Text>
            )}
          </div>
        </div>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border bg-white space-y-4 shadow-xs"
                style={{ borderColor: colors.border.light }}
              >
                <div className="flex justify-between items-center">
                  <Skeleton height={20} width="50%" />
                  <Skeleton height={24} width="25%" />
                </div>
                <Skeleton height={12} width="100%" />
                <div className="flex justify-between pt-2">
                  <Skeleton height={16} width="35%" />
                  <Skeleton height={16} width="35%" />
                </div>
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center border-2 border-dashed"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <Text style={{ color: colors.text.secondary }}>
              {t('budgets.noBudgetsYet')}
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map(budget => (
              <BudgetProgressCard
                key={budget.budgetId}
                budget={budget}
              />
            ))}
          </div>
        )}
      </div>

      <GenerateBudgetModal
        isOpen={isGenerateBudgetModalOpen}
        onClose={() => setIsGenerateBudgetModalOpen(false)}
        onSuccess={loadBudgets}
      />
    </SidebarLayout>
  );
}
