// =============================================
// Message Service - WhatsApp & SMS
// =============================================

import { sendSMS, sendWhatsApp } from './callService';
import type { Property, Lead, MessageChannel } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dry_run?: boolean;
}

export async function sendPropertyMessage(
  property: Property,
  lead: Lead,
  channel: MessageChannel,
  customMessage?: string
): Promise<MessageResult> {
  const body = generatePropertyMessage(property, customMessage);
  const phone = formatPhoneForChannel(lead.phone, channel);

  if (channel === 'whatsapp') {
    const result = await sendWhatsApp(phone, body);
    return { success: result.success, messageId: result.callSid, error: result.error, dry_run: result.dry_run };
  } else if (channel === 'sms') {
    const result = await sendSMS(phone, body);
    return { success: result.success, messageId: result.callSid, error: result.error, dry_run: result.dry_run };
  }

  return { success: false, error: 'Unsupported channel' };
}

export async function sendFollowUpMessage(
  to: string,
  channel: MessageChannel,
  content: string
): Promise<MessageResult> {
  const phone = formatPhoneForChannel(to, channel);

  if (channel === 'whatsapp') {
    const result = await sendWhatsApp(phone, content);
    return { success: result.success, messageId: result.callSid, error: result.error, dry_run: result.dry_run };
  } else if (channel === 'sms') {
    const result = await sendSMS(phone, content);
    return { success: result.success, messageId: result.callSid, error: result.error, dry_run: result.dry_run };
  }

  return { success: false, error: 'Unsupported channel' };
}

function formatPhoneForChannel(phone: string, channel: MessageChannel): string {
  const cleaned = phone.replace(/\D/g, '');
  const withCountryCode = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
  return withCountryCode;
}

function generatePropertyMessage(property: Property, customMessage?: string): string {
  const lines = [
    `🏠 *${property.title}*`,
    `📍 ${property.location}`,
    `💰 ${formatCurrency(property.price)}`,
    `🏗️ Type: ${property.type}`,
  ];

  if (property.bedrooms) lines.push(`🛏️ ${property.bedrooms} BHK`);
  if (property.size) lines.push(`📐 ${property.size} ${property.size_unit || 'sqft'}`);
  if (property.status === 'available') lines.push(`✅ Available Now`);

  if (customMessage) {
    lines.push('', customMessage);
  }

  if (property.share_link) {
    lines.push('', `🔗 View Details: ${property.share_link}`);
  }

  lines.push('', `_Sent via EstateFlow CRM_`);

  return lines.join('\n');
}

export const MESSAGE_TEMPLATES = {
  initial_contact: (name: string) =>
    `Hi ${name}! 👋 Thanks for your interest in our properties. I'm your dedicated real estate consultant. How can I help you find your dream home today?`,
  
  follow_up: (name: string, days: number) =>
    `Hi ${name}! Just checking in after ${days} day${days > 1 ? 's' : ''}. Have you had a chance to consider the properties we discussed? I'd love to help answer any questions. 😊`,
  
  site_visit: (name: string, date: string, location: string) =>
    `Hi ${name}! Your site visit is confirmed for ${date} at ${location}. Please bring your ID proof. Looking forward to meeting you! 🏠`,
  
  document_request: (name: string) =>
    `Hi ${name}! To proceed with your application, we'll need: 1. Aadhaar Card, 2. PAN Card, 3. Bank Statement (3 months), 4. Income Proof. Please WhatsApp the documents at your earliest convenience.`,
  
  congratulations: (name: string, property: string) =>
    `🎉 Congratulations ${name}! Your booking for ${property} has been confirmed. Welcome to your new home! Our team will be in touch with next steps.`,
};
