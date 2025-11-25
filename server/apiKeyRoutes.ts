import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken, requireManager } from './authMiddleware';
import crypto from 'crypto';
import { createInsertSchema } from 'drizzle-zod';
import { apiKeys } from '@shared/schema';

const router = Router();

const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

// Generate API key
router.post('/api/api-keys', authenticateToken, requireManager, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const { name, permissions, expiresAt } = req.body;

    // Generate a random API key
    const apiKey = `crm_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = apiKey.slice(0, 12); // Store prefix for identification
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const newApiKey = await storage.createApiKey({
      userId,
      name,
      keyHash,
      keyPrefix,
      permissions: permissions || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });

    // Return the full API key ONLY on creation (never again)
    res.json({
      ...newApiKey,
      apiKey, // This will be shown only once
    });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: error.message || 'Failed to create API key' });
  }
});

// Get all API keys for user
router.get('/api/api-keys', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const keys = await storage.getApiKeys(userId);
    res.json(keys);
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch API keys' });
  }
});

// Revoke API key
router.delete('/api/api-keys/:id', authenticateToken, requireManager, async (req: any, res) => {
  try {
    await storage.revokeApiKey(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke API key' });
  }
});

export default router;
