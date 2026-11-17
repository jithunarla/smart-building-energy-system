import React from 'react';
import { 
  Sun, 
  Thermometer, 
  Droplets, 
  Users, 
  Lightbulb, 
  Activity, 
  Cpu, 
  Info, 
  Radio, 
  TrendingUp,
  Sliders,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { SENSOR_CONFIG } from '../data/mockSensorData';
import StatusBadge from '../components/StatusBadge';

export const SensorMonitoring = () => {
  const { 
    mode,
    sensorData, 
    lastMotionTime, 
    motionCount,
    isOccupied,
    inactivityRemaining,
    inactivityTimeout,
    history, 
    // Phase 5 Occupancy Analytics
    todayTriggers,
    hourlyTimeline,
    // Phase 6 Energy Configuration
    energyConfigState,
    updateSensorValue, 
    toggleRoomLight, 
    triggerMotionPulse,
    lightingDecision 
  } = useDashboard();

  const isHardware = mode?.toLowerCase() === 'hardware';
  const lightClass = SENSOR_CONFIG.ldr.classify(sensorData.light_adc);
  const tempClass = SENSOR_CONFIG.dht11.classifyTemp(sensorData.temperature);
  const humClass = SENSOR_CONFIG.dht11.classifyHumidity(sensorData.humidity);

  const isLdrOnline = sensorData.light_adc !== null;
  const isDhtOnline = sensorData.temperature !== null && sensorData.humidity !== null;
  const onlineCount = (isLdrOnline ? 1 : 0) + (isDhtOnline ? 1 : 0) + 2; // PIR + Relay always available

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131B2E] border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-slate-300 font-mono mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="font-medium" style={{ color: entry.color }}>
              {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Hardware Sensor Telemetry & Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream from analog and digital interfaces. Includes historical waveform trends and classification thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
            Sampling: <span className="text-emerald-400">1000 ms</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border ${
            onlineCount === 4
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            Channel Health: <span className="font-bold">{onlineCount} / 4 ONLINE</span>
            {!isDhtOnline && <span className="ml-1 text-rose-400 font-semibold">(DHT11 Fault)</span>}
          </div>
        </div>
      </div>

      {/* Grid of 4 Major Sensors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SENSOR 1: LDR Light Sensor */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">LDR Light Sensor</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Photoresistor (LDR GL5528) • <span className="text-amber-400">Pin A0 (Analog)</span>
                  </p>
                </div>
              </div>
              <StatusBadge type={sensorData.light_adc !== null && sensorData.light_adc >= 500 ? 'optimal' : 'info'} label={lightClass.label} />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">ADC Reading</span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  {sensorData.light_adc !== null ? sensorData.light_adc : '--'}
                </span>
                <span className="text-[10px] text-slate-500 block">Range: 0–1023</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Classification</span>
                <span className="text-xs font-bold text-amber-300 block mt-1">
                  {lightClass.label}
                </span>
                <span className="text-[10px] text-slate-500">Daylight Index</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Approx. Lux</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400">
                  {sensorData.light_adc !== null ? Math.round(sensorData.light_adc * 1.2) : '--'}
                </span>
                <span className="text-[10px] text-slate-500">Estimated Lux</span>
              </div>
            </div>

            {/* Historical Line Chart */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">24-Hour Daylight Waveform</span>
                <span className="font-mono text-slate-400">Daylight cutoff: &ge;500 ADC</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ldrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748B" domain={[0, 1023]} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="light_adc" name="LDR (ADC)" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#ldrGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Slider */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Adjust LDR Reading (ADC) {isHardware && <span className="text-blue-400 text-[10px]">(Hardware Read-Only)</span>}</span>
              <span className="font-mono text-amber-400 font-bold">{sensorData.light_adc} ADC</span>
            </div>
            <input
              type="range"
              min="0"
              max="1023"
              disabled={isHardware}
              value={sensorData.light_adc ?? 500}
              onChange={(e) => updateSensorValue('light_adc', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
            />
          </div>
        </div>

        {/* SENSOR 2: DHT11 Climate Sensor */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">DHT11 Climate Sensor</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Digital Temperature & Humidity • <span className="text-blue-400">Pin D2 (Single-Wire)</span>
                  </p>
                </div>
              </div>
              <StatusBadge 
                type={tempClass.status} 
                label={tempClass.label} 
              />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Temperature</span>
                  <span className="text-rose-400">0°C–50°C</span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-rose-400">
                  {sensorData.temperature !== null && !isNaN(sensorData.temperature) ? (
                    <>
                      {sensorData.temperature.toFixed(1)} <span className="text-base text-slate-400">°C</span>
                    </>
                  ) : (
                    <span className="text-xl text-rose-400">FAULT</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {sensorData.temperature !== null ? 'Target: 21.0°C – 25.5°C' : 'DHT11 disconnected/fault'}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Relative Humidity</span>
                  <span className="text-blue-400">20%–90% RH</span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-blue-400">
                  {sensorData.humidity !== null && !isNaN(sensorData.humidity) ? (
                    <>
                      {sensorData.humidity} <span className="text-base text-slate-400">%</span>
                    </>
                  ) : (
                    <span className="text-xl text-rose-400">FAULT</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {sensorData.humidity !== null ? 'Target: 40% – 60% RH' : 'DHT11 disconnected/fault'}
                </span>
              </div>
            </div>

            {/* Historical Charts */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">24-Hour Climate History</span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-rose-400">■ Temp (°C)</span>
                  <span className="text-blue-400">--- Humidity (%)</span>
                </div>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748B" domain={[15, 80]} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#EF4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Sliders */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Temp (°C) {isHardware && <span className="text-blue-400 text-[10px]">(Live)</span>}</span>
                <span className="font-mono text-rose-400 font-bold">
                  {sensorData.temperature !== null ? `${sensorData.temperature}°C` : 'FAULT'}
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="36"
                step="0.5"
                disabled={isHardware}
                value={sensorData.temperature ?? 25}
                onChange={(e) => updateSensorValue('temperature', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 disabled:opacity-40"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Humidity (%) {isHardware && <span className="text-blue-400 text-[10px]">(Live)</span>}</span>
                <span className="font-mono text-blue-400 font-bold">
                  {sensorData.humidity !== null ? `${sensorData.humidity}%` : 'FAULT'}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                disabled={isHardware}
                value={sensorData.humidity ?? 50}
                onChange={(e) => updateSensorValue('humidity', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* SENSOR 3: AI Webcam Human Detection (Replaces Faulty PIR) */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Human Presence Detection</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Laptop Built-in Webcam • <span className="text-emerald-400">COCO-SSD AI (Replaces PIR)</span>
                  </p>
                </div>
              </div>
              <StatusBadge 
                type={isOccupied ? 'optimal' : 'standby'} 
                label={isOccupied ? 'Occupancy Confirmed' : 'Space Vacant'} 
                pulse={isOccupied}
              />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Occupancy State</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  {isOccupied ? 'OCCUPIED' : 'VACANT'}
                </span>
                <span className="text-[10px] text-slate-500">Optical CV inference</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Last Detected</span>
                <span className="text-xs font-bold font-mono text-white block mt-1">
                  {new Date(lastMotionTime).toLocaleTimeString()}
                </span>
                <span className="text-[10px] text-slate-500">Timestamp</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Today's Triggers</span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  {todayTriggers !== undefined ? todayTriggers : motionCount}
                </span>
                <span className="text-[10px] text-slate-500">Activity events</span>
              </div>
            </div>

            {/* Motion Activity Bar Chart */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">Hourly Occupancy Timeline</span>
                <span className="font-mono text-emerald-400 text-[11px]">24-Hour Day Profile</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyTimeline || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis stroke="#64748B" domain={[0, 60]} tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#131B2E] border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                            <p className="font-semibold text-slate-200 mb-1">{label} ({d.hour}:00 - {d.hour}:59)</p>
                            <p className="text-emerald-400">Occupied: {d.occupiedMinutes} mins</p>
                            <p className="text-slate-400">Unoccupied: {d.unoccupiedMinutes} mins</p>
                            <p className="text-amber-400">Triggers: {d.triggers}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="occupiedMinutes" name="Occupied Mins" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Simulate Occupant Entry:</span>
            <button
              onClick={triggerMotionPulse}
              className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Trigger Occupancy Event
            </button>
          </div>
        </div>

        {/* SENSOR 4: Room Light Actuator (Arduino Pin D7) */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  sensorData.room_light === 1 
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Room Light Actuator</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Demonstration LED • <span className="text-emerald-400">Pin D7 (Digital Output)</span>
                  </p>
                </div>
              </div>
              <StatusBadge 
                type={sensorData.room_light === 1 ? 'warning' : 'optimal'} 
                label={sensorData.room_light === 1 ? 'CIRCUIT ON (D7)' : 'STANDBY OFF (D7)'} 
              />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Arduino Output State</span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  {sensorData.room_light === 1 ? 'HIGH (1)' : 'LOW (0)'}
                </span>
                <span className="text-[10px] text-slate-500">Pin D7 Dedicated Output</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Rated Power Load</span>
                <span className="text-2xl font-extrabold font-mono text-amber-400">
                  {sensorData.room_light === 1 ? `${energyConfigState?.powerRatingWatts || 9} W` : '0 W'}
                </span>
                <span className="text-[10px] text-slate-500">Configured Luminaire Load</span>
              </div>
            </div>

            {/* Current Lighting Decision Details */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">Algorithmic Decision Policy</span>
                <span className="font-mono text-emerald-400 text-[11px]">{lightingDecision.ruleText.split(':')[0]}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {lightingDecision.reason}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Policy Recommendation:</span>
                <span className={`font-mono font-bold ${
                  lightingDecision.recommendedState === sensorData.room_light 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  {lightingDecision.recommendedState === sensorData.room_light ? '✓ State Aligned with Policy' : '⚠ State Mismatched (Energy Waste)'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Toggle Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Manual Circuit Override:</span>
            <button
              onClick={toggleRoomLight}
              className={`px-4 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                sensorData.room_light === 1
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" /> 
              {sensorData.room_light === 1 ? 'Turn Luminaire OFF' : 'Turn Luminaire ON'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SensorMonitoring;
