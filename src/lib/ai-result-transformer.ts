/**
 * Transforms AI analysis results into transaction form data
 */

import { formatAmountInput } from './format';

export interface AIAnalysisResult {
  jobId: string;
  text: string;
  expense?: string;
  income?: string;
  type: string;
  category: string;
  confidence: string;
}

export interface TransactionFormData {
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
}

// Map AI categories to FE categories (AI sends uppercase, need to normalize)
const CATEGORY_MAP: { [key: string]: string } = {
  FOOD: 'FOOD',
  TRANSPORTATION: 'TRANSPORTATION',
  CLOTHING: 'CLOTHING',
  UTILITIES: 'UTILITIES',
  ENTERTAINMENT: 'ENTERTAINMENT',
  HEALTH: 'HEALTH',
  EDUCATION: 'EDUCATION',
  SHOPPING: 'SHOPPING',
  OTHER: 'OTHER',
  // Handle common variations
  TRANSPORT: 'TRANSPORTATION',
  TRANSPORT_MOBILITY: 'TRANSPORTATION',
  CLOTHES: 'CLOTHING',
  ELECTRIC: 'UTILITIES',
  MOVIE: 'ENTERTAINMENT',
  MEDICAL: 'HEALTH',
  LEARN: 'EDUCATION',
  BUY: 'SHOPPING',
};

/**
 * Normalizes category from AI result to match FE categories
 */
function normalizeCategoryFromAI(category?: string): string {
  if (!category) return 'OTHER';
  const normalized = category.toUpperCase().trim();
  
  // Direct match
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Default to OTHER if no match found
  return 'OTHER';
}

/**
 * Formats amount value for display
 */
function formatAmountForForm(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // Format with thousands separator using the format function
  return formatAmountInput(numAmount.toString());
}

/**
 * Gets current date and time in dd/mm/yyyy hh:mm format
 */
function getCurrentDateTime(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Transforms AI analysis result to transaction form data
 * @param aiResult - AI analysis result from backend
 * @param source - Source of the AI result: 'voice' or 'image' (default: 'voice')
 */
export function transformAIResultToFormData(
  aiResult: AIAnalysisResult | Record<string, any>,
  source: 'voice' | 'image' = 'voice'
): TransactionFormData {
  if (!aiResult) {
    return {
      amount: '0',
      type: 'EXPENSE',
      category: 'OTHER',
      description: '',
      date: getCurrentDateTime(),
    };
  }

  // Unwrap nested result object or JSON string if present
  let payload: Record<string, any> = { ...aiResult };
  if (payload.result) {
    if (typeof payload.result === 'string') {
      try {
        const parsed = JSON.parse(payload.result);
        if (parsed && typeof parsed === 'object') {
          payload = { ...payload, ...parsed };
        }
      } catch (e) {
        // ignore parse error
      }
    } else if (typeof payload.result === 'object') {
      payload = { ...payload, ...payload.result };
    }
  } else if (payload.data && typeof payload.data === 'object') {
    payload = { ...payload, ...payload.data };
  }

  // Handle transactions array if provided (e.g. from Voice AI or multi-item OCR)
  let firstTx: Record<string, any> = {};
  if (Array.isArray(payload.transactions) && payload.transactions.length > 0) {
    firstTx = payload.transactions[0] || {};
  } else if (typeof payload.transactions === 'string') {
    try {
      const parsedTx = JSON.parse(payload.transactions);
      if (Array.isArray(parsedTx) && parsedTx.length > 0) {
        firstTx = parsedTx[0] || {};
      }
    } catch (e) {
      // ignore parse error
    }
  }

  const rawType = firstTx.type || payload.type;
  const transactionType: 'INCOME' | 'EXPENSE' =
    String(rawType).toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';

  const rawCategory = firstTx.category || payload.category || 'OTHER';
  const category = normalizeCategoryFromAI(String(rawCategory));

  const amountValue =
    firstTx.expense ??
    firstTx.income ??
    firstTx.amount ??
    payload.expense ??
    payload.income ??
    payload.amount ??
    '0';

  const transcribedText = payload.text || firstTx.text || '';
  const txDescription = firstTx.description || payload.description || '';

  let description = '';
  if (source === 'image') {
    description = txDescription || category;
  } else {
    // For voice, prefer transcribed text or transaction description
    description = transcribedText || txDescription || category;
  }

  return {
    amount: formatAmountForForm(amountValue),
    type: transactionType,
    category,
    description,
    date: getCurrentDateTime(),
  };
}

