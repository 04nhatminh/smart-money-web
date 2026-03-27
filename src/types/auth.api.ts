import type { ApiResponse } from './base.api';

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
