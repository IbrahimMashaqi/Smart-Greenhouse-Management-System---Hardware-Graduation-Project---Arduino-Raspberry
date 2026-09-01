import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `INSERT INTO schedule_executions (schedule_id, device_id, type, success, failure_reason, command_sent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.scheduleId,
        DEFAULT_DEVICE_ID,
        body.type,
        body.success ?? true,
        body.failureReason || null,
        body.commandSent,
      ]
    );

    if (body.scheduleId) {
      await execute(`UPDATE watering_schedules SET last_run_at = NOW() WHERE id = ?`, [body.scheduleId]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/schedule-executions error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
