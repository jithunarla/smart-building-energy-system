import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Filter, 
  History, 
  RotateCcw, 
  ShieldCheck, 
  BellRing,
  Trash2,
  ZapOff,
  Activity,
  Layers
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { SAMPLE_ALERT_HISTORY } from '../engine/alertEngine';
import { ALERT_CATEGORIES, ALERT_SEVERITY } from '../data/alertRules';
import AlertCard from '../components/AlertCard';
import StatusBadge from '../components/StatusBadge';

export const Alerts = () => {
  const { 
    alerts, 
    resolvedAlerts, 
    allAlerts, 
    alertCounts, 
    dismissAlert, 
    resetAlerts, 
    clearResolvedAlerts 
  } = useDashboard();

  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'HISTORY'

  // Combine live resolved alerts with historical sample entries (avoiding duplicates)
  const combinedHistory = [
    ...resolvedAlerts,
    ...SAMPLE_ALERT_HISTORY.filter(h => !resolvedAlerts.some(r => r.id === h.id))
  ];

  // Filtered live alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity?.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesCategory = selectedCategory === 'ALL' || alert.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSeverity && matchesCategory;
  });

  // Filtered history alerts
  const filteredHistory = combinedHistory.filter((alert) => {
    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity?.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesCategory = selectedCategory === 'ALL' || alert.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSeverity && matchesCategory;
  });

  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: ALERT_CATEGORIES.ENERGY_WASTE, label: 'Energy Waste' },
    { id: ALERT_CATEGORIES.ENVIRONMENTAL, label: 'Environmental' },
    { id: ALERT_CATEGORIES.LIGHTING_ADVISORY, label: 'Lighting Advisory' },
    { id: ALERT_CATEGORIES.SENSOR_FAULT, label: 'Sensor Fault' },
    { id: ALERT_CATEGORIES.OPTIMAL, label: 'Optimal State' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            Energy Waste Alert & Anomaly Management Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rules 1 to 9 continuously evaluating daylight harvesting, vacant zone luminaire run-hours, thermal drift, and sensor integrity.
          </p>
        </div>

        {/* Tab switcher: Live Alerts vs Alert History */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'LIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Active Alerts ({alertCounts?.totalActive ?? alerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Alert History & Resolved ({combinedHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Severity & Category */}
      <div className="space-y-3 bg-[#131B2E] border border-slate-800 p-4 rounded-xl">
        {/* Row 1: Severity Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1 mr-1 font-mono text-[11px]">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>

            <button
              onClick={() => setSelectedSeverity('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedSeverity === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({activeTab === 'LIVE' ? (alertCounts?.totalActive ?? alerts.length) : combinedHistory.length})
            </button>

            <button
              onClick={() => setSelectedSeverity(ALERT_SEVERITY.CRITICAL)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                selectedSeverity === ALERT_SEVERITY.CRITICAL
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Critical ({activeTab === 'LIVE' ? (alertCounts?.critical ?? 0) : combinedHistory.filter(h => h.severity === ALERT_SEVERITY.CRITICAL).length})
            </button>

            <button
              onClick={() => setSelectedSeverity(ALERT_SEVERITY.WARNING)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                selectedSeverity === ALERT_SEVERITY.WARNING
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Warning ({activeTab === 'LIVE' ? (alertCounts?.warning ?? 0) : combinedHistory.filter(h => h.severity === ALERT_SEVERITY.WARNING).length})
            </button>

            <button
              onClick={() => setSelectedSeverity(ALERT_SEVERITY.INFO)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                selectedSeverity === ALERT_SEVERITY.INFO
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-blue-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Info ({activeTab === 'LIVE' ? (alertCounts?.info ?? 0) : combinedHistory.filter(h => h.severity === ALERT_SEVERITY.INFO).length})
            </button>

            <button
              onClick={() => setSelectedSeverity(ALERT_SEVERITY.EFFICIENT)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                selectedSeverity === ALERT_SEVERITY.EFFICIENT
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Efficient ({activeTab === 'LIVE' ? (alertCounts?.efficient ?? 0) : combinedHistory.filter(h => h.severity === ALERT_SEVERITY.EFFICIENT).length})
            </button>
          </div>

          {/* Reset Filters / Clear History Actions */}
          <div className="flex items-center gap-2">
            {(selectedSeverity !== 'ALL' || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedSeverity('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 transition-colors"
                title="Reset filters to ALL"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}

            {activeTab === 'HISTORY' && resolvedAlerts.length > 0 && (
              <button
                onClick={clearResolvedAlerts}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition-colors"
                title="Clear all resolved records"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Resolved ({resolvedAlerts.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'LIVE' ? (
        /* Active Alerts List */
        filteredAlerts.length === 0 ? (
          <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">
              No Active Alerts Matching Criteria
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Building systems and circuits are operating strictly within environmental and energy conservation limits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDismiss={dismissAlert} 
              />
            ))}
          </div>
        )
      ) : (
        /* Historical Alert & Resolution Section */
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Historical Alert & Resolution Log
              </h3>
              <p className="text-xs text-slate-400">
                Archived energy waste warnings, auto-mitigation events, and manual operator resolutions
              </p>
            </div>
            <StatusBadge type="info" label={`${filteredHistory.length} Records`} />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No historical alert entries match the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{item.title}</span>
                      <StatusBadge type={item.severity} label={item.severity?.toUpperCase()} size="xs" />
                      {item.category && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Logged: <span className="text-slate-300">{item.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Resolution: {item.resolutionNote || 'Condition cleared / resolved automatically.'}</span>
                    </div>
                    {item.resolvedAt && (
                      <span className="font-mono text-slate-500">
                        Resolved at: {item.resolvedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
