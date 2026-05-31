// =============================================
// Property Share Service
// =============================================

import { createAdminClient } from '@/lib/supabase/server';
import { sendPropertyEmail } from './emailService';
import { sendPropertyMessage } from './messageService';
import type { Property, Lead, MessageChannel } from '@/lib/types';
import { generateShareLink } from '@/lib/utils';

const isDryRun = process.env.DRY_RUN_MODE === 'true';

export interface PropertyShareResult {
  success: boolean;
  channel: MessageChannel | 'email';
  error?: string;
  dry_run?: boolean;
}

export async function shareProperty(
  propertyId: string,
  leadId: string,
  channel: MessageChannel,
  userId: string,
  customMessage?: string
): Promise<PropertyShareResult> {
  const supabase = await createAdminClient();

  // Fetch property and lead
  const [{ data: property }, { data: lead }] = await Promise.all([
    supabase.from('properties').select('*').eq('id', propertyId).single(),
    supabase.from('leads').select('*').eq('id', leadId).single(),
  ]);

  if (!property || !lead) {
    return { success: false, channel, error: 'Property or lead not found' };
  }

  // Ensure share link exists
  if (!property.share_link) {
    const shareLink = generateShareLink(propertyId);
    await supabase
      .from('properties')
      .update({ share_link: shareLink })
      .eq('id', propertyId);
    property.share_link = shareLink;
  }

  let result: PropertyShareResult;

  if (channel === 'email') {
    const emailResult = await sendPropertyEmail({ property, lead, customMessage });
    result = { success: emailResult.success, channel: 'email', error: emailResult.error, dry_run: emailResult.dry_run };
  } else {
    const msgResult = await sendPropertyMessage(property, lead, channel, customMessage);
    result = { success: msgResult.success, channel, error: msgResult.error, dry_run: msgResult.dry_run };
  }

  if (!isDryRun) {
    // Log the message
    await supabase.from('messages').insert({
      organization_id: property.organization_id,
      lead_id: leadId,
      user_id: userId,
      channel,
      direction: 'outbound',
      content: `Property shared: ${property.title}`,
      status: result.success ? 'sent' : 'failed',
      metadata: { property_id: propertyId, custom_message: customMessage },
    });

    // Log activity
    await supabase.from('activities').insert({
      organization_id: property.organization_id,
      lead_id: leadId,
      user_id: userId,
      type: 'message',
      title: `Property "${property.title}" shared via ${channel}`,
      metadata: { property_id: propertyId, channel, success: result.success },
    });
  }

  return result;
}
