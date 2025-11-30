import {
  activities,
  contacts,
  deals,
  type Activity,
  type InsertActivity,
  type Contact,
  type Deal,
} from "@shared/schema";
import { db, eq, and, gte, desc } from "./shared/data-access";

export interface IActivityService {
  getActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  getUpcomingActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;
  getRecentActivities(ownerId: string, limit?: number): Promise<(Activity & { contact?: Contact; deal?: Deal })[]>;
}

export class ActivityService implements IActivityService {
  async getActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals,
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.ownerId, ownerId))
      .orderBy(desc(activities.scheduledAt));
    
    return result.map(row => ({
      ...row.activity,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity> {
    const [updated] = await db
      .update(activities)
      .set(activity)
      .where(eq(activities.id, id))
      .returning();
    return updated;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getUpcomingActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    const now = new Date();
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals,
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(and(
        eq(activities.ownerId, ownerId),
        gte(activities.scheduledAt, now),
        eq(activities.isCompleted, false)
      ))
      .orderBy(activities.scheduledAt);
    
    return result.map(row => ({
      ...row.activity,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }

  async getRecentActivities(ownerId: string, limit: number = 5): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    const result = await db
      .select({
        activity: activities,
        contact: contacts,
        deal: deals,
      })
      .from(activities)
      .leftJoin(contacts, eq(activities.contactId, contacts.id))
      .leftJoin(deals, eq(activities.dealId, deals.id))
      .where(eq(activities.ownerId, ownerId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    
    return result.map(row => ({
      ...row.activity,
      contact: row.contact || undefined,
      deal: row.deal || undefined,
    }));
  }
}

export const activityService = new ActivityService();
