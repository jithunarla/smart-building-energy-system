import React, { useState } from 'react';
import { 
  Zap, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Download, 
  FileText, 
  Sliders, 
  Sun, 
  Users, 
  Leaf, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { energyConfig } from '../config/energyConfig';
import { sustainabilityReportService } from '../services/sustainabilityReportService';
import StatusBadge from '../components/StatusBadge';

export const EnergyAnalytics = () => {
  const { 
    mode, 
    energyAnalytics, 
    energyConfigState, 
    updateEnergyConfig, 
    resetEnergyConfig, 
    wasteAnalytics,
    lightingHistory,
    sustainability,
    exportReportCsv,
    exportReportPdf
  } = useDashboard();

  const isHardware = mode?.toLowerCase() === 'hardware';

  // State for timeframe view in charts
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [reportPeriod, setReportPeriod] = useState('daily'); // for export
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Energy configuration form state
  const [cfgWatts, setCfgWatts] = useState(energyConfigState.powerRatingWatts);
  const [cfgTariff, setCfgTariff] = useState(energyConfigState.tariffPerKWh);
  const [cfgSavedMsg, setCfgSavedMsg] = useState(false);

  const analytics = energyAnalytics?.todayAnalytics?.summary || {
    energyConsumedKWh: 0.0252,
    electricityCostINR: 0.20,
    totalLedOnHours: 2.8,
    avoidableHours: 0.35,
    avoidableEnergyKWh: 0.00315,
    avoidableCostINR: 0.03,
    energySavedKWh: 0.0648,
    costSavedINR: 0.52,
    efficiencyPercentage: 88,
    wasteEventsCount: 2
  };

  const alignment = energyAnalytics?.todayAnalytics?.alignment || {
    totalWindowHours: 24,
    occupiedHours: 4.2,
    unoccupiedHours: 19.8,
    ledOnOccupiedHours: 2.45,
    ledOnVacantHours: 0.35,
    ledOnDaylightHours: 0.20
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    updateEnergyConfig({
      powerRatingWatts: Math.max(1, Number(cfgWatts) || 9),
      tariffPerKWh: Math.max(0.1, Number(cfgTariff) || 8)
    });
    setCfgSavedMsg(true);
    setTimeout(() => setCfgSavedMsg(false), 3000);
  };

  const handleResetConfig = () => {
    resetEnergyConfig();
    const def = energyConfig.getConfig();
    setCfgWatts(def.powerRatingWatts);
    setCfgTariff(def.tariffPerKWh);
    setCfgSavedMsg(true);
    setTimeout(() => setCfgSavedMsg(false), 3000);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131B2E] border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-slate-200 border-b border-slate-700/60 pb-1 font-mono">{label}</p>
          {payload.map((entry, index) => (
            <div key={`tip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-100">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format data for Occupancy vs Lighting chart
  const occupancyLightingData = [
    {
      category: 'Space State',
      'Occupied Duration': alignment.occupiedHours,
      'Unoccupied Duration': alignment.unoccupiedHours
    },
    {
      category: 'Lighting Usage',
      'Task Illuminance (Useful)': alignment.ledOnOccupiedHours,
      'Vacant Waste (Avoidable)': alignment.ledOnVacantHours,
      'Daylight Waste (Avoidable)': alignment.ledOnDaylightHours
    }
  ];

  const handlePdfDownload = () => {
    exportReportPdf(reportPeriod, reportPeriod === 'custom' ? { startDate: customStart, endDate: customEnd } : null);
  };

  const handleCsvDownload = () => {
    exportReportCsv(reportPeriod, reportPeriod === 'custom' ? { startDate: customStart, endDate: customEnd } : null);
  };

  return (
    <div className="space-y-6">
      {/* 1. TELEMETRY & TRANSPARENCY NOTICE BANNER */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 shadow-md">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-slate-100 text-sm">
                Advanced Energy Analytics & Savings Engine (Phase 6)
              </h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isHardware
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isHardware ? 'HARDWARE RUNTIME TELEMETRY' : 'DEMO SIMULATION MODEL'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Energy consumption and cost figures represent mathematical estimates derived from recorded room LED runtime intervals on Arduino Pin D7 ({energyConfigState.powerRatingWatts} W rated power at {energyConfigState.currencySymbol}{energyConfigState.tariffPerKWh}/kWh). The system does not utilize direct electrical current or power sensors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePdfDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Report
          </button>
          <button
            onClick={handleCsvDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            CSV Data
          </button>
        </div>
      </div>

      {/* 2. SECTION A: EXECUTIVE ENERGY SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Energy Consumed */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Energy Consumed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white font-mono">{analytics.energyConsumedKWh}</span>
            <span className="text-xs font-semibold text-slate-400">kWh</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Formula: (P × t) / 1000</span>
            <span className="text-emerald-400 font-mono font-bold">Est.</span>
          </div>
        </div>

        {/* Card 2: Electricity Cost */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Electricity Cost</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white font-mono">
              {energyConfigState.currencySymbol}{analytics.electricityCostINR}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tariff: {energyConfigState.currencySymbol}{energyConfigState.tariffPerKWh}/kWh</span>
            <span className="text-teal-400 font-mono font-bold">INR</span>
          </div>
        </div>

        {/* Card 3: LED Operating Hours */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">LED Operating Hours</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white font-mono">{analytics.totalLedOnHours}</span>
            <span className="text-xs font-semibold text-slate-400">hrs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Off: {analytics.totalLedOffHours}h</span>
            <span className="text-blue-400 font-mono font-bold">Pin D7</span>
          </div>
        </div>

        {/* Card 4: Avoidable Energy Waste */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avoidable Waste</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">{analytics.avoidableEnergyKWh}</span>
            <span className="text-xs font-semibold text-slate-400">kWh</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300/80 flex items-center justify-between">
            <span>Cost: {energyConfigState.currencySymbol}{analytics.avoidableCostINR}</span>
            <span className="text-rose-400 font-mono font-bold">{analytics.avoidableHours}h waste</span>
          </div>
        </div>

        {/* Card 5: Estimated Savings */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Savings</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{analytics.energySavedKWh}</span>
            <span className="text-xs font-semibold text-slate-400">kWh</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 flex items-center justify-between">
            <span>Saved: {energyConfigState.currencySymbol}{analytics.costSavedINR}</span>
            <span className="font-mono font-bold">{analytics.efficiencyPercentage}% eff.</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION B: ENERGY CONSUMPTION TRENDS (Recharts) */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Energy Consumption & Cost Trends
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical energy (kWh), electricity cost ({energyConfigState.currencySymbol}), and avoidable waste over time.
            </p>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'daily'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'hover:text-white hover:bg-slate-800'
              }`}
            >
              24-Hour Daily
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'hover:text-white hover:bg-slate-800'
              }`}
            >
              7-Day Weekly
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'hover:text-white hover:bg-slate-800'
              }`}
            >
              Monthly Rollup
            </button>
          </div>
        </div>

        {/* Dynamic Recharts Chart */}
        <div className="h-72 mt-5">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'daily' ? (
              <BarChart data={energyAnalytics?.hourlyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="onMinutes" name="LED Active (Minutes)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avoidableMinutes" name="Avoidable Waste (Mins)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeTab === 'weekly' ? (
              <BarChart data={energyAnalytics?.weeklyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="dayName" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="energyConsumedKWh" name="Energy Consumed (kWh)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avoidableEnergyKWh" name="Avoidable Energy (kWh)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="energySavedKWh" name="Energy Saved (kWh)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={energyAnalytics?.monthlyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="weekLabel" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="energyConsumedKWh" name="Weekly Energy (kWh)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avoidableEnergyKWh" name="Avoidable Waste (kWh)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. SECTION C & D: OCCUPANCY VS LIGHTING & ENERGY WASTE ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Occupancy vs Lighting Correlation */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                Occupancy vs Lighting Usage
              </h3>
              <StatusBadge type="optimal" label="Synchronized" />
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Cross-references AI camera presence sessions against confirmed Pin D7 room LED operating intervals.
            </p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyLightingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10.5px' }} />
                  <Bar dataKey="Occupied Duration" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Unoccupied Duration" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Task Illuminance (Useful)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Vacant Waste (Avoidable)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Daylight Waste (Avoidable)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Task Lighting</span>
              <span className="font-mono font-bold text-teal-400 text-sm">{alignment.ledOnOccupiedHours}h</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vacant Drain</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{alignment.ledOnVacantHours}h</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Daylight Waste</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{alignment.ledOnDaylightHours}h</span>
            </div>
          </div>
        </div>

        {/* Right: Energy Waste Vector Breakdown */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Intelligent Energy Waste Analysis
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {wasteAnalytics?.totalWasteEventsCount || 0} Waste Events
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-3">
              Discrete operational inefficiencies classified by presence and ambient daylight telemetry.
            </p>

            <div className="space-y-2.5">
              {/* Vector 1: Vacant Room Lighting */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <h5 className="font-bold text-slate-200 text-xs">Unoccupied Space Lighting Drain</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Room LED active after 30s absence timeout. Avoidable runtime: <strong>{alignment.ledOnVacantHours}h</strong>.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                  {energyConfigState.powerRatingWatts} W
                </span>
              </div>

              {/* Vector 2: Daylight Harvesting Inefficiency */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h5 className="font-bold text-slate-200 text-xs">Daylight Harvesting Inefficiency</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    LDR indicates adequate solar illuminance (≥ 500 ADC), but LED remained active for <strong>{alignment.ledOnDaylightHours}h</strong>.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                  {energyConfigState.powerRatingWatts} W
                </span>
              </div>

              {/* Vector 3: Theoretical Baseline Comparison */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <h5 className="font-bold text-emerald-300 text-xs">Automated Energy Conservation</h5>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Smart AI automation prevented an estimated <strong>{analytics.energySavedKWh} kWh</strong> ({energyConfigState.currencySymbol}{analytics.costSavedINR}) compared to an unmanaged baseline.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  {analytics.efficiencyPercentage}% EFF
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Avoidable Electricity Drain:</span>
            <span className="font-mono font-bold text-rose-400 text-sm">
              {energyConfigState.currencySymbol}{analytics.avoidableCostINR} ({analytics.avoidableEnergyKWh} kWh)
            </span>
          </div>
        </div>
      </div>

      {/* 5. SECTION E: SMART ENERGY RECOMMENDATIONS */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              Evidence-Based Energy Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Actionable optimization measures derived from confirmed lighting intervals and AI camera presence.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {energyAnalytics?.recommendations?.length || 0} Suggestions Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {(energyAnalytics?.recommendations || []).map((rec, idx) => (
            <div key={rec.id || idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  {rec.title}
                </h4>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                  rec.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  rec.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  rec.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {rec.reason}
              </p>
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Estimated Impact:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {rec.potentialEnergyImpactKWh > 0 ? `${rec.potentialEnergyImpactKWh} kWh (${energyConfigState.currencySymbol}${rec.potentialCostImpactINR})` : 'Zero Operational Cost'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SECTION F: CENTRALIZED ENERGY CONFIGURATION (SETTINGS) */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Centralized Energy Parameters & Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure rated luminaire power and commercial electricity tariffs. Default: 9 W LED, ₹8.00/kWh.
            </p>
          </div>
          {cfgSavedMsg && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Parameters Applied
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Room LED Power Rating (Watts)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="500"
              value={cfgWatts}
              onChange={(e) => setCfgWatts(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Default: 9 W on Arduino Pin D7</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Electricity Tariff (₹ / kWh)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={cfgTariff}
              onChange={(e) => setCfgTariff(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Default: ₹8.00 per kWh (INR)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Currency & Unit
            </label>
            <input
              type="text"
              disabled
              value="INR (₹) / kWh"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 font-mono text-sm cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Indian Rupee (Standard)</span>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleResetConfig}
              title="Reset to 9 W & ₹8/kWh"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 7. SECTION G: REPORT GENERATOR & EXPORT PANEL */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Downloadable Sustainability & Energy Audit Report
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export verified executive documentation in PDF or raw data audit logs in CSV format.
            </p>
          </div>

          {/* Period Selection */}
          <div className="flex items-center gap-2">
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="daily">Daily Report (Today)</option>
              <option value="weekly">Weekly Report (Last 7 Days)</option>
              <option value="monthly">Monthly Report (Current Month)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {reportPeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Reports compile all 14 required analytics parameters including executive summaries, interval tracking tables, occupancy correlation matrices, and data limitation disclosures.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePdfDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
            <button
              onClick={handleCsvDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export CSV Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyAnalytics;
