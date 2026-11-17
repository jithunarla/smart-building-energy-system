import React, { useRef, useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Zap, 
  Timer,
  Eye,
  Camera,
  CameraOff,
  Video,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend 
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { CAMERA_STATUS, OCCUPANCY_STATES, SIMULATION_SCENARIOS } from '../services/occupancyDetectionService';
import StatusBadge from '../components/StatusBadge';

export const Occupancy = () => {
  const { 
    mode,
    sensorData, 
    lastMotionTime, 
    motionCount, 
    history, 
    sustainability, 
    isOccupied,
    effectiveOccupancyState,
    inactivityRemaining,
    inactivityTimeout,
    setInactivityTimeout,
    // AI Webcam capabilities
    aiOccupancy,
    cameraStatus,
    modelStatus,
    occupancyStatus,
    peopleCount,
    detections,
    confidenceThreshold,
    absenceTimeout,
    timeUntilUnoccupied,
    lastPersonTime,
    isCameraActive,
    isAiActive,
    cameraError,
    startCamera,
    stopCamera,
    setConfidenceThreshold,
    selectAiScenario,
    lightingDecision,
    // Phase 5 Occupancy Analytics & Events
    todayTriggers,
    todaySessions,
    occupiedDurationMinutes,
    occupiedDurationFormatted,
    occupancyStartedCount,
    occupancyEndedCount,
    personDetectionCount,
    cameraErrorCount,
    firstActivityTime,
    latestActivityTime,
    latestEventName,
    latestEventDescription,
    hourlyTimeline,
    recentOccupancyEvents,
    clearOccupancyEvents
  } = useDashboard();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedDemoScenario, setSelectedDemoScenario] = useState('PERSON_BRIGHT');

  // Handle Start Camera click
  const handleStartCamera = async () => {
    if (videoRef.current) {
      await startCamera(videoRef.current);
    }
  };

  // Render bounding boxes on overlay canvas whenever detections or video size updates
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isCameraActive && !aiOccupancy.isSimulated) {
      return;
    }

    // Set canvas dimensions matching container or video
    const width = canvas.width;
    const height = canvas.height;

    // Draw detected person bounding boxes
    if (detections && detections.length > 0) {
      detections.forEach((det, idx) => {
        let [x, y, w, h] = det.bbox;

        // If simulated or scaled, normalize
        if (aiOccupancy.isSimulated) {
          x = (x / 400) * width;
          y = (y / 400) * height;
          w = (w / 400) * width;
          h = (h / 400) * height;
        }

        // Draw bounding box
        ctx.strokeStyle = '#10B981'; // Emerald green
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Draw label background
        const label = `Person ${(det.score * 100).toFixed(0)}%`;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = '#10B981';
        ctx.fillRect(x, Math.max(0, y - 22), textWidth + 10, 22);

        // Draw label text
        ctx.fillStyle = '#062817';
        ctx.fillText(label, x + 5, Math.max(15, y - 6));
      });
    }
  }, [detections, isCameraActive, aiOccupancy.isSimulated]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#131B2E] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
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

  // Phase 5: 24-Hour Hourly Timeline Tooltip
  const HourlyTimelineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#131B2E] border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-white font-mono">{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">{data.hour}:00 - {data.hour}:59</span>
          </div>
          <div className="flex items-center justify-between text-emerald-400">
            <span>Occupied Duration:</span>
            <span className="font-mono font-bold">{data.occupiedMinutes} mins</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Unoccupied Duration:</span>
            <span className="font-mono font-bold">{data.unoccupiedMinutes} mins</span>
          </div>
          <div className="flex items-center justify-between text-amber-400 pt-1 border-t border-slate-800 text-[11px]">
            <span>Sessions Started:</span>
            <span className="font-mono font-bold">{data.starts}</span>
          </div>
          <div className="flex items-center justify-between text-blue-400 text-[11px]">
            <span>Peak Occupancy:</span>
            <span className="font-mono font-bold">{data.peakPeople} {data.peakPeople === 1 ? 'person' : 'people'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span>Activity Triggers:</span>
            <span className="font-mono font-bold">{data.triggers}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. ARCHITECTURAL CALLOUT: AI WEBCAM REPLACES FAULTY PIR */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-start gap-3.5 text-xs text-slate-300 shadow-md">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-200 text-sm mb-1">
            Hardware Architecture: Laptop Webcam AI Person Detection
          </h4>
          <p className="leading-relaxed text-slate-400">
            Due to hardware PIR sensor unreliability, human presence detection is performed using the laptop's built-in webcam powered by <strong>TensorFlow.js and COCO-SSD</strong>. The model runs locally in the browser at 30 fps, filtering strictly for the <code className="text-emerald-300 font-mono">person</code> class with configurable confidence (&ge;{confidenceThreshold * 100}%). Arduino digital pin <strong>D7 is dedicated exclusively to the room LED output</strong>.
          </p>
        </div>
      </div>

      {/* 2. AI WEBCAM DETECTION CONSOLE & PREVIEW */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              AI Webcam Human Presence Detection Console
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time computer vision inference driving automated lighting decisions on Arduino Pin D7
            </p>
          </div>

          {/* Status Indicators & Privacy Badge */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              cameraStatus === CAMERA_STATUS.ACTIVE 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : cameraStatus === CAMERA_STATUS.ERROR || cameraStatus === CAMERA_STATUS.PERMISSION_DENIED
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${cameraStatus === CAMERA_STATUS.ACTIVE ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Camera: {cameraStatus}</span>
            </div>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              modelStatus === 'READY' 
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                : modelStatus === 'LOADING'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span>COCO-SSD: {modelStatus}</span>
            </div>

            <span className="hidden lg:inline text-[11px] text-slate-500 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              🔒 100% Local In-Browser Processing
            </span>
          </div>
        </div>

        {/* Camera Feed & Live Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Video Preview & Overlay (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="relative w-full aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Canvas Overlay for Bounding Boxes */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {/* Fallback View when camera is disconnected */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90 text-xs text-slate-400 space-y-3 z-0">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <CameraOff className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">
                      {aiOccupancy.isSimulated ? 'Simulated AI Occupancy Active' : 'Webcam Standby / Disconnected'}
                    </h4>
                    <p className="max-w-md mx-auto text-slate-400 text-[11px] mt-1">
                      {aiOccupancy.isSimulated 
                        ? `Demonstrating "${SIMULATION_SCENARIOS[aiOccupancy.activeScenario]?.title || 'Scenario'}"` 
                        : 'Click "Start Camera" to enable real-time person detection using your laptop webcam, or select a simulated scenario.'}
                    </p>
                  </div>

                  {cameraError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono max-w-sm">
                      ⚠ {cameraError}
                    </div>
                  )}
                </div>
              )}

              {/* On-video HUD overlay */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border shadow ${
                  occupancyStatus === OCCUPANCY_STATES.OCCUPIED 
                    ? 'bg-emerald-500/80 text-white border-emerald-400' 
                    : occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                    : 'bg-amber-500/80 text-amber-950 border-amber-400'
                }`}>
                  {occupancyStatus}
                </span>

                {aiOccupancy.isSimulated && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/80 text-white border border-blue-400 uppercase">
                    Simulated Telemetry
                  </span>
                )}
              </div>

              {/* Bottom right: Detected people counter badge */}
              <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{peopleCount} {peopleCount === 1 ? 'Person' : 'People'} Detected</span>
              </div>
            </div>

            {/* Camera Control Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    onClick={handleStartCamera}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Webcam</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-rose-950"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>Stop Webcam</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Resolution: 640x480 • Rate: ~4 inferences/sec
              </div>
            </div>
          </div>

          {/* Right: Real-time Telemetry, Confidence Slider & Decision (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Box 1: People Count & State */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  AI Occupancy Status
                </span>
                <StatusBadge 
                  type={occupancyStatus === OCCUPANCY_STATES.OCCUPIED ? 'optimal' : occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED ? 'standby' : 'warning'} 
                  label={occupancyStatus}
                  pulse={occupancyStatus === OCCUPANCY_STATES.OCCUPIED}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-3xl font-extrabold font-mono text-white flex items-center gap-2">
                    {peopleCount} <span className="text-xs font-normal text-slate-400">People</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {peopleCount > 0 ? 'Confirmed human presence' : 'Zero persons visible in frame'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Class Filter</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    'person' only
                  </span>
                </div>
              </div>

              {/* Absence Grace Countdown Bar */}
              {peopleCount === 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Absence Grace Countdown:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {timeUntilUnoccupied}s / {absenceTimeout}s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        timeUntilUnoccupied > 0 ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${(timeUntilUnoccupied / absenceTimeout) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {timeUntilUnoccupied > 0 
                      ? 'Occupancy state preserved in case occupant is momentarily outside camera FOV.'
                      : 'Absence timeout elapsed. Room confirmed UNOCCUPIED.'}
                  </p>
                </div>
              )}
            </div>

            {/* Box 2: Controls & Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Detection Parameters
              </span>

              {/* Confidence Threshold Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Confidence Threshold:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0.40"
                  max="0.90"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Absence Timeout Selector */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Absence Timeout:</span>
                <div className="flex items-center gap-1 font-mono">
                  {[30, 45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setInactivityTimeout(sec)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        absenceTimeout === sec
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 3: Automated Lighting Decision Alignment */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Active Lighting Decision:
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  lightingDecision.recommendedState === 1 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {lightingDecision.recommendedState === 1 ? 'ROOM LED ON (D7)' : 'ROOM LED OFF (D7)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                {lightingDecision.reason}
              </p>
            </div>
          </div>
        </div>

        {/* 3. SIMULATED DEMO SCENARIOS PICKER */}
        {mode?.toLowerCase() === 'demo' && (
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Demo Mode: Simulated AI Webcam Scenarios
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Select scenario to verify rules without hardware camera
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.keys(SIMULATION_SCENARIOS).map((key) => {
                const sc = SIMULATION_SCENARIOS[key];
                const isSelected = aiOccupancy.isSimulated && aiOccupancy.activeScenario === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDemoScenario(key);
                      selectAiScenario(key);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-[11px] font-bold line-clamp-1">{sc.title.split(' ')[0]} {sc.title.split(' ')[1]}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{sc.occupancyStatus}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. PHASE 5: TODAY'S TRIGGERS & OCCUPANCY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Triggers Today */}
        <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Triggers</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{todayTriggers || 0}</span>
            <span className="text-xs text-slate-400 font-mono">Events</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-mono font-medium">{occupancyStartedCount || 0} Starts</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">{occupancyEndedCount || 0} Vacancies</span>
          </div>
        </div>

        {/* Metric 2: Today's Occupancy Sessions */}
        <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupancy Sessions</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{todaySessions || 0}</span>
            <span className="text-xs text-slate-400 font-mono">Completed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Current status: <span className="font-mono text-emerald-400 font-bold">{occupancyStatus}</span>
          </div>
        </div>

        {/* Metric 3: Total Occupied Duration Today */}
        <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupied Duration</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{occupiedDurationFormatted || '0 mins'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Total active zone time: <span className="font-mono text-blue-400">{occupiedDurationMinutes || 0} mins</span>
          </div>
        </div>

        {/* Metric 4: Latest Activity Event */}
        <div className="p-4 rounded-xl bg-[#131B2E] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest Activity</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold font-mono text-amber-300 truncate">
            {latestEventName || 'Standby'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Recorded:</span>
            <span className="font-mono text-slate-200">{latestActivityTime || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* 5. 24-HOUR HOURLY OCCUPANCY ACTIVITY TIMELINE & SCORE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 24-Hour Timeline */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Hourly Occupancy Activity Timeline (24 Hours)
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated commercial presence across 12 AM to 11 PM for the current local calendar day
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Occupied Minutes
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyTimeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="label" stroke="#64748B" tick={{ fontSize: 10 }} interval={1} />
                <YAxis stroke="#64748B" domain={[0, 60]} tick={{ fontSize: 11 }} label={{ value: 'Minutes / Hr', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }} />
                <Tooltip content={<HourlyTimelineTooltip />} />
                <Bar dataKey="occupiedMinutes" name="Occupied (mins)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Occupancy Sustainability Rating */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Occupancy Efficiency Score
              </h3>
              <StatusBadge type="optimal" label={`${sustainability.occupancyScore} / 100`} />
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Optical AI Advantage</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Unlike traditional PIR sensors prone to false negatives during stationary work (e.g. typing or reading), computer vision continuously detects static human presence, eliminating unwanted false room shutoffs while guaranteeing prompt vacancy detection upon departure.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Hardware Actuation Link</span>
                <p className="text-[11px] text-slate-300">
                  Room luminaire actuation is delivered directly to Arduino Uno Pin <strong>D7</strong> using newline-delimited serial commands (<code className="text-emerald-300 font-mono">LIGHT_ON</code> / <code className="text-emerald-300 font-mono">LIGHT_OFF</code>) at 9600 baud.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>System: Room 302</span>
            <span>COCO-SSD v2.2</span>
          </div>
        </div>
      </div>

      {/* 6. PHASE 5: RECENT OCCUPANCY ACTIVITY EVENTS LOG */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Occupancy Activity Events ({recentOccupancyEvents?.length || 0})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of computer vision transitions, session boundaries, and grace countdown events
            </p>
          </div>
          <button
            onClick={clearOccupancyEvents}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs font-mono transition-colors"
          >
            Clear Event Log
          </button>
        </div>

        {(!recentOccupancyEvents || recentOccupancyEvents.length === 0) ? (
          <div className="py-10 text-center bg-slate-900/50 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Activity Events Recorded Today</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start the AI Webcam or trigger a simulated scenario above to begin recording live occupancy transitions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Event Type</th>
                  <th className="pb-2 font-medium">Occupancy</th>
                  <th className="pb-2 font-medium">Occupants</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentOccupancyEvents.map((evt) => {
                  const isStart = evt.eventType === 'OCCUPANCY_STARTED';
                  const isEnd = evt.eventType === 'ROOM_BECAME_EMPTY';
                  const isResume = evt.eventType === 'OCCUPANCY_RESUMED';
                  const isError = evt.eventType === 'AI_MODEL_ERROR' || evt.eventType === 'CAMERA_DISCONNECTED';

                  const badgeClass = isStart
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isEnd
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : isResume
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : isError
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeClass}`}>
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={`font-semibold ${
                          evt.occupancyStatus === 'OCCUPIED' ? 'text-emerald-400' : evt.occupancyStatus === 'UNOCCUPIED' ? 'text-slate-400' : 'text-amber-400'
                        }`}>
                          {evt.occupancyStatus}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 whitespace-nowrap font-bold">
                        {evt.peopleCount || 0}
                      </td>
                      <td className="py-2.5 text-slate-300 max-w-md truncate font-sans text-[11px]">
                        {evt.description}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {evt.mode}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Occupancy;
