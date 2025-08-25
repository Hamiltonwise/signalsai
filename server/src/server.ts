import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.join(__dirname, '../.env') });

// Debug: Log environment variable status
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import ga4Routes from './routes/ga4';
import clientRoutes from './routes/clients';
import integrationRoutes from './routes/integrations';
import gbpRoutes from './routes/gbp';
import gscRoutes from './routes/gsc';
import clarityRoutes from './routes/clarity';
import pmsRoutes from './routes/pms';
import userRoutes from './routes/users';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'https://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ga4', ga4Routes);
app.use('/api/clients', clientRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/gbp', gbpRoutes);
app.use('/api/gsc', gscRoutes);
app.use('/api/clarity', clarityRoutes);
app.use('/api/pms', pmsRoutes);
app.use('/api/users', userRoutes);

// Add a test route to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});