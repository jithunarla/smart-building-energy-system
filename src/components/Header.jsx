import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Bell, 
  Cpu, 
  Layers, 
  Menu, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronDown,
  Clock,
  Wifi,
  WifiOff,
  CheckCheck,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Camera,
  Video
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { DEMO_SCENARIOS } from '../data/mockSensorData';
import StatusBadge from './StatusBadge';
import HardwareModal from './HardwareModal';

export const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { 
    mode, 
    setMode, 
    currentTime, 
    alerts, 
    alertCounts,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    activeScenario, 
    selectScenario,
    serialState,
    isCameraActive,
    peopleCount
  } = useDashboard();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  // Page title mapping based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/overview':
        return { title: 'Overview Dashboard', subtitle: 'Real-time Environmental & Energy Telemetry' };
      case '/sensor-monitoring':
        return { title: 'Live Sensor Monitoring', subtitle: 'LDR, DHT11 & D7 Room Light Hardware Telemetry' };
      case '/occupancy':
        return { title: 'Occupancy Monitoring', subtitle: 'AI Webcam Person Detection & Zone Presence Inference' };
      case '/smart-lighting':
        return { title: 'Smart Lighting Control', subtitle: 'Rule Matrix, Decision Logic & Luminaire Simulation' };
      case '/alerts':
        return { title: 'Energy Waste Alerts', subtitle: 'Real-time Anomaly Detection & Conservation Warnings' };
      case '/recommendations':
        return { title: 'Smart Recommendations', subtitle: 'Algorithmic Optimization & Energy Conservation Advisories' };
      case '/energy-analytics':
        return { title: 'Energy Analytics & Savings', subtitle: 'Lighting Usage, Avoidable Waste & Downloadable Sustainability Reports' };
      case '/sustainability':
        return { title: 'Sustainability & Analytics', subtitle: 'Comprehensive Efficiency Scoring & Historical Trends' };
      default:
        return { title: 'Dashboard', subtitle: 'Building Management System' };
    }
  };

  const pageInfo = getPageTitle();

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/60"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {pageInfo.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center flex-wrap gap-2.5 lg:gap-4">
          {/* Date and Time Display */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111726] border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formattedDate}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">{formattedTime}</span>
          </div>

          {/* Operating Mode Selector (Demo Mode vs Hardware Mode) */}
          <div className="flex items-center bg-[#111726] p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setMode('demo')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                mode?.toLowerCase() === 'demo'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Mode</span>
            </button>
            <button
              onClick={() => {
                setMode('hardware');
                setShowHardwareModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                mode?.toLowerCase() === 'hardware'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Hardware Mode</span>
            </button>
          </div>

          {/* Demo Mode Scenario Switcher */}
          {mode?.toLowerCase() === 'demo' && (
            <div className="relative">
              <button
                onClick={() => setShowScenarioMenu(!showScenarioMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131B2E] border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                title="Test predefined building conditions (Task 4)"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-mono">Scenario:</span>
                <span className="font-semibold truncate max-w-[130px]">
                  {DEMO_SCENARIOS.find((s) => s.id === activeScenario)?.shortName || 'Standard Afternoon'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showScenarioMenu && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-[#131B2E] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowScenarioMenu(false)}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Select Demonstration Scenario
                  </div>
                  <div className="mt-1 space-y-1">
                    {DEMO_SCENARIOS.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => {
                          selectScenario(sc.id);
                          setShowScenarioMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          activeScenario === sc.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="font-medium">{sc.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sc.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Camera Active Status Pill */}
          {isCameraActive && (
            <Link
              to="/occupancy"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Laptop AI Webcam is actively tracking occupancy"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">AI Camera:</span>
              <span className="font-bold text-white">{peopleCount} {peopleCount === 1 ? 'Person' : 'People'}</span>
            </Link>
          )}

          {/* Arduino Connection Status Badge (Clickable to open hardware settings) */}
          <button 
            onClick={() => setShowHardwareModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-[#111726] text-xs font-mono transition-opacity hover:opacity-90"
            title="Configure Arduino Hardware Link"
          >
            {mode?.toLowerCase() === 'demo' ? (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated Telemetry</span>
              </div>
            ) : serialState.status === 'CONNECTED' ? (
              serialState.isStale ? (
                <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Stale Telemetry (&gt;3.5s)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>USB Serial Connected</span>
                </div>
              )
            ) : serialState.status === 'CONNECTING' ? (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Negotiating Port...</span>
              </div>
            ) : serialState.status === 'ERROR' ? (
              <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Serial Error</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded">
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Arduino Disconnected</span>
              </div>
            )}
          </button>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-[#111726] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {(unreadNotificationCount > 0 || alerts.length > 0) && (
                <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                  unreadNotificationCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                }`}>
                  {unreadNotificationCount > 0 ? unreadNotificationCount : alerts.length}
                </span>
              )}
            </button>

            {/* Notifications & Waste Alerts Quick Preview Popover */}
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131B2E] border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Notifications & Waste Alerts
                    </span>
                    {unreadNotificationCount > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-mono">
                        {unreadNotificationCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Clear notification list"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto mt-2 space-y-2 pr-0.5">
                  {/* Section A: Active Alerts */}
                  {alerts.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                        <span>Active Waste & Fault Alerts</span>
                        <span className="text-rose-400 font-mono">{alerts.length} active</span>
                      </div>
                      {alerts.slice(0, 3).map((al) => (
                        <div key={al.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-200 truncate pr-2">{al.title}</span>
                            <StatusBadge type={al.severity} label={al.severity} size="xs" />
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{al.description}</p>
                          {al.potentialSavings && (
                            <div className="mt-1 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Avoidable load: {al.potentialSavings}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section B: Notification Activity Feed */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between px-1 pt-1 border-t border-slate-800/80">
                      <span>Recent Event Feed</span>
                      <span className="text-slate-500 font-mono">{notifications.length} events</span>
                    </div>

                    {notifications.length === 0 && alerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                        All systems nominal. No alerts or events logged.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.read && markNotificationAsRead(n.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            !n.read 
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200 hover:bg-amber-950/30' 
                              : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                              <span className={`font-medium truncate ${!n.read ? 'text-slate-200' : 'text-slate-400'}`}>
                                {n.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer link to full Alerts page */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[10px] font-mono">BMS Alert Hub</span>
                  <Link 
                    to="/alerts" 
                    onClick={() => setShowNotifications(false)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium text-xs flex items-center gap-1"
                  >
                    View All in Alert Center <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User / Facility Engineer Profile Placeholder */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-semibold text-xs shadow-inner">
              MO
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-200 leading-tight">Mukilan BMS</div>
              <div className="text-[10px] text-slate-400">Building Ops</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hardware Connection Modal */}
      <HardwareModal 
        isOpen={showHardwareModal} 
        onClose={() => setShowHardwareModal(false)} 
      />
    </>
  );
};

export default Header;

