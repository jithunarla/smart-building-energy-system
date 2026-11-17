import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Users, 
  Thermometer, 
  Droplets, 
  Sun, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Zap,
  Info,
  Activity,
  Cpu
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { RECOMMENDATION_CATEGORIES } from '../data/recommendationRules';
import StatusBadge from '../components/StatusBadge';

export const Recommendations = () => {
  const { recommendations, sensorData, isOccupied } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Recommendations', icon: Sparkles },
    { id: RECOMMENDATION_CATEGORIES.LIGHTING, label: 'Lighting Optimization', icon: Lightbulb },
    { id: RECOMMENDATION_CATEGORIES.OCCUPANCY, label: 'Occupancy Management', icon: Users },
    { id: RECOMMENDATION_CATEGORIES.TEMPERATURE, label: 'Temperature Management', icon: Thermometer },
    { id: RECOMMENDATION_CATEGORIES.HUMIDITY, label: 'Humidity Management', icon: Droplets },
    { id: RECOMMENDATION_CATEGORIES.GENERAL, label: 'General Energy Efficiency', icon: Zap },
  ];

  const filteredRecommendations = recommendations.filter((rec) => {
    if (selectedCategory === 'ALL') return true;
    return rec.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'low':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Smart Energy Conservation & Optimization Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic advisories synthesized from real-time environmental telemetry, occupancy decay timers, and daylight harvesting metrics.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
          Generated Actions: <strong className="font-bold">{recommendations.length} Advisories Active</strong>
        </div>
      </div>

      {/* Realistic Engineering Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5 text-xs text-slate-300">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-200 text-sm mb-1">
            Engineering Principle: Measured Operational Logic
          </h4>
          <p className="leading-relaxed text-slate-400">
            Recommendations focus on verified commercial building controls: harvesting natural daylight lux (&ge;500 ADC), eliminating unoccupied lighting run-hours, and curbing latent thermal discomfort. The dashboard deliberately avoids making uncalibrated kilowatt-hour financial claims prior to dedicated sub-meter CT installation.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#131B2E] border border-slate-800 p-2 rounded-xl">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'ALL' 
            ? recommendations.length 
            : recommendations.filter(r => r.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            No Recommendations in {selectedCategory === 'ALL' ? 'Current System State' : selectedCategory}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Building systems in this domain are operating at optimal efficiency thresholds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRecommendations.map((rec) => (
            <div 
              key={rec.id}
              className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all duration-200 group"
            >
              <div>
                {/* Card Header: Category & Priority */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {rec.category}
                    </span>
                    {rec.relatedSensor && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-500" />
                        {rec.relatedSensor}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase ${getPriorityStyle(rec.priority)}`}>
                    Priority: {rec.priority}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-white text-base mb-3 group-hover:text-emerald-300 transition-colors">
                  {rec.title}
                </h3>

                {/* Detailed Breakdown Fields */}
                <div className="space-y-3 text-xs">
                  {/* 1. Detected Condition */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Detected Sensor Telemetry
                    </span>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                      {rec.detectedCondition}
                    </p>
                  </div>

                  {/* 2. Suggested Action */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Suggested Action
                    </div>
                    <p className="text-emerald-200 leading-relaxed font-medium">
                      {rec.suggestedAction}
                    </p>
                  </div>

                  {/* 3. Reason */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Engineering Rationale
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Expected Benefit */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Expected Benefit: </span>
                  <span className="text-slate-300">{rec.expectedBenefit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
