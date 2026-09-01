import { TelemetryData, TelemetryHistoryPoint, WateringSchedule } from '@/types/greenhouse';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface ThresholdSettings {
  tempThreshold: number;
  luxNightThreshold: number;
  luxHighThreshold: number;
  dryThreshold: number;
  waterTankEmptyThreshold: number;
  sprayTankEmptyThreshold: number;
}

export interface SystemSettings {
  baudRate: number;
  telemetryLogIntervalSeconds: number;
  serialLogEnabled: boolean;
  lowWaterWarningPercent: number;
}

export const greenhouseApi = {
  getThresholds: () => apiFetch<ThresholdSettings>('/api/thresholds'),

  saveThreshold: (type: string, value: number) =>
    apiFetch('/api/thresholds', {
      method: 'PATCH',
      body: JSON.stringify({ type, value }),
    }),

  getSchedules: () =>
    apiFetch<{ schedules: WateringSchedule[] }>('/api/schedules'),

  createSchedule: (schedule: Omit<WateringSchedule, 'id'>) =>
    apiFetch<{ id: string }>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    }),

  updateSchedule: (id: string, updates: Partial<WateringSchedule>) =>
    apiFetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteSchedule: (id: string) =>
    apiFetch(`/api/schedules/${id}`, { method: 'DELETE' }),

  logTelemetry: (data: TelemetryData) =>
    apiFetch('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTelemetryHistory: (hours = 24, limit = 500) =>
    apiFetch<{ history: TelemetryHistoryPoint[]; count: number }>(
      `/api/telemetry/history?hours=${hours}&limit=${limit}`
    ),

  logScheduleExecution: (data: {
    scheduleId: string;
    type: 'watering' | 'spraying';
    success: boolean;
    failureReason?: string;
    commandSent: string;
  }) =>
    apiFetch('/api/schedule-executions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logTankWarning: (data: {
    tankType: 'water' | 'spray';
    distanceCm: number;
    thresholdCm: number;
    levelPercent: number;
    message: string;
    source: 'arduino' | 'dashboard' | 'simulation';
  }) =>
    apiFetch('/api/tank-warnings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logActuatorEvent: (data: {
    actuator: 'fan' | 'pump' | 'spray' | 'light' | 'umbrella';
    state: string;
    triggerSource: 'auto' | 'manual' | 'schedule' | 'serial' | 'simulation';
    rawMessage?: string;
  }) =>
    apiFetch('/api/actuator-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logSerial: (direction: 'IN' | 'OUT' | 'SYS', text: string) =>
    apiFetch('/api/serial-logs', {
      method: 'POST',
      body: JSON.stringify({ direction, text }),
    }),

  getSystemSettings: () => apiFetch<SystemSettings>('/api/system-settings'),

  saveSystemSettings: (settings: Partial<SystemSettings>) =>
    apiFetch('/api/system-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getStatistics: (period: 'day' | 'week' | 'month' = 'day') =>
    apiFetch(`/api/statistics?period=${period}`),
};
