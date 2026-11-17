/**
 * AI-Based Occupancy Detection Service (Phase 4)
 * Uses laptop built-in webcam with TensorFlow.js and the COCO-SSD object detection model.
 * 
 * Features:
 * - Real-time client-side person detection (100% local, zero images saved or uploaded)
 * - Filtering strictly for 'person' class with confidence >= threshold (default 0.60)
 * - 3 Distinct Occupancy States: 'OCCUPIED', 'UNOCCUPIED', 'UNKNOWN'
 * - Configurable absence timeout (default 45s grace period before declaring vacant)
 * - Robust error handling (camera permission denied, hardware busy, model failure)
 * - Simulated AI camera scenarios for Demo Mode
 */

import { serialService } from './serialService.js';
import { occupancyEventService } from './occupancyEventService.js';

export const OCCUPANCY_STATES = {
  OCCUPIED: 'OCCUPIED',
  UNOCCUPIED: 'UNOCCUPIED',
  UNKNOWN: 'UNKNOWN'
};

export const CAMERA_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  ACTIVE: 'ACTIVE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ERROR: 'ERROR'
};

export const MODEL_STATUS = {
  NOT_LOADED: 'NOT_LOADED',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR'
};

export const SIMULATION_SCENARIOS = {
  PERSON_DARK: {
    id: 'PERSON_DARK',
    title: 'Person in Dim/Dark Space (Task Lighting Required)',
    description: '1 person detected (94% confidence) with low ambient daylight (180 ADC).',
    peopleCount: 1,
    confidence: 0.94,
    occupancyStatus: OCCUPANCY_STATES.OCCUPIED,
    detections: [{ bbox: [80, 40, 240, 360], score: 0.94, class: 'person' }]
  },
  PERSON_BRIGHT: {
    id: 'PERSON_BRIGHT',
    title: 'Person in Abundant Daylight (Harvesting Active)',
    description: '1 person detected (91% confidence) with high natural daylight (780 ADC).',
    peopleCount: 1,
    confidence: 0.91,
    occupancyStatus: OCCUPANCY_STATES.OCCUPIED,
    detections: [{ bbox: [90, 50, 230, 350], score: 0.91, class: 'person' }]
  },
  EMPTY_ROOM: {
    id: 'EMPTY_ROOM',
    title: 'Confirmed Unoccupied Room (No Person for >30s)',
    description: 'No persons visible. 30s inactivity timer expired, declaring space unoccupied.',
    peopleCount: 0,
    confidence: 0,
    occupancyStatus: OCCUPANCY_STATES.UNOCCUPIED,
    detections: []
  },
  PERSON_LEFT: {
    id: 'PERSON_LEFT',
    title: 'Person Recently Left (Absence Grace Countdown)',
    description: 'Person just vacated. 30s countdown active before shutting off luminaires.',
    peopleCount: 0,
    confidence: 0,
    occupancyStatus: OCCUPANCY_STATES.OCCUPIED, // Still OCCUPIED during countdown!
    detections: []
  },
  MULTIPLE_PEOPLE: {
    id: 'MULTIPLE_PEOPLE',
    title: 'Multiple Occupants Detected (Conference / Team)',
    description: '2 persons detected (89% & 93% confidence). Occupancy confirmed.',
    peopleCount: 2,
    confidence: 0.91,
    occupancyStatus: OCCUPANCY_STATES.OCCUPIED,
    detections: [
      { bbox: [40, 60, 180, 340], score: 0.89, class: 'person' },
      { bbox: [240, 50, 200, 350], score: 0.93, class: 'person' }
    ]
  },
  CAMERA_UNAVAILABLE: {
    id: 'CAMERA_UNAVAILABLE',
    title: 'Camera Device Unavailable / Blocked',
    description: 'Webcam stream disconnected. System transitions to safe UNKNOWN state.',
    peopleCount: 0,
    confidence: 0,
    occupancyStatus: OCCUPANCY_STATES.UNKNOWN,
    detections: []
  },
  AI_FAILURE: {
    id: 'AI_FAILURE',
    title: 'AI Model Inference Failure / Error',
    description: 'Computer vision engine faulted. System transitions to safe UNKNOWN state.',
    peopleCount: 0,
    confidence: 0,
    occupancyStatus: OCCUPANCY_STATES.UNKNOWN,
    detections: []
  }
};

export class OccupancyDetectionService {
  constructor() {
    this.cameraStatus = CAMERA_STATUS.DISCONNECTED;
    this.modelStatus = MODEL_STATUS.NOT_LOADED;
    this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;

    // Detection telemetry
    this.peopleCount = 0;
    this.detections = [];
    this.confidenceThreshold = 0.60; // 60% confidence filter
    this.absenceTimeout = 30; // Exactly 30 seconds (30,000 ms) grace period
    this.lastDetectionTime = null;
    this.absenceStartTime = null; // Monotonic timestamp when person was last seen
    this.timeUntilUnoccupied = 0;
    this.lastInferenceTime = null;
    this.errorMessage = null;

    // Generation counter to invalidate stale asynchronous timers and callbacks
    this.generation = 0;

    // Simulation / Demo state
    this.isSimulated = false;
    this.activeScenario = 'PERSON_BRIGHT';

    // Internal loop references
    this.mediaStream = null;
    this.model = null;
    this.inferenceIntervalId = null;
    this.countdownIntervalId = null;
    this.videoElement = null;
    this.isDetecting = false;
    this.isLoopRunning = false;

    // Frame sequence tracking to reject out-of-order async predictions
    this.currentFrameSeq = 0;
    this.latestCompletedFrameSeq = 0;

    // Observers & callbacks
    this.listeners = new Set();
    this.onPersonDetectedCallbacks = new Set();

    // Start background countdown ticker
    this.startCountdownTicker();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('OccupancyDetectionService listener error:', err);
      }
    });
  }

  getState() {
    return {
      cameraStatus: this.cameraStatus,
      modelStatus: this.modelStatus,
      occupancyStatus: this.occupancyStatus,
      peopleCount: this.peopleCount,
      detections: [...this.detections],
      confidenceThreshold: this.confidenceThreshold,
      absenceTimeout: this.absenceTimeout,
      lastDetectionTime: this.lastDetectionTime,
      timeUntilUnoccupied: this.timeUntilUnoccupied,
      lastInferenceTime: this.lastInferenceTime,
      errorMessage: this.errorMessage,
      isSimulated: this.isSimulated,
      activeScenario: this.activeScenario,
      isCameraActive: this.cameraStatus === CAMERA_STATUS.ACTIVE,
      isOccupied: this.occupancyStatus === OCCUPANCY_STATES.OCCUPIED,
      isUnoccupied: this.occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED,
      isUnknown: this.occupancyStatus === OCCUPANCY_STATES.UNKNOWN
    };
  }

  setConfidenceThreshold(val) {
    const num = Number(val);
    if (!isNaN(num) && num >= 0.1 && num <= 0.99) {
      this.confidenceThreshold = Number(num.toFixed(2));
      this.notify();
    }
  }

  setAbsenceTimeout(seconds) {
    const num = Number(seconds);
    if (!isNaN(num) && num >= 5 && num <= 300) {
      this.absenceTimeout = Math.round(num);
      this.notify();
    }
  }

  // --- MODEL INITIALIZATION ---
  async loadModel() {
    if (this.model) {
      this.modelStatus = MODEL_STATUS.READY;
      return this.model;
    }

    if (typeof window === 'undefined') {
      // In Node environment / unit tests
      this.modelStatus = MODEL_STATUS.READY;
      return null;
    }

    this.modelStatus = MODEL_STATUS.LOADING;
    this.errorMessage = null;
    this.notify();

    try {
      // Wait for COCO-SSD script to be ready on window
      let attempts = 0;
      while (!window.cocoSsd && attempts < 20) {
        await new Promise((res) => setTimeout(res, 200));
        attempts++;
      }

      if (!window.cocoSsd) {
        throw new Error('COCO-SSD library not loaded. Please verify internet access or CDN availability.');
      }

      // Load lightweight MobileNetV2 base for responsive in-browser performance
      this.model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.modelStatus = MODEL_STATUS.READY;
      this.notify();
      return this.model;
    } catch (err) {
      console.error('Failed to load COCO-SSD model:', err);
      this.modelStatus = MODEL_STATUS.ERROR;
      this.errorMessage = `AI Model failed to load: ${err.message}`;
      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      this.notify();
      throw err;
    }
  }

  // --- WEBCAM STREAM CONTROLS ---
  async startCamera(videoElement = null) {
    this.isSimulated = false;
    occupancyEventService.setMode('hardware');
    this.errorMessage = null;
    this.cameraStatus = CAMERA_STATUS.CONNECTING;
    this.notify();

    if (videoElement) {
      this.videoElement = videoElement;
    }

    // Check MediaDevices support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraStatus = CAMERA_STATUS.ERROR;
      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      this.errorMessage = 'Webcam MediaDevices API is not supported in this browser.';
      this.notify();
      return { success: false, error: this.errorMessage };
    }

    try {
      // 1. Request camera stream (strictly local, facing user)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { max: 30 }
        },
        audio: false
      });

      this.mediaStream = stream;
      this.cameraStatus = CAMERA_STATUS.ACTIVE;

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await this.videoElement.play().catch(() => {});
      }

      // 2. Load model if not already loaded
      await this.loadModel();

      // 3. Start controlled inference loop (every 250ms throttled)
      this.startDetectionLoop();

      this.notify();
      return { success: true };
    } catch (err) {
      console.error('Webcam initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.cameraStatus = CAMERA_STATUS.PERMISSION_DENIED;
        this.errorMessage = 'Webcam permission was denied. Please allow camera access in browser permissions.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.cameraStatus = CAMERA_STATUS.ERROR;
        this.errorMessage = 'No webcam hardware device found on this laptop/computer.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.cameraStatus = CAMERA_STATUS.ERROR;
        this.errorMessage = 'Webcam is currently occupied by another application.';
      } else {
        this.cameraStatus = CAMERA_STATUS.ERROR;
        this.errorMessage = err.message || 'Failed to initialize webcam.';
      }

      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      this.notify();
      return { success: false, error: this.errorMessage };
    }
  }

  onPersonDetected(callback) {
    this.onPersonDetectedCallbacks.add(callback);
    return () => this.onPersonDetectedCallbacks.delete(callback);
  }

  notifyPersonDetected(count) {
    this.onPersonDetectedCallbacks.forEach((cb) => {
      try {
        cb(count);
      } catch (e) {
        console.error('onPersonDetected callback error:', e);
      }
    });
  }

  stopCamera() {
    // 1. Stop video stream tracks
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping media tracks:', e);
      }
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    // 2. Stop detection loop
    this.stopDetectionLoop();

    this.isDetecting = false;
    this.absenceStartTime = null;
    this.cameraStatus = CAMERA_STATUS.DISCONNECTED;
    this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
    this.peopleCount = 0;
    this.detections = [];
    serialService.appendLog('[AI CAMERA] Webcam stopped. Occupancy transitioned to UNKNOWN.');
    occupancyEventService.handleOccupancyStateUpdate({
      status: OCCUPANCY_STATES.UNKNOWN,
      peopleCount: 0,
      isAbsenceCountdown: false
    });
    this.notify();
  }

  // --- CONTROLLED DETECTION LOOP (NO OVERLAPPING ASYNC INFERENCES) ---
  startDetectionLoop() {
    this.stopDetectionLoop();
    this.isLoopRunning = true;

    const loop = async () => {
      if (!this.isLoopRunning || this.cameraStatus !== CAMERA_STATUS.ACTIVE) {
        return;
      }

      await this.runDetectionFrame();

      if (this.isLoopRunning && this.cameraStatus === CAMERA_STATUS.ACTIVE) {
        this.detectionTimeoutId = setTimeout(loop, 200);
      }
    };

    loop();
  }

  stopDetectionLoop() {
    this.isLoopRunning = false;
    if (this.detectionTimeoutId) {
      clearTimeout(this.detectionTimeoutId);
      this.detectionTimeoutId = null;
    }
    if (this.inferenceIntervalId) {
      clearInterval(this.inferenceIntervalId);
      this.inferenceIntervalId = null;
    }
    this.isDetecting = false;
  }

  async runDetectionFrame() {
    if (this.isDetecting || !this.videoElement || this.cameraStatus !== CAMERA_STATUS.ACTIVE || !this.model) {
      return;
    }

    if (this.videoElement.readyState < 2) {
      // Video not ready yet
      return;
    }

    this.isDetecting = true;
    const currentFrameSeq = ++this.currentFrameSeq;

    try {
      const predictions = await this.model.detect(this.videoElement);
      const now = Date.now();

      // Ensure camera hasn't stopped or frame arrived out of order
      if (!this.isLoopRunning || this.cameraStatus !== CAMERA_STATUS.ACTIVE) {
        return;
      }
      if (currentFrameSeq < this.latestCompletedFrameSeq) {
        return; // Stale asynchronous prediction, ignore
      }
      this.latestCompletedFrameSeq = currentFrameSeq;

      // Filter STRICTLY for 'person' with confidence >= threshold
      const qualifyingPeople = predictions.filter(
        (pred) => pred.class === 'person' && pred.score >= this.confidenceThreshold
      );

      this.processDetections(qualifyingPeople, now);
    } catch (err) {
      console.warn('Inference error:', err);
      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      this.errorMessage = `Inference failed: ${err.message}`;
      serialService.appendLog(`[AI CAMERA ERROR] ${err.message}`);
      this.notify();
    } finally {
      this.isDetecting = false;
    }
  }

  // --- CORE OCCUPANCY STATE MACHINE ---
  processDetections(qualifyingPeople, now = Date.now()) {
    const count = qualifyingPeople.length;
    this.peopleCount = count;
    this.detections = qualifyingPeople.map((p) => ({
      bbox: p.bbox,
      score: Number(p.score.toFixed(2)),
      class: 'person'
    }));
    this.lastInferenceTime = new Date(now);

    if (count > 0) {
      // At least one qualifying person detected
      const wasCountingDown = this.absenceStartTime !== null;
      const wasNotOccupied = this.occupancyStatus !== OCCUPANCY_STATES.OCCUPIED;

      // Reset and cancel any pending absence timer immediately
      this.absenceStartTime = null;
      this.lastDetectionTime = new Date(now);
      this.generation++;
      this.timeUntilUnoccupied = this.absenceTimeout;

      if (wasCountingDown) {
        serialService.appendLog(`[AI CAMERA] Person detected again; countdown cancelled. (Gen #${this.generation})`);
      }

      if (wasNotOccupied) {
        this.occupancyStatus = OCCUPANCY_STATES.OCCUPIED;
        serialService.appendLog(`[AI CAMERA] Person detected (${count} found). Occupancy changed to OCCUPIED.`);
      }

      // Notify listeners and subscribers
      this.notifyPersonDetected(count);
    } else {
      // Zero qualifying persons visible in frame
      if (this.occupancyStatus === OCCUPANCY_STATES.OCCUPIED) {
        if (this.absenceStartTime === null) {
          // Start 30-second absence countdown ONLY ONCE
          this.absenceStartTime = now;
          this.timeUntilUnoccupied = this.absenceTimeout;
          serialService.appendLog(`[AI CAMERA] Absence countdown started (${this.absenceTimeout}s grace period).`);
        }

        const elapsedMs = now - this.absenceStartTime;
        const remainingSec = Math.max(0, Math.ceil((this.absenceTimeout * 1000 - elapsedMs) / 1000));
        this.timeUntilUnoccupied = remainingSec;

        if (elapsedMs >= this.absenceTimeout * 1000) {
          this.occupancyStatus = OCCUPANCY_STATES.UNOCCUPIED;
          this.timeUntilUnoccupied = 0;
          this.absenceStartTime = null;
          serialService.appendLog(`[AI CAMERA] Absence grace timeout (${this.absenceTimeout}s) expired. Occupancy changed to UNOCCUPIED.`);
        }
      } else if (this.occupancyStatus === OCCUPANCY_STATES.UNOCCUPIED) {
        this.timeUntilUnoccupied = 0;
        this.absenceStartTime = null;
      }
    }

    // Forward state update to centralized occupancy event service
    occupancyEventService.handleOccupancyStateUpdate({
      status: this.occupancyStatus,
      peopleCount: this.peopleCount,
      isAbsenceCountdown: this.absenceStartTime !== null,
      customNow: now
    });

    this.notify();
  }

  // --- BACKGROUND COUNTDOWN TICKER ---
  startCountdownTicker() {
    if (this.countdownIntervalId) return;

    this.countdownIntervalId = setInterval(() => {
      this.tickCountdown();
    }, 500);
  }

  tickCountdown(now = Date.now()) {
    // Only tick countdown when in grace period (absenceStartTime !== null)
    if (this.occupancyStatus === OCCUPANCY_STATES.OCCUPIED && this.absenceStartTime !== null) {
      const elapsedMs = now - this.absenceStartTime;
      const remainingSec = Math.max(0, Math.ceil((this.absenceTimeout * 1000 - elapsedMs) / 1000));

      if (elapsedMs >= this.absenceTimeout * 1000) {
        this.occupancyStatus = OCCUPANCY_STATES.UNOCCUPIED;
        this.timeUntilUnoccupied = 0;
        this.absenceStartTime = null;
        serialService.appendLog(`[AI CAMERA] Absence grace timeout (${this.absenceTimeout}s) expired. Occupancy changed to UNOCCUPIED.`);
        occupancyEventService.handleOccupancyStateUpdate({
          status: OCCUPANCY_STATES.UNOCCUPIED,
          peopleCount: 0,
          isAbsenceCountdown: false,
          customNow: now
        });
        this.notify();
      } else if (this.timeUntilUnoccupied !== remainingSec) {
        this.timeUntilUnoccupied = remainingSec;
        if (remainingSec === 20 || remainingSec === 15 || remainingSec === 10 || remainingSec === 5 || remainingSec === 1) {
          serialService.appendLog(`[AI CAMERA] Remaining absence time: ${remainingSec}s / ${this.absenceTimeout}s`);
        }
        this.notify();
      }
    }
  }

  // --- DEMO MODE SIMULATION SCENARIOS ---
  selectSimulationScenario(scenarioKey) {
    const sc = SIMULATION_SCENARIOS[scenarioKey] || SIMULATION_SCENARIOS.PERSON_BRIGHT;
    this.isSimulated = true;
    occupancyEventService.setMode('demo');
    this.activeScenario = scenarioKey;
    this.peopleCount = sc.peopleCount;
    this.detections = sc.detections;
    this.occupancyStatus = sc.occupancyStatus;
    this.lastInferenceTime = new Date();
    this.generation++;

    if (sc.id === 'PERSON_LEFT') {
      // Simulate recent departure: 10 seconds elapsed, 20 seconds remaining (within 30s grace)
      this.absenceStartTime = Date.now() - 10 * 1000;
      this.lastDetectionTime = new Date(this.absenceStartTime);
      this.timeUntilUnoccupied = 20;
      this.cameraStatus = CAMERA_STATUS.ACTIVE;
      this.modelStatus = MODEL_STATUS.READY;
      serialService.appendLog('[AI CAMERA DEMO] Scenario "Person Recently Left" selected (20s grace remaining).');
      occupancyEventService.handleOccupancyStateUpdate({
        status: OCCUPANCY_STATES.OCCUPIED,
        peopleCount: 0,
        isAbsenceCountdown: true
      });
    } else if (sc.id === 'CAMERA_UNAVAILABLE') {
      this.absenceStartTime = null;
      this.cameraStatus = CAMERA_STATUS.ERROR;
      this.modelStatus = MODEL_STATUS.NOT_LOADED;
      this.errorMessage = 'Simulated camera hardware error: device unavailable.';
      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      serialService.appendLog('[AI CAMERA DEMO] Scenario "Camera Device Unavailable" selected.');
      occupancyEventService.handleOccupancyStateUpdate({
        status: OCCUPANCY_STATES.UNKNOWN,
        peopleCount: 0,
        isAbsenceCountdown: false,
        error: this.errorMessage
      });
    } else if (sc.id === 'AI_FAILURE') {
      this.absenceStartTime = null;
      this.cameraStatus = CAMERA_STATUS.ACTIVE;
      this.modelStatus = MODEL_STATUS.ERROR;
      this.errorMessage = 'Simulated AI engine error: model execution timeout.';
      this.occupancyStatus = OCCUPANCY_STATES.UNKNOWN;
      serialService.appendLog('[AI CAMERA DEMO] Scenario "AI Model Failure" selected.');
      occupancyEventService.handleOccupancyStateUpdate({
        status: OCCUPANCY_STATES.UNKNOWN,
        peopleCount: 0,
        isAbsenceCountdown: false,
        error: this.errorMessage
      });
    } else if (sc.peopleCount > 0) {
      this.absenceStartTime = null;
      this.cameraStatus = CAMERA_STATUS.ACTIVE;
      this.modelStatus = MODEL_STATUS.READY;
      this.lastDetectionTime = new Date();
      this.timeUntilUnoccupied = this.absenceTimeout;
      serialService.appendLog(`[AI CAMERA DEMO] Scenario "${sc.title}" selected (OCCUPIED).`);
      this.notifyPersonDetected(sc.peopleCount);
      occupancyEventService.handleOccupancyStateUpdate({
        status: OCCUPANCY_STATES.OCCUPIED,
        peopleCount: sc.peopleCount,
        isAbsenceCountdown: false
      });
    } else {
      // EMPTY_ROOM
      this.absenceStartTime = null;
      this.cameraStatus = CAMERA_STATUS.ACTIVE;
      this.modelStatus = MODEL_STATUS.READY;
      this.lastDetectionTime = new Date(Date.now() - (this.absenceTimeout + 10) * 1000);
      this.timeUntilUnoccupied = 0;
      serialService.appendLog('[AI CAMERA DEMO] Scenario "Confirmed Unoccupied Room" selected (UNOCCUPIED).');
      occupancyEventService.handleOccupancyStateUpdate({
        status: OCCUPANCY_STATES.UNOCCUPIED,
        peopleCount: 0,
        isAbsenceCountdown: false
      });
    }

    this.notify();
  }
}

export const occupancyDetectionService = new OccupancyDetectionService();
