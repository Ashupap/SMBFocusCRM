import {
  emailCampaigns,
  campaignRecipients,
  emailTemplates,
  emailSequences,
  emailSequenceSteps,
  sequenceEnrollments,
  contacts,
  type EmailCampaign,
  type InsertEmailCampaign,
  type CampaignRecipient,
  type InsertCampaignRecipient,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailSequence,
  type InsertEmailSequence,
  type EmailSequenceStep,
  type InsertEmailSequenceStep,
  type SequenceEnrollment,
  type InsertSequenceEnrollment,
  type Contact,
} from "@shared/schema";
import { db, eq, desc, asc } from "./shared/data-access";

export interface IMarketingService {
  getCampaigns(ownerId: string): Promise<EmailCampaign[]>;
  getCampaign(id: string): Promise<EmailCampaign | undefined>;
  createCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteCampaign(id: string): Promise<void>;
  getCampaignRecipients(campaignId: string): Promise<(CampaignRecipient & { contact: Contact })[]>;
  addCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;

  getEmailTemplates(ownerId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  getEmailSequences(ownerId: string): Promise<EmailSequence[]>;
  getEmailSequence(id: string): Promise<EmailSequence | undefined>;
  createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence>;
  updateEmailSequence(id: string, sequence: Partial<InsertEmailSequence>): Promise<EmailSequence>;
  deleteEmailSequence(id: string): Promise<void>;
  getSequenceSteps(sequenceId: string): Promise<EmailSequenceStep[]>;
  createSequenceStep(step: InsertEmailSequenceStep): Promise<EmailSequenceStep>;
  updateSequenceStep(id: string, step: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep>;
  deleteSequenceStep(id: string): Promise<void>;

  getSequenceEnrollments(sequenceId: string): Promise<(SequenceEnrollment & { contact?: Contact })[]>;
  createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment>;
  updateSequenceEnrollment(id: string, enrollment: Partial<InsertSequenceEnrollment>): Promise<SequenceEnrollment>;
}

export class MarketingService implements IMarketingService {
  async getCampaigns(ownerId: string): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.ownerId, ownerId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [updated] = await db
      .update(emailCampaigns)
      .set(campaign)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  async getCampaignRecipients(campaignId: string): Promise<(CampaignRecipient & { contact: Contact })[]> {
    const result = await db
      .select({
        recipient: campaignRecipients,
        contact: contacts,
      })
      .from(campaignRecipients)
      .innerJoin(contacts, eq(campaignRecipients.contactId, contacts.id))
      .where(eq(campaignRecipients.campaignId, campaignId));
    
    return result.map(row => ({
      ...row.recipient,
      contact: row.contact,
    }));
  }

  async addCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (recipients.length === 0) return [];
    return await db
      .insert(campaignRecipients)
      .values(recipients)
      .returning();
  }

  async getEmailTemplates(ownerId: string): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.ownerId, ownerId))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set(template)
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async getEmailSequences(ownerId: string): Promise<EmailSequence[]> {
    return await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.ownerId, ownerId))
      .orderBy(desc(emailSequences.createdAt));
  }

  async getEmailSequence(id: string): Promise<EmailSequence | undefined> {
    const [sequence] = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.id, id));
    return sequence;
  }

  async createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence> {
    const [newSequence] = await db
      .insert(emailSequences)
      .values(sequence)
      .returning();
    return newSequence;
  }

  async updateEmailSequence(id: string, sequence: Partial<InsertEmailSequence>): Promise<EmailSequence> {
    const [updated] = await db
      .update(emailSequences)
      .set(sequence)
      .where(eq(emailSequences.id, id))
      .returning();
    return updated;
  }

  async deleteEmailSequence(id: string): Promise<void> {
    await db.delete(emailSequences).where(eq(emailSequences.id, id));
  }

  async getSequenceSteps(sequenceId: string): Promise<EmailSequenceStep[]> {
    return await db
      .select()
      .from(emailSequenceSteps)
      .where(eq(emailSequenceSteps.sequenceId, sequenceId))
      .orderBy(asc(emailSequenceSteps.stepOrder));
  }

  async createSequenceStep(step: InsertEmailSequenceStep): Promise<EmailSequenceStep> {
    const [newStep] = await db
      .insert(emailSequenceSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async updateSequenceStep(id: string, step: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep> {
    const [updated] = await db
      .update(emailSequenceSteps)
      .set(step)
      .where(eq(emailSequenceSteps.id, id))
      .returning();
    return updated;
  }

  async deleteSequenceStep(id: string): Promise<void> {
    await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.id, id));
  }

  async getSequenceEnrollments(sequenceId: string): Promise<(SequenceEnrollment & { contact?: Contact })[]> {
    const result = await db
      .select({
        enrollment: sequenceEnrollments,
        contact: contacts,
      })
      .from(sequenceEnrollments)
      .leftJoin(contacts, eq(sequenceEnrollments.contactId, contacts.id))
      .where(eq(sequenceEnrollments.sequenceId, sequenceId));
    
    return result.map(row => ({
      ...row.enrollment,
      contact: row.contact || undefined,
    }));
  }

  async createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment> {
    const [newEnrollment] = await db
      .insert(sequenceEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async updateSequenceEnrollment(id: string, enrollment: Partial<InsertSequenceEnrollment>): Promise<SequenceEnrollment> {
    const [updated] = await db
      .update(sequenceEnrollments)
      .set(enrollment)
      .where(eq(sequenceEnrollments.id, id))
      .returning();
    return updated;
  }
}

export const marketingService = new MarketingService();
