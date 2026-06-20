import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  UserFinancialProfileResponse,
  CreateUserFinancialProfileRequest,
  UpdateUserFinancialProfileRequest,
  CheckResponseUserFinancialProfileResponse,
} from '@/types/user-financial.api';

export const useUserFinancial = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - Get user financial profile
  const getUserFinancial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<CheckResponseUserFinancialProfileResponse>(
        API_ENDPOINTS.userFinancial.get
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user financial profile';
      
      if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('Failed')) {
        // User doesn't have financial profile set up yet - this is normal
        return {
          success: true,
          data: null,
        };
      }

      console.error('Failed to fetch user financial profile:', err);
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

  // POST - Create user financial profile
  const createUserFinancial = useCallback(
    async (data: CreateUserFinancialProfileRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<CheckResponseUserFinancialProfileResponse>(
          API_ENDPOINTS.userFinancial.create,
          data
        );

        if (!response || Object.keys(response).length === 0) {
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
        console.error('Create user financial profile error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to create user financial profile';
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

  // PUT - Update user financial profile
  const updateUserFinancial = useCallback(
    async (data: UpdateUserFinancialProfileRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.put<CheckResponseUserFinancialProfileResponse>(
          API_ENDPOINTS.userFinancial.update,
          data
        );

        if (!response || Object.keys(response).length === 0) {
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
        const errorMsg = err instanceof Error ? err.message : 'Failed to update user financial profile';
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

  // DELETE - Delete user financial profile
  const deleteUserFinancial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await apiClient.delete<any>(API_ENDPOINTS.userFinancial.delete);

      return {
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete user financial profile';
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
    getUserFinancial,
    createUserFinancial,
    updateUserFinancial,
    deleteUserFinancial,
    isLoading,
    error,
  };
};
