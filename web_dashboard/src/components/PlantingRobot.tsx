'use client';

import React from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  Sprout,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
} from 'lucide-react';

export const PlantingRobot: React.FC = () => {
  const { telemetry, plantingEvents, startPlanting, stopPlanting } = useGreenhouse();

  const isRunning = telemetry.plantRunning;

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sprout className="w-4 h-4 text-emerald-500" />
              PLANTING ROBOT CONTROL
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Start or interrupt the automated seed planting sequence
            </p>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
            isRunning
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isRunning ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Plant Running Status */}
          <div className={`p-4 rounded-xl border transition-all ${
            isRunning
              ? 'bg-emerald-50 border-emerald-200 pulse-glow-emerald'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${isRunning ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Cpu className={`w-5 h-5 ${isRunning ? 'animate-pulse' : ''}`} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Robot Status</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isRunning ? 'Planting sequence in progress...' : 'Ready to plant'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 rounded-xl border bg-white border-slate-200">
            <div className="flex flex-col gap-3">
              {!isRunning ? (
                <button
                  onClick={startPlanting}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-all shadow-md shadow-sky-200"
                >
                  <Play className="w-4 h-4" />
                  Start Planting
                </button>
              ) : (
                <button
                  onClick={stopPlanting}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all shadow-md shadow-rose-200"
                >
                  <Square className="w-4 h-4" />
                  Interrupt & Stop
                </button>
              )}
            </div>
            <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              {isRunning
                ? 'Press to interrupt and stop the planting process'
                : 'Will plant 7 seeds in the current row'}
            </p>
          </div>
        </div>
      </div>

      {/* Planting History */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-4 h-4 text-slate-400" />
              Planting History
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Recent planting events from the database
            </p>
          </div>
        </div>

        {plantingEvents.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            No planting events recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {plantingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    event.status === 'RUNNING'
                      ? 'bg-emerald-100 text-emerald-600'
                      : event.status === 'COMPLETED'
                      ? 'bg-sky-100 text-sky-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {event.status === 'RUNNING' ? (
                      <Cpu className="w-4 h-4 animate-pulse" />
                    ) : event.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {event.status === 'COMPLETED'
                        ? `${event.plants_planted} plants sown`
                        : event.status === 'INTERRUPTED'
                        ? `${event.plants_planted} plants sown (interrupted)`
                        : 'In progress...'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Started: {new Date(event.started_at).toLocaleString()}
                      {event.finished_at && ` — Finished: ${new Date(event.finished_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  event.status === 'RUNNING'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : event.status === 'COMPLETED'
                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
