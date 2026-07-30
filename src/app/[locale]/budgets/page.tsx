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
import { MdAutoAwesome, MdAccountBalanceWallet, MdCreditCard, MdSavings } from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function BudgetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors, colorScheme } = useTheme();
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

  const spentPercent = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;
  const remainingPercent = totalLimit > 0 ? Math.max(0, 100 - spentPercent) : 100;

  return (
    <SidebarLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={2}>{t('budgets.title')}</Heading>
            <Text style={{ color: colors.text.secondary }}>
              {t('budgets.subtitle')}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button
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

        {/* Budget Overview Panel */}
        <div
          className="rounded-2xl p-6 border transition-all duration-300 shadow-md"
          style={{
            borderColor: colors.border.light,
            backgroundColor: colors.surface.primary,
            boxShadow: colorScheme === 'dark' ? '0 4px 24px -2px rgba(0, 0, 0, 0.4)' : '0 4px 24px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <Skeleton height={24} width="30%" />
                <Skeleton height={48} width="60%" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Skeleton height={60} width="100%" />
                  <Skeleton height={60} width="100%" />
                </div>
                <Skeleton height={12} width="100%" className="pt-2" />
              </div>
              <div className="lg:col-span-5 flex justify-center items-center h-48">
                <Skeleton height={150} width={150} className="rounded-full" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Stats & Progress Bar */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <Heading level={5} className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.text.tertiary }}>
                    {t('budgets.remaining').toUpperCase()}
                  </Heading>
                  <div className="flex items-baseline gap-2 mt-1">
                    <Text
                      className="text-3xl sm:text-4xl font-black tracking-tight"
                      style={{ color: totalRemaining < 0 ? '#EF4444' : '#10B981' }}
                    >
                      {formatVietnamsePrice(totalRemaining)}
                    </Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                      VND
                    </Text>
                  </div>
                </div>

                {/* Sub Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Budget Sub-card */}
                  <div
                    className="p-3.5 rounded-xl border flex items-center gap-3.5"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.surface.secondary,
                    }}
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
                      <MdAccountBalanceWallet className="w-5 h-5" />
                    </div>
                    <div>
                      <Heading level={6} className="text-xs font-bold" style={{ color: colors.text.secondary }}>
                        {t('budgets.totalBudget')}
                      </Heading>
                      <Text className="text-base font-extrabold tracking-tight" style={{ color: colors.text.primary }}>
                        {formatVietnamsePrice(totalLimit)}
                      </Text>
                    </div>
                  </div>

                  {/* Total Spent Sub-card */}
                  <div
                    className="p-3.5 rounded-xl border flex items-center gap-3.5"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.surface.secondary,
                    }}
                  >
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
                      <MdCreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <Heading level={6} className="text-xs font-bold" style={{ color: colors.text.secondary }}>
                        {t('budgets.totalSpent')}
                      </Heading>
                      <div className="flex items-baseline gap-1.5">
                        <Text className="text-base font-extrabold tracking-tight" style={{ color: totalSpent > totalLimit ? '#EF4444' : colors.text.primary }}>
                          {formatVietnamsePrice(totalSpent)}
                        </Text>
                        <span className="text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {spentPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span style={{ color: colors.text.secondary }}>Tiến trình ngân sách</span>
                    <span style={{ color: totalRemaining < 0 ? '#EF4444' : colors.text.primary }}>
                      {spentPercent}% đã chi tiêu
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${spentPercent}%`,
                        background: totalSpent > totalLimit
                          ? 'linear-gradient(90deg, #EF4444, #C084FC)'
                          : spentPercent > 80
                            ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                            : 'linear-gradient(90deg, #6366F1, #3B82F6)',
                        boxShadow: `0 0 10px ${totalSpent > totalLimit ? '#EF444440' : '#3B82F640'}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[200px]">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={
                        totalLimit === 0
                          ? [{ name: 'No Budget', value: 1, color: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]
                          : [
                            {
                              name: t('budgets.totalSpent'),
                              value: totalSpent,
                              color: totalSpent > totalLimit ? '#EF4444' : '#F59E0B',
                            },
                            {
                              name: t('budgets.remaining'),
                              value: Math.max(0, totalRemaining),
                              color: '#10B981',
                            },
                          ]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={totalLimit === 0 ? 0 : 4}
                      dataKey="value"
                    >
                      {(totalLimit === 0
                        ? [{ name: 'No Budget', value: 1, color: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]
                        : [
                          {
                            name: t('budgets.totalSpent'),
                            value: totalSpent,
                            color: totalSpent > totalLimit ? '#EF4444' : '#F59E0B',
                          },
                          {
                            name: t('budgets.remaining'),
                            value: Math.max(0, totalRemaining),
                            color: '#10B981',
                          },
                        ]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Absolute Center Text in Donut Chart */}
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  {totalLimit === 0 ? (
                    <>
                      <Text className="text-sm font-bold" style={{ color: colors.text.secondary }}>
                        Chưa có
                      </Text>
                      <Text className="text-2xs" style={{ color: colors.text.tertiary }}>
                        ngân sách
                      </Text>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-xl sm:text-2xl font-black tracking-tight"
                        style={{ color: totalSpent > totalLimit ? '#EF4444' : colors.text.primary }}
                      >
                        {spentPercent}%
                      </span>
                      <span className="text-3xs uppercase tracking-wider font-semibold" style={{ color: colors.text.tertiary }}>
                        Đã chi tiêu
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border space-y-4 shadow-xs"
                style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.light }}
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
