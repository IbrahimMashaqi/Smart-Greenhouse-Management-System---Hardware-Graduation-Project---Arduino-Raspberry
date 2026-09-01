import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ThresholdRow extends RowDataPacket {
  temp_threshold: number;
  lux_night_threshold: number;
  lux_high_threshold: number;
  dry_threshold: number;
  water_tank_empty_threshold: number;
  spray_tank_empty_threshold: number;
  updated_at: string;
}

export async function GET() {
  try {
    const rows = await query<ThresholdRow[]>(
      `SELECT temp_threshold, lux_night_threshold, lux_high_threshold,
              dry_threshold, water_tank_empty_threshold, spray_tank_empty_threshold, updated_at
       FROM threshold_settings WHERE device_id = ?`,
      [DEFAULT_DEVICE_ID]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Thresholds not found' }, { status: 404 });
    }

    const t = rows[0];
    return NextResponse.json({
      tempThreshold: Number(t.temp_threshold),
      luxNightThreshold: Number(t.lux_night_threshold),
      luxHighThreshold: Number(t.lux_high_threshold),
      dryThreshold: Number(t.dry_threshold),
      waterTankEmptyThreshold: Number(t.water_tank_empty_threshold),
      sprayTankEmptyThreshold: Number(t.spray_tank_empty_threshold),
      updatedAt: t.updated_at,
    });
  } catch (err) {
    console.error('GET /api/thresholds error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tempThreshold,
      luxNightThreshold,
      luxHighThreshold,
      dryThreshold,
      waterTankEmptyThreshold,
      sprayTankEmptyThreshold,
      updatedBy,
    } = body;

    await query(
      `INSERT INTO threshold_settings (
        device_id, temp_threshold, lux_night_threshold, lux_high_threshold,
        dry_threshold, water_tank_empty_threshold, spray_tank_empty_threshold, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        temp_threshold = VALUES(temp_threshold),
        lux_night_threshold = VALUES(lux_night_threshold),
        lux_high_threshold = VALUES(lux_high_threshold),
        dry_threshold = VALUES(dry_threshold),
        water_tank_empty_threshold = VALUES(water_tank_empty_threshold),
        spray_tank_empty_threshold = VALUES(spray_tank_empty_threshold),
        updated_by = VALUES(updated_by)`,
      [
        DEFAULT_DEVICE_ID,
        tempThreshold,
        luxNightThreshold,
        luxHighThreshold,
        dryThreshold,
        waterTankEmptyThreshold,
        sprayTankEmptyThreshold,
        updatedBy || 'dashboard',
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/thresholds error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const fieldMap: Record<string, string> = {
      temp: 'temp_threshold',
      luxNight: 'lux_night_threshold',
      luxHigh: 'lux_high_threshold',
      dry: 'dry_threshold',
      waterTank: 'water_tank_empty_threshold',
      sprayTank: 'spray_tank_empty_threshold',
    };

    const column = fieldMap[body.type];
    if (!column || body.value === undefined) {
      return NextResponse.json({ error: 'Invalid threshold type' }, { status: 400 });
    }

    await query(
      `INSERT INTO threshold_settings (device_id, ${column}) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${column} = VALUES(${column}), updated_by = ?`,
      [DEFAULT_DEVICE_ID, body.value, body.updatedBy || 'dashboard']
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/thresholds error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
