/**
 * Centralized Alert Service (Phase 4 Task 10)
 * Manages stateful alert lifecycle:
 * - Real-time rule evaluation (Rules 1 to 9)
 * - Alert deduplication and cooldown periods
 * - Automatic resolution when triggering conditions clear
 * - Persistent alert history in localStorage
 */

import { evaluateAlerts, SAMPLE_ALERT_HISTORY } from '../engine/alertEngine.js';

const STORAGE_KEY_ALERTS = 'eco_bms_alerts_state_v4';
const MAX_HISTORY_ITEMS = 50;

export class AlertService {
  constructor() {
    this.activeAlerts = [];
    this.resolvedAlerts = [];
    this.alertCooldowns = new Map(); // alertId -> lastTriggerTimeMs
    this.listeners = new Set();

    this.loadPersistedState();
  }

  isStorageAvailable() {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window;
    } catch (e) {
      return false;
    }
  }

  loadPersistedState() {
    if (!this.isStorageAvailable()) {
      this.resolvedAlerts = [...SAMPLE_ALERT_HISTORY];
      return;
    }
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_ALERTS);
      if (data) {
        const parsed = JSON.parse(data);
        this.activeAlerts = Array.isArray(parsed.active) ? parsed.active : [];
        this.resolvedAlerts = Array.isArray(parsed.resolved) && parsed.resolved.length > 0 
          ? parsed.resolved 
          : [...SAMPLE_ALERT_HISTORY];
      } else {
        this.resolvedAlerts = [...SAMPLE_ALERT_HISTORY];
      }
    } catch (e) {
      console.warn('AlertService: Failed to parse persisted alerts', e);
      this.resolvedAlerts = [...SAMPLE_ALERT_HISTORY];
    }
  }

  savePersistedState() {
    if (!this.isStorageAvailable()) return;
    try {
      const payload = {
        active: this.activeAlerts,
        resolved: this.resolvedAlerts.slice(-MAX_HISTORY_ITEMS)
      };
      window.localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(payload));
    } catch (e) {
      console.warn('AlertService: Failed to save alerts to storage', e);
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
        console.error('AlertService listener error:', err);
      }
    });
  }

  getState() {
    return {
      activeAlerts: [...this.activeAlerts],
      resolvedAlerts: [...this.resolvedAlerts],
      allAlerts: [...this.activeAlerts, ...this.resolvedAlerts],
      counts: {
        totalActive: this.activeAlerts.length,
        critical: this.activeAlerts.filter(a => a.severity === 'critical').length,
        warning: this.activeAlerts.filter(a => a.severity === 'warning').length,
        info: this.activeAlerts.filter(a => a.severity === 'info').length,
        efficient: this.activeAlerts.filter(a => a.severity === 'efficient').length,
        resolved: this.resolvedAlerts.length
      }
    };
  }

  /**
   * Evaluates current sensor data against all 9 rules,
   * performs deduplication, respects cooldowns, and auto-resolves ceased conditions.
   */
  evaluateAndSync(sensorData, isOccupied = null) {
    const rawAlerts = evaluateAlerts(sensorData, isOccupied);
    const now = Date.now();
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const activeRuleIds = new Set(rawAlerts.map(a => a.id));
    let stateChanged = false;

    // 1. AUTO-RESOLUTION: Check if any currently active alert is no longer triggered
    const remainingActive = [];
    for (const existing of this.activeAlerts) {
      if (!activeRuleIds.has(existing.id)) {
        // Condition ceased! Auto-resolve alert
        const resolvedRecord = {
          ...existing,
          status: 'resolved',
          resolvedAt: timeString,
          resolutionNote: `Automatically resolved: Condition cleared at ${timeString}`
        };
        this.resolvedAlerts = [resolvedRecord, ...this.resolvedAlerts.filter(r => r.id !== existing.id)].slice(0, MAX_HISTORY_ITEMS);
        stateChanged = true;
      } else {
        remainingActive.push(existing);
      }
    }
    this.activeAlerts = remainingActive;

    // 2. DEDUPLICATION & COOLDOWN: Process current raw alerts
    for (const raw of rawAlerts) {
      const existingActiveIndex = this.activeAlerts.findIndex(a => a.id === raw.id);

      if (existingActiveIndex >= 0) {
        // Already active: update description/metrics without modifying original creation timestamp
        this.activeAlerts[existingActiveIndex] = {
          ...this.activeAlerts[existingActiveIndex],
          description: raw.description,
          severity: raw.severity
        };
      } else {
        // Newly triggered alert
        const lastTrigger = this.alertCooldowns.get(raw.id) || 0;
        const cooldownMs = 8000; // 8-second cooldown to prevent noise

        if (now - lastTrigger >= cooldownMs) {
          const newAlert = {
            ...raw,
            uniqueInstanceId: `${raw.id}-${now}`,
            timestamp: timeString,
            status: 'active'
          };
          this.activeAlerts.push(newAlert);
          this.alertCooldowns.set(raw.id, now);
          stateChanged = true;
        }
      }
    }

    if (stateChanged) {
      this.savePersistedState();
      this.notify();
    }

    return this.getState();
  }

  dismissAlert(alertId) {
    const target = this.activeAlerts.find(a => a.id === alertId || a.uniqueInstanceId === alertId);
    if (!target) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const resolvedRecord = {
      ...target,
      status: 'resolved',
      resolvedAt: timeString,
      resolutionNote: 'Dismissed by facility operator'
    };

    this.activeAlerts = this.activeAlerts.filter(a => a.id !== target.id && a.uniqueInstanceId !== alertId);
    this.resolvedAlerts = [resolvedRecord, ...this.resolvedAlerts].slice(0, MAX_HISTORY_ITEMS);

    this.savePersistedState();
    this.notify();
  }

  clearResolved() {
    this.resolvedAlerts = [];
    this.savePersistedState();
    this.notify();
  }

  resetAll() {
    this.activeAlerts = [];
    this.resolvedAlerts = [...SAMPLE_ALERT_HISTORY];
    this.alertCooldowns.clear();
    this.savePersistedState();
    this.notify();
  }
}

export const alertService = new AlertService();
