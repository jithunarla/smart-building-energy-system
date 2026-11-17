import React from 'react';
import StatusBadge from './StatusBadge';

export const SensorCard = ({
  title,
  subtitle,
  model,
  pin,
  value,
  unit = '',
  statusLabel,
  statusType = 'info',
  icon: Icon,
  trend,
  color = 'emerald',
  children,
  onClick
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40',
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#131B2E] border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between min-w-0 h-full"
    >
      <div className="min-w-0">
        {/* Row 1: Icon and StatusBadge cleanly separated on opposite corners */}
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
          {Icon ? (
            <div className={`p-2 sm:p-2.5 rounded-lg border shrink-0 transition-colors ${colorMap[color] || colorMap.emerald}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          ) : <div />}

          {statusLabel && (
            <div className="shrink-0 max-w-[65%] text-right">
              <StatusBadge type={statusType} label={statusLabel} pulse={statusType === 'critical'} size="xs" />
            </div>
          )}
        </div>

        {/* Row 2: Title and Model with complete card width available - zero badge crowding! */}
        <div className="min-w-0 mb-2">
          <h3 className="font-semibold text-slate-100 text-xs sm:text-sm tracking-tight leading-snug break-words" title={title}>
            {title}
          </h3>
          {model && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={`${model} ${pin ? `[${pin}]` : ''}`}>
              {model} {pin && <span className="text-slate-500">[{pin}]</span>}
            </p>
          )}
        </div>

        {/* Row 3: Main Value & Unit Display */}
        <div className="my-2 sm:my-3 flex items-baseline gap-1.5 flex-wrap min-w-0">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono break-all">
            {value}
          </span>
          {unit && (
            <span className="text-xs sm:text-sm font-semibold text-slate-400 shrink-0">
              {unit}
            </span>
          )}
        </div>

        {/* Row 4: Subtitle / Description */}
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Row 5: Trend or custom child elements (charts, gauges, buttons) at bottom */}
      <div>
        {trend && (
          <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 min-w-0">
            <span className="truncate">Telemetry Trend</span>
            <span className="font-medium text-slate-300 font-mono text-[11px] shrink-0 ml-1">{trend}</span>
          </div>
        )}

        {children && (
          <div className="mt-3 pt-3 border-t border-slate-800/70 min-w-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorCard;
