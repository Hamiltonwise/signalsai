import { google } from 'googleapis';
import { supabase } from '../config/database';
import { encryptData, decryptData } from '../utils/encryption';

export class GA4Service {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth URL for GA4 authentication
   */
  getAuthUrl(clientId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.manage.users.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: clientId, // Pass client ID in state parameter
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, clientId: string) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. User may need to revoke access and re-authenticate.');
      }

      // Store tokens in database
      await this.storeTokens(clientId, tokens);
      
      // Get GA4 properties for this user
      const properties = await this.getGA4Properties(tokens.access_token);
      
      return {
        success: true,
        properties,
        message: 'GA4 authentication successful'
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google Analytics');
    }
  }

  /**
   * Store encrypted tokens in database
   */
  private async storeTokens(clientId: string, tokens: any) {
    const credentials = [
      {
        client_id: clientId,
        service_name: 'ga4',
        credential_type: 'access_token',
        encrypted_value: encryptData(tokens.access_token),
        expiration_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
      },
      {
        client_id: clientId,
        service_name: 'ga4',
        credential_type: 'refresh_token',
        encrypted_value: encryptData(tokens.refresh_token)
      }
    ];

    // Delete existing tokens
    await supabase
      .from('api_credentials')
      .delete()
      .eq('client_id', clientId)
      .eq('service_name', 'ga4');

    // Insert new tokens
    const { error } = await supabase
      .from('api_credentials')
      .insert(credentials);

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  }

  /**
   * Get GA4 properties for authenticated user
   */
  private async getGA4Properties(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: this.oauth2Client });

    try {
      const response = await analyticsAdmin.accounts.list();
      const accounts = response.data.accounts || [];
      
      const properties = [];
      for (const account of accounts) {
        const propertiesResponse = await analyticsAdmin.accounts.properties.list({
          parent: account.name
        });
        
        if (propertiesResponse.data.properties) {
          properties.push(...propertiesResponse.data.properties.map(prop => ({
            id: prop.name?.split('/')[1],
            displayName: prop.displayName,
            accountName: account.displayName
          })));
        }
      }
      
      return properties;
    } catch (error) {
      console.error('Error fetching GA4 properties:', error);
      return [];
    }
  }

  /**
   * Fetch GA4 data for a client
   */
  async fetchGA4Data(clientId: string, propertyId: string, startDate: string, endDate: string) {
    try {
      // Get stored tokens
      const tokens = await this.getStoredTokens(clientId);
      if (!tokens) {
        throw new Error('No GA4 tokens found for client');
      }

      // Refresh access token if needed
      const accessToken = await this.refreshAccessTokenIfNeeded(clientId, tokens);
      
      // Set up authenticated client
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const analyticsData = google.analyticsdata({ version: 'v1beta', auth: this.oauth2Client });

      // Fetch data from GA4
      const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'newUsers' },
            { name: 'totalUsers' },
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'screenPageViewsPerSession' }
          ],
          dimensions: [{ name: 'date' }]
        }
      });

      // Process and store the data
      const processedData = this.processGA4Response(response.data, clientId);
      await this.storeGA4Metrics(processedData);

      return {
        success: true,
        data: processedData,
        message: 'GA4 data fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching GA4 data:', error);
      throw new Error(`Failed to fetch GA4 data: ${error.message}`);
    }
  }

  /**
   * Get stored tokens for a client
   */
  private async getStoredTokens(clientId: string) {
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('client_id', clientId)
      .eq('service_name', 'ga4');

    if (error || !data || data.length === 0) {
      return null;
    }

    const tokens: any = {};
    data.forEach(cred => {
      tokens[cred.credential_type] = decryptData(cred.encrypted_value);
      if (cred.expiration_date) {
        tokens.expiry_date = new Date(cred.expiration_date).getTime();
      }
    });

    return tokens;
  }

  /**
   * Refresh access token if needed
   */
  private async refreshAccessTokenIfNeeded(clientId: string, tokens: any): Promise<string> {
    const now = Date.now();
    const expiryTime = tokens.expiry_date || 0;

    // If token expires in less than 5 minutes, refresh it
    if (expiryTime - now < 5 * 60 * 1000) {
      this.oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update stored access token
      await supabase
        .from('api_credentials')
        .update({
          encrypted_value: encryptData(credentials.access_token),
          expiration_date: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('service_name', 'ga4')
        .eq('credential_type', 'access_token');

      return credentials.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Process GA4 API response
   */
  private processGA4Response(data: any, clientId: string) {
    const rows = data.rows || [];
    const processedData = [];

    for (const row of rows) {
      const date = row.dimensionValues[0].value;
      const metrics = row.metricValues;

      const record = {
        client_id: clientId,
        date,
        new_users: parseInt(metrics[0].value) || 0,
        total_users: parseInt(metrics[1].value) || 0,
        sessions: parseInt(metrics[2].value) || 0,
        engagement_rate: parseFloat(metrics[3].value) || 0,
        conversions: parseInt(metrics[4].value) || 0,
        avg_session_duration: parseFloat(metrics[5].value) || 0,
        bounce_rate: parseFloat(metrics[6].value) || 0,
        pages_per_session: parseFloat(metrics[7].value) || 0,
        calculated_score: this.calculateGA4Score({
          engagement_rate: parseFloat(metrics[3].value) || 0,
          conversions: parseInt(metrics[4].value) || 0,
          bounce_rate: parseFloat(metrics[6].value) || 0,
          pages_per_session: parseFloat(metrics[7].value) || 0
        })
      };

      processedData.push(record);
    }

    return processedData;
  }

  /**
   * Calculate GA4 performance score
   */
  private calculateGA4Score(metrics: {
    engagement_rate: number;
    conversions: number;
    bounce_rate: number;
    pages_per_session: number;
  }): number {
    let score = 0;

    // Engagement rate (0-40 points)
    score += Math.min(metrics.engagement_rate * 100 * 0.4, 40);

    // Conversions (0-30 points) - normalized for dental practices
    const conversionScore = Math.min(metrics.conversions * 2, 30);
    score += conversionScore;

    // Bounce rate (0-20 points) - lower is better
    const bounceScore = Math.max(20 - (metrics.bounce_rate * 100 * 0.2), 0);
    score += bounceScore;

    // Pages per session (0-10 points)
    score += Math.min(metrics.pages_per_session * 3, 10);

    return Math.round(Math.min(score, 100));
  }

  /**
   * Store GA4 metrics in database
   */
  private async storeGA4Metrics(data: any[]) {
    if (data.length === 0) return;

    // Use upsert to handle duplicate dates
    const { error } = await supabase
      .from('ga4_metrics')
      .upsert(data, {
        onConflict: 'client_id,date'
      });

    if (error) {
      throw new Error(`Failed to store GA4 metrics: ${error.message}`);
    }
  }

  /**
   * Get GA4 metrics for a client
   */
  async getGA4Metrics(clientId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('ga4_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to retrieve GA4 metrics: ${error.message}`);
    }

    return data || [];
  }
}