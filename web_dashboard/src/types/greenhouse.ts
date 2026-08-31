export interface TelemetryData {
  temperature: number;
  humidity: number;
  fan: boolean;
  lux: number;
  umbrella: 'OPEN' | 'CLOSED' | 'MOVING';
  light: boolean;
  soil1: number;
  soil2: number;
  soilStatus: 'WET' | 'DRY';
  pump: boolean;
  waterTankDist: number;
  waterTankOK: boolean;
  sprayTankDist: number;
  sprayTankOK: boolean;
  sprayRunning: boolean;
  
  // Dynamic Thresholds from Arduino
  tempThreshold: number;
  luxNightThreshold: number;
  luxHighThreshold: number;
  dryThreshold: number;
  waterTankEmptyThreshold: number;
  sprayTankEmptyThreshold: number;
}

export interface TelemetryHistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  lux: number;
  soilAvg: number;
}

export interface WateringSchedule {
  id: string;
  name: string;
  time: string; // "08:00"
  enabled: boolean;
  days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  durationSeconds: number;
  type: 'watering' | 'spraying';
  lastRun?: string;
}

export interface SerialLog {
  id: string;
  timestamp: string;
  direction: 'IN' | 'OUT' | 'SYS';
  text: string;
}

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SIMULATING' | 'ERROR';
