'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import { Terminal, Send, Trash2, ArrowDownCircle, ArrowUpCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const SerialConsole: React.FC = () => {
  const { logs, clearLogs, sendCommand, status } = useGreenhouse();
  const [customCmd,   setCustomCmd]   = useState('');
  const [isExpanded,  setIsExpanded]  = useState(true);
  const [filter,      setFilter]      = useState<'ALL' | 'IN' | 'OUT' | 'SYS'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isExpanded]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    await sendCommand(customCmd.trim());
    setCustomCmd('');
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.direction === filter;
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left focus:outline-none group"
        >
          <Terminal className="w-4 h-4 text-sky-500" />
          <h2 className="text-base font-bold group-hover:text-sky-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
            LIVE SERIAL TERMINAL
          </h2>
          <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-muted)' }}>
            ({logs.length} logs)
          </span>
          {isExpanded
            ? <ChevronUp className="w-4 h-4 ml-1" style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown className="w-4 h-4 ml-1" style={{ color: 'var(--text-muted)' }} />}
        </button>

        {isExpanded && (
          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex rounded-lg p-0.5 text-xs font-semibold border"
              style={{ background: '#f0f7ff', borderColor: '#bae6fd' }}>
              {(['ALL', 'IN', 'OUT', 'SYS'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filter === f
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-sky-600'
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            <button onClick={clearLogs}
              className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
              title="Clear Terminal Output">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Terminal Console View */}
          <div
            ref={scrollRef}
            className="h-72 rounded-xl p-4 font-mono text-xs overflow-y-auto border flex flex-col-reverse"
            style={{
              background: '#f8fcff',
              borderColor: '#bae6fd',
              color: 'var(--text-primary)',
            }}
          >
            {filteredLogs.length === 0 ? (
              <div className="italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                Terminal output ready. Connect serial port or start simulation mode.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-1 flex items-start gap-2 border-b leading-relaxed"
                  style={{ borderColor: '#e0f2fe' }}>
                  <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {log.timestamp}
                  </span>

                  {log.direction === 'IN' && (
                    <span className="text-sky-600 font-bold shrink-0 flex items-center gap-1">
                      <ArrowDownCircle className="w-3 h-3" /> RX:
                    </span>
                  )}
                  {log.direction === 'OUT' && (
                    <span className="text-emerald-600 font-bold shrink-0 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" /> TX:
                    </span>
                  )}
                  {log.direction === 'SYS' && (
                    <span className="text-amber-600 font-bold shrink-0 flex items-center gap-1">
                      <Info className="w-3 h-3" /> SYS:
                    </span>
                  )}

                  <span className={`break-all ${
                    log.direction === 'IN'
                      ? 'text-slate-700'
                      : log.direction === 'OUT'
                      ? 'text-emerald-700 font-semibold'
                      : 'text-amber-700'
                  }`}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Direct Serial Command Input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder="Type raw serial command (e.g. SPRAY_START, WATER_START, SET_TEMP:29.5)..."
              value={customCmd}
              onChange={(e) => setCustomCmd(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border text-xs font-mono outline-none transition-all focus:ring-2 focus:ring-sky-100"
              style={{
                background: '#f8fcff',
                borderColor: '#bae6fd',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={!customCmd.trim()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
