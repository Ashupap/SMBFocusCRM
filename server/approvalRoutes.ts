import { Router } from 'express';
import { approvalService } from './services/approval.service';
import { authenticateToken, requireManager, requireAdmin } from './authMiddleware';
import { createInsertSchema } from 'drizzle-zod';
import { approvalWorkflows, workflowSteps, approvalRequests, approvalActions } from '@shared/schema';

const router = Router();

const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
});

const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  requesterId: true,
});

const insertApprovalActionSchema = createInsertSchema(approvalActions).omit({
  id: true,
  createdAt: true,
  approverId: true,
});

// Approval Workflow Routes
router.get('/api/approval-workflows', authenticateToken, async (req, res) => {
  try {
    const workflows = await approvalService.getApprovalWorkflows();
    res.json(workflows);
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch workflows' });
  }
});

router.get('/api/approval-workflows/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await approvalService.getApprovalWorkflow(id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const steps = await approvalService.getWorkflowSteps(id);
    res.json({ ...workflow, steps });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch workflow' });
  }
});

router.post('/api/approval-workflows', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validated = insertApprovalWorkflowSchema.parse(req.body);
    const workflow = await approvalService.createApprovalWorkflow(validated);
    res.json(workflow);
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to create workflow' });
  }
});

router.patch('/api/approval-workflows/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await approvalService.updateApprovalWorkflow(id, req.body);
    res.json(workflow);
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to update workflow' });
  }
});

router.delete('/api/approval-workflows/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await approvalService.deleteApprovalWorkflow(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to delete workflow' });
  }
});

// Workflow Step Routes
router.post('/api/workflow-steps', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validated = insertWorkflowStepSchema.parse(req.body);
    const step = await approvalService.createWorkflowStep(validated);
    res.json(step);
  } catch (error: any) {
    console.error('Error creating step:', error);
    res.status(500).json({ error: error.message || 'Failed to create step' });
  }
});

router.delete('/api/workflow-steps/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await approvalService.deleteWorkflowStep(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting step:', error);
    res.status(500).json({ error: error.message || 'Failed to delete step' });
  }
});

// Approval Request Routes
router.get('/api/approval-requests', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const requests = await approvalService.getApprovalRequests(userId);
    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch requests' });
  }
});

router.get('/api/approval-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await approvalService.getApprovalRequest(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const actions = await approvalService.getApprovalActions(id);
    res.json({ ...request, actions });
  } catch (error: any) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch request' });
  }
});

router.post('/api/approval-requests', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validated = insertApprovalRequestSchema.parse(req.body);
    
    const request = await approvalService.createApprovalRequest({
      ...validated,
      requesterId: userId,
    });
    
    res.json(request);
  } catch (error: any) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: error.message || 'Failed to create request' });
  }
});

router.patch('/api/approval-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await approvalService.updateApprovalRequest(id, req.body);
    res.json(request);
  } catch (error: any) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: error.message || 'Failed to update request' });
  }
});

// Approval Action Routes - Using transactional processing for data integrity
router.post('/api/approval-actions', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validated = insertApprovalActionSchema.parse(req.body);
    
    // Use transactional method to ensure atomic operations
    const result = await approvalService.processApprovalAction({
      ...validated,
      approverId: userId,
    });
    
    res.json(result.action);
  } catch (error: any) {
    console.error('Error creating action:', error);
    res.status(500).json({ error: error.message || 'Failed to create action' });
  }
});

export default router;
