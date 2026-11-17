import React from 'react';
import { 
  Sun, 
  Thermometer, 
  Droplets, 
  Users, 
  Lightbulb, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Timer,
  CheckCircle2, 
  Zap, 
  Leaf,
  Activity,
  Layers,
  Sparkles,
  ZapOff
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
import SensorCard from '../components/SensorCard';
import AlertCard from '../components/AlertCard';
import ScoreGauge from '../components/ScoreGauge';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const Overview = () => {
  const { 
    sensorData, 
    lastMotionTime, 
    motionCount, 
    history, 
    alerts, 
    alertCounts,
    energyWaste,
    recommendations,
    sustainability, 
    lightingDecision,
    isOccupied,
    effectiveOccupancyState,
    occupancyStatus,
    peopleCount,
    cameraStatus,
    isCameraActive,
    timeUntilUnoccupied,
    absenceTimeout,
    inactivityRemaining,
    inactivityTimeout,
    toggleRoomLight,
    triggerMotionPulse,
    // Phase 5 Occupancy Analytics
    todayTriggers,
    todaySessions,
    occupiedDurationMinutes,
    occupiedDurationFormatted,
    latestEventName,
    latestActivityTime,
    hourlyTimeline
  } = useDashboard();

  const lightClass = SENSOR_CONFIG.ldr.classify(sensorData.light_adc);
  const tempClass = SENSOR_CONFIG.dht11.classifyTemp(sensorData.temperature);
  const humClass = SENSOR_CONFIG.dht11.classifyHumidity(sensorData.humidity);
  const isDaylightSufficient = sensorData.light_adc !== null && sensorData.light_adc >= SENSOR_CONFIG.ldr.daylightHarvestingThreshold;

  // Custom Dark Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131B2E] border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
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
      {/* 1. TOP SUMMARY CARDS (6 Cards - Reusable Layout Without Text Overlap) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Card 1: Light Intensity */}
        <SensorCard
          title="Light Intensity"
          model="LDR GL5528"
          pin="A0"
          value={sensorData.light_adc !== null ? sensorData.light_adc : '--'}
          unit={sensorData.light_adc !== null ? "ADC" : ""}
          statusLabel={lightClass.label}
          statusType={lightClass.isSufficient ? 'optimal' : 'info'}
          icon={Sun}
          color="amber"
          subtitle={sensorData.light_adc !== null ? `Approx. ${Math.round(sensorData.light_adc * 1.2)} Lux ambient luminance` : 'Awaiting sensor stream'}
        />

        {/* Card 2: Temperature */}
        <SensorCard
          title="Temperature"
          model="DHT11 Sensor"
          pin="D2"
          value={sensorData.temperature !== null && !isNaN(sensorData.temperature) ? sensorData.temperature.toFixed(1) : '--'}
          unit={sensorData.temperature !== null ? "°C" : ""}
          statusLabel={sensorData.temperature !== null ? tempClass.label : "Sensor Fault"}
          statusType={sensorData.temperature !== null ? tempClass.status : "critical"}
          icon={Thermometer}
          color={sensorData.temperature === null ? "rose" : sensorData.temperature > 28 ? "rose" : "blue"}
          subtitle={sensorData.temperature !== null ? "Target comfort: 21.0°C – 25.5°C" : "DHT11 signal missing or cable disconnected"}
        />

        {/* Card 3: Relative Humidity */}
        <SensorCard
          title="Relative Humidity"
          model="DHT11 Sensor"
          pin="D2"
          value={sensorData.humidity !== null && !isNaN(sensorData.humidity) ? sensorData.humidity : '--'}
          unit={sensorData.humidity !== null ? "%" : ""}
          statusLabel={sensorData.humidity !== null ? humClass.label : "Sensor Fault"}
          statusType={sensorData.humidity !== null ? humClass.status : "critical"}
          icon={Droplets}
          color={sensorData.humidity === null ? "rose" : "blue"}
          subtitle={sensorData.humidity !== null ? "Comfort envelope: 40% – 60% RH" : "DHT11 signal missing or cable disconnected"}
        />

        {/* Card 4: Human Occupancy (AI Webcam) */}
        <SensorCard
          title="Human Occupancy"
          model="Webcam COCO-SSD"
          pin="USB Cam"
          value={peopleCount > 0 ? `${peopleCount} ${peopleCount === 1 ? 'Person' : 'People'}` : (occupancyStatus || 'UNKNOWN')}
          statusLabel={occupancyStatus || 'UNKNOWN'}
          statusType={occupancyStatus === 'OCCUPIED' ? 'optimal' : occupancyStatus === 'UNKNOWN' ? 'warning' : 'standby'}
          icon={Users}
          color="emerald"
          subtitle={
            occupancyStatus === 'OCCUPIED' 
              ? (peopleCount > 0 ? `${peopleCount} person detected via AI` : `Absence grace: ${timeUntilUnoccupied}s hold`)
              : occupancyStatus === 'UNKNOWN'
              ? 'Webcam disconnected / standby'
              : 'Space confirmed unoccupied'
          }
        />

        {/* Card 5: Room Light Status (Pin D7) */}
        <SensorCard
          title="Room Luminaire"
          model="Arduino D7"
          pin="Pin D7"
          value={sensorData.room_light === 1 ? 'POWER ON' : 'STANDBY OFF'}
          statusLabel={sensorData.room_light === 1 ? (isDaylightSufficient ? 'Daylight Waste' : 'Circuit ON') : 'Standby Conserving'}
          statusType={sensorData.room_light === 1 ? (isDaylightSufficient ? 'critical' : 'info') : 'optimal'}
          icon={Lightbulb}
          color={sensorData.room_light === 1 ? (isDaylightSufficient ? 'rose' : 'amber') : 'emerald'}
          subtitle={sensorData.room_light === 1 ? (isDaylightSufficient ? 'Wasting daylight power on D7' : 'Illumination active on D7') : 'Zero luminaire load on D7'}
        />

        {/* Card 6: Sustainability Score */}
        <SensorCard
          title="Sustainability"
          model="BMS Composite"
          pin="Index"
          value={sustainability.overallScore}
          unit="/100"
          statusLabel={sustainability.ratingLabel.split('/')[0].trim()}
          statusType={sustainability.overallScore >= 80 ? 'optimal' : sustainability.overallScore >= 60 ? 'warning' : 'critical'}
          icon={Leaf}
          color="emerald"
          subtitle={sustainability.lightingStatus}
        />
      </section>

      {/* 2. MAIN SECTION: SECTION A (Environmental Monitoring) & SECTION E (Sustainability Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: SECTION A: Environmental Monitoring Charts */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Section A: Environmental Monitoring
              </h2>
              <p className="text-xs text-slate-400">
                24-Hour telemetry history: Natural Light Intensity (ADC), Temperature (°C), and Humidity (%)
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Live Historical Feed
            </span>
          </div>

          <div className="space-y-6">
            {/* Light Intensity Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Natural Light Intensity (0–1023 ADC)
                </span>
                <span className="text-xs font-mono text-amber-400">
                  Current: {sensorData.light_adc !== null ? `${sensorData.light_adc} ADC` : 'Standby'}
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" domain={[0, 1023]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="light_adc" name="Light ADC" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#lightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Combined Temperature & Humidity Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature (°C) & Humidity (%) Trends
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-rose-400">
                    Temp: {sensorData.temperature !== null && !isNaN(sensorData.temperature) ? `${sensorData.temperature.toFixed(1)}°C` : 'FAULT'}
                  </span>
                  <span className="text-blue-400">
                    Hum: {sensorData.humidity !== null && !isNaN(sensorData.humidity) ? `${sensorData.humidity}%` : 'FAULT'}
                  </span>
                </div>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" domain={[15, 80]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#EF4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: SECTION E: Sustainability Overview */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Section E: Sustainability
              </h2>
              <StatusBadge type={sustainability.overallScore >= 75 ? 'optimal' : 'warning'} label={sustainability.ratingLabel.split('/')[0]} />
            </div>

            {/* Circular Gauge */}
            <ScoreGauge 
              score={sustainability.overallScore} 
              size={170} 
              strokeWidth={13} 
              title="Building Efficiency Index"
              subtitle={sustainability.lightingStatus}
            />

            {/* Subsystem Efficiency Breakdowns */}
            <div className="mt-5 space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lighting Efficiency</span>
                <span className="font-mono font-bold text-slate-200">{sustainability.lightingScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${sustainability.lightingScore > 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${sustainability.lightingScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Occupancy Alignment</span>
                <span className="font-mono font-bold text-slate-200">{sustainability.occupancyScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${sustainability.occupancyScore > 75 ? 'bg-teal-400' : 'bg-amber-400'}`}
                  style={{ width: `${sustainability.occupancyScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thermal Comfort</span>
                <span className="font-mono font-bold text-slate-200">{sustainability.tempScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-blue-400"
                  style={{ width: `${sustainability.tempScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Energy Saving Summary Box */}
          <div className="mt-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conservation Summary
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {sustainability.lightingSummary} Estimated avoided luminaire operation: <strong>~{sustainability.estimatedDailyAvoidedBurnHours} hrs/day</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECTION B (AI Occupancy) & SECTION C (Smart Lighting Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION B: Occupancy Overview (AI Webcam) */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Section B: AI Occupancy Overview
            </h2>
            <Link to="/occupancy" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
              View Camera Console <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current State */}
            <div className={`p-4 rounded-xl border ${
              occupancyStatus === 'OCCUPIED' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : occupancyStatus === 'UNKNOWN'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Zone Occupancy State</span>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  occupancyStatus === 'OCCUPIED' 
                    ? 'bg-emerald-400 animate-pulse' 
                    : occupancyStatus === 'UNKNOWN'
                    ? 'bg-amber-400'
                    : 'bg-slate-600'
                }`} />
                <span className="text-xl font-bold font-mono text-white">
                  {occupancyStatus || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {occupancyStatus === 'OCCUPIED' 
                  ? `${peopleCount} person(s) detected via laptop webcam.` 
                  : occupancyStatus === 'UNKNOWN'
                  ? 'Camera disconnected or model initializing.'
                  : `Space vacant. Absence timer expired.`}
              </p>
            </div>

            {/* People Count & Absence Grace Timer */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">Human Presence</span>
                <span className="text-2xl font-mono font-bold text-slate-200">
                  {peopleCount} <span className="text-sm font-normal text-slate-400">Detected</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inference Source: <strong className="text-emerald-400 font-mono">COCO-SSD v2.2</strong>
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Absence Grace Window</span>
                <span className="font-mono text-emerald-400 font-bold">{timeUntilUnoccupied}s / {absenceTimeout}s</span>
              </div>
            </div>
          </div>

          {/* 4-Metric Activity Strip (Phase 5) */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Today's Triggers</span>
              <span className="text-base font-bold font-mono text-emerald-400">{todayTriggers || 0}</span>
              <span className="text-[10px] text-slate-500 block">Events today</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Sessions</span>
              <span className="text-base font-bold font-mono text-teal-400">{todaySessions || 0}</span>
              <span className="text-[10px] text-slate-500 block">Occupied periods</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Occupied</span>
              <span className="text-base font-bold font-mono text-blue-400 truncate block">{occupiedDurationFormatted || '0m'}</span>
              <span className="text-[10px] text-slate-500 block">Active zone time</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Latest Activity</span>
              <span className="text-xs font-bold font-mono text-amber-300 truncate block">{latestActivityTime || '--:--'}</span>
              <span className="text-[10px] text-slate-500 truncate block">{latestEventName || 'Standby'}</span>
            </div>
          </div>

          {/* 24-Hour Hourly Timeline Preview */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Hourly Occupancy Activity (24h)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">12 AM - 11 PM</span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTimeline || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1E293B" />
                  <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 8 }} interval={3} />
                  <YAxis stroke="#64748B" domain={[0, 60]} tick={{ fontSize: 9 }} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#131B2E] border border-slate-700 p-2 rounded shadow-xl text-[11px] font-mono">
                          <div className="font-bold text-white">{label}</div>
                          <div className="text-emerald-400">Occupied: {d.occupiedMinutes}m</div>
                          <div className="text-slate-400">Unoccupied: {d.unoccupiedMinutes}m</div>
                          <div className="text-amber-400">Triggers: {d.triggers}</div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="occupiedMinutes" fill="#10B981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick interactive test button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Detection: Laptop Webcam • Absence Timeout: {absenceTimeout}s</span>
            <Link
              to="/occupancy"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors font-mono"
            >
              Open Camera Feed
            </Link>
          </div>
        </div>

        {/* SECTION C: Smart Lighting Status */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Section C: Smart Lighting Status
              </h2>
              <Link to="/smart-lighting" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
                Rule Matrix <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Circuit State */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Demonstration Luminaire</span>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${sensorData.room_light === 1 ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-slate-600'}`} />
                  <span className="text-lg font-bold font-mono text-white">
                    {sensorData.room_light === 1 ? 'LED ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Arduino Pin: <span className="font-mono text-emerald-300">D7</span> | Load: <span className="font-mono text-slate-300">Demonstration LED</span>
                </div>
              </div>

              {/* Natural Daylight Availability */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-1">Natural Daylight Availability</span>
                <div className="text-lg font-bold font-mono text-slate-200">
                  {sensorData.light_adc !== null ? `${sensorData.light_adc} ADC` : '-- ADC'}
                </div>
                <div className="mt-2 text-xs">
                  {isDaylightSufficient ? (
                    <span className="text-emerald-400 font-medium">✓ Sufficient daylight available (&ge;500 ADC)</span>
                  ) : (
                    <span className="text-amber-400 font-medium">⚠ Low daylight; supplementary lighting permitted</span>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Logic Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-300">Active Decision Reason:</span>
                <span className="font-mono text-emerald-400 text-[11px]">{lightingDecision.ruleText}</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {lightingDecision.reason}
              </p>
            </div>
          </div>

          {/* Quick Toggle Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Actuator: Pin D7</span>
            <button
              onClick={toggleRoomLight}
              className={`px-3 py-1 rounded-lg border font-mono transition-colors ${
                sensorData.room_light === 1
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Toggle Light: {sensorData.room_light === 1 ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. SECTION D: Recent Alerts & Primary Recommendation */}
      <section className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Section D: Real-Time Anomaly & Waste Alerts
              {(alertCounts?.totalActive ?? alerts.length) > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {alertCounts?.totalActive ?? alerts.length} Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously evaluates daylight wastage, unoccupied room illumination, and climate thresholds
            </p>
          </div>
          <Link to="/alerts" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
            Full Alert Center ({alertCounts?.totalActive ?? alerts.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* High-Visibility Active Energy Waste Warning Banner */}
        {energyWaste?.hasWaste && (
          <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ZapOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-rose-200 uppercase tracking-wide text-[11px] block">
                  Active Energy Wastage Detected — {energyWaste.wastedWatts}W Luminaire Load
                </span>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  {energyWaste.reasons?.join('; ') || 'Artificial lighting energized contrary to conservation policies.'}
                </p>
              </div>
            </div>
            <Link 
              to="/smart-lighting"
              className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 font-mono text-[11px] transition-colors"
            >
              Resolve in Lighting Control
            </Link>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="py-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">Zero Anomalies Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Building systems are operating strictly within energy conservation parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}

        {/* Highlighted Live Sustainability Recommendation */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{recommendations[0].title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    {recommendations[0].category}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{recommendations[0].suggestedAction}</p>
              </div>
            </div>
            <Link
              to="/recommendations"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap flex items-center gap-1 shrink-0 self-end sm:self-center"
            >
              View All ({recommendations.length}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Overview;
