import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { callAgent } from '@/lib/services/callService';
import { z } from 'zod';

const InitiateCallSchema = z.object({
  lead_id: z.string().uuid(),
  dry_run: z.boolean().default(false),
});

/**
 * POST /api/calls/initiate
 * Initiates call automation: Agent → Lead bridge
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { lead_id, dry_run } = InitiateCallSchema.parse(body);

    const adminClient = await createAdminClient();

    // Get lead
    const { data: lead } = await adminClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Get agent (caller)
    const { data: agent } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!agent?.phone) {
      return NextResponse.json({ error: 'Agent phone number not configured' }, { status: 400 });
    }

    // Create call record
    const { data: callRecord } = await adminClient
      .from('calls')
      .insert({
        organization_id: lead.organization_id,
        lead_id,
        agent_id: user.id,
        status: 'pending',
        direction: 'outbound',
        initiated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Trigger Twilio call
    const result = await callAgent({
      lead: lead as any,
      agent: agent as any,
      callId: callRecord?.id ?? '',
    });

    // Update call record
    await adminClient
      .from('calls')
      .update({
        twilio_call_sid: result.callSid,
        status: result.success ? 'initiated' : 'failed',
      })
      .eq('id', callRecord?.id);

    // Log activity
    await adminClient.from('activities').insert({
      organization_id: lead.organization_id,
      lead_id,
      user_id: user.id,
      type: 'call',
      title: result.success
        ? `Call initiated to ${lead.name}`
        : `Call failed for ${lead.name}`,
      metadata: { call_id: callRecord?.id, dry_run: result.dry_run },
    });

    return NextResponse.json({
      success: result.success,
      call_id: callRecord?.id,
      call_sid: result.callSid,
      dry_run: result.dry_run,
      error: result.error,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
