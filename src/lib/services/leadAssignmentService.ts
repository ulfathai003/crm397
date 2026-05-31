// =============================================
// Lead Assignment Service
// =============================================

import { createAdminClient } from '@/lib/supabase/server';
import type { User, Lead } from '@/lib/types';

export interface AssignmentResult {
  success: boolean;
  agent?: User;
  error?: string;
}

/**
 * Round-robin lead assignment to active sales agents
 */
export async function autoAssignLead(
  organizationId: string,
  leadId: string
): Promise<AssignmentResult> {
  try {
    const supabase = await createAdminClient();

    // Get all active sales agents in the organization
    const { data: agents, error: agentsError } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('role', 'sales_agent')
      .eq('is_active', true);

    if (agentsError || !agents || agents.length === 0) {
      return { success: false, error: 'No available agents' };
    }

    // Count current assignments for each agent (round-robin)
    const { data: assignments } = await supabase
      .from('leads')
      .select('assigned_to')
      .eq('organization_id', organizationId)
      .eq('status', 'new')
      .not('assigned_to', 'is', null);

    const assignmentCounts: Record<string, number> = {};
    agents.forEach(a => { assignmentCounts[a.id] = 0; });
    assignments?.forEach(a => {
      if (a.assigned_to && assignmentCounts[a.assigned_to] !== undefined) {
        assignmentCounts[a.assigned_to]++;
      }
    });

    // Pick agent with fewest assignments
    const selectedAgent = agents.reduce((prev, curr) =>
      (assignmentCounts[curr.id] || 0) < (assignmentCounts[prev.id] || 0) ? curr : prev
    );

    // Update lead assignment
    const { error: updateError } = await supabase
      .from('leads')
      .update({ assigned_to: selectedAgent.id, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activities').insert({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: selectedAgent.id,
      type: 'assignment',
      title: `Lead auto-assigned to ${selectedAgent.full_name}`,
      metadata: { agent_id: selectedAgent.id, method: 'round_robin' },
    });

    return { success: true, agent: selectedAgent as User };
  } catch (error) {
    console.error('[LeadAssignment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed',
    };
  }
}

/**
 * Manual lead assignment
 */
export async function assignLeadToAgent(
  leadId: string,
  agentId: string,
  assignedBy: string,
  organizationId: string
): Promise<AssignmentResult> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: agentId, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    const { data: agent } = await supabase
      .from('users')
      .select('*')
      .eq('id', agentId)
      .single();

    await supabase.from('activities').insert({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: assignedBy,
      type: 'assignment',
      title: `Lead assigned to ${agent?.full_name}`,
      metadata: { agent_id: agentId, assigned_by: assignedBy },
    });

    return { success: true, agent: agent as User };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed',
    };
  }
}
