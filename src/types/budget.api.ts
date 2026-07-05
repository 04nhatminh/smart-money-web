import type { ApiResponse } from './base.api';

// ============ Budget ============
export interface Budget {
  budgetId: string;
  userId: string;
  category: 'FOOD' | 'TRANSPORTATION' | 'CLOTHING' | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'SHOPPING' | 'OTHER';
  amountLimit: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  alertLevel: 'SAFE' | 'CAUTION' | 'WARNING' | 'EXCEEDED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: 'FOOD' | 'TRANSPORTATION' | 'CLOTHING' | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'SHOPPING' | 'OTHER';
  amountLimit: number;
  month: number;
  year: number;
}

export interface UpdateBudgetRequest extends Partial<Omit<CreateBudgetRequest, 'month' | 'year'>> {
  spent?: number;
}

// ============ Bulk Budget ============
export interface CreateBulkBudgetsRequest {
  month: number;
  year: number;
  budgets: Array<{
    category: 'FOOD' | 'TRANSPORTATION' | 'CLOTHING' | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'SHOPPING' | 'OTHER';
    amountLimit: number;
  }>;
}

export interface BulkBudgetsResponse {
  successCount: number;
  failureCount: number;
  createdBudgets: Budget[];
  failedBudgets: Array<{
    category: string;
    reason: string;
  }>;
}

export type GetBudgetsResponse = ApiResponse<Budget[]>;
export type GetBudgetResponse = ApiResponse<Budget>;
export type CreateBudgetResponse = ApiResponse<Budget>;
export type UpdateBudgetResponse = ApiResponse<Budget>;
export type DeleteBudgetResponse = ApiResponse<null>;
export type CreateBulkBudgetsResponse = ApiResponse<BulkBudgetsResponse>;
