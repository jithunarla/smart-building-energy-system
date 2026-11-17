import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sensorDataService } from '../services/sensorDataService';
import { serialService } from '../services/serialService';

export const SensorContext = createContext(null);

export const SensorProvider = ({ children }) => {
  const [snapshot, setSnapshot] = useState(() => sensorDataService.getSnapshot());

  // Subscribe to central data service
  useEffect(() => {
    const unsubscribe = sensorDataService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setMode = useCallback((mode) => {
    sensorDataService.setMode(mode);
  }, []);

  const selectScenario = useCallback((scenarioId) => {
    sensorDataService.applyScenario(scenarioId);
  }, []);

  const updateSensorValue = useCallback((key, value) => {
    sensorDataService.updateSensor(key, value);
  }, []);

  const pulseMotion = useCallback(() => {
    sensorDataService.pulseMotion();
  }, []);

  const toggleRoomLight = useCallback(() => {
    sensorDataService.toggleRoomLight();
  }, []);

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
  }, []);

  const connectArduino = useCallback(async (baudRate) => {
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

  const value = {
    sensorData: snapshot.reading,
    mode: snapshot.mode,
    setMode,
    isOccupied: snapshot.isOccupied,
    lastMotionTime: snapshot.lastMotionTime,
    motionCount: snapshot.motionCount,
    inactivityTimeout: snapshot.inactivityTimeout,
    setInactivityTimeout,
    inactivityRemaining: snapshot.inactivityRemaining,
    isRunning: snapshot.isRunning,
    isStale: snapshot.isStale,
    isHardwareConnected: snapshot.isHardwareConnected,
    speedMultiplier: snapshot.speedMultiplier,
    setSimulationSpeed,
    activeScenarioId: snapshot.activeScenarioId,
    selectScenario,
    startSimulation: resumeSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    updateSensorValue,
    pulseMotion,
    toggleRoomLight,
    history: snapshot.history,
    serialState: snapshot.serialState,
    connectArduino,
    disconnectArduino,
    simulateSerialLine,
    clearSerialLogs
  };

  return (
    <SensorContext.Provider value={value}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};
