'use client';

import React from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LineChart as LineChartIcon, Activity } from 'lucide-react';

export const TelemetryCharts: React.FC = () => {
  const { history } = useGreenhouse();

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(14,165,233,0.1)',
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <LineChartIcon className="w-4 h-4 text-sky-500" />
            TELEMETRY HISTORY &amp; TRENDS
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time live trends for environmental conditions and soil telemetry
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{history.length} Data Points</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Temperature & Humidity Graph */}
        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: '#e0f2fe' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Temperature (°C) &amp; Humidity (%)
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Temp
              </span>
              <span className="flex items-center gap-1.5 text-sky-500">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Humidity
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Waiting for serial stream data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#4a6080' }} />
                  <Line type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={false} name="Temp (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} dot={false} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Soil Moisture & Brightness Graph */}
        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: '#e0f2fe' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Soil Moisture (ADC) &amp; Brightness (Lux)
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Soil Avg
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Lux
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Waiting for serial stream data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#4a6080' }} />
                  <Line type="monotone" dataKey="soilAvg" stroke="#10b981" strokeWidth={2} dot={false} name="Soil Moisture" />
                  <Line type="monotone" dataKey="lux" stroke="#fbbf24" strokeWidth={2} dot={false} name="Brightness (Lux)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
