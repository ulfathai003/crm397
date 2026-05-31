import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewSocialPostForm } from '@/components/social/NewSocialPostForm';

export default async function NewSocialPostPage() {
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
        <h1 className="text-2xl font-bold">Create Social Post</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Plan your social presence</p>
      </div>
      <NewSocialPostForm organizationId={profile?.organization_id} userId={user.id} />
    </div>
  );
}
