/**
 * Centralized Alert Rules & Metadata (Phase 4 Task 8)
 * Standardizes detection conditions, severity ratings, sensors, and recommendations
 * across Rules 1 to 9.
 */

export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  EFFICIENT: 'efficient'
};

export const ALERT_CATEGORIES = {
  ENERGY_WASTE: 'energy-waste',
  LIGHTING_ADVISORY: 'lighting-advisory',
  ENVIRONMENTAL: 'environmental',
  SENSOR_FAULT: 'sensor-fault',
  OPTIMAL: 'optimal'
};

export const ALERT_RULE_DEFS = {
  // RULE 1 – Unnecessary Artificial Lighting
  RULE_1_DAYLIGHT_WASTE: {
    ruleNumber: 1,
    ruleId: 'alert-daylight-waste',
    title: 'Unnecessary Artificial Lighting Detected',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENERGY_WASTE,
    sensor: 'LDR & Room Light',
    description: (data) => `Natural daylight is sufficient (${data.light_adc} ADC >= 500 ADC) while artificial room lighting remains powered ON.`,
    recommendation: 'Use available natural daylight and switch OFF artificial lighting.',
    impact: 'Avoidable Electrical Energy Waste',
    cooldownMs: 10000
  },

  // RULE 2 – Lighting in an Unoccupied Room
  RULE_2_VACANT_LIGHTING: {
    ruleNumber: 2,
    ruleId: 'alert-vacant-room-waste',
    title: 'Unoccupied Room Lighting Detected',
    severity: ALERT_SEVERITY.CRITICAL,
    category: ALERT_CATEGORIES.ENERGY_WASTE,
    sensor: 'PIR Motion & Room Light',
    description: (data) => 'No occupant movement detected and space is confirmed vacant, yet artificial lighting remains powered ON.',
    recommendation: 'Switch OFF unnecessary artificial lighting to reduce energy consumption.',
    impact: 'Phantom Electrical Burn Hours',
    cooldownMs: 10000
  },

  // RULE 3 – Unnecessary Lighting During Daylight
  RULE_3_ABUNDANT_DAYLIGHT_WASTE: {
    ruleNumber: 3,
    ruleId: 'alert-abundant-daylight-waste',
    title: 'High Daylight Luminaire Wastage',
    severity: ALERT_SEVERITY.CRITICAL,
    category: ALERT_CATEGORIES.ENERGY_WASTE,
    sensor: 'LDR, PIR & Room Light',
    description: (data) => `Abundant natural daylight (${data.light_adc} ADC >= 750 ADC) provides high photopic illuminance, but artificial lighting is energized.`,
    recommendation: 'Harvest abundant natural daylight and de-energize artificial luminaire circuits immediately.',
    impact: 'Severe Energy Wastage & Luminaire Degradation',
    cooldownMs: 10000
  },

  // RULE 4 – Low Daylight and Occupied Room
  RULE_4_LOW_DAYLIGHT_OCCUPIED: {
    ruleNumber: 4,
    ruleId: 'alert-task-lighting-needed',
    title: 'Task Illumination Requirement Advisory',
    severity: ALERT_SEVERITY.INFO,
    category: ALERT_CATEGORIES.LIGHTING_ADVISORY,
    sensor: 'LDR & PIR Motion',
    description: (data) => `Human presence detected while ambient natural daylight is dim (${data.light_adc} ADC < 500 ADC) and artificial light is OFF.`,
    recommendation: 'Artificial lighting may be required because natural daylight is insufficient.',
    impact: 'Visual Ergonomics / Task Lighting Support',
    cooldownMs: 15000
  },

  // RULE 5 – High Temperature
  RULE_5_HIGH_TEMP: {
    ruleNumber: 5,
    ruleId: 'alert-high-temperature',
    title: 'Elevated Indoor Temperature Warning',
    severity: (temp) => temp > 31.0 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Temperature',
    description: (data) => `Ambient temperature (${data.temperature?.toFixed(1)}°C) exceeds the configured comfort ceiling of 25.5°C.`,
    recommendation: 'Improve ventilation and optimize cooling to maintain indoor thermal comfort.',
    impact: 'Thermal Discomfort & Latent Heat Load',
    cooldownMs: 15000
  },

  // RULE 6 – Low Temperature
  RULE_6_LOW_TEMP: {
    ruleNumber: 6,
    ruleId: 'alert-low-temperature',
    title: 'Low Indoor Temperature Advisory',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Temperature',
    description: (data) => `Indoor temperature (${data.temperature?.toFixed(1)}°C) fell below the configured comfort floor of 21.0°C.`,
    recommendation: 'Check building envelope seals for cold air infiltration and modulate airflow dampers.',
    impact: 'Sub-Optimal Thermal Comfort',
    cooldownMs: 15000
  },

  // RULE 7 – High Humidity
  RULE_7_HIGH_HUMIDITY: {
    ruleNumber: 7,
    ruleId: 'alert-high-humidity',
    title: 'High Relative Humidity Warning',
    severity: (hum) => hum > 70 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Humidity',
    description: (data) => `Indoor relative humidity (${data.humidity}%) exceeds the 60% comfort ceiling, increasing latent load and moisture risk.`,
    recommendation: 'Improve ventilation and monitor indoor humidity.',
    impact: 'Moisture Accumulation & Latent HVAC Load',
    cooldownMs: 15000
  },

  // RULE 8 – Low Humidity
  RULE_8_LOW_HUMIDITY: {
    ruleNumber: 8,
    ruleId: 'alert-low-humidity',
    title: 'Low Relative Humidity Advisory',
    severity: ALERT_SEVERITY.INFO,
    category: ALERT_CATEGORIES.ENVIRONMENTAL,
    sensor: 'DHT11 Humidity',
    description: (data) => `Indoor relative humidity (${data.humidity}%) is below the 40% recommended comfort envelope.`,
    recommendation: 'Air dryness detected. Monitor environmental airflow and modulate excessive exhaust rates.',
    impact: 'Air Dryness / Respiratory Comfort',
    cooldownMs: 15000
  },

  // RULE 9 – Sensor Fault
  RULE_9_LDR_FAULT: {
    ruleNumber: 9,
    ruleId: 'alert-ldr-fault',
    title: 'LDR Daylight Sensor Signal Fault',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.SENSOR_FAULT,
    sensor: 'LDR Analog (Pin A0)',
    description: () => 'LDR sensor analog reading is null or out of physical bounds (0–1023 ADC). Daylight harvesting offline.',
    recommendation: 'Inspect LDR voltage divider wiring on Analog Pin A0 and verify 5V VCC and 10kΩ pull-down resistor.',
    impact: 'Daylight Harvesting Analytics Suspended',
    cooldownMs: 30000
  },

  RULE_9_DHT11_FAULT: {
    ruleNumber: 9,
    ruleId: 'alert-dht11-fault',
    title: 'DHT11 Climate Sensor Signal Fault',
    severity: ALERT_SEVERITY.WARNING,
    category: ALERT_CATEGORIES.SENSOR_FAULT,
    sensor: 'DHT11 Digital (Pin D2)',
    description: () => 'DHT11 telemetry returned null readings. Digital communication timed out or reported a checksum error.',
    recommendation: 'Verify single-wire data connection on Pin D2, check 5V power leads, and ensure pull-up resistor is installed.',
    impact: 'Climate Monitoring Offline',
    cooldownMs: 30000
  },

  // OPTIMAL OPERATION STATES
  OPTIMAL_DAYLIGHT_HARVESTING: {
    ruleNumber: 0,
    ruleId: 'alert-optimal-daylight',
    title: 'Optimal Daylight Harvesting Condition',
    severity: ALERT_SEVERITY.EFFICIENT,
    category: ALERT_CATEGORIES.OPTIMAL,
    sensor: 'LDR & Room Light',
    description: (data) => `Space is occupied and utilizing natural daylight (${data.light_adc} ADC) with artificial lights powered OFF.`,
    recommendation: 'No action required. Current operational policy maximizes daylight conservation.',
    impact: 'Zero Artificial Lighting Power Consumption',
    cooldownMs: 30000
  },

  OPTIMAL_VACANT_STANDBY: {
    ruleNumber: 0,
    ruleId: 'alert-optimal-standby',
    title: 'Efficient Standby State: Vacant Space',
    severity: ALERT_SEVERITY.EFFICIENT,
    category: ALERT_CATEGORIES.OPTIMAL,
    sensor: 'PIR Motion & Room Light',
    description: () => 'Space is confirmed vacant and artificial lighting is securely de-energized in standby mode.',
    recommendation: 'Maintain automatic PIR standby mode until occupant entry is registered.',
    impact: 'Zero Standby Electrical Consumption',
    cooldownMs: 30000
  }
};
