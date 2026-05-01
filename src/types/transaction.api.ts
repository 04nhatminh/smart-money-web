import type { ApiResponse } from './base.api';

// ============ Transaction ============
export interface Transaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: 'FOOD' | 'TRANSPORTATION' | 'CLOTHING' | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'SHOPPING' | 'OTHER';
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: 'FOOD' | 'TRANSPORTATION' | 'CLOTHING' | 'UTILITIES' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'SHOPPING' | 'OTHER';
  description?: string;
  date: string;
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

export type GetTransactionsResponse = ApiResponse<Transaction[]>;
export type GetTransactionResponse = ApiResponse<Transaction>;
export type CreateTransactionResponse = ApiResponse<Transaction>;
export type UpdateTransactionResponse = ApiResponse<Transaction>;
export type DeleteTransactionResponse = ApiResponse<null>;
