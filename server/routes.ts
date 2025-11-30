import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { authService, crmService, activityService, marketingService, dashboardService } from "./services";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { authenticateToken, requireManager, requireAdmin } from "./authMiddleware";
import { insertContactSchema, insertCompanySchema, insertDealSchema, insertActivitySchema, insertEmailCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmailCampaign } from "./emailService";
import authRoutes from "./authRoutes";
import aiRoutes from "./aiRoutes";
import emailRoutes from "./emailRoutes";
import approvalRoutes from "./approvalRoutes";
import dashboardRoutes from "./dashboardRoutes";
import analyticsRoutes from "./analyticsRoutes";
import importExportRoutes from "./importExportRoutes";
import apiDocsRoutes from "./apiDocsRoutes";
import apiKeyRoutes from "./apiKeyRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // JWT Authentication routes
  app.use('/api/auth', authRoutes);

  // AI-powered features routes
  app.use(aiRoutes);

  // Email template and sequence routes
  app.use(emailRoutes);

  // Approval workflow routes
  app.use(approvalRoutes);

  // Dashboard widget routes
  app.use(dashboardRoutes);

  // Analytics routes
  app.use(analyticsRoutes);

  // Import/Export routes
  app.use(importExportRoutes);

  // API Documentation routes
  app.use(apiDocsRoutes);

  // API Key routes
  app.use(apiKeyRoutes);

  // Legacy Replit OIDC route - keeping for backwards compatibility during migration
  app.get('/api/auth/replit-user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const user = await authService.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes (Manager/Admin only)
  app.get('/api/users', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const users = await authService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const metrics = await dashboardService.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/pipeline', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const pipeline = await crmService.getPipelineStages(userId);
      res.json(pipeline);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ message: "Failed to fetch pipeline" });
    }
  });

  app.get('/api/dashboard/recent-activities', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await activityService.getRecentActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.get('/api/dashboard/upcoming-tasks', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tasks = await activityService.getUpcomingActivities(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  // Helper to normalize service response to always return array
  const unwrapData = <T>(result: T[] | { data: T[]; pagination: any }): T[] => {
    return Array.isArray(result) ? result : result.data;
  };

  // Company routes
  app.get('/api/companies', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (page || limit) {
        // Return paginated response with explicit structure
        const result = await crmService.getCompanies(userId, { page, limit });
        if (!Array.isArray(result)) {
          res.json(result);
        } else {
          res.json({ data: result, pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } });
        }
      } else {
        // Return array for backward compatibility
        const result = await crmService.getCompanies(userId);
        res.json(unwrapData(result));
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const company = await crmService.getCompany(req.params.id, userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const companyData = insertCompanySchema.parse({ ...req.body, ownerId: userId });
      const company = await crmService.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await crmService.updateCompany(req.params.id, companyData, userId);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await crmService.deleteCompany(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Contact routes
  app.get('/api/contacts', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (page || limit) {
        // Return paginated response with explicit structure
        const result = await crmService.getContacts(userId, { page, limit });
        if (!Array.isArray(result)) {
          res.json(result);
        } else {
          res.json({ data: result, pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } });
        }
      } else {
        // Return array for backward compatibility
        const result = await crmService.getContacts(userId);
        res.json(unwrapData(result));
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get('/api/contacts/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const contact = await crmService.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post('/api/contacts', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const contactData = insertContactSchema.parse({ ...req.body, ownerId: userId });
      const contact = await crmService.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await crmService.updateContact(req.params.id, contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      await crmService.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  app.post('/api/contacts/import', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const contactsData = z.array(insertContactSchema).parse(
        req.body.map((contact: any) => ({ ...contact, ownerId: userId }))
      );
      const contacts = await crmService.importContacts(contactsData);
      res.status(201).json(contacts);
    } catch (error) {
      console.error("Error importing contacts:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contacts data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  app.get('/api/contacts/export', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      // Get all contacts without pagination for export
      const result = await crmService.getContacts(userId);
      const contacts = Array.isArray(result) ? result : result.data;
      
      // Transform contacts for export, including company name
      const exportData = contacts.map((contact: any) => ({
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
  app.get('/api/deals', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (page || limit) {
        // Return paginated response with explicit structure
        const result = await crmService.getDeals(userId, { page, limit });
        if (!Array.isArray(result)) {
          res.json(result);
        } else {
          res.json({ data: result, pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } });
        }
      } else {
        // Return array for backward compatibility
        const result = await crmService.getDeals(userId);
        res.json(unwrapData(result));
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const deal = await crmService.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post('/api/deals', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const dealData = insertDealSchema.parse({ ...req.body, ownerId: userId });
      const deal = await crmService.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put('/api/deals/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const dealData = insertDealSchema.partial().parse(req.body);
      const deal = await crmService.updateDeal(req.params.id, dealData);
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete('/api/deals/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      await crmService.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  app.get('/api/deals/export', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      // Get all deals without pagination for export
      const result = await crmService.getDeals(userId);
      const deals = Array.isArray(result) ? result : result.data;
      
      // Transform deals for export, including contact and company names
      const exportData = deals.map((deal: any) => ({
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
  app.get('/api/activities', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const activities = await activityService.getActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/activities/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const activity = await activityService.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post('/api/activities', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const requestData = { ...req.body, ownerId: userId };
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }
      const activityData = insertActivitySchema.parse(requestData);
      const activity = await activityService.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.put('/api/activities/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const requestData = { ...req.body };
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }
      const activityData = insertActivitySchema.partial().parse(requestData);
      const activity = await activityService.updateActivity(req.params.id, activityData);
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete('/api/activities/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      await activityService.deleteActivity(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Email campaign routes
  app.get('/api/campaigns', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const campaigns = await marketingService.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/campaigns/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const campaign = await marketingService.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const campaignData = insertEmailCampaignSchema.parse({ ...req.body, ownerId: userId });
      const campaign = await marketingService.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post('/api/campaigns/:id/send', authenticateToken, requireManager, async (req: Request, res: Response) => {
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

  app.put('/api/campaigns/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      const campaignData = insertEmailCampaignSchema.partial().parse(req.body);
      const campaign = await marketingService.updateCampaign(req.params.id, campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete('/api/campaigns/:id', authenticateToken, requireManager, async (req: Request, res: Response) => {
    try {
      await marketingService.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
