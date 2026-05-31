import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/twilio/status
 * Receives Twilio call status callbacks
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');
  const leg = searchParams.get('leg');

  const body = await request.formData();
  const callStatus = body.get('CallStatus')?.toString();
  const callSid = body.get('CallSid')?.toString();
  const callDuration = body.get('CallDuration')?.toString();
  const recordingUrl = body.get('RecordingUrl')?.toString();

  if (callId) {
    const supabase = await createAdminClient();
    
    const updateData: Record<string, unknown> = {};
    
    if (callStatus) {
      const statusMap: Record<string, string> = {
        'completed': 'completed',
        'failed': 'failed',
        'busy': 'busy',
        'no-answer': 'no_answer',
        'canceled': 'failed',
        'in-progress': 'in_progress',
      };
      updateData.status = statusMap[callStatus] ?? callStatus;
    }

    if (callDuration) {
      updateData.duration = parseInt(callDuration);
    }

    if (callStatus === 'completed' || callStatus === 'failed') {
      updateData.ended_at = new Date().toISOString();
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from('calls').update(updateData).eq('id', callId);
    }
  }

  return new NextResponse('OK', { status: 200 });
}
