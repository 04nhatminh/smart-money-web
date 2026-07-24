import { Suggestion, SuggestionStatus, SuggestionType } from '@/types/suggestion.types';
import { formatVietnamsePrice } from '@/lib/format';

export function suggestionTypeKey(type: SuggestionType): string {
  return `suggestion.${type.toLowerCase()}`;
}

export function suggestionTitle(type: SuggestionType, t: (key: string, options?: any) => string): string {
  return t(`${suggestionTypeKey(type)}.title`, {
    defaultValue: type.replace(/_/g, ' ').toLowerCase(),
  });
}

export const PROJECT_NAME_TYPES: SuggestionType[] = [
  'CONTRIBUTE_TO_PROJECT',
  'INCREASE_CONTRIBUTION',
];

export function askSentence(
  suggestion: Suggestion,
  t: (key: string, options?: any) => string,
  projectName?: string | null
): string {
  const action = suggestion.payload.proposedAction;
  const metrics = suggestion.payload.insightSnapshot?.metrics ?? {};
  const params: Record<string, string> = {};

  if (action?.resolvedValue != null) {
    params.resolvedValue = formatVietnamsePrice(action.resolvedValue);
  }

  if (PROJECT_NAME_TYPES.includes(suggestion.type)) {
    params.projectName = projectName ?? '…';
  }

  if (action?.category) {
    params.category = t(`categories.${action.category}`, {
      defaultValue: action.category,
    });
  }

  if (suggestion.type === 'REVIEW_SUBSCRIPTION') {
    params.description = String(metrics.description ?? '');
    if (typeof metrics.previousAmount === 'number') {
      params.previousAmount = formatVietnamsePrice(metrics.previousAmount);
    }
    if (typeof metrics.newAmount === 'number') {
      params.newAmount = formatVietnamsePrice(metrics.newAmount);
    }
  }

  return t(`${suggestionTypeKey(suggestion.type)}.ask`, {
    ...params,
    defaultValue: suggestion.narrative ?? suggestionTitle(suggestion.type, t),
  });
}

export interface StatusChipStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  labelKey: string;
}

export const STATUS_CHIPS: Record<SuggestionStatus, StatusChipStyle> = {
  PENDING: {
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
    labelKey: 'suggestions.status.pending',
  },
  ACCEPTED: {
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    labelKey: 'suggestions.status.accepted',
  },
  DISMISSED: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    labelKey: 'suggestions.status.dismissed',
  },
  EXPIRED: {
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    labelKey: 'suggestions.status.expired',
  },
};

export const SUGGESTION_TYPE_ICONS: Record<SuggestionType, string> = {
  RAISE_BUDGET: 'MdTrendingUp',
  CREATE_BUDGET: 'MdAddCircleOutline',
  SET_CATEGORY_LIMIT: 'MdTune',
  REDUCE_BUDGET: 'MdTrendingDown',
  CONTRIBUTE_TO_PROJECT: 'MdSavings',
  REBALANCE_BUDGETS: 'MdAccountBalanceWallet',
  REALLOCATE_BUDGET: 'MdSwapHoriz',
  REVIEW_SUBSCRIPTION: 'MdSubscriptions',
  INCREASE_CONTRIBUTION: 'MdArrowUpward',
  CREATE_PROJECT: 'MdFolderSpecial',
};
