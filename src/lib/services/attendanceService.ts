// =============================================
// Attendance Service
// =============================================

import { createAdminClient } from '@/lib/supabase/server';

const isDryRun = process.env.DRY_RUN_MODE === 'true';

export interface CheckInPayload {
  userId: string;
  organizationId: string;
  lat?: number;
  lng?: number;
  selfieUrl?: string;
  notes?: string;
}

export interface AttendanceResult {
  success: boolean;
  attendanceId?: string;
  error?: string;
  dry_run?: boolean;
}

export async function checkIn(payload: CheckInPayload): Promise<AttendanceResult> {
  const today = new Date().toISOString().split('T')[0];

  if (isDryRun) {
    console.log(`[Attendance DRY RUN] Check-in for user ${payload.userId}`);
    return { success: true, dry_run: true };
  }

  const supabase = await createAdminClient();

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('attendance')
    .select('id, check_in_time')
    .eq('user_id', payload.userId)
    .eq('date', today)
    .single();

  if (existing?.check_in_time) {
    return { success: false, error: 'Already checked in today' };
  }

  const checkInData = {
    organization_id: payload.organizationId,
    user_id: payload.userId,
    date: today,
    check_in_time: new Date().toISOString(),
    check_in_location: payload.lat ? { lat: payload.lat, lng: payload.lng } : null,
    selfie_url: payload.selfieUrl,
    notes: payload.notes,
    status: 'present',
  };

  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update(checkInData)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, attendanceId: data?.id };
  } else {
    const { data, error } = await supabase
      .from('attendance')
      .insert(checkInData)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, attendanceId: data?.id };
  }
}

export async function checkOut(
  userId: string,
  lat?: number,
  lng?: number,
  notes?: string
): Promise<AttendanceResult> {
  const today = new Date().toISOString().split('T')[0];

  if (isDryRun) {
    return { success: true, dry_run: true };
  }

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: new Date().toISOString(),
      check_out_location: lat ? { lat, lng } : null,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('date', today)
    .not('check_in_time', 'is', null)
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, attendanceId: data?.id };
}
