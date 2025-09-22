import { MailService } from '@sendgrid/mail';
import { storage } from './storage';

const mailService = new MailService();

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY_ENV_VAR || "SG.dummy_key_for_testing";
mailService.setApiKey(SENDGRID_API_KEY);

// Disable SendGrid if no real key is provided
const isEmailEnabled = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.');

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!isEmailEnabled) {
    console.log('Email sending disabled - no SendGrid API key configured');
    console.log('Would send email:', { to: params.to, from: params.from, subject: params.subject });
    return true; // Simulate success for testing
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendEmailCampaign(campaignId: string, contactIds: string[]) {
  try {
    // Get campaign details
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get contacts
    const contacts = await Promise.all(
      contactIds.map(id => storage.getContact(id))
    );

    const validContacts = contacts.filter(contact => contact && contact.email);

    if (validContacts.length === 0) {
      throw new Error('No valid contacts with email addresses found');
    }

    // Create campaign recipients
    const recipients = validContacts.map(contact => ({
      campaignId,
      contactId: contact!.id,
      status: 'pending' as const,
    }));

    await storage.addCampaignRecipients(recipients);

    // Send emails
    let successCount = 0;
    let failureCount = 0;

    for (const contact of validContacts) {
      if (!contact || !contact.email) continue;

      const emailSuccess = await sendEmail({
        to: contact.email,
        from: campaign.fromEmail,
        subject: campaign.subject,
        html: campaign.content,
      });

      if (emailSuccess) {
        successCount++;
        // Update recipient status to sent
        // In a real implementation, you'd update the campaign_recipients table
      } else {
        failureCount++;
      }
    }

    // Update campaign statistics
    await storage.updateCampaign(campaignId, {
      sentAt: new Date(),
      totalSent: successCount,
    });

    return {
      success: true,
      successCount,
      failureCount,
      totalSent: successCount,
    };

  } catch (error) {
    console.error('Error sending email campaign:', error);
    throw error;
  }
}
