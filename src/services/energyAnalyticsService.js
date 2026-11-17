/**
 * Centralized Energy Analytics & Calculation Engine (Phase 6)
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 * 
 * Provides:
 * 1. Mathematical Energy (kWh) and Electricity Cost (₹) modeling
 * 2. Avoidable lighting runtime, energy waste, and cost calculations
 * 3. Energy savings estimation vs configurable theoretical baseline
 * 4. Daily (24h), Weekly (7d), Monthly, and Custom date-range aggregations
 * 5. Correlated Occupancy vs Room LED usage breakdown
 * 6. Dynamic recalculation when LED wattage or electricity tariff is updated
 * 
 * All values represent calculated estimates derived from confirmed operating intervals
 * and configured LED wattage. No physical current/power meters are utilized.
 */

import { energyConfig } from '../config/energyConfig.js';
import { lightingHistoryService } from './lightingHistoryService.js';
import { occupancyEventService } from './occupancyEventService.js';
import { energyWasteAnalyticsService } from './energyWasteAnalyticsService.js';

export class EnergyAnalyticsService {
  constructor() {
    this.mode = 'demo'; // 'demo' | 'hardware'
    this.listeners = new Set();

    // Subscribe to config changes to trigger recalculations
    energyConfig.subscribe(() => {
      this.notify();
    });

    // Subscribe to lighting history updates
    lightingHistoryService.subscribe(() => {
      this.notify();
    });

    // Subscribe to occupancy updates
    occupancyEventService.subscribe(() => {
      this.notify();
    });
  }

  setMode(mode) {
    const normalized = (mode || 'demo').toLowerCase() === 'hardware' ? 'hardware' : 'demo';
    if (this.mode !== normalized) {
      this.mode = normalized;
      this.notify();
    }
  }

  // --- MATHEMATICAL FORMULAS ---
  /**
   * Energy (kWh) = (Power in Watts × Operating Time in Hours) / 1000
   * 9 W LED: 1h = 0.009 kWh, 10h = 0.09 kWh, 100h = 0.9 kWh
   */
  calculateEnergyKWh(watts, operatingHours) {
    const w = Math.max(0, Number(watts) || 0);
    const h = Math.max(0, Number(operatingHours) || 0);
    return (w * h) / 1000;
  }

  /**
   * Cost (₹) = Energy (kWh) × Tariff (₹/kWh)
   * At ₹8/kWh: 1h of 9W = ₹0.072, 10h = ₹0.72, 100h = ₹7.20
   */
  calculateCostINR(energyKWh, tariffPerKWh) {
    const kwh = Math.max(0, Number(energyKWh) || 0);
    const rate = Math.max(0, Number(tariffPerKWh) || 0);
    return kwh * rate;
  }

  // --- OCCUPANCY VS LIGHTING ALIGNMENT HELPER ---
  /**
   * Aligns discrete occupancy sessions with discrete lighting intervals over a specified time window.
   */
  alignOccupancyAndLighting(startDate, endDate, refNow = new Date()) {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const nowMs = refNow.getTime();

    const lightingIntervals = lightingHistoryService.getIntervalsForRange(startDate, endDate, refNow);
    const occupancySessions = occupancyEventService.getSessionsList();
    const cfg = energyConfig.getConfig();

    // Filter occupancy sessions overlapping with window
    const windowSessions = [];
    occupancySessions.forEach((sess) => {
      const sStart = new Date(sess.startTime).getTime();
      const sEnd = sess.endTime ? new Date(sess.endTime).getTime() : nowMs;
      const ovStart = Math.max(sStart, startMs);
      const ovEnd = Math.min(sEnd, endMs, nowMs);
      if (ovEnd > ovStart) {
        windowSessions.push({
          start: ovStart,
          end: ovEnd,
          durationSec: (ovEnd - ovStart) / 1000
        });
      }
    });

    // Total window elapsed duration
    const totalWindowSeconds = Math.max(1, Math.round((Math.min(endMs, nowMs) - startMs) / 1000));

    // Calculate total occupied seconds in window
    let totalOccupiedSeconds = 0;
    windowSessions.forEach((s) => {
      totalOccupiedSeconds += s.durationSec;
    });
    totalOccupiedSeconds = Math.min(totalOccupiedSeconds, totalWindowSeconds);
    const totalUnoccupiedSeconds = Math.max(0, totalWindowSeconds - totalOccupiedSeconds);

    // Cross-reference lighting intervals
    let ledOnOccupiedSeconds = 0;
    let ledOnVacantSeconds = 0;
    let ledOnDaylightSeconds = 0;
    let totalLedOnSeconds = 0;

    lightingIntervals.forEach((intv) => {
      if (intv.state !== 'ON') return;
      const iStart = new Date(intv.clampedStartTime || intv.startTime).getTime();
      const iEnd = new Date(intv.clampedEndTime || (intv.endTime ? intv.endTime : nowMs)).getTime();
      const durSec = Math.max(0, (iEnd - iStart) / 1000);
      totalLedOnSeconds += durSec;

      // Check overlap between this lighting interval and all occupancy sessions
      let intervalOccupiedSec = 0;
      windowSessions.forEach((sess) => {
        const overlapStart = Math.max(iStart, sess.start);
        const overlapEnd = Math.min(iEnd, sess.end);
        if (overlapEnd > overlapStart) {
          intervalOccupiedSec += (overlapEnd - overlapStart) / 1000;
        }
      });
      intervalOccupiedSec = Math.min(intervalOccupiedSec, durSec);
      const intervalVacantSec = Math.max(0, durSec - intervalOccupiedSec);

      ledOnOccupiedSeconds += intervalOccupiedSec;
      ledOnVacantSeconds += intervalVacantSec;

      if (intv.isDaylight || (intv.avgLdr && intv.avgLdr >= cfg.daylightThresholdAdc)) {
        ledOnDaylightSeconds += durSec;
      }
    });

    const totalLedOffSeconds = Math.max(0, totalWindowSeconds - totalLedOnSeconds);

    // Avoidable seconds: Vacant lighting + Daylight lighting during occupancy
    const avoidableSeconds = Math.min(totalLedOnSeconds, ledOnVacantSeconds + (ledOnDaylightSeconds * 0.6));

    return {
      totalWindowHours: Number((totalWindowSeconds / 3600).toFixed(2)),
      occupiedHours: Number((totalOccupiedSeconds / 3600).toFixed(2)),
      unoccupiedHours: Number((totalUnoccupiedSeconds / 3600).toFixed(2)),
      ledOnHours: Number((totalLedOnSeconds / 3600).toFixed(2)),
      ledOffHours: Number((totalLedOffSeconds / 3600).toFixed(2)),
      ledOnOccupiedHours: Number((ledOnOccupiedSeconds / 3600).toFixed(2)),
      ledOnVacantHours: Number((ledOnVacantSeconds / 3600).toFixed(2)),
      ledOnDaylightHours: Number((ledOnDaylightSeconds / 3600).toFixed(2)),
      avoidableHours: Number((avoidableSeconds / 3600).toFixed(2))
    };
  }

  // --- PERIOD AGGREGATION ENGINE ---
  getAnalyticsForRange(startDate, endDate, refNow = new Date()) {
    const cfg = energyConfig.getConfig();
    const alignment = this.alignOccupancyAndLighting(startDate, endDate, refNow);

    const energyConsumedKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, alignment.ledOnHours);
    const electricityCost = this.calculateCostINR(energyConsumedKWh, cfg.tariffPerKWh);

    const avoidableEnergyKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, alignment.avoidableHours);
    const avoidableCost = this.calculateCostINR(avoidableEnergyKWh, cfg.tariffPerKWh);

    // Theoretical Baseline: Standard commercial office operates luminaires for baselineWorkingHoursPerDay
    const daysInWindow = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 3600 * 1000)));
    const theoreticalBaselineHours = daysInWindow * cfg.baselineWorkingHoursPerDay;
    const baselineEnergyKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, theoreticalBaselineHours);
    const baselineCost = this.calculateCostINR(baselineEnergyKWh, cfg.tariffPerKWh);

    const energySavedKWh = Math.max(0, baselineEnergyKWh - energyConsumedKWh);
    const costSaved = Math.max(0, baselineCost - electricityCost);

    // Efficiency Percentage
    const efficiencyPercentage = alignment.ledOnHours > 0
      ? Math.max(0, Math.min(100, Math.round((1 - (alignment.avoidableHours / alignment.ledOnHours)) * 100)))
      : 100;

    // Waste events count in range
    const allWasteEvents = energyWasteAnalyticsService.getEventsList();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const wasteEventsInRange = allWasteEvents.filter((ev) => {
      const t = new Date(ev.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });

    return {
      period: {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        daysCount: daysInWindow
      },
      config: { ...cfg },
      summary: {
        powerRatingWatts: cfg.powerRatingWatts,
        tariffPerKWh: cfg.tariffPerKWh,
        currencySymbol: cfg.currencySymbol,
        energyUnit: cfg.energyUnit,
        totalLedOnHours: alignment.ledOnHours,
        totalLedOffHours: alignment.ledOffHours,
        averageDailyOnHours: Number((alignment.ledOnHours / daysInWindow).toFixed(2)),
        energyConsumedKWh: Number(energyConsumedKWh.toFixed(4)),
        electricityCostINR: Number(electricityCost.toFixed(2)),
        avoidableHours: alignment.avoidableHours,
        avoidableEnergyKWh: Number(avoidableEnergyKWh.toFixed(4)),
        avoidableCostINR: Number(avoidableCost.toFixed(2)),
        theoreticalBaselineHours,
        baselineEnergyKWh: Number(baselineEnergyKWh.toFixed(4)),
        baselineCostINR: Number(baselineCost.toFixed(2)),
        energySavedKWh: Number(energySavedKWh.toFixed(4)),
        costSavedINR: Number(costSaved.toFixed(2)),
        efficiencyPercentage,
        wasteEventsCount: wasteEventsInRange.length
      },
      alignment,
      wasteEvents: wasteEventsInRange
    };
  }

  // --- 24-HOUR DAILY BREAKDOWN ---
  getDailyHourlyBreakdown(refDate = new Date(), refNow = new Date()) {
    const cfg = energyConfig.getConfig();
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const d = refDate.getDate();

    const now = refNow;
    const isToday = (
      refDate.getFullYear() === now.getFullYear() &&
      refDate.getMonth() === now.getMonth() &&
      refDate.getDate() === now.getDate()
    );
    const currentHour = isToday ? now.getHours() : 24;

    const hourly = [];

    for (let h = 0; h < 24; h++) {
      const bStart = new Date(y, m, d, h, 0, 0, 0);
      const bEnd = new Date(y, m, d, h, 59, 59, 999);

      const hourPeriod = h < 12 ? 'AM' : 'PM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayHour} ${hourPeriod}`;

      // In Hardware mode, future hours with no intervals remain clean
      const intervals = lightingHistoryService.getIntervalsForRange(bStart, bEnd, now);
      const hasIntervals = intervals.length > 0;

      if (this.mode === 'hardware' && isToday && h > currentHour && !hasIntervals) {
        hourly.push({
          hour: h,
          label,
          onMinutes: 0,
          offMinutes: 60,
          energyKWh: 0,
          costINR: 0,
          avoidableMinutes: 0,
          avoidableKWh: 0,
          avoidableCostINR: 0,
          savedKWh: 0,
          savedCostINR: 0,
          isFuture: true
        });
        continue;
      }

      // Calculate ON seconds in this hour
      let onSec = 0;
      let daylightOnSec = 0;
      let vacantOnSec = 0;

      intervals.forEach((intv) => {
        if (intv.state === 'ON') {
          onSec += intv.durationSeconds;
          if (intv.isDaylight || (intv.avgLdr && intv.avgLdr >= cfg.daylightThresholdAdc)) {
            daylightOnSec += intv.durationSeconds;
          }
          if (intv.occupancyAtStart === 'UNOCCUPIED') {
            vacantOnSec += intv.durationSeconds;
          }
        }
      });

      const maxSecInHour = (this.mode === 'hardware' && isToday && h === currentHour && !hasIntervals)
        ? Math.max(0, (now.getTime() - bStart.getTime()) / 1000)
        : 3600;

      onSec = Math.min(onSec, maxSecInHour);
      const offSec = Math.max(0, maxSecInHour - onSec);
      const onHours = onSec / 3600;

      const energyKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, onHours);
      const costINR = this.calculateCostINR(energyKWh, cfg.tariffPerKWh);

      const avoidableSec = Math.min(onSec, vacantOnSec + (daylightOnSec * 0.5));
      const avoidableHours = avoidableSec / 3600;
      const avoidableKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, avoidableHours);
      const avoidableCostINR = this.calculateCostINR(avoidableKWh, cfg.tariffPerKWh);

      // Hourly baseline: 1h of baseline illumination during working hours (8 AM - 6 PM)
      const isWorkingHour = h >= 8 && h < 18;
      const baselineHourOn = isWorkingHour ? 1 : 0;
      const baselineKWh = this.calculateEnergyKWh(cfg.powerRatingWatts, baselineHourOn);
      const baselineCost = this.calculateCostINR(baselineKWh, cfg.tariffPerKWh);
      const savedKWh = Math.max(0, baselineKWh - energyKWh);
      const savedCostINR = Math.max(0, baselineCost - costINR);

      hourly.push({
        hour: h,
        label,
        onMinutes: Number((onSec / 60).toFixed(1)),
        offMinutes: Number((offSec / 60).toFixed(1)),
        energyKWh: Number(energyKWh.toFixed(5)),
        costINR: Number(costINR.toFixed(3)),
        avoidableMinutes: Number((avoidableSec / 60).toFixed(1)),
        avoidableKWh: Number(avoidableKWh.toFixed(5)),
        avoidableCostINR: Number(avoidableCostINR.toFixed(3)),
        savedKWh: Number(savedKWh.toFixed(5)),
        savedCostINR: Number(savedCostINR.toFixed(3)),
        isFuture: false
      });
    }

    return hourly;
  }

  // --- 7-DAY WEEKLY BREAKDOWN ---
  getWeeklyDailyBreakdown(refDate = new Date()) {
    const days = [];
    const cfg = energyConfig.getConfig();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - i);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      const dayAnalytics = this.getAnalyticsForRange(dayStart, dayEnd, refDate);
      const dayName = targetDate.toLocaleDateString([], { weekday: 'short' });
      const dateStr = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      days.push({
        dayName,
        dateStr,
        fullDate: dayStart.toISOString(),
        onHours: dayAnalytics.summary.totalLedOnHours,
        offHours: dayAnalytics.summary.totalLedOffHours,
        energyConsumedKWh: dayAnalytics.summary.energyConsumedKWh,
        electricityCostINR: dayAnalytics.summary.electricityCostINR,
        avoidableEnergyKWh: dayAnalytics.summary.avoidableEnergyKWh,
        avoidableCostINR: dayAnalytics.summary.avoidableCostINR,
        energySavedKWh: dayAnalytics.summary.energySavedKWh,
        costSavedINR: dayAnalytics.summary.costSavedINR,
        efficiencyPercentage: dayAnalytics.summary.efficiencyPercentage,
        wasteEventsCount: dayAnalytics.summary.wasteEventsCount
      });
    }

    return days;
  }

  // --- MONTHLY BREAKDOWN (WEEKS / DAYS) ---
  getMonthlyBreakdown(refDate = new Date()) {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const weeks = [];

    // Group into 4-5 weekly slices of the month
    for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min(daysInMonth, (w + 1) * 7);
      const wStart = new Date(y, m, startDay, 0, 0, 0, 0);
      const wEnd = new Date(y, m, endDay, 23, 59, 59, 999);

      const wAnalytics = this.getAnalyticsForRange(wStart, wEnd, refDate);
      weeks.push({
        weekLabel: `Week ${w + 1} (${startDay}–${endDay})`,
        startDate: wStart.toISOString(),
        endDate: wEnd.toISOString(),
        onHours: wAnalytics.summary.totalLedOnHours,
        energyConsumedKWh: wAnalytics.summary.energyConsumedKWh,
        electricityCostINR: wAnalytics.summary.electricityCostINR,
        avoidableEnergyKWh: wAnalytics.summary.avoidableEnergyKWh,
        avoidableCostINR: wAnalytics.summary.avoidableCostINR,
        energySavedKWh: wAnalytics.summary.energySavedKWh,
        efficiencyPercentage: wAnalytics.summary.efficiencyPercentage
      });
    }

    return weeks;
  }

  // --- SMART ENERGY RECOMMENDATIONS GENERATOR ---
  getSmartEnergyRecommendations() {
    const today = new Date();
    const todayBounds = lightingHistoryService.getTodayBounds(today);
    const analytics = this.getAnalyticsForRange(todayBounds.start, todayBounds.end, today);
    const recs = [];
    const cfg = energyConfig.getConfig();

    // 1. Daylight Harvesting Inefficiency Recommendation
    if (analytics.alignment.ledOnDaylightHours > 0.25) {
      const potKwh = this.calculateEnergyKWh(cfg.powerRatingWatts, analytics.alignment.ledOnDaylightHours);
      const potCost = this.calculateCostINR(potKwh, cfg.tariffPerKWh);
      recs.push({
        id: 'rec-daylight-harvest',
        title: 'Capitalize on Ambient Daylight Harvesting',
        category: 'Daylight Optimization',
        priority: 'HIGH',
        reason: `Room LED was active for ${analytics.alignment.ledOnDaylightHours}h during adequate solar illuminance.`,
        supportingData: `${analytics.alignment.ledOnDaylightHours} hours unnecessary luminaire runtime during daylight availability.`,
        potentialEnergyImpactKWh: Number(potKwh.toFixed(4)),
        potentialCostImpactINR: Number(potCost.toFixed(2)),
        action: 'Ensure automated daylight cutoff rule (LDR >= 500 ADC) is active and optical paths to the A0 sensor remain unobstructed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // 2. Vacancy Lighting Cutoff Enforcement Recommendation
    if (analytics.alignment.ledOnVacantHours > 0.1) {
      const potKwh = this.calculateEnergyKWh(cfg.powerRatingWatts, analytics.alignment.ledOnVacantHours);
      const potCost = this.calculateCostINR(potKwh, cfg.tariffPerKWh);
      recs.push({
        id: 'rec-vacancy-cutoff',
        title: 'Enforce Vacant Space Power Cutoff',
        category: 'Occupancy Management',
        priority: 'CRITICAL',
        reason: `Room LED remained energized for ${analytics.alignment.ledOnVacantHours}h while the room was confirmed vacant.`,
        supportingData: `${analytics.alignment.ledOnVacantHours} hours vacant burn time recorded by occupancy tracking engine.`,
        potentialEnergyImpactKWh: Number(potKwh.toFixed(4)),
        potentialCostImpactINR: Number(potCost.toFixed(2)),
        action: 'Verify that the 30-second absence timer properly dispatches LIGHT_OFF commands to Arduino Pin D7 upon vacancy.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // 3. High Runtime Investigation Recommendation
    if (analytics.summary.totalLedOnHours > 8) {
      recs.push({
        id: 'rec-high-runtime',
        title: 'Investigate Extended Lighting Runtime',
        category: 'Operating Schedule',
        priority: 'MEDIUM',
        reason: `Room LED has accumulated ${analytics.summary.totalLedOnHours} hours of operation today, exceeding the typical 8-hour schedule.`,
        supportingData: `${analytics.summary.totalLedOnHours} hours active vs 8.0h expected commercial baseline.`,
        potentialEnergyImpactKWh: Number((analytics.summary.energyConsumedKWh * 0.25).toFixed(4)),
        potentialCostImpactINR: Number((analytics.summary.electricityCostINR * 0.25).toFixed(2)),
        action: 'Review scheduled building occupancy and audit whether overtime work justifies active luminaire power.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // 4. Incomplete Telemetry / Sensor Health Recommendation
    if (analytics.summary.wasteEventsCount === 0 && analytics.alignment.ledOnHours === 0 && this.mode === 'hardware') {
      recs.push({
        id: 'rec-sensor-telemetry',
        title: 'Verify Hardware Telemetry Stream',
        category: 'System Diagnostics',
        priority: 'LOW',
        reason: 'Zero lighting transitions recorded in Hardware Mode.',
        supportingData: 'Web Serial connection active; awaiting physical sensor state changes.',
        potentialEnergyImpactKWh: 0,
        potentialCostImpactINR: 0,
        action: 'Confirm Arduino Uno USB cable is connected at 9600 baud and webcam camera stream is initialized.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // If no negative recommendations, reward optimal conservation
    if (recs.length === 0) {
      recs.push({
        id: 'rec-optimal-efficiency',
        title: 'Maintain Active Conservation Alignment',
        category: 'Optimal Efficiency',
        priority: 'INFO',
        reason: 'Luminaire control is operating in optimal synchrony with AI occupancy and natural daylight.',
        supportingData: `${analytics.summary.efficiencyPercentage}% calculated lighting efficiency with zero avoidable waste.`,
        potentialEnergyImpactKWh: 0,
        potentialCostImpactINR: 0,
        action: 'Continue operating in automated AI mode to maximize daylight harvesting and minimize vacant drain.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    return recs;
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
        console.error('EnergyAnalyticsService listener error:', err);
      }
    });
  }

  getState() {
    const today = new Date();
    const todayBounds = lightingHistoryService.getTodayBounds(today);
    const todayAnalytics = this.getAnalyticsForRange(todayBounds.start, todayBounds.end, today);
    const hourlyBreakdown = this.getDailyHourlyBreakdown(today, today);
    const weeklyBreakdown = this.getWeeklyDailyBreakdown(today);
    const monthlyBreakdown = this.getMonthlyBreakdown(today);
    const recommendations = this.getSmartEnergyRecommendations();

    return {
      mode: this.mode,
      config: energyConfig.getConfig(),
      todayAnalytics,
      hourlyBreakdown,
      weeklyBreakdown,
      monthlyBreakdown,
      recommendations
    };
  }
}

export const energyAnalyticsService = new EnergyAnalyticsService();
