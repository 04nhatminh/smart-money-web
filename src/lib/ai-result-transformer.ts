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
function normalizeCategoryFromAI(category: string): string {
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
  // Determine transaction type
  const transactionType = aiResult.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
  
  // Get amount - prefer expense if available, otherwise income
  const amount = aiResult.expense || aiResult.income || '0';
  
  // For image: use category as description to avoid long text
  // For voice: use the transcribed text as description
  const description = source === 'image' 
    ? normalizeCategoryFromAI(aiResult.category)
    : (aiResult.text || '');
  
  return {
    amount: formatAmountForForm(amount),
    type: transactionType,
    category: normalizeCategoryFromAI(aiResult.category),
    description,
    date: getCurrentDateTime(),
  };
}
