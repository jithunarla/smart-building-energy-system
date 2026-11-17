/**
 * Centralized Condition Analyzer (Phase 4 Task 7 & 8)
 * Evaluates multi-sensor telemetry to determine discrete operational, environmental,
 * and waste conditions without duplicating logic across components.
 */

import { SENSOR_CONFIG } from '../data/mockSensorData.js';

export const analyzeConditions = (sensorData, isOccupiedParam = null) => {
  if (!sensorData || typeof sensorData !== 'object') {
    return getFallbackAnalysis();
  }

  const { light_adc, temperature, humidity, motion, room_light } = sensorData;
  const daylightThreshold = SENSOR_CONFIG?.ldr?.daylightHarvestingThreshold || 500;

  // 1. LDR Daylight Analysis
  const isLdrValid = light_adc !== null && light_adc !== undefined && !isNaN(Number(light_adc)) && Number(light_adc) >= 0 && Number(light_adc) <= 1023;
  const numericLdr = isLdrValid ? Number(light_adc) : null;
  const isDaylightAbundant = isLdrValid && numericLdr >= 750;
  const isDaylightSufficient = isLdrValid && numericLdr >= daylightThreshold;
  const isDaylightDim = isLdrValid && numericLdr >= 250 && numericLdr < daylightThreshold;
  const isDarkness = isLdrValid && numericLdr < 250;
  const isLdrFault = !isLdrValid;

  // 2. Climate (DHT11) Analysis
  const isTempValid = temperature !== null && temperature !== undefined && !isNaN(Number(temperature));
  const numericTemp = isTempValid ? Number(temperature) : null;
  const isTempCritical = isTempValid && numericTemp > 31.0;
  const isTempHigh = isTempValid && numericTemp > 25.5;
  const isTempLow = isTempValid && numericTemp < 21.0;
  const isTempComfortable = isTempValid && !isTempHigh && !isTempLow;
  const isTempFault = !isTempValid;

  const isHumValid = humidity !== null && humidity !== undefined && !isNaN(Number(humidity));
  const numericHum = isHumValid ? Number(humidity) : null;
  const isHumCritical = isHumValid && numericHum > 70;
  const isHumHigh = isHumValid && numericHum > 60;
  const isHumLow = isHumValid && numericHum < 40;
  const isHumComfortable = isHumValid && !isHumHigh && !isHumLow;
  const isHumFault = !isHumValid;

  // 3. Occupancy & Actuator Analysis (Webcam AI Occupancy & Failsafe Handling)
  const isMotionActive = motion === 1 || motion === true || motion === '1';
  let isOccupied = false;
  let isVacant = false;
  let isOccupancyUnknown = false;

  if (typeof isOccupiedParam === 'string') {
    if (isOccupiedParam === 'OCCUPIED') {
      isOccupied = true;
      isVacant = false;
    } else if (isOccupiedParam === 'UNOCCUPIED') {
      isOccupied = false;
      isVacant = true;
    } else {
      isOccupancyUnknown = true;
      isOccupied = false;
      isVacant = false;
    }
  } else if (isOccupiedParam !== null && isOccupiedParam !== undefined) {
    isOccupied = Boolean(isOccupiedParam);
    isVacant = !isOccupied;
  } else {
    isOccupied = isMotionActive;
    isVacant = !isMotionActive;
  }

  const isRoomLightOn = room_light === 1 || room_light === true || room_light === '1';

  // 4. Energy Waste Conditions (Rules 1, 2, 3)
  // Rule 1: Natural daylight is sufficient (>=500 ADC) AND room light is ON
  const isDaylightWasting = isDaylightSufficient && isRoomLightOn;

  // Rule 2: Space is CONFIRMED VACANT AND room light remains ON (never trigger if occupancy is UNKNOWN)
  const isVacantWasting = !isOccupancyUnknown && isVacant && isRoomLightOn;

  // Rule 3: Abundant natural daylight (>=750 ADC) AND room light is ON
  const isAbundantDaylightWasting = isDaylightAbundant && isRoomLightOn;

  // Composite waste condition
  const hasEnergyWaste = isDaylightWasting || isVacantWasting || isAbundantDaylightWasting;

  // 5. Lighting Requirement Condition (Rule 4)
  // Person present + LDR below 500 ADC + Room light is OFF
  const isTaskLightingRequired = isOccupied && isLdrValid && !isDaylightSufficient && !isRoomLightOn;

  // 6. Optimal Efficiency Condition
  const isOptimalConservation = (isDaylightSufficient && !isRoomLightOn) || (isVacant && !isRoomLightOn);

  return {
    // Sensor validity
    isLdrValid,
    isTempValid,
    isHumValid,
    isLdrFault,
    isTempFault,
    isHumFault,
    hasSensorFault: isLdrFault || isTempFault || isHumFault,

    // LDR metrics
    lightAdc: numericLdr,
    isDaylightAbundant,
    isDaylightSufficient,
    isDaylightDim,
    isDarkness,

    // Climate metrics
    temperature: numericTemp,
    humidity: numericHum,
    isTempCritical,
    isTempHigh,
    isTempLow,
    isTempComfortable,
    isHumCritical,
    isHumHigh,
    isHumLow,
    isHumComfortable,

    // Presence & Actuator
    isMotionActive,
    isOccupied,
    isVacant,
    isOccupancyUnknown,
    isRoomLightOn,

    // Energy waste determinations
    isDaylightWasting,
    isVacantWasting,
    isAbundantDaylightWasting,
    hasEnergyWaste,

    // Operational requirements
    isTaskLightingRequired,
    isOptimalConservation
  };
};

function getFallbackAnalysis() {
  return {
    isLdrValid: false,
    isTempValid: false,
    isHumValid: false,
    isLdrFault: true,
    isTempFault: true,
    isHumFault: true,
    hasSensorFault: true,
    lightAdc: null,
    isDaylightAbundant: false,
    isDaylightSufficient: false,
    isDaylightDim: false,
    isDarkness: false,
    temperature: null,
    humidity: null,
    isTempCritical: false,
    isTempHigh: false,
    isTempLow: false,
    isTempComfortable: false,
    isHumCritical: false,
    isHumHigh: false,
    isHumLow: false,
    isHumComfortable: false,
    isMotionActive: false,
    isOccupied: false,
    isVacant: false,
    isOccupancyUnknown: true,
    isRoomLightOn: false,
    isDaylightWasting: false,
    isVacantWasting: false,
    isAbundantDaylightWasting: false,
    hasEnergyWaste: false,
    isTaskLightingRequired: false,
    isOptimalConservation: false
  };
}
