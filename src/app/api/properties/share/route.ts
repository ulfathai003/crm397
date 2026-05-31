import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { shareProperty } from '@/lib/services/propertyShareService';
import { z } from 'zod';

const ShareSchema = z.object({
  property_id: z.string().uuid(),
  lead_id: z.string().uuid(),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  custom_message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = ShareSchema.parse(body);

    const result = await shareProperty(
      data.property_id,
      data.lead_id,
      data.channel,
      user.id,
      data.custom_message,
    );

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Share failed' }, { status: 500 });
  }
}
