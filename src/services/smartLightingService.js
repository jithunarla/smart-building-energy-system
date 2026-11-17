/**
 * Smart Lighting Decision Service (Phase 4)
 * Combines AI webcam occupancy detection with physical LDR photoresistor telemetry.
 * 
 * Rules:
 * - OCCUPIED + LDR < 500  => Turn room LED ON (Action: LIGHT_ON)
 * - OCCUPIED + LDR >= 500 => Turn room LED OFF (Action: LIGHT_OFF)
 * - UNOCCUPIED + Any LDR  => Turn room LED OFF (Action: LIGHT_OFF)
 * - UNKNOWN + Any LDR     => Failsafe: Do NOT issue automatic ON command. Safe fallback.
 * 
 * Features:
 * - Manual override mode support (user override is never overwritten by auto AI)
 * - Serial command deduplication (commands sent only on state change)
 * - Transparent reasoning & distinction between desired and Arduino-confirmed state
 */

import { serialService } from './serialService.js';
import { OCCUPANCY_STATES, occupancyDetectionService } from './occupancyDetectionService.js';

export const DAYLIGHT_THRESHOLDS = {
  HARVESTING_CUTOFF: 500, // 0-499: ON; 500-1023: OFF
  ABUNDANT_DAYLIGHT: 750,
  DIM_LIGHTING: 250
};

export class SmartLightingService {
  constructor() {
    this.manualOverride = false;
    this.desiredLightState = 0; // 0 = OFF, 1 = ON
    this.lastDispatchedCommand = null;
    this.lastDecisionReason = 'System initialized. Awaiting sensor and camera streams.';
    this.lastDecisionRule = 0;
    this.lastDecisionTimestamp = new Date();

    // Cache latest known telemetry for instant presence re-evaluations
    this.lastKnownLdr = null;
    this.lastKnownActualLight = null;
    this.lastOccupiedTimestamp = 0;
    this.lastDispatchedTimestamp = 0;

    // Decision history buffer (up to 20 entries)
    this.decisionHistory = [];

    // Observers
    this.listeners = new Set();

    // Hook occupancy detection for immediate re-triggering upon person entry
    if (occupancyDetectionService && occupancyDetectionService.onPersonDetected) {
      occupancyDetectionService.onPersonDetected((count) => {
        this.handlePersonDetected(count);
      });
    }

    // Hook serial connection for instant state resynchronization
    if (serialService && serialService.onConnect) {
      serialService.onConnect(() => {
        this.resetSyncState();
      });
    }
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
        console.error('SmartLightingService listener error:', err);
      }
    });
  }

  getState() {
    return {
      manualOverride: this.manualOverride,
      desiredLightState: this.desiredLightState,
      lastDispatchedCommand: this.lastDispatchedCommand,
      lastDecisionReason: this.lastDecisionReason,
      lastDecisionRule: this.lastDecisionRule,
      lastDecisionTimestamp: this.lastDecisionTimestamp,
      decisionHistory: [...this.decisionHistory]
    };
  }

  resetSyncState() {
    // Called upon hardware connect / reconnect to re-synchronize desired state
    this.lastDispatchedCommand = null;
    this.lastDispatchedTimestamp = 0;
    serialService.appendLog('[SMART LIGHTING] Reconnect synchronization: Command history reset.');
    if (this.lastKnownLdr !== null) {
      this.evaluateLightingDecision(
        occupancyDetectionService.getState().occupancyStatus,
        this.lastKnownLdr,
        true,
        this.lastKnownActualLight,
        true
      );
    }
  }

  handlePersonDetected(count) {
    this.lastOccupiedTimestamp = Date.now();
    serialService.appendLog(`[SMART LIGHTING] Person detected event received (${count} person(s)). Re-evaluating LDR...`);

    // Immediate re-evaluation with forceDispatch = true
    if (this.lastKnownLdr !== null) {
      this.evaluateLightingDecision(
        OCCUPANCY_STATES.OCCUPIED,
        this.lastKnownLdr,
        true,
        this.lastKnownActualLight,
        true // forceDispatch ensures LIGHT_ON is sent even if last command was LIGHT_ON
      );
    }
  }

  setManualOverride(enabled) {
    this.manualOverride = Boolean(enabled);
    serialService.sendManualMode(this.manualOverride);
    serialService.appendLog(`[SMART LIGHTING] Manual override ${this.manualOverride ? 'ENABLED' : 'DISABLED'}.`);
    this.notify();
  }

  async forceManualLightToggle(targetState = null) {
    this.manualOverride = true;
    const newState = targetState !== null ? (targetState ? 1 : 0) : (this.desiredLightState === 1 ? 0 : 1);
    this.desiredLightState = newState;
    this.lastDecisionReason = `Manual operator override: Luminaire forced ${newState === 1 ? 'ON' : 'OFF'}`;
    this.lastDecisionRule = 99;
    this.lastDecisionTimestamp = new Date();

    serialService.appendLog(`[SMART LIGHTING] Operator forced light ${newState === 1 ? 'ON' : 'OFF'}.`);
    await (newState === 1 ? serialService.sendLightOn() : serialService.sendLightOff());
    this.recordDecision(newState, this.lastDecisionReason, 'MANUAL_OVERRIDE');
    this.notify();
  }

  /**
   * Primary AI + LDR Lighting Decision Evaluation
   * Evaluated continuously on sensor or occupancy updates.
   */
  evaluateLightingDecision(occupancyState, lightAdc, isHardwareMode = false, actualRoomLight = null, forceDispatch = false) {
    // Cache latest telemetry
    if (lightAdc !== null && lightAdc !== undefined && !isNaN(Number(lightAdc))) {
      this.lastKnownLdr = Number(lightAdc);
    }
    if (actualRoomLight !== null && actualRoomLight !== undefined) {
      this.lastKnownActualLight = Number(actualRoomLight);
    }

    // 1. If Manual Override is active, do not allow automated rules to override user setting
    if (this.manualOverride) {
      return {
        desiredState: this.desiredLightState,
        ruleNumber: 99,
        reason: `Manual Override Active: Luminaire maintained in user-selected state (${this.desiredLightState === 1 ? 'ON' : 'OFF'}).`,
        isOverride: true
      };
    }

    // Guard against stale asynchronous timeout callbacks:
    // If an earlier UNOCCUPIED callback arrives after a person has already returned, reject it!
    if (occupancyState === OCCUPANCY_STATES.UNOCCUPIED && (Date.now() - this.lastOccupiedTimestamp < 2000)) {
      serialService.appendLog('[SMART LIGHTING] Discarded stale UNOCCUPIED callback: Person recently detected.');
      occupancyState = OCCUPANCY_STATES.OCCUPIED;
    }

    const isLdrValid = lightAdc !== null && lightAdc !== undefined && !isNaN(Number(lightAdc));
    const numericLdr = isLdrValid ? Number(lightAdc) : null;
    let targetState = 0;
    let ruleNumber = 0;
    let reason = '';

    // 2. Truth Table Rule Evaluation:
    // OCCUPIED + LDR 0-499    => ON (Rule 1)
    // OCCUPIED + LDR 500-1023 => OFF (Rule 2 - Daylight Harvesting)
    // UNOCCUPIED + Any LDR    => OFF (Rule 3 - Vacancy cutoff)
    // UNKNOWN + Any LDR       => OFF (Rule 4 - Failsafe fallback)
    if (occupancyState === OCCUPANCY_STATES.OCCUPIED) {
      if (!isLdrValid) {
        targetState = 0;
        ruleNumber = 0;
        reason = 'Person detected, but LDR sensor data is unavailable. Automatic ON command withheld for safety.';
      } else if (numericLdr < DAYLIGHT_THRESHOLDS.HARVESTING_CUTOFF) {
        // 0 to 499 ADC -> Task lighting ON
        targetState = 1;
        ruleNumber = 1;
        reason = `Person detected and ambient natural daylight is insufficient (${numericLdr} ADC < 500 ADC). Task lighting energizes room LED on Pin D7.`;
      } else {
        // 500 to 1023 ADC -> Daylight harvesting OFF
        targetState = 0;
        ruleNumber = 2;
        reason = `Person detected, but adequate natural daylight (${numericLdr} ADC >= 500 ADC) satisfies illuminance. Room LED de-energized to harvest solar daylight.`;
      }
    } else if (occupancyState === OCCUPANCY_STATES.UNOCCUPIED) {
      targetState = 0;
      ruleNumber = 3;
      reason = `Room is confirmed unoccupied (30s absence timeout elapsed). Room LED de-energized on Pin D7 to eliminate vacant burn hours.`;
    } else {
      // UNKNOWN OCCUPANCY
      targetState = 0;
      ruleNumber = 4;
      reason = 'Occupancy state is UNKNOWN (webcam inactive, permission blocked, or model error). Automatic ON command withheld for safety.';
    }

    const previousDesired = this.desiredLightState;
    this.desiredLightState = targetState;
    this.lastDecisionRule = ruleNumber;
    this.lastDecisionReason = reason;
    this.lastDecisionTimestamp = new Date();

    // 3. Command Deduplication & Transmission
    const targetCommand = targetState === 1 ? 'LIGHT_ON' : 'LIGHT_OFF';
    const commandChanged = this.lastDispatchedCommand !== targetCommand;
    
    // Hardware mismatch: Desired is ON, but actual telemetry reports pin D7 is LOW
    const now = Date.now();
    const hasHardwareMismatch = (actualRoomLight !== null && actualRoomLight !== undefined)
      ? (targetState === 1 && actualRoomLight === 0 && (now - this.lastDispatchedTimestamp > 1500))
      : false;

    if (commandChanged || forceDispatch || hasHardwareMismatch) {
      this.lastDispatchedCommand = targetCommand;
      this.lastDispatchedTimestamp = now;

      // Dispatch to serial service
      if (targetState === 1) {
        serialService.appendLog('[SMART LIGHTING] LIGHT_ON command queued.');
        serialService.sendLightOn();
      } else {
        serialService.appendLog('[SMART LIGHTING] LIGHT_OFF command queued.');
        serialService.sendLightOff();
      }

      this.recordDecision(targetState, reason, occupancyState, numericLdr);
      this.notify();
    } else if (previousDesired !== targetState) {
      this.notify();
    }

    return {
      desiredState: targetState,
      ruleNumber,
      reason,
      isOverride: false
    };
  }

  recordDecision(desiredState, reason, occupancyState, lightAdc = null) {
    const entry = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      desiredState,
      occupancyState,
      lightAdc,
      reason
    };
    this.decisionHistory = [entry, ...this.decisionHistory.slice(0, 19)];
  }
}

export const smartLightingService = new SmartLightingService();
