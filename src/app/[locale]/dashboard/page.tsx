'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { Card, StatCard } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PieTooltipCustom } from '../analysis/page';
import { useBudgets } from '@/hooks/useBudgets';
import { useProjects } from '@/hooks/useProjects';
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
  MdChevronRight
} from 'react-icons/md';

const CHART_COLORS = ['#5044d5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function DashboardPage() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const locale = useLocale();
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
        <div className="flex items-center justify-between">
          <div>
            <Heading level={2}>
              Welcome back, {user?.fullName || user?.username || 'User'}
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              Here is your financial overview for this month
            </Text>
          </div>
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-full transition-colors hover:opacity-85"
            style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary }}
          >
            <MdRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
                <Heading level={3} className="text-lg font-bold">Financial Analysis</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                Detailed Insights <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-5">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                    Net Spending/Savings
                  </Text>
                  <Text className="text-3xl font-black mt-1" style={{ color: netSavings >= 0 ? '#10B981' : '#EF4444' }}>
                    {formatVietnamsePrice(netSavings)}
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>Income</Text>
                    <Text className="text-base font-bold mt-0.5" style={{ color: '#10B981' }}>
                      {formatVietnamsePrice(totalIncome)}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>Expense</Text>
                    <Text className="text-base font-bold mt-0.5" style={{ color: '#EF4444' }}>
                      {formatVietnamsePrice(totalExpenses)}
                    </Text>
                  </div>
                </div>

                {analyticsData?.categoryProportions && analyticsData.categoryProportions.length > 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: `${colors.border.light}80` }}>
                    <Text className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: colors.text.secondary }}>
                      Top Categories
                    </Text>
                    <div className="space-y-2">
                      {analyticsData.categoryProportions.slice(0, 5).map((item: any, idx: number) => (
                        <div key={item.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            <span className="truncate font-medium" style={{ color: colors.text.primary }}>
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase()}
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

              {/* Mini Donut Chart */}
              <div className="h-48 md:h-56 w-full flex items-center justify-center">
                {analyticsData?.categoryProportions && analyticsData.categoryProportions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryProportions}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="percentage"
                        paddingAngle={1}
                      >
                        {analyticsData.categoryProportions.map((entry: any, index: number) => (
                          <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipCustom />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text className="text-xs" style={{ color: colors.text.secondary }}>
                    No spending data to display chart
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
                <Heading level={3} className="text-lg font-bold">Recent Transactions</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                View All <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg transition-colors" style={{ backgroundColor: `${colors.background.secondary}60` }}>
                    <div className="min-w-0 flex-1 pr-2">
                      <Text className="font-bold truncate text-sm" style={{ color: colors.text.primary }}>
                        {tx.description || tx.category}
                      </Text>
                      <Text className="text-xs truncate block" style={{ color: colors.text.secondary }}>
                        {tx.category} • {parseTransactionDate(tx.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                      </Text>
                    </div>
                    <Text className="font-extrabold text-sm whitespace-nowrap" style={{ color: tx.type === 'INCOME' ? '#10B981' : '#EF4444' }}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatVietnamsePrice(tx.amount)}
                    </Text>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Text style={{ color: colors.text.secondary }}>No recent transactions found</Text>
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
                <Heading level={3} className="text-lg font-bold">Budgets Remaining</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                Manage Budgets <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {budgets.length > 0 ? (
                budgets.slice(0, 3).map((budget: any) => {
                  const percent = Math.min((budget.spent / budget.amountLimit) * 100, 100);
                  const isOver = budget.spent > budget.amountLimit;
                  const remaining = budget.amountLimit - budget.spent;

                  return (
                    <div key={budget.budgetId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <Text style={{ color: colors.text.primary }}>{budget.category}</Text>
                        <Text style={{ color: isOver ? '#EF4444' : colors.text.secondary }}>
                          {isOver
                            ? `Over by ${formatVietnamsePrice(Math.abs(remaining))}`
                            : `${formatVietnamsePrice(remaining)} left`
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
                        <span>Spent: {formatVietnamsePrice(budget.spent)}</span>
                        <span>Limit: {formatVietnamsePrice(budget.amountLimit)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Text style={{ color: colors.text.secondary }}>No active budgets this month</Text>
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
                <Heading level={3} className="text-lg font-bold">Projects Overview</Heading>
              </div>
              <div className="flex items-center text-sm font-semibold opacity-80 group-hover:translate-x-1 transition-transform" style={{ color: colors.interactive.primary }}>
                View Projects <MdChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {projects.length > 0 ? (
                projects.slice(0, 3).map((project: any) => {
                  const currentSaved = project.currentAmount || 0;
                  const target = project.targetAmount || 1;
                  const percent = Math.min((currentSaved / target) * 100, 100);

                  return (
                    <div key={project.projectId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <Text style={{ color: colors.text.primary }}>{project.name}</Text>
                        <Text style={{ color: colors.text.secondary }}>{percent.toFixed(0)}% Saved</Text>
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
                        <span>Saved: {formatVietnamsePrice(currentSaved)}</span>
                        <span>Target: {formatVietnamsePrice(target)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Text style={{ color: colors.text.secondary }}>No saving projects active</Text>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </SidebarLayout>
  );
}
