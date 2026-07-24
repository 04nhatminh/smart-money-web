import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Insight } from '@/types/insight.types';

export function useInsights(asOf?: string) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = asOf
        ? `${API_ENDPOINTS.insights.list}?asOf=${encodeURIComponent(asOf)}`
        : API_ENDPOINTS.insights.list;
      const res = await apiClient.get<any>(url);

      if (res.success && Array.isArray(res.data)) {
        setInsights(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setInsights(res.data.data);
      } else {
        setInsights([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch insights');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, error, reload: fetchInsights };
}
