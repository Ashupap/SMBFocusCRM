import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken } from './authMiddleware';
import { createInsertSchema } from 'drizzle-zod';
import { dashboardWidgets } from '@shared/schema';

const router = Router();

const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

// Dashboard Widget Routes
router.get('/api/dashboard-widgets', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const widgets = await storage.getDashboardWidgets(userId);
    res.json(widgets);
  } catch (error: any) {
    console.error('Error fetching widgets:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch widgets' });
  }
});

router.post('/api/dashboard-widgets', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validated = insertDashboardWidgetSchema.parse(req.body);

    const widget = await storage.createDashboardWidget({
      ...validated,
      userId,
    });

    res.json(widget);
  } catch (error: any) {
    console.error('Error creating widget:', error);
    res.status(500).json({ error: error.message || 'Failed to create widget' });
  }
});

router.patch('/api/dashboard-widgets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const widget = await storage.updateDashboardWidget(id, req.body);
    res.json(widget);
  } catch (error: any) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: error.message || 'Failed to update widget' });
  }
});

router.delete('/api/dashboard-widgets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteDashboardWidget(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: error.message || 'Failed to delete widget' });
  }
});

export default router;
