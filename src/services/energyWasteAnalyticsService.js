/**
 * Intelligent Energy Waste Analytics Service (Phase 6)
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Analyzes lighting usage alongside AI occupancy and physical LDR readings.
 * Evaluates 5 distinct operational scenarios:
 * 1. Lighting ON in an Unoccupied Room (Avoidable Vacancy Drain)
 * 2. Lighting ON during Sufficient Daylight (Daylight Harvesting Inefficiency)
 * 3. Lighting OFF when Artificial Lighting is Required (Task Illuminance Deficit Warning)
 * 4. Efficient Lighting Operation (Optimal Occupancy & Daylight Alignment)
 * 5. Unknown / Stale Sensor Information (Failsafe Incomplete Analysis)
 */

import { energyConfig } from '../config/energyConfig.js';
import { serialService } from './serialService.js';

export const WASTE_EVENT_TYPES = {
  VACANCY_LIGHT_WASTE: 'VACANCY_LIGHT_WASTE',
  DAYLIGHT_HARVEST_WASTE: 'DAYLIGHT_HARVEST_WASTE',
  ILLUMINANCE_DEFICIT_WARNING: 'ILLUMINANCE_DEFICIT_WARNING',
  EFFICIENT_OPERATION: 'EFFICIENT_OPERATION',
  INCOMPLETE_ANALYSIS: 'INCOMPLETE_ANALYSIS'
};

const STORAGE_KEYS = {
  WASTE_EVENTS_HW: 'eco_bms_waste_events_hw_v1',
  WASTE_EVENTS_DEMO: 'eco_bms_waste_events_demo_v1'
};

const MAX_STORED_WASTE_EVENTS = 200;

export class EnergyWasteAnalyticsService {
  constructor() {
    this.mode = 'demo'; // 'demo' | 'hardware'
    this.eventsHardware = this.loadStored(STORAGE_KEYS.WASTE_EVENTS_HW, []);
    this.eventsDemo = this.loadStored(STORAGE_KEYS.WASTE_EVENTS_DEMO, []);

    // Last evaluated condition signatures to suppress repetitive alerts
    this.lastEvaluatedSignature = null;
    this.lastEvaluatedTimestamp = 0;

    if (this.eventsDemo.length === 0) {
      this.seedDemoWasteEvents();
    }

    this.listeners = new Set();
  }

  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const test = '__waste_analytics_test__';
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
      console.warn(`EnergyWasteAnalyticsService: Failed to parse ${key}:`, err);
      return fallback;
    }
  }

  persist(key, data) {
    if (!this.isStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`EnergyWasteAnalyticsService: Storage write error for ${key}:`, err);
    }
  }

  setMode(mode) {
    const normalized = (mode || 'demo').toLowerCase() === 'hardware' ? 'hardware' : 'demo';
    if (this.mode !== normalized) {
      this.mode = normalized;
      this.lastEvaluatedSignature = null;
      this.notify();
    }
  }

  getEventsList() {
    return this.mode === 'hardware' ? this.eventsHardware : this.eventsDemo;
  }

  saveEventsList(list) {
    if (this.mode === 'hardware') {
      this.eventsHardware = list.slice(0, MAX_STORED_WASTE_EVENTS);
      this.persist(STORAGE_KEYS.WASTE_EVENTS_HW, this.eventsHardware);
    } else {
      this.eventsDemo = list.slice(0, MAX_STORED_WASTE_EVENTS);
      this.persist(STORAGE_KEYS.WASTE_EVENTS_DEMO, this.eventsDemo);
    }
  }

  clearEvents() {
    if (this.mode === 'hardware') {
      this.eventsHardware = [];
      this.persist(STORAGE_KEYS.WASTE_EVENTS_HW, []);
    } else {
      this.eventsDemo = [];
      this.persist(STORAGE_KEYS.WASTE_EVENTS_DEMO, []);
    }
    this.lastEvaluatedSignature = null;
    this.notify();
  }

  /**
   * Primary Waste Assessment Engine
   * Evaluates instantaneous condition across Occupancy, LDR, and actual Room LED state.
   */
  evaluateCondition({
    occupancy, // 'OCCUPIED' | 'UNOCCUPIED' | 'UNKNOWN'
    lightAdc,  // number 0-1023 or null
    roomLight, // 0 | 1 or 'ON' | 'OFF'
    customTimestamp = null
  }) {
    const cfg = energyConfig.getConfig();
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    const nowIso = now.toISOString();

    const isLightOn = roomLight === 1 || roomLight === 'ON' || roomLight === true;
    const isLdrValid = lightAdc !== null && lightAdc !== undefined && !isNaN(Number(lightAdc));
    const numLdr = isLdrValid ? Number(lightAdc) : null;
    const isDaylightSufficient = isLdrValid && numLdr >= cfg.daylightThresholdAdc;

    // SCENARIO 5: Unknown or stale sensor information
    if (!occupancy || occupancy === 'UNKNOWN' || (!isLdrValid && isLightOn)) {
      const missingDetails = [];
      if (!occupancy || occupancy === 'UNKNOWN') missingDetails.push('Camera/Occupancy UNKNOWN');
      if (!isLdrValid) missingDetails.push('LDR telemetry unavailable');

      return {
        scenario: 5,
        type: WASTE_EVENT_TYPES.INCOMPLETE_ANALYSIS,
        isWaste: false,
        isIncomplete: true,
        category: 'Incomplete Telemetry',
        title: 'Sensor Data Incomplete',
        description: `Cannot verify energy performance: ${missingDetails.join(', ')}. Withholding unsupported waste calculations.`,
        avoidableWatts: 0,
        missingDetails
      };
    }

    // SCENARIO 1: Lighting ON in an unoccupied room
    if (occupancy === 'UNOCCUPIED' && isLightOn) {
      const result = {
        scenario: 1,
        type: WASTE_EVENT_TYPES.VACANCY_LIGHT_WASTE,
        isWaste: true,
        isIncomplete: false,
        category: 'Unoccupied Space Drain',
        title: 'Vacant Space Lighting Wastage',
        description: `Room is confirmed unoccupied (30s absence timeout elapsed), yet Room LED remains energized on Pin D7 (${cfg.powerRatingWatts} W).`,
        avoidableWatts: cfg.powerRatingWatts,
        severity: 'CRITICAL',
        occupancy,
        lightAdc: numLdr,
        roomLight: 1
      };
      this.recordWasteEventIfChanged(result, nowIso);
      return result;
    }

    // SCENARIO 2: Lighting ON during sufficient daylight
    if (occupancy === 'OCCUPIED' && isDaylightSufficient && isLightOn) {
      const result = {
        scenario: 2,
        type: WASTE_EVENT_TYPES.DAYLIGHT_HARVEST_WASTE,
        isWaste: true,
        isIncomplete: false,
        category: 'Daylight Inefficiency',
        title: 'Daylight Harvesting Inefficiency',
        description: `Natural daylight (${numLdr} ADC >= ${cfg.daylightThresholdAdc} ADC) provides adequate illumination, but Room LED is active (${cfg.powerRatingWatts} W).`,
        avoidableWatts: cfg.powerRatingWatts,
        severity: 'WARNING',
        occupancy,
        lightAdc: numLdr,
        roomLight: 1
      };
      this.recordWasteEventIfChanged(result, nowIso);
      return result;
    }

    // SCENARIO 3: Lighting OFF when artificial lighting is required
    if (occupancy === 'OCCUPIED' && !isDaylightSufficient && !isLightOn) {
      const result = {
        scenario: 3,
        type: WASTE_EVENT_TYPES.ILLUMINANCE_DEFICIT_WARNING,
        isWaste: false,
        isWarning: true,
        isIncomplete: false,
        category: 'Task Illuminance Deficit',
        title: 'Task Lighting Deficit Warning',
        description: `Person is present and ambient daylight is insufficient (${numLdr} ADC < ${cfg.daylightThresholdAdc} ADC), but Room LED is OFF. Visual comfort may be compromised.`,
        avoidableWatts: 0,
        severity: 'ADVISORY',
        occupancy,
        lightAdc: numLdr,
        roomLight: 0
      };
      this.recordWasteEventIfChanged(result, nowIso);
      return result;
    }

    // SCENARIO 4: Efficient lighting operation
    const result = {
      scenario: 4,
      type: WASTE_EVENT_TYPES.EFFICIENT_OPERATION,
      isWaste: false,
      isIncomplete: false,
      category: 'Optimal Efficiency',
      title: 'Efficient Lighting Alignment',
      description: occupancy === 'UNOCCUPIED' 
        ? 'Room is vacant and lights are OFF (Zero standby drain).'
        : (isDaylightSufficient 
            ? `Natural daylight (${numLdr} ADC) harvested with zero artificial lighting load.`
            : `Task lighting (${cfg.powerRatingWatts} W) active strictly to satisfy required illuminance.`),
      avoidableWatts: 0,
      severity: 'OPTIMAL',
      occupancy,
      lightAdc: numLdr,
      roomLight: isLightOn ? 1 : 0
    };
    return result;
  }

  recordWasteEventIfChanged(result, timestampIso) {
    const signature = `${result.type}-${result.occupancy}-${result.roomLight}-${result.severity}`;
    const nowMs = Date.now();

    // Deduplicate identical waste event signatures within 10 seconds
    if (this.lastEvaluatedSignature === signature && (nowMs - this.lastEvaluatedTimestamp < 10000)) {
      return;
    }

    this.lastEvaluatedSignature = signature;
    this.lastEvaluatedTimestamp = nowMs;

    const event = {
      id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: timestampIso,
      eventType: result.type,
      category: result.category,
      title: result.title,
      description: result.description,
      avoidableWatts: result.avoidableWatts || 0,
      severity: result.severity,
      occupancy: result.occupancy,
      lightAdc: result.lightAdc,
      mode: this.mode.toUpperCase()
    };

    const current = this.getEventsList();
    this.saveEventsList([event, ...current]);
    serialService.appendLog(`[ENERGY WASTE] ${event.title} (${event.severity}) - ${event.description}`);
    this.notify();
  }

  /**
   * Seed realistic historical waste events for Demo Mode
   */
  seedDemoWasteEvents() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    const seed = [
      {
        id: 'waste-demo-1',
        timestamp: new Date(y, m, d, 10, 10, 0).toISOString(),
        eventType: WASTE_EVENT_TYPES.DAYLIGHT_HARVEST_WASTE,
        category: 'Daylight Inefficiency',
        title: 'Daylight Harvesting Inefficiency',
        description: 'Natural daylight (680 ADC >= 500 ADC) was adequate, but lights remained ON for 5 minutes before auto shutoff.',
        avoidableWatts: 9,
        severity: 'WARNING',
        occupancy: 'OCCUPIED',
        lightAdc: 680,
        mode: 'DEMO'
      },
      {
        id: 'waste-demo-2',
        timestamp: new Date(y, m, d, 15, 40, 0).toISOString(),
        eventType: WASTE_EVENT_TYPES.VACANCY_LIGHT_WASTE,
        category: 'Unoccupied Space Drain',
        title: 'Vacant Space Lighting Wastage',
        description: 'Room became unoccupied; 30s absence countdown active before D7 de-energized.',
        avoidableWatts: 9,
        severity: 'CRITICAL',
        occupancy: 'UNOCCUPIED',
        lightAdc: 420,
        mode: 'DEMO'
      }
    ];

    this.eventsDemo = seed;
    this.persist(STORAGE_KEYS.WASTE_EVENTS_DEMO, seed);
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
        console.error('EnergyWasteAnalyticsService listener error:', err);
      }
    });
  }

  getState() {
    const events = this.getEventsList();
    const criticalCount = events.filter((e) => e.severity === 'CRITICAL').length;
    const warningCount = events.filter((e) => e.severity === 'WARNING').length;

    return {
      mode: this.mode,
      wasteEvents: [...events],
      totalWasteEventsCount: events.length,
      criticalCount,
      warningCount,
      recentWasteEvents: events.slice(0, 15)
    };
  }
}

export const energyWasteAnalyticsService = new EnergyWasteAnalyticsService();
