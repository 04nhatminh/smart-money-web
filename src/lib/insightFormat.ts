import { Insight, Severity } from '@/types/insight.types';
import { formatVietnamsePrice } from '@/lib/format';

const MONEY_METRIC_KEYS = new Set([
  'baseline',
  'actual',
  'spent',
  'limit',
  'projectedEndOfMonth',
  'meanMonthly',
  'monthlyAmount',
  'avgMonthlyIncome',
  'recurringCosts',
  'committedBudgets',
  'disposable',
  'income',
  'overBy',
  'medianActual',
  'previousAmount',
  'newAmount',
  'remaining',
  'requiredMonthly',
  'observedMonthly',
  'shortfall',
]);

const COUNT_METRIC_KEYS = new Set([
  'sampleMonths',
  'monthsObserved',
  'dayOfMonth',
  'daysInMonth',
  'monthsLeft',
  'observedWindowMonths',
]);

export function formatInsightParams(
  metrics: Record<string, number | string>
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(metrics || {})) {
    if (MONEY_METRIC_KEYS.has(key) && typeof value === 'number') {
      params[key] = formatVietnamsePrice(value);
    } else if (COUNT_METRIC_KEYS.has(key) && typeof value === 'number') {
      params[key] = String(Math.round(value));
    } else {
      params[key] = value;
    }
  }

  return params;
}

export function localizeInsight(
  insight: Insight,
  t: (key: string, options?: any) => string
): string {
  if (insight.narrative) {
    return insight.narrative;
  }

  const formattedParams = formatInsightParams(insight.metrics);
  return t(insight.code, {
    ...formattedParams,
    defaultValue: insight.code,
  });
}

export function formatPeriod(period: string, locale: string = 'vi'): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period ?? '');
  if (!match) return period ?? '';

  const year = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return period;

  if (locale === 'vi') {
    return `Tháng ${month}, ${year}`;
  }
  const EN_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${EN_MONTHS[month - 1]} ${year}`;
}

export interface SeverityStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}

export function getSeverityStyle(severity: Severity): SeverityStyle {
  switch (severity) {
    case 'CRITICAL':
      return {
        color: '#EF4444',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        badgeBg: '#FEE2E2',
        badgeText: '#991B1B',
        label: 'Khẩn cấp',
      };
    case 'WARN':
      return {
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        badgeBg: '#FEF3C7',
        badgeText: '#92400E',
        label: 'Cảnh báo',
      };
    case 'INFO':
    default:
      return {
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        badgeBg: '#DBEAFE',
        badgeText: '#1E40AF',
        label: 'Thông tin',
      };
  }
}
