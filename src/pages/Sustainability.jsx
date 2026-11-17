import React from 'react';
import { 
  BarChart3, 
  Leaf, 
  Sun, 
  Users, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Info, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ZapOff, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { WEEKLY_ANALYTICS_DATA } from '../data/mockSensorData';
import ScoreGauge from '../components/ScoreGauge';
import StatusBadge from '../components/StatusBadge';

export const Sustainability = () => {
  const { mode, sustainability, history, alerts } = useDashboard();
  const isHardware = mode?.toLowerCase() === 'hardware';

  // Custom Chart Tooltip
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

  const criticalWasteAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const warningAlerts = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* 1. MANDATORY TELEMETRY NOTICE BANNER */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-start gap-3.5 text-xs text-slate-300 shadow-md">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-200 text-sm">
              {isHardware ? 'Hardware Mode Analytics: Live Serial Stream' : 'Demo Mode Analytics: Realistic Simulation Model'}
            </h4>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isHardware
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {isHardware ? 'WEB SERIAL TELEMETRY' : 'SIMULATED TELEMETRY'}
            </span>
          </div>
          <p className="leading-relaxed text-slate-400">
            {isHardware 
              ? 'Composite sustainability metrics, thermal comfort, and lighting efficiency scores are dynamically computed from live telemetry transmitted by the Arduino Uno R3 controller.' 
              : 'Initial analytics, historical waveforms, and efficiency indices are compiled using verified simulation models and sample datasets.'}
          </p>
        </div>
      </div>

      {/* 2. OVERALL SCORE & SUBSYSTEM EFFICIENCY SCORES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Overall Score Circular Gauge */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Composite Sustainability Score
            </h3>
            <StatusBadge type={sustainability.overallScore >= 75 ? 'optimal' : 'warning'} label="0–100 Scale" />
          </div>

          <div className="my-3">
            <ScoreGauge 
              score={sustainability.overallScore} 
              size={190} 
              strokeWidth={14} 
              title="Building Efficiency Rating"
              subtitle={sustainability.ratingLabel}
            />
          </div>

          <div className="w-full p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            Weighted Algorithm: <span className="text-slate-300">Lighting (40%) + Occupancy (25%) + Temp (20%) + Humidity (15%)</span>
          </div>
        </div>

        {/* Right 2 Cols: 4 Component Efficiency Cards + Estimated Savings Placeholder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lighting Efficiency */}
            <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" /> Lighting Efficiency Score
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {sustainability.lightingScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${sustainability.lightingScore >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${sustainability.lightingScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{sustainability.lightingSummary}</p>
            </div>

            {/* Occupancy Efficiency */}
            <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" /> Occupancy Alignment Score
                </span>
                <span className="text-xs font-mono font-bold text-teal-400">
                  {sustainability.occupancyScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${sustainability.occupancyScore >= 75 ? 'bg-teal-400' : 'bg-amber-400'}`}
                  style={{ width: `${sustainability.occupancyScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">PIR motion synchronization with lighting circuits</p>
            </div>

            {/* Temperature Comfort */}
            <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-400" /> Temperature Comfort Score
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {sustainability.tempScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full bg-blue-400"
                  style={{ width: `${sustainability.tempScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Target envelope: 21.0°C – 25.5°C</p>
            </div>

            {/* Humidity Comfort */}
            <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" /> Humidity Comfort Score
                </span>
                <span className="text-xs font-mono font-bold text-blue-300">
                  {sustainability.humidityScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full bg-blue-400"
                  style={{ width: `${sustainability.humidityScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Target relative humidity: 40% – 60%</p>
            </div>
          </div>

          {/* ESTIMATED LIGHTING ENERGY SAVINGS PLACEHOLDER */}
          <div className="p-5 rounded-xl bg-[#131B2E] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ZapOff className="w-4 h-4 text-amber-400" />
                Estimated Lighting Energy Savings Placeholder
              </h4>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Phase 1 Calculation Model
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Avoided Luminaire Operation</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  ~{sustainability.estimatedDailyAvoidedBurnHours} hrs/day
                </span>
                <span className="text-[10px] text-slate-500 block">Daylight & timeout shutoffs</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Benchmark Fixture Load</span>
                <span className="text-xl font-extrabold font-mono text-white">
                  120 Watts
                </span>
                <span className="text-[10px] text-slate-500 block">Commercial zone baseline</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Calculated Emission Abatement</span>
                <span className="text-xl font-extrabold font-mono text-teal-400">
                  ~{sustainability.estimatedAvoidedCO2Grams} g CO₂/day
                </span>
                <span className="text-[10px] text-slate-500 block">Grid carbon intensity model</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS: DAILY EFFICIENCY TREND & WEEKLY SENSOR TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Efficiency Trend Chart */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Daily Efficiency Trend (24-Hour Profile)
              </h3>
              <p className="text-xs text-slate-400">Continuous sustainability index evaluated over hourly intervals</p>
            </div>
            <StatusBadge type="optimal" label="24-Hour Sample" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="efficiency" name="Efficiency Score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#effGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Sensor & Waste Trends Chart */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Weekly Sensor Trends & Energy Waste Duration
              </h3>
              <p className="text-xs text-slate-400">Mon–Sun daylight ADC vs unnecessary lighting minutes</p>
            </div>
            <StatusBadge type="info" label="7-Day Sample" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Bar dataKey="wasteMinutes" name="Waste Minutes" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sustainabilityScore" name="Sustainability Score" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. ENERGY-WASTE ALERT COUNT BREAKDOWN */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Energy-Waste Alert Distribution Summary
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Active System Anomalies: <strong className="text-white">{alerts.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
              Critical Energy Waste
            </span>
            <div className="text-2xl font-extrabold font-mono text-rose-400">
              {criticalWasteAlerts}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Daylight / vacant room burn
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
              Environmental Warnings
            </span>
            <div className="text-2xl font-extrabold font-mono text-amber-400">
              {warningAlerts}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Temperature & humidity drift
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Efficient Operation States
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {alerts.filter((a) => a.severity === 'efficient').length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Active daylight harvesting
            </span>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
              Advisories & Normal Info
            </span>
            <div className="text-2xl font-extrabold font-mono text-blue-400">
              {alerts.filter((a) => a.severity === 'info').length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Routine task lighting events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sustainability;
