import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import twiml from 'twilio/lib/twiml/VoiceResponse';

/**
 * GET /api/twilio/agent-connect
 * TwiML response for agent leg - asks agent to press 1 to accept call
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');
  const leadId = searchParams.get('leadId');

  const VoiceResponse = twiml;
  const response = new VoiceResponse();

  const gather = response.gather({
    numDigits: '1',
    action: `/api/twilio/agent-accept?callId=${callId}&leadId=${leadId}`,
    method: 'POST',
    timeout: 15,
  });

  gather.say(
    { voice: 'alice' },
    'You have a new lead on the line. Press 1 to connect to the lead, or press 2 to decline.'
  );

  response.say({ voice: 'alice' }, 'No input received. The call will be marked as pending.');

  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * POST /api/twilio/agent-accept
 * Handles agent digit press, bridges to lead
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');
  const leadId = searchParams.get('leadId');

  const body = await request.formData();
  const digit = body.get('Digits');

  const VoiceResponse = twiml;
  const response = new VoiceResponse();

  if (digit === '1' && leadId) {
    const supabase = await createAdminClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('phone, name')
      .eq('id', leadId)
      .single();

    if (lead) {
      // Update call status
      await supabase.from('calls').update({ status: 'in_progress', answered_at: new Date().toISOString() }).eq('id', callId);

      response.say({ voice: 'alice' }, `Connecting you to ${lead.name}. Please hold.`);
      const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
      dial.number(lead.phone);
    } else {
      response.say({ voice: 'alice' }, 'Lead not found. Goodbye.');
    }
  } else {
    // Agent declined
    const supabase = await createAdminClient();
    await supabase.from('calls').update({ status: 'no_answer', ended_at: new Date().toISOString() }).eq('id', callId);
    response.say({ voice: 'alice' }, 'You have declined the call. Goodbye.');
    response.hangup();
  }

  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
