import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { WateringSchedule } from '@/types/greenhouse';

interface ScheduleRow extends RowDataPacket {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  duration_seconds: number;
  type: 'watering' | 'spraying';
  last_run_at: string | null;
  days: string | null;
}

function rowToSchedule(row: ScheduleRow): WateringSchedule {
  return {
    id: row.id,
    name: row.name,
    time: row.time.slice(0, 5),
    enabled: Boolean(row.enabled),
    days: row.days ? row.days.split(',') : [],
    durationSeconds: row.duration_seconds,
    type: row.type,
    lastRun: row.last_run_at ? new Date(row.last_run_at).toLocaleTimeString() : undefined,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query<ScheduleRow[]>(
      `SELECT s.id, s.name, s.time, s.enabled, s.duration_seconds, s.type, s.last_run_at,
              GROUP_CONCAT(sd.day_of_week ORDER BY FIELD(sd.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun')) AS days
       FROM watering_schedules s
       LEFT JOIN schedule_days sd ON sd.schedule_id = s.id
       WHERE s.id = ?
       GROUP BY s.id`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule: rowToSchedule(rows[0]) });
  } catch (err) {
    console.error('GET /api/schedules/[id] error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.time !== undefined) { updates.push('time = ?'); values.push(`${body.time}:00`); }
    if (body.enabled !== undefined) { updates.push('enabled = ?'); values.push(body.enabled); }
    if (body.durationSeconds !== undefined) { updates.push('duration_seconds = ?'); values.push(body.durationSeconds); }
    if (body.lastRun !== undefined) { updates.push('last_run_at = NOW()'); }

    if (updates.length > 0) {
      values.push(id);
      await execute(`UPDATE watering_schedules SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (body.days !== undefined) {
      await execute(`DELETE FROM schedule_days WHERE schedule_id = ?`, [id]);
      for (const day of body.days) {
        await execute(`INSERT INTO schedule_days (schedule_id, day_of_week) VALUES (?, ?)`, [id, day]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/schedules/[id] error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await execute(`DELETE FROM watering_schedules WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/schedules/[id] error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
