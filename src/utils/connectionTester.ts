/**
 * Comprehensive connection testing utility for debugging production issues
 */

interface ConnectionTest {
  name: string;
  test: () => Promise<{ success: boolean; message: string; data?: any }>;
}

interface TestResults {
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    name: string;
    success: boolean;
    message: string;
    data?: any;
    duration: number;
  }>;
}

export class ConnectionTester {
  private static instance: ConnectionTester;
  private tests: ConnectionTest[] = [];

  static getInstance(): ConnectionTester {
    if (!ConnectionTester.instance) {
      ConnectionTester.instance = new ConnectionTester();
    }
    return ConnectionTester.instance;
  }

  constructor() {
    this.initializeTests();
  }

  private initializeTests() {
    this.tests = [
      {
        name: 'Environment Variables',
        test: this.testEnvironmentVariables
      },
      {
        name: 'Supabase Connection',
        test: this.testSupabaseConnection
      },
      {
        name: 'Authentication State',
        test: this.testAuthenticationState
      },
      {
        name: 'Edge Functions Health',
        test: this.testEdgeFunctionsHealth
      },
      {
        name: 'GA4 Auth Function',
        test: this.testGA4AuthFunction
      },
      {
        name: 'Client ID Resolution',
        test: this.testClientIdResolution
      },
      {
        name: 'Local Storage',
        test: this.testLocalStorage
      },
      {
        name: 'Network Connectivity',
        test: this.testNetworkConnectivity
      }
    ];
  }

  async runAllTests(): Promise<TestResults> {
    console.log('🧪 Starting comprehensive connection tests...');
    
    const results: TestResults = {
      passed: 0,
      failed: 0,
      total: this.tests.length,
      results: []
    };

    for (const test of this.tests) {
      const startTime = performance.now();
      
      try {
        console.log(`🧪 Running test: ${test.name}`);
        const result = await test.test();
        const duration = performance.now() - startTime;
        
        results.results.push({
          name: test.name,
          success: result.success,
          message: result.message,
          data: result.data,
          duration
        });

        if (result.success) {
          results.passed++;
          console.log(`✅ ${test.name}: ${result.message}`);
        } else {
          results.failed++;
          console.error(`❌ ${test.name}: ${result.message}`);
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        results.failed++;
        results.results.push({
          name: test.name,
          success: false,
          message: `Test failed: ${error.message}`,
          duration
        });
        console.error(`❌ ${test.name}: Test failed:`, error);
      }
    }

    console.log('🧪 Test Summary:', {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      successRate: `${((results.passed / results.total) * 100).toFixed(1)}%`
    });

    return results;
  }

  private testEnvironmentVariables = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const issues = [];
    
    if (!supabaseUrl) issues.push('VITE_SUPABASE_URL missing');
    if (!supabaseAnonKey) issues.push('VITE_SUPABASE_ANON_KEY missing');
    
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      issues.push('VITE_SUPABASE_URL invalid format');
    }
    
    if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
      issues.push('VITE_SUPABASE_URL not a Supabase URL');
    }

    return {
      success: issues.length === 0,
      message: issues.length === 0 
        ? 'All environment variables configured correctly'
        : `Issues found: ${issues.join(', ')}`,
      data: {
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
        hasAnonKey: !!supabaseAnonKey,
        anonKeyLength: supabaseAnonKey?.length || 0
      }
    };
  };

  private testSupabaseConnection = async () => {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data, error } = await supabase.auth.getSession();
      
      return {
        success: !error,
        message: error ? `Supabase connection failed: ${error.message}` : 'Supabase connection successful',
        data: {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
          sessionExpiry: data.session?.expires_at
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Supabase connection error: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testAuthenticationState = async () => {
    try {
      const { AuthService } = await import('./authService');
      
      const isAuthenticated = AuthService.isAuthenticated();
      const token = AuthService.getToken();
      const userId = AuthService.getUserId();
      const userData = AuthService.getUserData();
      
      return {
        success: isAuthenticated,
        message: isAuthenticated 
          ? 'Authentication state valid'
          : 'Not authenticated or invalid auth state',
        data: {
          isAuthenticated,
          hasToken: !!token,
          userId,
          clientId: userData?.client_id,
          userDataKeys: userData ? Object.keys(userData) : []
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Auth state test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testEdgeFunctionsHealth = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          success: false,
          message: 'Missing environment variables for Edge Functions test'
        };
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: response.ok 
          ? 'Edge Functions are accessible'
          : `Edge Functions error: ${response.status}`,
        data: {
          status: response.status,
          responseData: data
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Edge Functions test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testGA4AuthFunction = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          success: false,
          message: 'Missing environment variables for GA4 auth test'
        };
      }

      // Test with a dummy UUID
      const testClientId = '12345678-1234-1234-1234-123456789012';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/ga4-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId: testClientId })
      });

      const data = await response.json();

      return {
        success: response.ok && data.success,
        message: response.ok && data.success
          ? 'GA4 auth function is working'
          : `GA4 auth function error: ${data.error || response.statusText}`,
        data: {
          status: response.status,
          hasAuthUrl: !!data.authUrl,
          responseData: data
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `GA4 auth function test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testClientIdResolution = async () => {
    try {
      const { AuthService } = await import('./authService');
      const { supabase } = await import('../lib/supabaseClient');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'No active session for client ID test'
        };
      }

      const userId = session.user.id;
      const storedClientId = AuthService.getUserId();
      const userData = AuthService.getUserData();
      
      // Try to fetch from database
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', userId)
        .single();

      return {
        success: !!(storedClientId || userRecord?.client_id),
        message: storedClientId || userRecord?.client_id
          ? 'Client ID resolved successfully'
          : 'Client ID resolution failed',
        data: {
          userId,
          storedClientId,
          dbClientId: userRecord?.client_id,
          userDataClientId: userData?.client_id,
          dbError: error?.message
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Client ID resolution test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testLocalStorage = async () => {
    try {
      const testKey = 'connection_test';
      const testValue = 'test_value';
      
      // Test write
      localStorage.setItem(testKey, testValue);
      
      // Test read
      const readValue = localStorage.getItem(testKey);
      
      // Cleanup
      localStorage.removeItem(testKey);
      
      // Check auth-related storage
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('user') || key.includes('ga4'))) {
          authKeys.push(key);
        }
      }

      return {
        success: readValue === testValue,
        message: readValue === testValue
          ? 'Local storage is working correctly'
          : 'Local storage read/write failed',
        data: {
          testPassed: readValue === testValue,
          authKeysCount: authKeys.length,
          authKeys: authKeys.slice(0, 5) // First 5 keys
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Local storage test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  private testNetworkConnectivity = async () => {
    try {
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://accounts.google.com/',
        import.meta.env.VITE_SUPABASE_URL
      ].filter(Boolean);

      const results = await Promise.allSettled(
        testUrls.map(async (url) => {
          const response = await fetch(url, { method: 'HEAD' });
          return { url, status: response.status, ok: response.ok };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const total = results.length;

      return {
        success: successful === total,
        message: `Network connectivity: ${successful}/${total} endpoints reachable`,
        data: {
          successful,
          total,
          results: results.map(r => 
            r.status === 'fulfilled' 
              ? r.value 
              : { error: r.reason?.message }
          )
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Network connectivity test failed: ${error.message}`,
        data: { error: error.message }
      };
    }
  };

  // Quick diagnostic for immediate issues
  static async quickDiagnostic(): Promise<string[]> {
    const issues = [];
    
    // Check environment
    if (!import.meta.env.VITE_SUPABASE_URL) {
      issues.push('❌ VITE_SUPABASE_URL not set');
    }
    
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      issues.push('❌ VITE_SUPABASE_ANON_KEY not set');
    }

    // Check auth state
    try {
      const { AuthService } = await import('./authService');
      if (!AuthService.isAuthenticated()) {
        issues.push('❌ User not authenticated');
      }
      
      const clientId = AuthService.getUserId();
      if (!clientId) {
        issues.push('❌ No client ID available');
      }
    } catch (error) {
      issues.push(`❌ Auth service error: ${error.message}`);
    }

    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      issues.push('❌ localStorage not available');
    }

    return issues;
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).connectionTester = ConnectionTester.getInstance();
  (window as any).quickDiagnostic = ConnectionTester.quickDiagnostic;
}