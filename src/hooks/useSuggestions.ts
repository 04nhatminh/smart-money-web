import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Suggestion, SuggestionStatus } from '@/types/suggestion.types';

export function useSuggestions(status?: SuggestionStatus) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = status
        ? `${API_ENDPOINTS.suggestions.list}?status=${encodeURIComponent(status)}`
        : API_ENDPOINTS.suggestions.list;
      const res = await apiClient.get<any>(url);

      if (res.success && Array.isArray(res.data)) {
        setSuggestions(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setSuggestions(res.data.data);
      } else {
        setSuggestions([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const respondToSuggestion = useCallback(async (id: string, accept: boolean) => {
    try {
      const res = await apiClient.post<any>(API_ENDPOINTS.suggestions.respond(id), { accept });
      if (res.success) {
        // Refresh local list
        await fetchSuggestions();
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message || 'Failed to respond to suggestion' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to respond to suggestion' };
    }
  }, [fetchSuggestions]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    reload: fetchSuggestions,
    respondToSuggestion,
  };
}
