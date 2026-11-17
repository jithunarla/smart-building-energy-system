import React from 'react';

export const StatusBadge = ({ type = 'info', label, size = 'sm', pulse = false }) => {
  const getStyles = () => {
    switch (type.toLowerCase()) {
      case 'critical':
      case 'danger':
      case 'waste':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'warning':
      case 'alert':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'efficient':
      case 'success':
      case 'optimal':
      case 'online':
      case 'active':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'standby':
      case 'off':
      case 'vacant':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
      case 'info':
      case 'blue':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-2 py-0.5' 
    : size === 'md' 
    ? 'text-xs px-3 py-1 font-medium' 
    : 'text-[11px] px-2.5 py-0.5 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border max-w-full ${getStyles()} ${sizeClasses}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-full w-full bg-current"></span>
        </span>
      )}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default StatusBadge;
