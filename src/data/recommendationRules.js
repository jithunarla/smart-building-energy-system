/**
 * Recommendation Rules & Metadata (Phase 4 Task 12 & 13)
 * Defines structured context-aware recommendations organized across the 5 required categories.
 */

export const RECOMMENDATION_CATEGORIES = {
  LIGHTING: 'Lighting Optimization',
  OCCUPANCY: 'Occupancy Management',
  TEMPERATURE: 'Temperature Management',
  HUMIDITY: 'Humidity Management',
  GENERAL: 'General Energy Efficiency'
};

export const RECOMMENDATION_PRIORITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const RECOMMENDATION_RULE_DEFS = {
  // 1. LIGHTING OPTIMIZATION
  DAYLIGHT_HARVESTING: {
    id: 'rec-daylight-harvesting',
    category: RECOMMENDATION_CATEGORIES.LIGHTING,
    relatedSensor: 'LDR Photoresistor (A0)',
    title: 'Harvest Natural Ambient Daylight',
    priority: (data) => (data.room_light === 1 ? RECOMMENDATION_PRIORITY.HIGH : RECOMMENDATION_PRIORITY.LOW),
    detectedCondition: (data) => `Ambient natural light is ${data.light_adc} ADC (adequate/abundant daylight >= 500 ADC).`,
    suggestedAction: (data) => data.room_light === 1
      ? 'Turn OFF artificial lighting immediately and utilize available natural solar daylight.'
      : 'Maintain artificial lighting in OFF state; natural illumination fully satisfies illuminance criteria.',
    reason: 'Natural daylight provides sufficient workplace lux, making supplementary artificial luminaires redundant.',
    expectedBenefit: 'Avoids unnecessary luminaire burn hours and lowers electrical fixture heat dissipation.',
    icon: 'Sun'
  },

  DAYLIGHT_WASTE_CUTOFF: {
    id: 'rec-daylight-waste-cutoff',
    category: RECOMMENDATION_CATEGORIES.LIGHTING,
    relatedSensor: 'LDR & Relay (A0/D8)',
    title: 'De-energize Luminaire During High Daylight',
    priority: RECOMMENDATION_PRIORITY.CRITICAL,
    detectedCondition: (data) => `Artificial lighting is energized (120W) in parallel with abundant natural daylight (${data.light_adc} ADC >= 750 ADC).`,
    suggestedAction: 'Switch OFF artificial luminaires to eliminate simultaneous electrical and natural light overload.',
    reason: 'Operating lights in bright daylight causes direct electrical energy wastage without improving visual clarity.',
    expectedBenefit: 'Direct reduction of 120W electrical load and extended lamp service life.',
    icon: 'ZapOff'
  },

  TASK_LIGHTING_NEEDED: {
    id: 'rec-task-lighting-needed',
    category: RECOMMENDATION_CATEGORIES.LIGHTING,
    relatedSensor: 'LDR & PIR (A0/D7)',
    title: 'Supplementary Task Lighting Recommended',
    priority: RECOMMENDATION_PRIORITY.MEDIUM,
    detectedCondition: (data) => `Natural daylight is dim/dark (${data.light_adc} ADC < 500 ADC) while human presence is detected.`,
    suggestedAction: 'Energize artificial lighting circuit to provide standard task illuminance for occupants.',
    reason: 'Ensures visual ergonomics and workplace comfort according to standard commercial indoor lighting guidelines.',
    expectedBenefit: 'Maintains occupant visual safety and workplace productivity while keeping lighting targeted.',
    icon: 'Lightbulb'
  },

  // 2. OCCUPANCY MANAGEMENT
  OCCUPANCY_TIMEOUT_CUTOFF: {
    id: 'rec-occupancy-timeout',
    category: RECOMMENDATION_CATEGORIES.OCCUPANCY,
    relatedSensor: 'PIR Motion & Relay (D7/D8)',
    title: 'Enforce Vacant Space Power Cutoff',
    priority: RECOMMENDATION_PRIORITY.CRITICAL,
    detectedCondition: () => 'No PIR motion detected and zone has exceeded the inactivity window while lights remain ON.',
    suggestedAction: 'Execute automatic power cutoff on relay channel D8 to terminate unoccupied burn hours.',
    reason: 'Unoccupied building zones should never sustain continuous electrical loads when vacant.',
    expectedBenefit: 'Eliminates idle electrical waste during break intervals, meetings, and post-shift hours.',
    icon: 'Users'
  },

  OCCUPANCY_STANDBY_MAINTAIN: {
    id: 'rec-occupancy-standby',
    category: RECOMMENDATION_CATEGORIES.OCCUPANCY,
    relatedSensor: 'PIR Motion Sensor (D7)',
    title: 'Maintain Automated PIR Standby Mode',
    priority: RECOMMENDATION_PRIORITY.LOW,
    detectedCondition: () => 'Zone is confirmed vacant with all artificial luminaire circuits de-energized.',
    suggestedAction: 'Maintain dormant sensor standby mode; keep relay de-energized until movement is detected.',
    reason: 'Eliminates standby power consumption while remaining armed for occupant arrival.',
    expectedBenefit: 'Ensures zero phantom electrical drain while guaranteeing immediate illumination upon entry.',
    icon: 'CheckCircle'
  },

  // 3. TEMPERATURE MANAGEMENT
  HIGH_TEMP_VENTILATION: {
    id: 'rec-high-temp-ventilation',
    category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
    relatedSensor: 'DHT11 Climate Sensor (D2)',
    title: 'Enhance Indoor Ventilation & Heat Dispersion',
    priority: (temp) => (temp > 31.0 ? RECOMMENDATION_PRIORITY.CRITICAL : RECOMMENDATION_PRIORITY.HIGH),
    detectedCondition: (data) => `Indoor temperature is elevated at ${data.temperature?.toFixed(1)}°C, exceeding the 25.5°C comfort ceiling.`,
    suggestedAction: 'Improve ventilation airflow, deploy solar window shades, and optimize passive air circulation.',
    reason: 'Excessive thermal gain creates uncomfortable working conditions and elevates passive building heat load.',
    expectedBenefit: 'Improves indoor thermal comfort and mitigates radiant solar heat buildup.',
    icon: 'Thermometer'
  },

  LOW_TEMP_INSULATION: {
    id: 'rec-low-temp-insulation',
    category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
    relatedSensor: 'DHT11 Climate Sensor (D2)',
    title: 'Inspect Envelope Weatherization & Drafts',
    priority: RECOMMENDATION_PRIORITY.MEDIUM,
    detectedCondition: (data) => `Indoor temperature is cool at ${data.temperature?.toFixed(1)}°C, falling below the 21.0°C comfort floor.`,
    suggestedAction: 'Check perimeter window seals, door sweeps, and exterior dampers for cold drafts.',
    reason: 'Convective cold air infiltration leads to uneven temperature zones and unnecessary heating demand.',
    expectedBenefit: 'Preserves conditioned internal air and stabilizes zone thermal comfort.',
    icon: 'ThermometerSnowflake'
  },

  OPTIMAL_TEMPERATURE: {
    id: 'rec-temp-optimal',
    category: RECOMMENDATION_CATEGORIES.TEMPERATURE,
    relatedSensor: 'DHT11 Climate Sensor (D2)',
    title: 'Thermal Comfort Envelope Maintained',
    priority: RECOMMENDATION_PRIORITY.LOW,
    detectedCondition: (data) => `Indoor temperature (${data.temperature?.toFixed(1)}°C) is within the optimal 21.0°C–25.5°C range.`,
    suggestedAction: 'Maintain current ventilation and airflow baseline; avoid manual setpoint overrides.',
    reason: 'Stable temperatures within comfort boundaries eliminate wasteful thermal cycling.',
    expectedBenefit: 'Consistent occupant thermal comfort without excessive heating or cooling modulation.',
    icon: 'CheckCircle2'
  },

  // 4. HUMIDITY MANAGEMENT
  HIGH_HUMIDITY_VENTILATION: {
    id: 'rec-high-humidity-ventilation',
    category: RECOMMENDATION_CATEGORIES.HUMIDITY,
    relatedSensor: 'DHT11 Relative Humidity (D2)',
    title: 'Improve Ventilation to Lower Indoor Humidity',
    priority: RECOMMENDATION_PRIORITY.HIGH,
    detectedCondition: (data) => `Relative humidity is elevated at ${data.humidity}%, exceeding the 60% comfort ceiling.`,
    suggestedAction: 'Increase building ventilation rate and check air exchange dampers to promote moisture evacuation.',
    reason: 'High relative humidity amplifies perceived warmth, impairs natural cooling, and risks moisture condensation.',
    expectedBenefit: 'Reduces latent moisture load and prevents mold proliferation.',
    icon: 'Droplets'
  },

  LOW_HUMIDITY_MONITORING: {
    id: 'rec-low-humidity-monitoring',
    category: RECOMMENDATION_CATEGORIES.HUMIDITY,
    relatedSensor: 'DHT11 Relative Humidity (D2)',
    title: 'Monitor Indoor Air Dryness Levels',
    priority: RECOMMENDATION_PRIORITY.MEDIUM,
    detectedCondition: (data) => `Relative humidity is low at ${data.humidity}%, below the 40% recommended baseline.`,
    suggestedAction: 'Monitor indoor environmental airflow and modulate excessive exhaust rates that extract moisture.',
    reason: 'Dry indoor air causes eye and respiratory irritation and increases electrostatic discharge risk.',
    expectedBenefit: 'Maintains healthy indoor air balance in the 40%–60% RH envelope.',
    icon: 'Wind'
  },

  OPTIMAL_HUMIDITY: {
    id: 'rec-humidity-optimal',
    category: RECOMMENDATION_CATEGORIES.HUMIDITY,
    relatedSensor: 'DHT11 Relative Humidity (D2)',
    title: 'Balanced Indoor Relative Humidity',
    priority: RECOMMENDATION_PRIORITY.LOW,
    detectedCondition: (data) => `Relative humidity is comfortably balanced at ${data.humidity}% (40%–60% envelope).`,
    suggestedAction: 'Continue current environmental ventilation baseline.',
    reason: 'Balanced humidity promotes comfort and prevents both dryness and condensation risks.',
    expectedBenefit: 'Healthy indoor air quality without supplementary moisture conditioning.',
    icon: 'ShieldCheck'
  },

  // 5. GENERAL ENERGY EFFICIENCY
  SENSOR_FAULT_INSPECTION: {
    id: 'rec-sensor-fault-inspection',
    category: RECOMMENDATION_CATEGORIES.GENERAL,
    relatedSensor: 'Hardware Sensor Bus',
    title: 'Inspect Sensor Wiring & Signal Continuity',
    priority: RECOMMENDATION_PRIORITY.HIGH,
    detectedCondition: () => 'One or more hardware sensor telemetry streams returned null or out-of-range values.',
    suggestedAction: 'Inspect breadboard jumper wiring, verify sensor 5V power rails, and ensure digital pull-up resistors are seated.',
    reason: 'Reliable autonomous energy waste detection requires uncompromised multi-sensor telemetry.',
    expectedBenefit: 'Restores automated energy waste detection, daylight harvesting, and climate monitoring.',
    icon: 'AlertCircle'
  },

  AUTOMATED_CONSERVATION_AUDIT: {
    id: 'rec-general-audit',
    category: RECOMMENDATION_CATEGORIES.GENERAL,
    relatedSensor: 'BMS Central Logic',
    title: 'Verify Automatic Conservation Rule Alignment',
    priority: RECOMMENDATION_PRIORITY.MEDIUM,
    detectedCondition: () => 'Operational telemetry indicates active building occupancy and environmental modulation.',
    suggestedAction: 'Ensure daylight harvesting thresholds and PIR inactivity timers remain aligned with zone schedules.',
    reason: 'Regularly validating automated control rules prevents creep in energy consumption over time.',
    expectedBenefit: 'Sustained energy efficiency and predictable commercial operational metrics.',
    icon: 'Sliders'
  }
};
