import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken } from './authMiddleware';
import { createInsertSchema } from 'drizzle-zod';
import { pipelineMetrics, salesPerformance } from '@shared/schema';
import { db } from './db';
import { deals } from '@shared/schema';
import { eq, and, gte, lt, sql, count } from 'drizzle-orm';

const router = Router();

const insertPipelineMetricSchema = createInsertSchema(pipelineMetrics).omit({
  id: true,
  createdAt: true,
});

const insertSalesPerformanceSchema = createInsertSchema(salesPerformance).omit({
  id: true,
  createdAt: true,
});

// Pipeline Analytics Routes
router.get('/api/analytics/pipeline-conversion', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Calculate conversion rates between stages
    const stageDeals = await db
      .select({
        stage: deals.stage,
        count: count(deals.id),
      })
      .from(deals)
      .where(
        and(
          startDate ? gte(deals.createdAt, new Date(startDate as string)) : undefined,
          endDate ? lt(deals.createdAt, new Date(endDate as string)) : undefined
        )
      )
      .groupBy(deals.stage);

    // Calculate conversion rates
    const totalDeals = stageDeals.reduce((sum, s) => sum + Number(s.count), 0);
    const conversionData = stageDeals.map(s => ({
      stage: s.stage,
      count: Number(s.count),
      conversionRate: totalDeals > 0 ? (Number(s.count) / totalDeals * 100).toFixed(2) : '0',
    }));

    res.json(conversionData);
  } catch (error: any) {
    console.error('Error calculating conversion:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate conversion' });
  }
});

router.get('/api/analytics/pipeline-velocity', authenticateToken, async (req, res) => {
  try {
    // Calculate average time spent in each stage
    const velocityData = await db
      .select({
        stage: deals.stage,
        avgDays: sql<number>`AVG(EXTRACT(DAY FROM (NOW() - ${deals.createdAt})))`,
        dealCount: count(deals.id),
      })
      .from(deals)
      .groupBy(deals.stage);

    res.json(velocityData);
  } catch (error: any) {
    console.error('Error calculating velocity:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate velocity' });
  }
});

router.get('/api/analytics/pipeline-bottlenecks', authenticateToken, async (req, res) => {
  try {
    // Identify bottlenecks (stages with highest deal count and longest time)
    const bottleneckData = await db
      .select({
        stage: deals.stage,
        dealCount: count(deals.id),
        avgDaysInStage: sql<number>`AVG(EXTRACT(DAY FROM (NOW() - ${deals.createdAt})))`,
      })
      .from(deals)
      .where(eq(deals.stage, 'prospecting'))
      .groupBy(deals.stage);

    // Sort by deal count to find bottlenecks
    const bottlenecks = bottleneckData
      .map(b => ({
        stage: b.stage,
        dealCount: Number(b.dealCount),
        avgDaysInStage: Number(b.avgDaysInStage) || 0,
        bottleneckScore: Number(b.dealCount) * (Number(b.avgDaysInStage) || 1),
      }))
      .sort((a, b) => b.bottleneckScore - a.bottleneckScore);

    res.json(bottlenecks);
  } catch (error: any) {
    console.error('Error detecting bottlenecks:', error);
    res.status(500).json({ error: error.message || 'Failed to detect bottlenecks' });
  }
});

router.get('/api/analytics/win-loss', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const winLossData = await db
      .select({
        stage: deals.stage,
        count: count(deals.id),
        totalValue: sql<number>`SUM(${deals.value})`,
      })
      .from(deals)
      .where(
        and(
          startDate ? gte(deals.actualCloseDate, new Date(startDate as string)) : undefined,
          endDate ? lt(deals.actualCloseDate, new Date(endDate as string)) : undefined
        )
      )
      .groupBy(deals.stage);

    res.json(winLossData);
  } catch (error: any) {
    console.error('Error calculating win/loss:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate win/loss' });
  }
});

// Pipeline Metrics Routes
router.get('/api/pipeline-metrics', authenticateToken, async (req, res) => {
  try {
    const { period } = req.query;
    const metrics = await storage.getPipelineMetrics(period as string);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch metrics' });
  }
});

router.post('/api/pipeline-metrics', authenticateToken, async (req, res) => {
  try {
    const validated = insertPipelineMetricSchema.parse(req.body);
    const metric = await storage.createPipelineMetric(validated);
    res.json(metric);
  } catch (error: any) {
    console.error('Error creating metric:', error);
    res.status(500).json({ error: error.message || 'Failed to create metric' });
  }
});

// Sales Performance Routes
router.get('/api/sales-performance', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { period } = req.query;
    const performance = await storage.getSalesPerformance(userId, period as string);
    res.json(performance);
  } catch (error: any) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch performance' });
  }
});

router.post('/api/sales-performance', authenticateToken, async (req, res) => {
  try {
    const validated = insertSalesPerformanceSchema.parse(req.body);
    const performance = await storage.createSalesPerformance(validated);
    res.json(performance);
  } catch (error: any) {
    console.error('Error creating performance:', error);
    res.status(500).json({ error: error.message || 'Failed to create performance' });
  }
});

// Team Performance Leaderboard
router.get('/api/analytics/team-leaderboard', authenticateToken, async (req, res) => {
  try {
    const { period } = req.query;
    
    const leaderboard = await db
      .select({
        userId: deals.ownerId,
        dealsWon: count(sql`CASE WHEN ${deals.stage} = 'won' THEN 1 END`),
        totalRevenue: sql<number>`SUM(CASE WHEN ${deals.stage} = 'won' THEN ${deals.value} ELSE 0 END)`,
        avgDealSize: sql<number>`AVG(CASE WHEN ${deals.stage} = 'won' THEN ${deals.value} END)`,
      })
      .from(deals)
      .where(
        period ? gte(deals.actualCloseDate, new Date(period as string)) : undefined
      )
      .groupBy(deals.ownerId)
      .orderBy(sql`SUM(CASE WHEN ${deals.stage} = 'won' THEN ${deals.value} ELSE 0 END) DESC`);

    res.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
  }
});

export default router;
