import {
  apiKeys,
  calendarEvents,
  syncedEmails,
  contacts,
  deals,
  type ApiKey,
  type InsertApiKey,
  type CalendarEvent,
  type InsertCalendarEvent,
  type SyncedEmail,
  type InsertSyncedEmail,
  type Contact,
  type Deal,
} from "@shared/schema";
import { db, eq, desc } from "./shared/data-access";

export interface IIntegrationService {
  getApiKeys(userId: string): Promise<ApiKey[]>;
  createApiKey(key: InsertApiKey): Promise<ApiKey>;
  updateApiKeyLastUsed(keyPrefix: string): Promise<void>;
  revokeApiKey(id: string): Promise<void>;

  getCalendarEvents(userId: string): Promise<(CalendarEvent & { contact?: Contact; deal?: Deal })[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;

  getSyncedEmails(userId: string): Promise<(SyncedEmail & { contact?: Contact; deal?: Deal })[]>;
  createSyncedEmail(email: InsertSyncedEmail): Promise<SyncedEmail>;
}

export class IntegrationService implements IIntegrationService {
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(key: InsertApiKey): Promise<ApiKey> {
    const [newKey] = await db
      .insert(apiKeys)
      .values(key)
      .returning();
    return newKey;
  }

  async updateApiKeyLastUsed(keyPrefix: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyPrefix, keyPrefix));
  }

  async revokeApiKey(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
  }

  async getCalendarEvents(userId: string): Promise<(CalendarEvent & { contact?: Contact; deal?: Deal })[]> {
    const result = await db
      .select({
        event: calendarEvents,
        contact: contacts,
        deal: deals,
      })
      .from(calendarEvents)
      .leftJoin(contacts, eq(calendarEvents.contactId, contacts.id))
      .leftJoin(deals, eq(calendarEvents.dealId, deals.id))
      .where(eq(calendarEvents.userId, userId))
      .orderBy(calendarEvents.startTime);
    
    return result.map(row => ({
      ...row.event,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [updated] = await db
      .update(calendarEvents)
      .set(event)
      .where(eq(calendarEvents.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async getSyncedEmails(userId: string): Promise<(SyncedEmail & { contact?: Contact; deal?: Deal })[]> {
    const result = await db
      .select({
        email: syncedEmails,
        contact: contacts,
        deal: deals,
      })
      .from(syncedEmails)
      .leftJoin(contacts, eq(syncedEmails.contactId, contacts.id))
      .leftJoin(deals, eq(syncedEmails.dealId, deals.id))
      .where(eq(syncedEmails.userId, userId))
      .orderBy(desc(syncedEmails.sentAt));
    
    return result.map(row => ({
      ...row.email,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }

  async createSyncedEmail(email: InsertSyncedEmail): Promise<SyncedEmail> {
    const [newEmail] = await db
      .insert(syncedEmails)
      .values(email)
      .returning();
    return newEmail;
  }
}

export const integrationService = new IntegrationService();
