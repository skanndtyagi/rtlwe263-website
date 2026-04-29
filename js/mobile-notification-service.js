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
   * Check for new pending entries since last visit (for toast notification)
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
      // Query pending entries created after last visit (for toast)
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

      const newEntries = data || [];

      // Update last visit timestamp
      this.updateLastVisit();

      return { count: newEntries.length, entries: newEntries };
    } catch (error) {
      console.error('[notifications] Check failed:', error);
      return { count: 0, entries: [] };
    }
  }

  /**
   * Get TOTAL pending count (for badge display)
   * This shows the real-time count of ALL pending entries
   * @returns {Promise<number>}
   */
  async getTotalPendingCount() {
    if (!isSupabaseReady()) {
      console.warn('[notifications] Supabase not ready');
      return 0;
    }

    try {
      const { count, error } = await SUPABASE
        .from('guestbook_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('[notifications] Count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[notifications] Count failed:', error);
      return 0;
    }
  }

  /**
   * Update badge with TOTAL pending count
   * @param {number} count - Number to display on badge (if not provided, fetches from DB)
   */
  async updateBadge(count = null) {
    // If count not provided, fetch total from database
    if (count === null) {
      count = await this.getTotalPendingCount();
    }

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
   * Refresh badge count from database
   * Call this after approve/reject to update the count
   */
  async refreshBadge() {
    await this.updateBadge();
  }

  /**
   * Mark notifications as viewed (but keep badge showing total count)
   * This is called when user opens guestbook panel
   */
  markAsViewed() {
    // Don't clear badge - it should always show total pending count
    // Just mark that user has viewed the panel
    console.log('[notifications] Guestbook panel viewed');
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

  // Legacy methods for backwards compatibility (deprecated)
  markAsRead() {
    this.markAsViewed();
  }

  decrementCount() {
    // Deprecated - use refreshBadge() instead
    this.refreshBadge();
  }
}

// Global instance
window.notificationService = new MobileNotificationService();
