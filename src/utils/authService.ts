/**
 * Centralized authentication service for token management
 */

const AUTH_TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'dental_vital_signs_user_id';
const USER_DATA_KEY = 'user_data';

export class AuthService {
  /**
   * Store authentication data after successful login
   * @param token - JWT access token
   * @param primaryId - Primary identifier (client_id for dashboard operations)
   * @param userData - User data object containing both user_id and client_id
   * @param supabaseToken - Supabase JWT token
   */
  static setAuthData(token: string, primaryId: string, userData: any, supabaseToken?: string): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_ID_KEY, primaryId); // Store client_id as primary identifier
      
      // Store both our custom token and the Supabase JWT token if provided
      const userDataWithToken = {
        ...userData,
        supabase_token: supabaseToken || token
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userDataWithToken));
      
      console.log('AuthService: Stored auth data:', {
        primaryId,
        hasToken: !!token,
        hasSupabaseToken: !!(supabaseToken || token),
        userDataKeys: Object.keys(userData),
        clientId: userData?.client_id,
        userId: userData?.user_id || userData?.id
      });
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Get the current auth token
   */
  static getToken(): string | null {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  /**
   * Get the primary ID (client_id for dashboard operations)
   */
  static getUserId(): string | null {
    try {
      return localStorage.getItem(USER_ID_KEY);
    } catch (error) {
      console.error('Failed to retrieve user ID:', error);
      return null;
    }
  }

  /**
   * Get the actual user ID from Supabase auth (for user-specific operations)
   */
  static getSupabaseUserId(): string | null {
    try {
      const userData = this.getUserData();
      return userData?.user_id || userData?.id || null;
    } catch (error) {
      console.error('Failed to retrieve Supabase user ID:', error);
      return null;
    }
  }

  /**
   * Get the client ID for database operations
   */
  static getClientId(): string | null {
    try {
      const userData = this.getUserData();
      return userData?.client_id || this.getUserId(); // Fallback to primary ID
    } catch (error) {
      console.error('Failed to retrieve client ID:', error);
      return null;
    }
  }
  /**
   * Get the current user data
   */
  static getUserData(): any | null {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    try {
      // Safety check for browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      // Additional safety check for Netlify deployment
      if (typeof localStorage === 'undefined') {
        return false;
      }
      
      // Production safety - don't crash on missing Supabase config
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Missing Supabase config in AuthService');
        return false;
      }
      
      const userData = this.getUserData();
      const token = this.getToken();
      
      // Enhanced authentication check - ensure we have token and valid user data
      const isValid = !!(token && userData && userData.id && token.length > 10);
      
      return isValid;
    } catch (error) {
      // DO NOT clear auth data on generic errors - only log
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get user ID from stored user data (alias for getUserId for backward compatibility)
   */
  static getStoredUserId(): string | null {
    try {
      const userData = this.getUserData();
      return userData?.id || null;
    } catch (error) {
      console.error('Failed to retrieve user ID:', error);
      return null;
    }
  }
  /**
   * Clear all authentication data
   */
  static async clearAuthData(): Promise<void> {
    try {
      // Safety check for localStorage availability
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('AuthService: localStorage not available for clearing');
        return;
      }
      
      // Clear Supabase session first to invalidate refresh tokens
      try {
        const { signOutEverywhere } = await import('../lib/auth');
        await signOutEverywhere();
      } catch (error) {
        console.error('Failed to sign out from Supabase:', error);
        // Continue with local cleanup even if Supabase signout fails
      }
      
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      
      // Clear any other auth-related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ga4_') || key.startsWith('gsc_') || key.startsWith('gbp_'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader(): Record<string, string> {
    // For Supabase Edge Functions, we need the actual JWT access token
    // not our custom base64 token
    const userData = this.getUserData();
    const userId = this.getUserId();
    
    if (!userData || !userId) {
      throw new Error('No authentication data available');
    }
    
    return {
      'Authorization': `Bearer ${userData.supabase_token || this.getToken()}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Handle authentication errors from API responses
   */
  static handleAuthError(response: Response): boolean {
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication failed, clearing stored data and redirecting to login');
      this.clearAuthData();
      // Use a slight delay to ensure cleanup completes
      setTimeout(() => {
        window.location.href = '/signin';
      }, 100);
      return true;
    }
    return false;
  }

  /**
   * Validate token and refresh if needed
   */
  static async validateAndRefreshToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Enhanced token validation
      const decoded = JSON.parse(atob(token));
      
      // Check if token has required fields  
      if (!decoded.userId) {
        console.error('Token missing required userId field');
        this.clearAuthData();
        return false;
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.error('Token has expired');
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear auth data on validation errors to prevent stuck states
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Legacy logout method - use signOutEverywhere from lib/auth.ts instead
   */
  static async logout(): Promise<void> {
    try {
      // Import and use centralized logout
      const { signOutEverywhere } = await import('../lib/auth');
      await signOutEverywhere();
    } catch (error) {
      console.error('Legacy logout error:', error);
      this.clearAuthData();
    }
  }

  /**
   * Compatibility methods for existing code
   */
  static async getSession() {
    const { supabase } = await import('../lib/supabaseClient');
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    const { supabase } = import('../lib/supabaseClient').then(m => m.supabase);
    supabase.then(sb => {
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return () => data.subscription?.unsubscribe();
    });
  }

  static async signInWithPassword(email: string, password: string) {
    const { supabase } = await import('../lib/supabaseClient');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
}