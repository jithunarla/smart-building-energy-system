/**
 * Realistic Sensor Simulation Engine (Phase 2)
 * Simulates physical telemetry dynamics for LDR, DHT11, PIR, and automatic lighting relays.
 */

import { INITIAL_SENSOR_DATA, SENSOR_CONFIG, DEMO_SCENARIOS, generate24HourHistory } from '../data/mockSensorData.js';
import { storageService } from './storageService.js';

export class SimulationService {
  constructor() {
    this.currentData = { ...INITIAL_SENSOR_DATA };
    this.inactivityTimeout = SENSOR_CONFIG.pir.defaultInactivityTimeout; // 45s default
    this.lastMotionTime = new Date(Date.now() - 5 * 1000); // 5 seconds ago
    this.motionCount = 14;
    this.activeScenarioId = 'standard_afternoon';
    
    // Simulation state
    this.isRunning = true;
    this.speedMultiplier = 1; // 1x = 2000ms tick, 2x = 1000ms, 0.5x = 4000ms
    this.baseIntervalMs = 2000;
    this.intervalId = null;
    this.listeners = new Set();

    // Load persisted history or fallback
    this.history = storageService.getHistory(generate24HourHistory());

    // Internal motion probability and drift momentum
    this.motionHoldTicks = 0; // Ticks remaining for active motion state
    this.ticksSinceScenarioChange = 0;
  }

  // Observer pattern
  subscribe(callback) {
    this.listeners.add(callback);
    // Immediately notify subscriber of current snapshot
    callback(this.getTelemetry());
    return () => this.listeners.delete(callback);
  }

  notify() {
    const telemetry = this.getTelemetry();
    this.listeners.forEach((fn) => {
      try {
        fn(telemetry);
      } catch (e) {
        console.error('SimulationService listener error:', e);
      }
    });
  }

  getTelemetry() {
    const secondsSinceLastMotion = Math.max(0, (Date.now() - this.lastMotionTime.getTime()) / 1000);
    const isOccupied = this.currentData.motion === 1 || secondsSinceLastMotion < this.inactivityTimeout;
    const inactivityRemaining = isOccupied 
      ? Math.max(0, Math.round(this.inactivityTimeout - secondsSinceLastMotion))
      : 0;

    return {
      sensorData: { ...this.currentData },
      isOccupied,
      lastMotionTime: this.lastMotionTime,
      motionCount: this.motionCount,
      inactivityTimeout: this.inactivityTimeout,
      inactivityRemaining,
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      activeScenarioId: this.activeScenarioId,
      history: [...this.history]
    };
  }

  // --- AUTOMATED LIGHTING ENGINE RULES ---
  // Rule 1: Motion detected + insufficient daylight = Light ON
  // Rule 2: Motion detected + sufficient daylight = Light OFF
  // Rule 3: No motion for configured inactivity period = Light OFF
  // Rule 4: No motion = Light OFF
  evaluateAutomaticLighting(lightAdc, motion, isOccupied) {
    const isDaylightSufficient = lightAdc >= SENSOR_CONFIG.ldr.daylightHarvestingThreshold; // >= 500 ADC

    if (isOccupied && !isDaylightSufficient) {
      return 1; // Light ON
    }
    return 0; // Light OFF
  }

  // --- SCENARIO APPLICATOR ---
  applyScenario(scenarioId) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    this.activeScenarioId = scenarioId;
    this.ticksSinceScenarioChange = 0;

    const inactivityOffset = scenario.inactivitySeconds !== undefined 
      ? scenario.inactivitySeconds 
      : (scenario.data.motion === 1 ? 0 : this.inactivityTimeout + 10);

    this.lastMotionTime = new Date(Date.now() - inactivityOffset * 1000);
    if (scenario.data.motion === 1) {
      this.motionCount += 1;
      this.motionHoldTicks = 3; // Keep motion active for 3 ticks
    } else {
      this.motionHoldTicks = 0;
    }

    const isOccupied = scenario.data.motion === 1 || inactivityOffset < this.inactivityTimeout;

    // Evaluate room light per scenario, but strictly obey lighting rules
    let roomLight = scenario.data.room_light;
    if (roomLight === undefined) {
      roomLight = this.evaluateAutomaticLighting(scenario.data.light_adc, scenario.data.motion, isOccupied);
    }

    this.currentData = {
      ...this.currentData,
      light_adc: scenario.data.light_adc,
      temperature: scenario.data.temperature,
      humidity: scenario.data.humidity,
      motion: scenario.data.motion,
      room_light: roomLight,
      timestamp: new Date().toISOString(),
      mode: 'demo'
    };

    // Append snapshot to history
    this.history = storageService.appendReading(this.currentData, this.history);

    this.notify();
  }

  // --- REALISTIC STEP SIMULATION (TICK) ---
  tick() {
    if (!this.isRunning) return;

    this.ticksSinceScenarioChange += 1;

    // A. LDR Gradual Drift (simulates subtle daylight fluctuations: clouds, sun angle)
    // Drift ±2 to ±5 ADC per step, clamped between 0 and 1023
    const ldrDrift = (Math.random() - 0.48) * 8;
    let nextLdr = Math.round(this.currentData.light_adc + ldrDrift);
    nextLdr = Math.max(0, Math.min(1023, nextLdr));

    // B. DHT11 Climate Simulation (smooth thermal mass, 18°C to 38°C, 30% to 85% RH)
    const tempDrift = (Math.random() - 0.49) * 0.2;
    let nextTemp = Number((this.currentData.temperature + tempDrift).toFixed(1));
    nextTemp = Math.max(18.0, Math.min(38.0, nextTemp));

    const humDrift = Math.round((Math.random() - 0.49) * 2);
    let nextHum = this.currentData.humidity + humDrift;
    nextHum = Math.max(30, Math.min(85, nextHum));

    // C. PIR Motion Simulation
    let nextMotion = this.currentData.motion;
    if (this.activeScenarioId === 'empty_room') {
      // Empty room scenario forces motion to 0
      nextMotion = 0;
    } else if (this.motionHoldTicks > 0) {
      this.motionHoldTicks -= 1;
      nextMotion = 1;
    } else {
      // Probabilistic human motion events in occupied spaces
      const motionChance = this.activeScenarioId === 'dark_room_occupied' || this.activeScenarioId === 'bright_daylight' ? 0.45 : 0.25;
      if (Math.random() < motionChance) {
        nextMotion = 1;
        this.lastMotionTime = new Date();
        this.motionCount += 1;
        this.motionHoldTicks = Math.floor(Math.random() * 2) + 1; // Hold 1-2 ticks
      } else {
        nextMotion = 0;
      }
    }

    // Inferred occupancy
    const secondsSinceLastMotion = Math.max(0, (Date.now() - this.lastMotionTime.getTime()) / 1000);
    const isOccupied = nextMotion === 1 || secondsSinceLastMotion < this.inactivityTimeout;

    // D. Room Lighting Automatic Evaluation
    const nextRoomLight = this.evaluateAutomaticLighting(nextLdr, nextMotion, isOccupied);

    // Update state
    this.currentData = {
      light_adc: nextLdr,
      temperature: nextTemp,
      humidity: nextHum,
      motion: nextMotion,
      room_light: nextRoomLight,
      timestamp: new Date().toISOString(),
      mode: 'demo'
    };

    // Append to rolling history
    this.history = storageService.appendReading(this.currentData, this.history);

    this.notify();
  }

  // --- MANUAL / USER CONTROLS ---
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextInterval();
    this.notify();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clearInterval();
    this.notify();
  }

  resume() {
    this.start();
  }

  reset() {
    this.pause();
    this.currentData = {
      ...INITIAL_SENSOR_DATA,
      timestamp: new Date().toISOString(),
      mode: 'demo'
    };
    this.lastMotionTime = new Date(Date.now() - 5 * 1000);
    this.motionCount = 0;
    this.activeScenarioId = 'standard_afternoon';
    this.inactivityTimeout = SENSOR_CONFIG.pir.defaultInactivityTimeout;
    this.history = storageService.clearHistory(generate24HourHistory());
    this.start();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    if (this.isRunning) {
      this.clearInterval();
      this.scheduleNextInterval();
    }
    this.notify();
  }

  setInactivityTimeout(seconds) {
    const clamped = Math.max(SENSOR_CONFIG.pir.minTimeout, Math.min(SENSOR_CONFIG.pir.maxTimeout, Number(seconds)));
    this.inactivityTimeout = clamped;
    this.notify();
  }

  // Direct manual sensor trigger (e.g., from interactive sliders/buttons)
  updateSensor(key, value) {
    this.currentData[key] = value;
    this.currentData.timestamp = new Date().toISOString();
    if (key === 'motion' && value === 1) {
      this.lastMotionTime = new Date();
      this.motionCount += 1;
      this.motionHoldTicks = 2;
    }
    this.notify();
  }

  // Inactivity simulation trigger
  pulseMotion() {
    this.lastMotionTime = new Date();
    this.motionCount += 1;
    this.currentData.motion = 1;
    this.motionHoldTicks = 2;
    this.currentData.timestamp = new Date().toISOString();
    
    // Automatically evaluate lighting
    const isOccupied = true;
    this.currentData.room_light = this.evaluateAutomaticLighting(
      this.currentData.light_adc, 
      1, 
      isOccupied
    );

    this.notify();
  }

  // Force toggle room light manually
  toggleRoomLight() {
    const nextState = this.currentData.room_light === 1 ? 0 : 1;
    this.currentData.room_light = nextState;
    this.currentData.timestamp = new Date().toISOString();
    this.notify();
  }

  // --- INTERVAL MANAGEMENT (PREVENTS DUPLICATE INTERVALS) ---
  scheduleNextInterval() {
    this.clearInterval();
    const intervalMs = Math.round(this.baseIntervalMs / this.speedMultiplier);
    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  clearInterval() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.clearInterval();
    this.listeners.clear();
  }
}

export const simulationService = new SimulationService();
