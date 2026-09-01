import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface HistoryRow extends RowDataPacket {
  recorded_at: string;
  temperature: number;
  humidity: number;
  lux: number;
  soil_avg: number;
  water_tank_percent: number;
  spray_tank_percent: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Math.min(Number(searchParams.get('hours') || 24), 720);
    const limit = Math.min(Number(searchParams.get('limit') || 500), 5000);

    const rows = await query<HistoryRow[]>(
      `SELECT recorded_at, temperature, humidity, lux, soil_avg,
              water_tank_percent, spray_tank_percent
       FROM telemetry_readings
       WHERE device_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY recorded_at ASC
       LIMIT ?`,
      [DEFAULT_DEVICE_ID, hours, limit]
    );

    const history = rows.map((r) => ({
      timestamp: new Date(r.recorded_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      recordedAt: r.recorded_at,
      temperature: Number(r.temperature),
      humidity: Number(r.humidity),
      lux: Number(r.lux),
      soilAvg: Number(r.soil_avg),
      waterTankPercent: Number(r.water_tank_percent),
      sprayTankPercent: Number(r.spray_tank_percent),
    }));

    return NextResponse.json({ history, count: history.length });
  } catch (err) {
    console.error('GET /api/telemetry/history error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
