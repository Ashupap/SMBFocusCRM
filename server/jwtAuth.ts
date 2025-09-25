import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import argon2 from 'argon2';
import { storage } from './storage';
import type { User } from '@shared/schema';

// JWT Configuration - require secrets from environment
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables are required');
}
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Generate access token
export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email!,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'crm-app',
    audience: 'crm-users'
  });
}

// Generate refresh token
export function generateRefreshToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email!,
    role: user.role,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'crm-app',
    audience: 'crm-users'
  });
}

// Generate token pair
export async function generateTokenPair(user: User, userAgent?: string, ipAddress?: string): Promise<TokenPair> {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Store refresh token hash in database
  const tokenHash = crypto.SHA256(refreshToken).toString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  
  await storage.createRefreshToken({
    userId: user.id,
    tokenHash,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'crm-app',
      audience: 'crm-users'
    }) as unknown as JWTPayload;
    
    return payload.type === 'access' ? payload : null;
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'crm-app',
      audience: 'crm-users'
    }) as unknown as JWTPayload;
    
    return payload.type === 'refresh' ? payload : null;
  } catch (error) {
    return null;
  }
}

// Hash password using Argon2
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

// Verify password
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    return false;
  }
}

// Generate secure random token for email verification/password reset
export function generateSecureToken(): string {
  return crypto.lib.WordArray.random(32).toString();
}

// Hash token for storage (one-way)
export function hashToken(token: string): string {
  return crypto.SHA256(token).toString();
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Revoke refresh token
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const tokenHash = crypto.SHA256(token).toString();
    await storage.revokeRefreshToken(tokenHash);
    return true;
  } catch (error) {
    return false;
  }
}

// Revoke all refresh tokens for a user
export async function revokeAllRefreshTokens(userId: string): Promise<boolean> {
  try {
    await storage.revokeAllRefreshTokensForUser(userId);
    return true;
  } catch (error) {
    return false;
  }
}

// Rate limiting helper
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMinutes = 15): boolean {
  const now = new Date();
  const attempt = loginAttempts.get(identifier);
  
  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window expired
  const windowMs = windowMinutes * 60 * 1000;
  if (now.getTime() - attempt.lastAttempt.getTime() > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (attempt.count >= maxAttempts) {
    return false;
  }
  
  // Increment counter
  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}