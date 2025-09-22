export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GoogleAccount {
  id: number;
  user_id: number;
  google_user_id: string;
  email: string;
  access_token?: string;
  token_type?: string;
  expiry_date?: Date;
  scopes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  googleAccount: GoogleAccount;
  message: string;
  accessToken?: string;
  expiresAt?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  googleAccount: GoogleAccount | null;
  error: string | null;
}

export interface GoogleAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  googleAccount: GoogleAccount | null;
  error: string | null;
  connectGoogle: () => Promise<void>;
  disconnect: () => void;
  validateToken: (googleAccountId: number) => Promise<boolean>;
  clearError: () => void;
}
