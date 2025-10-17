import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { apiKeys } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    if (!apiKeyHeader) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Extract the prefix to find the key
    const keyPrefix = apiKeyHeader.slice(0, 12);
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    // Find the API key
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyPrefix, keyPrefix),
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if key is expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    // Attach user info to request
    (req as any).user = { id: apiKey.userId };
    (req as any).apiKey = apiKey;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
