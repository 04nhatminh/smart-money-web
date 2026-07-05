import type { ApiResponse } from './base.api';

// ============ Project ============
export type ProjectType = 'PERSONAL' | 'GROUP';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectListItem {
  projectId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  targetAmount: number;
  currency: string;
  totalContributed: number;
  progressPercent: number;
  deadline: string;
}

export interface ProjectDetail extends ProjectListItem {
  ownerId: string;
  description: string;
  remaining: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: ProjectType;
  priority: ProjectPriority;
  targetAmount: number;
  currency: string;
  deadline: string;
  startDate: string;
  bypassDateGate?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  targetAmount?: number;
  currency?: string;
  deadline?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}

export interface ProjectContribution {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  contributedAt: string;
  userName?: string;
}

export interface ProjectMember {
  userId: string;
  userName: string;
  email?: string;
  role?: 'OWNER' | 'MEMBER' | 'INVITED';
  joinedAt?: string;
}

export interface InviteProjectMemberRequest {
  email: string;
}

export interface AddProjectContributionRequest {
  amount: number;
}

export interface ProjectAdvisorRequest {
  name: string;
  type: 'PERSONAL' | 'GROUP';
  targetAmount: number;
  currency: string;
  deadline: string;
  mode: 'URGENT' | 'RELAXED';
}

export interface ProjectAdvisorResponse {
  monthlySaving: number;
  numberOfMonths: number;
}

export interface ProjectTracking {
  id: string;
  projectId: string;
  moneySaved: number;
  currentMonth: number;
  monthLeft: number;
  moneyOwed: number;
}

// ============ API Response Types ============
export type GetProjectsResponse = ApiResponse<ProjectListItem[]>;
export type GetProjectDetailResponse = ApiResponse<ProjectDetail>;
export type CreateProjectResponse = ApiResponse<ProjectDetail>;
export type UpdateProjectResponse = ApiResponse<ProjectDetail>;
export type DeleteProjectResponse = ApiResponse<null>;
export type GetProjectContributionsResponse = ApiResponse<ProjectContribution[]>;
export type AddProjectContributionResponse = ApiResponse<ProjectContribution>;
export type InviteProjectMemberResponse = ApiResponse<ProjectDetail>;
export type AcceptProjectInvitationResponse = ApiResponse<ProjectDetail>;
export type GetProjectTrackingResponse = ApiResponse<ProjectTracking>;
export type UpdateProjectTrackingResponse = ApiResponse<ProjectTracking>;
export type ProjectAdvisorResponseType = ApiResponse<ProjectAdvisorResponse>;
