import type { ApiResponse } from './base.api';

// ============ Saving Goal ============
export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingGoalRequest {
  name: string;
  targetAmount: number;
  deadline: string;
  description?: string;
}

export interface UpdateSavingGoalRequest extends Partial<CreateSavingGoalRequest> {
  currentAmount?: number;
  status?: 'active' | 'completed' | 'cancelled';
}

export type GetSavingGoalsResponse = ApiResponse<SavingGoal[]>;
export type GetSavingGoalResponse = ApiResponse<SavingGoal>;
export type CreateSavingGoalResponse = ApiResponse<SavingGoal>;
export type UpdateSavingGoalResponse = ApiResponse<SavingGoal>;
export type DeleteSavingGoalResponse = ApiResponse<null>;
