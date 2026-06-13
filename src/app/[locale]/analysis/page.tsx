'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics, type AnalyticsData } from '@/hooks/useAnalytics';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { formatVietnamsePrice } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdSavings,
  MdRefresh, MdAnalytics, MdTableChart, MdBarChart,
} from 'react-icons/md';

// ────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────
const CHART_COLORS = ['#5044d5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#E11D48'];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ────────────────────────────────────────────────────────
// Shimmer skeleton for loading
// ────────────────────────────────────────────────────────
const ShimmerBlock: React.FC<{ height?: number; className?: string }> = ({ height = 200, className = '' }) => (
  <div
    className={`rounded-xl animate-pulse ${className}`}
    style={{ height, background: 'linear-gradient(90deg, #eceafa 0%, #d8d5f6 50%, #eceafa 100%)', backgroundSize: '200% 100%' }}
  />
);

// ────────────────────────────────────────────────────────
// Custom Tooltip
// ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  const { colors } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 5, 21, 0.96)',
      border: `1px solid ${colors.border.light}`,
      borderRadius: 10,
      padding: '10px 16px',
      minWidth: 160,
      boxShadow: colors.surface.primary === '#ffffff' 
        ? '0 4px 20px rgba(54, 41, 183, 0.15)' 
        : '0 4px 20px rgba(0, 0, 0, 0.5)',
    }}>
      <p style={{ color: colors.text.primary, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, margin: '3px 0', fontSize: 12 }}>
          <span style={{ color: colors.text.secondary }}>{entry.name}: </span>
          <strong>{formatVietnamsePrice(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
};

export const PieTooltipCustom = ({ active, payload }: any) => {
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
      <p style={{ color: colors.text.primary, fontWeight: 700, fontSize: 13 }}>{t(`categories.${d.category}`)}</p>
      <p style={{ color: colors.interactive.primary, fontSize: 12, fontWeight: 600 }}>{(d.percentage).toFixed(1)}%</p>
      <p style={{ color: colors.text.secondary, fontSize: 12 }}>{d.count} {t('analysis.table.transactions').toLowerCase()}</p>
    </div>
  );
};

// ────────────────────────────────────────────────────────
// KPI Card
// ────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
  trend?: string;
  trendUp?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon, accentColor, trend, trendUp }) => {
  const { colors } = useTheme();
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3 shadow-md transition-transform hover:-translate-y-1"
      style={{ backgroundColor: colors.surface.primary, borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-center justify-between">
        <Text variant="caption" style={{ color: colors.text.secondary, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </Text>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}22` }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>
      <span className="text-2xl font-extrabold" style={{ color: colors.text.primary }}>{value}</span>
      {trend && (
        <div className="flex items-center gap-1">
          {trendUp ? <MdTrendingUp style={{ color: '#10B981' }} /> : <MdTrendingDown style={{ color: '#EF4444' }} />}
          <Text variant="caption" style={{ color: trendUp ? '#10B981' : '#EF4444', fontSize: 12 }}>{trend}</Text>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// Main Analysis Page
// ────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { colors } = useTheme();
  const { isInitializing } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isLoading, fetchAnalytics } = useAnalytics();

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'trend'>('overview');

  // Fetch analytics when year or month changes
  useEffect(() => {
    if (!isInitializing) {
      loadAnalytics();
    }
  }, [isInitializing, selectedYear, selectedMonth]);

  const loadAnalytics = async () => {
    const result = await fetchAnalytics({ year: selectedYear, month: selectedMonth });
    if (result.success && result.data) {
      setAnalyticsData(result.data);
    }
  };

  // ──── Derived metrics ────
  const kpis = useMemo(() => {
    if (!analyticsData) return null;
    const monthlyStats = analyticsData.monthlyStats ?? [];
    const totalIncome = monthlyStats.reduce((s, m) => s + (m.income || 0), 0);
    const totalExpense = monthlyStats.reduce((s, m) => s + (m.expense || 0), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, netSavings, savingsRate };
  }, [analyticsData]);

  // Cumulative wealth trend
  const cumulativeData = useMemo(() => {
    if (!analyticsData) return [];
    const monthlyStats = analyticsData.monthlyStats ?? [];
    let cum = 0;
    return monthlyStats.map((m, i) => {
      cum += (m.income || 0) - (m.expense || 0);
      return {
        month: m.week ? t('analysis.week', { number: m.week }) : t('analysis.week', { number: i + 1 }),
        cumulative: cum,
        income: m.income || 0,
        expense: m.expense || 0
      };
    });
  }, [analyticsData, t]);

  // Category table sorted by expense (approximated from percentage * totalExpense)
  const categoryTableData = useMemo(() => {
    if (!analyticsData || !kpis) return [];
    const categoryProportions = analyticsData.categoryProportions ?? [];
    return [...categoryProportions]
      .map((c) => ({
        ...c,
        estimatedExpense: kpis.totalExpense * (c.percentage / 100),
      }))
      .sort((a, b) => b.estimatedExpense - a.estimatedExpense);
  }, [analyticsData, kpis]);

  const formatMillionVND = (value: number) => {
    const isVi = locale === 'vi';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}${isVi ? 'tr' : 'M'}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  };

  // ──── UI ────
  return (
    <SidebarLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={2} className="flex items-center gap-2">
              <MdAnalytics className="w-7 h-7" style={{ color: colors.interactive.primary }} />
              {t('analysis.title')}
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-sm mt-1">
              {t('analysis.subtitle', { year: selectedYear })}
            </Text>
          </div>

          {/* Filter Controls (Month & Year) */}
          <div className="flex items-center gap-3 flex-wrap">
            <Text variant="caption" style={{ color: colors.text.secondary }} className="font-semibold">
              {t('analysis.month')}
            </Text>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString(locale, { month: 'short' })}
                </option>
              ))}
            </select>

            <Text variant="caption" style={{ color: colors.text.secondary }} className="font-semibold ml-2">
              {t('analysis.year')}
            </Text>
            <select
              id="year-selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                border: `1px solid ${colors.border.medium}`,
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              id="refresh-analytics-btn"
              onClick={loadAnalytics}
              disabled={isLoading}
              title={t('analysis.refresh')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80"
              style={{ backgroundColor: `${colors.interactive.primary}22` }}
            >
              <MdRefresh
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                style={{ color: colors.interactive.primary }}
              />
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-2 border-b" style={{ borderColor: colors.border.light }}>
          {([
            { key: 'overview', label: t('analysis.overview'), icon: <MdBarChart className="w-4 h-4" /> },
            { key: 'categories', label: t('analysis.categories'), icon: <MdTableChart className="w-4 h-4" /> },
            { key: 'trend', label: t('analysis.wealthTrend'), icon: <MdTrendingUp className="w-4 h-4" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all"
              style={{
                color: activeTab === tab.key ? colors.interactive.primary : colors.text.secondary,
                borderBottom: activeTab === tab.key ? `2px solid ${colors.interactive.primary}` : '2px solid transparent',
                backgroundColor: activeTab === tab.key ? `${colors.interactive.primary}10` : 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Loading Skeletons ── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <ShimmerBlock key={i} height={120} />)}
            </div>
            <ShimmerBlock height={280} />
            <ShimmerBlock height={220} />
          </div>
        )}

        {/* ── No Data ── */}
        {!isLoading && !analyticsData && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <MdAnalytics className="w-16 h-16" style={{ color: colors.text.tertiary }} />
            <Heading level={3} style={{ color: colors.text.secondary }}>{t('analysis.noData')}</Heading>
            <Text style={{ color: colors.text.tertiary }}>
              {t('analysis.noTransactions', {
                month: new Date(2024, selectedMonth - 1).toLocaleString(locale, { month: 'long' }),
                year: selectedYear
              })}
            </Text>
          </div>
        )}

        {/* ── Content ── */}
        {!isLoading && analyticsData && kpis && (
          <>
            {/* KPI Cards — always visible */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label={t('analysis.totalIncome')}
                value={formatVietnamsePrice(kpis.totalIncome)}
                icon={<MdTrendingUp className="w-5 h-5" />}
                accentColor="#10B981"
                trend={t('analysis.yearTotal')}
              />
              <KPICard
                label={t('analysis.totalExpenses')}
                value={formatVietnamsePrice(kpis.totalExpense)}
                icon={<MdTrendingDown className="w-5 h-5" />}
                accentColor="#EF4444"
                trend={t('analysis.yearTotal')}
              />
              <KPICard
                label={t('analysis.netSavings')}
                value={formatVietnamsePrice(kpis.netSavings)}
                icon={<MdSavings className="w-5 h-5" />}
                accentColor={kpis.netSavings >= 0 ? '#5044d5' : '#EF4444'}
                trendUp={kpis.netSavings >= 0}
                trend={kpis.netSavings >= 0 ? t('analysis.positive') : t('analysis.deficit')}
              />
              <KPICard
                label={t('analysis.savingsRate')}
                value={`${kpis.savingsRate.toFixed(1)}%`}
                icon={<MdAccountBalanceWallet className="w-5 h-5" />}
                accentColor="#F59E0B"
                trendUp={kpis.savingsRate >= 20}
                trend={kpis.savingsRate >= 20 ? t('analysis.healthy') : kpis.savingsRate >= 0 ? t('analysis.needsImprovement') : t('analysis.overSpending')}
              />
            </div>

            {/* ─────────────────── OVERVIEW TAB ─────────────────── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Monthly Income vs Expense Bar Chart */}
                <div
                  id="chart-monthly-bar"
                  className="rounded-2xl p-6 shadow"
                  style={{ backgroundColor: colors.surface.primary, border: `1px solid ${colors.border.light}` }}
                >
                  <Heading level={3} className="mb-4 text-base font-semibold">
                    {t('analysis.monthlyIncomeVsExpense')}
                  </Heading>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={cumulativeData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatMillionVND}
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend formatter={(v) => <span style={{ color: colors.text.primary, fontSize: 12 }}>{v}</span>} />
                      <Bar dataKey="income" name={t('analysis.income')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expense" name={t('analysis.expense')} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Spending by Category Donut */}
                <div
                  id="chart-category-donut"
                  className="rounded-2xl p-6 shadow"
                  style={{ backgroundColor: colors.surface.primary, border: `1px solid ${colors.border.light}` }}
                >
                  <Heading level={3} className="mb-4 text-base font-semibold">
                    {t('analysis.spendingByCategory')}
                  </Heading>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={240}>
                      <PieChart>
                        <Pie
                          data={analyticsData.categoryProportions ?? []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="percentage"
                          paddingAngle={1}
                        >
                          {(analyticsData.categoryProportions ?? []).map((entry, index) => (
                            <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltipCustom />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 flex-1 overflow-auto max-h-56">
                      {(analyticsData.categoryProportions ?? []).map((entry, index) => (
                        <div key={entry.category} className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <Text variant="caption" style={{ fontSize: 11, color: colors.text.secondary }} className="truncate">
                            {t(`categories.${entry.category}`)} — <strong>{(entry.percentage).toFixed(0)}%</strong>
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────── CATEGORIES TAB ─────────────────── */}
            {activeTab === 'categories' && (
              <div
                id="category-drilldown-table"
                className="rounded-2xl shadow overflow-hidden"
                style={{ backgroundColor: colors.surface.primary, border: `1px solid ${colors.border.light}` }}
              >
                <div className="p-6 border-b" style={{ borderColor: colors.border.light }}>
                  <Heading level={3} className="text-base font-semibold">
                    {t('analysis.categoryBreakdown')}
                  </Heading>
                  <Text variant="caption" style={{ color: colors.text.secondary, fontSize: 12 }}>
                    {t('analysis.viewTransactionsDesc')}
                  </Text>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: colors.background.secondary }}>
                        {[t('analysis.table.rank'), t('analysis.table.category'), t('analysis.table.transactions'), t('analysis.table.contribution'), t('analysis.table.estAmount'), ''].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left"
                            style={{ color: colors.text.secondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTableData.map((cat, index) => (
                        <tr
                          key={cat.category}
                          className="transition-colors hover:opacity-90"
                          style={{
                            borderBottom: `1px solid ${colors.border.light}`,
                            backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.background.secondary}80`,
                          }}
                        >
                          <td className="px-6 py-4">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '22', color: CHART_COLORS[index % CHART_COLORS.length] }}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <Text style={{ fontWeight: 600, color: colors.text.primary }}>{t(`categories.${cat.category}`)}</Text>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Text style={{ color: colors.text.secondary }}>{cat.count}</Text>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.background.secondary, maxWidth: 100 }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${cat.percentage}%`,
                                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                              </div>
                              <Text variant="caption" style={{ color: colors.text.secondary, fontSize: 12, minWidth: 36 }}>
                                {(cat.percentage).toFixed(1)}%
                              </Text>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Text style={{ fontWeight: 600, color: '#EF4444' }}>
                              {formatVietnamsePrice(cat.estimatedExpense)}
                            </Text>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              id={`view-transactions-${cat.category.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => router.push(`/${locale}/transactions?category=${encodeURIComponent(cat.category)}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
                              style={{
                                backgroundColor: `${colors.interactive.primary}18`,
                                color: colors.interactive.primary,
                                border: `1px solid ${colors.interactive.primary}40`,
                              }}
                            >
                              {t('analysis.viewTransactionsBtn')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─────────────────── TREND TAB ─────────────────── */}
            {activeTab === 'trend' && (
              <div className="space-y-6">
                {/* Cumulative Wealth Trend */}
                <div
                  id="chart-cumulative-trend"
                  className="rounded-2xl p-6 shadow"
                  style={{ backgroundColor: colors.surface.primary, border: `1px solid ${colors.border.light}` }}
                >
                  <Heading level={3} className="mb-1 text-base font-semibold">
                    {t('analysis.accumulatedWealthTrend')}
                  </Heading>
                  <Text variant="caption" style={{ color: colors.text.secondary, fontSize: 12 }} className="mb-6 block">
                    {t('analysis.runningCumulative', { year: selectedYear })}
                  </Text>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={cumulativeData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5044d5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#5044d5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatMillionVND}
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        name={t('analysis.netBalance')}
                        stroke="#5044d5"
                        strokeWidth={2.5}
                        fill="url(#wealthGradient)"
                        dot={{ fill: '#5044d5', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#8a82e3' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Net Savings Line Chart */}
                <div
                  id="chart-monthly-net"
                  className="rounded-2xl p-6 shadow"
                  style={{ backgroundColor: colors.surface.primary, border: `1px solid ${colors.border.light}` }}
                >
                  <Heading level={3} className="mb-1 text-base font-semibold">
                    {t('analysis.monthlyNetSavings')}
                  </Heading>
                  <Text variant="caption" style={{ color: colors.text.secondary, fontSize: 12 }} className="mb-6 block">
                    {t('analysis.incomeMinusExpense')}
                  </Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={cumulativeData.map((d) => ({ ...d, netSavings: d.income - d.expense }))}
                      margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatMillionVND}
                        tick={{ fill: colors.text.secondary, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="netSavings"
                        name={t('analysis.netSavings')}
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10B981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
