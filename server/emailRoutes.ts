import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken, requireManager, requireAdmin } from './authMiddleware';
import { createInsertSchema } from 'drizzle-zod';
import { emailTemplates, emailSequences, emailSequenceSteps } from '@shared/schema';

const router = Router();

const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
});

const insertEmailSequenceSchema = createInsertSchema(emailSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
});

const insertSequenceStepSchema = createInsertSchema(emailSequenceSteps).omit({
  id: true,
  createdAt: true,
});

// Email Template Routes
router.get('/api/email-templates', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const templates = await storage.getEmailTemplates(userId);
    res.json(templates);
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch templates' });
  }
});

router.get('/api/email-templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await storage.getEmailTemplate(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch template' });
  }
});

router.post('/api/email-templates', authenticateToken, requireManager, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validated = insertEmailTemplateSchema.parse(req.body);

    const template = await storage.createEmailTemplate({
      ...validated,
      ownerId: userId,
    });

    res.json(template);
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message || 'Failed to create template' });
  }
});

router.patch('/api/email-templates/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await storage.updateEmailTemplate(id, updates);
    res.json(template);
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message || 'Failed to update template' });
  }
});

router.delete('/api/email-templates/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteEmailTemplate(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message || 'Failed to delete template' });
  }
});

// Email Sequence Routes
router.get('/api/email-sequences', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const sequences = await storage.getEmailSequences(userId);
    res.json(sequences);
  } catch (error: any) {
    console.error('Error fetching sequences:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sequences' });
  }
});

router.get('/api/email-sequences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = await storage.getEmailSequence(id);
    
    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const steps = await storage.getSequenceSteps(id);
    res.json({ ...sequence, steps });
  } catch (error: any) {
    console.error('Error fetching sequence:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sequence' });
  }
});

router.post('/api/email-sequences', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validated = insertEmailSequenceSchema.parse(req.body);

    const sequence = await storage.createEmailSequence({
      ...validated,
      ownerId: userId,
    });

    res.json(sequence);
  } catch (error: any) {
    console.error('Error creating sequence:', error);
    res.status(500).json({ error: error.message || 'Failed to create sequence' });
  }
});

router.patch('/api/email-sequences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sequence = await storage.updateEmailSequence(id, updates);
    res.json(sequence);
  } catch (error: any) {
    console.error('Error updating sequence:', error);
    res.status(500).json({ error: error.message || 'Failed to update sequence' });
  }
});

router.delete('/api/email-sequences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteEmailSequence(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sequence:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sequence' });
  }
});

// Sequence Step Routes
router.get('/api/email-sequences/:sequenceId/steps', authenticateToken, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const steps = await storage.getSequenceSteps(sequenceId);
    res.json(steps);
  } catch (error: any) {
    console.error('Error fetching steps:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch steps' });
  }
});

router.post('/api/email-sequences/:sequenceId/steps', authenticateToken, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const validated = insertSequenceStepSchema.parse({
      ...req.body,
      sequenceId,
    });

    const step = await storage.createSequenceStep(validated);
    res.json(step);
  } catch (error: any) {
    console.error('Error creating step:', error);
    res.status(500).json({ error: error.message || 'Failed to create step' });
  }
});

router.patch('/api/sequence-steps/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const step = await storage.updateSequenceStep(id, updates);
    res.json(step);
  } catch (error: any) {
    console.error('Error updating step:', error);
    res.status(500).json({ error: error.message || 'Failed to update step' });
  }
});

router.delete('/api/sequence-steps/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteSequenceStep(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting step:', error);
    res.status(500).json({ error: error.message || 'Failed to delete step' });
  }
});

// Sequence Enrollment Routes
router.get('/api/email-sequences/:sequenceId/enrollments', authenticateToken, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const enrollments = await storage.getSequenceEnrollments(sequenceId);
    res.json(enrollments);
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch enrollments' });
  }
});

router.post('/api/email-sequences/:sequenceId/enroll', authenticateToken, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    const enrollment = await storage.createSequenceEnrollment({
      sequenceId,
      contactId,
      status: 'active',
    });

    res.json(enrollment);
  } catch (error: any) {
    console.error('Error enrolling contact:', error);
    res.status(500).json({ error: error.message || 'Failed to enroll contact' });
  }
});

router.patch('/api/sequence-enrollments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const enrollment = await storage.updateSequenceEnrollment(id, updates);
    res.json(enrollment);
  } catch (error: any) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: error.message || 'Failed to update enrollment' });
  }
});

export default router;
