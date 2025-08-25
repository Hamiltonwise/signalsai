import express from 'express';
import { supabase } from '../config/database';

const router = express.Router();

/**
 * Create a new client
 */
router.post('/', async (req, res) => {
  try {
    const {
      practice_name,
      contact_person,
      email,
      phone_number,
      website_url,
      timezone = 'America/New_York'
    } = req.body;

    if (!practice_name || !contact_person || !email) {
      return res.status(400).json({
        error: 'Missing required fields: practice_name, contact_person, email'
      });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        practice_name,
        contact_person,
        email,
        phone_number,
        website_url,
        timezone,
        account_status: 'trial'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get client by ID
 */
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Client not found' });
      }
      throw new Error(`Failed to retrieve client: ${error.message}`);
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error retrieving client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update client
 */
router.put('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }

    res.json({
      success: true,
      data,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;