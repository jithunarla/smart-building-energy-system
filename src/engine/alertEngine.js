/**
 * Alert Engine for Smart Building Energy Waste Detection (Phase 4 Task 8 & 9)
 * Evaluates real-time sensor metrics against conservation and safety heuristics (Rules 1 to 9).
 */

import { analyzeConditions } from './conditionAnalyzer.js';
import { ALERT_RULE_DEFS, ALERT_SEVERITY, ALERT_CATEGORIES } from '../data/alertRules.js';

export { ALERT_CATEGORIES, ALERT_SEVERITY };

export const evaluateAlerts = (sensorData, isOccupied = null) => {
  const alerts = [];
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const analysis = analyzeConditions(sensorData, isOccupied);

  // =========================================================================
  // RULE 9 – SENSOR FAULT ALERTS (Checked first; invalid data does not trigger false env alerts)
  // =========================================================================
  if (analysis.isLdrFault) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.ruleId,
      ruleNumber: 9,
      title: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.title,
      severity: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.severity,
      category: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.category,
      sensor: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.recommendation,
      impact: ALERT_RULE_DEFS.RULE_9_LDR_FAULT.impact,
      status: 'active'
    });
  }

  if (analysis.isTempFault || analysis.isHumFault) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.ruleId,
      ruleNumber: 9,
      title: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.title,
      severity: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.severity,
      category: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.category,
      sensor: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.recommendation,
      impact: ALERT_RULE_DEFS.RULE_9_DHT11_FAULT.impact,
      status: 'active'
    });
  }

  // =========================================================================
  // RULE 3 – UNNECESSARY LIGHTING DURING ABUNDANT DAYLIGHT (>=750 ADC)
  // =========================================================================
  if (analysis.isAbundantDaylightWasting) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.ruleId,
      ruleNumber: 3,
      title: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.title,
      severity: ALERT_SEVERITY.CRITICAL,
      category: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.category,
      sensor: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.recommendation,
      impact: ALERT_RULE_DEFS.RULE_3_ABUNDANT_DAYLIGHT_WASTE.impact,
      status: 'active'
    });
  }
  // =========================================================================
  // RULE 1 – UNNECESSARY ARTIFICIAL LIGHTING (>=500 ADC)
  // =========================================================================
  else if (analysis.isDaylightWasting) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.ruleId,
      ruleNumber: 1,
      title: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.title,
      severity: ALERT_SEVERITY.WARNING,
      category: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.category,
      sensor: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.recommendation,
      impact: ALERT_RULE_DEFS.RULE_1_DAYLIGHT_WASTE.impact,
      status: 'active'
    });
  }

  // =========================================================================
  // RULE 2 – LIGHTING IN AN UNOCCUPIED ROOM
  // =========================================================================
  if (analysis.isVacantWasting) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.ruleId,
      ruleNumber: 2,
      title: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.title,
      severity: ALERT_SEVERITY.CRITICAL,
      category: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.category,
      sensor: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.recommendation,
      impact: ALERT_RULE_DEFS.RULE_2_VACANT_LIGHTING.impact,
      status: 'active'
    });
  }

  // =========================================================================
  // RULE 4 – LOW DAYLIGHT AND OCCUPIED ROOM (LIGHTING REQUIREMENT, NOT WASTE)
  // =========================================================================
  if (analysis.isTaskLightingRequired) {
    alerts.push({
      id: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.ruleId,
      ruleNumber: 4,
      title: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.title,
      severity: ALERT_SEVERITY.INFO,
      category: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.category,
      sensor: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.description(sensorData),
      recommendation: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.recommendation,
      impact: ALERT_RULE_DEFS.RULE_4_LOW_DAYLIGHT_OCCUPIED.impact,
      status: 'active'
    });
  }

  // =========================================================================
  // RULE 5 & 6 – TEMPERATURE MONITORING (Only when temperature is valid)
  // =========================================================================
  if (analysis.isTempValid) {
    if (analysis.isTempHigh) {
      const isCrit = analysis.isTempCritical;
      alerts.push({
        id: ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.ruleId,
        ruleNumber: 5,
        title: isCrit ? 'Critical High Indoor Temperature Warning' : ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.title,
        severity: isCrit ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        category: ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.category,
        sensor: ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.sensor,
        timestamp: timeString,
        description: ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.description(sensorData),
        recommendation: ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.recommendation,
        impact: isCrit ? 'Extreme Heat Stress & Severe Thermal Drift' : ALERT_RULE_DEFS.RULE_5_HIGH_TEMP.impact,
        status: 'active'
      });
    } else if (analysis.isTempLow) {
      alerts.push({
        id: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.ruleId,
        ruleNumber: 6,
        title: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.title,
        severity: ALERT_SEVERITY.WARNING,
        category: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.category,
        sensor: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.sensor,
        timestamp: timeString,
        description: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.description(sensorData),
        recommendation: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.recommendation,
        impact: ALERT_RULE_DEFS.RULE_6_LOW_TEMP.impact,
        status: 'active'
      });
    }
  }

  // =========================================================================
  // RULE 7 & 8 – HUMIDITY MONITORING (Only when humidity is valid)
  // =========================================================================
  if (analysis.isHumValid) {
    if (analysis.isHumHigh) {
      const isCrit = analysis.isHumCritical;
      alerts.push({
        id: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.ruleId,
        ruleNumber: 7,
        title: isCrit ? 'Critical High Relative Humidity Alert' : ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.title,
        severity: isCrit ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        category: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.category,
        sensor: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.sensor,
        timestamp: timeString,
        description: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.description(sensorData),
        recommendation: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.recommendation,
        impact: ALERT_RULE_DEFS.RULE_7_HIGH_HUMIDITY.impact,
        status: 'active'
      });
    } else if (analysis.isHumLow) {
      alerts.push({
        id: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.ruleId,
        ruleNumber: 8,
        title: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.title,
        severity: ALERT_SEVERITY.INFO,
        category: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.category,
        sensor: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.sensor,
        timestamp: timeString,
        description: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.description(sensorData),
        recommendation: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.recommendation,
        impact: ALERT_RULE_DEFS.RULE_8_LOW_HUMIDITY.impact,
        status: 'active'
      });
    }
  }

  // =========================================================================
  // EFFICIENT & OPTIMAL OPERATION CONDITIONS
  // =========================================================================
  if (analysis.isDaylightSufficient && !analysis.isRoomLightOn && analysis.isOccupied) {
    alerts.push({
      id: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.ruleId,
      ruleNumber: 0,
      title: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.title,
      severity: ALERT_SEVERITY.EFFICIENT,
      category: ALERT_CATEGORIES.OPTIMAL,
      sensor: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.description(sensorData),
      recommendation: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.recommendation,
      impact: ALERT_RULE_DEFS.OPTIMAL_DAYLIGHT_HARVESTING.impact,
      status: 'active'
    });
  }

  if (analysis.isVacant && !analysis.isRoomLightOn) {
    alerts.push({
      id: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.ruleId,
      ruleNumber: 0,
      title: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.title,
      severity: ALERT_SEVERITY.EFFICIENT,
      category: ALERT_CATEGORIES.OPTIMAL,
      sensor: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.sensor,
      timestamp: timeString,
      description: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.description(),
      recommendation: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.recommendation,
      impact: ALERT_RULE_DEFS.OPTIMAL_VACANT_STANDBY.impact,
      status: 'active'
    });
  }

  return alerts;
};

// Historical baseline sample records
export const SAMPLE_ALERT_HISTORY = [
  {
    id: 'hist-1',
    title: 'Unnecessary Artificial Lighting Detected',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENERGY_WASTE,
    sensor: 'LDR & Room Light',
    timestamp: 'Today, 14:15:32',
    description: 'Natural light intensity peaked at 890 ADC while artificial luminaires were left ON for 42 minutes.',
    recommendation: 'Switched off fixtures via automated rule after notification.',
    resolvedAt: 'Today, 14:57:32',
    resolutionNote: 'Auto-switched OFF when occupant left room.',
    status: 'resolved'
  },
  {
    id: 'hist-2',
    title: 'High Relative Humidity Warning',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Humidity',
    timestamp: 'Today, 11:20:10',
    description: 'Relative humidity crossed 72% following morning rain showers.',
    recommendation: 'Modulated building fresh air dampers.',
    resolvedAt: 'Today, 12:05:00',
    resolutionNote: 'Normalized to 58%.',
    status: 'resolved'
  },
  {
    id: 'hist-3',
    title: 'Unoccupied Room Lighting Detected',
    severity: ALERT_SEVERITY.CRITICAL,
    category: ALERT_CATEGORIES.ENERGY_WASTE,
    sensor: 'PIR Motion & Room Light',
    timestamp: 'Yesterday, 19:40:15',
    description: 'No motion detected for 45 minutes while room luminaire remained energized.',
    recommendation: 'Inactivity timeout triggered automatic power cut.',
    resolvedAt: 'Yesterday, 19:45:00',
    resolutionNote: 'Timeout shutoff verified.',
    status: 'resolved'
  },
  {
    id: 'hist-4',
    title: 'Elevated Indoor Temperature Warning',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Temperature',
    timestamp: 'Yesterday, 15:10:00',
    description: 'Temperature reached 29.8°C during peak afternoon solar gain.',
    recommendation: 'Lowered solar blinds on south-facing windows.',
    resolvedAt: 'Yesterday, 16:30:00',
    resolutionNote: 'Blinds deployed, temperature stabilized at 26.1°C.',
    status: 'resolved'
  }
];
