import type { Metadata } from 'next';
import './globals.css';
import { GreenhouseProvider } from '@/context/GreenhouseContext';

export const metadata: Metadata = {
  title: 'Smart Greenhouse Control Center',
  description: 'Real-time Arduino Serial Communication & Control Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-emerald-500 selection:text-slate-950">
        <GreenhouseProvider>
          {children}
        </GreenhouseProvider>
      </body>
    </html>
  );
}
