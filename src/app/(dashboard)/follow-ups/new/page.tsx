import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewFollowUpForm } from '@/components/follow-ups/NewFollowUpForm';

export default async function NewFollowUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Follow-Up</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Set a reminder for lead engagement</p>
      </div>
      <NewFollowUpForm organizationId={profile?.organization_id} currentUserId={user.id} />
    </div>
  );
}
