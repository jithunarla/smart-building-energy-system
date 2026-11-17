import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { sensorDataService } from '../services/sensorDataService.js';
import { serialService, HARDWARE_STATUS } from '../services/serialService.js';
import { alertService } from '../services/alertService.js';
import { notificationService } from '../services/notificationService.js';
import { occupancyDetectionService, OCCUPANCY_STATES, CAMERA_STATUS } from '../services/occupancyDetectionService.js';
import { occupancyEventService } from '../services/occupancyEventService.js';
import { smartLightingService } from '../services/smartLightingService.js';
import { energyConfig } from '../config/energyConfig.js';
import { lightingHistoryService } from '../services/lightingHistoryService.js';
import { energyWasteAnalyticsService } from '../services/energyWasteAnalyticsService.js';
import { energyAnalyticsService } from '../services/energyAnalyticsService.js';
import { sustainabilityReportService } from '../services/sustainabilityReportService.js';
import { evaluateEnergyWaste } from '../engine/energyWasteEngine.js';
import { generateRecommendations } from '../engine/recommendationEngine.js';
import { calculateSustainabilityMetrics } from '../engine/sustainabilityEngine.js';
import { SENSOR_CONFIG } from '../data/mockSensorData.js';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  // Snapshot from centralized sensorDataService
  const [snapshot, setSnapshot] = useState(() => sensorDataService.getSnapshot());

  // Clock ticker for top navbar
  const [currentTime, setCurrentTime] = useState(new Date());

  // Alert service state tracking
  const [alertState, setAlertState] = useState(() => alertService.getState());

  // Notification service state tracking
  const [notificationState, setNotificationState] = useState(() => notificationService.getState());

  // AI Webcam Occupancy Detection service state
  const [aiOccupancy, setAiOccupancy] = useState(() => occupancyDetectionService.getState());

  // Occupancy Events & Analytics service state (Phase 5)
  const [occupancyAnalytics, setOccupancyAnalytics] = useState(() => occupancyEventService.getState());

  // Smart Lighting decision state
  const [smartLighting, setSmartLighting] = useState(() => smartLightingService.getState());

  // Energy Configuration state (Phase 6)
  const [energyConfigState, setEnergyConfigState] = useState(() => energyConfig.getConfig());

  // Lighting Usage History & Intervals state (Phase 6)
  const [lightingHistoryState, setLightingHistoryState] = useState(() => lightingHistoryService.getState());

  // Energy Waste Analytics state (Phase 6)
  const [wasteAnalyticsState, setWasteAnalyticsState] = useState(() => energyWasteAnalyticsService.getState());

  // Centralized Energy Analytics Engine state (Phase 6)
  const [energyAnalyticsState, setEnergyAnalyticsState] = useState(() => energyAnalyticsService.getState());

  // Live second ticker for real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Subscribe to centralized sensor data stream
  useEffect(() => {
    const unsubscribe = sensorDataService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Alert Service state changes
  useEffect(() => {
    const unsubscribe = alertService.subscribe((newAlertState) => {
      setAlertState(newAlertState);
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Notification Service state changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifState) => {
      setNotificationState(newNotifState);
    });
    return () => unsubscribe();
  }, []);

  // 4. Subscribe to AI Webcam Occupancy Detection Service
  useEffect(() => {
    const unsubscribe = occupancyDetectionService.subscribe((newAiState) => {
      setAiOccupancy(newAiState);
    });
    return () => unsubscribe();
  }, []);

  // 4b. Subscribe to Occupancy Events & Analytics Service (Phase 5)
  useEffect(() => {
    const unsubscribe = occupancyEventService.subscribe((newAnalytics) => {
      setOccupancyAnalytics(newAnalytics);
    });
    return () => unsubscribe();
  }, []);

  // 5. Subscribe to Smart Lighting Service
  useEffect(() => {
    const unsubscribe = smartLightingService.subscribe((newLightingState) => {
      setSmartLighting(newLightingState);
    });
    return () => unsubscribe();
  }, []);

  // 5b. Subscribe to Energy Configuration (Phase 6)
  useEffect(() => {
    const unsubscribe = energyConfig.subscribe((newCfg) => {
      setEnergyConfigState(newCfg);
    });
    return () => unsubscribe();
  }, []);

  // 5c. Subscribe to Lighting Usage History (Phase 6)
  useEffect(() => {
    const unsubscribe = lightingHistoryService.subscribe((newHist) => {
      setLightingHistoryState(newHist);
    });
    return () => unsubscribe();
  }, []);

  // 5d. Subscribe to Energy Waste Analytics (Phase 6)
  useEffect(() => {
    const unsubscribe = energyWasteAnalyticsService.subscribe((newWaste) => {
      setWasteAnalyticsState(newWaste);
    });
    return () => unsubscribe();
  }, []);

  // 5e. Subscribe to Centralized Energy Analytics Engine (Phase 6)
  useEffect(() => {
    const unsubscribe = energyAnalyticsService.subscribe((newAnalytics) => {
      setEnergyAnalyticsState(newAnalytics);
    });
    return () => unsubscribe();
  }, []);

  // Determine effective occupancy:
  // If camera is active or in AI simulation mode, prioritize AI webcam detection!
  // Otherwise, use snapshot presence baseline.
  const isAiActive = aiOccupancy.cameraStatus === CAMERA_STATUS.ACTIVE || aiOccupancy.isSimulated;
  const effectiveOccupancyState = isAiActive 
    ? aiOccupancy.occupancyStatus 
    : (snapshot.isOccupied ? OCCUPANCY_STATES.OCCUPIED : OCCUPANCY_STATES.UNOCCUPIED);
  
  const isEffectivelyOccupied = effectiveOccupancyState === OCCUPANCY_STATES.OCCUPIED;

  // 6. Centralized Smart Lighting Decision Evaluation
  // Evaluates AI Occupancy + LDR reading and coordinates serial transmission
  useEffect(() => {
    smartLightingService.evaluateLightingDecision(
      effectiveOccupancyState,
      snapshot.reading.light_adc,
      snapshot.mode === 'hardware',
      snapshot.reading.room_light
    );
  }, [effectiveOccupancyState, snapshot.reading.light_adc, snapshot.reading.room_light, snapshot.mode]);

  // 6b. Record Room LED State Transitions for Interval Tracking (Phase 6)
  useEffect(() => {
    lightingHistoryService.recordStateChange({
      newState: snapshot.reading.room_light,
      desiredState: smartLighting.desiredLightState,
      occupancy: effectiveOccupancyState,
      ldr: snapshot.reading.light_adc,
      reason: smartLighting.lastDecisionReason
    });
  }, [snapshot.reading.room_light, smartLighting.desiredLightState, effectiveOccupancyState, snapshot.reading.light_adc]);

  // 6c. Real-time Energy Waste Condition Evaluation (Phase 6)
  useEffect(() => {
    energyWasteAnalyticsService.evaluateCondition({
      occupancy: effectiveOccupancyState,
      lightAdc: snapshot.reading.light_adc,
      roomLight: snapshot.reading.room_light
    });
  }, [effectiveOccupancyState, snapshot.reading.light_adc, snapshot.reading.room_light]);

  // 7. Sync alerts and notifications whenever sensor reading or occupancy updates
  useEffect(() => {
    const updatedAlerts = alertService.evaluateAndSync(snapshot.reading, effectiveOccupancyState);
    notificationService.syncFromAlerts(updatedAlerts.activeAlerts);
  }, [snapshot.reading, effectiveOccupancyState]);

  // Mode changer (demo vs hardware)
  const setMode = useCallback((newMode) => {
    sensorDataService.setMode(newMode);
    occupancyEventService.setMode(newMode);
    lightingHistoryService.setMode(newMode);
    energyWasteAnalyticsService.setMode(newMode);
    energyAnalyticsService.setMode(newMode);
    if (newMode === 'demo') {
      occupancyDetectionService.selectSimulationScenario('PERSON_BRIGHT');
    }
  }, []);

  // Scenarios switch
  const selectScenario = useCallback((scenarioId) => {
    sensorDataService.applyScenario(scenarioId);
    // Align simulated AI camera scenario with sensor scenario
    if (scenarioId === 'night_dark') {
      occupancyDetectionService.selectSimulationScenario('PERSON_DARK');
    } else if (scenarioId === 'afternoon_sun' || scenarioId === 'morning_waste') {
      occupancyDetectionService.selectSimulationScenario('PERSON_BRIGHT');
    } else if (scenarioId === 'empty_room') {
      occupancyDetectionService.selectSimulationScenario('EMPTY_ROOM');
    }
  }, []);

  // Manual sensor value adjustment
  const updateSensorValue = useCallback((key, val) => {
    sensorDataService.updateSensor(key, val);
  }, []);

  // Quick action: Toggle room light (with Web Serial write)
  const toggleRoomLight = useCallback(() => {
    smartLightingService.forceManualLightToggle();
  }, []);

  // Quick action: Simulate motion pulse
  const triggerMotionPulse = useCallback(() => {
    sensorDataService.pulseMotion();
  }, []);

  // Simulation controls
  const pauseSimulation = useCallback(() => {
    sensorDataService.pauseSimulation();
  }, []);

  const resumeSimulation = useCallback(() => {
    sensorDataService.resumeSimulation();
  }, []);

  const resetSimulation = useCallback(() => {
    sensorDataService.resetSimulation();
  }, []);

  const setSimulationSpeed = useCallback((speed) => {
    sensorDataService.setSpeed(speed);
  }, []);

  const setInactivityTimeout = useCallback((seconds) => {
    sensorDataService.setInactivityTimeout(seconds);
    occupancyDetectionService.setAbsenceTimeout(seconds);
  }, []);

  // Hardware connection actions (Web Serial API)
  const connectArduino = useCallback(async (baudRate = 9600) => {
    return await serialService.connect(baudRate);
  }, []);

  const disconnectArduino = useCallback(async () => {
    await serialService.disconnect();
  }, []);

  const simulateSerialLine = useCallback((line) => {
    serialService.simulateIncomingSerialLine(line);
  }, []);

  const clearSerialLogs = useCallback(() => {
    serialService.clearLogs();
  }, []);

  const sendSerialCommand = useCallback(async (cmd) => {
    return await serialService.sendCommand(cmd);
  }, []);

  // Alert management actions
  const dismissAlert = useCallback((id) => {
    alertService.dismissAlert(id);
  }, []);

  const resetAlerts = useCallback(() => {
    alertService.resetAll();
  }, []);

  const clearResolvedAlerts = useCallback(() => {
    alertService.clearResolved();
  }, []);

  // Notification actions
  const markNotificationAsRead = useCallback((id) => {
    notificationService.markAsRead(id);
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const clearAllNotifications = useCallback(() => {
    notificationService.clearAll();
  }, []);

  // AI Webcam Actions
  const startCamera = useCallback(async (videoElement) => {
    return await occupancyDetectionService.startCamera(videoElement);
  }, []);

  const stopCamera = useCallback(() => {
    occupancyDetectionService.stopCamera();
  }, []);

  const setConfidenceThreshold = useCallback((val) => {
    occupancyDetectionService.setConfidenceThreshold(val);
  }, []);

  const selectAiScenario = useCallback((id) => {
    occupancyDetectionService.selectSimulationScenario(id);
  }, []);

  // Smart Lighting manual override controls
  const setManualOverride = useCallback((enabled) => {
    smartLightingService.setManualOverride(enabled);
  }, []);

  const sensorData = snapshot.reading;

  // Energy waste evaluation using effective occupancy
  const energyWaste = useMemo(() => evaluateEnergyWaste(sensorData, effectiveOccupancyState), [sensorData, effectiveOccupancyState]);

  // Compute recommendations
  const recommendations = useMemo(() => generateRecommendations(sensorData, effectiveOccupancyState), [sensorData, effectiveOccupancyState]);

  // Compute sustainability metrics
  const sustainability = useMemo(() => calculateSustainabilityMetrics(sensorData), [sensorData]);

  // Automatic lighting decision logic explanation
  const lightingDecision = useMemo(() => {
    const isDaylightSufficient = sensorData.light_adc !== null && sensorData.light_adc >= SENSOR_CONFIG.ldr.daylightHarvestingThreshold;

    if (smartLighting.manualOverride) {
      return {
        recommendedState: smartLighting.desiredLightState,
        ruleNumber: 99,
        ruleText: 'Manual Override Active',
        reason: smartLighting.lastDecisionReason,
        actionMatch: sensorData.room_light === smartLighting.desiredLightState
      };
    }

    if (effectiveOccupancyState === OCCUPANCY_STATES.OCCUPIED && !isDaylightSufficient) {
      return {
        recommendedState: 1,
        ruleNumber: 1,
        ruleText: 'Rule 1: Person detected + Insufficient daylight = Light ON',
        reason: `AI detected human occupancy and ambient natural daylight (${sensorData.light_adc !== null ? `${sensorData.light_adc} ADC` : 'Dim'}) is below 500 ADC cutoff.`,
        actionMatch: sensorData.room_light === 1
      };
    } else if (effectiveOccupancyState === OCCUPANCY_STATES.OCCUPIED && isDaylightSufficient) {
      return {
        recommendedState: 0,
        ruleNumber: 2,
        ruleText: 'Rule 2: Person detected + Sufficient daylight = Light OFF',
        reason: `Person present, but adequate natural daylight (${sensorData.light_adc} ADC >= 500 ADC) satisfies illuminance. Room LED de-energized.`,
        actionMatch: sensorData.room_light === 0
      };
    } else if (effectiveOccupancyState === OCCUPANCY_STATES.UNOCCUPIED) {
      return {
        recommendedState: 0,
        ruleNumber: 3,
        ruleText: 'Rule 3: Room confirmed unoccupied = Light OFF',
        reason: `No person detected (absence grace timeout expired). Standby energy policy turns Room LED OFF.`,
        actionMatch: sensorData.room_light === 0
      };
    } else {
      return {
        recommendedState: 0,
        ruleNumber: 4,
        ruleText: 'Rule 4: Occupancy state UNKNOWN = Safe Fallback (No Auto ON)',
        reason: `Webcam stream or AI model is not actively detecting. Safe conservation default maintains light in OFF state.`,
        actionMatch: sensorData.room_light === 0
      };
    }
  }, [sensorData, effectiveOccupancyState, smartLighting]);

  const value = {
    // Mode
    mode: snapshot.mode,
    setMode,

    // Telemetry
    sensorData,
    activeScenario: snapshot.activeScenarioId,
    activeScenarioId: snapshot.activeScenarioId,
    selectScenario,
    updateSensorValue,
    toggleRoomLight,
    triggerMotionPulse,
    pulseMotion: triggerMotionPulse,
    isOccupied: isEffectivelyOccupied,
    effectiveOccupancyState,
    lastMotionTime: snapshot.lastMotionTime,
    motionCount: occupancyAnalytics.summary.todayTriggers,
    todayTriggers: occupancyAnalytics.summary.todayTriggers,
    inactivityTimeout: snapshot.inactivityTimeout,
    setInactivityTimeout,
    inactivityRemaining: isAiActive ? aiOccupancy.timeUntilUnoccupied : snapshot.inactivityRemaining,
    history: snapshot.history,

    // Hardware & Telemetry Flags
    isStale: snapshot.isStale,
    isHardwareConnected: snapshot.isHardwareConnected,
    serialState: snapshot.serialState,
    connectArduino,
    disconnectArduino,
    simulateSerialLine,
    clearSerialLogs,
    sendSerialCommand,

    // Simulation Controls
    isRunning: snapshot.isRunning,
    isSimulating: snapshot.isRunning,
    speedMultiplier: snapshot.speedMultiplier,
    setSimulationSpeed,
    startSimulation: resumeSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,

    // Clock
    currentTime,

    // Intelligence & Energy Waste Engine (Phase 4)
    energyWaste,
    alerts: alertState.activeAlerts,
    resolvedAlerts: alertState.resolvedAlerts,
    allAlerts: alertState.allAlerts,
    alertCounts: alertState.counts,
    dismissAlert,
    resolveAlert: dismissAlert,
    clearResolvedAlerts,
    resetAlerts,

    // Notification Center
    notifications: notificationState.notifications,
    unreadNotificationCount: notificationState.unreadCount,
    hasUnreadNotifications: notificationState.hasUnread,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,

    // AI Webcam Human Detection (Phase 4 AI Integration)
    aiOccupancy,
    cameraStatus: aiOccupancy.cameraStatus,
    modelStatus: aiOccupancy.modelStatus,
    occupancyStatus: effectiveOccupancyState,
    peopleCount: aiOccupancy.peopleCount,
    detections: aiOccupancy.detections,
    confidenceThreshold: aiOccupancy.confidenceThreshold,
    absenceTimeout: aiOccupancy.absenceTimeout,
    timeUntilUnoccupied: aiOccupancy.timeUntilUnoccupied,
    lastPersonTime: aiOccupancy.lastDetectionTime,
    isCameraActive: aiOccupancy.isCameraActive,
    isAiActive,
    cameraError: aiOccupancy.errorMessage,
    startCamera,
    stopCamera,
    setConfidenceThreshold,
    selectAiScenario,

    // Occupancy Events & Analytics (Phase 5)
    occupancyAnalytics,
    todaySessions: occupancyAnalytics.summary.todaySessionsCount,
    occupiedDurationMinutes: occupancyAnalytics.summary.totalOccupiedMinutes,
    occupiedDurationFormatted: occupancyAnalytics.summary.totalOccupiedFormatted,
    occupancyStartedCount: occupancyAnalytics.summary.occupancyStartedCount,
    occupancyEndedCount: occupancyAnalytics.summary.occupancyEndedCount,
    personDetectionCount: occupancyAnalytics.summary.personDetectionCount,
    cameraErrorCount: occupancyAnalytics.summary.cameraErrorCount,
    firstActivityTime: occupancyAnalytics.summary.firstActivityTime,
    latestActivityTime: occupancyAnalytics.summary.latestActivityTime,
    latestEventName: occupancyAnalytics.summary.latestEventName,
    latestEventDescription: occupancyAnalytics.summary.latestEventDescription,
    hourlyTimeline: occupancyAnalytics.timeline,
    recentOccupancyEvents: occupancyAnalytics.recentEvents,
    clearOccupancyEvents: () => occupancyEventService.clearEvents(),

    // Smart Lighting Service & Decisions
    smartLighting,
    manualOverride: smartLighting.manualOverride,
    setManualOverride,
    desiredLightState: smartLighting.desiredLightState,
    actualLightState: sensorData.room_light,
    lightingDecision,
    lightingDecisionHistory: smartLighting.decisionHistory,

    // Recommendations & Sustainability
    recommendations,
    sustainability,

    // Advanced Energy Analytics & Sustainability Reporting (Phase 6)
    energyConfigState,
    updateEnergyConfig: (cfg) => energyConfig.saveConfig(cfg),
    resetEnergyConfig: () => energyConfig.resetToDefaults(),
    lightingHistory: lightingHistoryState,
    wasteAnalytics: wasteAnalyticsState,
    energyAnalytics: energyAnalyticsState,
    exportReportCsv: (period, customRange) => sustainabilityReportService.exportCsv(period, customRange),
    exportReportPdf: (period, customRange) => sustainabilityReportService.generatePdfReport(period, customRange)
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
