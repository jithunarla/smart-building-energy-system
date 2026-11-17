import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  Clock, 
  Users, 
  ChevronDown, 
  Sliders, 
  Radio,
  Trash2,
  Activity
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { DEMO_SCENARIOS } from '../data/mockSensorData';
import StatusBadge from './StatusBadge';

export const SimulationControlBar = () => {
  const { 
    mode, 
    isRunning, 
    pauseSimulation, 
    resumeSimulation, 
    resetSimulation, 
    speedMultiplier, 
    setSimulationSpeed, 
    activeScenario, 
    selectScenario,
    inactivityTimeout,
    setInactivityTimeout,
    inactivityRemaining,
    isOccupied,
    triggerMotionPulse
  } = useDashboard();

  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Only display in Demo Mode
  if (mode !== 'demo' && mode !== 'DEMO') {
    return null;
  }

  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === activeScenario) || DEMO_SCENARIOS[0];

  return (
    <div className="bg-[#0D1424] border-b border-slate-800/90 px-4 lg:px-8 py-2.5 text-xs text-slate-300">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Tag + Live Simulation State */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-bold">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isRunning ? 'SIMULATED TELEMETRY: RUNNING' : 'SIMULATION PAUSED'}</span>
          </div>

          {/* Quick Play/Pause & Reset buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            {isRunning ? (
              <button
                onClick={pauseSimulation}
                title="Pause telemetry simulation"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeSimulation}
                title="Resume telemetry simulation"
                className="p-1.5 rounded-md hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Resume</span>
              </button>
            )}

            <button
              onClick={resetSimulation}
              title="Reset simulation to default baseline"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Reset</span>
            </button>
          </div>
        </div>

        {/* Center: Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[11px] font-mono text-slate-400">Demo Scenario:</span>
          
          <div className="relative">
            <button
              onClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#131B2E] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold truncate max-w-[200px] sm:max-w-none">
                {currentScenario.title}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {showScenarioDropdown && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-[#131B2E] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setShowScenarioDropdown(false)}
              >
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Select Demonstration Scenario (Task 4)
                </div>
                <div className="mt-1 space-y-1">
                  {DEMO_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        selectScenario(sc.id);
                        setShowScenarioDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        activeScenario === sc.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="font-semibold">{sc.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{sc.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Simulation Speed, Timeout & Motion Pulse */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-800 p-0.5 text-[11px] font-mono">
            <span className="px-2 text-slate-500 hidden sm:inline">Speed:</span>
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  speedMultiplier === spd
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Inactivity Decay Indicator & Settings */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 hidden sm:inline">Inactivity:</span>
            <span className={`font-bold ${isOccupied ? 'text-emerald-400' : 'text-slate-500'}`}>
              {inactivityRemaining}s / {inactivityTimeout}s
            </span>
          </div>

          {/* Motion Pulse Trigger */}
          <button
            onClick={triggerMotionPulse}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-mono transition-colors flex items-center gap-1"
            title="Inject simulated occupant movement"
          >
            <Users className="w-3 h-3 text-emerald-400" />
            <span>Pulse Motion</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationControlBar;
