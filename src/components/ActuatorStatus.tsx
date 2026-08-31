'use client';

import React from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  Fan,
  Lightbulb,
  Umbrella,
  ShowerHead,
  SprayCan,
  Power
} from 'lucide-react';

export const ActuatorStatus: React.FC = () => {
  const { telemetry, startWateringCycle, startSprayCycle } = useGreenhouse();

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Power className="w-4 h-4 text-sky-500" />
            ACTUATORS &amp; HARDWARE STATUS
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time status of connected fans, lighting, umbrella motor, irrigation pump, and spray module
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* 1. Fans */}
        <div className={`p-4 rounded-xl border transition-all ${
          telemetry.fan
            ? 'bg-emerald-50 border-emerald-200 pulse-glow-emerald'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${telemetry.fan ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Fan className={`w-5 h-5 ${telemetry.fan ? 'animate-spin' : ''}`} />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              telemetry.fan ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {telemetry.fan ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cooling Fans</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Auto Trigger: Temp &gt; {telemetry.tempThreshold}°C
            </p>
          </div>
        </div>

        {/* 2. LED Light */}
        <div className={`p-4 rounded-xl border transition-all ${
          telemetry.light
            ? 'bg-amber-50 border-amber-200 pulse-glow-amber'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${telemetry.light ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <Lightbulb className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              telemetry.light ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {telemetry.light ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Night LED Light</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Auto ON: Lux &lt; {telemetry.luxNightThreshold}
            </p>
          </div>
        </div>

        {/* 3. Umbrella */}
        <div className={`p-4 rounded-xl border transition-all ${
          telemetry.umbrella === 'MOVING'
            ? 'bg-sky-50 border-sky-200 pulse-glow-cyan'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
              <Umbrella className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              telemetry.umbrella === 'OPEN'
                ? 'bg-emerald-100 text-emerald-700'
                : telemetry.umbrella === 'CLOSED'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-amber-100 text-amber-700 animate-pulse'
            }`}>
              {telemetry.umbrella}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Shade Umbrella</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Sun Protection (&gt;={telemetry.luxHighThreshold} Lux)
            </p>
          </div>
        </div>

        {/* 4. Irrigation Pump */}
        <div className={`p-4 rounded-xl border transition-all ${
          telemetry.pump
            ? 'bg-sky-50 border-sky-200 pulse-glow-cyan'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${telemetry.pump ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
              <ShowerHead className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              telemetry.pump ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {telemetry.pump ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Irrigation Pump</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Watering Pump</p>
            </div>
            <button
              onClick={startWateringCycle}
              disabled={telemetry.pump}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 border border-sky-300 transition-all disabled:opacity-50"
            >
              Water
            </button>
          </div>
        </div>

        {/* 5. Spray System */}
        <div className={`p-4 rounded-xl border transition-all ${
          telemetry.sprayRunning
            ? 'bg-emerald-50 border-emerald-200 pulse-glow-emerald'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${telemetry.sprayRunning ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <SprayCan className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              telemetry.sprayRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {telemetry.sprayRunning ? 'SPRAYING' : 'READY'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Spray &amp; Wash</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Medicine Spray</p>
            </div>
            <button
              onClick={startSprayCycle}
              disabled={telemetry.sprayRunning}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 transition-all disabled:opacity-50"
            >
              Spray
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
