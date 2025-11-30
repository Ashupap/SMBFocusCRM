export { authService, AuthService, type IAuthService } from './auth.service';
export { crmService, CrmService, type ICrmService } from './crm.service';
export { activityService, ActivityService, type IActivityService } from './activity.service';
export { marketingService, MarketingService, type IMarketingService } from './marketing.service';
export { approvalService, ApprovalService, type IApprovalService } from './approval.service';
export { dashboardService, DashboardService, type IDashboardService } from './dashboard.service';
export { integrationService, IntegrationService, type IIntegrationService } from './integration.service';

import { authService } from './auth.service';
import { crmService } from './crm.service';
import { activityService } from './activity.service';
import { marketingService } from './marketing.service';
import { approvalService } from './approval.service';
import { dashboardService } from './dashboard.service';
import { integrationService } from './integration.service';

export const services = {
  auth: authService,
  crm: crmService,
  activity: activityService,
  marketing: marketingService,
  approval: approvalService,
  dashboard: dashboardService,
  integration: integrationService,
};
