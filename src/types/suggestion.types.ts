// Adaptive-engine suggestions (GET /api/v1/suggestions, POST .../respond).

import { Insight } from './insight.types';

export type SuggestionType =
  | 'RAISE_BUDGET'
  | 'CREATE_BUDGET'
  | 'SET_CATEGORY_LIMIT'
  | 'REDUCE_BUDGET'
  | 'CONTRIBUTE_TO_PROJECT'
  | 'REBALANCE_BUDGETS'
  | 'REALLOCATE_BUDGET'
  | 'REVIEW_SUBSCRIPTION'
  | 'INCREASE_CONTRIBUTION'
  | 'CREATE_PROJECT'
  | 'REBALANCE_PROJECTS';

export const SUGGESTION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DISMISSED',
  'EXPIRED',
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface BudgetAdjustment {
  budgetId: string;
  category: string;
  currentLimit: number;
  newLimit: number;
}

export interface ProposedAction {
  category?: string | null;
  budgetId?: string | null;
  month?: number | null;
  year?: number | null;
  projectId?: string | null;
  resolvedValue?: number;
  budgetAdjustments?: BudgetAdjustment[];
  monthlySaving?: number;
  deadline?: string;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  dedupKey: string;
  narrative?: string | null;
  payload: {
    insightSnapshot: Insight;
    proposedAction: ProposedAction | null;
    narrative?: string | null;
  };
  createdAt: string;
  expiresAt?: string | null;
  decidedAt?: string | null;
}
