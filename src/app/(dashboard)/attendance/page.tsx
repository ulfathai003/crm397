import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Attendance' };

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role, full_name')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  const today = new Date().toISOString().split('T')[0];

  // Today's attendance for current user
  const { data: myAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // Team attendance (admin/manager view)
  const { data: teamAttendance } = await supabase
    .from('attendance')
    .select('*, user:users(full_name, role)')
    .eq('organization_id', orgId)
    .eq('date', today)
    .order('check_in_time', { ascending: false });

  // All users
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  return (
    <AttendanceClient
      userId={user.id}
      organizationId={orgId}
      role={profile?.role ?? 'sales_agent'}
      userName={profile?.full_name ?? 'User'}
      myAttendance={myAttendance}
      teamAttendance={teamAttendance ?? []}
      allUsers={allUsers ?? []}
    />
  );
}
