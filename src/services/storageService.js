/**
 * Storage Service
 * Manages local persistence for sensor history, telemetry logs, and simulation settings.
 * Implements bounded capacity to prevent memory leaks and quota overflow.
 */

const STORAGE_KEYS = {
  HISTORY: 'eco_bms_sensor_history_v2',
  SETTINGS: 'eco_bms_simulation_settings_v2',
  LAST_STATE: 'eco_bms_last_sensor_state_v2'
};

const MAX_HISTORY_POINTS = 60; // Keep up to 60 historical intervals for charts

export class StorageService {
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Retrieve historical sensor readings
  getHistory(fallbackHistory = []) {
    if (!this.isAvailable()) return fallbackHistory;
    try {
      const data = window.localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) return fallbackHistory;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackHistory;
    } catch (err) {
      console.warn('StorageService: Failed to parse stored history, falling back', err);
      return fallbackHistory;
    }
  }

  // Save full history bounded to max capacity
  saveHistory(history) {
    if (!this.isAvailable()) return;
    try {
      const bounded = history.slice(-MAX_HISTORY_POINTS);
      window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(bounded));
    } catch (err) {
      console.warn('StorageService: Failed to save history', err);
    }
  }

  // Append a single new sensor reading to history
  appendReading(reading, currentHistory = []) {
    const timeLabel = new Date(reading.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const isTempValid = reading.temperature !== null && !isNaN(Number(reading.temperature));
    const isHumValid = reading.humidity !== null && !isNaN(Number(reading.humidity));

    const newPoint = {
      time: timeLabel,
      light_adc: reading.light_adc,
      temperature: isTempValid ? Number(Number(reading.temperature).toFixed(1)) : null,
      humidity: isHumValid ? Number(reading.humidity) : null,
      motion: reading.motion,
      room_light: reading.room_light,
      source: reading.mode || 'demo',
      valid: isTempValid && isHumValid && reading.light_adc !== null,
      efficiency: Math.max(50, Math.min(100, Math.round(
        100 - (reading.room_light === 1 && reading.light_adc >= 500 ? 30 : 0)
            - (reading.motion === 0 && reading.room_light === 1 ? 35 : 0)
            - (isTempValid && reading.temperature > 28 ? (reading.temperature - 28) * 4 : 0)
      )))
    };

    const updated = [...currentHistory, newPoint].slice(-MAX_HISTORY_POINTS);
    this.saveHistory(updated);
    return updated;
  }

  // Reset history to clean baseline
  clearHistory(baselineHistory = []) {
    if (this.isAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.HISTORY);
      } catch (err) {
        console.warn('StorageService: Failed to clear history', err);
      }
    }
    return baselineHistory;
  }

  // Simulation settings (speed, timeout, scenario)
  getSettings(defaults = {}) {
    if (!this.isAvailable()) return defaults;
    try {
      const data = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (err) {
      return defaults;
    }
  }

  saveSettings(settings) {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('StorageService: Failed to save settings', err);
    }
  }
}

export const storageService = new StorageService();
