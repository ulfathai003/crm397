import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, completed_at, snoozed_until } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('follow_ups')
      .update({
        status,
        completed_at,
        snoozed_until,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity if completed
    if (status === 'completed') {
      await supabase.from('activities').insert({
        organization_id: data.organization_id,
        lead_id: data.lead_id,
        user_id: user.id,
        type: 'follow_up',
        title: `Follow-up completed: ${data.title}`,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
