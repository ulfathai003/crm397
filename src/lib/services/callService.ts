// =============================================
// Call Service - Twilio Voice Automation
// =============================================

import twilio from 'twilio';
import type { Call, User, Lead } from '@/lib/types';

const isDryRun = process.env.DRY_RUN_MODE === 'true';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
}

export interface CallAgentPayload {
  lead: Lead;
  agent: User;
  callId: string;
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  status?: string;
  error?: string;
  dry_run?: boolean;
}

/**
 * Step 1: Call the agent first to get their consent
 */
export async function callAgent(payload: CallAgentPayload): Promise<CallResult> {
  console.log(`[CallService] Calling agent ${payload.agent.full_name} for lead ${payload.lead.name}`);

  if (isDryRun) {
    console.log('[CallService] DRY RUN - Skipping actual Twilio call');
    return {
      success: true,
      callSid: `dry-run-agent-${Date.now()}`,
      status: 'ringing',
      dry_run: true,
    };
  }

  try {
    const client = getTwilioClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: payload.agent.phone!,
      url: `${appUrl}/api/twilio/agent-connect?callId=${payload.callId}&leadId=${payload.lead.id}`,
      statusCallback: `${appUrl}/api/twilio/status?callId=${payload.callId}`,
      statusCallbackMethod: 'POST',
      timeout: parseInt(process.env.CALL_TIMEOUT_SECONDS || '30'),
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error('[CallService] Agent call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Step 2: Bridge call to lead after agent accepts
 */
export async function bridgeToLead(callId: string, leadPhone: string): Promise<CallResult> {
  if (isDryRun) {
    return {
      success: true,
      callSid: `dry-run-bridge-${Date.now()}`,
      status: 'in-progress',
      dry_run: true,
    };
  }

  try {
    const client = getTwilioClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: leadPhone,
      url: `${appUrl}/api/twilio/lead-connect?callId=${callId}`,
      statusCallback: `${appUrl}/api/twilio/status?callId=${callId}&leg=lead`,
      statusCallbackMethod: 'POST',
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch call recordings
 */
export async function getCallRecording(callSid: string): Promise<string | null> {
  if (isDryRun) return null;

  try {
    const client = getTwilioClient();
    const recordings = await client.recordings.list({ callSid, limit: 1 });
    
    if (recordings.length > 0) {
      return `https://api.twilio.com${recordings[0].uri.replace('.json', '.mp3')}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Send SMS
 */
export async function sendSMS(to: string, body: string): Promise<CallResult> {
  if (isDryRun) {
    console.log(`[SMS DRY RUN] To: ${to}, Body: ${body}`);
    return { success: true, dry_run: true };
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });
    return { success: true, callSid: message.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(to: string, body: string): Promise<CallResult> {
  if (isDryRun) {
    console.log(`[WhatsApp DRY RUN] To: ${to}, Body: ${body}`);
    return { success: true, dry_run: true };
  }

  try {
    const client = getTwilioClient();
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const message = await client.messages.create({
      from: whatsappFrom,
      to: whatsappTo,
      body,
    });
    return { success: true, callSid: message.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
