/**
 * Centralized Occupancy Event & Analytics Service (Phase 5)
 * Manages:
 * 1. Discrete occupancy state transition events (OCCUPANCY_STARTED, ROOM_BECAME_EMPTY, etc.)
 * 2. Session tracking (start, end, duration, peak people)
 * 3. Local persistent storage with strict separation between HARDWARE and DEMO modes
 * 4. User local calendar day calculations (Today's Triggers, Total Occupied Duration, First/Last Activity)
 * 5. 24-Hour Hourly Occupancy Activity Timeline (12 AM - 11 PM) with multi-hour & midnight session splitting
 */

import { serialService } from './serialService.js';

export const OCCUPANCY_EVENT_TYPES = {
  PERSON_DETECTED: 'PERSON_DETECTED',
  OCCUPANCY_STARTED: 'OCCUPANCY_STARTED',
  ADDITIONAL_PERSON_DETECTED: 'ADDITIONAL_PERSON_DETECTED',
  PERSON_COUNT_DECREASED: 'PERSON_COUNT_DECREASED',
  ABSENCE_COUNTDOWN_STARTED: 'ABSENCE_COUNTDOWN_STARTED',
  OCCUPANCY_RESUMED: 'OCCUPANCY_RESUMED',
  ROOM_BECAME_EMPTY: 'ROOM_BECAME_EMPTY',
  CAMERA_DISCONNECTED: 'CAMERA_DISCONNECTED',
  CAMERA_RECONNECTED: 'CAMERA_RECONNECTED',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR'
};

const STORAGE_KEYS = {
  EVENTS_HARDWARE: 'eco_bms_occupancy_events_hw_v1',
  EVENTS_DEMO: 'eco_bms_occupancy_events_demo_v1',
  SESSIONS_HARDWARE: 'eco_bms_occupancy_sessions_hw_v1',
  SESSIONS_DEMO: 'eco_bms_occupancy_sessions_demo_v1'
};

const MAX_STORED_EVENTS = 300;
const MAX_STORED_SESSIONS = 150;

export class OccupancyEventService {
  constructor() {
    this.mode = 'demo'; // 'demo' | 'hardware'
    this.currentOccupancyStatus = 'UNKNOWN'; // 'OCCUPIED' | 'UNOCCUPIED' | 'UNKNOWN'
    this.currentPeopleCount = 0;
    this.currentSession = null;
    this.absenceCountdownActive = false;
    this.cameraDisconnectedRecorded = false;

    // In-memory cache for fast retrieval & subscriptions
    this.eventsHardware = this.loadStored(STORAGE_KEYS.EVENTS_HARDWARE, []);
    this.eventsDemo = this.loadStored(STORAGE_KEYS.EVENTS_DEMO, []);
    this.sessionsHardware = this.loadStored(STORAGE_KEYS.SESSIONS_HARDWARE, []);
    this.sessionsDemo = this.loadStored(STORAGE_KEYS.SESSIONS_DEMO, []);

    // If demo events are empty, populate clean initial demo seed data
    if (this.eventsDemo.length === 0) {
      this.seedDemoData();
    }

    // Observers
    this.listeners = new Set();
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
        console.error('OccupancyEventService listener error:', err);
      }
    });
  }

  setMode(mode) {
    const normalized = (mode || 'demo').toLowerCase() === 'hardware' ? 'hardware' : 'demo';
    if (this.mode !== normalized) {
      this.mode = normalized;
      this.currentSession = null;
      this.notify();
    }
  }

  // --- LOCAL PERSISTENCE HELPERS ---
  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__bms_occ_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  loadStored(key, fallback = []) {
    if (!this.isStorageAvailable()) return fallback;
    try {
      const data = window.localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
      console.warn(`OccupancyEventService: Failed to parse ${key}:`, err);
      return fallback;
    }
  }

  persist(key, data) {
    if (!this.isStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`OccupancyEventService: Storage write error for ${key}:`, err);
    }
  }

  getEventsList() {
    return this.mode === 'hardware' ? this.eventsHardware : this.eventsDemo;
  }

  getSessionsList() {
    return this.mode === 'hardware' ? this.sessionsHardware : this.sessionsDemo;
  }

  saveEventsList(list) {
    if (this.mode === 'hardware') {
      this.eventsHardware = list.slice(-MAX_STORED_EVENTS);
      this.persist(STORAGE_KEYS.EVENTS_HARDWARE, this.eventsHardware);
    } else {
      this.eventsDemo = list.slice(-MAX_STORED_EVENTS);
      this.persist(STORAGE_KEYS.EVENTS_DEMO, this.eventsDemo);
    }
  }

  saveSessionsList(list) {
    if (this.mode === 'hardware') {
      this.sessionsHardware = list.slice(-MAX_STORED_SESSIONS);
      this.persist(STORAGE_KEYS.SESSIONS_HARDWARE, this.sessionsHardware);
    } else {
      this.sessionsDemo = list.slice(-MAX_STORED_SESSIONS);
      this.persist(STORAGE_KEYS.SESSIONS_DEMO, this.sessionsDemo);
    }
  }

  // --- MEANINGFUL EVENT RECORDING ---
  recordEvent(eventType, details = {}, customTimestamp = null) {
    const timestamp = customTimestamp ? new Date(customTimestamp).toISOString() : new Date().toISOString();
    const modeTag = this.mode.toUpperCase();

    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      eventType,
      occupancyStatus: details.occupancyStatus || this.currentOccupancyStatus,
      peopleCount: details.peopleCount !== undefined ? details.peopleCount : this.currentPeopleCount,
      source: 'AI_CAMERA',
      mode: modeTag,
      description: details.description || this.getEventDescription(eventType, details)
    };

    const currentList = this.getEventsList();
    const updated = [event, ...currentList].slice(0, MAX_STORED_EVENTS);
    this.saveEventsList(updated);

    // Terminal diagnostic log
    serialService.appendLog(`[OCCUPANCY EVENT] ${event.eventType} (${event.mode}) - ${event.description}`);

    this.notify();
    return event;
  }

  getEventDescription(type, details) {
    switch (type) {
      case OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED:
        return `Occupancy session initiated (${details.peopleCount || 1} person detected).`;
      case OCCUPANCY_EVENT_TYPES.PERSON_DETECTED:
        return `Human presence verified (${details.peopleCount || 1} person detected).`;
      case OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED:
        return `People count increased to ${details.peopleCount}.`;
      case OCCUPANCY_EVENT_TYPES.PERSON_COUNT_DECREASED:
        return `People count decreased to ${details.peopleCount}.`;
      case OCCUPANCY_EVENT_TYPES.ABSENCE_COUNTDOWN_STARTED:
        return `No occupants in frame. 30s absence grace period activated.`;
      case OCCUPANCY_EVENT_TYPES.OCCUPANCY_RESUMED:
        return `Occupant returned during grace period. Countdown cancelled.`;
      case OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY:
        return `30s absence timeout expired. Room confirmed vacant.`;
      case OCCUPANCY_EVENT_TYPES.CAMERA_DISCONNECTED:
        return `Webcam disconnected or stream stopped. State set to UNKNOWN.`;
      case OCCUPANCY_EVENT_TYPES.CAMERA_RECONNECTED:
        return `Webcam stream restored. Re-initiating person detection.`;
      case OCCUPANCY_EVENT_TYPES.AI_MODEL_ERROR:
        return `Computer vision inference fault: ${details.error || 'Model error'}`;
      default:
        return `Occupancy transition: ${type}`;
    }
  }

  // --- STATE TRANSITION HANDLER (CALLED BY OCCUPANCY DETECTION SERVICE) ---
  handleOccupancyStateUpdate({ status, peopleCount, isAbsenceCountdown, error, customNow = null }) {
    const now = customNow ? new Date(customNow) : new Date();
    const nowIso = now.toISOString();
    const prevStatus = this.currentOccupancyStatus;
    const prevCount = this.currentPeopleCount;
    const prevCountdown = this.absenceCountdownActive;

    this.currentOccupancyStatus = status;
    this.currentPeopleCount = peopleCount;
    this.absenceCountdownActive = Boolean(isAbsenceCountdown);

    // 1. Camera Error or Disconnection
    if (error) {
      this.recordEvent(OCCUPANCY_EVENT_TYPES.AI_MODEL_ERROR, { error, occupancyStatus: 'UNKNOWN' }, now);
      return;
    }

    if (status === 'UNKNOWN' && prevStatus !== 'UNKNOWN') {
      this.cameraDisconnectedRecorded = true;
      this.recordEvent(OCCUPANCY_EVENT_TYPES.CAMERA_DISCONNECTED, { occupancyStatus: 'UNKNOWN', peopleCount: 0 }, now);
      return;
    }

    if (this.cameraDisconnectedRecorded && status !== 'UNKNOWN') {
      this.cameraDisconnectedRecorded = false;
      this.recordEvent(OCCUPANCY_EVENT_TYPES.CAMERA_RECONNECTED, { occupancyStatus: status, peopleCount }, now);
    }

    // 2. Transition from UNOCCUPIED / UNKNOWN -> OCCUPIED (Session Start)
    if (status === 'OCCUPIED' && prevStatus !== 'OCCUPIED') {
      // Start new occupancy session
      this.currentSession = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        startTime: nowIso,
        endTime: null,
        durationSeconds: 0,
        maxPeople: Math.max(1, peopleCount),
        mode: this.mode.toUpperCase()
      };

      const sessions = [this.currentSession, ...this.getSessionsList()].slice(0, MAX_STORED_SESSIONS);
      this.saveSessionsList(sessions);

      this.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED, {
        occupancyStatus: 'OCCUPIED',
        peopleCount: Math.max(1, peopleCount)
      }, now);
      return;
    }

    // 3. Resumed during countdown
    if (status === 'OCCUPIED' && prevCountdown && !isAbsenceCountdown && peopleCount > 0) {
      if (this.currentSession) {
        this.currentSession.maxPeople = Math.max(this.currentSession.maxPeople || 1, peopleCount);
      }
      this.recordEvent(OCCUPANCY_EVENT_TYPES.OCCUPANCY_RESUMED, {
        occupancyStatus: 'OCCUPIED',
        peopleCount
      }, now);
      return;
    }

    // 4. Absence Countdown Initiated
    if (status === 'OCCUPIED' && !prevCountdown && isAbsenceCountdown && peopleCount === 0) {
      this.recordEvent(OCCUPANCY_EVENT_TYPES.ABSENCE_COUNTDOWN_STARTED, {
        occupancyStatus: 'OCCUPIED',
        peopleCount: 0
      }, now);
      return;
    }

    // 5. Transition to UNOCCUPIED (Session Closed)
    if (status === 'UNOCCUPIED' && prevStatus === 'OCCUPIED') {
      // Close active session
      if (this.currentSession) {
        this.currentSession.endTime = nowIso;
        const dur = Math.max(1, Math.round((now.getTime() - new Date(this.currentSession.startTime).getTime()) / 1000));
        this.currentSession.durationSeconds = dur;
        this.saveSessionsList(this.getSessionsList());
        this.currentSession = null;
      }

      this.recordEvent(OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY, {
        occupancyStatus: 'UNOCCUPIED',
        peopleCount: 0
      }, now);
      return;
    }

    // 6. People Count Variations while Occupied
    if (status === 'OCCUPIED' && !isAbsenceCountdown && peopleCount > 0 && prevCount > 0) {
      if (peopleCount > prevCount) {
        if (this.currentSession) {
          this.currentSession.maxPeople = Math.max(this.currentSession.maxPeople || 1, peopleCount);
        }
        this.recordEvent(OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED, {
          occupancyStatus: 'OCCUPIED',
          peopleCount
        }, now);
      } else if (peopleCount < prevCount) {
        this.recordEvent(OCCUPANCY_EVENT_TYPES.PERSON_COUNT_DECREASED, {
          occupancyStatus: 'OCCUPIED',
          peopleCount
        }, now);
      }
    }
  }

  // --- LOCAL CALENDAR DAY FILTERING ---
  isSameLocalDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  getTodayBounds(refDate = new Date()) {
    const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
    const end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  getTodayEvents(refDate = new Date()) {
    const all = this.getEventsList();
    return all.filter((e) => this.isSameLocalDay(new Date(e.timestamp), refDate));
  }

  getTodaySessions(refDate = new Date()) {
    const all = this.getSessionsList();
    const { start, end } = this.getTodayBounds(refDate);

    return all.filter((s) => {
      const sStart = new Date(s.startTime);
      const sEnd = s.endTime ? new Date(s.endTime) : new Date();
      // Overlaps with today's 00:00 - 23:59:59
      return sStart <= end && sEnd >= start;
    });
  }

  // --- TODAY'S ACTIVITY SUMMARY METRICS ---
  getTodaySummary(refDate = new Date()) {
    const events = this.getTodayEvents(refDate);
    const sessions = this.getTodaySessions(refDate);
    const { start: dayStart, end: dayEnd } = this.getTodayBounds(refDate);
    const now = new Date();

    let totalOccupiedSeconds = 0;

    sessions.forEach((sess) => {
      const sStart = new Date(sess.startTime);
      const sEnd = sess.endTime ? new Date(sess.endTime) : (this.currentOccupancyStatus === 'OCCUPIED' ? now : sStart);

      // Clamp to today's boundary
      const clampedStart = Math.max(sStart.getTime(), dayStart.getTime());
      const effectiveEnd = sess.endTime ? sEnd.getTime() : Math.min(sEnd.getTime(), now.getTime());
      const clampedEnd = Math.min(effectiveEnd, dayEnd.getTime());

      if (clampedEnd > clampedStart) {
        totalOccupiedSeconds += (clampedEnd - clampedStart) / 1000;
      }
    });

    const occupiedMinutes = Math.round(totalOccupiedSeconds / 60);
    const hours = Math.floor(occupiedMinutes / 60);
    const mins = occupiedMinutes % 60;
    const occupiedFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    // Counts by event type
    let occupancyStartedCount = 0;
    let occupancyEndedCount = 0;
    let personDetectionCount = 0;
    let cameraErrorCount = 0;

    events.forEach((ev) => {
      if (ev.eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED) occupancyStartedCount++;
      if (ev.eventType === OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY) occupancyEndedCount++;
      if (
        ev.eventType === OCCUPANCY_EVENT_TYPES.PERSON_DETECTED ||
        ev.eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED ||
        ev.eventType === OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED
      ) {
        personDetectionCount++;
      }
      if (ev.eventType === OCCUPANCY_EVENT_TYPES.AI_MODEL_ERROR || ev.eventType === OCCUPANCY_EVENT_TYPES.CAMERA_DISCONNECTED) {
        cameraErrorCount++;
      }
    });

    const firstEvent = events[events.length - 1]; // oldest today
    const latestEvent = events[0]; // newest today

    return {
      todayTriggers: events.length,
      occupancyStartedCount,
      occupancyEndedCount,
      personDetectionCount,
      cameraErrorCount,
      todaySessionsCount: sessions.length,
      totalOccupiedSeconds: Math.round(totalOccupiedSeconds),
      totalOccupiedMinutes: occupiedMinutes,
      totalOccupiedFormatted: occupiedFormatted,
      firstActivityTime: firstEvent ? new Date(firstEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
      latestActivityTime: latestEvent ? new Date(latestEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--',
      latestEventName: latestEvent ? latestEvent.eventType : 'No activity yet today',
      latestEventDescription: latestEvent ? latestEvent.description : 'Awaiting camera initialization.'
    };
  }

  // --- 24-HOUR HOURLY OCCUPANCY ACTIVITY TIMELINE ---
  getHourlyTimeline(refDate = new Date()) {
    const sessions = this.getTodaySessions(refDate);
    const events = this.getTodayEvents(refDate);
    const now = new Date();
    const isToday = this.isSameLocalDay(refDate, now);
    const currentHour = isToday ? now.getHours() : 24;

    const timeline = [];

    for (let h = 0; h < 24; h++) {
      const bucketStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), h, 0, 0, 0);
      const bucketEnd = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), h, 59, 59, 999);

      // Label format: '12 AM', '1 AM', ... '12 PM', ... '11 PM'
      const hourPeriod = h < 12 ? 'AM' : 'PM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayHour} ${hourPeriod}`;

      // Check if session exists in this bucket
      const hasSessionsInBucket = sessions.some((s) => {
        const sStart = new Date(s.startTime).getTime();
        const sEnd = (s.endTime ? new Date(s.endTime) : now).getTime();
        return sStart <= bucketEnd.getTime() && sEnd >= bucketStart.getTime();
      });

      // If hour is in the future today AND no sessions exist in this bucket (Hardware Mode)
      if (this.mode === 'hardware' && isToday && h > currentHour && !hasSessionsInBucket) {
        timeline.push({
          hour: h,
          label,
          occupiedMinutes: 0,
          unoccupiedMinutes: 0,
          starts: 0,
          ends: 0,
          triggers: 0,
          peakPeople: 0,
          isFuture: true
        });
        continue;
      }

      // Calculate session overlap for this specific hour
      let hourOccupiedSeconds = 0;
      let hourPeakPeople = 0;

      sessions.forEach((sess) => {
        const sStart = new Date(sess.startTime);
        const sEnd = sess.endTime ? new Date(sess.endTime) : (this.currentOccupancyStatus === 'OCCUPIED' ? now : sStart);

        const overlapStart = Math.max(sStart.getTime(), bucketStart.getTime());
        // For completed sessions with endTime, overlapEnd is simply bucketEnd or sEnd
        const maxLimit = (!sess.endTime && this.mode === 'hardware' && isToday) ? Math.min(bucketEnd.getTime(), now.getTime()) : bucketEnd.getTime();
        const overlapEnd = Math.min(sEnd.getTime(), maxLimit);

        if (overlapEnd > overlapStart) {
          hourOccupiedSeconds += (overlapEnd - overlapStart) / 1000;
          hourPeakPeople = Math.max(hourPeakPeople, sess.maxPeople || 1);
        }
      });

      // Calculate hour boundaries
      const maxSecondsInHour = (this.mode === 'hardware' && isToday && h === currentHour && !hasSessionsInBucket)
        ? Math.max(0, (now.getTime() - bucketStart.getTime()) / 1000)
        : 3600;

      hourOccupiedSeconds = Math.min(hourOccupiedSeconds, maxSecondsInHour);
      const hourUnoccupiedSeconds = Math.max(0, maxSecondsInHour - hourOccupiedSeconds);

      // Count events occurring within this hour
      let starts = 0;
      let ends = 0;
      let triggers = 0;

      events.forEach((ev) => {
        const evTime = new Date(ev.timestamp);
        if (evTime >= bucketStart && evTime <= bucketEnd) {
          triggers++;
          if (ev.eventType === OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED) starts++;
          if (ev.eventType === OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY) ends++;
          if (ev.peopleCount && ev.peopleCount > hourPeakPeople) {
            hourPeakPeople = ev.peopleCount;
          }
        }
      });

      timeline.push({
        hour: h,
        label,
        occupiedMinutes: Number((hourOccupiedSeconds / 60).toFixed(1)),
        unoccupiedMinutes: Number((hourUnoccupiedSeconds / 60).toFixed(1)),
        starts,
        ends,
        triggers,
        peakPeople: hourPeakPeople,
        isFuture: false
      });
    }

    return timeline;
  }

  // --- SEED DEMO MODE DATA ---
  seedDemoData() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    // Generate realistic commercial workday sessions earlier today
    // Session 1: 09:15 to 10:45 (90 mins, 2 people)
    // Session 2: 11:30 to 12:15 (45 mins, 1 person)
    // Session 3: 13:45 to 15:10 (85 mins, 3 people)
    const seedSessions = [
      {
        id: 'sess-demo-1',
        startTime: new Date(y, m, d, 9, 15, 0).toISOString(),
        endTime: new Date(y, m, d, 10, 45, 0).toISOString(),
        durationSeconds: 5400,
        maxPeople: 2,
        mode: 'DEMO'
      },
      {
        id: 'sess-demo-2',
        startTime: new Date(y, m, d, 11, 30, 0).toISOString(),
        endTime: new Date(y, m, d, 12, 15, 0).toISOString(),
        durationSeconds: 2700,
        maxPeople: 1,
        mode: 'DEMO'
      },
      {
        id: 'sess-demo-3',
        startTime: new Date(y, m, d, 13, 45, 0).toISOString(),
        endTime: new Date(y, m, d, 15, 10, 0).toISOString(),
        durationSeconds: 5100,
        maxPeople: 3,
        mode: 'DEMO'
      }
    ];

    const seedEvents = [
      {
        id: 'evt-demo-1',
        timestamp: new Date(y, m, d, 9, 15, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED,
        occupancyStatus: 'OCCUPIED',
        peopleCount: 1,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: 'Occupancy session initiated (1 person detected).'
      },
      {
        id: 'evt-demo-2',
        timestamp: new Date(y, m, d, 9, 30, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED,
        occupancyStatus: 'OCCUPIED',
        peopleCount: 2,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: 'People count increased to 2.'
      },
      {
        id: 'evt-demo-3',
        timestamp: new Date(y, m, d, 10, 45, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY,
        occupancyStatus: 'UNOCCUPIED',
        peopleCount: 0,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: '30s absence timeout expired. Room confirmed vacant.'
      },
      {
        id: 'evt-demo-4',
        timestamp: new Date(y, m, d, 11, 30, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED,
        occupancyStatus: 'OCCUPIED',
        peopleCount: 1,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: 'Occupancy session initiated (1 person detected).'
      },
      {
        id: 'evt-demo-5',
        timestamp: new Date(y, m, d, 12, 15, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY,
        occupancyStatus: 'UNOCCUPIED',
        peopleCount: 0,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: '30s absence timeout expired. Room confirmed vacant.'
      },
      {
        id: 'evt-demo-6',
        timestamp: new Date(y, m, d, 13, 45, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.OCCUPANCY_STARTED,
        occupancyStatus: 'OCCUPIED',
        peopleCount: 1,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: 'Occupancy session initiated (1 person detected).'
      },
      {
        id: 'evt-demo-7',
        timestamp: new Date(y, m, d, 14, 10, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.ADDITIONAL_PERSON_DETECTED,
        occupancyStatus: 'OCCUPIED',
        peopleCount: 3,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: 'People count increased to 3.'
      },
      {
        id: 'evt-demo-8',
        timestamp: new Date(y, m, d, 15, 10, 0).toISOString(),
        eventType: OCCUPANCY_EVENT_TYPES.ROOM_BECAME_EMPTY,
        occupancyStatus: 'UNOCCUPIED',
        peopleCount: 0,
        source: 'AI_CAMERA',
        mode: 'DEMO',
        description: '30s absence timeout expired. Room confirmed vacant.'
      }
    ];

    this.sessionsDemo = seedSessions;
    this.eventsDemo = seedEvents;
    this.persist(STORAGE_KEYS.SESSIONS_DEMO, seedSessions);
    this.persist(STORAGE_KEYS.EVENTS_DEMO, seedEvents);
  }

  clearEvents() {
    if (this.mode === 'hardware') {
      this.eventsHardware = [];
      this.sessionsHardware = [];
      this.persist(STORAGE_KEYS.EVENTS_HARDWARE, []);
      this.persist(STORAGE_KEYS.SESSIONS_HARDWARE, []);
    } else {
      this.eventsDemo = [];
      this.sessionsDemo = [];
      this.persist(STORAGE_KEYS.EVENTS_DEMO, []);
      this.persist(STORAGE_KEYS.SESSIONS_DEMO, []);
    }
    this.currentSession = null;
    this.currentOccupancyStatus = 'UNKNOWN';
    this.currentPeopleCount = 0;
    this.absenceCountdownActive = false;
    this.cameraDisconnectedRecorded = false;
    this.notify();
  }

  getState() {
    const summary = this.getTodaySummary();
    const timeline = this.getHourlyTimeline();
    const recentEvents = this.getTodayEvents().slice(0, 20);

    return {
      mode: this.mode,
      currentOccupancyStatus: this.currentOccupancyStatus,
      currentPeopleCount: this.currentPeopleCount,
      isOngoingSession: this.currentOccupancyStatus === 'OCCUPIED' && this.currentSession !== null,
      currentSessionStart: this.currentSession ? this.currentSession.startTime : null,
      summary,
      timeline,
      recentEvents,
      allEventsCount: this.getEventsList().length,
      allSessionsCount: this.getSessionsList().length
    };
  }
}

export const occupancyEventService = new OccupancyEventService();
