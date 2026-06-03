// app/[locale]/analytics/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTransactionAnalytics } from '@/hooks/useAnalytics';
import { MonthlyStats, CategoryProportion } from '@/types/analytics.api';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryContainer,
    VictoryPie,
    VictoryStack,
    VictoryTheme,
    VictoryTooltip,
} from 'victory';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

const CATEGORY_COLORS = [
    '#2563EB', '#F97316', '#16A34A', '#9333EA',
    '#0891B2', '#E11D48', '#F59E0B', '#64748B',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthOption = {
    label: string;
    month: number;
    year: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPreviousThreeMonths(): MonthOption[] {
    const now = new Date();
    return [3, 2, 1].map((offset) => {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return {
            label: MONTH_NAMES[date.getMonth()],
            month: date.getMonth() + 1,
            year: date.getFullYear(),
        };
    });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const router = useRouter();
    const locale = useLocale();
    const { isAuthenticated, isInitializing } = useAuth();
    const { colors } = useTheme();
    const { isLoading, error, getAnalytics } = useTransactionAnalytics();

    const monthOptions = useMemo(() => getPreviousThreeMonths(), []);

    const [selectedMonthIndex, setSelectedMonthIndex] = useState(2);
    const selectedMonth = monthOptions[selectedMonthIndex];

    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [categoryProportions, setCategoryProportions] = useState<CategoryProportion[]>([]);
    const [pageError, setPageError] = useState<string | null>(null);

    const canGoPrev = selectedMonthIndex > 0;
    const canGoNext = selectedMonthIndex < monthOptions.length - 1;

    // ── Auth guard ──
    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.push(`/${locale}/login`);
        }
    }, [isAuthenticated, isInitializing, router, locale]);

    // ── Initial fetch ──
    useEffect(() => {
        if (isAuthenticated) {
            loadAnalytics(selectedMonth.month, selectedMonth.year);
        }
    }, [isAuthenticated]);

    const loadAnalytics = async (month: number, year: number) => {
        try {
            setPageError(null);
            const result = await getAnalytics(month, year);

            if (result.success && result.data) {
                setMonthlyStats(result.data.monthlyStats ?? []);
                setCategoryProportions(result.data.categoryProportions ?? []);
            } else {
                setPageError(result.error || 'Failed to load analytics');
            }
        } catch (err) {
            setPageError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    const handleChangeMonth = (direction: 'prev' | 'next') => {
        const nextIndex = direction === 'prev'
            ? selectedMonthIndex - 1
            : selectedMonthIndex + 1;

        if (nextIndex < 0 || nextIndex >= monthOptions.length) return;

        const nextMonth = monthOptions[nextIndex];
        setSelectedMonthIndex(nextIndex);
        loadAnalytics(nextMonth.month, nextMonth.year);
    };

    // ── Chart data ──
    const incomeData = useMemo(
        () => monthlyStats.map((item) => ({
            week: `Week ${item.week}`,
            value: Number(item.income) || 0,
            label: `Week ${item.week}\nIncome: ${item.income}`,
        })),
        [monthlyStats]
    );

    const expenseData = useMemo(
        () => monthlyStats.map((item) => ({
            week: `Week ${item.week}`,
            value: Number(item.expense) || 0,
            label: `Week ${item.week}\nExpense: ${item.expense}`,
        })),
        [monthlyStats]
    );

    const pieData = useMemo(
        () => categoryProportions.map((item) => ({
            x: item.category,
            y: Number(item.count) || 0,
            label: `${item.category}\n${item.count} (${item.percentage.toFixed(1)}%)`,
        })),
        [categoryProportions]
    );

    // ── Guards ──
    if (isInitializing) {
        return (
            <SidebarLayout>
                <Heading level={2}>Loading...</Heading>
            </SidebarLayout>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <SidebarLayout>
            <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <Heading level={2}>Analytics</Heading>
                        <Text style={{ color: colors.text.secondary }} className="text-lg">
                            Visualize your income and spending patterns
                        </Text>
                    </div>
                </div>

                {/* ── Error ── */}
                {(pageError || error) && (
                    <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', border: '1px solid' }}
                    >
                        <Text className="text-sm font-medium" style={{ color: '#991B1B' }}>
                            {pageError || error}
                        </Text>
                    </div>
                )}

                {/* ── Month Slider ── */}
                <div
                    className="flex items-center justify-between rounded-xl p-4 border"
                    style={{
                        backgroundColor: colors.surface.primary,
                        borderColor: colors.border.light,
                    }}
                >
                    <button
                        disabled={!canGoPrev}
                        onClick={() => handleChangeMonth('prev')}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                            color: canGoPrev ? colors.text.primary : colors.border.light,
                            cursor: canGoPrev ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <span className="text-3xl leading-none">‹</span>
                    </button>

                    <div className="text-center">
                        <Text className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                            {selectedMonth.label}
                        </Text>
                        <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text.secondary }}>
                            {selectedMonth.year}
                        </Text>
                    </div>

                    <button
                        disabled={!canGoNext}
                        onClick={() => handleChangeMonth('next')}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                            color: canGoNext ? colors.text.primary : colors.border.light,
                            cursor: canGoNext ? 'pointer' : 'not-allowed',
                        }}
                    >
                        <span className="text-3xl leading-none">›</span>
                    </button>
                </div>

                {/* ── Loading ── */}
                {isLoading && (
                    <div className="py-10 text-center">
                        <Text style={{ color: colors.text.secondary }}>Loading analytics...</Text>
                    </div>
                )}

                {/* ── Bar Chart: Income / Expense ── */}
                {!isLoading && monthlyStats.length > 0 && (
                    <div
                        className="rounded-xl p-5 border"
                        style={{
                            backgroundColor: colors.surface.primary,
                            borderColor: colors.border.light,
                        }}
                    >
                        <div className="mb-3">
                            <Text className="text-lg font-extrabold" style={{ color: colors.text.primary }}>
                                Income / Expense by Week
                            </Text>
                        </div>

                        <VictoryChart
                            theme={VictoryTheme.material}
                            width={560}
                            domainPadding={{ x: 26 }}
                            height={300}
                            padding={{ top: 24, bottom: 52, left: 44, right: 4 }}
                            animate={{ duration: 500 }}
                        >
                            <VictoryAxis
                                style={{
                                    axis: { stroke: '#E5E7EB' },
                                    tickLabels: { fill: '#64748B', fontSize: 11 },
                                    grid: { stroke: 'transparent' },
                                }}
                            />
                            <VictoryAxis
                                dependentAxis
                                style={{
                                    axis: { stroke: 'transparent' },
                                    tickLabels: { fill: '#64748B', fontSize: 11 },
                                    grid: { stroke: '#EEF2F7' },
                                }}
                            />
                            <VictoryStack>
                                <VictoryBar
                                    data={incomeData}
                                    x="week"
                                    y="value"
                                    labels={({ datum }) => datum.label}
                                    labelComponent={
                                        <VictoryTooltip
                                            flyoutStyle={{ fill: '#111827', stroke: '#111827' }}
                                            style={{ fill: '#FFFFFF', fontSize: 12 }}
                                        />
                                    }
                                    style={{ data: { fill: '#22C55E', width: 24, strokeWidth: 0 } }}
                                />
                                <VictoryBar
                                    data={expenseData}
                                    x="week"
                                    y="value"
                                    labels={({ datum }) => datum.label}
                                    cornerRadius={{ top: 4 }}
                                    labelComponent={
                                        <VictoryTooltip
                                            flyoutStyle={{ fill: '#111827', stroke: '#111827' }}
                                            style={{ fill: '#FFFFFF', fontSize: 12 }}
                                        />
                                    }
                                    style={{ data: { fill: '#EF4444', width: 24, strokeWidth: 0 } }}
                                />
                            </VictoryStack>
                        </VictoryChart>

                        {/* Legend */}
                        <div className="flex justify-center gap-6 mt-1">
                            {[
                                { color: '#22C55E', label: 'Income' },
                                { color: '#EF4444', label: 'Expense' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                    <Text className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                                        {label}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Pie Chart: Category Proportions ── */}
                {!isLoading && pieData.length > 0 && (
                    <div
                        className="rounded-xl p-5 border"
                        style={{
                            backgroundColor: colors.surface.primary,
                            borderColor: colors.border.light,
                        }}
                    >
                        <div className="mb-3">
                            <Text className="text-lg font-extrabold" style={{ color: colors.text.primary }}>
                                Category Proportions
                            </Text>
                        </div>

                        <div className="flex flex-row items-center">
                            {/* Pie — centered in its column */}
                            <div className="flex-1 flex justify-center">
                                <div className="w-1/2">
                                    <VictoryPie
                                        data={pieData}
                                        width={200}
                                        height={200}
                                        padding={10}
                                        innerRadius={50}
                                        animate={{ duration: 500 }}
                                        labels={({ datum }) => datum.label}
                                        colorScale={CATEGORY_COLORS}
                                        containerComponent={<VictoryContainer responsive={true} />}
                                        labelComponent={
                                            <VictoryTooltip
                                                flyoutStyle={{ fill: '#FFFFFF', stroke: '#D0D5DD' }}
                                                style={{ fill: '#111827', fontSize: 9 }}
                                            />
                                        }
                                        style={{ data: { stroke: 'none', strokeWidth: 0 } }}
                                    />
                                </div>
                            </div>

                            {/* Legend — vertical list on the right */}
                            <div className="flex flex-col gap-2 mr-5">
                                {categoryProportions.map((item, index) => (
                                    <div key={item.category} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                                        />
                                        <div>
                                            <Text
                                                className="text-sm font-bold"
                                                style={{ color: colors.text.primary }}
                                            >
                                                {item.category}
                                            </Text>
                                            <Text className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                                                {item.percentage.toFixed(1)}%
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!isLoading && monthlyStats.length === 0 && pieData.length === 0 && !pageError && (
                    <div
                        className="rounded-xl p-10 text-center border-2 border-dashed"
                        style={{
                            borderColor: colors.border.light,
                            backgroundColor: colors.surface.secondary,
                        }}
                    >
                        <Text style={{ color: colors.text.secondary }}>
                            No analytics data available for {selectedMonth.label} {selectedMonth.year}.
                        </Text>
                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}