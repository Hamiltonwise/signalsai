/**
 * Centralized API client for handling both local development and production environments
 */

import { AuthService } from './authService';
import { authFetch } from '../lib/authFetch';

// Ensure absolute URL construction for all Edge Function calls
const getEdgeFunctionUrl = (functionName: string): string => {
  const BASE = import.meta.env.VITE_SUPABASE_URL!.replace(/\/$/, '');
  const cleanFunctionName = functionName.replace(/^\//, '').replace(/^functions\/v1\//, '').replace(/^api\//, '');
  return `${BASE}/functions/v1/${cleanFunctionName}`;
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  constructor() {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('ApiClient initialized:', {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL
      });
    }
  }

  /**
   * Make API request using Supabase Edge Functions
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Validate environment variables first
    if (!import.meta.env.VITE_SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL environment variable is not set');
    }
    
    const url = getEdgeFunctionUrl(endpoint);

    if (import.meta.env.DEV) {
      console.log('ApiClient: Making request to:', url);
    }

    try {
      const response = await authFetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error('ApiClient: Request failed:', { url, status: response.status, errorText });
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('API request failed:', error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  /**
   * Get user profile and preferences
   */
  async getUserProfile(): Promise<ApiResponse> {
    return this.makeRequest('update-user-preferences', { method: 'GET' });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: any): Promise<ApiResponse> {
    return this.makeRequest('update-user-preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profile: any): Promise<ApiResponse> {
    return this.makeRequest('update-user-preferences', {
      method: 'PATCH',
      body: JSON.stringify(profile)
    });
  }
}

export const apiClient = new ApiClient();