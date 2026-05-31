import { NextRequest, NextResponse } from 'next/server';
import { checkIn } from '@/lib/services/attendanceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, lat, lng, selfieUrl, notes } = body;

    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await checkIn({ userId, organizationId, lat, lng, selfieUrl, notes });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
