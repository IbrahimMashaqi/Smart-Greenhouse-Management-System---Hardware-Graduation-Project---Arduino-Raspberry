import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEVICE_ID, calcTankPercent, execute } from '@/lib/db';
import { TelemetryData } from '@/types/greenhouse';

export async function POST(request: NextRequest) {
  try {
    const data: TelemetryData = await request.json();
    const soilAvg = Math.round((data.soil1 + data.soil2) / 2);
    const waterPercent = calcTankPercent(data.waterTankDist, data.waterTankEmptyThreshold);
    const sprayPercent = calcTankPercent(data.sprayTankDist, data.sprayTankEmptyThreshold);

    await execute(
      `INSERT INTO telemetry_readings (
        device_id, temperature, humidity, lux,
        soil1, soil2, soil_avg, soil_status,
        fan, light, umbrella, pump, spray_running,
        water_tank_dist, water_tank_ok, water_tank_percent,
        spray_tank_dist, spray_tank_ok, spray_tank_percent,
        temp_threshold, lux_night_threshold, lux_high_threshold,
        dry_threshold, water_tank_empty_threshold, spray_tank_empty_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_DEVICE_ID,
        data.temperature,
        data.humidity,
        data.lux,
        data.soil1,
        data.soil2,
        soilAvg,
        data.soilStatus,
        data.fan,
        data.light,
        data.umbrella,
        data.pump,
        data.sprayRunning,
        data.waterTankDist,
        data.waterTankOK,
        waterPercent,
        data.sprayTankDist,
        data.sprayTankOK,
        sprayPercent,
        data.tempThreshold,
        data.luxNightThreshold,
        data.luxHighThreshold,
        data.dryThreshold,
        data.waterTankEmptyThreshold,
        data.sprayTankEmptyThreshold,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/telemetry error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
