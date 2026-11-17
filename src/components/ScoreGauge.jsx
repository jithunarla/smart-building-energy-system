import React from 'react';

export const ScoreGauge = ({ 
  score = 85, 
  size = 180, 
  strokeWidth = 14, 
  title = "Sustainability Score", 
  subtitle = "Building Energy Performance" 
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 88) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.35)', text: 'text-emerald-400', label: 'OPTIMAL' };
    if (s >= 75) return { stroke: '#14B8A6', glow: 'rgba(20, 184, 166, 0.35)', text: 'text-teal-400', label: 'EFFICIENT' };
    if (s >= 60) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.35)', text: 'text-amber-400', label: 'MODERATE' };
    return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.35)', text: 'text-rose-400', label: 'CRITICAL' };
  };

  const theme = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Dynamic progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${theme.glow})`
            }}
          />
        </svg>

        {/* Center score details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tight ${theme.text}`}>
            {score}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
            / 100 PTS
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 mt-1 rounded-full border border-current/30 ${theme.text} bg-slate-900/60`}>
            {theme.label}
          </span>
        </div>
      </div>

      {title && (
        <div className="text-center mt-3">
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
