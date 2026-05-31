import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewLeadForm } from '@/components/leads/NewLeadForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Lead' };

export default async function NewLeadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const { data: agents } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('organization_id', profile?.organization_id)
    .in('role', ['sales_agent', 'sales_manager'])
    .eq('is_active', true);

  return (
    <NewLeadForm
      agents={agents ?? []}
      userId={user.id}
      organizationId={profile?.organization_id}
    />
  );
}
