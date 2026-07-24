'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Skeleton } from '@/components/atoms';
import { Card, StatCard, UserFinancialModal, GenerateBudgetModal, CreateProjectModal, CreateGroupModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBudgets } from '@/hooks/useBudgets';
import { useProjects } from '@/hooks/useProjects';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { getCookie, setCookie } from '@/lib/auth';
import { InsightsPreviewWidget } from '@/components/organisms/insights/InsightsPreviewWidget';
import { PendingSuggestionsWidget } from '@/components/organisms/suggestions/PendingSuggestionsWidget';

const PieTooltipCustom = ({ active, payload }: any) => {
  const t = useTranslations();
  const { colors } = useTheme();

  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div style={{
      background: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 5, 21, 0.96)',
      border: `1px solid ${colors.border.light}`,
      borderRadius: 10,
      padding: '10px 16px',
      boxShadow: colors.surface.primary === '#ffffff'
        ? '0 4px 20px rgba(54, 41, 183, 0.15)'
        : '0 4px 20px rgba(0, 0, 0, 0.5)',
    }}>
      <p style={{ color: colors.text.primary, fontWeight: 700, fontSize: 13 }}>{t.has(`categories.${d.category}`) ? t(`categories.${d.category}`) : d.category}</p>
      <p style={{ color: colors.interactive.primary, fontSize: 12, fontWeight: 600 }}>{(d.percentage).toFixed(1)}%</p>
      <p style={{ color: colors.text.secondary, fontSize: 12 }}>{d.count || 0} {t('analysis.table.transactions').toLowerCase()}</p>
    </div>
  );
};
import { formatVietnamsePrice } from '@/lib/format';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  MdAccountBalanceWallet,
  MdTrendingUp,
  MdTrendingDown,
  MdRefresh,
  MdSwapHoriz,
  MdPieChart,
  MdFolderOpen,
  MdInsights,
  MdChevronRight,
  MdAutoAwesome
} from 'react-icons/md';

const CHART_COLORS = ['#5044d5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function DashboardPage() {
  const { user, isAuthenticated, isInitializing, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const { listTransactions } = useTransactions();
  const { fetchAnalytics } = useAnalytics();
  const { listBudgets } = useBudgets();
  const { listProjects } = useProjects();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Onboarding states
  const [showFinancialPrompt, setShowFinancialPrompt] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isGenerateBudgetModalOpen, setIsGenerateBudgetModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // 1. Fetch recent transactions (top 5)
      const txResult = await listTransactions({
        page: 0,
        size: 5,
        sortBy: 'date',
        sortOrder: 'DESC',
      });
      if (txResult.success && txResult.data) {
        setTransactions((txResult.data as any).items || (txResult.data as any).transactions || txResult.data.content || []);
      }

      // 2. Fetch current month analytics
      const analyticsResult = await fetchAnalytics({
        month: currentMonth,
        year: currentYear
      });
      if (analyticsResult.success && analyticsResult.data) {
        setAnalyticsData(analyticsResult.data);
      }

      // 3. Fetch budgets
      const budgetsResult = await listBudgets(currentMonth, currentYear);
      if (budgetsResult.success && budgetsResult.data) {
        setBudgets(budgetsResult.data.items || budgetsResult.data.content || budgetsResult.data.budgets || []);
      }

      // 4. Fetch projects
      const projectsResult = await listProjects();
      if (projectsResult.success && projectsResult.data) {
        setProjects(projectsResult.data.items || projectsResult.data.content || projectsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const { getUserFinancial } = useUserFinancial();

  // Check onboarding status
  useEffect(() => {
    let isMounted = true;
    const checkOnboarding = async () => {
      if (!isInitializing && !authIsLoading && isAuthenticated && user) {
        const financialCookie = getCookie('financial_setup_completed');
        const financialDone = user.financialSetupCompleted || financialCookie === 'true';

        if (financialDone) {
          return;
        }

        // Verify with financial API directly to handle case where user model in auth state is missing the flag
        const res = await getUserFinancial();
        if (isMounted) {
          if (res.success && res.data) {
            setCookie('financial_setup_completed', 'true');
          } else {
            setShowFinancialPrompt(true);
          }
        }
      }
    };

    checkOnboarding();
    return () => {
      isMounted = false;
    };
  }, [isInitializing, authIsLoading, isAuthenticated, user, getUserFinancial]);

  // Derived calculations for Financial Summary Card
  const { totalIncome, totalExpenses, netSavings } = useMemo(() => {
    if (!analyticsData) {
      return { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
    }
    const monthlyStats = analyticsData.monthlyStats ?? [];
    const income = monthlyStats.reduce((sum: number, m: any) => sum + (m.income || 0), 0);
    const expense = monthlyStats.reduce((sum: number, m: any) => sum + (m.expense || 0), 0);
    return {
      totalIncome: income,
      totalExpenses: expense,
      netSavings: income - expense
    };
  }, [analyticsData]);

  const sortedCategoryProportions = useMemo(() => {
    if (!analyticsData?.categoryProportions) return [];
    return [...analyticsData.categoryProportions].sort((a, b) => b.percentage - a.percentage);
  }, [analyticsData]);

  const usedPriorities = useMemo(() => {
    return projects
      .filter((p: any) => p.type === 'PERSONAL' && p.priority && p.status === 'ACTIVE')
      .map((p: any) => p.priority);
  }, [projects]);

  if (isInitializing || (!isAuthenticated && isInitializing)) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <MdRefresh className="w-8 h-8 animate-spin" style={{ color: colors.interactive.primary }} />
        </div>
      </SidebarLayout>
    );
  }

  const parseTransactionDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}):(\d{2}))?/);
    if (match) {
      const [, day, month, year, hour = '00', minute = '00'] = match;
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hour, 10), parseInt(minute, 10));
    }
    return new Date(dateStr);
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-2">
          <div className="flex items-center gap-3">
            <Heading level={2} className="text-xl sm:text-2xl font-bold">
              {t('dashboard.welcome', { name: user?.fullName || user?.username || 'User' })}
            </Heading>
            <button
              onClick={loadDashboardData}
              className="p-1.5 rounded-lg transition-colors hover:opacity-85 flex-shrink-0"
              style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary }}
              title="Refresh"
            >
              <MdRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Text style={{ color: colors.text.secondary }} className="text-sm sm:text-base">
            {t('dashboard.overviewSubtitle')}
          </Text>
        </div>

        {/* AI Suggestions Banner & Insights Preview Widgets */}
        <div className="space-y-4">
          <PendingSuggestionsWidget />
          <InsightsPreviewWidget />
        </div>

        {/* 2x2 Grid Layout for Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card 1: Monthly Financial Overview & Category Chart */}
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden border"
            style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
            onClick={() => router.push(`/${locale}/analysis`)}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
              <div className="flex items-center gap-2">
                <MdInsights className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.financialAnalysis')}</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                <span className="hidden sm:inline mr-1">{t('dashboard.detailedInsights')}</span> <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-5">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                    {t('dashboard.netSpendingSavings')}
                  </Text>
                  {isLoading ? (
                    <Skeleton height={36} width="65%" className="mt-1" />
                  ) : (
                    <Text className="text-3xl font-black mt-1" style={{ color: netSavings >= 0 ? '#10B981' : '#EF4444' }}>
                      {formatVietnamsePrice(netSavings)}
                    </Text>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>{t('dashboard.income')}</Text>
                    {isLoading ? (
                      <Skeleton height={20} width="80%" className="mt-1" />
                    ) : (
                      <Text className="text-base font-bold mt-0.5" style={{ color: '#10B981' }}>
                        {formatVietnamsePrice(totalIncome)}
                      </Text>
                    )}
                  </div>
                  <div>
                    <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>{t('dashboard.expense')}</Text>
                    {isLoading ? (
                      <Skeleton height={20} width="80%" className="mt-1" />
                    ) : (
                      <Text className="text-base font-bold mt-0.5" style={{ color: '#EF4444' }}>
                        {formatVietnamsePrice(totalExpenses)}
                      </Text>
                    )}
                  </div>
                </div>

                {sortedCategoryProportions && sortedCategoryProportions.length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: `${colors.border.light}80` }}>
                    <Text className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: colors.text.secondary }}>
                      {t('dashboard.topCategories')}
                    </Text>
                    <div className="space-y-2">
                      {sortedCategoryProportions.slice(0, 5).map((item: any, idx: number) => (
                        <div key={item.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            <span className="truncate font-medium" style={{ color: colors.text.primary }}>
                              {t.has(`categories.${item.category}`) ? t(`categories.${item.category}`) : item.category}
                            </span>
                          </div>
                          <span className="font-semibold" style={{ color: colors.text.secondary }}>
                            {(item.percentage).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Donut Chart matching Analysis Page layout */}
              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                {sortedCategoryProportions && sortedCategoryProportions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sortedCategoryProportions}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="percentage"
                        paddingAngle={1.5}
                      >
                        {sortedCategoryProportions.map((entry: any, index: number) => (
                          <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipCustom />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text className="text-xs" style={{ color: colors.text.secondary }}>
                    {t('dashboard.noSpendingChart')}
                  </Text>
                )}
              </div>
            </div>
          </Card>

          {/* Card 2: Top 5 Recent Transactions */}
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border"
            style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
            onClick={() => router.push(`/${locale}/transactions`)}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
              <div className="flex items-center gap-2">
                <MdSwapHoriz className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.recentTransactions')}</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                <span className="hidden sm:inline mr-1">{t('dashboard.viewAll')}</span> <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `${colors.background.secondary}60` }}>
                      <div className="space-y-1 flex-1 pr-4">
                        <Skeleton height={16} width="75%" />
                        <Skeleton height={12} width="45%" className="mt-1" />
                      </div>
                      <Skeleton height={18} width="25%" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg transition-colors" style={{ backgroundColor: `${colors.background.secondary}60` }}>
                    <div className="min-w-0 flex-1 pr-2">
                      <Text className="font-bold truncate text-sm" style={{ color: colors.text.primary }}>
                        {tx.description || (t.has(`categories.${tx.category}`) ? t(`categories.${tx.category}`) : tx.category)}
                      </Text>
                      <Text className="text-xs truncate block" style={{ color: colors.text.secondary }}>
                        {(t.has(`categories.${tx.category}`) ? t(`categories.${tx.category}`) : tx.category)} • {parseTransactionDate(tx.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                      </Text>
                    </div>
                    <Text className="font-extrabold text-sm whitespace-nowrap" style={{ color: tx.type === 'INCOME' ? '#10B981' : '#EF4444' }}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatVietnamsePrice(tx.amount)}
                    </Text>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Text style={{ color: colors.text.secondary }}>{t('dashboard.noRecentTransactions')}</Text>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Budgets Remaining Progress */}
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border"
            style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
            onClick={() => router.push(`/${locale}/budgets`)}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
              <div className="flex items-center gap-2">
                <MdPieChart className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.budgetsRemaining')}</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                <span className="hidden sm:inline mr-1">{t('dashboard.manageBudgets')}</span> <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton height={14} width="40%" />
                        <Skeleton height={14} width="30%" />
                      </div>
                      <Skeleton height={8} width="100%" />
                    </div>
                  ))}
                </div>
              ) : budgets.length > 0 ? (
                budgets.slice(0, 3).map((budget: any) => {
                  const percent = Math.min((budget.spent / budget.amountLimit) * 100, 100);
                  const isOver = budget.spent > budget.amountLimit;
                  const remaining = budget.amountLimit - budget.spent;

                  return (
                    <div key={budget.budgetId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <Text style={{ color: colors.text.primary }}>{t.has(`categories.${budget.category}`) ? t(`categories.${budget.category}`) : budget.category}</Text>
                        <Text style={{ color: isOver ? '#EF4444' : colors.text.secondary }}>
                          {isOver
                            ? t('dashboard.overBy', { amount: formatVietnamsePrice(Math.abs(remaining)) })
                            : t('dashboard.left', { amount: formatVietnamsePrice(remaining) })
                          }
                        </Text>
                      </div>

                      {/* Custom Progress Bar */}
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.border.light}70` }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isOver ? '#EF4444' : percent > 80 ? '#F59E0B' : colors.interactive.primary
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: colors.text.secondary }}>
                        <span>{t('dashboard.spent', { amount: formatVietnamsePrice(budget.spent) })}</span>
                        <span>{t('dashboard.limit', { amount: formatVietnamsePrice(budget.amountLimit) })}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 space-y-4">
                  <Text style={{ color: colors.text.secondary }}>{t('dashboard.noBudgets')}</Text>
                  <div>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGenerateBudgetModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs py-2 px-4 font-semibold"
                    >
                      <MdAutoAwesome className="w-4 h-4" />
                      <span>Generate Budget</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card 4: Active Projects Overview */}
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border"
            style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
            onClick={() => router.push(`/${locale}/projects`)}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
              <div className="flex items-center gap-2">
                <MdFolderOpen className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.projectsOverview')}</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                <span className="hidden sm:inline mr-1">{t('dashboard.viewProjects')}</span> <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton height={14} width="45%" />
                        <Skeleton height={14} width="25%" />
                      </div>
                      <Skeleton height={8} width="100%" />
                    </div>
                  ))}
                </div>
              ) : projects.length > 0 ? (
                projects.slice(0, 3).map((project: any) => {
                  const currentSaved = project.currentAmount || 0;
                  const target = project.targetAmount || 1;
                  const percent = Math.min((currentSaved / target) * 100, 100);

                  return (
                    <div key={project.projectId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <Text style={{ color: colors.text.primary }}>{project.name}</Text>
                        <Text style={{ color: colors.text.secondary }}>{t('dashboard.saved', { percent: percent.toFixed(0) })}</Text>
                      </div>

                      {/* Custom Progress Bar */}
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.border.light}70` }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: '#10B981'
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: colors.text.secondary }}>
                        <span>{t('dashboard.savedLabel', { amount: formatVietnamsePrice(currentSaved) })}</span>
                        <span>{t('dashboard.targetLabel', { amount: formatVietnamsePrice(target) })}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 space-y-4">
                  <Text style={{ color: colors.text.secondary }}>{t('dashboard.noProjects')}</Text>
                  <div>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreateProjectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs py-2 px-4 font-semibold"
                    >
                      <MdFolderOpen className="w-4 h-4" />
                      <span>{t('dashboard.createProject')}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* Onboarding Financial Profile Prompt */}
      {showFinancialPrompt && (
        <>
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
            <div className="max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4" style={{ backgroundColor: colors.background.primary }}>
              <Heading level={3}>Setup Financial Profile</Heading>
              <Text style={{ color: colors.text.secondary }}>
                You haven't set up your financial profile. Defining your income, saving pace, intervention level, and focus mode helps AI generate personalized recommendations.
              </Text>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowFinancialPrompt(false)}>
                  Skip for now
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => {
                  setShowFinancialPrompt(false);
                  setIsFinancialModalOpen(true);
                }}>
                  Setup Now
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Core Modals */}
      <UserFinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />

      <GenerateBudgetModal
        isOpen={isGenerateBudgetModalOpen}
        onClose={() => setIsGenerateBudgetModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={loadDashboardData}
        usedPriorities={usedPriorities}
        onOpenUserFinancialModal={() => {
          setIsCreateProjectModalOpen(false);
          setIsFinancialModalOpen(true);
        }}
        onOpenCreateGroupModal={() => {
          setIsCreateProjectModalOpen(false);
          setIsCreateGroupModalOpen(true);
        }}
      />

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </SidebarLayout>
  );
}
