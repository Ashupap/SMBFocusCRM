import {
  approvalWorkflows,
  workflowSteps,
  approvalRequests,
  approvalActions,
  users,
  type ApprovalWorkflow,
  type InsertApprovalWorkflow,
  type WorkflowStep,
  type InsertWorkflowStep,
  type ApprovalRequest,
  type InsertApprovalRequest,
  type ApprovalAction,
  type InsertApprovalAction,
  type User,
} from "@shared/schema";
import { db, eq, desc, asc } from "./shared/data-access";

export interface IApprovalService {
  getApprovalWorkflows(): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflow(id: string): Promise<ApprovalWorkflow | undefined>;
  createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow>;
  updateApprovalWorkflow(id: string, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow>;
  deleteApprovalWorkflow(id: string): Promise<void>;
  getWorkflowSteps(workflowId: string): Promise<(WorkflowStep & { approver?: User })[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  deleteWorkflowStep(id: string): Promise<void>;

  getApprovalRequests(userId: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow; requester?: User })[]>;
  getApprovalRequest(id: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow }) | undefined>;
  createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest>;
  updateApprovalRequest(id: string, request: Partial<InsertApprovalRequest>): Promise<ApprovalRequest>;
  getApprovalActions(requestId: string): Promise<(ApprovalAction & { approver?: User })[]>;
  createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction>;
  processApprovalAction(action: InsertApprovalAction): Promise<{ action: ApprovalAction; request: ApprovalRequest }>;
}

export class ApprovalService implements IApprovalService {
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return await db
      .select()
      .from(approvalWorkflows)
      .orderBy(approvalWorkflows.name);
  }

  async getApprovalWorkflow(id: string): Promise<ApprovalWorkflow | undefined> {
    const [workflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id));
    return workflow;
  }

  async createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    const [newWorkflow] = await db
      .insert(approvalWorkflows)
      .values(workflow)
      .returning();
    return newWorkflow;
  }

  async updateApprovalWorkflow(id: string, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow> {
    const [updated] = await db
      .update(approvalWorkflows)
      .set(workflow)
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return updated;
  }

  async deleteApprovalWorkflow(id: string): Promise<void> {
    await db.delete(approvalWorkflows).where(eq(approvalWorkflows.id, id));
  }

  async getWorkflowSteps(workflowId: string): Promise<(WorkflowStep & { approver?: User })[]> {
    const result = await db
      .select({
        step: workflowSteps,
        approver: users,
      })
      .from(workflowSteps)
      .leftJoin(users, eq(workflowSteps.approverId, users.id))
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(asc(workflowSteps.stepOrder));
    
    return result.map(row => ({
      ...row.step,
      approver: row.approver || undefined,
    }));
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const [newStep] = await db
      .insert(workflowSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async deleteWorkflowStep(id: string): Promise<void> {
    await db.delete(workflowSteps).where(eq(workflowSteps.id, id));
  }

  async getApprovalRequests(userId: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow; requester?: User })[]> {
    const result = await db
      .select({
        request: approvalRequests,
        workflow: approvalWorkflows,
        requester: users,
      })
      .from(approvalRequests)
      .leftJoin(approvalWorkflows, eq(approvalRequests.workflowId, approvalWorkflows.id))
      .leftJoin(users, eq(approvalRequests.requesterId, users.id))
      .where(eq(approvalRequests.requesterId, userId))
      .orderBy(desc(approvalRequests.createdAt));
    
    return result.map(row => ({
      ...row.request,
      workflow: row.workflow || undefined,
      requester: row.requester || undefined,
    }));
  }

  async getApprovalRequest(id: string): Promise<(ApprovalRequest & { workflow?: ApprovalWorkflow }) | undefined> {
    const result = await db
      .select({
        request: approvalRequests,
        workflow: approvalWorkflows,
      })
      .from(approvalRequests)
      .leftJoin(approvalWorkflows, eq(approvalRequests.workflowId, approvalWorkflows.id))
      .where(eq(approvalRequests.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].request,
      workflow: result[0].workflow || undefined,
    };
  }

  async createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest> {
    const [newRequest] = await db
      .insert(approvalRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateApprovalRequest(id: string, request: Partial<InsertApprovalRequest>): Promise<ApprovalRequest> {
    const [updated] = await db
      .update(approvalRequests)
      .set(request)
      .where(eq(approvalRequests.id, id))
      .returning();
    return updated;
  }

  async getApprovalActions(requestId: string): Promise<(ApprovalAction & { approver?: User })[]> {
    const result = await db
      .select({
        action: approvalActions,
        approver: users,
      })
      .from(approvalActions)
      .leftJoin(users, eq(approvalActions.approverId, users.id))
      .where(eq(approvalActions.requestId, requestId))
      .orderBy(desc(approvalActions.createdAt));
    
    return result.map(row => ({
      ...row.action,
      approver: row.approver || undefined,
    }));
  }

  async createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction> {
    const [newAction] = await db
      .insert(approvalActions)
      .values(action)
      .returning();
    return newAction;
  }

  async processApprovalAction(action: InsertApprovalAction): Promise<{ action: ApprovalAction; request: ApprovalRequest }> {
    return await db.transaction(async (tx) => {
      const [newAction] = await tx
        .insert(approvalActions)
        .values(action)
        .returning();

      const [request] = await tx
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, action.requestId));

      if (!request) {
        throw new Error('Approval request not found');
      }

      let updatedRequest: ApprovalRequest;

      if (action.action === 'rejected') {
        const [updated] = await tx
          .update(approvalRequests)
          .set({
            status: 'rejected',
            completedAt: new Date(),
          })
          .where(eq(approvalRequests.id, action.requestId))
          .returning();
        updatedRequest = updated;
      } else if (action.action === 'approved') {
        const steps = await tx
          .select()
          .from(workflowSteps)
          .where(eq(workflowSteps.workflowId, request.workflowId))
          .orderBy(asc(workflowSteps.stepOrder));

        const currentStep = steps.find(s => s.id === action.stepId);
        const currentStepOrder = currentStep?.stepOrder || 0;
        const maxStepOrder = Math.max(...steps.map(s => s.stepOrder));

        if (currentStepOrder >= maxStepOrder) {
          const [updated] = await tx
            .update(approvalRequests)
            .set({
              status: 'approved',
              completedAt: new Date(),
            })
            .where(eq(approvalRequests.id, action.requestId))
            .returning();
          updatedRequest = updated;
        } else {
          const nextStep = steps.find(s => s.stepOrder === currentStepOrder + 1);
          if (nextStep) {
            const [updated] = await tx
              .update(approvalRequests)
              .set({
                currentStepId: nextStep.id,
              })
              .where(eq(approvalRequests.id, action.requestId))
              .returning();
            updatedRequest = updated;
          } else {
            updatedRequest = request;
          }
        }
      } else {
        updatedRequest = request;
      }

      return { action: newAction, request: updatedRequest };
    });
  }
}

export const approvalService = new ApprovalService();
