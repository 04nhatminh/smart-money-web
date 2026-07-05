import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, CreateBulkBudgetsRequest, BulkBudgetsResponse } from '@/types/budget.api';

interface BudgetsResponse {
  budgets?: Budget[];
  content?: Budget[];
  items?: Budget[];
  month?: number;
  year?: number;
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
}

export const useBudgets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - List budgets
  const listBudgets = useCallback(
    async (month: number, year: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          `${API_ENDPOINTS.budgets.list}?month=${month}&year=${year}`
        );

        console.log('Fetched budgets:', response);
        return {
          data: response.data,  // ← Extract inner data object
          success: true,
        };
      } catch (err) {
        console.error('Failed to fetch budgets:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch budgets';
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

  // GET - Get single budget by ID
  const getBudget = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          API_ENDPOINTS.budgets.getById(id)
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch budget';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // POST - Create budget
  const createBudget = useCallback(
    async (data: CreateBudgetRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Creating budget with data:', data);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.budgets.create,
          data
        );

        console.log('Budget created successfully:', response);
        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        console.error('Create budget error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create budget';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // PUT - Update budget
  const updateBudget = useCallback(
    async (id: string, data: UpdateBudgetRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.put<any>(
          API_ENDPOINTS.budgets.update(id),
          data
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update budget';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // DELETE - Delete budget
  const deleteBudget = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await apiClient.delete<null>(API_ENDPOINTS.budgets.delete(id));

        return {
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete budget';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // POST - Create bulk budgets
  const createBulkBudgets = useCallback(
    async (data: CreateBulkBudgetsRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Creating bulk budgets with data:', data);
        const response = await apiClient.post<any>(
          API_ENDPOINTS.budgets.createBulk,
          data
        );

        console.log('Bulk budgets created successfully:', response);
        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        console.error('Create bulk budgets error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create bulk budgets';
        setError(errorMsg);
        return {
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
    listBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    createBulkBudgets,
  };
};
