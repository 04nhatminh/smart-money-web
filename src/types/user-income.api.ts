export interface UserIncomeResponse {
  userId: string;
  netIncome: number;
  usableIncome: number;
  safeSpending: number;
  currency: string;
  calculationNote?: string;
  autoInvestSurplus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserIncomeRequest {
  netIncome: number;
  usableIncome: number;
  currency: string;
  calculationNote?: string;
  autoInvestSurplus?: boolean;
}

export interface UpdateUserIncomeRequest {
  netIncome?: number;
  usableIncome?: number;
  currency?: string;
  calculationNote?: string;
  autoInvestSurplus?: boolean;
}

export interface CheckResponseUserIncomeResponse {
  success: boolean;
  message: string;
  data: UserIncomeResponse;
  errorCode?: string;
}
