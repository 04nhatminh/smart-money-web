import type {ApiResponse} from './base.api';

// ============ Analytics ============
export interface MonthlyStats {
    week: string;
    income: number;
    expense: number;
}

export interface CategoryProportion {
    category: string;
    count: number;
    percentage: number;
}

export interface TransactionAnalyticsResponse {
    monthlyStats: MonthlyStats[];
    categoryProportions: CategoryProportion[];
}

export type GetTransactionAnalyticsResponse = ApiResponse<TransactionAnalyticsResponse>;