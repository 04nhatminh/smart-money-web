import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '@/types/transaction.api';

interface TransactionsResponse {
  transactions?: Transaction[];
  content?: Transaction[];
  items?: Transaction[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface TransactionFilters {
  page?: number;
  size?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string; // Format: dd/MM/yyyy HH:mm
  endDate?: string;   // Format: dd/MM/yyyy HH:mm
  search?: string;    // For client-side search by description
  sortBy?: 'date' | 'amount' | 'category' | 'type' | 'description'; // Default: date
  sortOrder?: 'ASC' | 'DESC'; // Default: DESC
}

export const useTransactions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - List transactions with filters
  const listTransactions = useCallback(
    async (filters: TransactionFilters = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        const { page = 0, size = 10, search, sortBy = 'date', sortOrder = 'DESC', ...apiFilters } = filters;

        params.append('page', page.toString());
        params.append('size', size.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        // Add API filter parameters
        if (apiFilters.type) params.append('type', apiFilters.type);
        if (apiFilters.category) params.append('category', apiFilters.category);
        if (apiFilters.minAmount !== undefined) params.append('minAmount', apiFilters.minAmount.toString());
        if (apiFilters.maxAmount !== undefined) params.append('maxAmount', apiFilters.maxAmount.toString());
        if (apiFilters.startDate) params.append('startDate', apiFilters.startDate);
        if (apiFilters.endDate) params.append('endDate', apiFilters.endDate);

        const response = await apiClient.get<any>(
          `${API_ENDPOINTS.transactions.list}?${params.toString()}`
        );

        return {
          data: response.data as TransactionsResponse,
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transactions';
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

  // GET - Get single transaction by ID
  const getTransaction = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          API_ENDPOINTS.transactions.getById(id)
        );

        return {
          data: response.data as Transaction,
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transaction';
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

  // POST - Create transaction
  const createTransaction = useCallback(
    async (data: CreateTransactionRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<any>(
          API_ENDPOINTS.transactions.create,
          data
        );

        return {
          data: response.data as Transaction,
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create transaction';
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

  // PUT - Update transaction
  const updateTransaction = useCallback(
    async (id: string, data: UpdateTransactionRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.put<any>(
          API_ENDPOINTS.transactions.update(id),
          data
        );

        return {
          data: response.data as Transaction,
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update transaction';
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

  // DELETE - Delete transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await apiClient.delete(API_ENDPOINTS.transactions.delete(id));

        return {
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete transaction';
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
    setError,
    // Operations
    listTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
