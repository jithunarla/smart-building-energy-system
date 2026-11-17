import React from 'react';
import { 
  Lightbulb, 
  Sun, 
  Users, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  ShieldAlert,
  Power,
  SlidersHorizontal,
  Flame,
  ZapOff,
  ToggleLeft,
  ToggleRight,
  Camera,
  Cpu,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { SENSOR_CONFIG } from '../data/mockSensorData';
import { OCCUPANCY_STATES } from '../services/occupancyDetectionService';
import StatusBadge from '../components/StatusBadge';

export const SmartLighting = () => {
  const { 
    sensorData, 
    lightingDecision, 
    energyWaste,
    toggleRoomLight, 
    updateSensorValue,
    isOccupied,
    effectiveOccupancyState,
    occupancyStatus,
    peopleCount,
    isCameraActive,
    inactivityRemaining,
    inactivityTimeout,
    manualOverride,
    setManualOverride,
    desiredLightState,
    actualLightState,
    serialState,
    energyConfigState
  } = useDashboard();

  const isDaylightSufficient = sensorData.light_adc !== null && sensorData.light_adc >= SENSOR_CONFIG.ldr.daylightHarvestingThreshold;
  const isLightOn = sensorData.room_light === 1;

  // Waste detection check:
  // Daylight waste: isDaylightSufficient and isLightOn
  // Vacant waste: !isOccupied and isLightOn
  const isWastingDaylight = isDaylightSufficient && isLightOn;
  const isWastingVacant = !isOccupied && isLightOn;
  const hasWastage = energyWaste?.hasWaste || isWastingDaylight || isWastingVacant;

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR: AUTOMATIC AI MODE VS. MANUAL OVERRIDE */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Smart Lighting Control & Arduino Pin D7 Integration
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
              manualOverride 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {manualOverride ? 'Manual Override Active' : 'Automatic AI Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Combines laptop webcam AI person detection with physical LDR photoresistor telemetry on Arduino Uno Pin D7.
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setManualOverride(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                !manualOverride
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Auto AI Mode</span>
            </button>
            <button
              onClick={() => setManualOverride(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                manualOverride
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Manual Override</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DISCLAIMER BANNER: HARDWARE INTEGRATION & D7 PIN ASSIGNMENT */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-start gap-3.5 text-xs text-slate-300 shadow-md">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-200 text-sm mb-1">
            Arduino Hardware Integration: Pin D7 Dedicated Luminaire Output
          </h4>
          <p className="leading-relaxed text-slate-400">
            In this setup, digital pin <strong>D7 is exclusively reserved for the demonstration Room LED output</strong> (220&Omega; current-limiting resistor to LED anode). The PIR sensor is disabled. When the AI decision engine determines a lighting state change, newline-delimited JSON commands (<code className="text-emerald-300 font-mono">LIGHT_ON</code> / <code className="text-emerald-300 font-mono">LIGHT_OFF</code>) are transmitted over the Web Serial connection at 9600 baud.
          </p>
        </div>
      </div>

      {/* High-Visibility Active Energy Waste Warning Banner */}
      {hasWastage && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <ZapOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-rose-200 text-sm flex items-center gap-2">
                Active Energy Waste Detected — {energyWaste?.wastedWatts || 120}W Discharging
              </h4>
              <p className="text-slate-300 mt-1">
                {isWastingDaylight && 'Rule 1 Violation: Artificial luminaire energized during adequate daylight (>=500 ADC). '}
                {isWastingVacant && 'Rule 2 Violation: Room luminaire left energized while the space is vacant.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleRoomLight}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 font-mono text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Remediate: Turn OFF Luminaire</span>
          </button>
        </div>
      )}

      {/* 3. TOP 3 VARIABLE STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Variable 1: Natural Light Availability (LDR A0) */}
        <div className="p-5 rounded-xl bg-[#131B2E] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Input 1: Natural Daylight (A0)
            </span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {sensorData.light_adc !== null ? sensorData.light_adc : '--'}{' '}
            <span className="text-sm font-normal text-slate-400">ADC</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Harvesting Cutoff: &ge;500 ADC</span>
            <StatusBadge 
              type={isDaylightSufficient ? 'optimal' : 'warning'} 
              label={isDaylightSufficient ? 'Sufficient Daylight' : 'Insufficient Daylight'} 
            />
          </div>
        </div>

        {/* Variable 2: AI Human Presence (Webcam COCO-SSD) */}
        <div className="p-5 rounded-xl bg-[#131B2E] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Input 2: AI Presence (Webcam)
            </span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {occupancyStatus || 'UNKNOWN'}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {peopleCount > 0 ? `${peopleCount} person(s) in frame` : `Absence grace: ${inactivityRemaining}s`}
            </span>
            <StatusBadge 
              type={occupancyStatus === OCCUPANCY_STATES.OCCUPIED ? 'optimal' : occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED ? 'standby' : 'warning'} 
              label={occupancyStatus === OCCUPANCY_STATES.OCCUPIED ? 'Occupied' : occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED ? 'Vacant' : 'Unknown'} 
              pulse={occupancyStatus === OCCUPANCY_STATES.OCCUPIED}
            />
          </div>
        </div>

        {/* Variable 3: Desired State vs Actual Pin D7 Output */}
        <div className={`p-5 rounded-xl border transition-colors ${
          hasWastage 
            ? 'bg-rose-950/20 border-rose-500/40' 
            : 'bg-[#131B2E] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actuator: Room LED (Pin D7)
            </span>
            <Lightbulb className={`w-4 h-4 ${isLightOn ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {isLightOn ? 'ENERGIZED (1)' : 'DE-ENERGIZED (0)'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Desired: <strong className="font-mono text-slate-200">{desiredLightState === 1 ? 'ON' : 'OFF'}</strong> • Actual (D7): <strong className="font-mono text-emerald-400">{sensorData.room_light === 1 ? 'ON' : 'OFF'}</strong>
              </span>
            </div>
            <StatusBadge 
              type={hasWastage ? 'critical' : isLightOn ? 'info' : 'optimal'} 
              label={hasWastage ? 'Energy Waste' : isLightOn ? 'Active Load' : 'Conserving'} 
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN GRID: LUMINAIRE SIMULATION & DECISION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Simulated Room-Light Indicator & Virtual Room Environment */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Demonstration Luminaire (Arduino Pin D7)
                </h3>
                <p className="text-xs text-slate-400">Physical LED demonstration powered by Arduino digital pin D7</p>
              </div>
              <StatusBadge 
                type={isLightOn ? 'warning' : 'standby'} 
                label={isLightOn ? 'LED LIT (HIGH)' : 'LED DARK (LOW)'} 
              />
            </div>

            {/* Virtual Room Graphic Container */}
            <div className={`relative w-full h-64 rounded-xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center p-6 ${
              isLightOn
                ? 'bg-gradient-to-b from-amber-500/20 via-amber-950/20 to-slate-900 border-amber-500/40 shadow-inner'
                : 'bg-gradient-to-b from-slate-900 to-black border-slate-800'
            }`}>
              {/* Radial Luminaire Glow Effect when ON */}
              {isLightOn && (
                <div className="absolute top-8 w-44 h-44 rounded-full bg-amber-400/25 blur-3xl pointer-events-none animate-pulse" />
              )}

              {/* Suspended Light Fixture SVG */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-1 h-12 bg-slate-700" />
                
                {/* Pendant Lamp Fixture */}
                <div className="relative">
                  <div className={`w-28 h-14 rounded-t-full border border-slate-700 transition-colors ${
                    isLightOn ? 'bg-slate-800' : 'bg-slate-900'
                  }`} />
                  
                  {/* Bulb Element */}
                  <div className={`w-12 h-12 mx-auto -mt-2 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    isLightOn 
                      ? 'bg-amber-300 border-amber-200 text-amber-900 shadow-[0_0_35px_15px_rgba(251,191,36,0.6)]' 
                      : 'bg-slate-800 border-slate-700 text-slate-600'
                  }`}>
                    <Lightbulb className="w-6 h-6" />
                  </div>
                </div>

                {/* Light Cone on Room Floor */}
                <div className={`mt-4 text-center transition-opacity duration-300 ${isLightOn ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="text-xs font-mono font-bold tracking-wide uppercase px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                    {isLightOn ? `Pin D7 Energized: ${energyConfigState?.powerRatingWatts || 9}W Rated Luminaire Active` : 'Pin D7 De-energized: 0W Standby'}
                  </span>
                </div>
              </div>

              {/* Room Occupant Indicator Silhouette */}
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                <Users className={`w-3.5 h-3.5 ${isOccupied ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{isOccupied ? `${peopleCount} Occupant(s) via AI` : 'Zone Vacant'}</span>
              </div>
            </div>
          </div>

          {/* Manual Relay Interactive Simulator Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Hardware Link: {serialState.status === 'CONNECTED' ? 'Web Serial Connected (9600)' : 'Simulation / Standby'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleRoomLight}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                  isLightOn
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {isLightOn ? 'Force Light OFF' : 'Force Light ON'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Visual Decision Matrix & 4 Core Rules */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                  AI Smart Lighting Decision Matrix
                </h3>
                <p className="text-xs text-slate-400">Webcam human detection & LDR daylight harvesting logic</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Rule #{lightingDecision.ruleNumber || 0}
              </span>
            </div>

            {/* Core Rules List */}
            <div className="space-y-3">
              {/* RULE 1 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                lightingDecision.ruleNumber === 1 
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-300">1</span>
                    OCCUPIED + LDR &lt; 500 ADC &rarr; Room LED ON
                  </span>
                  {lightingDecision.ruleNumber === 1 && (
                    <StatusBadge type="warning" label="ACTIVE RULE" size="xs" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                  Human presence detected by webcam and ambient natural light is insufficient (&lt;500 ADC). Turn room LED ON (D7).
                </p>
              </div>

              {/* RULE 2 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                lightingDecision.ruleNumber === 2 
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-300">2</span>
                    OCCUPIED + LDR &ge; 500 ADC &rarr; Room LED OFF
                  </span>
                  {lightingDecision.ruleNumber === 2 && (
                    <StatusBadge type="optimal" label="ACTIVE RULE" size="xs" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                  Person detected, but adequate natural daylight (&ge;500 ADC) satisfies visual requirements. Turn room LED OFF (D7) to harvest solar daylight.
                </p>
              </div>

              {/* RULE 3 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                lightingDecision.ruleNumber === 3 
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-sm' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-300">3</span>
                    UNOCCUPIED + Any LDR &rarr; Room LED OFF
                  </span>
                  {lightingDecision.ruleNumber === 3 && (
                    <StatusBadge type="standby" label="ACTIVE RULE" size="xs" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                  No person detected for &gt;45s (absence timeout elapsed). Room confirmed vacant. Turn room LED OFF (D7).
                </p>
              </div>

              {/* RULE 4 */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                lightingDecision.ruleNumber === 4 
                  ? 'bg-slate-800/80 border-slate-600 shadow-sm' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-300">4</span>
                    UNKNOWN Occupancy &rarr; Safe Fallback (No Auto ON)
                  </span>
                  {lightingDecision.ruleNumber === 4 && (
                    <StatusBadge type="warning" label="ACTIVE RULE" size="xs" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                  Webcam inactive, permission blocked, or model error. Failsafe default withholds automatic ON command.
                </p>
              </div>
            </div>
          </div>

          {/* Active Decision Explanation Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">
              Active Decision Explanation:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {lightingDecision.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartLighting;
