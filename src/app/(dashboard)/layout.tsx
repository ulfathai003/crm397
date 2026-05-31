import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <AppShell user={profile ?? { full_name: user.email ?? 'User', role: 'sales_agent' }}>
      {children}
    </AppShell>
  );
}
