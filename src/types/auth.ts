export interface BoxAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  tokenExpiry: number | null;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  name: string;
  login: string;
  avatar_url?: string;
}