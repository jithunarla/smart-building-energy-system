/**
 * Centralized Sensor Data Service (Phase 3)
 * Coordinates telemetry streams between physical Arduino Web Serial and the Phase 2 simulation engine.
 * Ensures consistent normalization, zero simulated data leakage in Hardware Mode, and robust fault tracking.
 */

import { simulationService } from './simulationService.js';
import { serialService, HARDWARE_STATUS } from './serialService.js';
import { storageService } from './storageService.js';
import { occupancyEventService, OCCUPANCY_EVENT_TYPES } from './occupancyEventService.js';
import { SENSOR_CONFIG, INITIAL_SENSOR_DATA, generate24HourHistory } from '../data/mockSensorData.js';

export class SensorDataService {
  constructor() {
    this.mode = 'demo'; // 'demo' | 'hardware'
    this.listeners = new Set();

    // Inactivity tracking for hardware mode
    this.inactivityTimeout = SENSOR_CONFIG.pir.defaultInactivityTimeout; // 45s
    this.lastMotionTime = new Date(Date.now() - 5 * 1000);
    this.motionCount = 0;

    // Last valid hardware reading and LDR cache
    this.lastHardwareReading = null;
    this.lastValidLdr = null;
    this.history = storageService.getHistory(generate24HourHistory());

    // 1. Subscribe to Simulation Service (Demo Mode)
    simulationService.subscribe((telemetry) => {
      if (this.mode === 'demo') {
        this.history = telemetry.history;
        this.notify();
      }
    });

    // 2. Subscribe to Serial Service Telemetry Readings (Hardware Mode)
    serialService.subscribeReadings((reading) => {
      // Cache latest reading immediately across all modes to prevent stale closures
      if (reading.light_adc !== null && reading.light_adc !== undefined) {
        this.lastValidLdr = reading.light_adc;
      }
      this.lastHardwareReading = {
        ...reading,
        light_adc: reading.light_adc !== undefined ? reading.light_adc : this.lastValidLdr
      };

      if (this.mode === 'hardware') {
        // Process motion transition
        if (reading.motion === 1) {
          this.lastMotionTime = new Date();
          this.motionCount += 1;
        }

        // Append to persistent history immutably
        this.history = storageService.appendReading(this.lastHardwareReading, this.history);
        this.notify();
      }
    });

    // 3. Subscribe to Serial State Changes (Connect, Disconnect, Errors, Stale)
    serialService.subscribe(() => {
      if (this.mode === 'hardware') {
        this.notify();
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('SensorDataService listener error:', err);
      }
    });
  }

  getSnapshot() {
    const serialState = serialService.getState();
    const isHardware = this.mode === 'hardware';

    if (isHardware) {
      // In Hardware Mode: Telemetry originates exclusively from physical serial stream
      const isConnected = serialState.status === HARDWARE_STATUS.CONNECTED;
      const rawHardwareReading = this.lastHardwareReading || serialState.lastReading;
      const reading = rawHardwareReading
        ? {
            ...rawHardwareReading,
            light_adc: rawHardwareReading.light_adc !== undefined ? rawHardwareReading.light_adc : this.lastValidLdr,
            mode: 'hardware'
          }
        : {
            light_adc: this.lastValidLdr !== null ? this.lastValidLdr : null,
            temperature: null,
            humidity: null,
            motion: 0,
            room_light: 0,
            timestamp: serialState.lastMessageTime ? serialState.lastMessageTime.toISOString() : new Date().toISOString(),
            mode: 'hardware'
          };

      const secondsSinceLastMotion = Math.max(0, (Date.now() - this.lastMotionTime.getTime()) / 1000);
      const isOccupied = reading.motion === 1 || secondsSinceLastMotion < this.inactivityTimeout;
      const inactivityRemaining = isOccupied 
        ? Math.max(0, Math.round(this.inactivityTimeout - secondsSinceLastMotion))
        : 0;

      return {
        mode: 'hardware',
        reading: { ...reading },
        isOccupied,
        lastMotionTime: this.lastMotionTime,
        motionCount: this.motionCount,
        inactivityTimeout: this.inactivityTimeout,
        inactivityRemaining,
        isRunning: isConnected && !serialState.isStale,
        speedMultiplier: 1,
        activeScenarioId: null,
        history: [...this.history],
        serialState,
        isStale: serialState.isStale || !isConnected,
        isHardwareConnected: isConnected
      };
    }

    // In Demo Mode: Telemetry originates from Simulation Engine
    const simTelemetry = simulationService.getTelemetry();
    return {
      mode: 'demo',
      reading: {
        ...simTelemetry.sensorData,
        mode: 'demo'
      },
      isOccupied: simTelemetry.isOccupied,
      lastMotionTime: simTelemetry.lastMotionTime,
      motionCount: simTelemetry.motionCount,
      inactivityTimeout: simTelemetry.inactivityTimeout,
      inactivityRemaining: simTelemetry.inactivityRemaining,
      isRunning: simTelemetry.isRunning,
      speedMultiplier: simTelemetry.speedMultiplier,
      activeScenarioId: simTelemetry.activeScenarioId,
      history: simTelemetry.history,
      serialState,
      isStale: false,
      isHardwareConnected: false
    };
  }

  setMode(newMode) {
    const normalized = newMode?.toLowerCase() === 'hardware' ? 'hardware' : 'demo';
    if (normalized === this.mode) return;
    this.mode = normalized;

    if (normalized === 'demo') {
      simulationService.start();
    } else {
      // Pause synthetic simulation so fake readings never leak into hardware mode
      simulationService.pause();
      // If hardware reading was received while in demo, sync it immediately
      if (!this.lastHardwareReading && serialService.getState().lastReading) {
        this.lastHardwareReading = { ...serialService.getState().lastReading };
      }
    }

    this.notify();
  }

  // --- ACTIONS ---
  applyScenario(scenarioId) {
    if (this.mode === 'demo') {
      simulationService.applyScenario(scenarioId);
    }
  }

  updateSensor(key, value) {
    if (this.mode === 'demo') {
      simulationService.updateSensor(key, value);
    } else {
      if (key === 'light_adc') {
        this.lastValidLdr = value;
      }
      this.lastHardwareReading = {
        ...(this.lastHardwareReading || {}),
        [key]: value,
        mode: 'hardware'
      };
      this.history = storageService.appendReading(this.lastHardwareReading, this.history);
      this.notify();
    }
  }

  pulseMotion() {
    this.lastMotionTime = new Date();
    this.motionCount += 1;
    occupancyEventService.recordEvent(OCCUPANCY_EVENT_TYPES.PERSON_DETECTED, {
      peopleCount: 1,
      occupancyStatus: 'OCCUPIED',
      description: 'Occupancy test pulse event triggered manually.'
    });

    if (this.mode === 'demo') {
      simulationService.pulseMotion();
    } else {
      this.notify();
    }
  }

  toggleRoomLight() {
    if (this.mode === 'demo') {
      simulationService.toggleRoomLight();
    }
  }

  startSimulation() {
    if (this.mode === 'demo') {
      simulationService.start();
    }
  }

  pauseSimulation() {
    if (this.mode === 'demo') {
      simulationService.pause();
    }
  }

  resumeSimulation() {
    if (this.mode === 'demo') {
      simulationService.resume();
    }
  }

  resetSimulation() {
    if (this.mode === 'demo') {
      simulationService.reset();
    } else {
      this.lastMotionTime = new Date();
      this.motionCount = 0;
      this.lastHardwareReading = null;
      this.history = storageService.clearHistory(generate24HourHistory());
      this.notify();
    }
  }

  setSpeed(multiplier) {
    if (this.mode === 'demo') {
      simulationService.setSpeed(multiplier);
    }
  }

  setInactivityTimeout(seconds) {
    this.inactivityTimeout = Number(seconds) || 45;
    simulationService.setInactivityTimeout(seconds);
    this.notify();
  }
}

export const sensorDataService = new SensorDataService();
