import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken } from './authMiddleware';
import { calculateLeadScore, generateSalesForecast, generateRecommendations } from './ai';

const router = Router();

// Lead Score Routes
router.post('/api/ai/lead-score/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = (req.user as any).id;

    const contact = await storage.getContact(contactId);
    if (!contact || contact.ownerId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const deals = await storage.getDeals(userId);
    const contactDeals = deals.filter(d => d.contactId === contactId);
    const activities = await storage.getActivities(userId);
    const contactActivities = activities.filter(a => a.contactId === contactId);

    const result = await calculateLeadScore(contact, contactDeals, activities);

    const existingScore = await storage.getLeadScore(contactId);
    
    let leadScore;
    if (existingScore) {
      leadScore = await storage.updateLeadScore(contactId, {
        score: result.score,
        factors: result.factors,
      });
    } else {
      leadScore = await storage.createLeadScore({
        contactId,
        score: result.score,
        factors: result.factors,
      });
    }

    res.json(leadScore);
  } catch (error: any) {
    console.error('Error calculating lead score:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate lead score' });
  }
});

router.get('/api/ai/lead-scores', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const scores = await storage.getLeadScores(userId);
    res.json(scores);
  } catch (error: any) {
    console.error('Error fetching lead scores:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch lead scores' });
  }
});

// Sales Forecast Routes
router.post('/api/ai/forecast', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { period } = req.body;

    if (!period) {
      return res.status(400).json({ error: 'Period is required' });
    }

    const deals = await storage.getDeals(userId);
    const historicalForecasts = await storage.getSalesForecasts(userId);
    const historicalData = historicalForecasts.map(f => ({
      period: f.period,
      revenue: Number(f.actualRevenue || f.predictedRevenue),
    }));

    const result = await generateSalesForecast(deals, historicalData);

    const forecast = await storage.createSalesForecast({
      userId,
      period,
      predictedRevenue: result.predictedRevenue.toString(),
      confidence: result.confidence,
      factors: result.factors,
    });

    res.json(forecast);
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: error.message || 'Failed to generate forecast' });
  }
});

router.get('/api/ai/forecasts', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const forecasts = await storage.getSalesForecasts(userId);
    res.json(forecasts);
  } catch (error: any) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch forecasts' });
  }
});

router.patch('/api/ai/forecast/:id/actual', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualRevenue } = req.body;

    if (actualRevenue === undefined) {
      return res.status(400).json({ error: 'Actual revenue is required' });
    }

    const forecast = await storage.updateForecastActual(id, Number(actualRevenue));
    res.json(forecast);
  } catch (error: any) {
    console.error('Error updating forecast:', error);
    res.status(500).json({ error: error.message || 'Failed to update forecast' });
  }
});

// Recommendation Routes
router.post('/api/ai/recommendations/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = (req.user as any).id;

    const contact = await storage.getContact(contactId);
    if (!contact || contact.ownerId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const deals = await storage.getDeals(userId);
    const contactDeals = deals.filter(d => d.contactId === contactId);
    const activities = await storage.getActivities(userId);
    const contactActivities = activities.filter(a => a.contactId === contactId);

    const results = await generateRecommendations(contact, contactDeals, contactActivities);

    const recommendations = await Promise.all(
      results.map(rec =>
        storage.createRecommendation({
          userId,
          contactId,
          dealId: contactDeals[0]?.id,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          reasoning: rec.reasoning,
          priority: rec.priority,
        })
      )
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

router.get('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const recommendations = await storage.getRecommendations(userId);
    res.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recommendations' });
  }
});

router.patch('/api/ai/recommendations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const recommendation = await storage.updateRecommendation(id, updates);
    res.json(recommendation);
  } catch (error: any) {
    console.error('Error updating recommendation:', error);
    res.status(500).json({ error: error.message || 'Failed to update recommendation' });
  }
});

router.delete('/api/ai/recommendations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteRecommendation(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: error.message || 'Failed to delete recommendation' });
  }
});

export default router;
