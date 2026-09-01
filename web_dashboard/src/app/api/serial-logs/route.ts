import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `INSERT INTO serial_logs (device_id, direction, text) VALUES (?, ?, ?)`,
      [DEFAULT_DEVICE_ID, body.direction, body.text]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/serial-logs error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
