import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '@/types/transaction.api';

interface TransactionsResponse {
  transactions?: Transaction[];
  content?: Transaction[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
}

export const useTransactions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - List transactions
  const listTransactions = useCallback(
    async (page = 0, size = 10) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          `${API_ENDPOINTS.transactions.list}?page=${page}&size=${size}`
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
          data: response as Transaction,
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
          data: response as Transaction,
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
          data: response as Transaction,
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
