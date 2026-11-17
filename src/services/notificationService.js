/**
 * Notification Service (Phase 4 Task 11)
 * Manages user-facing notification queue derived from active and critical alerts.
 * Supports unread counter, mark-as-read, and dynamic syncing with alert changes.
 */

const STORAGE_KEY_NOTIFICATIONS = 'eco_bms_notifications_v4';

export class NotificationService {
  constructor() {
    this.notifications = [];
    this.readNotificationIds = new Set();
    this.listeners = new Set();

    this.loadPersistedState();
  }

  isStorageAvailable() {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window;
    } catch (e) {
      return false;
    }
  }

  loadPersistedState() {
    if (!this.isStorageAvailable()) return;
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.readIds)) {
          this.readNotificationIds = new Set(parsed.readIds);
        }
      }
    } catch (e) {
      console.warn('NotificationService: Failed to parse persisted notification state', e);
    }
  }

  savePersistedState() {
    if (!this.isStorageAvailable()) return;
    try {
      const payload = {
        readIds: Array.from(this.readNotificationIds)
      };
      window.localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(payload));
    } catch (e) {
      console.warn('NotificationService: Failed to save notifications', e);
    }
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
        console.error('NotificationService listener error:', err);
      }
    });
  }

  /**
   * Syncs active alerts into user notifications
   */
  syncFromAlerts(activeAlerts) {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.notifications = activeAlerts.map((alert) => {
      const notifId = `notif-${alert.id}`;
      const isRead = this.readNotificationIds.has(notifId);

      return {
        id: notifId,
        alertId: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        sensor: alert.sensor,
        timestamp: alert.timestamp || timeString,
        isRead
      };
    });

    this.notify();
  }

  markAsRead(notificationId) {
    this.readNotificationIds.add(notificationId);
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.savePersistedState();
    this.notify();
  }

  markAllAsRead() {
    this.notifications.forEach((n) => this.readNotificationIds.add(n.id));
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    this.savePersistedState();
    this.notify();
  }

  clearAll() {
    this.notifications = [];
    this.readNotificationIds.clear();
    this.savePersistedState();
    this.notify();
  }

  getState() {
    const unreadCount = this.notifications.filter((n) => !n.isRead).length;
    return {
      notifications: [...this.notifications],
      unreadCount,
      hasUnread: unreadCount > 0
    };
  }
}

export const notificationService = new NotificationService();
