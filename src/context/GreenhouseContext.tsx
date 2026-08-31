'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TelemetryData,
  TelemetryHistoryPoint,
  WateringSchedule,
  SerialLog,
  ConnectionStatus,
} from '@/types/greenhouse';
import { serialManager, isWebSerialSupported } from '@/lib/serial';

const DEFAULT_TELEMETRY: TelemetryData = {
  temperature: 24.5,
  humidity: 58.0,
  fan: false,
  lux: 45.0,
  umbrella: 'OPEN',
  light: false,
  soil1: 320,
  soil2: 340,
  soilStatus: 'WET',
  pump: false,
  waterTankDist: 6.5,
  waterTankOK: true,
  sprayTankDist: 7.2,
  sprayTankOK: true,
  sprayRunning: false,
  tempThreshold: 28.0,
  luxNightThreshold: 20.0,
  luxHighThreshold: 100.0,
  dryThreshold: 400,
  waterTankEmptyThreshold: 11.0,
  sprayTankEmptyThreshold: 10.5,
};

interface GreenhouseContextType {
  telemetry: TelemetryData;
  history: TelemetryHistoryPoint[];
  status: ConnectionStatus;
  baudRate: number;
  setBaudRate: (baud: number) => void;
  logs: SerialLog[];
  clearLogs: () => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  connectPort: () => Promise<void>;
  disconnectPort: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<boolean>;
  updateThreshold: (type: string, value: number) => Promise<void>;
  
  // Schedules
  schedules: WateringSchedule[];
  addSchedule: (schedule: Omit<WateringSchedule, 'id'>) => void;
  updateSchedule: (id: string, updated: Partial<WateringSchedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;

  // Medicine confirmation modal
  medicineModalOpen: boolean;
  setMedicineModalOpen: (open: boolean) => void;
  confirmMedicine: () => Promise<void>;
  startSprayCycle: () => Promise<void>;
  startWateringCycle: () => Promise<void>;
}

const GreenhouseContext = createContext<GreenhouseContextType | undefined>(undefined);

export const GreenhouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [logs, setLogs] = useState<SerialLog[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [medicineModalOpen, setMedicineModalOpen] = useState<boolean>(false);

  // Default initial watering schedules
  const [schedules, setSchedules] = useState<WateringSchedule[]>([
    {
      id: '1',
      name: 'Morning Irrigation',
      time: '08:00',
      enabled: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      durationSeconds: 30,
    },
    {
      id: '2',
      name: 'Evening Hydration',
      time: '18:00',
      enabled: true,
      days: ['Mon', 'Wed', 'Fri'],
      durationSeconds: 45,
    },
  ]);

  const addLog = useCallback((direction: 'IN' | 'OUT' | 'SYS', text: string) => {
    const newLog: SerialLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      text,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, []);

  const clearLogs = () => setLogs([]);

  // Telemetry history recorder
  const recordHistoryPoint = useCallback((data: TelemetryData) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const avgSoil = Math.round((data.soil1 + data.soil2) / 2);

    setHistory((prev) => [
      ...prev.slice(-29),
      {
        timestamp: timeStr,
        temperature: Number(data.temperature.toFixed(1)),
        humidity: Number(data.humidity.toFixed(1)),
        lux: Number(data.lux.toFixed(1)),
        soilAvg: avgSoil,
      },
    ]);
  }, []);

  // Update telemetry & record history
  const handleNewTelemetry = useCallback(
    (data: TelemetryData, rawJson?: string) => {
      setTelemetry((prev) => {
        const merged = { ...prev, ...data };
        return merged;
      });
      recordHistoryPoint(data);
    },
    [recordHistoryPoint]
  );

  // Setup Serial callbacks
  useEffect(() => {
    serialManager.setCallbacks({
      onData: (data) => handleNewTelemetry(data),
      onLog: (direction, text) => addLog(direction, text),
      onError: (err) => {
        addLog('SYS', `Error: ${err.message}`);
        setStatus('ERROR');
      },
    });
  }, [handleNewTelemetry, addLog]);

  // Connect Web Serial Port
  const connectPort = async () => {
    if (isSimulating) {
      setIsSimulating(false);
    }
    setStatus('CONNECTING');
    addLog('SYS', `Connecting to serial port at ${baudRate} baud...`);
    const success = await serialManager.connect(baudRate);
    if (success) {
      setStatus('CONNECTED');
    } else {
      setStatus('ERROR');
    }
  };

  // Disconnect Web Serial Port
  const disconnectPort = async () => {
    await serialManager.disconnect();
    setStatus('DISCONNECTED');
  };

  // Send Command to Arduino
  const sendCommand = async (cmd: string): Promise<boolean> => {
    if (status === 'SIMULATING' || isSimulating) {
      addLog('OUT', cmd);
      // Simulate response/action in simulator mode
      setTimeout(() => {
        if (cmd.startsWith('SET_TEMP:')) {
          const val = parseFloat(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, tempThreshold: val }));
          addLog('IN', 'ACK:TEMP_THRESHOLD_UPDATED');
        } else if (cmd.startsWith('SET_LUX_NIGHT:')) {
          const val = parseFloat(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, luxNightThreshold: val }));
          addLog('IN', 'ACK:LUX_NIGHT_UPDATED');
        } else if (cmd.startsWith('SET_LUX_HIGH:')) {
          const val = parseFloat(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, luxHighThreshold: val }));
          addLog('IN', 'ACK:LUX_HIGH_UPDATED');
        } else if (cmd.startsWith('SET_SOIL:')) {
          const val = parseInt(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, dryThreshold: val }));
          addLog('IN', 'ACK:SOIL_THRESHOLD_UPDATED');
        } else if (cmd.startsWith('SET_WATER_TANK:')) {
          const val = parseFloat(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, waterTankEmptyThreshold: val }));
          addLog('IN', 'ACK:WATER_TANK_THRESHOLD_UPDATED');
        } else if (cmd.startsWith('SET_SPRAY_TANK:')) {
          const val = parseFloat(cmd.split(':')[1]);
          setTelemetry((t) => ({ ...t, sprayTankEmptyThreshold: val }));
          addLog('IN', 'ACK:SPRAY_TANK_THRESHOLD_UPDATED');
        } else if (cmd === 'WATER_START' || cmd === 'IRRIGATE_START') {
          setTelemetry((t) => ({ ...t, pump: true }));
          addLog('IN', 'PUMP ON');
          setTimeout(() => {
            setTelemetry((t) => ({ ...t, pump: false }));
            addLog('IN', 'PUMP OFF');
          }, 4000);
        } else if (cmd === 'SPRAY_START') {
          setMedicineModalOpen(true);
        } else if (cmd === 'o' || cmd === 'O') {
          setTelemetry((t) => ({ ...t, sprayRunning: true }));
          addLog('IN', 'SPRAY ON');
          setTimeout(() => {
            setTelemetry((t) => ({ ...t, sprayRunning: false }));
            addLog('IN', 'SPRAY OFF');
          }, 6000);
        }
      }, 300);
      return true;
    }

    return await serialManager.sendCommand(cmd);
  };

  const updateThreshold = async (type: string, value: number) => {
    let cmd = '';
    switch (type) {
      case 'temp':
        cmd = `SET_TEMP:${value}`;
        break;
      case 'luxNight':
        cmd = `SET_LUX_NIGHT:${value}`;
        break;
      case 'luxHigh':
        cmd = `SET_LUX_HIGH:${value}`;
        break;
      case 'dry':
        cmd = `SET_SOIL:${value}`;
        break;
      case 'waterTank':
        cmd = `SET_WATER_TANK:${value}`;
        break;
      case 'sprayTank':
        cmd = `SET_SPRAY_TANK:${value}`;
        break;
    }
    if (cmd) {
      await sendCommand(cmd);
    }
  };

  // Quick Action Triggers
  const startWateringCycle = async () => {
    await sendCommand('WATER_START');
  };

  const startSprayCycle = async () => {
    await sendCommand('SPRAY_START');
  };

  const confirmMedicine = async () => {
    await sendCommand('o');
    setMedicineModalOpen(false);
  };

  // Toggle Simulation Mode
  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setStatus('DISCONNECTED');
      addLog('SYS', 'Simulation mode disabled');
    } else {
      if (status === 'CONNECTED') {
        serialManager.disconnect();
      }
      setIsSimulating(true);
      setStatus('SIMULATING');
      addLog('SYS', 'Simulation mode enabled (Generating live Arduino telemetry)');
    }
  };

  // Simulator Loop (updates mock telemetry every 1.5s when simulating)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        // Subtle realistic fluctuations
        const tempVariation = (Math.random() - 0.5) * 0.4;
        const humVariation = (Math.random() - 0.5) * 0.8;
        const luxVariation = (Math.random() - 0.5) * 3.0;
        const soilVariation = Math.floor((Math.random() - 0.5) * 4);

        const newTemp = Math.max(15, Math.min(42, Number((prev.temperature + tempVariation).toFixed(1))));
        const newHum = Math.max(30, Math.min(95, Number((prev.humidity + humVariation).toFixed(1))));
        const newLux = Math.max(0, Number((prev.lux + luxVariation).toFixed(1)));
        const newSoil1 = Math.max(100, Math.min(900, prev.soil1 + soilVariation));
        const newSoil2 = Math.max(100, Math.min(900, prev.soil2 + soilVariation));

        // Evaluate automated states based on thresholds
        const fanOn = newTemp > prev.tempThreshold;
        const lightOn = newLux < prev.luxNightThreshold;
        let umbrellaState: 'OPEN' | 'CLOSED' | 'MOVING' = 'OPEN';
        if (newLux >= prev.luxHighThreshold) {
          umbrellaState = 'CLOSED';
        } else {
          umbrellaState = 'OPEN';
        }

        const avgSoil = (newSoil1 + newSoil2) / 2;
        const soilStatus: 'WET' | 'DRY' = avgSoil >= prev.dryThreshold ? 'DRY' : 'WET';

        // Tank level simulation - slow realistic fluctuations
        const waterTankVariation = (Math.random() - 0.5) * 0.3;
        const sprayTankVariation = (Math.random() - 0.5) * 0.2;
        const newWaterTankDist = Math.max(1, Math.min(prev.waterTankEmptyThreshold + 2, Number((prev.waterTankDist + waterTankVariation).toFixed(1))));
        const newSprayTankDist = Math.max(1, Math.min(prev.sprayTankEmptyThreshold + 2, Number((prev.sprayTankDist + sprayTankVariation).toFixed(1))));
        const newWaterTankOK = newWaterTankDist < prev.waterTankEmptyThreshold;
        const newSprayTankOK = newSprayTankDist < prev.sprayTankEmptyThreshold;

        const updatedData: TelemetryData = {
          ...prev,
          temperature: newTemp,
          humidity: newHum,
          fan: fanOn,
          lux: newLux,
          umbrella: umbrellaState,
          light: lightOn,
          soil1: newSoil1,
          soil2: newSoil2,
          soilStatus: soilStatus,
          waterTankDist: newWaterTankDist,
          waterTankOK: newWaterTankOK,
          sprayTankDist: newSprayTankDist,
          sprayTankOK: newSprayTankOK,
        };

        const mockJson = JSON.stringify(updatedData);
        addLog('IN', mockJson);
        recordHistoryPoint(updatedData);

        return updatedData;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, addLog, recordHistoryPoint]);

  // Schedule operations
  const addSchedule = (scheduleData: Omit<WateringSchedule, 'id'>) => {
    const newSchedule: WateringSchedule = {
      ...scheduleData,
      id: Math.random().toString(36).substring(2, 9),
    };
    setSchedules((prev) => [...prev, newSchedule]);
    addLog('SYS', `Schedule created: "${newSchedule.name}" at ${newSchedule.time}`);
  };

  const updateSchedule = (id: string, updated: Partial<WateringSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    addLog('SYS', `Schedule removed`);
  };

  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Automated Schedule Trigger Checker Loop
  const lastTriggeredRef = useRef<{ [key: string]: string }>({});
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHoursMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[now.getDay()];
      const todayKey = `${now.toDateString()}-${currentHoursMin}`;

      schedules.forEach((sch) => {
        if (sch.enabled && sch.time === currentHoursMin && sch.days.includes(currentDay)) {
          // Prevent multiple triggers in the same minute
          if (lastTriggeredRef.current[sch.id] !== todayKey) {
            lastTriggeredRef.current[sch.id] = todayKey;
            addLog('SYS', `Automated Schedule Triggered: "${sch.name}" (${sch.time})`);
            startWateringCycle();
            updateSchedule(sch.id, { lastRun: new Date().toLocaleTimeString() });
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [schedules, addLog]);

  return (
    <GreenhouseContext.Provider
      value={{
        telemetry,
        history,
        status,
        baudRate,
        setBaudRate,
        logs,
        clearLogs,
        isSimulating,
        toggleSimulation,
        connectPort,
        disconnectPort,
        sendCommand,
        updateThreshold,
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        toggleSchedule,
        medicineModalOpen,
        setMedicineModalOpen,
        confirmMedicine,
        startSprayCycle,
        startWateringCycle,
      }}
    >
      {children}
    </GreenhouseContext.Provider>
  );
};

export const useGreenhouse = () => {
  const context = useContext(GreenhouseContext);
  if (!context) {
    throw new Error('useGreenhouse must be used within a GreenhouseProvider');
  }
  return context;
};
