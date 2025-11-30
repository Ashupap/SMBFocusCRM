import { authService } from './auth.service';
import { crmService } from './crm.service';
import { activityService } from './activity.service';
import { marketingService } from './marketing.service';
import { approvalService } from './approval.service';
import { dashboardService } from './dashboard.service';
import { integrationService } from './integration.service';

import type {
  User,
  UpsertUser,
  Company,
  InsertCompany,
  Contact,
  InsertContact,
  Deal,
  InsertDeal,
  Activity,
  InsertActivity,
  EmailCampaign,
  InsertEmailCampaign,
  CampaignRecipient,
  InsertCampaignRecipient,
  RefreshToken,
  InsertRefreshToken,
  EmailVerificationToken,
  InsertEmailVerificationToken,
  PasswordResetToken,
  InsertPasswordResetToken,
  AuditLog,
  InsertAuditLog,
  DashboardMetrics,
  PipelineStage,
  EmailTemplate,
  InsertEmailTemplate,
  EmailSequence,
  InsertEmailSequence,
  EmailSequenceStep,
  InsertEmailSequenceStep,
  SequenceEnrollment,
  InsertSequenceEnrollment,
  LeadScore,
  InsertLeadScore,
  SalesForecast,
  InsertSalesForecast,
  Recommendation,
  InsertRecommendation,
  DashboardWidget,
  InsertDashboardWidget,
  ApiKey,
  InsertApiKey,
  CalendarEvent,
  InsertCalendarEvent,
  SyncedEmail,
  InsertSyncedEmail,
  PipelineMetric,
  InsertPipelineMetric,
  SalesPerformance,
  InsertSalesPerformance,
  ScheduledExport,
  InsertScheduledExport,
  ApprovalWorkflow,
  InsertApprovalWorkflow,
  WorkflowStep,
  InsertWorkflowStep,
  ApprovalRequest,
  InsertApprovalRequest,
  ApprovalAction,
  InsertApprovalAction,
} from "@shared/schema";

export class StorageFacade {
  getUser(id: string): Promise<User | undefined> {
    return authService.getUser(id);
  }

  getAllUsers(): Promise<User[]> {
    return authService.getAllUsers();
  }

  upsertUser(user: UpsertUser): Promise<User> {
    return authService.upsertUser(user);
  }

  async getCompanies(ownerId: string): Promise<Company[]> {
    const result = await crmService.getCompanies(ownerId);
    return Array.isArray(result) ? result : result.data;
  }

  getCompany(id: string, ownerId?: string): Promise<Company | undefined> {
    return crmService.getCompany(id, ownerId);
  }

  createCompany(company: InsertCompany): Promise<Company> {
    return crmService.createCompany(company);
  }

  updateCompany(id: string, company: Partial<InsertCompany>, ownerId?: string): Promise<Company> {
    return crmService.updateCompany(id, company, ownerId);
  }

  deleteCompany(id: string, ownerId?: string): Promise<void> {
    return crmService.deleteCompany(id, ownerId);
  }

  async getContacts(ownerId: string): Promise<(Contact & { company?: Company })[]> {
    const result = await crmService.getContacts(ownerId);
    return Array.isArray(result) ? result : result.data;
  }

  getContact(id: string): Promise<(Contact & { company?: Company }) | undefined> {
    return crmService.getContact(id);
  }

  createContact(contact: InsertContact): Promise<Contact> {
    return crmService.createContact(contact);
  }

  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    return crmService.updateContact(id, contact);
  }

  deleteContact(id: string): Promise<void> {
    return crmService.deleteContact(id);
  }

  importContacts(contacts: InsertContact[]): Promise<Contact[]> {
    return crmService.importContacts(contacts);
  }

  async getDeals(ownerId: string): Promise<(Deal & { contact?: Contact; company?: Company })[]> {
    const result = await crmService.getDeals(ownerId);
    return Array.isArray(result) ? result : result.data;
  }

  getDeal(id: string): Promise<(Deal & { contact?: Contact; company?: Company }) | undefined> {
    return crmService.getDeal(id);
  }

  createDeal(deal: InsertDeal): Promise<Deal> {
    return crmService.createDeal(deal);
  }

  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    return crmService.updateDeal(id, deal);
  }

  deleteDeal(id: string): Promise<void> {
    return crmService.deleteDeal(id);
  }

  getPipelineStages(ownerId: string): Promise<PipelineStage[]> {
    return crmService.getPipelineStages(ownerId);
  }

  getActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    return activityService.getActivities(ownerId);
  }

  getActivity(id: string): Promise<Activity | undefined> {
    return activityService.getActivity(id);
  }

  createActivity(activity: InsertActivity): Promise<Activity> {
    return activityService.createActivity(activity);
  }

  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity> {
    return activityService.updateActivity(id, activity);
  }

  deleteActivity(id: string): Promise<void> {
    return activityService.deleteActivity(id);
  }

  getUpcomingActivities(ownerId: string): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    return activityService.getUpcomingActivities(ownerId);
  }

  getCampaigns(ownerId: string): Promise<EmailCampaign[]> {
    return marketingService.getCampaigns(ownerId);
  }

  getCampaign(id: string): Promise<EmailCampaign | undefined> {
    return marketingService.getCampaign(id);
  }

  createCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    return marketingService.createCampaign(campaign);
  }

  updateCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    return marketingService.updateCampaign(id, campaign);
  }

  deleteCampaign(id: string): Promise<void> {
    return marketingService.deleteCampaign(id);
  }

  getCampaignRecipients(campaignId: string): Promise<(CampaignRecipient & { contact: Contact })[]> {
    return marketingService.getCampaignRecipients(campaignId);
  }

  addCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    return marketingService.addCampaignRecipients(recipients);
  }

  getDashboardMetrics(ownerId: string): Promise<DashboardMetrics> {
    return dashboardService.getDashboardMetrics(ownerId);
  }

  getRecentActivities(ownerId: string, limit?: number): Promise<(Activity & { contact?: Contact; deal?: Deal })[]> {
    return activityService.getRecentActivities(ownerId, limit);
  }

  getUserByEmail(email: string): Promise<User | undefined> {
    return authService.getUserByEmail(email);
  }

  createUser(user: Omit<UpsertUser, 'id'>): Promise<User> {
    return authService.createUser(user);
  }

  updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    return authService.updateUserPassword(id, hashedPassword);
  }

  updateUserFailedLogin(id: string, failedCount: number, lockedUntil: Date | null): Promise<void> {
    return authService.updateUserFailedLogin(id, failedCount, lockedUntil);
  }

  createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    return authService.createRefreshToken(token);
  }

  getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    return authService.getRefreshTokenByHash(tokenHash);
  }

  revokeRefreshToken(tokenHash: string): Promise<void> {
    return authService.revokeRefreshToken(tokenHash);
  }

  revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    return authService.revokeAllRefreshTokensForUser(userId);
  }

  cleanupExpiredRefreshTokens(): Promise<void> {
    return authService.cleanupExpiredRefreshTokens();
  }

  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    return authService.createEmailVerificationToken(token);
  }

  getEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | undefined> {
    return authService.getEmailVerificationToken(tokenHash);
  }

  deleteEmailVerificationToken(tokenHash: string): Promise<void> {
    return authService.deleteEmailVerificationToken(tokenHash);
  }

  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    return authService.createPasswordResetToken(token);
  }

  getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined> {
    return authService.getPasswordResetToken(tokenHash);
  }

  deletePasswordResetToken(tokenHash: string): Promise<void> {
    return authService.deletePasswordResetToken(tokenHash);
  }

  createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    return authService.createAuditLog(log);
  }

  getAuditLogs(userId: string, limit?: number): Promise<AuditLog[]> {
    return authService.getAuditLogs(userId, limit);
  }

  getEmailTemplates(ownerId: string): Promise<EmailTemplate[]> {
    return marketingService.getEmailTemplates(ownerId);
  }

  getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return marketingService.getEmailTemplate(id);
  }

  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    return marketingService.createEmailTemplate(template);
  }

  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    return marketingService.updateEmailTemplate(id, template);
  }

  deleteEmailTemplate(id: string): Promise<void> {
    return marketingService.deleteEmailTemplate(id);
  }

  getEmailSequences(ownerId: string): Promise<EmailSequence[]> {
    return marketingService.getEmailSequences(ownerId);
  }

  getEmailSequence(id: string): Promise<EmailSequence | undefined> {
    return marketingService.getEmailSequence(id);
  }

  createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence> {
    return marketingService.createEmailSequence(sequence);
  }

  updateEmailSequence(id: string, sequence: Partial<InsertEmailSequence>): Promise<EmailSequence> {
    return marketingService.updateEmailSequence(id, sequence);
  }

  deleteEmailSequence(id: string): Promise<void> {
    return marketingService.deleteEmailSequence(id);
  }

  getSequenceSteps(sequenceId: string): Promise<EmailSequenceStep[]> {
    return marketingService.getSequenceSteps(sequenceId);
  }

  createSequenceStep(step: InsertEmailSequenceStep): Promise<EmailSequenceStep> {
    return marketingService.createSequenceStep(step);
  }

  updateSequenceStep(id: string, step: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep> {
    return marketingService.updateSequenceStep(id, step);
  }

  deleteSequenceStep(id: string): Promise<void> {
    return marketingService.deleteSequenceStep(id);
  }

  getSequenceEnrollments(sequenceId: string): Promise<(SequenceEnrollment & { contact?: Contact })[]> {
    return marketingService.getSequenceEnrollments(sequenceId);
  }

  createSequenceEnrollment(enrollment: InsertSequenceEnrollment): Promise<SequenceEnrollment> {
    return marketingService.createSequenceEnrollment(enrollment);
  }

  updateSequenceEnrollment(id: string, enrollment: Partial<InsertSequenceEnrollment>): Promise<SequenceEnrollment> {
    return marketingService.updateSequenceEnrollment(id, enrollment);
  }

  getLeadScores(ownerId: string): Promise<(LeadScore & { contact?: Contact })[]> {
    return dashboardService.getLeadScores(ownerId);
  }

  getLeadScore(contactId: string): Promise<LeadScore | undefined> {
    return dashboardService.getLeadScore(contactId);
  }

  createLeadScore(score: InsertLeadScore): Promise<LeadScore> {
    return dashboardService.createLeadScore(score);
  }

  updateLeadScore(contactId: string, score: Partial<InsertLeadScore>): Promise<LeadScore> {
    return dashboardService.updateLeadScore(contactId, score);
  }

  getSalesForecasts(userId: string): Promise<SalesForecast[]> {
    return dashboardService.getSalesForecasts(userId);
  }

  createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast> {
    return dashboardService.createSalesForecast(forecast);
  }

  updateForecastActual(id: string, actualRevenue: number): Promise<SalesForecast> {
    return dashboardService.updateForecastActual(id, actualRevenue);
  }

  getRecommendations(userId: string): Promise<(Recommendation & { contact?: Contact; deal?: Deal })[]> {
    return dashboardService.getRecommendations(userId);
  }

  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    return dashboardService.createRecommendation(recommendation);
  }

  updateRecommendation(id: string, recommendation: Partial<InsertRecommendation>): Promise<Recommendation> {
    return dashboardService.updateRecommendation(id, recommendation);
  }

  deleteRecommendation(id: string): Promise<void> {
    return dashboardService.deleteRecommendation(id);
  }

  getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    return dashboardService.getDashboardWidgets(userId);
  }

  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    return dashboardService.createDashboardWidget(widget);
  }

  updateDashboardWidget(id: string, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget> {
    return dashboardService.updateDashboardWidget(id, widget);
  }

  deleteDashboardWidget(id: string): Promise<void> {
    return dashboardService.deleteDashboardWidget(id);
  }

  getApiKeys(userId: string): Promise<ApiKey[]> {
    return integrationService.getApiKeys(userId);
  }

  createApiKey(key: InsertApiKey): Promise<ApiKey> {
    return integrationService.createApiKey(key);
  }

  updateApiKeyLastUsed(keyPrefix: string): Promise<void> {
    return integrationService.updateApiKeyLastUsed(keyPrefix);
  }

  revokeApiKey(id: string): Promise<void> {
    return integrationService.revokeApiKey(id);
  }

  getCalendarEvents(userId: string): Promise<(CalendarEvent & { contact?: Contact; deal?: Deal })[]> {
    return integrationService.getCalendarEvents(userId);
  }

  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    return integrationService.createCalendarEvent(event);
  }

  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    return integrationService.updateCalendarEvent(id, event);
  }

  deleteCalendarEvent(id: string): Promise<void> {
    return integrationService.deleteCalendarEvent(id);
  }

  getSyncedEmails(userId: string): Promise<(SyncedEmail & { contact?: Contact; deal?: Deal })[]> {
    return integrationService.getSyncedEmails(userId);
  }

  createSyncedEmail(email: InsertSyncedEmail): Promise<SyncedEmail> {
    return integrationService.createSyncedEmail(email);
  }

  getPipelineMetrics(period: string): Promise<PipelineMetric[]> {
    return dashboardService.getPipelineMetrics(period);
  }

  createPipelineMetric(metric: InsertPipelineMetric): Promise<PipelineMetric> {
    return dashboardService.createPipelineMetric(metric);
  }

  getSalesPerformance(userId: string, period?: string): Promise<SalesPerformance[]> {
    return dashboardService.getSalesPerformance(userId, period);
  }

  createSalesPerformance(performance: InsertSalesPerformance): Promise<SalesPerformance> {
    return dashboardService.createSalesPerformance(performance);
  }

  getScheduledExports(userId: string): Promise<ScheduledExport[]> {
    return dashboardService.getScheduledExports(userId);
  }

  createScheduledExport(exportConfig: InsertScheduledExport): Promise<ScheduledExport> {
    return dashboardService.createScheduledExport(exportConfig);
  }

  updateScheduledExport(id: string, exportConfig: Partial<InsertScheduledExport>): Promise<ScheduledExport> {
    return dashboardService.updateScheduledExport(id, exportConfig);
  }

  deleteScheduledExport(id: string): Promise<void> {
    return dashboardService.deleteScheduledExport(id);
  }

  getActiveScheduledExports(): Promise<ScheduledExport[]> {
    return dashboardService.getActiveScheduledExports();
  }

  getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return approvalService.getApprovalWorkflows();
  }

  getApprovalWorkflow(id: string): Promise<ApprovalWorkflow | undefined> {
    return approvalService.getApprovalWorkflow(id);
  }

  createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    return approvalService.createApprovalWorkflow(workflow);
  }

  updateApprovalWorkflow(id: string, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow> {
    return approvalService.updateApprovalWorkflow(id, workflow);
  }

  deleteApprovalWorkflow(id: string): Promise<void> {
    return approvalService.deleteApprovalWorkflow(id);
  }

  getWorkflowSteps(workflowId: string): Promise<(WorkflowStep & { approver?: User })[]> {
    return approvalService.getWorkflowSteps(workflowId);
  }

  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    return approvalService.createWorkflowStep(step);
  }

  deleteWorkflowStep(id: string): Promise<void> {
    return approvalService.deleteWorkflowStep(id);
  }

  getApprovalRequests(userId: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow; requester?: User })[]> {
    return approvalService.getApprovalRequests(userId);
  }

  getApprovalRequest(id: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow }) | undefined> {
    return approvalService.getApprovalRequest(id);
  }

  createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest> {
    return approvalService.createApprovalRequest(request);
  }

  updateApprovalRequest(id: string, request: Partial<InsertApprovalRequest>): Promise<ApprovalRequest> {
    return approvalService.updateApprovalRequest(id, request);
  }

  getApprovalActions(requestId: string): Promise<(ApprovalAction & { approver?: User })[]> {
    return approvalService.getApprovalActions(requestId);
  }

  createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction> {
    return approvalService.createApprovalAction(action);
  }

  processApprovalAction(action: InsertApprovalAction): Promise<{ action: ApprovalAction; request: ApprovalRequest }> {
    return approvalService.processApprovalAction(action);
  }
}

export const storageFacade = new StorageFacade();
