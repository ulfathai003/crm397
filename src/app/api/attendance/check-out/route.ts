import { NextRequest, NextResponse } from 'next/server';
import { checkOut } from '@/lib/services/attendanceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lat, lng, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const result = await checkOut(userId, lat, lng, notes);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Check-out failed' }, { status: 500 });
  }
}
