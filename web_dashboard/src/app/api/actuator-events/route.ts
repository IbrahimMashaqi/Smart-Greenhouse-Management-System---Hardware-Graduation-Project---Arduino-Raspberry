import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `INSERT INTO actuator_events (device_id, actuator, state, trigger_source, raw_message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        DEFAULT_DEVICE_ID,
        body.actuator,
        body.state,
        body.triggerSource || 'auto',
        body.rawMessage || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/actuator-events error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
