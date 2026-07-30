'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Heading, Text, Button, ScrollReveal } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { formatVietnamsePrice } from '@/lib/format';
import {
  MdInsights,
  MdSwapHoriz,
  MdPieChart,
  MdFolderOpen,
  MdChevronRight,
  MdAutoAwesome,
  MdRefresh,
} from 'react-icons/md';
import { getCategoryIcon, getCategoryColor } from '@/constants/categoryIcons';

const CHART_COLORS = ['#5044d5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

export const DashboardPreview: React.FC = () => {
  const { colors } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const mockCategories = [
    { category: 'FOOD', percentage: 35, amount: 4270000 },
    { category: 'SHOPPING', percentage: 25, amount: 3050000 },
    { category: 'UTILITIES', percentage: 18, amount: 2196000 },
    { category: 'ENTERTAINMENT', percentage: 12, amount: 1464000 },
    { category: 'HEALTH', percentage: 10, amount: 1220000 },
  ];

  const PieTooltipCustom = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 5, 21, 0.96)',
          border: `1px solid ${colors.border.light}`,
          borderRadius: 10,
          padding: '8px 14px',
          boxShadow: colors.surface.primary === '#ffffff'
            ? '0 4px 20px rgba(54, 41, 183, 0.15)'
            : '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <p style={{ color: colors.text.primary, fontWeight: 700, fontSize: 12 }}>
          {t.has(`categories.${d.category}`) ? t(`categories.${d.category}`) : d.category}
        </p>
        <p style={{ color: colors.interactive.primary, fontSize: 12, fontWeight: 600 }}>{d.percentage}%</p>
        <p style={{ color: colors.text.secondary, fontSize: 11 }}>{formatVietnamsePrice(d.amount)}</p>
      </div>
    );
  };

  return (
    <section className="py-20 md:py-28 transition-colors relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${colors.background.secondary} 0%, ${colors.background.primary} 50%, ${colors.background.secondary} 100%)` }}>
      {/* Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-[400px] md:w-[650px] h-[400px] md:h-[650px] rounded-full filter blur-[100px] md:blur-[150px] opacity-[0.15] dark:opacity-[0.22] animate-blob-1"
          style={{
            backgroundColor: colors.interactive.primary,
            top: '15%',
            right: '-10%',
          }}
        />
        <div
          className="absolute w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full filter blur-[80px] md:blur-[120px] opacity-[0.12] dark:opacity-[0.18] animate-blob-3"
          style={{
            backgroundColor: colors.interactive.secondary,
            bottom: '10%',
            left: '-5%',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal variant="fade-down">
          <div className="text-center mb-12">
            <Heading level={2}>{t('finance.dashboard.title')}</Heading>
            <Text variant="body" style={{ color: colors.text.secondary }} className="mt-3">
              {t('finance.dashboard.subtitle')}
            </Text>
          </div>
        </ScrollReveal>

        {/* Realistic App Frame Mockup */}
        <ScrollReveal variant="fade-up" delay={150}>
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border backdrop-blur-md"
            style={{
              backgroundColor: colors.surface.primary,
              borderColor: colors.border.light,
              boxShadow: colors.surface.primary === '#ffffff' ? '0 25px 50px -12px rgba(80, 68, 213, 0.12)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* macOS Window Top Bar */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ backgroundColor: `${colors.background.secondary}80`, borderColor: colors.border.light }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="ml-3 text-xs font-semibold tracking-wide opacity-70" style={{ color: colors.text.secondary }}>
                  SmartMoney Dashboard Live Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1" style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary }}>
                  <MdAutoAwesome className="w-3.5 h-3.5" /> AI Engine Active
                </span>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              {/* User Greeting & Quick Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: `${colors.border.light}60` }}>
                <div>
                  <Heading level={2} className="text-xl sm:text-2xl font-bold">
                    {t('dashboard.welcome', { name: 'Alex' })}
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-sm sm:text-base">
                    {t('dashboard.overviewSubtitle')}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary }}>
                    <MdRefresh className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* AI Smart Widgets (Suggestions & Insights Alert Banner) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{
                    backgroundColor: `${colors.interactive.primary}08`,
                    borderColor: `${colors.interactive.primary}30`,
                  }}
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${colors.interactive.primary}20`, color: colors.interactive.primary }}>
                    <MdLightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <Heading level={5} className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: colors.interactive.primary }}>
                      AI Suggestion
                    </Heading>
                    <Text className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {locale === 'vi'
                        ? 'Bạn có ₫1.500.000 thặng dư tháng này. Tự động chuyển vào Quỹ Dự Phòng Thấu Đáo?'
                        : 'You have ₫1,500,000 surplus this month. Reallocate to Emergency Savings Fund?'}
                    </Text>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{
                    backgroundColor: '#10B98108',
                    borderColor: '#10B98130',
                  }}
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                    <MdInsights className="w-5 h-5" />
                  </div>
                  <div>
                    <Heading level={5} className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: '#10B981' }}>
                      AI Financial Health
                    </Heading>
                    <Text className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {locale === 'vi'
                        ? 'Chi tiêu Ăn uống giảm 15% so với tháng trước. Sức khỏe tài chính rất tốt!'
                        : 'Food & Dining expense is 15% lower than last month. Excellent financial health!'}
                    </Text>
                  </div>
                </div>
              </div>

              {/* 2x2 Grid Layout for Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Card 1: Financial Analysis */}
                <div
                  className="p-5 rounded-xl border shadow-sm transition-all"
                  style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
                >
                  <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
                    <div className="flex items-center gap-2">
                      <MdInsights className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                      <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.financialAnalysis')}</Heading>
                    </div>
                    <div className="flex items-center text-xs font-semibold" style={{ color: colors.interactive.primary }}>
                      <span>{t('dashboard.detailedInsights')}</span> <MdChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="space-y-4">
                      <div>
                        <Heading level={5} className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                          {t('dashboard.netSpendingSavings')}
                        </Heading>
                        <Text className="text-3xl font-black mt-1" style={{ color: '#10B981' }}>
                          +12.800.000 ₫
                        </Text>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>{t('dashboard.income')}</Text>
                          <Text className="text-base font-bold mt-0.5" style={{ color: '#10B981' }}>
                            25.000.000 ₫
                          </Text>
                        </div>
                        <div>
                          <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>{t('dashboard.expense')}</Text>
                          <Text className="text-base font-bold mt-0.5" style={{ color: '#EF4444' }}>
                            12.200.000 ₫
                          </Text>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-1.5" style={{ borderColor: `${colors.border.light}80` }}>
                        <Heading level={5} className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: colors.text.secondary }}>
                          {t('dashboard.topCategories')}
                        </Heading>
                        {mockCategories.slice(0, 4).map((item, idx) => (
                          <div key={item.category} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx] }} />
                              <span className="truncate font-medium text-xs" style={{ color: colors.text.primary }}>
                                {t.has(`categories.${item.category}`) ? t(`categories.${item.category}`) : item.category}
                              </span>
                            </div>
                            <span className="font-semibold text-xs" style={{ color: colors.text.secondary }}>
                              {item.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-48 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            dataKey="percentage"
                            paddingAngle={2}
                          >
                            {mockCategories.map((entry, index) => (
                              <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltipCustom />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Card 2: Recent Transactions */}
                <div
                  className="p-5 rounded-xl border shadow-sm transition-all"
                  style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
                >
                  <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
                    <div className="flex items-center gap-2">
                      <MdSwapHoriz className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                      <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.recentTransactions')}</Heading>
                    </div>
                    <div className="flex items-center text-xs font-semibold" style={{ color: colors.interactive.primary }}>
                      <span>{t('dashboard.viewAll')}</span> <MdChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Highlands Coffee', cat: 'FOOD', type: 'EXPENSE', amount: 55000, date: 'Today' },
                      { name: 'Monthly Salary', cat: 'SALARY', type: 'INCOME', amount: 25000000, date: 'Yesterday' },
                      { name: 'WinMart Supermarket', cat: 'SHOPPING', type: 'EXPENSE', amount: 480000, date: 'Jul 25' },
                      { name: 'Electricity Bill', cat: 'UTILITIES', type: 'EXPENSE', amount: 1250000, date: 'Jul 24' },
                    ].map((tx, i) => {
                      const catColor = tx.type === 'INCOME' ? '#10B981' : getCategoryColor(tx.cat);
                      const catLabel = t.has(`categories.${tx.cat}`) ? t(`categories.${tx.cat}`) : tx.cat;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl transition-all gap-3 border"
                          style={{
                            backgroundColor: colors.surface.primary,
                            borderColor: `${colors.border.light}80`,
                          }}
                        >
                          {/* Category Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                            style={{
                              backgroundColor: `${catColor}18`,
                              color: catColor,
                            }}
                          >
                            {getCategoryIcon(tx.cat)}
                          </div>

                          {/* Description & Category Badge */}
                          <div className="min-w-0 flex-1">
                            <Text className="font-extrabold text-sm sm:text-base truncate block tracking-tight" style={{ color: colors.text.primary }}>
                              {tx.name}
                            </Text>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                                style={{
                                  backgroundColor: `${catColor}15`,
                                  color: catColor,
                                }}
                              >
                                {catLabel}
                              </span>
                              <span className="text-xs font-medium" style={{ color: colors.text.tertiary }}>
                                • {tx.date}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <Text
                            className="font-black text-sm sm:text-base whitespace-nowrap tracking-tight ml-2"
                            style={{ color: tx.type === 'INCOME' ? '#10B981' : '#EF4444' }}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}{formatVietnamsePrice(tx.amount)}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 3: Budgets Remaining */}
                <div
                  className="p-5 rounded-xl border shadow-sm transition-all"
                  style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
                >
                  <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
                    <div className="flex items-center gap-2">
                      <MdPieChart className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                      <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.budgetsRemaining')}</Heading>
                    </div>
                    <div className="flex items-center text-xs font-semibold" style={{ color: colors.interactive.primary }}>
                      <span>{t('dashboard.manageBudgets')}</span> <MdChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { cat: 'FOOD', spent: 3200000, limit: 5000000, percent: 64 },
                      { cat: 'SHOPPING', spent: 2100000, limit: 2500000, percent: 84 },
                      { cat: 'ENTERTAINMENT', spent: 800000, limit: 1500000, percent: 53 },
                    ].map((b) => {
                      const remaining = b.limit - b.spent;
                      return (
                        <div key={b.cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <Heading level={4} className="text-sm font-bold" style={{ color: colors.text.primary }}>
                              {t.has(`categories.${b.cat}`) ? t(`categories.${b.cat}`) : b.cat}
                            </Heading>
                            <Text className="text-sm font-extrabold" style={{ color: b.percent > 80 ? '#F59E0B' : colors.interactive.primary }}>
                              {t('dashboard.left', { amount: formatVietnamsePrice(remaining) })}
                            </Text>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.border.light}70` }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${b.percent}%`,
                                backgroundColor: b.percent > 80 ? '#F59E0B' : colors.interactive.primary,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs font-medium" style={{ color: colors.text.secondary }}>
                            <span>{t('dashboard.spent', { amount: formatVietnamsePrice(b.spent) })}</span>
                            <span>{t('dashboard.limit', { amount: formatVietnamsePrice(b.limit) })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 4: Projects Overview */}
                <div
                  className="p-5 rounded-xl border shadow-sm transition-all"
                  style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}
                >
                  <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: colors.border.light }}>
                    <div className="flex items-center gap-2">
                      <MdFolderOpen className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                      <Heading level={3} className="text-base sm:text-lg font-bold">{t('dashboard.projectsOverview')}</Heading>
                    </div>
                    <div className="flex items-center text-xs font-semibold" style={{ color: colors.interactive.primary }}>
                      <span>{t('dashboard.viewProjects')}</span> <MdChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { name: locale === 'vi' ? '🚗 Mua Xe Máy Mới' : '🚗 New Motorbike Goal', saved: 35000000, target: 50000000, percent: 70, tag: 'PERSONAL' },
                      { name: locale === 'vi' ? '✈️ Du Lịch Đà Nẵng' : '✈️ Da Nang Trip Goal', saved: 18000000, target: 24000000, percent: 75, tag: 'GROUP' },
                    ].map((p) => (
                      <div key={p.name} className="p-3 rounded-lg border space-y-1.5" style={{ borderColor: `${colors.border.light}80`, backgroundColor: `${colors.background.secondary}40` }}>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <Heading level={4} className="text-sm font-bold" style={{ color: colors.text.primary }}>{p.name}</Heading>
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary }}>
                            {t('dashboard.saved', { percent: p.percent })}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.border.light}70` }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${p.percent}%`,
                              backgroundColor: p.tag === 'PERSONAL' ? colors.interactive.primary : '#10B981',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-medium" style={{ color: colors.text.secondary }}>
                          <span>{t('dashboard.savedLabel', { amount: formatVietnamsePrice(p.saved) })}</span>
                          <span>{t('dashboard.targetLabel', { amount: formatVietnamsePrice(p.target) })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Interactive Glass Banner */}
              <div
                className="rounded-xl p-6 text-center border relative overflow-hidden mt-6 backdrop-blur-md"
                style={{
                  background: `linear-gradient(135deg, ${colors.interactive.primary}EE 0%, ${colors.palette[700] || colors.interactive.primary}EE 100%)`,
                  borderColor: colors.border.light,
                }}
              >
                <div className="relative z-10 max-w-xl mx-auto space-y-3">
                  <Text className="font-bold text-lg sm:text-xl" style={{ color: '#ffffff' }}>
                    {t('finance.dashboard.overlayTitle')}
                  </Text>
                  <Text className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('finance.dashboard.overlaySubtitle')}
                  </Text>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => router.push(`/${locale}/register`)}
                      className="font-semibold shadow-lg hover:scale-105 transition-transform"
                      style={{ backgroundColor: colors.palette.white, color: colors.palette.base }}
                    >
                      {t('finance.dashboard.overlayCta')}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
