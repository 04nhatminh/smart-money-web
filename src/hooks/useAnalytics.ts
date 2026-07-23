import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { clearAuth } from '@/lib/auth';
import { API_ENDPOINTS } from '@/constants/api';

export interface MonthlyStatItem {
  week: string;
  income: number;
  expense: number;
}

export interface CategoryProportionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  monthlyStats: MonthlyStatItem[];
  categoryProportions: CategoryProportionItem[];
  dailyStats?: { day: number; income: number; expense: number; }[];
  monthlyTotalTransactions?: number;
  monthlyTotalExpense?: number;
  monthlyTotalIncome?: number;
}

export interface AnalyticsRequest {
  year?: number;
  month?: number;
  type?: string;
  day?: number;
}

export const useAnalytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (request: AnalyticsRequest = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post<any>(
        API_ENDPOINTS.transactions.analytics,
        request
      );

      return { data: response.data, success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch analytics';
      // Handle 401 per guideline resilience spec
      if ((err as any)?.status === 401 || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')) {
        if (typeof window !== 'undefined') {
          clearAuth();
          const pathParts = window.location.pathname.split('/');
          const locale = pathParts[1] && ['vi', 'en'].includes(pathParts[1]) ? pathParts[1] : 'en';
          window.location.href = `/${locale}/login?error=session_expired`;
        }
      }
      setError(msg);
      return { data: null, success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, fetchAnalytics };
};
