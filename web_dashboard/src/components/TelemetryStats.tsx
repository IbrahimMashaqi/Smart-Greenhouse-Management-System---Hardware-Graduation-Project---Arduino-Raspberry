'use client';

import React from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  Thermometer,
  Droplets,
  Sun,
  Sprout,
  Container,
  Waves,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const TelemetryStats: React.FC = () => {
  const { telemetry, startWateringCycle } = useGreenhouse();

  // Temperature logic
  const isHighTemp = telemetry.temperature > telemetry.tempThreshold;
  const tempDiff = telemetry.temperature - telemetry.tempThreshold;
  const getTempStatus = () => {
    if (tempDiff > 5) return { label: 'CRITICAL', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
    if (tempDiff > 0) return { label: 'HIGH', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (tempDiff < -5) return { label: 'COLD', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    return { label: 'NORMAL', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };
  const tempStatus = getTempStatus();

  // Humidity logic
  const getHumidityStatus = () => {
    if (telemetry.humidity < 30) return { label: 'LOW', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (telemetry.humidity > 80) return { label: 'HIGH', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    return { label: 'OPTIMAL', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };
  const humidityStatus = getHumidityStatus();

  // Lux classification logic
  const getLuxLabel = () => {
    if (telemetry.lux < telemetry.luxNightThreshold)
      return { label: 'Night / Low Light', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (telemetry.lux < telemetry.luxHighThreshold)
      return { label: 'Optimal Sunlight', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Intense Sun (Shade Active)', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
  };

  const luxInfo = getLuxLabel();

  // Soil logic
  const avgSoil = Math.round((telemetry.soil1 + telemetry.soil2) / 2);
  const isSoilDry = telemetry.soilStatus === 'DRY';
  const soilPercent = Math.round(((1023 - avgSoil) / 1023) * 100);
  const getSoilStatus = () => {
    if (soilPercent < 20) return { label: 'DRY', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (soilPercent > 60) return { label: 'WET', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    return { label: 'OPTIMAL', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };
  const soilStatusInfo = getSoilStatus();

  // Water Tank logic
  const waterTankPercent = telemetry.waterTankOK
    ? Math.round(Math.max(0, Math.min(100, ((telemetry.waterTankEmptyThreshold - telemetry.waterTankDist) / telemetry.waterTankEmptyThreshold) * 100)))
    : 0;
  const getWaterTankStatus = () => {
    if (waterTankPercent >= 75) return { label: 'FULL', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    if (waterTankPercent >= 50) return { label: 'GOOD', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    if (waterTankPercent >= 25) return { label: 'LOW', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (waterTankPercent > 0) return { label: 'CRITICAL', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
    return { label: 'EMPTY', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
  };
  const waterTankStatus = getWaterTankStatus();

  // Spray Tank logic
  const sprayTankPercent = telemetry.sprayTankOK
    ? Math.round(Math.max(0, Math.min(100, ((telemetry.sprayTankEmptyThreshold - telemetry.sprayTankDist) / telemetry.sprayTankEmptyThreshold) * 100)))
    : 0;
  const getSprayTankStatus = () => {
    if (sprayTankPercent >= 75) return { label: 'FULL', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    if (sprayTankPercent >= 50) return { label: 'GOOD', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    if (sprayTankPercent >= 25) return { label: 'LOW', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (sprayTankPercent > 0) return { label: 'CRITICAL', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
    return { label: 'EMPTY', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
  };
  const sprayTankStatus = getSprayTankStatus();

  const card = 'glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

      {/* 1. Temperature */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl border ${isHighTemp ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Temperature</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Limit: {telemetry.tempThreshold}°C</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {telemetry.temperature.toFixed(1)}
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>°C</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${tempStatus.cls}`}>
              {tempStatus.label}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 mt-3 overflow-hidden" style={{ background: '#e0f2fe' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isHighTemp ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (telemetry.temperature / 50) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Humidity */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Humidity</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Air Moisture</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {telemetry.humidity.toFixed(1)}
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>%</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${humidityStatus.cls}`}>
              {humidityStatus.label}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 mt-3 overflow-hidden" style={{ background: '#e0f2fe' }}>
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, telemetry.humidity))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Brightness (Lux) */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Brightness</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Light Sensor</p>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {telemetry.lux.toFixed(0)}
            <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>Lux</span>
          </span>
          <div className="mt-2.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border block truncate ${luxInfo.cls}`}>
              {luxInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Soil Moisture */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl border ${isSoilDry ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Soil Moisture</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Threshold: {telemetry.dryThreshold}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{avgSoil}</span>
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>ADC avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${soilStatusInfo.cls}`}>
                {soilStatusInfo.label}
              </span>
              <button
                onClick={startWateringCycle}
                disabled={telemetry.pump}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 disabled:opacity-50 transition-all"
              >
                {telemetry.pump ? 'Watering...' : 'Water'}
              </button>
            </div>
          </div>
          <div className="flex justify-between text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            <span>S1: <strong style={{ color: 'var(--text-primary)' }}>{telemetry.soil1}</strong></span>
            <span>S2: <strong style={{ color: 'var(--text-primary)' }}>{telemetry.soil2}</strong></span>
          </div>
        </div>
      </div>

      {/* 5. Water Tank Level */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl border ${telemetry.waterTankOK ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Water Tank</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Irrigation Tank</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {waterTankPercent}
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>%</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${waterTankStatus.cls}`}>
              {waterTankStatus.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {telemetry.waterTankDist.toFixed(1)} cm / &lt; {telemetry.waterTankEmptyThreshold} cm
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: '#e0f2fe' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${telemetry.waterTankOK ? 'bg-sky-500' : 'bg-rose-500'}`}
              style={{ width: `${waterTankPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6. Spray Tank Level */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl border ${telemetry.sprayTankOK ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
            <Container className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Spray Tank</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Medicine Tank</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {sprayTankPercent}
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>%</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${sprayTankStatus.cls}`}>
              {sprayTankStatus.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {telemetry.sprayTankDist.toFixed(1)} cm / &lt; {telemetry.sprayTankEmptyThreshold} cm
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: '#f3e8ff' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${telemetry.sprayTankOK ? 'bg-violet-500' : 'bg-rose-500'}`}
              style={{ width: `${sprayTankPercent}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};
