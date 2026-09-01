import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `INSERT INTO tank_warnings (device_id, tank_type, distance_cm, threshold_cm, level_percent, message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_DEVICE_ID,
        body.tankType,
        body.distanceCm,
        body.thresholdCm,
        body.levelPercent,
        body.message || null,
        body.source || 'dashboard',
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/tank-warnings error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
