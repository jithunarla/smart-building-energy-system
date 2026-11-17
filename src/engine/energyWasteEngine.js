/**
 * Energy Waste Calculation Engine (Phase 4 Task 7 & 8)
 * Quantifies energy wastage, identifies specific active waste vectors,
 * and computes real-time operational efficiency metrics.
 */

import { analyzeConditions } from './conditionAnalyzer.js';
import { SENSOR_CONFIG } from '../data/mockSensorData.js';

export const evaluateEnergyWaste = (sensorData, isOccupied = null) => {
  const analysis = analyzeConditions(sensorData, isOccupied);
  const nominalFixtureWatts = SENSOR_CONFIG?.room_light?.powerRatingWatts || 120;

  const wasteVectors = [];
  let totalWastingWatts = 0;
  let wasteSeverity = 'none'; // 'none' | 'warning' | 'critical'

  if (analysis.isAbundantDaylightWasting) {
    wasteVectors.push({
      id: 'vector-abundant-daylight',
      title: 'High Daylight Luminaire Wastage',
      category: 'Daylight Overload',
      description: `Ambient daylight is abundant (${analysis.lightAdc} ADC), yet the 120W luminaire is fully powered ON.`,
      powerDrawWatts: nominalFixtureWatts,
      severity: 'critical'
    });
    totalWastingWatts = nominalFixtureWatts;
    wasteSeverity = 'critical';
  } else if (analysis.isDaylightWasting) {
    wasteVectors.push({
      id: 'vector-daylight-waste',
      title: 'Unnecessary Artificial Lighting',
      category: 'Daylight Harvesting',
      description: `Natural daylight (${analysis.lightAdc} ADC >= 500 ADC) is adequate for room activities, but lights are ON.`,
      powerDrawWatts: nominalFixtureWatts,
      severity: 'warning'
    });
    totalWastingWatts = nominalFixtureWatts;
    if (wasteSeverity !== 'critical') wasteSeverity = 'warning';
  }

  if (analysis.isVacantWasting) {
    wasteVectors.push({
      id: 'vector-vacant-waste',
      title: 'Lighting Active in Unoccupied Room',
      category: 'Unoccupied Space Drain',
      description: 'The space is confirmed vacant with no recent PIR motion, yet artificial lighting remains energized.',
      powerDrawWatts: nominalFixtureWatts,
      severity: 'critical'
    });
    totalWastingWatts = nominalFixtureWatts;
    wasteSeverity = 'critical';
  }

  // Energy waste status label
  let wasteStatusLabel = 'Conservation Baseline Maintained';
  if (wasteSeverity === 'critical') {
    wasteStatusLabel = 'Critical Energy Waste Active';
  } else if (wasteSeverity === 'warning') {
    wasteStatusLabel = 'Sub-Optimal Daylight Waste';
  } else if (analysis.isOptimalConservation) {
    wasteStatusLabel = 'Optimal Conservation Active';
  }

  return {
    hasWaste: wasteVectors.length > 0,
    wasteSeverity,
    wasteStatusLabel,
    totalWastingWatts,
    wastedWatts: totalWastingWatts,
    wasteVectors,
    isDaylightWasting: analysis.isDaylightWasting,
    isVacantWasting: analysis.isVacantWasting,
    isAbundantDaylightWasting: analysis.isAbundantDaylightWasting,
    analysis
  };
};
