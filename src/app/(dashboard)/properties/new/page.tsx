import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewPropertyForm } from '@/components/properties/NewPropertyForm';

export default async function NewPropertyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'sales_manager') {
    redirect('/properties');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Property</h1>
        <p className="text-muted-foreground text-sm mt-0.5">List a new inventory item</p>
      </div>
      <NewPropertyForm organizationId={profile.organization_id} userId={user.id} />
    </div>
  );
}
