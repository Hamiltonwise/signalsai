import express from 'express';
import { GA4Service } from '../services/ga4Service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';

const router = express.Router();
const ga4Service = new GA4Service();

/**
 * Client Registration
 * Creates a new client and initial admin user
 */
router.post('/register', async (req, res) => {
  try {
    const {
      practice_name,
      contact_person,
      email,
      phone_number,
      website_url,
      password,
      first_name,
      last_name,
      timezone = 'America/New_York'
    } = req.body;

    // Validate required fields
    if (!practice_name || !contact_person || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Missing required fields: practice_name, contact_person, email, password, first_name, last_name'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create client first
    const { data: client, error: clientError } = await supabase
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

    if (clientError) {
      throw new Error(`Failed to create client: ${clientError.message}`);
    }

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        client_id: client.id,
        email,
        password_hash,
        first_name,
        last_name,
        role: 'admin'
      })
      .select()
      .single();

    if (userError) {
      // Cleanup: delete the client if user creation fails
      await supabase.from('clients').delete().eq('id', client.id);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        clientId: client.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        client: {
          id: client.id,
          practice_name: client.practice_name,
          account_status: client.account_status
        },
        token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * User Login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user with client data
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        clients (
          id,
          practice_name,
          account_status
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        clientId: user.client_id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        client: user.clients,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initiate Google OAuth flow for GA4
 */
router.get('/ga4', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId parameter' });
    }
    
    const authUrl = ga4Service.getAuthUrl(clientId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

/**
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: clientId } = req.query;

    if (!code || !clientId) {
      return res.status(400).json({ error: 'Missing authorization code or client ID' });
    }

    const result = await ga4Service.exchangeCodeForTokens(code as string, clientId as string);
    
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?ga4_auth=success&properties=${encodeURIComponent(JSON.stringify(result.properties))}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?ga4_auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

export default router;