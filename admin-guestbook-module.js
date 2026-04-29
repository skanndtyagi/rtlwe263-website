// ============================================================
// Guestbook Moderation Module
// Supabase-powered guestbook entry management with real-time updates
// ============================================================

/**
 * Load pending guestbook entries from Supabase
 * Falls back to localStorage if Supabase is not available
 * @returns {Promise<Array>} Array of pending entries
 */
const loadPendingEntries = async () => {
  if (!isSupabaseReady()) {
    console.log('[guestbook] Supabase not ready, using fallback for pending entries');
    return readFallbackEntries();
  }

  const { data, error } = await SUPABASE
    .from('guestbook_entries')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[guestbook] Error loading pending entries:', error.message);
    showAdminMessage('Failed to load pending entries from database.', 'notice');
    return readFallbackEntries();
  }

  return data || [];
};

/**
 * Load approved guestbook entries from Supabase
 * Falls back to localStorage if Supabase is not available
 * @returns {Promise<Array>} Array of approved entries
 */
const loadApprovedEntries = async () => {
  if (!isSupabaseReady()) {
    console.log('[guestbook] Supabase not ready, using fallback for approved entries');
    return readApprovedEntries();
  }

  const { data, error } = await SUPABASE
    .from('guestbook_entries')
    .select('*')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false });

  if (error) {
    console.error('[guestbook] Error loading approved entries:', error.message);
    showAdminMessage('Failed to load approved entries from database.', 'notice');
    return readApprovedEntries();
  }

  return data || [];
};

/**
 * Approve a guestbook entry
 * Updates status to 'approved' and sets approved_at timestamp
 * @param {string} id - Entry ID (Supabase UUID)
 * @param {number} index - Fallback index for localStorage
 * @returns {Promise<boolean>} True if successful
 */
const approveEntry = async (id, index) => {
  if (!isSupabaseReady()) {
    // Fallback to localStorage
    console.log('[guestbook] Using localStorage fallback for approve');
    const pending = readFallbackEntries();
    const approved = readApprovedEntries();
    if (!pending[index]) return false;
    approved.push({ ...pending[index], approvedAt: new Date().toISOString(), approved: true });
    pending.splice(index, 1);
    writeApprovedEntries(approved);
    writeFallbackEntries(pending);
    await renderPendingEntries();
    await renderApprovedEntries();
    refreshEntries();
    showAdminMessage('Entry approved locally.');
    return true;
  }

  const { error } = await SUPABASE
    .from('guestbook_entries')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('[guestbook] Error approving entry:', error.message);
    showAdminMessage('Failed to approve entry.', 'notice');
    return false;
  }

  await renderPendingEntries();
  await renderApprovedEntries();
  refreshEntries();
  showAdminMessage('Entry approved successfully.');
  return true;
};

/**
 * Reject a guestbook entry
 * Updates status to 'rejected' (soft delete)
 * @param {string} id - Entry ID (Supabase UUID)
 * @param {number} index - Fallback index for localStorage
 * @returns {Promise<boolean>} True if successful
 */
const rejectEntry = async (id, index) => {
  if (!isSupabaseReady()) {
    // Fallback to localStorage
    console.log('[guestbook] Using localStorage fallback for reject');
    const pending = readFallbackEntries();
    if (!pending[index]) return false;
    pending.splice(index, 1);
    writeFallbackEntries(pending);
    await renderPendingEntries();
    showAdminMessage('Entry rejected locally.');
    return true;
  }

  const { error } = await SUPABASE
    .from('guestbook_entries')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) {
    console.error('[guestbook] Error rejecting entry:', error.message);
    showAdminMessage('Failed to reject entry.', 'notice');
    return false;
  }

  await renderPendingEntries();
  showAdminMessage('Entry rejected.');
  return true;
};

/**
 * Subscribe to real-time guestbook changes
 * Listens for INSERT on pending entries
 * @returns {Object|null} Subscription object or null if Supabase not ready
 */
const subscribeToGuestbookChanges = () => {
  if (!isSupabaseReady()) {
    console.log('[guestbook] Supabase not ready, skipping real-time subscription');
    return null;
  }

  try {
    const subscription = SUPABASE
      .channel('guestbook-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guestbook_entries',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('[guestbook] New pending entry detected:', payload.new);
          renderPendingEntries();
          showAdminMessage('New guestbook entry received!', 'notice');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guestbook_entries'
        },
        (payload) => {
          console.log('[guestbook] Entry updated:', payload.new);
          renderPendingEntries();
          renderApprovedEntries();
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.warn('[guestbook] Real-time subscription error (non-critical):', error.message);
          console.log('[guestbook] Admin panel will work without real-time updates');
        } else if (status === 'SUBSCRIBED') {
          console.log('[guestbook] Real-time subscription active');
        }
      });

    return subscription;
  } catch (error) {
    console.warn('[guestbook] Failed to setup real-time subscription (non-critical):', error.message);
    console.log('[guestbook] Admin panel will continue without real-time updates');
    return null;
  }
};

/**
 * Load guestbook dashboard
 * Called when admin panel initializes
 */
const loadGuestbookDashboard = async () => {
  console.log('[guestbook] Loading dashboard...');
  await renderPendingEntries();
  await renderApprovedEntries();

  // Try to setup real-time subscription (non-critical, can fail on mobile)
  try {
    subscribeToGuestbookChanges();
  } catch (error) {
    console.warn('[guestbook] Could not setup real-time updates:', error.message);
    // Continue without real-time - manual refresh will still work
  }
};
