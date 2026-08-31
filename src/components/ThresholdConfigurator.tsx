'use client';

import React, { useState, useEffect } from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  SlidersHorizontal,
  Thermometer,
  Sun,
  Moon,
  Sprout,
  Waves,
  Container,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const ThresholdConfigurator: React.FC = () => {
  const { telemetry, updateThreshold } = useGreenhouse();

  const [tempThresh,       setTempThresh]       = useState<number>(telemetry.tempThreshold);
  const [luxNightThresh,   setLuxNightThresh]   = useState<number>(telemetry.luxNightThreshold);
  const [luxHighThresh,    setLuxHighThresh]    = useState<number>(telemetry.luxHighThreshold);
  const [soilThresh,       setSoilThresh]       = useState<number>(telemetry.dryThreshold);
  const [waterTankThresh,  setWaterTankThresh]  = useState<number>(telemetry.waterTankEmptyThreshold);
  const [sprayTankThresh,  setSprayTankThresh]  = useState<number>(telemetry.sprayTankEmptyThreshold);
  const [savingKey,        setSavingKey]        = useState<string | null>(null);

  useEffect(() => {
    setTempThresh(telemetry.tempThreshold);
    setLuxNightThresh(telemetry.luxNightThreshold);
    setLuxHighThresh(telemetry.luxHighThreshold);
    setSoilThresh(telemetry.dryThreshold);
    setWaterTankThresh(telemetry.waterTankEmptyThreshold);
    setSprayTankThresh(telemetry.sprayTankEmptyThreshold);
  }, [
    telemetry.tempThreshold,
    telemetry.luxNightThreshold,
    telemetry.luxHighThreshold,
    telemetry.dryThreshold,
    telemetry.waterTankEmptyThreshold,
    telemetry.sprayTankEmptyThreshold,
  ]);

  const handleApply = async (type: string, value: number) => {
    setSavingKey(type);
    await updateThreshold(type, value);
    setTimeout(() => setSavingKey(null), 600);
  };

  const cardClass = 'p-4 rounded-xl border flex flex-col justify-between bg-white';
  const labelStyle = { color: 'var(--text-secondary)' };
  const activeTag = 'text-xs font-mono px-2 py-0.5 rounded border bg-sky-50 text-sky-700 border-sky-200';

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <SlidersHorizontal className="w-4 h-4 text-sky-500" />
            DYNAMIC THRESHOLD SETTINGS
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Configure automated system triggers. Values update live on Arduino hardware via Serial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. Fan Trigger Temperature */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Thermometer className="w-4 h-4 text-rose-500" />
                Fan Trigger Temp
              </span>
              <span className={activeTag}>Active: {telemetry.tempThreshold}°C</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Fans turn ON when temperature exceeds this value.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="18" max="45" step="0.5" value={tempThresh}
                onChange={(e) => setTempThresh(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#10b981' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {tempThresh}°C
              </span>
            </div>
            <button onClick={() => handleApply('temp', tempThresh)} disabled={savingKey === 'temp'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'temp' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({tempThresh}°C)
            </button>
          </div>
        </div>

        {/* 2. Lux Night Threshold */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Moon className="w-4 h-4 text-indigo-500" />
                Night Light Limit
              </span>
              <span className={activeTag}>Active: {telemetry.luxNightThreshold} Lux</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              LED light turns ON when ambient light drops below this.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" step="1" value={luxNightThresh}
                onChange={(e) => setLuxNightThresh(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#6366f1' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {luxNightThresh} Lux
              </span>
            </div>
            <button onClick={() => handleApply('luxNight', luxNightThresh)} disabled={savingKey === 'luxNight'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'luxNight' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({luxNightThresh} Lx)
            </button>
          </div>
        </div>

        {/* 3. Lux High Threshold (Umbrella) */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Sun className="w-4 h-4 text-amber-500" />
                Shade Umbrella Limit
              </span>
              <span className={activeTag}>Active: {telemetry.luxHighThreshold} Lux</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Shade umbrella closes when intense sunlight exceeds this limit.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="50" max="500" step="5" value={luxHighThresh}
                onChange={(e) => setLuxHighThresh(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#f59e0b' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {luxHighThresh} Lux
              </span>
            </div>
            <button onClick={() => handleApply('luxHigh', luxHighThresh)} disabled={savingKey === 'luxHigh'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'luxHigh' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({luxHighThresh} Lx)
            </button>
          </div>
        </div>

        {/* 4. Soil Dryness Threshold */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Sprout className="w-4 h-4 text-emerald-500" />
                Soil Dry Threshold
              </span>
              <span className={activeTag}>Active: {telemetry.dryThreshold}</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Soil status marks DRY when sensor ADC reading is above this level.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="100" max="800" step="10" value={soilThresh}
                onChange={(e) => setSoilThresh(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#10b981' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {soilThresh}
              </span>
            </div>
            <button onClick={() => handleApply('dry', soilThresh)} disabled={savingKey === 'dry'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'dry' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({soilThresh})
            </button>
          </div>
        </div>

        {/* 5. Water Tank Empty Threshold */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Waves className="w-4 h-4 text-sky-500" />
                Water Tank Distance Limit
              </span>
              <span className={activeTag}>Active: {telemetry.waterTankEmptyThreshold} cm</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Ultrasonic distance limit before declaring irrigation tank empty.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="5" max="25" step="0.5" value={waterTankThresh}
                onChange={(e) => setWaterTankThresh(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#0ea5e9' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {waterTankThresh} cm
              </span>
            </div>
            <button onClick={() => handleApply('waterTank', waterTankThresh)} disabled={savingKey === 'waterTank'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'waterTank' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({waterTankThresh} cm)
            </button>
          </div>
        </div>

        {/* 6. Spray Tank Empty Threshold */}
        <div className={cardClass} style={{ borderColor: '#e2e8f0' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={labelStyle}>
                <Container className="w-4 h-4 text-violet-500" />
                Spray Tank Distance Limit
              </span>
              <span className={activeTag}>Active: {telemetry.sprayTankEmptyThreshold} cm</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Ultrasonic distance limit before declaring spray medicine tank empty.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="range" min="5" max="25" step="0.5" value={sprayTankThresh}
                onChange={(e) => setSprayTankThresh(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#8b5cf6' }} />
              <span className="text-sm font-bold min-w-[50px] text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                {sprayTankThresh} cm
              </span>
            </div>
            <button onClick={() => handleApply('sprayTank', sprayTankThresh)} disabled={savingKey === 'sprayTank'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-semibold transition-all disabled:opacity-50">
              {savingKey === 'sprayTank' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Arduino ({sprayTankThresh} cm)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
