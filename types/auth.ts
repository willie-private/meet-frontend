export interface User {
  id: string;
  email: string;
  username: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
  refreshToken?: string;
}

export const AUTH_STORAGE_KEY = "meet-auth";

export interface StoredAuth {
  accessToken: string;
  user: User;
  refreshToken?: string;
}

export interface RefreshResponse {
  accessToken: string;
}
