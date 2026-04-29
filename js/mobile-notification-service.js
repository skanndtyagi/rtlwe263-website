/**
 * Mobile Notification Service
 * Handles login notifications for pending guestbook entries
 * Replaces real-time WebSocket updates (which fail on iOS Safari)
 */

const LAST_VISIT_KEY = 'lwe623-admin-last-visit';
const NOTIFICATION_KEY = 'lwe623-guestbook-notifications';

class MobileNotificationService {
  constructor() {
    this.notifications = this.loadNotifications();
  }

  /**
   * Check for new pending entries since last visit
   * Called on admin panel initialization
   * @returns {Promise<{count: number, entries: Array}>}
   */
  async checkForNewEntries() {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const lastVisitDate = lastVisit ? new Date(lastVisit) : new Date(0);

    if (!isSupabaseReady()) {
      console.warn('[notifications] Supabase not ready');
      return { count: 0, entries: [] };
    }

    try {
      // Query pending entries created after last visit
      const { data, error } = await SUPABASE
        .from('guestbook_entries')
        .select('id, name, club, created_at')
        .eq('status', 'pending')
        .gt('created_at', lastVisitDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[notifications] Query error:', error);
        return { count: 0, entries: [] };
      }

      const entries = data || [];

      // Store notifications
      this.notifications = {
        count: entries.length,
        lastChecked: new Date().toISOString(),
        entries: entries.map(e => e.id)
      };
      this.saveNotifications();

      // Update last visit timestamp
      this.updateLastVisit();

      return { count: entries.length, entries };
    } catch (error) {
      console.error('[notifications] Check failed:', error);
      return { count: 0, entries: [] };
    }
  }

  /**
   * Update badge on guestbook nav button
   * @param {number} count - Number to display on badge
   */
  updateBadge(count) {
    const badge = document.querySelector('[data-badge="guestbook"]');
    if (!badge) {
      console.warn('[notifications] Badge element not found');
      return;
    }

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';

      // Animate badge appearance
      badge.classList.add('badge-pulse');
      setTimeout(() => badge.classList.remove('badge-pulse'), 400);
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Clear notifications when user opens guestbook panel
   */
  markAsRead() {
    this.notifications.count = 0;
    this.notifications.entries = [];
    this.saveNotifications();
    this.updateBadge(0);
  }

  /**
   * Decrement notification count (when entry is approved/rejected)
   */
  decrementCount() {
    const currentCount = this.notifications.count;
    const newCount = Math.max(0, currentCount - 1);
    this.notifications.count = newCount;
    this.saveNotifications();
    this.updateBadge(newCount);
  }

  /**
   * Update last visit timestamp
   */
  updateLastVisit() {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }

  /**
   * Load notifications from localStorage
   * @returns {Object} Notification state
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem(NOTIFICATION_KEY);
      return stored ? JSON.parse(stored) : {
        count: 0,
        lastChecked: null,
        entries: []
      };
    } catch {
      return { count: 0, lastChecked: null, entries: [] };
    }
  }

  /**
   * Save notifications to localStorage
   */
  saveNotifications() {
    try {
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[notifications] Failed to save:', error);
    }
  }
}

// Global instance
window.notificationService = new MobileNotificationService();
