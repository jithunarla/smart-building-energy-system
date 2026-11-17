/**
 * Sustainability Engine
 * Calculates composite and subsystem efficiency scores for smart building monitoring.
 */

export const calculateSustainabilityMetrics = (sensorData) => {
  const { light_adc, temperature, humidity, motion, room_light } = sensorData;

  // 1. Lighting Efficiency Score (0 - 100)
  let lightingScore = 85;
  let lightingStatus = 'Normal';
  let lightingSummary = 'Lighting circuits operating in standard mode.';

  if (light_adc >= 500 && room_light === 1) {
    // High daylight but lights ON -> Critical waste
    lightingScore = 32;
    lightingStatus = 'Severe Wastage';
    lightingSummary = 'Unnecessary artificial lighting during adequate/abundant daylight availability.';
  } else if (motion === 0 && room_light === 1) {
    // Vacant room with lights ON -> Unoccupied waste
    lightingScore = 40;
    lightingStatus = 'Idle Wastage';
    lightingSummary = 'Luminaires powered in an unoccupied zone.';
  } else if (light_adc >= 500 && room_light === 0) {
    // Excellent daylight harvesting
    lightingScore = 98;
    lightingStatus = 'Optimal Harvesting';
    lightingSummary = '100% natural daylight utilization with zero artificial lighting load.';
  } else if (motion === 1 && light_adc < 500 && room_light === 1) {
    // Justified task lighting
    lightingScore = 92;
    lightingStatus = 'Efficient Task Mode';
    lightingSummary = 'Artificial lighting active strictly to meet required task illuminance.';
  } else if (motion === 0 && room_light === 0) {
    // Standby conservation
    lightingScore = 96;
    lightingStatus = 'Standby Conserving';
    lightingSummary = 'Zone vacant with zero active lighting load.';
  }

  // 2. Occupancy-Aligned Efficiency Score (0 - 100)
  let occupancyScore = 88;
  if (motion === 0 && room_light === 1) {
    occupancyScore = 25; // Massive penalty for lighting an empty room
  } else if (motion === 1 && room_light === 1 && light_adc >= 500) {
    occupancyScore = 60; // Occupant present but failing to turn off lights despite bright sun
  } else if (motion === 1 && (room_light === 0 || light_adc < 500)) {
    occupancyScore = 96; // Good alignment
  } else if (motion === 0 && room_light === 0) {
    occupancyScore = 98; // Perfect vacancy alignment
  }

  // 3. Thermal Comfort Score (0 - 100)
  let tempScore = null;
  const isTempValid = temperature !== null && !isNaN(temperature);
  if (isTempValid) {
    if (temperature >= 21.0 && temperature <= 25.5) {
      tempScore = 98;
    } else if (temperature > 25.5 && temperature <= 28.0) {
      tempScore = 82;
    } else if (temperature > 28.0 && temperature <= 30.0) {
      tempScore = 68;
    } else if (temperature > 30.0) {
      tempScore = Math.max(30, Math.round(98 - (temperature - 25.5) * 12));
    } else {
      tempScore = Math.max(40, Math.round(98 - (21.0 - temperature) * 8));
    }
  }

  // 4. Humidity Comfort Score (0 - 100)
  let humidityScore = null;
  const isHumValid = humidity !== null && !isNaN(humidity);
  if (isHumValid) {
    if (humidity >= 40 && humidity <= 60) {
      humidityScore = 96;
    } else if ((humidity > 60 && humidity <= 68) || (humidity >= 35 && humidity < 40)) {
      humidityScore = 82;
    } else if (humidity > 68) {
      humidityScore = Math.max(35, Math.round(96 - (humidity - 60) * 3));
    } else {
      humidityScore = Math.max(40, Math.round(96 - (40 - humidity) * 3));
    }
  }

  // Overall Weighted Sustainability Score
  // Normalized across available sensor telemetry (Section 8: Do not award points for unavailable readings)
  let overallScore = 0;
  let totalWeight = 0.40 + 0.25; // Lighting (40%) + Occupancy (25%)
  let weightedSum = (lightingScore * 0.40) + (occupancyScore * 0.25);

  if (isTempValid) {
    weightedSum += (tempScore * 0.20);
    totalWeight += 0.20;
  }
  if (isHumValid) {
    weightedSum += (humidityScore * 0.15);
    totalWeight += 0.15;
  }

  overallScore = Math.round(weightedSum / totalWeight);

  let ratingLabel = 'Good';
  let ratingColor = 'text-emerald-400';
  let ratingBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (!isTempValid || !isHumValid) {
    ratingLabel = 'Degraded (Sensor Fault)';
    ratingColor = 'text-amber-400';
    ratingBg = 'bg-amber-500/10 border-amber-500/20';
  } else if (overallScore >= 90) {
    ratingLabel = 'Optimal / High Efficiency';
    ratingColor = 'text-emerald-400';
    ratingBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (overallScore >= 75) {
    ratingLabel = 'Good Efficiency';
    ratingColor = 'text-teal-400';
    ratingBg = 'bg-teal-500/10 border-teal-500/20';
  } else if (overallScore >= 60) {
    ratingLabel = 'Moderate / Action Advised';
    ratingColor = 'text-amber-400';
    ratingBg = 'bg-amber-500/10 border-amber-500/20';
  } else {
    ratingLabel = 'Critical Waste Detected';
    ratingColor = 'text-rose-400';
    ratingBg = 'bg-rose-500/10 border-rose-500/20';
  }

  return {
    overallScore,
    ratingLabel,
    ratingColor,
    ratingBg,
    lightingScore,
    lightingStatus,
    lightingSummary,
    occupancyScore,
    tempScore,
    humidityScore,
    estimatedDailyAvoidedBurnHours: room_light === 0 && light_adc >= 500 ? 5.2 : 1.4,
    estimatedAvoidedCO2Grams: room_light === 0 && light_adc >= 500 ? 416 : 112
  };
};
