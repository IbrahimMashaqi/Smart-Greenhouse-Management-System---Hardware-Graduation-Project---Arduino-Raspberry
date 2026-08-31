'use client';

import React, { useState, useEffect } from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  Cpu,
  Plug,
  PlugZap,
  Activity,
  Play,
  Square,
  Clock,
  Settings,
  AlertCircle
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    status,
    baudRate,
    setBaudRate,
    connectPort,
    disconnectPort,
    isSimulating,
    toggleSimulation,
  } = useGreenhouse();

  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    setTimeStr(new Date().toLocaleTimeString());
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CONNECTED
          </span>
        );
      case 'SIMULATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            SIMULATING
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            CONNECTING...
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            DISCONNECTED
          </span>
        );
    }
  };

  return (
    <header
      className="w-full px-4 lg:px-8 py-3.5 border-b"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(14px)',
        borderColor: 'rgba(186,230,253,0.8)',
        boxShadow: '0 2px 12px rgba(14,165,233,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 border border-sky-200 text-sky-600 shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                GREENHOUSE CONTROL
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              Arduino Hardware Serial Bridge
            </p>
          </div>
        </div>

        {/* Right: Controls & Time */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">

          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono"
            style={{ background: '#f0f7ff', borderColor: '#bae6fd', color: '#4a6080' }}>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{timeStr || '00:00:00'}</span>
          </div>

          {/* Baud Rate Selector */}
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs border"
            style={{ background: '#f0f7ff', borderColor: '#bae6fd', color: '#4a6080' }}>
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={status === 'CONNECTED'}
              className="bg-transparent outline-none cursor-pointer disabled:opacity-50"
              style={{ color: '#0c2340' }}
            >
              <option value={9600}>9600 Baud</option>
              <option value={115200}>115200 Baud</option>
              <option value={57600}>57600 Baud</option>
              <option value={19200}>19200 Baud</option>
            </select>
          </div>

          {/* Connect / Disconnect Button */}
          {status === 'CONNECTED' ? (
            <button
              onClick={disconnectPort}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-all"
            >
              <Plug className="w-3.5 h-3.5" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectPort}
              disabled={status === 'CONNECTING'}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-all shadow-md shadow-sky-200 disabled:opacity-50"
            >
              <PlugZap className="w-3.5 h-3.5" />
              Connect Arduino
            </button>
          )}

          {/* Simulation Mode Toggle */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-md shadow-sky-100'
                : 'bg-white border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-200'
            }`}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 text-sky-500" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Stop Simulator' : 'Simulate Data'}
          </button>

        </div>
      </div>
    </header>
  );
};
