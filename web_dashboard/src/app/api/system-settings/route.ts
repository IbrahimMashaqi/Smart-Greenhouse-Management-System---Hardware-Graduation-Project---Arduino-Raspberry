import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SettingsRow extends RowDataPacket {
  baud_rate: number;
  telemetry_log_interval_seconds: number;
  serial_log_enabled: boolean;
  low_water_warning_percent: number;
}

export async function GET() {
  try {
    const rows = await query<SettingsRow[]>(
      `SELECT baud_rate, telemetry_log_interval_seconds, serial_log_enabled, low_water_warning_percent
       FROM system_settings WHERE device_id = ?`,
      [DEFAULT_DEVICE_ID]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        baudRate: 9600,
        telemetryLogIntervalSeconds: 60,
        serialLogEnabled: true,
        lowWaterWarningPercent: 25,
      });
    }

    const s = rows[0];
    return NextResponse.json({
      baudRate: s.baud_rate,
      telemetryLogIntervalSeconds: s.telemetry_log_interval_seconds,
      serialLogEnabled: Boolean(s.serial_log_enabled),
      lowWaterWarningPercent: Number(s.low_water_warning_percent),
    });
  } catch (err) {
    console.error('GET /api/system-settings error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    await execute(
      `INSERT INTO system_settings (device_id, baud_rate, telemetry_log_interval_seconds, serial_log_enabled, low_water_warning_percent)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         baud_rate = VALUES(baud_rate),
         telemetry_log_interval_seconds = VALUES(telemetry_log_interval_seconds),
         serial_log_enabled = VALUES(serial_log_enabled),
         low_water_warning_percent = VALUES(low_water_warning_percent)`,
      [
        DEFAULT_DEVICE_ID,
        body.baudRate ?? 9600,
        body.telemetryLogIntervalSeconds ?? 60,
        body.serialLogEnabled ?? true,
        body.lowWaterWarningPercent ?? 25,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/system-settings error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
