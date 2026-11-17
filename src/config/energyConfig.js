/**
 * Centralized Energy Configuration (Phase 6)
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Default Parameters:
 * - Room LED Power: 9 W (nominal fixture wattage)
 * - Electricity Tariff: ₹8.00 per kWh
 * - Daylight Harvesting Cutoff: 500 ADC
 * - Occupancy Absence Timeout: 30 seconds
 * - Currency: INR (₹)
 * - Energy Unit: kWh
 * - Target Output: Arduino Pin D7
 * 
 * NOTE: All power and energy values in this system represent calculated estimates 
 * derived from confirmed operating intervals and configured device wattage. 
 * The system does not utilize direct electrical current or power measuring sensors.
 */

const STORAGE_KEY = 'eco_bms_energy_config_v1';

export const DEFAULT_ENERGY_CONFIG = {
  powerRatingWatts: 9, // 9 W Room LED on Pin D7
  tariffPerKWh: 8.0,   // ₹8 per kWh commercial/institutional tariff
  currency: 'INR',
  currencySymbol: '₹',
  energyUnit: 'kWh',
  outputPin: 'D7',
  daylightThresholdAdc: 500, // ADC >= 500 indicates sufficient daylight
  absenceTimeoutSeconds: 30, // 30s grace timeout before vacancy
  reportingPeriod: 'daily',  // 'daily' | 'weekly' | 'monthly' | 'custom'
  // Baseline assumptions for theoretical comparisons (clearly disclosed as theoretical)
  baselineWorkingHoursPerDay: 10, // 10h/day continuous illumination baseline
  baselineMode: 'WORKING_HOURS'   // 'WORKING_HOURS' | 'CONTINUOUS_24H'
};

class EnergyConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.listeners = new Set();
  }

  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const test = '__energy_cfg_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  loadConfig() {
    if (!this.isStorageAvailable()) {
      return { ...DEFAULT_ENERGY_CONFIG };
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_ENERGY_CONFIG };
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_ENERGY_CONFIG,
        ...parsed,
        powerRatingWatts: Math.max(1, Number(parsed.powerRatingWatts) || DEFAULT_ENERGY_CONFIG.powerRatingWatts),
        tariffPerKWh: Math.max(0.1, Number(parsed.tariffPerKWh) || DEFAULT_ENERGY_CONFIG.tariffPerKWh)
      };
    } catch (err) {
      console.warn('Failed to load energy config from localStorage:', err);
      return { ...DEFAULT_ENERGY_CONFIG };
    }
  }

  saveConfig(updated) {
    this.config = { ...this.config, ...updated };
    if (this.isStorageAvailable()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (err) {
        console.warn('Failed to save energy config to localStorage:', err);
      }
    }
    this.notify();
    return this.config;
  }

  resetToDefaults() {
    this.config = { ...DEFAULT_ENERGY_CONFIG };
    if (this.isStorageAvailable()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        // ignore
      }
    }
    this.notify();
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const cfg = this.getConfig();
    this.listeners.forEach((fn) => {
      try {
        fn(cfg);
      } catch (err) {
        console.error('EnergyConfig listener error:', err);
      }
    });
  }
}

export const energyConfig = new EnergyConfigManager();
