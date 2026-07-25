import type { ApiResponse } from './base.api';

export type GroupStatus = 'FORMING' | 'LOCKED' | 'DISSOLVED';
export type GroupMemberRole = 'ADMIN' | 'MEMBER';
export type GroupMemberInviteStatus = 'INVITED' | 'JOINED' | 'DECLINED';
export type GroupProjectStatus = 'ACTIVE' | 'COMPLETED' | 'DISSOLVED' | 'EXPIRED' | 'PENDING_SPONSORSHIP' | 'SPONSORSHIP_FAILED';

export interface GroupMemberResponse {
  userId: string;
  username: string;
  email: string;
  role: GroupMemberRole;
  inviteStatus: GroupMemberInviteStatus;
  capacitySnapshot: number;
  joinedAt: string | null;
  autoSponsorEnabled: boolean;
  autoSponsorLimit: number | null;
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
  hasActiveProject?: boolean;
  groupProjectId?: string | null;
  groupProjectName?: string | null;
  groupProjectStatus?: GroupProjectStatus | null;
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

export interface MemberSimulationDto {
  userId: string;
  username: string;
  fullName: string;
  capacity: number;
  originalShare: number;
  proposedShare: number;
  deficit: number;
  needsSponsorship: boolean;
  autoSponsorEnabled: boolean;
  autoSponsorLimit: number | null;
}

export interface GroupProjectSuggestionsResponse {
  totalCapacity: number;
  suggestedMonths: number;
  suggestedAmount: number;
  isFeasible: boolean | null;
  totalDeficit: number | null;
  memberSimulations: MemberSimulationDto[] | null;
}

// Requests
export interface CreateGroupRequest {
  name: string;
  description?: string;
  cloneGroupId?: string;
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

export interface UpdateAutoSponsorshipRequest {
  enabled: boolean;
  limit?: number;
}

export interface GroupProjectSponsorshipRequestResponse {
  requestId: string;
  groupProjectId: string;
  groupProjectName: string;
  groupName: string;
  askedAmount: number;
  originalShare: number;
  proposedShare: number;
  totalMonths: number;
}

export interface RespondToSponsorshipRequest {
  agreed: boolean;
}
