import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  CreateGroupRequest,
  InviteGroupMemberRequest,
  GetGroupProjectSuggestionsRequest,
  CreateGroupProjectRequest,
  CreateSubPersonalProjectRequest,
  GroupSummaryResponse,
  GroupDetailResponse,
  GroupProjectDetailResponse,
  GroupProjectSuggestionsResponse,
} from '@/types/group.api';

export const useGroups = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List all user groups
  const listGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<any>(API_ENDPOINTS.groups.list);
      return {
        data: response.data as GroupSummaryResponse[],
        success: true,
      };
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch groups';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new group
  const createGroup = useCallback(async (data: CreateGroupRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groups.create, data);
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get detailed group by ID
  const getGroupDetail = useCallback(async (groupId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<any>(API_ENDPOINTS.groups.getById(groupId));
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch group details';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lock group
  const lockGroup = useCallback(async (groupId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groups.lock(groupId), {});
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to lock group';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Invite member by email
  const inviteGroupMember = useCallback(async (groupId: string, data: InviteGroupMemberRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groups.invite(groupId), data);
      return {
        data: response.data,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept group invite
  const acceptGroupInvite = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groups.acceptInvite, { token });
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Decline group invite
  const declineGroupInvite = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groups.declineInvite, { token });
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove member (declined member)
  const removeGroupMember = useCallback(async (groupId: string, userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.delete<any>(API_ENDPOINTS.groups.removeMember(groupId, userId));
      return {
        data: response.data as GroupDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get suggestions
  const getGroupProjectSuggestions = useCallback(async (data: GetGroupProjectSuggestionsRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groupProjects.suggestions, data);
      return {
        data: response.data as GroupProjectSuggestionsResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create group project
  const createGroupProject = useCallback(async (data: CreateGroupProjectRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groupProjects.create, data);
      return {
        data: response.data as GroupProjectDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create group project';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get group project detail
  const getGroupProjectDetail = useCallback(async (groupProjectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<any>(API_ENDPOINTS.groupProjects.getById(groupProjectId));
      return {
        data: response.data as GroupProjectDetailResponse,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch group project details';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Join group project (create sub-personal project)
  const joinGroupProject = useCallback(async (groupProjectId: string, data: CreateSubPersonalProjectRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groupProjects.join(groupProjectId), data);
      return {
        data: response.data,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join group project';
      setError(errorMsg);
      return {
        data: null,
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dissolve group project
  const dissolveGroupProject = useCallback(async (groupProjectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<any>(API_ENDPOINTS.groupProjects.dissolve(groupProjectId), {});
      return {
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to dissolve group project';
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
    isLoading,
    error,
    listGroups,
    createGroup,
    getGroupDetail,
    lockGroup,
    inviteGroupMember,
    acceptGroupInvite,
    declineGroupInvite,
    removeGroupMember,
    getGroupProjectSuggestions,
    createGroupProject,
    getGroupProjectDetail,
    joinGroupProject,
    dissolveGroupProject,
  };
};
