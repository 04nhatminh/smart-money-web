'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';
import { Heading, Text, Button, ScrollReveal } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import landingMockData from '@/data/landingMockData.json';
import { formatVietnamsePrice } from '@/lib/format';

const DONUT_COLORS = ['#5044d5', '#8a82e3', '#3629b7', '#c5c1f1', '#776ede'];


export const DashboardPreview: React.FC = () => {
  const { colors } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const formatMillionVND = (value: number) => {
    const isVi = locale === 'vi';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}${isVi ? 'tr' : 'M'}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  };

  const { monthlyStats, categoryProportions, monthlyTotalIncome, monthlyTotalExpense } = landingMockData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 5, 21, 0.96)',
            border: `1px solid ${colors.border.light}`,
            borderRadius: 10,
            padding: '10px 16px',
            minWidth: 160,
            boxShadow: colors.surface.primary === '#ffffff' 
              ? '0 4px 20px rgba(54, 41, 183, 0.15)' 
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <p style={{ color: colors.text.primary, fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
              {entry.name}: {formatVietnamsePrice(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div
          style={{
            background: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 5, 21, 0.96)',
            border: `1px solid ${colors.border.light}`,
            borderRadius: 10,
            padding: '10px 16px',
            boxShadow: colors.surface.primary === '#ffffff' 
              ? '0 4px 20px rgba(54, 41, 183, 0.15)' 
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <p style={{ color: colors.text.primary, fontWeight: 600 }}>
            {d.category === 'Food & Bev' ? t('finance.dashboard.foodBev') : d.category}
          </p>
          <p style={{ color: colors.interactive.primary, fontWeight: 600 }}>{(d.percentage * 100).toFixed(0)}%</p>
          <p style={{ color: colors.text.secondary }}>{d.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-16 md:py-24 transition-colors" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal variant="fade-down">
          <div className="text-center mb-12">
            <Heading level={2}>{t('finance.dashboard.title')}</Heading>
            <Text variant="body" style={{ color: colors.text.secondary }} className="mt-3">
              {t('finance.dashboard.subtitle')}
            </Text>
          </div>
        </ScrollReveal>

        {/* KPI Strip — each card zooms in with stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: t('finance.dashboard.totalIncome'), value: monthlyTotalIncome, color: '#10B981' },
            { label: t('finance.dashboard.totalExpenses'), value: monthlyTotalExpense, color: '#EF4444' },
            { label: t('finance.dashboard.netSavings'), value: monthlyTotalIncome - monthlyTotalExpense, color: colors.interactive.primary },
          ].map((kpi, index) => (
            <ScrollReveal key={kpi.label} variant="zoom-in" delay={index * 120}>
              <div
                className="rounded-xl p-5 flex flex-col gap-1 shadow"
                style={{ backgroundColor: colors.surface.primary, borderLeft: `4px solid ${kpi.color}` }}
              >
                <Text variant="caption" style={{ color: colors.text.secondary }}>{kpi.label}</Text>
                <span className="text-xl font-bold" style={{ color: kpi.color }}>
                  {formatVietnamsePrice(kpi.value)}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Dashboard Card — fades up after KPI cards */}
        <ScrollReveal variant="fade-up" delay={200}>
          <div
            className="rounded-2xl shadow-xl p-8 border"
            style={{
              backgroundColor: colors.surface.primary,
              borderColor: colors.border.light,
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Stacked Bar Chart — Weekly Income vs Expense */}
              <div>
                <Text className="font-semibold mb-4 text-base">
                  {t('finance.dashboard.weeklyIncomeVsExpense')}
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: colors.text.secondary, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatMillionVND}
                      tick={{ fill: colors.text.secondary, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: colors.text.primary, fontSize: 12 }}>{value}</span>
                      )}
                    />
                    <Bar dataKey="income" name={t('finance.dashboard.totalIncome')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" name={t('finance.dashboard.totalExpenses')} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Chart — Category Proportions */}
              <div>
                <Text className="font-semibold mb-4 text-base">
                  {t('finance.dashboard.spendingByCategory')}
                </Text>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryProportions}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="percentage"
                        paddingAngle={1}
                      >
                        {categoryProportions.map((entry, index) => (
                          <Cell key={entry.category} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <PieTooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 flex-1">
                    {categoryProportions.map((entry, index) => (
                      <div key={entry.category} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                        />
                        <Text variant="caption" style={{ fontSize: 11, color: colors.text.secondary }}>
                          {entry.category === 'Food & Bev' ? t('finance.dashboard.foodBev') : entry.category} — {(entry.percentage * 100).toFixed(0)}%
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Blurred CTA Overlay */}
            <div className="relative mt-10 min-h-48">
              <div
                className="rounded-xl p-6"
                style={{
                  filter: 'blur(4px)',
                  pointerEvents: 'none',
                  backgroundColor: colors.background.secondary,
                }}
              >
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: t('finance.dashboard.savingsRate'), value: '5.9%' },
                    { label: t('finance.dashboard.topCategory'), value: t('finance.dashboard.foodBev') },
                    { label: t('finance.dashboard.runwayMonths'), value: '3.2' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.surface.primary }}>
                      <div className="font-bold text-lg">{item.value}</div>
                      <div className="text-sm" style={{ color: colors.text.secondary }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl px-6 py-4"
                style={{ background: 'rgba(54,41,183,0.72)', backdropFilter: 'blur(2px)' }}
              >
                <Text className="font-bold text-xl mb-2 text-center" style={{ color: '#fff' }}>
                  {t('finance.dashboard.overlayTitle')}
                </Text>
                <Text variant="caption" style={{ color: '#c5c1f1', textAlign: 'center', maxWidth: '36rem' }} className="mb-4 text-center px-4">
                  {t('finance.dashboard.overlaySubtitle')}
                </Text>
                <Button variant="primary" size="lg" onClick={() => router.push(`/${locale}/register`)}>
                  {t('finance.dashboard.overlayCta')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
