import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { authenticateToken } from "./authMiddleware";
import { insertContactSchema, insertCompanySchema, insertDealSchema, insertActivitySchema, insertEmailCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmailCampaign } from "./emailService";
import authRoutes from "./authRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // JWT Authentication routes
  app.use('/api/auth', authRoutes);

  // Legacy Replit OIDC route - keeping for backwards compatibility during migration
  app.get('/api/auth/replit-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/pipeline', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const pipeline = await storage.getPipelineStages(userId);
      res.json(pipeline);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ message: "Failed to fetch pipeline" });
    }
  });

  app.get('/api/dashboard/recent-activities', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.get('/api/dashboard/upcoming-tasks', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const tasks = await storage.getUpcomingActivities(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  // Company routes
  app.get('/api/companies', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const companies = await storage.getCompanies(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/:id', authenticateToken, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', authenticateToken, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', authenticateToken, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, companyData);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Contact routes
  app.get('/api/contacts', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/contacts/:id', authenticateToken, async (req: any, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post('/api/contacts', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      // Convert "none" to null for companyId
      const requestData = { ...req.body, ownerId: userId };
      if (requestData.companyId === "none") {
        requestData.companyId = null;
      }
      const contactData = insertContactSchema.parse(requestData);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', authenticateToken, async (req: any, res) => {
    try {
      // Convert "none" to null for companyId  
      const requestData = { ...req.body };
      if (requestData.companyId === "none") {
        requestData.companyId = null;
      }
      const contactData = insertContactSchema.partial().parse(requestData);
      const contact = await storage.updateContact(req.params.id, contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  app.post('/api/contacts/import', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const contactsData = z.array(insertContactSchema).parse(
        req.body.map((contact: any) => ({ ...contact, ownerId: userId }))
      );
      const contacts = await storage.importContacts(contactsData);
      res.status(201).json(contacts);
    } catch (error) {
      console.error("Error importing contacts:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contacts data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  app.get('/api/contacts/export', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const contacts = await storage.getContacts(userId);
      
      // Transform contacts for export, including company name
      const exportData = contacts.map(contact => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        companyName: contact.company?.name || '',
        createdAt: contact.createdAt,
      }));
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting contacts:", error);
      res.status(500).json({ message: "Failed to export contacts" });
    }
  });

  // Deal routes
  app.get('/api/deals', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const deals = await storage.getDeals(userId);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/:id', authenticateToken, async (req: any, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post('/api/deals', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const dealData = insertDealSchema.parse({ ...req.body, ownerId: userId });
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put('/api/deals/:id', authenticateToken, async (req: any, res) => {
    try {
      const dealData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, dealData);
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete('/api/deals/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  app.get('/api/deals/export', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const deals = await storage.getDeals(userId);
      
      // Transform deals for export, including contact and company names
      const exportData = deals.map(deal => ({
        title: deal.title,
        description: deal.description,
        value: deal.value,
        stage: deal.stage,
        contactName: deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '',
        companyName: deal.company?.name || '',
        expectedCloseDate: deal.expectedCloseDate,
        createdAt: deal.createdAt,
      }));
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting deals:", error);
      res.status(500).json({ message: "Failed to export deals" });
    }
  });

  // Activity routes
  app.get('/api/activities', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const activities = await storage.getActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/activities/:id', authenticateToken, async (req: any, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post('/api/activities', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      // Convert date strings and handle "none" values
      const requestData = { ...req.body, ownerId: userId };
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }
      if (requestData.contactId === "none") {
        requestData.contactId = null;
      }
      if (requestData.dealId === "none") {
        requestData.dealId = null;
      }
      const activityData = insertActivitySchema.parse(requestData);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.put('/api/activities/:id', authenticateToken, async (req: any, res) => {
    try {
      // Convert date strings and handle "none" values
      const requestData = { ...req.body };
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }
      if (requestData.contactId === "none") {
        requestData.contactId = null;
      }
      if (requestData.dealId === "none") {
        requestData.dealId = null;
      }
      const activityData = insertActivitySchema.partial().parse(requestData);
      const activity = await storage.updateActivity(req.params.id, activityData);
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete('/api/activities/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteActivity(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Email campaign routes
  app.get('/api/campaigns', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/campaigns/:id', authenticateToken, async (req: any, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const campaignData = insertEmailCampaignSchema.parse({ ...req.body, ownerId: userId });
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post('/api/campaigns/:id/send', authenticateToken, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const { contactIds } = req.body;
      
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ message: "Contact IDs are required" });
      }

      const result = await sendEmailCampaign(campaignId, contactIds);
      res.json(result);
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.put('/api/campaigns/:id', authenticateToken, async (req: any, res) => {
    try {
      const campaignData = insertEmailCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete('/api/campaigns/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
