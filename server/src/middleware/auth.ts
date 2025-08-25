import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    clientId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Explicitly log when token is missing
    console.warn('Authentication: No token provided in Authorization header.');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, decoded: any) => {
    if (err) {
      // Log specific JWT verification errors
      console.error('Authentication: Token verification failed:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      userId: decoded.userId,
      clientId: decoded.clientId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  });
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Middleware to check if user belongs to the specified client
 */
export const requireClientAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const clientId = req.params.clientId || req.body.clientId || req.query.clientId;
  
  if (clientId && req.user.clientId !== clientId) {
    return res.status(403).json({ error: 'Access denied to this client data' });
  }

  next();
};