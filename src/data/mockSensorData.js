/**
 * Centralized Mock Sensor Data and Configurations
 * Smart Building Energy Waste Detection & Sustainability Monitoring System
 */

// Baseline default sensor reading requested in specifications
export const INITIAL_SENSOR_DATA = {
  light_adc: 820,
  temperature: 28.5,
  humidity: 55,
  motion: 1,
  room_light: 0,
  timestamp: new Date().toISOString(),
  mode: 'demo'
};

// Sensor Specifications, Classifications, and Thresholds
export const SENSOR_CONFIG = {
  ldr: {
    name: 'LDR Light Sensor',
    sensorModel: 'Photoresistor (LDR GL5528)',
    pin: 'A0 (Analog)',
    min: 0,
    max: 1023,
    unit: 'ADC',
    // Threshold where daylight is considered adequate to turn off artificial luminaires
    daylightHarvestingThreshold: 500,
    thresholds: {
      darkness: 250,
      dim: 500,
      adequate: 750,
      abundant: 1023
    },
    // Exact 4 classification bands requested in Task 4
    classify: (val) => {
      if (val === null || val === undefined || isNaN(val)) {
        return {
          label: 'Sensor Fault',
          level: 'fault',
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          isSufficient: false
        };
      }
      const num = Number(val);
      if (num >= 750) {
        return {
          label: 'Abundant Daylight',
          level: 'high',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          isSufficient: true
        };
      }
      if (num >= 500) {
        return {
          label: 'Adequate Daylight',
          level: 'medium-high',
          badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
          isSufficient: true
        };
      }
      if (num >= 250) {
        return {
          label: 'Dim Lighting',
          level: 'medium-low',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          isSufficient: false
        };
      }
      return {
        label: 'Darkness',
        level: 'low',
        badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        isSufficient: false
      };
    }
  },
  dht11: {
    name: 'DHT11 Climate Sensor',
    sensorModel: 'DHT11 Digital Temp & Humidity',
    pin: 'D2 (Digital)',
    tempMin: 18.0,
    tempMax: 38.0,
    tempUnit: '°C',
    humidityMin: 30,
    humidityMax: 85,
    humidityUnit: '%',
    tempThresholds: {
      cool: 20.0,
      optimalMin: 21.0,
      optimalMax: 25.5,
      warm: 28.0,
      hot: 31.0
    },
    humidityThresholds: {
      dry: 35,
      optimalMin: 40,
      optimalMax: 60,
      humid: 70
    },
    classifyTemp: (val) => {
      if (val === null || val === undefined || isNaN(val)) {
        return { label: 'Sensor Fault', status: 'critical', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      }
      if (val > 31.0) return { label: 'Excessive Heat', status: 'critical', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      if (val > 28.0) return { label: 'Elevated Warmth', status: 'warning', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      if (val < 20.0) return { label: 'Cool / Sub-optimal', status: 'warning', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      return { label: 'Comfortable', status: 'optimal', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    },
    classifyHumidity: (val) => {
      if (val === null || val === undefined || isNaN(val)) {
        return { label: 'Sensor Fault', status: 'critical', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      }
      if (val > 70) return { label: 'High Humidity', status: 'warning', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      if (val < 35) return { label: 'Dry Air', status: 'info', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      return { label: 'Optimal IAQ', status: 'optimal', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
  },
  pir: {
    name: 'Human Presence Detection',
    sensorModel: 'Laptop Webcam AI (COCO-SSD v2.2) [PIR Disabled]',
    pin: 'USB Webcam',
    defaultInactivityTimeout: 30, // Exactly 30 seconds (30,000 ms) grace period
    minTimeout: 10,
    maxTimeout: 120,
    note: 'Hardware PIR on D7 disabled. Laptop webcam AI performs real-time person detection with 30s grace window.'
  },
  room_light: {
    name: 'Room Lighting Circuit',
    actuatorType: 'Demonstration Room LED (220Ω current-limiting resistor)',
    pin: 'D7 (Digital Output)',
    powerRatingWatts: 120
  }
};

// The 5 Required Demonstration Scenarios (Task 4)
export const DEMO_SCENARIOS = [
  {
    id: 'standard_afternoon',
    title: 'Scenario 1 – Standard Afternoon',
    shortName: 'Standard Afternoon',
    description: 'Moderate daylight (620 ADC), normal indoor temperature (24.5°C), comfortable humidity (50%), occasional motion.',
    data: {
      light_adc: 620,
      temperature: 24.5,
      humidity: 50,
      motion: 1,
      room_light: 0,
      mode: 'demo'
    },
    inactivitySeconds: 5
  },
  {
    id: 'bright_daylight',
    title: 'Scenario 2 – Bright Daylight',
    shortName: 'Bright Daylight',
    description: 'High LDR readings (880 ADC), human motion detected (1), artificial light remains OFF (0).',
    data: {
      light_adc: 880,
      temperature: 28.5,
      humidity: 55,
      motion: 1,
      room_light: 0,
      mode: 'demo'
    },
    inactivitySeconds: 0
  },
  {
    id: 'dark_room_occupied',
    title: 'Scenario 3 – Dark Room Occupied',
    shortName: 'Dark Room Occupied',
    description: 'Very low LDR readings (140 ADC), human motion detected (1), artificial light automatically switches ON (1).',
    data: {
      light_adc: 140,
      temperature: 23.0,
      humidity: 48,
      motion: 1,
      room_light: 1,
      mode: 'demo'
    },
    inactivitySeconds: 2
  },
  {
    id: 'empty_room',
    title: 'Scenario 4 – Empty Room',
    shortName: 'Empty Room',
    description: 'No recent motion (0), room light automatically switches OFF (0), space changes to unoccupied after inactivity timeout.',
    data: {
      light_adc: 420,
      temperature: 22.8,
      humidity: 52,
      motion: 0,
      room_light: 0,
      mode: 'demo'
    },
    inactivitySeconds: 65 // Exceeds default timeout to guarantee unoccupied state
  },
  {
    id: 'hot_and_humid',
    title: 'Scenario 5 – Hot and Humid Environment',
    shortName: 'Hot & Humid Environment',
    description: 'Elevated temperature (32.5°C), high humidity (78%), active motion. Generates thermal and latent warnings.',
    data: {
      light_adc: 740,
      temperature: 32.5,
      humidity: 78,
      motion: 1,
      room_light: 0,
      mode: 'demo'
    },
    inactivitySeconds: 10
  }
];

// Generate initial baseline 24-hour log points
export const generate24HourHistory = () => {
  const points = [];
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', 'Now'
  ];

  const lightPattern = [45, 40, 50, 180, 560, 780, 890, 820, 680, 310, 80, 55, 820];
  const tempPattern = [21.5, 21.0, 20.8, 21.2, 23.5, 26.2, 28.0, 28.5, 27.8, 25.4, 23.8, 22.5, 28.5];
  const humPattern = [62, 64, 65, 63, 58, 52, 48, 55, 54, 57, 60, 61, 55];
  const motionEvents = [0, 0, 0, 1, 4, 12, 18, 14, 11, 6, 2, 0, 1];
  const lightStatus = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0];

  hours.forEach((time, i) => {
    points.push({
      time,
      light_adc: lightPattern[i],
      temperature: tempPattern[i],
      humidity: humPattern[i],
      motion: motionEvents[i],
      room_light: lightStatus[i],
      efficiency: Math.max(60, Math.min(98, 100 - (lightStatus[i] && lightPattern[i] > 500 ? 30 : 5) - (tempPattern[i] > 27 ? 10 : 0)))
    });
  });

  return points;
};

// Weekly Trend Data for Page 7 Analytics
export const WEEKLY_ANALYTICS_DATA = [
  { day: 'Mon', avgTemp: 24.2, avgHum: 52, avgLight: 610, wasteMinutes: 45, sustainabilityScore: 88 },
  { day: 'Tue', avgTemp: 25.1, avgHum: 54, avgLight: 680, wasteMinutes: 30, sustainabilityScore: 92 },
  { day: 'Wed', avgTemp: 27.4, avgHum: 58, avgLight: 740, wasteMinutes: 80, sustainabilityScore: 79 },
  { day: 'Thu', avgTemp: 26.8, avgHum: 56, avgLight: 710, wasteMinutes: 20, sustainabilityScore: 95 },
  { day: 'Fri', avgTemp: 28.2, avgHum: 60, avgLight: 790, wasteMinutes: 65, sustainabilityScore: 82 },
  { day: 'Sat', avgTemp: 23.0, avgHum: 48, avgLight: 520, wasteMinutes: 10, sustainabilityScore: 97 },
  { day: 'Sun', avgTemp: 22.5, avgHum: 47, avgLight: 480, wasteMinutes: 5,  sustainabilityScore: 99 },
];
