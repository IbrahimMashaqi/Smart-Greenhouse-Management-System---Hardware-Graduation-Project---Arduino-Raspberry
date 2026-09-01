import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute, query } from '@/lib/db';
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

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function rowToSchedule(row: ScheduleRow): WateringSchedule {
  return {
    id: row.id,
    name: row.name,
    time: formatTime(row.time),
    enabled: Boolean(row.enabled),
    days: row.days ? row.days.split(',') : [],
    durationSeconds: row.duration_seconds,
    type: row.type,
    lastRun: row.last_run_at ? new Date(row.last_run_at).toLocaleTimeString() : undefined,
  };
}

export async function GET() {
  try {
    const rows = await query<ScheduleRow[]>(
      `SELECT s.id, s.name, s.time, s.enabled, s.duration_seconds, s.type, s.last_run_at,
              GROUP_CONCAT(sd.day_of_week ORDER BY FIELD(sd.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun')) AS days
       FROM watering_schedules s
       LEFT JOIN schedule_days sd ON sd.schedule_id = s.id
       WHERE s.device_id = ?
       GROUP BY s.id
       ORDER BY s.time ASC`,
      [DEFAULT_DEVICE_ID]
    );

    return NextResponse.json({ schedules: rows.map(rowToSchedule) });
  } catch (err) {
    console.error('GET /api/schedules error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || `sched-${crypto.randomUUID().slice(0, 8)}`;

    await execute(
      `INSERT INTO watering_schedules (id, device_id, name, time, enabled, duration_seconds, type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, DEFAULT_DEVICE_ID, body.name, `${body.time}:00`, body.enabled ?? true, body.durationSeconds, body.type]
    );

    if (body.days?.length) {
      for (const day of body.days) {
        await execute(
          `INSERT INTO schedule_days (schedule_id, day_of_week) VALUES (?, ?)`,
          [id, day]
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('POST /api/schedules error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
