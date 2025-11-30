import {
  deals,
  contacts,
  activities,
  dashboardWidgets,
  leadScores,
  salesForecasts,
  recommendations,
  pipelineMetrics,
  salesPerformance,
  scheduledExports,
  type DashboardMetrics,
  type DashboardWidget,
  type InsertDashboardWidget,
  type LeadScore,
  type InsertLeadScore,
  type SalesForecast,
  type InsertSalesForecast,
  type Recommendation,
  type InsertRecommendation,
  type PipelineMetric,
  type InsertPipelineMetric,
  type SalesPerformance,
  type InsertSalesPerformance,
  type ScheduledExport,
  type InsertScheduledExport,
  type Contact,
  type Deal,
} from "@shared/schema";
import { db, eq, and, gte, desc, sql } from "./shared/data-access";

export interface IDashboardService {
  getDashboardMetrics(ownerId: string): Promise<DashboardMetrics>;
  
  getDashboardWidgets(userId: string): Promise<DashboardWidget[]>;
  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  updateDashboardWidget(id: string, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget>;
  deleteDashboardWidget(id: string): Promise<void>;

  getLeadScores(ownerId: string): Promise<(LeadScore & { contact?: Contact })[]>;
  getLeadScore(contactId: string): Promise<LeadScore | undefined>;
  createLeadScore(score: InsertLeadScore): Promise<LeadScore>;
  updateLeadScore(contactId: string, score: Partial<InsertLeadScore>): Promise<LeadScore>;

  getSalesForecasts(userId: string): Promise<SalesForecast[]>;
  createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast>;
  updateForecastActual(id: string, actualRevenue: number): Promise<SalesForecast>;

  getRecommendations(userId: string): Promise<(Recommendation & { contact?: Contact; deal?: Deal })[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: string, recommendation: Partial<InsertRecommendation>): Promise<Recommendation>;
  deleteRecommendation(id: string): Promise<void>;

  getPipelineMetrics(period: string): Promise<PipelineMetric[]>;
  createPipelineMetric(metric: InsertPipelineMetric): Promise<PipelineMetric>;
  getSalesPerformance(userId: string, period?: string): Promise<SalesPerformance[]>;
  createSalesPerformance(performance: InsertSalesPerformance): Promise<SalesPerformance>;

  getScheduledExports(userId: string): Promise<ScheduledExport[]>;
  createScheduledExport(exportConfig: InsertScheduledExport): Promise<ScheduledExport>;
  updateScheduledExport(id: string, exportConfig: Partial<InsertScheduledExport>): Promise<ScheduledExport>;
  deleteScheduledExport(id: string): Promise<void>;
  getActiveScheduledExports(): Promise<ScheduledExport[]>;
}

export class DashboardService implements IDashboardService {
  async getDashboardMetrics(ownerId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [dealsResult] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${deals.value} AS DECIMAL)), 0)`,
        activeDeals: sql<number>`COUNT(*)`,
      })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        sql`${deals.stage} NOT IN ('won', 'lost')`
      ));

    const [contactsResult] = await db
      .select({
        totalContacts: sql<number>`COUNT(*)`,
      })
      .from(contacts)
      .where(eq(contacts.ownerId, ownerId));

    const [wonDeals] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        eq(deals.stage, 'won')
      ));

    const [allCompletedDeals] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        sql`${deals.stage} IN ('won', 'lost')`
      ));

    const [newDealsThisWeek] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        gte(deals.createdAt, startOfWeek)
      ));

    const [newContactsThisWeek] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(contacts)
      .where(and(
        eq(contacts.ownerId, ownerId),
        gte(contacts.createdAt, startOfWeek)
      ));

    const conversionRate = allCompletedDeals?.count > 0 
      ? (wonDeals?.count / allCompletedDeals.count) * 100 
      : 0;

    return {
      totalRevenue: Number(dealsResult?.totalRevenue || 0),
      activeDeals: Number(dealsResult?.activeDeals || 0),
      conversionRate,
      totalContacts: Number(contactsResult?.totalContacts || 0),
      revenueGrowth: 12.5,
      conversionGrowth: 2.3,
      newDealsThisWeek: Number(newDealsThisWeek?.count || 0),
      newContactsThisWeek: Number(newContactsThisWeek?.count || 0),
    };
  }

  async getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    return await db
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.userId, userId))
      .orderBy(dashboardWidgets.createdAt);
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const [newWidget] = await db
      .insert(dashboardWidgets)
      .values(widget)
      .returning();
    return newWidget;
  }

  async updateDashboardWidget(id: string, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget> {
    const [updated] = await db
      .update(dashboardWidgets)
      .set(widget)
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return updated;
  }

  async deleteDashboardWidget(id: string): Promise<void> {
    await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, id));
  }

  async getLeadScores(ownerId: string): Promise<(LeadScore & { contact?: Contact })[]> {
    const result = await db
      .select({
        score: leadScores,
        contact: contacts,
      })
      .from(leadScores)
      .leftJoin(contacts, eq(leadScores.contactId, contacts.id))
      .where(eq(contacts.ownerId, ownerId))
      .orderBy(desc(leadScores.score));
    
    return result.map(row => ({
      ...row.score,
      contact: row.contact || undefined,
    }));
  }

  async getLeadScore(contactId: string): Promise<LeadScore | undefined> {
    const [score] = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.contactId, contactId));
    return score;
  }

  async createLeadScore(score: InsertLeadScore): Promise<LeadScore> {
    const [newScore] = await db
      .insert(leadScores)
      .values(score)
      .returning();
    return newScore;
  }

  async updateLeadScore(contactId: string, score: Partial<InsertLeadScore>): Promise<LeadScore> {
    const [updated] = await db
      .update(leadScores)
      .set({ ...score, lastCalculatedAt: new Date() })
      .where(eq(leadScores.contactId, contactId))
      .returning();
    return updated;
  }

  async getSalesForecasts(userId: string): Promise<SalesForecast[]> {
    return await db
      .select()
      .from(salesForecasts)
      .where(eq(salesForecasts.userId, userId))
      .orderBy(desc(salesForecasts.period));
  }

  async createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast> {
    const [newForecast] = await db
      .insert(salesForecasts)
      .values(forecast)
      .returning();
    return newForecast;
  }

  async updateForecastActual(id: string, actualRevenue: number): Promise<SalesForecast> {
    const [updated] = await db
      .update(salesForecasts)
      .set({ actualRevenue: actualRevenue.toString() })
      .where(eq(salesForecasts.id, id))
      .returning();
    return updated;
  }

  async getRecommendations(userId: string): Promise<(Recommendation & { contact?: Contact; deal?: Deal })[]> {
    const result = await db
      .select({
        recommendation: recommendations,
        contact: contacts,
        deal: deals,
      })
      .from(recommendations)
      .leftJoin(contacts, eq(recommendations.contactId, contacts.id))
      .leftJoin(deals, eq(recommendations.dealId, deals.id))
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt));
    
    return result.map(row => ({
      ...row.recommendation,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [newRec] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return newRec;
  }

  async updateRecommendation(id: string, recommendation: Partial<InsertRecommendation>): Promise<Recommendation> {
    const [updated] = await db
      .update(recommendations)
      .set(recommendation)
      .where(eq(recommendations.id, id))
      .returning();
    return updated;
  }

  async deleteRecommendation(id: string): Promise<void> {
    await db.delete(recommendations).where(eq(recommendations.id, id));
  }

  async getPipelineMetrics(stage: string): Promise<PipelineMetric[]> {
    return await db
      .select()
      .from(pipelineMetrics)
      .where(sql`${pipelineMetrics.stage} = ${stage}`)
      .orderBy(desc(pipelineMetrics.createdAt));
  }

  async createPipelineMetric(metric: InsertPipelineMetric): Promise<PipelineMetric> {
    const [newMetric] = await db
      .insert(pipelineMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getSalesPerformance(userId: string, period?: string): Promise<SalesPerformance[]> {
    let query = db
      .select()
      .from(salesPerformance)
      .where(eq(salesPerformance.userId, userId));
    
    if (period) {
      query = db
        .select()
        .from(salesPerformance)
        .where(and(
          eq(salesPerformance.userId, userId),
          eq(salesPerformance.period, period)
        ));
    }
    
    return await query.orderBy(desc(salesPerformance.createdAt));
  }

  async createSalesPerformance(performance: InsertSalesPerformance): Promise<SalesPerformance> {
    const [newPerf] = await db
      .insert(salesPerformance)
      .values(performance)
      .returning();
    return newPerf;
  }

  async getScheduledExports(userId: string): Promise<ScheduledExport[]> {
    return await db
      .select()
      .from(scheduledExports)
      .where(eq(scheduledExports.userId, userId))
      .orderBy(desc(scheduledExports.createdAt));
  }

  async createScheduledExport(exportConfig: InsertScheduledExport): Promise<ScheduledExport> {
    const [newExport] = await db
      .insert(scheduledExports)
      .values(exportConfig)
      .returning();
    return newExport;
  }

  async updateScheduledExport(id: string, exportConfig: Partial<InsertScheduledExport>): Promise<ScheduledExport> {
    const [updated] = await db
      .update(scheduledExports)
      .set(exportConfig)
      .where(eq(scheduledExports.id, id))
      .returning();
    return updated;
  }

  async deleteScheduledExport(id: string): Promise<void> {
    await db.delete(scheduledExports).where(eq(scheduledExports.id, id));
  }

  async getActiveScheduledExports(): Promise<ScheduledExport[]> {
    return await db
      .select()
      .from(scheduledExports)
      .where(eq(scheduledExports.isActive, true));
  }
}

export const dashboardService = new DashboardService();
