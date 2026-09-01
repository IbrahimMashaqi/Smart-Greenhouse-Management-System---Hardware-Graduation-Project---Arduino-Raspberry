import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface StatsRow extends RowDataPacket {
  avg_temperature: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  avg_humidity: number | null;
  min_humidity: number | null;
  max_humidity: number | null;
  avg_lux: number | null;
  avg_soil: number | null;
  min_soil: number | null;
  max_soil: number | null;
  avg_water_tank_percent: number | null;
  avg_spray_tank_percent: number | null;
  reading_count: number;
}

interface DailyRow extends RowDataPacket {
  stat_date: string;
  avg_temperature: number | null;
  avg_humidity: number | null;
  avg_lux: number | null;
  avg_soil: number | null;
  irrigation_runs: number;
  spray_runs: number;
  water_warnings: number;
  spray_warnings: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const hours = period === 'week' ? 168 : period === 'month' ? 720 : 24;

    const summary = await query<StatsRow[]>(
      `SELECT
        ROUND(AVG(temperature), 1) AS avg_temperature,
        ROUND(MIN(temperature), 1) AS min_temperature,
        ROUND(MAX(temperature), 1) AS max_temperature,
        ROUND(AVG(humidity), 1) AS avg_humidity,
        ROUND(MIN(humidity), 1) AS min_humidity,
        ROUND(MAX(humidity), 1) AS max_humidity,
        ROUND(AVG(lux), 1) AS avg_lux,
        ROUND(AVG(soil_avg)) AS avg_soil,
        MIN(soil_avg) AS min_soil,
        MAX(soil_avg) AS max_soil,
        ROUND(AVG(water_tank_percent), 1) AS avg_water_tank_percent,
        ROUND(AVG(spray_tank_percent), 1) AS avg_spray_tank_percent,
        COUNT(*) AS reading_count
       FROM telemetry_readings
       WHERE device_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [DEFAULT_DEVICE_ID, hours]
    );

    const daily = await query<DailyRow[]>(
      `SELECT
        DATE(recorded_at) AS stat_date,
        ROUND(AVG(temperature), 1) AS avg_temperature,
        ROUND(AVG(humidity), 1) AS avg_humidity,
        ROUND(AVG(lux), 1) AS avg_lux,
        ROUND(AVG(soil_avg)) AS avg_soil,
        0 AS irrigation_runs,
        0 AS spray_runs,
        0 AS water_warnings,
        0 AS spray_warnings
       FROM telemetry_readings
       WHERE device_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY DATE(recorded_at)
       ORDER BY stat_date ASC`,
      [DEFAULT_DEVICE_ID, hours]
    );

    const executions = await query<RowDataPacket[]>(
      `SELECT type, COUNT(*) AS count
       FROM schedule_executions
       WHERE device_id = ? AND executed_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY type`,
      [DEFAULT_DEVICE_ID, hours]
    );

    const warnings = await query<RowDataPacket[]>(
      `SELECT tank_type, COUNT(*) AS count
       FROM tank_warnings
       WHERE device_id = ? AND warned_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       GROUP BY tank_type`,
      [DEFAULT_DEVICE_ID, hours]
    );

    const irrigationRuns = Number(executions.find((e) => e.type === 'watering')?.count || 0);
    const sprayRuns = Number(executions.find((e) => e.type === 'spraying')?.count || 0);
    const waterWarnings = Number(warnings.find((w) => w.tank_type === 'water')?.count || 0);
    const sprayWarnings = Number(warnings.find((w) => w.tank_type === 'spray')?.count || 0);

    return NextResponse.json({
      period,
      summary: summary[0] || {},
      daily,
      activity: { irrigationRuns, sprayRuns, waterWarnings, sprayWarnings },
    });
  } catch (err) {
    console.error('GET /api/statistics error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
