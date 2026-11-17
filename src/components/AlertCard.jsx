import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ArrowRight, ShieldCheck, X } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const AlertCard = ({ alert, onDismiss }) => {
  const { id, title, severity, sensor, timestamp, description, recommendation, impact, status } = alert;

  const getSeverityConfig = () => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          icon: AlertCircle,
          borderColor: 'border-rose-500/30 hover:border-rose-500/50',
          bgGradient: 'from-rose-950/20 to-transparent',
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          badgeType: 'critical'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          borderColor: 'border-amber-500/30 hover:border-amber-500/50',
          bgGradient: 'from-amber-950/20 to-transparent',
          iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          badgeType: 'warning'
        };
      case 'efficient':
        return {
          icon: CheckCircle2,
          borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
          bgGradient: 'from-emerald-950/20 to-transparent',
          iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          badgeType: 'efficient'
        };
      case 'info':
      default:
        return {
          icon: Info,
          borderColor: 'border-blue-500/30 hover:border-blue-500/50',
          bgGradient: 'from-blue-950/20 to-transparent',
          iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          badgeType: 'info'
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div className={`relative bg-[#131B2E] bg-gradient-to-r ${config.bgGradient} border ${config.borderColor} rounded-xl p-5 transition-all duration-200 shadow-lg shadow-black/20 group`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg border shrink-0 mt-0.5 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-100 text-sm md:text-base">
                {title}
              </h4>
              <StatusBadge type={config.badgeType} label={severity?.toUpperCase()} size="xs" />
              {status && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {status}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Sensor: <strong className="text-slate-300 font-medium">{sensor}</strong></span>
              <span>•</span>
              <span className="font-mono">{timestamp}</span>
              {impact && (
                <>
                  <span>•</span>
                  <span className="text-slate-300 font-medium">Impact: <span className="text-amber-300">{impact}</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={() => onDismiss(id)}
            title="Acknowledge / Dismiss alert"
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 text-xs md:text-sm text-slate-300 leading-relaxed pl-12">
        {description}
      </p>

      {/* Resolution Recommendation */}
      {recommendation && (
        <div className="mt-4 ml-12 p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2.5">
          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-400">Recommended Action: </span>
            <span className="text-slate-300">{recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
