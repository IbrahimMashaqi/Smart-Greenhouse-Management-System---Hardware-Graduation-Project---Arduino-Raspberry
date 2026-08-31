'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface LowWaterWarningProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const LowWaterWarning: React.FC<LowWaterWarningProps> = ({ isOpen, message, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,35,64,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative"
        style={{
          background: '#ffffff',
          border: '1px solid #fde68a',
          boxShadow: '0 20px 48px rgba(245,158,11,0.15)',
          animation: 'fadeSlideIn 0.2s ease-out',
        }}>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Warning: Low Water Level</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Process Cancelled</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border space-y-2"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Water Level Below 25%</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <div className="px-4 py-2 rounded-xl text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200">
            Auto-closing in 4 seconds...
          </div>
        </div>

      </div>
    </div>
  );
};
