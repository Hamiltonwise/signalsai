import express from 'express';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Get current user's profile and preferences
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        email_notifications_enabled,
        weekly_reports_enabled,
        performance_alerts_enabled,
        data_sharing_enabled,
        usage_analytics_enabled,
        last_login,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw new Error(`Failed to retrieve user profile: ${error.message}`);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user preferences (notifications, privacy, etc.)
 */
router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      email_notifications_enabled,
      weekly_reports_enabled,
      performance_alerts_enabled,
      data_sharing_enabled,
      usage_analytics_enabled
    } = req.body;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are explicitly provided
    if (typeof email_notifications_enabled === 'boolean') {
      updateData.email_notifications_enabled = email_notifications_enabled;
    }
    if (typeof weekly_reports_enabled === 'boolean') {
      updateData.weekly_reports_enabled = weekly_reports_enabled;
    }
    if (typeof performance_alerts_enabled === 'boolean') {
      updateData.performance_alerts_enabled = performance_alerts_enabled;
    }
    if (typeof data_sharing_enabled === 'boolean') {
      updateData.data_sharing_enabled = data_sharing_enabled;
    }
    if (typeof usage_analytics_enabled === 'boolean') {
      updateData.usage_analytics_enabled = usage_analytics_enabled;
    }

    // Validate that at least one preference field is being updated
    const preferenceFields = [
      'email_notifications_enabled',
      'weekly_reports_enabled', 
      'performance_alerts_enabled',
      'data_sharing_enabled',
      'usage_analytics_enabled'
    ];
    
    const hasPreferenceUpdate = preferenceFields.some(field => field in updateData);
    
    if (!hasPreferenceUpdate) {
      return res.status(400).json({
        error: 'At least one preference field must be provided',
        validFields: preferenceFields
      });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        email_notifications_enabled,
        weekly_reports_enabled,
        performance_alerts_enabled,
        data_sharing_enabled,
        usage_analytics_enabled,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'User preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user profile information (name, email, etc.)
 */
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      first_name,
      last_name,
      email
    } = req.body;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (first_name) updateData.first_name = first_name.trim();
    if (last_name) updateData.last_name = last_name.trim();
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      // Check if email is already taken by another user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      
      updateData.email = email.trim().toLowerCase();
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return res.status(400).json({
        error: 'At least one profile field must be provided',
        validFields: ['first_name', 'last_name', 'email']
      });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's notification history (for future implementation)
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    // This is a placeholder for future notification history functionality
    res.json({
      success: true,
      data: [],
      message: 'Notification history feature coming soon'
    });
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;