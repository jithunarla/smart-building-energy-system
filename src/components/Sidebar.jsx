import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  Lightbulb, 
  AlertTriangle, 
  Sparkles, 
  BarChart3, 
  Zap, 
  X,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { mode, alerts, serialState } = useDashboard();

  const navItems = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Live Sensor Monitoring', path: '/sensor-monitoring', icon: Activity },
    { name: 'Occupancy Monitoring', path: '/occupancy', icon: Users },
    { name: 'Smart Lighting', path: '/smart-lighting', icon: Lightbulb },
    { 
      name: 'Energy Waste Alerts', 
      path: '/alerts', 
      icon: AlertTriangle,
      badge: alerts.length > 0 ? alerts.length : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { name: 'Smart Recommendations', path: '/recommendations', icon: Sparkles },
    { name: 'Energy Analytics', path: '/energy-analytics', icon: Zap },
    { name: 'Sustainability & Analytics', path: '/sustainability', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0D1322] border-r border-slate-800/90 flex flex-col justify-between
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top: Logo & Branding */}
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-wide leading-tight">
                  ECO-BUILDING
                </h2>
                <span className="text-[10px] font-mono font-medium text-emerald-400 tracking-wider uppercase">
                  Energy Waste Monitor
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle / Description badge */}
          <div className="px-5 pt-3 pb-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Core Engine</span>
              </span>
              <span className="text-slate-500 font-mono">v1.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) => `
                    group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Application Version and Connection Status */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0B0F17]/60">
          <div className="rounded-xl bg-[#131B2E] p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Telemetry Mode</span>
              <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
                mode?.toLowerCase() === 'demo'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {mode?.toLowerCase() === 'demo' ? 'DEMO MODE' : 'HARDWARE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${mode?.toLowerCase() === 'demo' ? 'text-emerald-400' : 'text-blue-400'}`} />
                <span>Link Status</span>
              </span>
              <span className="font-mono text-slate-300">
                {mode?.toLowerCase() === 'demo' ? 'Synthetic Active' : serialState.status}
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Phase 3 Hardware Link</span>
              <span className="text-emerald-400 font-semibold">v3.0.0-hardware</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
