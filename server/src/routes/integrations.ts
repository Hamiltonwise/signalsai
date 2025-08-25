import express from 'express';
import { supabase } from '../config/database';
import { encryptJSON, decryptJSON } from '../utils/encryption';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Get all integration accounts for a client
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;

    const { data: integrations, error } = await supabase
      .from('integration_accounts')
      .select('id, platform, account_name, connection_status, last_sync, metadata, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to retrieve integrations: ${error.message}`);
    }

    res.json({
      success: true,
      data: integrations || []
    });
  } catch (error) {
    console.error('Error retrieving integrations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create or update integration account
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const {
      platform,
      account_name,
      credentials,
      metadata = {}
    } = req.body;

    if (!platform || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: platform, credentials'
      });
    }

    // Validate platform
    const validPlatforms = ['ga4', 'gbp', 'gsc', 'clarity'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
      });
    }

    // Encrypt credentials
    const encrypted_credentials = encryptJSON(credentials);

    // Upsert integration account
    const { data, error } = await supabase
      .from('integration_accounts')
      .upsert({
        client_id: clientId,
        platform,
        account_name,
        encrypted_credentials,
        connection_status: 'active',
        metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,platform'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save integration: ${error.message}`);
    }

    // Return without sensitive data
    const { encrypted_credentials: _, ...safeData } = data;

    res.json({
      success: true,
      data: safeData,
      message: `${platform.toUpperCase()} integration saved successfully`
    });
  } catch (error) {
    console.error('Error saving integration:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update integration status
 */
router.patch('/:integrationId/status', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { integrationId } = req.params;
    const { connection_status, last_sync } = req.body;

    const validStatuses = ['active', 'expired', 'error', 'disconnected'];
    if (connection_status && !validStatuses.includes(connection_status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (connection_status) updateData.connection_status = connection_status;
    if (last_sync) updateData.last_sync = last_sync;

    const { data, error } = await supabase
      .from('integration_accounts')
      .update(updateData)
      .eq('id', integrationId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update integration: ${error.message}`);
    }

    if (!data) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({
      success: true,
      data: { id: data.id, connection_status: data.connection_status },
      message: 'Integration status updated successfully'
    });
  } catch (error) {
    console.error('Error updating integration status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete integration account
 */
router.delete('/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { integrationId } = req.params;

    const { error } = await supabase
      .from('integration_accounts')
      .delete()
      .eq('id', integrationId)
      .eq('client_id', clientId);

    if (error) {
      throw new Error(`Failed to delete integration: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get integration credentials (for internal use by services)
 * This endpoint should only be accessible by service role
 */
router.get('/:platform/credentials/:clientId', async (req, res) => {
  try {
    // Verify this is a service role request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('service_role')) {
      return res.status(403).json({ error: 'Service role access required' });
    }

    const { platform, clientId } = req.params;

    const { data, error } = await supabase
      .from('integration_accounts')
      .select('encrypted_credentials, metadata')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .eq('connection_status', 'active')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Integration not found or inactive' });
    }

    // Decrypt credentials for service use
    const credentials = decryptJSON(data.encrypted_credentials);

    res.json({
      success: true,
      data: {
        credentials,
        metadata: data.metadata
      }
    });
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;