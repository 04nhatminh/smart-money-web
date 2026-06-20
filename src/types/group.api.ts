import type { ApiResponse } from './base.api';

export type GroupStatus = 'FORMING' | 'LOCKED' | 'DISSOLVED';
export type GroupMemberRole = 'ADMIN' | 'MEMBER';
export type GroupMemberInviteStatus = 'INVITED' | 'JOINED' | 'DECLINED';
export type GroupProjectStatus = 'ACTIVE' | 'COMPLETED' | 'DISSOLVED';

export interface GroupMemberResponse {
  userId: string;
  username: string;
  role: GroupMemberRole;
  inviteStatus: GroupMemberInviteStatus;
  capacitySnapshot: number;
  joinedAt: string | null;
}

export interface GroupSummaryResponse {
  groupId: string;
  name: string;
  description: string;
  status: GroupStatus;
  adminId: string;
  memberCount: number;
  myRole: GroupMemberRole;
  createdAt: string;
}

export interface GroupDetailResponse {
  groupId: string;
  name: string;
  description: string;
  adminId: string;
  status: GroupStatus;
  groupProjectId: string | null;
  members: GroupMemberResponse[];
  createdAt: string;
}

export interface GroupProjectMemberProgressResponse {
  userId: string;
  username: string;
  personalProjectId: string | null;
  moneySaved: number;
  moneyOwed: number;
  netSaved: number;
  targetAmount: number;
  progressPercent: number;
  projectStatus: string | null;
}

export interface GroupProjectDetailResponse {
  groupProjectId: string;
  groupId: string;
  name: string;
  description: string;
  targetAmount: number;
  totalCapacity: number;
  currency: string;
  totalMonths: number;
  deadline: string;
  status: GroupProjectStatus;
  requiredTarget: number;
  aggregateMoneySaved: number;
  progressPercent: number;
  members: GroupProjectMemberProgressResponse[];
}

export interface GroupProjectSuggestionsResponse {
  totalCapacity: number;
  suggestedMonths: number;
  suggestedAmount: number;
}

// Requests
export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface InviteGroupMemberRequest {
  email: string;
}

export interface GetGroupProjectSuggestionsRequest {
  groupId: string;
  inputAmount?: number;
  inputMonths?: number;
}

export interface CreateGroupProjectRequest {
  groupId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currency: string;
  totalMonths: number;
}

export interface CreateSubPersonalProjectRequest {
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
