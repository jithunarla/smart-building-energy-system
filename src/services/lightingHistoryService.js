/**
 * Lighting Usage History & Interval Tracking Service (Phase 6)
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Features:
 * - Records discrete room LED transitions with rich operational context
 * - Tracks exact ON and OFF operating intervals with second-level precision
 * - Separates actual hardware-confirmed state (Arduino Pin D7) from desired control state
 * - Suppresses duplicate consecutive state reports
 * - Computes ongoing active intervals in real-time up to the current clock
 * - Splits intervals cleanly across midnight and local calendar day boundaries
 * - Provides strict local storage isolation between HARDWARE and DEMO modes
 * - Seeds realistic commercial workday lighting intervals in Demo Mode
 */

import { energyConfig } from '../config/energyConfig.js';
import { serialService } from './serialService.js';

const STORAGE_KEYS = {
  EVENTS_HARDWARE: 'eco_bms_lighting_events_hw_v1',
  EVENTS_DEMO: 'eco_bms_lighting_events_demo_v1',
  INTERVALS_HARDWARE: 'eco_bms_lighting_intervals_hw_v1',
  INTERVALS_DEMO: 'eco_bms_lighting_intervals_demo_v1'
};

const MAX_STORED_EVENTS = 300;
const MAX_STORED_INTERVALS = 150;

export class LightingHistoryService {
  constructor() {
    this.mode = 'demo'; // 'demo' | 'hardware'
    this.currentState = 'OFF'; // 'ON' | 'OFF'
    this.currentDesiredState = 0; // 0 | 1
    this.currentActualState = 0; // 0 | 1
    this.activeInterval = null; // Open ongoing interval { id, startTime, state: 'ON', ... }
    
    // In-memory cache for fast retrieval & subscriptions
    this.eventsHardware = this.loadStored(STORAGE_KEYS.EVENTS_HARDWARE, []);
    this.eventsDemo = this.loadStored(STORAGE_KEYS.EVENTS_DEMO, []);
    this.intervalsHardware = this.loadStored(STORAGE_KEYS.INTERVALS_HARDWARE, []);
    this.intervalsDemo = this.loadStored(STORAGE_KEYS.INTERVALS_DEMO, []);

    // Seed realistic Demo data if empty
    if (this.intervalsDemo.length === 0) {
      this.seedDemoData();
    }

    // Check if an unclosed ongoing interval was preserved in storage
    this.restoreActiveInterval();

    this.listeners = new Set();
  }

  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const test = '__light_hist_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  loadStored(key, fallback = []) {
    if (!this.isStorageAvailable()) return fallback;
    try {
      const data = window.localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
      console.warn(`LightingHistoryService: Failed to parse ${key}:`, err);
      return fallback;
    }
  }

  persist(key, data) {
    if (!this.isStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`LightingHistoryService: Storage write error for ${key}:`, err);
    }
  }

  setMode(mode) {
    const normalized = (mode || 'demo').toLowerCase() === 'hardware' ? 'hardware' : 'demo';
    if (this.mode !== normalized) {
      this.mode = normalized;
      this.restoreActiveInterval();
      this.notify();
    }
  }

  getEventsList() {
    return this.mode === 'hardware' ? this.eventsHardware : this.eventsDemo;
  }

  getIntervalsList() {
    return this.mode === 'hardware' ? this.intervalsHardware : this.intervalsDemo;
  }

  saveEventsList(list) {
    if (this.mode === 'hardware') {
      this.eventsHardware = list.slice(0, MAX_STORED_EVENTS);
      this.persist(STORAGE_KEYS.EVENTS_HARDWARE, this.eventsHardware);
    } else {
      this.eventsDemo = list.slice(0, MAX_STORED_EVENTS);
      this.persist(STORAGE_KEYS.EVENTS_DEMO, this.eventsDemo);
    }
  }

  saveIntervalsList(list) {
    if (this.mode === 'hardware') {
      this.intervalsHardware = list.slice(0, MAX_STORED_INTERVALS);
      this.persist(STORAGE_KEYS.INTERVALS_HARDWARE, this.intervalsHardware);
    } else {
      this.intervalsDemo = list.slice(0, MAX_STORED_INTERVALS);
      this.persist(STORAGE_KEYS.INTERVALS_DEMO, this.intervalsDemo);
    }
  }

  restoreActiveInterval() {
    const intervals = this.getIntervalsList();
    const open = intervals.find((intv) => intv.state === 'ON' && !intv.endTime);
    if (open) {
      this.activeInterval = open;
      this.currentState = 'ON';
      this.currentActualState = 1;
    } else {
      this.activeInterval = null;
      this.currentState = 'OFF';
      this.currentActualState = 0;
    }
  }

  /**
   * Primary Telemetry Transition Recorder
   * Evaluated whenever actual room light state from Arduino or Demo mode changes.
   */
  recordStateChange({
    newState, // 0 | 1 or 'ON' | 'OFF'
    desiredState = null, // 0 | 1
    occupancy = 'UNKNOWN', // 'OCCUPIED' | 'UNOCCUPIED' | 'UNKNOWN'
    ldr = null, // ADC reading 0-1023
    reason = '',
    customTimestamp = null
  }) {
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    const nowIso = now.toISOString();

    const normalizedNewState = (newState === 1 || newState === 'ON' || newState === true) ? 'ON' : 'OFF';
    const numActual = normalizedNewState === 'ON' ? 1 : 0;
    const numDesired = desiredState !== null ? (desiredState === 1 || desiredState === 'ON' ? 1 : 0) : numActual;
    const numLdr = (ldr !== null && ldr !== undefined && !isNaN(Number(ldr))) ? Number(ldr) : null;
    const isDaylight = numLdr !== null && numLdr >= energyConfig.getConfig().daylightThresholdAdc;

    const previousState = this.currentState;
    this.currentDesiredState = numDesired;
    this.currentActualState = numActual;

    // Rule 1: Deduplicate consecutive identical states
    if (previousState === normalizedNewState) {
      // No state transition occurred. Update active interval telemetry context if ON
      if (normalizedNewState === 'ON' && this.activeInterval) {
        if (numLdr !== null) {
          const count = this.activeInterval.ldrCount || 1;
          const prevAvg = this.activeInterval.avgLdr || numLdr;
          this.activeInterval.avgLdr = Math.round((prevAvg * count + numLdr) / (count + 1));
          this.activeInterval.ldrCount = count + 1;
        }
      }
      return null;
    }

    this.currentState = normalizedNewState;

    // Build transition event
    const event = {
      id: `light-evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: nowIso,
      previousState,
      currentState: normalizedNewState,
      actualHardwareConfirmed: numActual,
      desiredState: numDesired,
      occupancy,
      ldr: numLdr,
      daylight: isDaylight,
      mode: this.mode.toUpperCase(),
      reason: reason || (normalizedNewState === 'ON' 
        ? 'Room LED energized.' 
        : 'Room LED de-energized.')
    };

    const currentEvents = this.getEventsList();
    this.saveEventsList([event, ...currentEvents]);

    // Handle Interval Lifecycle
    if (normalizedNewState === 'ON') {
      // 1. Close any prior open interval (safety)
      if (this.activeInterval && !this.activeInterval.endTime) {
        this.activeInterval.endTime = nowIso;
        const dur = Math.max(1, Math.round((now.getTime() - new Date(this.activeInterval.startTime).getTime()) / 1000));
        this.activeInterval.durationSeconds = dur;
      }

      // 2. Open new ON interval
      const newInterval = {
        id: `intv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        startTime: nowIso,
        endTime: null, // open
        durationSeconds: 0,
        state: 'ON',
        mode: this.mode.toUpperCase(),
        occupancyAtStart: occupancy,
        avgLdr: numLdr !== null ? numLdr : 300,
        ldrCount: 1,
        isDaylight,
        startReason: reason || 'Room LED switched ON'
      };

      this.activeInterval = newInterval;
      const currentIntervals = this.getIntervalsList();
      this.saveIntervalsList([newInterval, ...currentIntervals]);
    } else {
      // Transition to OFF: Close active interval
      if (this.activeInterval) {
        this.activeInterval.endTime = nowIso;
        const dur = Math.max(1, Math.round((now.getTime() - new Date(this.activeInterval.startTime).getTime()) / 1000));
        this.activeInterval.durationSeconds = dur;
        this.activeInterval.endReason = reason || 'Room LED switched OFF';
        this.saveIntervalsList(this.getIntervalsList());
        this.activeInterval = null;
      }
    }

    serialService.appendLog(`[LIGHTING HISTORY] ${previousState} -> ${normalizedNewState} (${event.mode}) - ${event.reason}`);
    this.notify();
    return event;
  }

  /**
   * Returns all intervals within a given date window,
   * cleanly splitting multi-day and ongoing sessions at boundaries.
   */
  getIntervalsForRange(startDate, endDate, refNow = new Date()) {
    const all = this.getIntervalsList();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const nowMs = refNow.getTime();

    const result = [];

    all.forEach((intv) => {
      const iStartMs = new Date(intv.startTime).getTime();
      const iEndMs = intv.endTime ? new Date(intv.endTime).getTime() : nowMs;

      // Check overlap
      const overlapStart = Math.max(iStartMs, startMs);
      const overlapEnd = Math.min(iEndMs, endMs, nowMs);

      if (overlapEnd > overlapStart) {
        const durSec = Math.max(1, Math.round((overlapEnd - overlapStart) / 1000));
        result.push({
          ...intv,
          clampedStartTime: new Date(overlapStart).toISOString(),
          clampedEndTime: new Date(overlapEnd).toISOString(),
          durationSeconds: durSec,
          isOngoing: !intv.endTime && iEndMs >= nowMs
        });
      }
    });

    return result;
  }

  getTodayBounds(refDate = new Date()) {
    const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
    const end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  getTodayIntervals(refDate = new Date()) {
    const { start, end } = this.getTodayBounds(refDate);
    return this.getIntervalsForRange(start, end, new Date());
  }

  getTodayEvents(refDate = new Date()) {
    const all = this.getEventsList();
    const { start, end } = this.getTodayBounds(refDate);
    return all.filter((ev) => {
      const t = new Date(ev.timestamp).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }

  /**
   * Seed realistic commercial workday lighting intervals in Demo Mode
   */
  seedDemoData() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    // Workday Schedule:
    // 1. Morning Task Lighting: 08:30 to 10:15 (1h 45m = 105 mins, 6300s, LDR 240, dim)
    // 2. Midday Daylight Off: 10:15 to 14:00 (OFF, LDR 720, daylight harvested)
    // 3. Afternoon Meeting: 14:00 to 15:45 (1h 45m = 105 mins, 6300s, LDR 310, artificial ON)
    // 4. Dusk Overtime: 17:15 to 18:30 (1h 15m = 75 mins, 4500s, LDR 190, artificial ON)
    const seedIntervals = [
      {
        id: 'intv-demo-1',
        startTime: new Date(y, m, d, 8, 30, 0).toISOString(),
        endTime: new Date(y, m, d, 10, 15, 0).toISOString(),
        durationSeconds: 6300,
        state: 'ON',
        mode: 'DEMO',
        occupancyAtStart: 'OCCUPIED',
        avgLdr: 240,
        isDaylight: false,
        startReason: 'Morning arrival in dim conditions (LDR 240 ADC < 500 ADC). Task lighting activated.'
      },
      {
        id: 'intv-demo-2',
        startTime: new Date(y, m, d, 14, 0, 0).toISOString(),
        endTime: new Date(y, m, d, 15, 45, 0).toISOString(),
        durationSeconds: 6300,
        state: 'ON',
        mode: 'DEMO',
        occupancyAtStart: 'OCCUPIED',
        avgLdr: 310,
        isDaylight: false,
        startReason: 'Afternoon conference session. Cloud cover reduced ambient illuminance.'
      },
      {
        id: 'intv-demo-3',
        startTime: new Date(y, m, d, 17, 15, 0).toISOString(),
        endTime: new Date(y, m, d, 18, 30, 0).toISOString(),
        durationSeconds: 4500,
        state: 'ON',
        mode: 'DEMO',
        occupancyAtStart: 'OCCUPIED',
        avgLdr: 190,
        isDaylight: false,
        startReason: 'Dusk overtime work. Solar daylight diminished.'
      }
    ];

    const seedEvents = [
      {
        id: 'light-evt-demo-1',
        timestamp: new Date(y, m, d, 8, 30, 0).toISOString(),
        previousState: 'OFF',
        currentState: 'ON',
        actualHardwareConfirmed: 1,
        desiredState: 1,
        occupancy: 'OCCUPIED',
        ldr: 240,
        daylight: false,
        mode: 'DEMO',
        reason: 'Morning task lighting energized.'
      },
      {
        id: 'light-evt-demo-2',
        timestamp: new Date(y, m, d, 10, 15, 0).toISOString(),
        previousState: 'ON',
        currentState: 'OFF',
        actualHardwareConfirmed: 0,
        desiredState: 0,
        occupancy: 'OCCUPIED',
        ldr: 680,
        daylight: true,
        mode: 'DEMO',
        reason: 'Daylight harvesting: Adequate sunlight available.'
      },
      {
        id: 'light-evt-demo-3',
        timestamp: new Date(y, m, d, 14, 0, 0).toISOString(),
        previousState: 'OFF',
        currentState: 'ON',
        actualHardwareConfirmed: 1,
        desiredState: 1,
        occupancy: 'OCCUPIED',
        ldr: 310,
        daylight: false,
        mode: 'DEMO',
        reason: 'Afternoon session initiated.'
      },
      {
        id: 'light-evt-demo-4',
        timestamp: new Date(y, m, d, 15, 45, 0).toISOString(),
        previousState: 'ON',
        currentState: 'OFF',
        actualHardwareConfirmed: 0,
        desiredState: 0,
        occupancy: 'UNOCCUPIED',
        ldr: 420,
        daylight: false,
        mode: 'DEMO',
        reason: '30s absence timeout: Room confirmed vacant.'
      },
      {
        id: 'light-evt-demo-5',
        timestamp: new Date(y, m, d, 17, 15, 0).toISOString(),
        previousState: 'OFF',
        currentState: 'ON',
        actualHardwareConfirmed: 1,
        desiredState: 1,
        occupancy: 'OCCUPIED',
        ldr: 190,
        daylight: false,
        mode: 'DEMO',
        reason: 'Dusk overtime session.'
      },
      {
        id: 'light-evt-demo-6',
        timestamp: new Date(y, m, d, 18, 30, 0).toISOString(),
        previousState: 'ON',
        currentState: 'OFF',
        actualHardwareConfirmed: 0,
        desiredState: 0,
        occupancy: 'UNOCCUPIED',
        ldr: 80,
        daylight: false,
        mode: 'DEMO',
        reason: 'End of workday vacancy cutoff.'
      }
    ];

    this.intervalsDemo = seedIntervals;
    this.eventsDemo = seedEvents;
    this.persist(STORAGE_KEYS.INTERVALS_DEMO, seedIntervals);
    this.persist(STORAGE_KEYS.EVENTS_DEMO, seedEvents);
  }

  clearHistory() {
    if (this.mode === 'hardware') {
      this.eventsHardware = [];
      this.intervalsHardware = [];
      this.persist(STORAGE_KEYS.EVENTS_HARDWARE, []);
      this.persist(STORAGE_KEYS.INTERVALS_HARDWARE, []);
    } else {
      this.eventsDemo = [];
      this.intervalsDemo = [];
      this.persist(STORAGE_KEYS.EVENTS_DEMO, []);
      this.persist(STORAGE_KEYS.INTERVALS_DEMO, []);
    }
    this.activeInterval = null;
    this.currentState = 'OFF';
    this.currentActualState = 0;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('LightingHistoryService listener error:', err);
      }
    });
  }

  getState() {
    const now = new Date();
    const todayIntervals = this.getTodayIntervals(now);
    const todayEvents = this.getTodayEvents(now);

    let totalOnSeconds = 0;
    todayIntervals.forEach((intv) => {
      if (intv.state === 'ON') {
        totalOnSeconds += intv.durationSeconds;
      }
    });

    return {
      mode: this.mode,
      currentState: this.currentState,
      currentActualState: this.currentActualState,
      currentDesiredState: this.currentDesiredState,
      activeInterval: this.activeInterval ? { ...this.activeInterval } : null,
      todayOnSeconds: totalOnSeconds,
      todayOnHours: Number((totalOnSeconds / 3600).toFixed(2)),
      todayIntervalsCount: todayIntervals.length,
      todayEventsCount: todayEvents.length,
      recentEvents: todayEvents.slice(0, 20),
      allIntervalsCount: this.getIntervalsList().length,
      allEventsCount: this.getEventsList().length
    };
  }
}

export const lightingHistoryService = new LightingHistoryService();
