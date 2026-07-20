import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  UserIncomeResponse,
  CreateUserIncomeRequest,
  UpdateUserIncomeRequest,
  CheckResponseUserIncomeResponse,
} from '@/types/user-income.api';

export const useUserIncome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Get user income
  const getUserIncome = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<CheckResponseUserIncomeResponse>(
        API_ENDPOINTS.userIncome.get
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      // Handle 404 - User hasn't created income yet (not an error state)
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user income';

      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        // User doesn't have income set up yet - this is normal
        return {
          success: true,
          data: null,
        };
      }

      console.error('Failed to fetch user income:', err);
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        data: null,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // POST - Create user income
  const createUserIncome = useCallback(
    async (data: CreateUserIncomeRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<CheckResponseUserIncomeResponse>(
          API_ENDPOINTS.userIncome.create,
          data
        );

        // Handle empty response from backend
        if (!response || Object.keys(response).length === 0) {
          console.warn('Empty response from create user income endpoint');
          return {
            success: true,
            data: null,
          };
        }

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        console.error('Create user income error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create user income';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
          data: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // PUT - Update user income
  const updateUserIncome = useCallback(
    async (data: UpdateUserIncomeRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.put<CheckResponseUserIncomeResponse>(
          API_ENDPOINTS.userIncome.update,
          data
        );

        // Handle empty response from backend
        if (!response || Object.keys(response).length === 0) {
          console.warn('Empty response from update user income endpoint');
          return {
            success: true,
            data: null,
          };
        }

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update user income';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
          data: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // DELETE - Delete user income
  const deleteUserIncome = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await apiClient.delete<any>(API_ENDPOINTS.userIncome.delete);

      return {
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete user income';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getUserIncome,
    createUserIncome,
    updateUserIncome,
    deleteUserIncome,
    isLoading,
    error,
  };
};
