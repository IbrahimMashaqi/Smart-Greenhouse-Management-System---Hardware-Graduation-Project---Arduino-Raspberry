'use client';

import React from 'react';
import { useGreenhouse } from '@/context/GreenhouseContext';
import { SprayCan, AlertTriangle, Check, X } from 'lucide-react';

export const MedicineModal: React.FC = () => {
  const { medicineModalOpen, setMedicineModalOpen, confirmMedicine } = useGreenhouse();

  if (!medicineModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,35,64,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative"
        style={{
          background: '#ffffff',
          border: '1px solid #bae6fd',
          boxShadow: '0 20px 48px rgba(14,165,233,0.15)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }}>

        <button
          onClick={() => setMedicineModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg transition-all hover:bg-slate-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <SprayCan className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Spray Cycle Confirmation</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pesticide / Medicine Tank Prep</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border space-y-2"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Preparation Required Before Launch</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Please verify that the required medicine liquid and water have been filled into Spray Tank 2
            before initiating the rail spray sequence.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => setMedicineModalOpen(false)}
            className="px-4 py-2 rounded-xl border font-semibold text-xs transition-all hover:bg-slate-50"
            style={{ borderColor: '#e2e8f0', color: 'var(--text-secondary)', background: '#f8fafc' }}
          >
            Cancel
          </button>

          <button
            onClick={confirmMedicine}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-200"
          >
            <Check className="w-4 h-4" />
            Confirm &amp; Start Spray (&apos;o&apos;)
          </button>
        </div>

      </div>
    </div>
  );
};
