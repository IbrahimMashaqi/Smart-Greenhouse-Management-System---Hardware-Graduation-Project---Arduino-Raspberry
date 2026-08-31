'use client';

import React, { useState } from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import { WateringSchedule } from '@/types/greenhouse';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Play,
  ShowerHead,
  Timer,
  SprayCan,
  Pencil,
  X,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type TabType = 'watering' | 'spraying';

export const WateringScheduler: React.FC = () => {
  const {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    startWateringCycle,
    startSprayCycle,
    telemetry,
  } = useGreenhouse();

  const [activeTab, setActiveTab] = useState<TabType>('watering');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setName('');
    setTime('08:00');
    setDurationSeconds(30);
    setSelectedDays(['Mon', 'Wed', 'Fri']);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedDays.length === 0) return;

    if (editingId) {
      updateSchedule(editingId, {
        name: name.trim(),
        time,
        days: selectedDays,
        durationSeconds,
      });
    } else {
      addSchedule({
        name: name.trim(),
        time,
        enabled: true,
        days: selectedDays,
        durationSeconds,
        type: activeTab,
      });
    }
    resetForm();
  };

  const handleEdit = (sch: WateringSchedule) => {
    setEditingId(sch.id);
    setName(sch.name);
    setTime(sch.time);
    setDurationSeconds(sch.durationSeconds);
    setSelectedDays([...sch.days]);
    setIsAdding(true);
  };

  const filteredSchedules = schedules.filter((s) => s.type === activeTab);

  const inputClass = 'w-full px-3 py-1.5 rounded-lg border text-xs outline-none transition-all'
    + ' focus:border-sky-400 focus:ring-2 focus:ring-sky-100';

  const tabBtnClass = (tab: TabType) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
      activeTab === tab
        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
        : 'bg-white text-slate-500 border-slate-200 hover:text-sky-600 hover:border-sky-200'
    }`;

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-4 h-4 text-sky-500" />
            AUTOMATED SCHEDULER
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Configure automated time slots for irrigation and spray cycles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startWateringCycle}
            disabled={telemetry.pump}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-md shadow-sky-200 disabled:opacity-50"
          >
            <ShowerHead className="w-4 h-4" />
            {telemetry.pump ? 'Watering...' : 'Instant Water'}
          </button>

          <button
            onClick={startSprayCycle}
            disabled={telemetry.sprayRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            <SprayCan className="w-4 h-4" />
            {telemetry.sprayRunning ? 'Spraying...' : 'Instant Spray'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setActiveTab('watering'); resetForm(); }} className={tabBtnClass('watering')}>
          <ShowerHead className="w-4 h-4" />
          Watering (Irrigation)
        </button>
        <button onClick={() => { setActiveTab('spraying'); resetForm(); }} className={tabBtnClass('spraying')}>
          <SprayCan className="w-4 h-4" />
          Spraying
        </button>
      </div>

      {/* New/Edit Schedule Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border space-y-4"
          style={{ background: '#f0f7ff', borderColor: '#bae6fd' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {editingId ? 'Edit Schedule' : `New ${activeTab === 'watering' ? 'Watering' : 'Spraying'} Slot`}
            </h3>
            <button type="button" onClick={resetForm} className="p-1 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Schedule Label</label>
              <input type="text" placeholder="e.g. Afternoon Hydration" value={name}
                onChange={(e) => setName(e.target.value)} required
                className={inputClass} style={{ borderColor: '#bae6fd', background: '#fff', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Target Time (HH:MM)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required
                className={inputClass + ' font-mono'} style={{ borderColor: '#bae6fd', background: '#fff', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Est. Duration (Seconds)</label>
              <input type="number" min="5" max="300" value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))} required
                className={inputClass + ' font-mono'} style={{ borderColor: '#bae6fd', background: '#fff', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Repeat Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const selected = selectedDays.includes(d);
                return (
                  <button key={d} type="button" onClick={() => handleDayToggle(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-sky-100 border-sky-300 text-sky-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-200'
                    }`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm}
              className="px-4 py-1.5 rounded-lg border font-semibold text-xs transition-all hover:bg-slate-50"
              style={{ borderColor: '#e2e8f0', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-sm">
              {editingId ? 'Update Schedule' : 'Save Schedule'}
            </button>
          </div>
        </form>
      )}

      {/* Add Button */}
      {!isAdding && (
        <div className="mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-semibold text-xs transition-all"
            style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: 'var(--text-secondary)' }}
          >
            <Plus className="w-4 h-4 text-sky-500" />
            New {activeTab === 'watering' ? 'Watering' : 'Spraying'} Schedule
          </button>
        </div>
      )}

      {/* Schedule List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
            No {activeTab} schedules configured yet. Click &quot;New Schedule&quot; above to add one.
          </div>
        ) : (
          filteredSchedules.map((sch) => (
            <div key={sch.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                sch.enabled
                  ? 'bg-white border-sky-100 hover:border-sky-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${sch.enabled ? 'bg-sky-50 text-sky-500 border-sky-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  {sch.type === 'spraying' ? <SprayCan className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{sch.name}</h3>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border bg-sky-50 text-sky-700 border-sky-200">
                      {sch.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((d) => (
                        <span key={d}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            sch.days.includes(d)
                              ? 'bg-sky-100 text-sky-700 font-bold'
                              : 'text-slate-300'
                          }`}>
                          {d}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] border-l pl-2" style={{ borderColor: '#e0f2fe', color: 'var(--text-muted)' }}>
                      {sch.durationSeconds}s cycle
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                {sch.lastRun && (
                  <span className="text-[11px] flex items-center gap-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                    <Timer className="w-3.5 h-3.5 text-emerald-500" />
                    Last: {sch.lastRun}
                  </span>
                )}

                <button onClick={() => toggleSchedule(sch.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    sch.enabled
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                  {sch.enabled ? 'ACTIVE' : 'PAUSED'}
                </button>

                <button onClick={() => handleEdit(sch)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"
                  title="Edit Schedule">
                  <Pencil className="w-4 h-4" />
                </button>

                <button onClick={() => deleteSchedule(sch.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  title="Delete Schedule">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
