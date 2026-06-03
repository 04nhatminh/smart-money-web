import { useCallback, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api";
import { TransactionAnalyticsResponse } from "@/types/analytics.api";

export const useTransactionAnalytics = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalytics = useCallback(
        async (month: number, year: number) => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await apiClient.post<any>(
                    API_ENDPOINTS.analytics.list,
                    { month, year }
                );

                console.log('Fetched analytics:', response);
                return {
                    data: response.data as TransactionAnalyticsResponse,  //  Extract inner data object
                    success: true,
                };
            }
            catch (err) {
                console.error('Failed to fetch analytics:', err);
                const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analytics';
                setError(errorMsg);
                return {
                    data: null,
                    success: false,
                    error: errorMsg,
                };
            } finally {
                setIsLoading(false);
            }
        },
        []
    );
    return {
        isLoading,
        error,
        getAnalytics,
    };
};