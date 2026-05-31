// =============================================
// Email Service - Resend
// =============================================

import { Resend } from 'resend';
import type { Property, Lead } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const isDryRun = process.env.DRY_RUN_MODE === 'true';
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dry_run?: boolean;
}

export interface PropertyEmailPayload {
  property: Property;
  lead: Lead;
  customMessage?: string;
}

export async function sendPropertyEmail(payload: PropertyEmailPayload): Promise<EmailResult> {
  if (!payload.lead.email) {
    return { success: false, error: 'No email address for lead' };
  }

  const subject = `🏠 Property Match: ${payload.property.title}`;
  const htmlBody = generatePropertyEmailHTML(payload.property, payload.customMessage);

  if (isDryRun) {
    console.log(`[Email DRY RUN] To: ${payload.lead.email}, Subject: ${subject}`);
    return { success: true, dry_run: true };
  }

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@estateflow.com',
      to: payload.lead.email,
      subject,
      html: htmlBody,
    });

    if (error) throw new Error(error.message);
    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}

export async function sendFollowUpEmail(
  to: string,
  leadName: string,
  content: string
): Promise<EmailResult> {
  if (isDryRun) {
    console.log(`[Email DRY RUN] Follow-up to: ${to}`);
    return { success: true, dry_run: true };
  }

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@estateflow.com',
      to,
      subject: `Following up - ${leadName}`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${content}</div>`,
    });

    if (error) throw new Error(error.message);
    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}

function generatePropertyEmailHTML(property: Property, customMessage?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a5f, #2d6a4f); padding: 30px; color: white; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; }
    .property-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin: 20px 0; }
    .property-image { width: 100%; height: 200px; object-fit: cover; }
    .property-info { padding: 20px; }
    .price { font-size: 28px; font-weight: bold; color: #1e3a5f; }
    .detail { display: inline-block; background: #f0f4f8; padding: 4px 10px; border-radius: 4px; margin: 4px; font-size: 13px; }
    .cta { display: block; background: #2d6a4f; color: white; text-align: center; padding: 16px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-size: 16px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 EstateFlow</h1>
      <p>We found a property that matches your requirements</p>
    </div>
    <div class="body">
      ${customMessage ? `<p style="background:#e8f5e9;padding:16px;border-radius:8px;border-left:4px solid #2d6a4f;">${customMessage}</p>` : ''}
      <div class="property-card">
        ${property.images.length > 0 ? `<img src="${property.images[0]}" alt="${property.title}" class="property-image">` : ''}
        <div class="property-info">
          <h2 style="margin:0 0 8px 0;">${property.title}</h2>
          <p style="color:#666;margin:0 0 16px 0;">📍 ${property.location}</p>
          <div class="price">${formatCurrency(property.price)}</div>
          <div style="margin: 16px 0;">
            ${property.bedrooms ? `<span class="detail">🛏️ ${property.bedrooms} BHK</span>` : ''}
            ${property.bathrooms ? `<span class="detail">🚿 ${property.bathrooms} Bath</span>` : ''}
            ${property.size ? `<span class="detail">📐 ${property.size} ${property.size_unit || 'sqft'}</span>` : ''}
            <span class="detail">🏠 ${property.type}</span>
          </div>
          ${property.description ? `<p style="color:#555;margin:16px 0 0 0;">${property.description}</p>` : ''}
        </div>
      </div>
      <a href="${property.share_link || '#'}" class="cta">View Full Property Details</a>
    </div>
    <div class="footer">
      <p>EstateFlow CRM | You received this because of your property inquiry</p>
      <p style="margin:4px 0;">To unsubscribe, reply with STOP</p>
    </div>
  </div>
</body>
</html>`;
}
