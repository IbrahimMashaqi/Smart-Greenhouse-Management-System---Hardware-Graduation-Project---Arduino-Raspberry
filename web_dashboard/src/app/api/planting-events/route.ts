import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, query, execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || 20);
    const events = await query(
      `SELECT * FROM planting_events WHERE device_id = ? ORDER BY started_at DESC LIMIT ?`,
      [DEFAULT_DEVICE_ID, limit]
    );
    return NextResponse.json({ events });
  } catch (err) {
    console.error('GET /api/planting-events error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await execute(
      `INSERT INTO planting_events (device_id, trigger_source) VALUES (?, ?)`,
      [DEFAULT_DEVICE_ID, body.triggerSource || 'manual']
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('POST /api/planting-events error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `UPDATE planting_events SET status = ?, plants_planted = ?, finished_at = NOW() WHERE id = ? AND device_id = ?`,
      [body.status, body.plantsPlanted || 0, body.id, DEFAULT_DEVICE_ID]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/planting-events error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
