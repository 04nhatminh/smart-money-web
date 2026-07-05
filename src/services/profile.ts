import { apiClient } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import type { UserData, UpdateUserRequest, GetCurrentUserResponse } from '@/types/auth.api';

export const profileService = {
  /**
   * Get current user profile information
   * GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<UserData> {
    const response = await apiClient.get<GetCurrentUserResponse>('/api/v1/auth/me');
    if (!response.data) {
      throw new Error('Failed to retrieve user data');
    }
    return response.data;
  },

  /**
   * Update current user profile
   * PUT /api/v1/auth/me (multipart/form-data)
   */
  async updateProfile(data: UpdateUserRequest): Promise<UserData> {
    const formData = new FormData();
    
    const user = getUser();
    if (user?.id) {
      formData.append('id', user.id);
    }
    
    if (data.fullName) {
      formData.append('fullName', data.fullName);
    }
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }
    if (data.dateOfBirth) {
      formData.append('dateOfBirth', data.dateOfBirth);
    }
    if (data.phone) {
      formData.append('phone', data.phone);
    }

    const response = await apiClient.putFormData<GetCurrentUserResponse>('/api/v1/auth/me', formData);
    if (!response.data) {
      throw new Error('Failed to update user profile');
    }
    return response.data;
  },
};
