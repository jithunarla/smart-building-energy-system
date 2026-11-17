/**
 * Smart Recommendation Engine (Phase 4 Task 12 & 13)
 * Analyzes continuous multi-sensor streams to produce realistic, actionable energy efficiency advisories
 * across the 5 required commercial categories.
 */

import { analyzeConditions } from './conditionAnalyzer.js';
import { 
  RECOMMENDATION_CATEGORIES, 
  RECOMMENDATION_PRIORITY, 
  RECOMMENDATION_RULE_DEFS 
} from '../data/recommendationRules.js';

export { RECOMMENDATION_CATEGORIES, RECOMMENDATION_PRIORITY };

export const generateRecommendations = (sensorData, isOccupied = null) => {
  const recommendations = [];
  const analysis = analyzeConditions(sensorData, isOccupied);

  // =========================================================================
  // 1. LIGHTING OPTIMIZATION
  // =========================================================================
  if (analysis.isLdrFault) {
    recommendations.push({
      id: 'rec-lighting-fault',
      category: RECOMMENDATION_CATEGORIES.LIGHTING,
      relatedSensor: 'LDR Analog (Pin A0)',
      priority: RECOMMENDATION_PRIORITY.HIGH,
      title: 'Inspect Natural Daylight Sensor Interface',
      detectedCondition: 'Ambient daylight sensor telemetry is unavailable or returning out-of-range ADC values.',
      suggestedAction: 'Verify physical connection of LDR on Analog Pin A0 and inspect 10kΩ pull-down resistor.',
      reason: 'Automated daylight harvesting and luminaire conservation algorithms require active LDR telemetry.',
      expectedBenefit: 'Restores automatic daylight harvesting and eliminates false darkness triggers.',
      icon: 'SunDim'
    });
  } else if (analysis.isAbundantDaylightWasting) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.id,
      category: RECOMMENDATION_CATEGORIES.LIGHTING,
      relatedSensor: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      title: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.DAYLIGHT_WASTE_CUTOFF.icon
    });
  } else if (analysis.isDaylightSufficient) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.id,
      category: RECOMMENDATION_CATEGORIES.LIGHTING,
      relatedSensor: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.relatedSensor,
      priority: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.priority(sensorData),
      title: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.suggestedAction(sensorData),
      reason: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.DAYLIGHT_HARVESTING.icon
    });
  } else if (analysis.isTaskLightingRequired) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.id,
      category: RECOMMENDATION_CATEGORIES.LIGHTING,
      relatedSensor: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.relatedSensor,
      priority: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.priority,
      title: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.TASK_LIGHTING_NEEDED.icon
    });
  } else if (analysis.isDarkness && analysis.isRoomLightOn) {
    recommendations.push({
      id: 'rec-task-lighting-active',
      category: RECOMMENDATION_CATEGORIES.LIGHTING,
      relatedSensor: 'LDR & Relay (A0/D8)',
      priority: RECOMMENDATION_PRIORITY.LOW,
      title: 'Legitimate Task Lighting Active in Darkness',
      detectedCondition: `Natural daylight is low (${sensorData.light_adc} ADC < 250 ADC) and artificial lighting is energized.`,
      suggestedAction: 'Maintain current lighting state during active occupancy; verify shutoff upon vacancy.',
      reason: 'Essential task lighting is compliant with commercial visual ergonomics standards.',
      expectedBenefit: 'Maintains required workplace illuminance with zero unwarranted waste.',
      icon: 'Lightbulb'
    });
  }

  // =========================================================================
  // 2. OCCUPANCY MANAGEMENT
  // =========================================================================
  if (analysis.isVacantWasting) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.id,
      category: RECOMMENDATION_CATEGORIES.OCCUPANCY,
      relatedSensor: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      title: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.detectedCondition(),
      suggestedAction: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.OCCUPANCY_TIMEOUT_CUTOFF.icon
    });
  } else if (analysis.isVacant) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.id,
      category: RECOMMENDATION_CATEGORIES.OCCUPANCY,
      relatedSensor: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.LOW,
      title: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.detectedCondition(),
      suggestedAction: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.OCCUPANCY_STANDBY_MAINTAIN.icon
    });
  } else {
    recommendations.push({
      id: 'rec-occupancy-active-monitoring',
      category: RECOMMENDATION_CATEGORIES.OCCUPANCY,
      relatedSensor: 'PIR Motion Sensor (D7)',
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      title: 'Occupancy Synchronization Active',
      detectedCondition: 'Live human motion detected across Fresnel lens detection cone.',
      suggestedAction: 'Refresh PIR occupancy timer countdown and evaluate ambient natural daylight.',
      reason: 'Dynamic presence tracking aligns electrical consumption with active human occupancy.',
      expectedBenefit: 'Prevents premature lighting shutoffs during quiet desk work while securing timely shutdown.',
      icon: 'UserCheck'
    });
  }

  // =========================================================================
  // 3. TEMPERATURE MANAGEMENT
  // =========================================================================
  if (analysis.isTempFault) {
    recommendations.push({
      id: 'rec-temp-fault',
      category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
      relatedSensor: 'DHT11 Climate Sensor (D2)',
      priority: RECOMMENDATION_PRIORITY.HIGH,
      title: 'Inspect DHT11 Climate Sensor Connection',
      detectedCondition: 'DHT11 sensor telemetry is currently null or disconnected on Pin D2.',
      suggestedAction: 'Check single-wire digital data pin D2, ensure solid jumper connection, and verify 5V power.',
      reason: 'Automated climate monitoring and thermal comfort guidance require active temperature readings.',
      expectedBenefit: 'Restores real-time thermal comfort monitoring and building energy oversight.',
      icon: 'Thermometer'
    });
  } else if (analysis.isTempHigh) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.id,
      category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
      relatedSensor: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.relatedSensor,
      priority: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.priority(analysis.temperature),
      title: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.HIGH_TEMP_VENTILATION.icon
    });
  } else if (analysis.isTempLow) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.id,
      category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
      relatedSensor: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      title: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.LOW_TEMP_INSULATION.icon
    });
  } else {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.id,
      category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
      relatedSensor: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.LOW,
      title: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.OPTIMAL_TEMPERATURE.icon
    });
  }

  // =========================================================================
  // 4. HUMIDITY MANAGEMENT
  // =========================================================================
  if (analysis.isHumFault) {
    // Already covered by DHT11 general check
  } else if (analysis.isHumHigh) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.id,
      category: RECOMMENDATION_CATEGORIES.HUMIDITY,
      relatedSensor: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      title: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.HIGH_HUMIDITY_VENTILATION.icon
    });
  } else if (analysis.isHumLow) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.id,
      category: RECOMMENDATION_CATEGORIES.HUMIDITY,
      relatedSensor: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      title: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.LOW_HUMIDITY_MONITORING.icon
    });
  } else {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.id,
      category: RECOMMENDATION_CATEGORIES.HUMIDITY,
      relatedSensor: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.LOW,
      title: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.detectedCondition(sensorData),
      suggestedAction: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.OPTIMAL_HUMIDITY.icon
    });
  }

  // =========================================================================
  // 5. GENERAL ENERGY EFFICIENCY
  // =========================================================================
  if (analysis.hasSensorFault) {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.id,
      category: RECOMMENDATION_CATEGORIES.GENERAL,
      relatedSensor: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      title: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.detectedCondition(),
      suggestedAction: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.SENSOR_FAULT_INSPECTION.icon
    });
  } else {
    recommendations.push({
      id: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.id,
      category: RECOMMENDATION_CATEGORIES.GENERAL,
      relatedSensor: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.relatedSensor,
      priority: RECOMMENDATION_PRIORITY.LOW,
      title: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.title,
      detectedCondition: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.detectedCondition(),
      suggestedAction: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.suggestedAction,
      reason: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.reason,
      expectedBenefit: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.expectedBenefit,
      icon: RECOMMENDATION_RULE_DEFS.AUTOMATED_CONSERVATION_AUDIT.icon
    });
  }

  return recommendations;
};
