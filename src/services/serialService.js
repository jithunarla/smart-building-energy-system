/**
 * Web Serial API Service (Phase 3)
 * Provides real-time bidirectional serial communication with Arduino Uno R3.
 * Supports line buffering, safe JSON parsing, sensor fault detection, and graceful disconnection.
 */

export const HARDWARE_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR'
};

export const SERIAL_CONFIG = {
  defaultBaudRate: 9600,
  supportedBaudRates: [9600, 19200, 38400, 57600, 115200],
  staleTimeoutMs: 3500, // Mark data stale if no message received within 3.5s
  heartbeatIntervalMs: 2000, // 2-second heartbeat to refresh Arduino watchdog
  maxRawLogLines: 60
};

export class SerialService {
  constructor() {
    this.status = HARDWARE_STATUS.DISCONNECTED;
    this.port = null;
    this.reader = null;
    this.readableStreamClosed = null;
    this.baudRate = SERIAL_CONFIG.defaultBaudRate;
    this.portInfo = null;
    this.errorMessage = null;

    // Telemetry state
    this.lastReading = null;
    this.lastValidLdr = null;
    this.lastMessageTime = null;
    this.lastSuccessfulUpdate = null;
    this.isStale = false;
    this.rawLogs = []; // Circular terminal monitor log lines
    this.sensorHealth = {
      ldr: 'STANDBY',
      dht11: 'STANDBY',
      pir: 'STANDBY',
      relay: 'STANDBY'
    };

    // Observers
    this.listeners = new Set();
    this.readingListeners = new Set();
    this.connectListeners = new Set();

    // Line buffer for partial chunk assembly
    this.lineBuffer = '';
    this.keepReading = false;
    this.staleCheckTimer = null;
    this.writeQueue = Promise.resolve();
    this.lastCommandSent = null;
    this.lastCommandTime = null;
    this.heartbeatTimer = null;
    this.heartbeatCount = 0;

    // Listen for physical USB unplug events
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      navigator.serial.addEventListener('disconnect', (event) => {
        if (event.target === this.port) {
          this.handleUnexpectedDisconnect('USB cable disconnected from host');
        }
      });
    }

    // Start stale data watchdog
    this.startWatchdog();
  }

  // --- OBSERVER SUBSCRIPTIONS ---
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  subscribeReadings(listener) {
    this.readingListeners.add(listener);
    if (this.lastReading) listener(this.lastReading);
    return () => this.readingListeners.delete(listener);
  }

  onConnect(listener) {
    this.connectListeners.add(listener);
    return () => this.connectListeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('SerialService notify error:', err);
      }
    });
  }

  notifyReading(reading) {
    this.readingListeners.forEach((fn) => {
      try {
        fn(reading);
      } catch (err) {
        console.error('SerialService reading listener error:', err);
      }
    });
  }

  getState() {
    return {
      status: this.status,
      portInfo: this.portInfo,
      baudRate: this.baudRate,
      isWebSerialSupported: typeof navigator !== 'undefined' && 'serial' in navigator,
      isSecureContext: typeof window !== 'undefined' && Boolean(window.isSecureContext),
      lastMessageTime: this.lastMessageTime,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      isStale: this.isStale,
      sensorHealth: { ...this.sensorHealth },
      errorMessage: this.errorMessage,
      rawLogs: [...this.rawLogs],
      lastReading: this.lastReading ? { ...this.lastReading } : null,
      lastCommandSent: this.lastCommandSent,
      lastCommandTime: this.lastCommandTime
    };
  }

  // --- HARDWARE CONNECT (WEB SERIAL API) ---
  async connect(baudRate = SERIAL_CONFIG.defaultBaudRate) {
    if (this.status === HARDWARE_STATUS.CONNECTED || this.port) {
      return { success: false, message: 'Serial port is already connected' };
    }

    if (!('serial' in navigator)) {
      this.status = HARDWARE_STATUS.ERROR;
      this.errorMessage = 'Web Serial API is not supported in this browser. Please use Chrome or Edge.';
      this.notify();
      throw new Error(this.errorMessage);
    }

    if (!window.isSecureContext) {
      this.status = HARDWARE_STATUS.ERROR;
      this.errorMessage = 'Web Serial API requires a secure context (HTTPS or localhost).';
      this.notify();
      throw new Error(this.errorMessage);
    }

    this.status = HARDWARE_STATUS.CONNECTING;
    this.errorMessage = null;
    this.baudRate = Number(baudRate) || SERIAL_CONFIG.defaultBaudRate;
    this.notify();

    try {
      // 1. Request port access from user
      this.port = await navigator.serial.requestPort();

      // Retrieve device identifiers
      const info = this.port.getInfo();
      const usbVendorId = info.usbVendorId ? `0x${info.usbVendorId.toString(16).padStart(4, '0')}` : 'Unknown';
      const usbProductId = info.usbProductId ? `0x${info.usbProductId.toString(16).padStart(4, '0')}` : 'Unknown';

      this.portInfo = {
        name: info.usbVendorId ? `USB Serial Device (VID:${usbVendorId} PID:${usbProductId})` : 'Arduino Uno / USB Serial Port',
        vendorId: usbVendorId,
        productId: usbProductId
      };

      // 2. Open serial connection
      await this.port.open({
        baudRate: this.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        bufferSize: 255
      });

      this.status = HARDWARE_STATUS.CONNECTED;
      this.keepReading = true;
      this.lineBuffer = '';
      this.isStale = false;
      this.appendLog(`[CONNECTED] Opened port at ${this.baudRate} bps. Awaiting JSON stream...`);
      this.notify();

      // Start 2-second heartbeat to keep Arduino communication watchdog alive
      this.startHeartbeat();

      // Trigger onConnect subscribers (e.g. for smart lighting state sync)
      this.connectListeners.forEach((fn) => {
        try { fn(); } catch (e) { console.error('onConnect error:', e); }
      });

      // 3. Start non-blocking asynchronous reading loop
      this.readSerialLoop();

      return { success: true, message: `Connected to ${this.portInfo.name}` };
    } catch (err) {
      this.status = HARDWARE_STATUS.ERROR;
      this.errorMessage = err.name === 'NotFoundError' 
        ? 'No serial port selected by user.' 
        : err.message || 'Failed to open serial port';
      
      this.appendLog(`[ERROR] ${this.errorMessage}`);
      this.port = null;
      this.notify();
      throw err;
    }
  }

  // --- CONTINUOUS SERIAL READ LOOP ---
  async readSerialLoop() {
    const textDecoder = new TextDecoderStream();
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          // Reader was cancelled or stream closed
          break;
        }
        if (value) {
          this.processIncomingChunk(value);
        }
      }
    } catch (err) {
      if (this.keepReading) {
        console.error('Serial read error:', err);
        this.handleUnexpectedDisconnect(`Read error: ${err.message}`);
      }
    } finally {
      try {
        this.reader.releaseLock();
      } catch (e) {
        // Ignore lock release errors during teardown
      }
    }
  }

  // --- CHUNK & NEWLINE PROCESSING ---
  processIncomingChunk(chunk) {
    this.lineBuffer += chunk;
    const lines = this.lineBuffer.split(/\r?\n/);

    // Keep the last segment (which may be incomplete) in the lineBuffer
    this.lineBuffer = lines.pop();

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      this.appendLog(trimmed);
      this.parseAndDispatchReading(trimmed);
    }
  }

  // --- JSON PARSING & DATA NORMALIZATION ---
  parseAndDispatchReading(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // Validate required sensor fields
      if (typeof data !== 'object' || data === null) return;

      const now = new Date();
      this.lastMessageTime = now;
      this.isStale = false;

      // Extract and validate LDR field across all standard & legacy names:
      // light_adc, lightIntensity, ldrValue, light, adc, ldr
      let rawLdr = undefined;
      if (data.light_adc !== undefined) rawLdr = data.light_adc;
      else if (data.lightIntensity !== undefined) rawLdr = data.lightIntensity;
      else if (data.ldrValue !== undefined) rawLdr = data.ldrValue;
      else if (data.light !== undefined) rawLdr = data.light;
      else if (data.adc !== undefined) rawLdr = data.adc;
      else if (data.ldr !== undefined) rawLdr = data.ldr;

      let lightAdc = null;
      let isLdrValid = false;

      if (rawLdr !== null && rawLdr !== undefined && rawLdr !== '') {
        const numLdr = Number(rawLdr);
        // Range validation 0-1023 (0 is a valid reading!)
        if (!isNaN(numLdr) && numLdr >= 0 && numLdr <= 1023) {
          lightAdc = Math.round(numLdr);
          isLdrValid = true;
          this.lastValidLdr = lightAdc;
        } else {
          // Out of range reading: preserve last valid LDR if present, mark fault
          lightAdc = this.lastValidLdr !== null ? this.lastValidLdr : null;
          isLdrValid = false;
        }
      } else if (rawLdr === null) {
        // Explicit null sensor fault
        lightAdc = null;
        isLdrValid = false;
      } else if (this.lastValidLdr !== null) {
        // Fallback to last valid LDR if field omitted in packet
        lightAdc = this.lastValidLdr;
      }

      // Extract temperature with aliases: temperature, temp, t
      const rawTemp = data.temperature !== undefined ? data.temperature 
        : data.temp !== undefined ? data.temp 
        : data.t !== undefined ? data.t 
        : null;
      const temperature = rawTemp !== null && rawTemp !== undefined && !isNaN(Number(rawTemp))
        ? Number(Number(rawTemp).toFixed(1))
        : null;

      // Extract humidity with aliases: humidity, hum, h
      const rawHum = data.humidity !== undefined ? data.humidity 
        : data.hum !== undefined ? data.hum 
        : data.h !== undefined ? data.h 
        : null;
      const humidity = rawHum !== null && rawHum !== undefined && !isNaN(Number(rawHum))
        ? Math.round(Number(rawHum))
        : null;

      // Extract motion with aliases: motion, pir, movement, presence
      const rawMotion = data.motion !== undefined ? data.motion 
        : data.pir !== undefined ? data.pir 
        : data.movement !== undefined ? data.movement 
        : data.presence !== undefined ? data.presence 
        : 0;
      const motion = rawMotion === 1 || rawMotion === true || rawMotion === '1' ? 1 : 0;

      // Extract room_light with aliases: room_light, roomLight, relay, lightState, led
      const rawRoomLight = data.room_light !== undefined ? data.room_light 
        : data.roomLight !== undefined ? data.roomLight
        : data.relay !== undefined ? data.relay 
        : data.lightState !== undefined ? data.lightState 
        : data.led !== undefined ? data.led 
        : 0;
      const roomLight = rawRoomLight === 1 || rawRoomLight === true || rawRoomLight === '1' ? 1 : 0;

      // Extract diagnostic telemetry fields
      const manualMode = data.manualMode !== undefined ? Boolean(data.manualMode) : null;
      const autoMode = data.autoMode !== undefined ? Boolean(data.autoMode) : null;
      const lastCommandAge = data.lastCommandAge !== undefined ? Number(data.lastCommandAge) : null;
      const watchdogActive = data.watchdogActive !== undefined ? Boolean(data.watchdogActive) : null;

      // Diagnostic log on actual room LED state change from Arduino
      if (this.lastReading && this.lastReading.room_light !== roomLight) {
        this.appendLog(`[ARDUINO TELEMETRY] Actual room LED state changed: ${roomLight === 1 ? 'ON (Pin D7 HIGH)' : 'OFF (Pin D7 LOW)'}`);
      }

      // Check if communication watchdog timed out on Arduino
      if (lastCommandAge !== null && lastCommandAge >= 10 && roomLight === 0 && this.lastReading && this.lastReading.room_light === 1) {
        this.appendLog('[ARDUINO WATCHDOG] Communication watchdog expired on Arduino (>10s silence). Pin D7 de-energized.');
      }

      // Update sensor health metrics
      this.sensorHealth = {
        ldr: isLdrValid ? 'ONLINE' : (lightAdc === null ? 'FAULT' : 'STALE_WARNING'),
        dht11: (temperature !== null && humidity !== null) ? 'ONLINE' : 'FAULT',
        pir: 'ONLINE',
        relay: roomLight === 1 ? 'ONLINE' : 'STANDBY'
      };

      // Standard normalized schema - DO NOT default null lightAdc to 0!
      const normalizedReading = {
        light_adc: lightAdc,
        temperature: temperature,
        humidity: humidity,
        motion: motion,
        room_light: roomLight,
        roomLight: roomLight,
        manualMode: manualMode,
        autoMode: autoMode,
        lastCommandAge: lastCommandAge,
        watchdogActive: watchdogActive,
        timestamp: now.toISOString(),
        mode: 'hardware'
      };

      this.lastReading = normalizedReading;
      this.lastSuccessfulUpdate = now;

      // Publish to listeners
      this.notifyReading(normalizedReading);
      this.notify();
    } catch (err) {
      // Ignore malformed partial frames or non-JSON serial noise
      console.warn('SerialService: Ignored invalid frame:', jsonString);
    }
  }

  // --- DISCONNECT & TEARDOWN ---
  async disconnect() {
    this.keepReading = false;
    this.stopHeartbeat();
    this.appendLog('[DISCONNECTING] Releasing serial streams...');

    try {
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
        this.reader = null;
      }
      if (this.readableStreamClosed) {
        await this.readableStreamClosed.catch(() => {});
        this.readableStreamClosed = null;
      }
      if (this.port) {
        await this.port.close().catch(() => {});
        this.port = null;
      }
    } catch (err) {
      console.warn('SerialService disconnect error:', err);
    } finally {
      this.status = HARDWARE_STATUS.DISCONNECTED;
      this.portInfo = null;
      this.sensorHealth = {
        ldr: 'STANDBY',
        dht11: 'STANDBY',
        pir: 'STANDBY',
        relay: 'STANDBY'
      };
      this.appendLog('[DISCONNECTED] Serial port closed cleanly.');
      this.notify();
    }
  }

  handleUnexpectedDisconnect(reason) {
    this.keepReading = false;
    this.stopHeartbeat();
    this.status = HARDWARE_STATUS.DISCONNECTED;
    this.errorMessage = reason;
    this.port = null;
    this.reader = null;
    this.isStale = true;
    this.appendLog(`[DISCONNECTED] ${reason}`);
    this.notify();
  }

  // --- TERMINAL LOG BUFFER ---
  appendLog(line) {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    this.rawLogs = [...this.rawLogs.slice(-(SERIAL_CONFIG.maxRawLogLines - 1)), `[${time}] ${line}`];
  }

  clearLogs() {
    this.rawLogs = [];
    this.notify();
  }

  // --- STALE DATA WATCHDOG ---
  startWatchdog() {
    if (this.staleCheckTimer) return;
    this.staleCheckTimer = setInterval(() => {
      if (this.status === HARDWARE_STATUS.CONNECTED && this.lastMessageTime) {
        const elapsed = Date.now() - this.lastMessageTime.getTime();
        const currentlyStale = elapsed > SERIAL_CONFIG.staleTimeoutMs;
        if (currentlyStale !== this.isStale) {
          this.isStale = currentlyStale;
          if (currentlyStale) {
            this.appendLog('[WATCHDOG] No serial frame received in > 3.5s. Telemetry is STALE.');
          }
          this.notify();
        }
      }
    }, 1000);
  }

  // --- OUTBOUND COMMAND TRANSMISSION (BROWSER -> ARDUINO) ---
  async sendCommand(commandObj) {
    if (!commandObj || typeof commandObj !== 'object') {
      return { success: false, reason: 'Invalid command payload' };
    }

    const payload = JSON.stringify(commandObj) + '\n';

    // If physical serial port is connected and writable
    if (this.status === HARDWARE_STATUS.CONNECTED && this.port && this.port.writable) {
      return new Promise((resolve) => {
        this.writeQueue = this.writeQueue
          .then(async () => {
            let writer = null;
            try {
              const encoder = new TextEncoder();
              const encoded = encoder.encode(payload);
              writer = this.port.writable.getWriter();
              await writer.write(encoded);
              this.appendLog(`[TX -> ARDUINO] ${payload.trim()}`);
              this.lastCommandSent = commandObj;
              this.lastCommandTime = new Date();
              this.notify();
              resolve({ success: true, payload: payload.trim() });
            } catch (err) {
              console.error('SerialService write error:', err);
              this.appendLog(`[TX ERROR] Failed to send command: ${err.message}`);
              resolve({ success: false, error: err.message });
            } finally {
              if (writer) {
                try {
                  writer.releaseLock();
                } catch (e) {
                  // Ignore lock release error during tear down
                }
              }
            }
          })
          .catch((err) => {
            resolve({ success: false, error: err.message });
          });
      });
    }

    // Zero-hardware / simulated testing mode fallback:
    this.appendLog(`[TX (SIMULATED)] ${payload.trim()}`);
    this.lastCommandSent = commandObj;
    this.lastCommandTime = new Date();

    // If command is LIGHT_ON or LIGHT_OFF, reflect in lastReading immediately for zero-hardware demo
    if (this.lastReading) {
      if (commandObj.command === 'LIGHT_ON') {
        this.lastReading = { ...this.lastReading, room_light: 1 };
        this.notifyReading(this.lastReading);
      } else if (commandObj.command === 'LIGHT_OFF') {
        this.lastReading = { ...this.lastReading, room_light: 0 };
        this.notifyReading(this.lastReading);
      }
    }
    this.notify();
    return Promise.resolve({ success: true, simulated: true, payload: payload.trim() });
  }

  async sendLightOn() {
    return this.sendCommand({ command: 'LIGHT_ON' });
  }

  async sendLightOff() {
    return this.sendCommand({ command: 'LIGHT_OFF' });
  }

  async sendManualMode(enabled = true) {
    return this.sendCommand(enabled ? { command: 'SET_MANUAL_MODE', enabled: true } : { command: 'SET_AUTO_MODE' });
  }

  // --- HEARTBEAT ENGINE (2-SECOND WATCHDOG REFRESH) ---
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatCount = 0;
    this.appendLog('[HEARTBEAT] Started 2-second heartbeat process.');

    this.heartbeatTimer = setInterval(async () => {
      if (this.status === HARDWARE_STATUS.CONNECTED) {
        await this.sendHeartbeat();
      }
    }, SERIAL_CONFIG.heartbeatIntervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.appendLog('[HEARTBEAT] Stopped heartbeat process.');
    }
  }

  async sendHeartbeat() {
    if (this.status !== HARDWARE_STATUS.CONNECTED) {
      return { success: false, reason: 'Serial port is not connected' };
    }

    this.heartbeatCount++;
    const res = await this.sendCommand({ command: 'HEARTBEAT' });
    if (res.success) {
      this.appendLog(`[HEARTBEAT] Sent {"command":"HEARTBEAT"} (#${this.heartbeatCount})`);
    } else {
      this.appendLog(`[HEARTBEAT ERROR] Write failed: ${res.error}`);
    }
    return res;
  }

  // --- SOFTWARE-LEVEL SERIAL SIMULATION INGEST (FOR ZERO-HARDWARE TESTING) ---
  simulateIncomingSerialLine(line) {
    this.appendLog(`[EMULATED SERIAL] ${line}`);
    this.parseAndDispatchReading(line);
  }
}

export const serialService = new SerialService();
