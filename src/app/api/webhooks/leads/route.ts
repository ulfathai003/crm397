import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { autoAssignLead } from '@/lib/services/leadAssignmentService';
import { callAgent } from '@/lib/services/callService';
import { z } from 'zod';

const LeadWebhookSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().default('website'),
  property_type: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  location_preference: z.string().optional(),
  notes: z.string().optional(),
  organization_id: z.string().uuid(),
  dry_run: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = LeadWebhookSchema.parse(body);

    if (data.dry_run) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        message: 'Dry run successful - lead would be created',
        data,
      });
    }

    const supabase = await createAdminClient();

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: data.organization_id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
        property_type: data.property_type,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        location_preference: data.location_preference,
        notes: data.notes,
        status: 'new',
        temperature: 'warm',
        created_by: '00000000-0000-0000-0000-000000000000', // system
      })
      .select('*')
      .single();

    if (leadError) throw leadError;

    // Auto-assign agent
    const assignment = await autoAssignLead(data.organization_id, lead.id);

    // Log intake activity
    await supabase.from('activities').insert({
      organization_id: data.organization_id,
      lead_id: lead.id,
      user_id: assignment.agent?.id ?? '00000000-0000-0000-0000-000000000000',
      type: 'note',
      title: `Lead received via webhook from ${data.source}`,
      metadata: { source: data.source, auto_assigned: !!assignment.agent },
    });

    // Trigger call automation if agent assigned
    let callResult = null;
    if (assignment.agent?.phone) {
      const { data: callRecord } = await supabase
        .from('calls')
        .insert({
          organization_id: data.organization_id,
          lead_id: lead.id,
          agent_id: assignment.agent.id,
          status: 'pending',
          direction: 'outbound',
        })
        .select('id')
        .single();

      callResult = await callAgent({
        lead: lead as any,
        agent: assignment.agent,
        callId: callRecord?.id ?? '',
      });

      if (callRecord) {
        await supabase
          .from('calls')
          .update({ 
            twilio_call_sid: callResult.callSid,
            status: callResult.success ? 'initiated' : 'failed',
          })
          .eq('id', callRecord.id);
      }
    }

    // Create notification for manager
    await supabase.from('notifications').insert({
      organization_id: data.organization_id,
      user_id: assignment.agent?.id ?? '00000000-0000-0000-0000-000000000000',
      title: 'New Lead Received',
      body: `${data.name} - ${data.phone} from ${data.source}`,
      type: 'lead',
      metadata: { lead_id: lead.id },
    });

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      assigned_to: assignment.agent?.full_name,
      call_initiated: callResult?.success ?? false,
    }, { status: 201 });

  } catch (error) {
    console.error('[Webhook] Lead intake error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
