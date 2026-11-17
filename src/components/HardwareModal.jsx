import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  X, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Info, 
  Terminal, 
  Radio, 
  RefreshCw,
  Power,
  Trash2,
  Send,
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { HARDWARE_STATUS, SERIAL_CONFIG } from '../services/serialService';
import StatusBadge from './StatusBadge';

export const HardwareModal = ({ isOpen, onClose }) => {
  const { 
    serialState, 
    connectArduino, 
    disconnectArduino, 
    simulateSerialLine, 
    clearSerialLogs,
    isStale 
  } = useDashboard();

  const [selectedBaud, setSelectedBaud] = useState(9600);
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [feedbackType, setFeedbackType] = useState('info'); // 'info' | 'success' | 'error'
  const [customFrame, setCustomFrame] = useState('');
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'emulator' | 'help'

  const terminalEndRef = useRef(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (activeTab === 'monitor' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialState.rawLogs, activeTab]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setFeedbackMsg(null);
    try {
      const res = await connectArduino(selectedBaud);
      setFeedbackType('success');
      setFeedbackMsg(res.message || 'Connected to Arduino serial port.');
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMsg(err.message || 'Failed to open serial port. Ensure Arduino IDE Serial Monitor is closed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectArduino();
    setFeedbackType('info');
    setFeedbackMsg('Disconnected from Arduino interface.');
  };

  const handleSendCustomFrame = (e) => {
    e.preventDefault();
    if (!customFrame.trim()) return;
    simulateSerialLine(customFrame.trim());
    setFeedbackType('info');
    setFeedbackMsg('Custom serial packet dispatched.');
    setCustomFrame('');
  };

  const injectPredefined = (jsonObj) => {
    simulateSerialLine(JSON.stringify(jsonObj));
    setFeedbackType('success');
    setFeedbackMsg('Test telemetry frame injected.');
  };

  const isConnected = serialState.status === HARDWARE_STATUS.CONNECTED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Arduino Hardware Interface</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Phase 3 Web Serial
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Arduino Uno R3 • 9600 bps • USB CDC Protocol</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 my-1 flex-1">
          {/* Stale Telemetry Warning Alert */}
          {isConnected && isStale && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-semibold block">Stale Telemetry Watchdog Alert</span>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  No serial frame received for &gt;3.5 seconds. Check physical USB connection, Arduino power, or code loop.
                </p>
              </div>
            </div>
          )}

          {/* Connection Status & Baud Rate Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Link Status:</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <StatusBadge 
                    type={isStale ? 'warning' : 'optimal'} 
                    label={isStale ? 'STALE TELEMETRY' : 'CONNECTED (LIVE SERIAL)'} 
                    pulse={!isStale} 
                  />
                ) : isConnecting ? (
                  <StatusBadge type="warning" label="NEGOTIATING COM PORT..." pulse={true} />
                ) : serialState.status === HARDWARE_STATUS.ERROR ? (
                  <StatusBadge type="critical" label="CONNECTION ERROR" />
                ) : (
                  <StatusBadge type="standby" label="DISCONNECTED / STANDBY" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Port:</span>
                <span className="font-mono text-slate-200 font-semibold truncate max-w-[170px]" title={serialState.portInfo?.name}>
                  {isConnected ? serialState.portInfo?.name : 'Auto-Request (COM port)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Baud Rate:</span>
                <select
                  value={selectedBaud}
                  disabled={isConnected || isConnecting}
                  onChange={(e) => setSelectedBaud(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  {SERIAL_CONFIG.supportedBaudRates.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate} bps
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Web Serial API:</span>
                <span className={`font-mono font-medium ${serialState.isWebSerialSupported ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {serialState.isWebSerialSupported ? 'Supported (Chrome/Edge)' : 'Not Supported'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Context Security:</span>
                <span className="font-mono text-slate-300">
                  {serialState.isSecureContext ? 'Secure (localhost)' : 'Insecure'}
                </span>
              </div>
            </div>
          </div>

          {/* 4-Channel Sensor Health Monitor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hardware Sensor Health (4 Channels)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">Live Health Diagnostic</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* LDR */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">LDR (A0)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-slate-200">Light ADC</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    serialState.sensorHealth.ldr === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConnected ? serialState.sensorHealth.ldr : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* DHT11 */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">DHT11 (D2)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-slate-200">Climate</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    serialState.sensorHealth.dht11 === 'ONLINE' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : serialState.sensorHealth.dht11 === 'FAULT'
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConnected ? serialState.sensorHealth.dht11 : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* PIR */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">PIR (D7)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-slate-200">Motion</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    serialState.sensorHealth.pir === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConnected ? serialState.sensorHealth.pir : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* Relay */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">Relay (D8)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-slate-200">Room LED</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    serialState.sensorHealth.relay === 'ONLINE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConnected ? serialState.sensorHealth.relay : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Terminal Monitor vs Zero-Hardware Emulator vs Wiring Help */}
          <div className="flex items-center gap-1.5 border-b border-slate-800 pt-1 text-xs">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'monitor'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Serial Monitor ({serialState.rawLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('emulator')}
              className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'emulator'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Hardware Emulator</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'help'
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Wiring & Upload Guide</span>
            </button>
          </div>

          {/* TAB 1: Live Terminal Monitor */}
          {activeTab === 'monitor' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Incoming Serial Stream:</span>
                <button
                  onClick={clearSerialLogs}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear Console
                </button>
              </div>

              <div className="bg-black/90 border border-slate-800 rounded-xl p-3 font-mono text-[11px] h-44 overflow-y-auto text-slate-300 space-y-1 shadow-inner">
                {serialState.rawLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-8 text-center">
                    Awaiting serial data... Connect an Arduino or inject an emulated frame.
                  </div>
                ) : (
                  serialState.rawLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`${
                        log.includes('[ERROR]') 
                          ? 'text-rose-400' 
                          : log.includes('[WATCHDOG]') 
                          ? 'text-amber-400' 
                          : log.includes('[CONNECTED]') 
                          ? 'text-emerald-400' 
                          : log.includes('[EMULATED') 
                          ? 'text-indigo-300' 
                          : 'text-slate-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* TAB 2: Zero-Hardware Emulator */}
          {activeTab === 'emulator' && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">Quick Telemetry Ingestion (Zero-Hardware Testing)</span>
                <p className="text-[11px] text-slate-400">
                  Simulate live serial JSON frames arriving from an Arduino Uno to test parsing, alert triggers, and fault handling.
                </p>
              </div>

              {/* Task 6 LDR Calibration Test Suite */}
              <div>
                <span className="font-semibold text-slate-300 block text-[11px] mb-1.5 uppercase tracking-wider">
                  Phase 4 LDR Calibration Verification (Task 6)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                  <button
                    onClick={() => injectPredefined({ light_adc: 100, temperature: 24.0, humidity: 50, motion: 1, room_light: 1 })}
                    className="p-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-center transition-colors border border-indigo-700/50"
                  >
                    <span className="font-bold text-indigo-300 block text-[11px]">100 ADC</span>
                    <span className="text-[9px] text-slate-400 font-mono">Darkness</span>
                  </button>

                  <button
                    onClick={() => injectPredefined({ light_adc: 300, temperature: 24.5, humidity: 52, motion: 1, room_light: 0 })}
                    className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-center transition-colors border border-amber-700/50"
                  >
                    <span className="font-bold text-amber-300 block text-[11px]">300 ADC</span>
                    <span className="text-[9px] text-slate-400 font-mono">Dim Lighting</span>
                  </button>

                  <button
                    onClick={() => injectPredefined({ light_adc: 600, temperature: 25.0, humidity: 54, motion: 1, room_light: 0 })}
                    className="p-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/50 text-center transition-colors border border-teal-700/50"
                  >
                    <span className="font-bold text-teal-300 block text-[11px]">600 ADC</span>
                    <span className="text-[9px] text-slate-400 font-mono">Adequate Daylight</span>
                  </button>

                  <button
                    onClick={() => injectPredefined({ light_adc: 850, temperature: 26.0, humidity: 55, motion: 1, room_light: 0 })}
                    className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-center transition-colors border border-emerald-700/50"
                  >
                    <span className="font-bold text-emerald-300 block text-[11px]">850 ADC</span>
                    <span className="text-[9px] text-slate-400 font-mono">Abundant Daylight</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => injectPredefined({ light_adc: 820, temperature: 28.5, humidity: 55, motion: 1, room_light: 0 })}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                >
                  <span className="font-bold text-emerald-400 block text-[11px]">Normal Balanced Telemetry</span>
                  <span className="text-[10px] text-slate-400 font-mono">ADC:820, Temp:28.5°C, Hum:55%, Motion:1, Light:0</span>
                </button>

                <button
                  onClick={() => injectPredefined({ light_adc: 890, temperature: 29.5, humidity: 50, motion: 0, room_light: 1 })}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                >
                  <span className="font-bold text-rose-400 block text-[11px]">Energy Waste (Daylight + Light ON)</span>
                  <span className="text-[10px] text-slate-400 font-mono">ADC:890, Vacant (0), Light:1 (Daylight waste)</span>
                </button>

                <button
                  onClick={() => injectPredefined({ light_adc: 620, temperature: null, humidity: null, motion: 1, room_light: 0 })}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                >
                  <span className="font-bold text-amber-400 block text-[11px]">DHT11 Disconnected (Nulls)</span>
                  <span className="text-[10px] text-slate-400 font-mono">ADC:620, Temp:null, Hum:null (Fault test)</span>
                </button>

                <button
                  onClick={() => injectPredefined({ light_adc: 120, temperature: 22.0, humidity: 48, motion: 1, room_light: 1 })}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700"
                >
                  <span className="font-bold text-blue-400 block text-[11px]">Dark Room Occupied</span>
                  <span className="text-[10px] text-slate-400 font-mono">ADC:120, Motion:1, Light:1 (Rule 1 match)</span>
                </button>
              </div>

              {/* Custom Frame Input */}
              <form onSubmit={handleSendCustomFrame} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={customFrame}
                  onChange={(e) => setCustomFrame(e.target.value)}
                  placeholder='{"light_adc":750,"temperature":26.0,"humidity":52,"motion":1,"room_light":0}'
                  className="flex-1 bg-black/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Send className="w-3 h-3" /> Ingest Frame
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Wiring & Upload Guide */}
          {activeTab === 'help' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="font-semibold text-slate-200 block">Arduino Uno R3 Physical Setup Quick Guide</span>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded">
                  <thead className="bg-slate-800/80 text-slate-300">
                    <tr>
                      <th className="p-1.5 border-b border-slate-700">Sensor / Output</th>
                      <th className="p-1.5 border-b border-slate-700">Arduino Pin</th>
                      <th className="p-1.5 border-b border-slate-700">Type / Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-1.5">LDR Photoresistor</td>
                      <td className="p-1.5 font-bold text-amber-400">A0</td>
                      <td className="p-1.5 text-slate-400">Analog (0–1023 ADC)</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">DHT11 Temp & Humidity</td>
                      <td className="p-1.5 font-bold text-blue-400">D2</td>
                      <td className="p-1.5 text-slate-400">Single-Wire Digital</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">Room Demonstration LED</td>
                      <td className="p-1.5 font-bold text-emerald-400">D7</td>
                      <td className="p-1.5 text-slate-400">Digital Output (Exclusively Pin D7)</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">Red Alert Indicator LED</td>
                      <td className="p-1.5 font-bold text-rose-400">D9</td>
                      <td className="p-1.5 text-slate-400">Digital Output (Energy Waste)</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">Yellow Rec Indicator LED</td>
                      <td className="p-1.5 font-bold text-amber-300">D10</td>
                      <td className="p-1.5 text-slate-400">Digital Output (Advisory / Unknown)</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">Green Efficiency LED</td>
                      <td className="p-1.5 font-bold text-emerald-400">D11</td>
                      <td className="p-1.5 text-slate-400">Digital Output (Optimal Save)</td>
                    </tr>
                    <tr>
                      <td className="p-1.5">PIR Motion Sensor</td>
                      <td className="p-1.5 font-bold text-slate-500">DISABLED</td>
                      <td className="p-1.5 text-slate-500">Replaced by Laptop Webcam AI</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200">
                <strong>Important:</strong> Close the Arduino IDE Serial Monitor before clicking "Connect Arduino" to prevent COM port lock conflicts.
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {feedbackMsg && (
            <div className={`text-xs font-mono p-2.5 rounded-lg border flex items-center gap-2 ${
              feedbackType === 'error'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : feedbackType === 'success'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-blue-300 bg-blue-500/10 border-blue-500/20'
            }`}>
              {feedbackType === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-800 shrink-0">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            {isConnected ? `Streaming live on ${selectedBaud} bps` : 'Ready to initiate Web Serial handshake'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-900/30"
              >
                <Power className="w-3.5 h-3.5" />
                Disconnect Arduino
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-900/30 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    Connect Arduino
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareModal;
