import {
  companies,
  contacts,
  deals,
  type Company,
  type InsertCompany,
  type Contact,
  type InsertContact,
  type Deal,
  type InsertDeal,
  type PipelineStage,
} from "@shared/schema";
import { db, eq, and, desc, asc, sql } from "./shared/data-access";

export interface ICrmService {
  getCompanies(ownerId: string): Promise<Company[]>;
  getCompany(id: string, ownerId?: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>, ownerId?: string): Promise<Company>;
  deleteCompany(id: string, ownerId?: string): Promise<void>;

  getContacts(ownerId: string): Promise<(Contact & { company?: Company })[]>;
  getContact(id: string): Promise<(Contact & { company?: Company }) | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  importContacts(contacts: InsertContact[]): Promise<Contact[]>;

  getDeals(ownerId: string): Promise<(Deal & { contact?: Contact; company?: Company })[]>;
  getDeal(id: string): Promise<(Deal & { contact?: Contact; company?: Company }) | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  getPipelineStages(ownerId: string): Promise<PipelineStage[]>;
}

export class CrmService implements ICrmService {
  async getCompanies(ownerId: string): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.ownerId, ownerId)).orderBy(companies.name);
  }

  async getCompany(id: string, ownerId?: string): Promise<Company | undefined> {
    if (ownerId) {
      const [company] = await db.select().from(companies)
        .where(and(eq(companies.id, id), eq(companies.ownerId, ownerId)));
      return company;
    }
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>, ownerId?: string): Promise<Company> {
    const condition = ownerId 
      ? and(eq(companies.id, id), eq(companies.ownerId, ownerId))
      : eq(companies.id, id);
    
    const [updated] = await db
      .update(companies)
      .set(company)
      .where(condition)
      .returning();
    return updated;
  }

  async deleteCompany(id: string, ownerId?: string): Promise<void> {
    const condition = ownerId 
      ? and(eq(companies.id, id), eq(companies.ownerId, ownerId))
      : eq(companies.id, id);
    
    await db.delete(companies).where(condition);
  }

  async getContacts(ownerId: string): Promise<(Contact & { company?: Company })[]> {
    const result = await db
      .select({
        contact: contacts,
        company: companies,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.ownerId, ownerId))
      .orderBy(contacts.firstName, contacts.lastName);
    
    return result.map(row => ({
      ...row.contact,
      company: row.company || undefined,
    }));
  }

  async getContact(id: string): Promise<(Contact & { company?: Company }) | undefined> {
    const result = await db
      .select({
        contact: contacts,
        company: companies,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].contact,
      company: result[0].company || undefined,
    };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async importContacts(contactsData: InsertContact[]): Promise<Contact[]> {
    if (contactsData.length === 0) return [];
    
    const result = await db
      .insert(contacts)
      .values(contactsData)
      .returning();
    return result;
  }

  async getDeals(ownerId: string): Promise<(Deal & { contact?: Contact; company?: Company })[]> {
    const result = await db
      .select({
        deal: deals,
        contact: contacts,
        company: companies,
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .where(eq(deals.ownerId, ownerId))
      .orderBy(desc(deals.createdAt));
    
    return result.map(row => ({
      ...row.deal,
      contact: row.contact || undefined,
      company: row.company || undefined,
    }));
  }

  async getDeal(id: string): Promise<(Deal & { contact?: Contact; company?: Company }) | undefined> {
    const result = await db
      .select({
        deal: deals,
        contact: contacts,
        company: companies,
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contactId, contacts.id))
      .leftJoin(companies, eq(deals.companyId, companies.id))
      .where(eq(deals.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].deal,
      contact: result[0].contact || undefined,
      company: result[0].company || undefined,
    };
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db
      .insert(deals)
      .values(deal)
      .returning();
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db
      .update(deals)
      .set(deal)
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getPipelineStages(ownerId: string): Promise<PipelineStage[]> {
    const stages = ['prospecting', 'qualification', 'proposal', 'closing'] as const;
    const result: PipelineStage[] = [];

    for (const stage of stages) {
      const stageDeals = await db
        .select({
          deal: deals,
          contact: contacts,
          company: companies,
        })
        .from(deals)
        .leftJoin(contacts, eq(deals.contactId, contacts.id))
        .leftJoin(companies, eq(deals.companyId, companies.id))
        .where(and(eq(deals.ownerId, ownerId), sql`${deals.stage} = ${stage}`))
        .orderBy(desc(deals.createdAt));

      const dealsWithRelations = stageDeals.map(row => ({
        ...row.deal,
        contact: row.contact || undefined,
        company: row.company || undefined,
      }));

      const totalValue = dealsWithRelations.reduce((sum, deal) => sum + parseFloat(deal.value), 0);

      result.push({
        stage,
        deals: dealsWithRelations,
        totalValue,
      });
    }

    return result;
  }
}

export const crmService = new CrmService();
