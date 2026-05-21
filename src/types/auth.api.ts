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

export interface GoogleLoginRequest {
  idToken: string;
  email?: string;
  name?: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
}

export type HealthCheckResponse = ApiResponse<null>;

export interface LoginData {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatar?: string;
    dateOfBirth?: string;
    phone?: string;
    coin?: number;
    role?: string;
    rate?: number;
    active?: boolean;
  };
}

export type LoginResponse = ApiResponse<LoginData>;
export type RegisterResponse = ApiResponse<LoginData>;
export type GoogleLoginResponse = ApiResponse<LoginData>;
export type FacebookLoginResponse = ApiResponse<LoginData>;

// ============ User Profile ============
export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  dateOfBirth?: string;
  phone?: string;
  coin?: number;
  role?: string;
  rate?: number;
  active?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  avatar?: File;
  dateOfBirth?: string; // format: dd/MM/yyyy
  phone?: string;
}

export type UserResponse = ApiResponse<UserData>;
export type GetCurrentUserResponse = ApiResponse<UserData>;
