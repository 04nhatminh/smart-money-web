// Generic API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

// ============ Auth ============
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type HealthCheckResponse = ApiResponse<null>;

export interface LoginData {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export type LoginResponse = ApiResponse<LoginData>;
export type RegisterResponse = ApiResponse<LoginData>;

// ============ Transaction ============
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

export type GetTransactionsResponse = ApiResponse<Transaction[]>;
export type GetTransactionResponse = ApiResponse<Transaction>;
export type CreateTransactionResponse = ApiResponse<Transaction>;
export type UpdateTransactionResponse = ApiResponse<Transaction>;
export type DeleteTransactionResponse = ApiResponse<null>;

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
