import {
  users,
  companies,
  contacts,
  deals,
  activities,
  emailCampaigns,
  campaignRecipients,
  refreshTokens,
  emailVerificationTokens,
  passwordResetTokens,
  auditLogs,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Contact,
  type InsertContact,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity,
  type EmailCampaign,
  type InsertEmailCampaign,
  type CampaignRecipient,
  type InsertCampaignRecipient,
  type RefreshToken,
  type InsertRefreshToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type AuditLog,
  type InsertAuditLog,
  type DashboardMetrics,
  type PipelineStage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, count, sum, and, gte, lt, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Company operations
  getCompanies(ownerId: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // Contact operations
  getContacts(ownerId: string): Promise<(Contact & { company?: Company })[]>;
  getContact(id: string): Promise<(Contact & { company?: Company }) | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  importContacts(contacts: InsertContact[]): Promise<Contact[]>;

  // Deal operations
  getDeals(ownerId: string): Promise<(Deal & { contact?: Contact; company?: Company })[]>;
  getDeal(id: string): Promise<(Deal & { contact?: Contact; company?: Company }) | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  getPipelineStages(ownerId: string): Promise<PipelineStage[]>;

  // Activity operations
  getActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  getUpcomingActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;

  // Email campaign operations
  getCampaigns(ownerId: string): Promise<EmailCampaign[]>;
  getCampaign(id: string): Promise<EmailCampaign | undefined>;
  createCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteCampaign(id: string): Promise<void>;
  getCampaignRecipients(campaignId: string): Promise<(CampaignRecipient & { contact: Contact })[]>;
  addCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;

  // Dashboard operations
  getDashboardMetrics(ownerId: string): Promise<DashboardMetrics>;
  getRecentActivities(ownerId: string, limit?: number): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;

  // Authentication operations
  // User auth methods
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  updateUserFailedLogin(id: string, failedCount: number, lockedUntil: Date | null): Promise<void>;
  
  // Refresh token operations
  createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
  cleanupExpiredRefreshTokens(): Promise<void>;

  // Email verification operations
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(tokenHash: string): Promise<void>;

  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(tokenHash: string): Promise<void>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId: string, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompanies(ownerId: string): Promise<Company[]> {
    // Note: Companies don't have ownerId field - they are shared across all users in this CRM
    // This is by design for B2B CRM where companies are shared entities
    return await db.select().from(companies).orderBy(asc(companies.name));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Contact operations
  async getContacts(ownerId: string): Promise<(Contact & { company?: Company })[]> {
    return await db
      .select()
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.ownerId, ownerId))
      .orderBy(desc(contacts.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.contacts,
          company: row.companies || undefined,
        }))
      );
  }

  async getContact(id: string): Promise<(Contact & { company?: Company }) | undefined> {
    const rows = await db
      .select()
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.id, id));
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      ...row.contacts,
      company: row.companies || undefined,
    };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async importContacts(contactsList: InsertContact[]): Promise<Contact[]> {
    if (contactsList.length === 0) return [];
    return await db.insert(contacts).values(contactsList).returning();
  }

  // Deal operations
  async getDeals(ownerId: string): Promise<(Deal & { contact?: Contact; company?: Company })[]> {
    return await db
      .select()
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .where(eq(deals.ownerId, ownerId))
      .orderBy(desc(deals.createdAt))
      .then(rows =>
        rows.map(row => ({
          ...row.deals,
          contact: row.contacts || undefined,
          company: row.companies || undefined,
        }))
      );
  }

  async getDeal(id: string): Promise<(Deal & { contact?: Contact; company?: Company }) | undefined> {
    const rows = await db
      .select()
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .where(eq(deals.id, id));
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      ...row.deals,
      contact: row.contacts || undefined,
      company: row.companies || undefined,
    };
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getPipelineStages(ownerId: string): Promise<PipelineStage[]> {
    const allDeals = await this.getDeals(ownerId);
    const stages = ['prospecting', 'qualification', 'proposal', 'closing'] as const;
    
    return stages.map(stage => {
      const stageDeals = allDeals.filter(deal => deal.stage === stage);
      const totalValue = stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value || '0'), 0);
      
      return {
        stage,
        deals: stageDeals,
        totalValue,
      };
    });
  }

  // Activity operations
  async getActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    return await db
      .select()
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.ownerId, ownerId))
      .orderBy(desc(activities.createdAt))
      .then(rows =>
        rows.map(row => ({
          ...row.activities,
          contact: row.contacts || undefined,
          deal: row.deals || undefined,
        }))
      );
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity> {
    const [updatedActivity] = await db
      .update(activities)
      .set({ ...activity, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getUpcomingActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7); // Next 7 days
    
    return await db
      .select()
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(
        and(
          eq(activities.ownerId, ownerId),
          eq(activities.isCompleted, false),
          gte(activities.scheduledAt, new Date())
        )
      )
      .orderBy(asc(activities.scheduledAt))
      .then(rows =>
        rows.map(row => ({
          ...row.activities,
          contact: row.contacts || undefined,
          deal: row.deals || undefined,
        }))
      );
  }

  // Email campaign operations
  async getCampaigns(ownerId: string): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.ownerId, ownerId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  async getCampaignRecipients(campaignId: string): Promise<(CampaignRecipient & { contact: Contact })[]> {
    return await db
      .select()
      .from(campaignRecipients)
      .innerJoin(contacts, eq(campaignRecipients.contactId, contacts.id))
      .where(eq(campaignRecipients.campaignId, campaignId))
      .then(rows =>
        rows.map(row => ({
          ...row.campaign_recipients,
          contact: row.contacts,
        }))
      );
  }

  async addCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (recipients.length === 0) return [];
    return await db.insert(campaignRecipients).values(recipients).returning();
  }

  // Dashboard operations
  async getDashboardMetrics(ownerId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfLastQuarter = new Date(startOfQuarter);
    startOfLastQuarter.setMonth(startOfLastQuarter.getMonth() - 3);
    const endOfLastQuarter = new Date(startOfQuarter);
    endOfLastQuarter.setDate(endOfLastQuarter.getDate() - 1);

    // Total revenue from won deals
    const [totalRevenueResult] = await db
      .select({ total: sum(deals.value) })
      .from(deals)
      .where(and(eq(deals.ownerId, ownerId), eq(deals.stage, 'won')));

    // Previous month revenue for growth calculation
    const [lastMonthRevenueResult] = await db
      .select({ total: sum(deals.value) })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        eq(deals.stage, 'won'),
        gte(deals.createdAt, startOfLastMonth),
        lt(deals.createdAt, startOfMonth)
      ));

    // Current month revenue
    const [currentMonthRevenueResult] = await db
      .select({ total: sum(deals.value) })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        eq(deals.stage, 'won'),
        gte(deals.createdAt, startOfMonth)
      ));

    // Active deals count
    const [activeDealsResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        sql`${deals.stage} NOT IN ('won', 'lost')`
      ));

    // Total contacts
    const [totalContactsResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.ownerId, ownerId));

    // Conversion rate calculation - current quarter
    const [wonDealsQuarterResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        eq(deals.stage, 'won'),
        gte(deals.createdAt, startOfQuarter)
      ));

    const [totalDealsQuarterResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        gte(deals.createdAt, startOfQuarter)
      ));

    // Conversion rate calculation - last quarter
    const [wonDealsLastQuarterResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        eq(deals.stage, 'won'),
        gte(deals.createdAt, startOfLastQuarter),
        lt(deals.createdAt, startOfQuarter)
      ));

    const [totalDealsLastQuarterResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        gte(deals.createdAt, startOfLastQuarter),
        lt(deals.createdAt, startOfQuarter)
      ));

    // Overall conversion rate
    const [wonDealsResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(eq(deals.ownerId, ownerId), eq(deals.stage, 'won')));

    const [totalDealsResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(eq(deals.ownerId, ownerId));

    // New deals this week
    const [newDealsWeekResult] = await db
      .select({ count: count() })
      .from(deals)
      .where(and(
        eq(deals.ownerId, ownerId),
        gte(deals.createdAt, startOfWeek)
      ));

    // New contacts this week
    const [newContactsWeekResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.ownerId, ownerId),
        gte(contacts.createdAt, startOfWeek)
      ));

    // Calculate values
    const totalRevenue = parseFloat(totalRevenueResult.total || '0');
    const activeDeals = activeDealsResult.count;
    const totalContacts = totalContactsResult.count;
    const wonDeals = wonDealsResult.count;
    const totalDealsCount = totalDealsResult.count;
    const conversionRate = totalDealsCount > 0 ? (wonDeals / totalDealsCount) * 100 : 0;

    // Calculate revenue growth (current month vs last month)
    const currentMonthRevenue = parseFloat(currentMonthRevenueResult.total || '0');
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult.total || '0');
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    // Calculate conversion growth (current quarter vs last quarter)
    const currentQuarterConversion = totalDealsQuarterResult.count > 0 
      ? (wonDealsQuarterResult.count / totalDealsQuarterResult.count) * 100 
      : 0;
    const lastQuarterConversion = totalDealsLastQuarterResult.count > 0 
      ? (wonDealsLastQuarterResult.count / totalDealsLastQuarterResult.count) * 100 
      : 0;
    const conversionGrowth = lastQuarterConversion > 0 
      ? currentQuarterConversion - lastQuarterConversion 
      : currentQuarterConversion;

    return {
      totalRevenue,
      activeDeals,
      conversionRate,
      totalContacts,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100, // Round to 2 decimal places
      newDealsThisWeek: newDealsWeekResult.count,
      conversionGrowth: Math.round(conversionGrowth * 100) / 100, // Round to 2 decimal places
      newContactsThisWeek: newContactsWeekResult.count,
    };
  }

  async getRecentActivities(ownerId: string, limit = 10): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    return await db
      .select()
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.ownerId, ownerId))
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .then(rows =>
        rows.map(row => ({
          ...row.activities,
          contact: row.contacts || undefined,
          deal: row.deals || undefined,
        }))
      );
  }

  // Authentication method implementations
  
  // User auth methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateUserFailedLogin(id: string, failedCount: number, lockedUntil: Date | null): Promise<void> {
    await db
      .update(users)
      .set({ 
        failedLoginCount: failedCount,
        lockedUntil: lockedUntil,
        lastLoginAt: failedCount === 0 ? new Date() : undefined, // Update last login on successful reset
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }
  
  // Refresh token operations
  async createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values(token)
      .returning();
    return refreshToken;
  }

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt)
      ));
    return token;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }

  async cleanupExpiredRefreshTokens(): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));
  }

  // Email verification operations
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [verificationToken] = await db
      .insert(emailVerificationTokens)
      .values(token)
      .returning();
    return verificationToken;
  }

  async getEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | undefined> {
    const [token] = await db
      .select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gte(emailVerificationTokens.expiresAt, new Date())
      ));
    return token;
  }

  async deleteEmailVerificationToken(tokenHash: string): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, tokenHash));
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gte(passwordResetTokens.expiresAt, new Date())
      ));
    return token;
  }

  async deletePasswordResetToken(tokenHash: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogs(userId: string, limit = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
