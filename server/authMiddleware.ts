import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwtAuth';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }

  // Attach user info to request
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    emailVerifiedAt: null,
    lastLoginAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordHash: null,
  };

  next();
}

// Optional authentication middleware (user might be logged in or not)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: null,
      };
    }
  }

  next();
}

// Role-based authorization middleware
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = (req.user as any)?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Admin only middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

// Manager or admin middleware
export function requireManager(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin', 'sales_manager')(req, res, next);
}

// Account lock check middleware
export async function checkAccountLock(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return next();
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return next();
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / (1000 * 60));
      return res.status(423).json({
        message: `Account is temporarily locked. Try again in ${minutesRemaining} minutes.`,
        lockedUntil: user.lockedUntil
      });
    }

    next();
  } catch (error) {
    next();
  }
}

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(windowMs: number = 15 * 60 * 1000, maxAttempts: number = 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, value] of entries) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }

    const current = rateLimitStore.get(identifier);
    
    if (!current) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > current.resetTime) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= maxAttempts) {
      const timeRemaining = Math.ceil((current.resetTime - now) / 1000);
      return res.status(429).json({
        message: `Too many attempts. Try again in ${timeRemaining} seconds.`,
        retryAfter: timeRemaining
      });
    }

    current.count++;
    next();
  };
}