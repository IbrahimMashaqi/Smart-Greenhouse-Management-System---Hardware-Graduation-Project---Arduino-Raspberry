'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { TelemetryStats } from '@/components/TelemetryStats';
import { ActuatorStatus } from '@/components/ActuatorStatus';
import { ThresholdConfigurator } from '@/components/ThresholdConfigurator';
import { WateringScheduler } from '@/components/WateringScheduler';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SerialConsole } from '@/components/SerialConsole';
import { MedicineModal } from '@/components/MedicineModal';
import { LowWaterWarning } from '@/components/LowWaterWarning';
import { useGreenhouse } from '@/context/GreenhouseContext';
import {
  LayoutDashboard,
  SlidersHorizontal,
  CalendarClock,
  Terminal,
} from 'lucide-react';

type Page = 'dashboard' | 'controls' | 'settings' | 'terminal';

const TABS: { id: Page; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard   },
  { id: 'controls',  label: 'Controls',   Icon: CalendarClock      },
  { id: 'settings',  label: 'Settings',   Icon: SlidersHorizontal  },
  { id: 'terminal',  label: 'Terminal',   Icon: Terminal           },
];

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const { lowWaterWarning, closeLowWaterWarning } = useGreenhouse();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-2)' }}>
      {/* Sticky top bar — header + tab nav together */}
      <div className="sticky top-0 z-30">
        <Header />

        {/* Tab Navigation Bar */}
        <nav
          className="w-full border-b"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(186,230,253,0.8)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center gap-1">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => setActivePage(id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold
                    transition-all duration-200 focus:outline-none
                    ${isActive
                      ? 'text-sky-600 tab-active'
                      : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/60'
                    }
                  `}
                  style={{ borderRadius: isActive ? '6px 6px 0 0' : '6px' }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">

        {/* DASHBOARD — Sensor Stats + Actuators + Charts */}
        {activePage === 'dashboard' && (
          <div className="space-y-6 page-enter">
            <section>
              <TelemetryStats />
            </section>
            <section>
              <ActuatorStatus />
            </section>
            <section>
              <TelemetryCharts />
            </section>
          </div>
        )}

        {/* CONTROLS — Watering Scheduler */}
        {activePage === 'controls' && (
          <div className="page-enter">
            <WateringScheduler />
          </div>
        )}

        {/* SETTINGS — Threshold Configurator */}
        {activePage === 'settings' && (
          <div className="page-enter">
            <ThresholdConfigurator />
          </div>
        )}

        {/* TERMINAL — Serial Console */}
        {activePage === 'terminal' && (
          <div className="page-enter">
            <SerialConsole />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-4 px-4 text-center text-xs"
        style={{ borderColor: 'rgba(186,230,253,0.6)', color: '#7ea8cc', background: 'rgba(255,255,255,0.6)' }}
      >
        Smart Greenhouse Control System &bull; Next.js &amp; Web Serial API &bull; {new Date().getFullYear()}
      </footer>

      {/* Medicine Confirmation Modal */}
      <MedicineModal />

      {/* Low Water Warning Modal */}
      <LowWaterWarning 
        isOpen={lowWaterWarning.isOpen} 
        message={lowWaterWarning.message} 
        onClose={closeLowWaterWarning} 
      />
    </div>
  );
}
