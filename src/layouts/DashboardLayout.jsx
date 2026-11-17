import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SimulationControlBar from '../components/SimulationControlBar';
import { useDashboard } from '../context/DashboardContext';
import { AlertCircle, Cpu, Layers } from 'lucide-react';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, alerts } = useDashboard();

  const isHardware = mode === 'hardware' || mode === 'HARDWARE';
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Phase 2 Simulation Control Bar (Active in Demo Mode) */}
        {!isHardware && <SimulationControlBar />}

        {/* Global Alert Notification Bar if critical waste is detected */}
        {criticalAlerts.length > 0 && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 lg:px-8 py-2 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="font-semibold text-rose-200">Attention: </strong>
                {criticalAlerts[0].title} — {criticalAlerts[0].description}
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 shrink-0 hidden sm:inline">
              Energy Waste Active
            </span>
          </div>
        )}

        {/* Hardware Mode Banner Notice */}
        {isHardware && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 lg:px-8 py-2 flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="font-semibold text-blue-200">Hardware Mode: </strong>
                Live Web Serial Telemetry active with Arduino Uno R3 (A0 LDR, D2 DHT11, Pin D7 Room LED). Synthetic simulation paused.
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-800/80 px-4 lg:px-8 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#0B0F17]/50">
          <div>
            Smart Building Energy Waste Detection & Sustainability Monitoring System
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>React + Vite + Tailwind CSS</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Phase 7: Final Production System & Advanced Analytics</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
