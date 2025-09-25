import express from 'express';
import { z } from 'zod';
import { storage } from './storage';
import {
  generateTokenPair,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecureToken,
  hashToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from './jwtAuth';
import { authenticateToken, checkAccountLock, rateLimit } from './authMiddleware';
import type { User } from '@shared/schema';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Helper function to handle failed login attempts
async function handleFailedLogin(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  if (!user) return;

  const failedCount = (user.failedLoginCount || 0) + 1;
  let lockedUntil: Date | null = null;

  // Lock account after 5 failed attempts for 30 minutes
  if (failedCount >= 5) {
    lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
  }

  // Update failed login count and lock status properly
  await storage.updateUserFailedLogin(user.id, failedCount, lockedUntil);
}

// Helper function to reset failed login attempts
async function resetFailedLoginAttempts(userId: string): Promise<void> {
  // Reset failed login count and clear lock
  await storage.updateUserFailedLogin(userId, 0, null);
}

// Register new user
router.post('/register', rateLimit(15 * 60 * 1000, 5), async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName } = validatedData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email address is already registered' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await storage.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'sales_rep', // Default role
      emailVerifiedAt: null, // Will be verified later
      lastLoginAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    });

    // Generate email verification token
    const verificationToken = generateSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await storage.createEmailVerificationToken({
      userId: newUser.id,
      tokenHash: verificationTokenHash,
      expiresAt,
    });

    // Log registration
    await storage.createAuditLog({
      userId: newUser.id,
      event: 'user.register',
      details: `User registered with email: ${email}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || null,
    });

    res.status(201).json({
      message: 'User registered successfully. Please verify your email address.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        emailVerified: false,
      },
      verificationToken, // In production, send this via email
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login user
router.post('/login', rateLimit(15 * 60 * 1000, 10), checkAccountLock, async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      await handleFailedLogin(email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      await handleFailedLogin(email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reset failed login attempts
    await resetFailedLoginAttempts(user.id);

    // Generate tokens
    const tokens = await generateTokenPair(
      user,
      req.get('User-Agent'),
      req.ip
    );

    // Log successful login
    await storage.createAuditLog({
      userId: user.id,
      event: 'user.login',
      details: 'User logged in successfully',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || null,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt,
      },
      tokens,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh access token
router.post('/refresh', rateLimit(5 * 60 * 1000, 20), async (req, res) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Check if token exists in database and is not revoked
    const tokenHash = require('crypto-js').SHA256(refreshToken).toString();
    const storedToken = await storage.getRefreshTokenByHash(tokenHash);
    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token not found or revoked' });
    }

    // Get user
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const tokens = await generateTokenPair(
      user,
      req.get('User-Agent'),
      req.ip
    );

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Log token refresh
    await storage.createAuditLog({
      userId: user.id,
      event: 'token.refresh',
      details: 'Access token refreshed',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || null,
    });

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get full user data from database
    const user = await storage.getUser((req.user as any).id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Revoke specific refresh token
      await revokeRefreshToken(refreshToken);
    }

    // Log logout
    if (req.user) {
      await storage.createAuditLog({
        userId: (req.user as any).id,
        event: 'user.logout',
        details: 'User logged out',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || null,
      });
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Revoke all refresh tokens for user
    await revokeAllRefreshTokens((req.user as any).id);

    // Log logout from all devices
    await storage.createAuditLog({
      userId: (req.user as any).id,
      event: 'user.logout_all',
      details: 'User logged out from all devices',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || null,
    });

    res.json({ message: 'Logged out from all devices successfully' });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    // Get user from database
    const user = await storage.getUser((req.user as any).id);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(user.passwordHash, currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await storage.updateUserPassword(user.id, newPasswordHash);

    // Log password change
    await storage.createAuditLog({
      userId: user.id,
      event: 'user.password_change',
      details: 'Password changed successfully',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || null,
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user audit logs
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const auditLogs = await storage.getAuditLogs((req.user as any).id, limit);

    res.json({ auditLogs });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;