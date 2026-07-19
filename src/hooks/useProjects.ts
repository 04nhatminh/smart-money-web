import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types/base.api';
import {
  ProjectListItem,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectContribution,
  ProjectTracking,
  InviteProjectMemberRequest,
  AddProjectContributionRequest,
  ProjectAdvisorRequest,
  ProjectAdvisorResponse,
} from '@/types/project.api';

export const useProjects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET - List all projects
  const listProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<any>(API_ENDPOINTS.projects.list);

      return {
        data: response.data,
        success: true,
      };
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch projects';
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

  // GET - Get single project by ID
  const getProject = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(API_ENDPOINTS.projects.getById(id));

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch project';
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

  // POST - Create project
  const createProject = useCallback(async (data: CreateProjectRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post<any>(
        API_ENDPOINTS.projects.create,
        data
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // PUT - Update project
  const updateProject = useCallback(
    async (id: string, data: UpdateProjectRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.put<any>(
          API_ENDPOINTS.projects.update(id),
          data
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update project';
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

  // DELETE - Delete project
  const deleteProject = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.delete<any>(
          API_ENDPOINTS.projects.delete(id)
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete project';
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

  // GET - Get project tracking
  const getProjectTracking = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          API_ENDPOINTS.projects.getTracking(projectId)
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch project tracking';
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

  // GET - Get project contributions
  const getProjectContributions = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get<any>(
          API_ENDPOINTS.projects.getContributions(projectId)
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch contributions';
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

  // POST - Add contribution
  const addContribution = useCallback(
    async (projectId: string, data: AddProjectContributionRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<any>(
          API_ENDPOINTS.projects.addContribution(projectId),
          data
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add contribution';
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

  // POST - Invite member
  const inviteMember = useCallback(
    async (projectId: string, data: InviteProjectMemberRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<any>(
          API_ENDPOINTS.projects.inviteMember(projectId),
          data
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to invite member';
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

  // POST - Accept invitation
  const acceptInvitation = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<any>(
          API_ENDPOINTS.projects.acceptInvitation(projectId),
          {}
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to accept invitation';
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

  // POST - Project Advisor
  const projectAdvisor = useCallback(
    async (data: ProjectAdvisorRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<ApiResponse<ProjectAdvisorResponse>>(
          API_ENDPOINTS.projects.projectAdvisor,
          data
        );

        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get project advice';
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
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectTracking,
    getProjectContributions,
    addContribution,
    inviteMember,
    acceptInvitation,
    projectAdvisor,
  };
};
