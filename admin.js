const GUESTBOOK_APPROVED_KEY = 'lwe623-guestbook-approved';

// Tablers storage bucket and CRUD state
const TABLERS_BUCKET = 'site-media';
let tabulersInEdit = {}; // Track IDs being edited

const adminGet = (id) => document.getElementById(id);
const adminSafe = (id, event, fn) => {
  const el = adminGet(id);
  if (!el) return;
  el.addEventListener(event, fn);
};

/**
 * Check if user is authenticated with Supabase
 * Redirects to login page if not authenticated
 * @returns {Promise<Object|null>} Supabase session object or null
 */
const requireAuth = async () => {
  if (!isSupabaseReady()) {
    console.error('[admin] Supabase is not configured');
    window.location.href = 'admin-login.html';
    return null;
  }

  const { data: { session }, error } = await SUPABASE.auth.getSession();

  if (error) {
    console.error('[admin] Error checking session:', error.message);
    window.location.href = 'admin-login.html';
    return null;
  }

  if (!session) {
    console.log('[admin] No active session, redirecting to login');
    window.location.href = 'admin-login.html';
    return null;
  }

  console.log('[admin] Session valid for user:', session.user.email);
  return session;
};

/**
 * Sign out the current admin user
 * Clears Supabase session and redirects to login page
 */
const signOut = async () => {
  if (!isSupabaseReady()) {
    console.error('[admin] Supabase is not configured');
    window.location.href = 'admin-login.html';
    return;
  }

  const { error } = await SUPABASE.auth.signOut();

  if (error) {
    console.error('[admin] Error signing out:', error.message);
  }

  console.log('[admin] User signed out');
  window.location.href = 'admin-login.html';
};

const switchPanel = (targetId) => {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(targetId);
  if (panel) panel.classList.add('active');
  document.querySelectorAll(`.admin-nav-btn[data-panel="${targetId}"]`).forEach(b => b.classList.add('active'));
};

const createImageRow = (item = {}) => {
  const row = document.createElement('div');
  row.className = 'admin-image-row';
  const src = item.src || '';
  const caption = item.caption || '';
  row.innerHTML = `
    <div class="admin-image-row-preview">
      <img class="admin-row-preview-img" src="${esc(src)}" alt="" ${src ? '' : 'style="display:none"'} />
      <span class="admin-row-preview-placeholder"${src ? ' style="display:none"' : ''}>No image</span>
    </div>
    <div class="admin-image-row-fields">
      <input class="admin-row-url" type="url" placeholder="Paste image URL\u2026" value="${esc(src)}" />
      <input class="admin-row-caption" placeholder="Caption (optional)" value="${esc(caption)}" />
    </div>
    <button class="btn btn-secondary admin-row-remove" type="button">Remove</button>
  `;
  const urlInput = row.querySelector('.admin-row-url');
  const img = row.querySelector('.admin-row-preview-img');
  const placeholder = row.querySelector('.admin-row-preview-placeholder');
  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    img.src = val;
    img.style.display = val ? '' : 'none';
    placeholder.style.display = val ? 'none' : '';
  });
  row.querySelector('.admin-row-remove').addEventListener('click', () => row.remove());
  return row;
};

const collectImageRows = (containerId) => {
  const container = adminGet(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.admin-image-row'))
    .map(row => ({
      src: row.querySelector('.admin-row-url')?.value.trim() || '',
      caption: row.querySelector('.admin-row-caption')?.value.trim() || '',
    }))
    .filter(item => item.src);
};

const renderImageRows = (containerId, items) => {
  const container = adminGet(containerId);
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(items) && items.length ? items : [];
  if (!list.length) {
    container.appendChild(createImageRow({}));
  } else {
    list.forEach(item => container.appendChild(createImageRow(item)));
  }
};

const createTablerRow = (tabler = {}) => {
  const row = document.createElement('div');
  row.className = 'admin-tabler-row admin-card';
  if (tabler.id) row.dataset.tablerId = tabler.id;
  const photo = tabler.photo || '';
  row.innerHTML = `
    <div class="admin-tabler-row-inner">
      <div class="admin-tabler-preview">
        <img class="admin-tabler-preview-img" src="${esc(photo)}" alt="" ${photo ? '' : 'style="display:none"'} />
        <span class="admin-tabler-preview-placeholder"${photo ? ' style="display:none"' : ''}>No photo</span>
      </div>
      <div class="admin-tabler-fields">
        <div class="admin-field-group admin-field-group-inline">
          <label>Name<input class="admin-tabler-name" value="${esc(tabler.name || '')}" placeholder="Full name" /></label>
          <label>Role / Title<input class="admin-tabler-title" value="${esc(tabler.title || '')}" placeholder="e.g. Chairman" /></label>
        </div>
        <div class="admin-field-group admin-field-group-inline" style="align-items:flex-end">
          <label>Photo<input class="admin-tabler-photo" type="url" placeholder="https://\u2026" value="${esc(photo)}" style="flex:1" /></label>
          <label style="display:flex;gap:.4rem;align-items:center;margin:0">
            <span style="font-size:.85rem;color:var(--muted)">or upload</span>
            <input type="file" class="admin-tabler-upload" accept="image/*" style="display:none" />
            <button class="btn btn-secondary admin-tabler-upload-btn" type="button" style="padding:.4rem .8rem;font-size:.85rem">Browse</button>
          </label>
        </div>
        <label>Bio<textarea class="admin-tabler-bio" rows="3" placeholder="Short bio\u2026">${esc(tabler.bio || '')}</textarea></label>
      </div>
      <button class="btn btn-secondary admin-tabler-remove" type="button">Remove</button>
    </div>
  `;
  const photoInput = row.querySelector('.admin-tabler-photo');
  const img = row.querySelector('.admin-tabler-preview-img');
  const placeholder = row.querySelector('.admin-tabler-preview-placeholder');
  const uploadInput = row.querySelector('.admin-tabler-upload');
  const uploadBtn = row.querySelector('.admin-tabler-upload-btn');

  photoInput.addEventListener('input', () => {
    const val = photoInput.value.trim();
    img.src = val;
    img.style.display = val ? '' : 'none';
    placeholder.style.display = val ? 'none' : '';
  });

  // Browse button opens file picker
  uploadBtn.addEventListener('click', () => {
    uploadInput.click();
  });

  // Handle file upload
  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files?.[0];
    if (!file) return;
    showAdminMessage('Uploading photo...');
    const url = await uploadTablerPhoto(file);
    if (url) {
      photoInput.value = url;
      img.src = url;
      img.style.display = '';
      placeholder.style.display = 'none';
      showAdminMessage('Photo uploaded successfully.');
    } else {
      showAdminMessage('Failed to upload photo.', 'notice');
    }
    uploadInput.value = '';
  });

  row.querySelector('.admin-tabler-remove').addEventListener('click', () => row.remove());
  return row;
};

const collectTablerRows = () =>
  Array.from(document.querySelectorAll('.admin-tabler-row'))
    .map(row => ({
      id: row.dataset.tablerId || undefined,
      name: row.querySelector('.admin-tabler-name')?.value.trim() || 'Unnamed',
      title: row.querySelector('.admin-tabler-title')?.value.trim() || '',
      photo: row.querySelector('.admin-tabler-photo')?.value.trim() || '',
      bio: row.querySelector('.admin-tabler-bio')?.value.trim() || '',
    }))
    .filter(t => t.name && t.name !== 'Unnamed' || t.photo);

const renderTablerEditor = (tablers) => {
  const list = adminGet('admin-tabler-list');
  if (!list) return;
  list.innerHTML = '';
  const items = Array.isArray(tablers) && tablers.length ? tablers : [{}];
  items.forEach(t => list.appendChild(createTablerRow(t)));
};

// ============================================================
// Tablers CRUD Operations with Supabase
// ============================================================

/**
 * Load all active tablers from Supabase
 * @returns {Promise<Array>} Array of tabler objects
 */
const loadTablers = async () => {
  if (!isSupabaseReady()) {
    console.warn('[tablers] Supabase not ready, returning empty');
    return [];
  }
  try {
    const { data: rows, error } = await SUPABASE
      .from('tablers')
      .select('*')
      .eq('active', true)
      .order('order', { ascending: true });
    if (error) {
      console.error('[tablers] Load error:', error.message);
      return [];
    }
    return rows || [];
  } catch (err) {
    console.error('[tablers] Load exception:', err);
    return [];
  }
};

/**
 * Add a new tabler to Supabase
 * @param {Object} tabler - Tabler data { name, title, bio, photo }
 * @returns {Promise<Object|null>} Inserted record or null on error
 */
const addTabler = async (tabler) => {
  if (!isSupabaseReady()) {
    console.error('[tablers] Supabase not ready');
    return null;
  }
  try {
    const { data: newRecord, error } = await SUPABASE
      .from('tablers')
      .insert({
        name: tabler.name || 'Unnamed Tabler',
        title: tabler.title || '',
        bio: tabler.bio || '',
        photo: tabler.photo || '',
        active: true,
        order: Date.now(),
      })
      .select()
      .single();
    if (error) {
      console.error('[tablers] Add error:', error.message);
      return null;
    }
    return newRecord;
  } catch (err) {
    console.error('[tablers] Add exception:', err);
    return null;
  }
};

/**
 * Update an existing tabler in Supabase
 * @param {string} id - Tabler ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated record or null on error
 */
const updateTabler = async (id, updates) => {
  if (!isSupabaseReady()) {
    console.error('[tablers] Supabase not ready');
    return null;
  }
  try {
    const { data: updated, error } = await SUPABASE
      .from('tablers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[tablers] Update error:', error.message);
      return null;
    }
    return updated;
  } catch (err) {
    console.error('[tablers] Update exception:', err);
    return null;
  }
};

/**
 * Delete a tabler from Supabase (soft delete via active flag)
 * @param {string} id - Tabler ID
 * @returns {Promise<boolean>} True if successful
 */
const deleteTabler = async (id) => {
  if (!isSupabaseReady()) {
    console.error('[tablers] Supabase not ready');
    return false;
  }
  try {
    const { error } = await SUPABASE
      .from('tablers')
      .update({ active: false })
      .eq('id', id);
    if (error) {
      console.error('[tablers] Delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[tablers] Delete exception:', err);
    return false;
  }
};

/**
 * Upload tabler photo to Supabase Storage
 * @param {File} file - Image file
 * @returns {Promise<string|null>} Public URL or null on error
 */
const uploadTablerPhoto = async (file) => {
  if (!isSupabaseReady()) {
    console.error('[tablers] Supabase not ready');
    return null;
  }
  try {
    const compressed = await compressImage(file, 500, 0.85); // Profile photo size
    const path = `tablers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await SUPABASE.storage
      .from(TABLERS_BUCKET)
      .upload(path, compressed, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (uploadError) {
      console.error('[tablers] Upload error:', uploadError.message);
      return null;
    }
    const { data: urlData } = SUPABASE.storage
      .from(TABLERS_BUCKET)
      .getPublicUrl(path);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('[tablers] Upload exception:', err);
    return null;
  }
};

const createEventRow = (event = {}) => {
  const row = document.createElement('article');
  row.className = 'admin-event-row admin-card';
  row.innerHTML = `
    <div class="admin-event-row-top">
      <label>Date<input class="admin-event-date" type="date" value="${event.date || ''}" /></label>
      <label>Time<input class="admin-event-time" type="time" value="${event.time || ''}" /></label>
      <label>Location<input class="admin-event-location" value="${event.location || ''}" placeholder="Location" /></label>
      <label>Contact<input class="admin-event-contact" value="${event.contact || ''}" placeholder="Contact" /></label>
      <button class="btn btn-secondary admin-event-remove" type="button">Remove</button>
    </div>
    <label>Title<input class="admin-event-title" value="${event.title || ''}" placeholder="Event title" /></label>
    <label>Description<textarea class="admin-event-description" rows="3" placeholder="Event description">${event.description || ''}</textarea></label>
  `;

  const removeButton = row.querySelector('.admin-event-remove');
  if (removeButton) {
    removeButton.addEventListener('click', () => row.remove());
  }

  return row;
};

const renderEventEditor = (events) => {
  const list = adminGet('admin-event-list');
  if (!list) return;
  list.innerHTML = '';
  const items = Array.isArray(events) && events.length ? events : [{}];
  items.forEach((event) => list.appendChild(createEventRow(event)));
};

const collectEventRows = () => {
  return Array.from(document.querySelectorAll('.admin-event-row')).map((row) => ({
    date: row.querySelector('.admin-event-date')?.value || '',
    time: row.querySelector('.admin-event-time')?.value || '',
    location: row.querySelector('.admin-event-location')?.value.trim() || '',
    contact: row.querySelector('.admin-event-contact')?.value.trim() || '',
    title: row.querySelector('.admin-event-title')?.value.trim() || 'Untitled event',
    description: row.querySelector('.admin-event-description')?.value.trim() || '',
    id: row.dataset.eventId || `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })).filter((event) => event.title || event.location || event.description);
};

const showAdminMessage = (text, type = 'notice') => {
  // Use mobile toast if available (better on mobile)
  if (typeof window.adminMobile !== 'undefined') {
    const toastType = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
    window.adminMobile.showToast(text, toastType);
    return;
  }

  // Fallback to original message system
  const msg = adminGet('admin-message');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `admin-message ${type} visible`;
  clearTimeout(showAdminMessage._timer);
  showAdminMessage._timer = setTimeout(() => { if (msg) msg.classList.remove('visible'); }, 3500);
};

// Button state utility — drives all micro-interaction feedback
// states: 'idle' | 'loading' | 'saved' | 'clean'
const setBtnState = (btn, state, label) => {
  if (!btn) return;
  btn.classList.remove('btn--loading', 'btn--saved');
  btn.disabled = false;
  if (state === 'clean') {
    btn.disabled = true;
    if (label !== undefined) btn.textContent = label;
  } else if (state === 'loading') {
    btn.disabled = true;
    btn.classList.add('btn--loading');
    btn.textContent = 'Saving…';
  } else if (state === 'saved') {
    btn.classList.add('btn--saved');
    btn.textContent = '✓ Saved';
  } else if (state === 'idle') {
    if (label !== undefined) btn.textContent = label;
  }
};

const readApprovedEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(GUESTBOOK_APPROVED_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeApprovedEntries = (entries) => {
  localStorage.setItem(GUESTBOOK_APPROVED_KEY, JSON.stringify(entries));
};

const renderPendingEntries = async () => {
  const list = adminGet('pending-entries');
  if (!list) return;

  // Load from Supabase or fallback to localStorage
  const pending = await loadPendingEntries();

  const badge = adminGet('pending-count');
  if (badge) badge.textContent = pending.length ? String(pending.length) : '';
  if (!pending.length) {
    list.innerHTML = '<p class="muted">No pending entries.</p>';
    return;
  }
  list.innerHTML = pending
    .map((entry, idx) => {
      const name = esc(entry.name || 'Anonymous');
      const club = esc(entry.club || 'Unknown');
      const message = esc(entry.message || '');
      const entryId = entry.id || '';
      return `
        <article class="admin-entry-card">
          <div class="admin-entry-meta"><strong>${name}</strong><span class="muted">${club}</span></div>
          <p>${message}</p>
          <div class="admin-entry-actions">
            <button class="btn btn-primary" data-action="approve" data-id="${entryId}" data-index="${idx}">Approve</button>
            <button class="btn btn-secondary" data-action="reject" data-id="${entryId}" data-index="${idx}">Delete</button>
          </div>
        </article>`;
    })
    .join('');
};

const renderApprovedEntries = async () => {
  const list = adminGet('approved-entries');
  if (!list) return;

  // Load from Supabase or fallback to localStorage
  const approved = await loadApprovedEntries();

  if (!approved.length) {
    list.innerHTML = '<p class="muted">No approved entries yet.</p>';
    return;
  }
  list.innerHTML = approved
    .map((entry) => `
      <article class="admin-entry-card">
        <div class="admin-entry-meta"><strong>${esc(entry.name || 'Anonymous')}</strong><span class="muted">${esc(entry.club || 'Unknown')}</span></div>
        <p>${esc(entry.message || '')}</p>
      </article>`)
    .join('');
};


const saveHero = async () => {
  const heroTitle = adminGet('admin-hero-title');
  const heroSubtitle = adminGet('admin-hero-subtitle');
  const about = adminGet('admin-about');
  const slides = collectImageRows('admin-hero-slide-list');

  if (!isSupabaseReady()) {
    // Fallback to localStorage
    if (heroTitle) data.heroTitle = heroTitle.value.trim() || data.heroTitle;
    if (heroSubtitle) data.heroSubtitle = heroSubtitle.value.trim() || data.heroSubtitle;
    if (about) data.about = about.value.trim() || data.about;
    data.heroSlides = slides;
    if (slides.length) data.heroImage = slides[0].src;
    save(data);
    renderAll();
    showAdminMessage('Hero & About saved to localStorage.');
    return;
  }

  try {
    // Save text content to site_settings
    const updates = [];
    if (heroTitle && heroTitle.value.trim()) {
      updates.push(saveSiteSetting('heroTitle', { text: heroTitle.value.trim() }));
    }
    if (heroSubtitle && heroSubtitle.value.trim()) {
      updates.push(saveSiteSetting('heroSubtitle', { text: heroSubtitle.value.trim() }));
    }
    if (about && about.value.trim()) {
      updates.push(saveSiteSetting('about', { text: about.value.trim() }));
    }
    await Promise.all(updates);

    // Delete all existing slides and insert new ones
    const { error: deleteError } = await SUPABASE
      .from('hero_slides')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('[hero] Error deleting old slides:', deleteError.message);
      showAdminMessage('Failed to save hero slides.', 'notice');
      return;
    }

    if (slides.length > 0) {
      const records = slides.map((slide, index) => ({
        src: slide.src,
        caption: slide.caption || null,
        order: index,
        active: true,
      }));

      const { error: insertError } = await SUPABASE
        .from('hero_slides')
        .insert(records);

      if (insertError) {
        console.error('[hero] Error inserting slides:', insertError.message);
        showAdminMessage('Failed to save hero slides.', 'notice');
        return;
      }
    }

    // Update localStorage as well
    if (heroTitle) data.heroTitle = heroTitle.value.trim();
    if (heroSubtitle) data.heroSubtitle = heroSubtitle.value.trim();
    if (about) data.about = about.value.trim();
    data.heroSlides = slides;
    if (slides.length) data.heroImage = slides[0].src;
    save(data);
    renderAll();

    showAdminMessage('Hero & About saved successfully.');
  } catch (err) {
    console.error('[hero] Save exception:', err);
    showAdminMessage('Failed to save hero content.', 'notice');
  }
};



const saveEvents = async () => {
  const events = collectEventRows();

  if (!isSupabaseReady()) {
    // Fallback to localStorage
    data.programme = events;
    save(data);
    renderAll();
    showAdminMessage('Programme saved to localStorage.');
    return;
  }

  try {
    // Delete all existing events and insert new ones
    const { error: deleteError } = await SUPABASE
      .from('programme_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('[events] Error deleting old events:', deleteError.message);
      showAdminMessage('Failed to save programme events.', 'notice');
      return;
    }

    if (events.length > 0) {
      const records = events.map((event, index) => ({
        date: event.date || null,
        time: event.time || null,
        location: event.location || null,
        title: event.title || 'Untitled Event',
        description: event.description || null,
        contact: event.contact || null,
        order: index,
      }));

      const { error: insertError } = await SUPABASE
        .from('programme_events')
        .insert(records);

      if (insertError) {
        console.error('[events] Error inserting events:', insertError.message);
        showAdminMessage('Failed to save programme events.', 'notice');
        return;
      }
    }

    // Update localStorage as well
    data.programme = events;
    save(data);
    renderAll();

    showAdminMessage('Programme saved successfully.');
  } catch (err) {
    console.error('[events] Save exception:', err);
    showAdminMessage('Failed to save programme events.', 'notice');
  }
};



const saveTablers = async () => {
  const rows = collectTablerRows();
  if (!rows.length) {
    showAdminMessage('No tablers to save. Add at least one tabler.', 'notice');
    return;
  }
  if (!isSupabaseReady()) {
    // Fallback to localStorage
    data.tablers = rows;
    save(data);
    renderAll();
    showAdminMessage('Tablers saved to browser storage (Supabase not ready).', 'notice');
    return;
  }

  // Save each tabler to Supabase
  for (const tabler of rows) {
    if (tabler.id && tabulersInEdit[tabler.id]) {
      // Update existing
      const result = await updateTabler(tabler.id, {
        name: tabler.name,
        title: tabler.title,
        bio: tabler.bio,
        photo: tabler.photo,
      });
      if (!result) {
        showAdminMessage(`Failed to update tabler: ${tabler.name}`, 'notice');
        return;
      }
    } else {
      // Insert new
      const result = await addTabler(tabler);
      if (!result) {
        showAdminMessage(`Failed to add tabler: ${tabler.name}`, 'notice');
        return;
      }
    }
  }

  // Reload from Supabase
  const refreshedTablers = await loadTablers();
  data.tablers = refreshedTablers;
  save(data);
  renderAll();
  tabulersInEdit = {};
  showAdminMessage(`Tablers saved successfully (${rows.length} total).`);
};

const saveSettings = async () => {
  const contactEmail = adminGet('admin-contact-email');
  const meetingDay = adminGet('admin-meeting-day');
  const meetingTime = adminGet('admin-meeting-time');
  const meetingLocation = adminGet('admin-meeting-location');
  const socialFacebook = adminGet('admin-social-facebook');
  const socialTwitter = adminGet('admin-social-twitter');
  const socialInstagram = adminGet('admin-social-instagram');
  const guestbookEnabled = adminGet('admin-guestbook-enabled');

  const settingsToSave = {
    contactEmail: contactEmail?.value.trim() || '',
    meetingDay: meetingDay?.value || '',
    meetingTime: meetingTime?.value.trim() || '',
    meetingLocation: meetingLocation?.value.trim() || '',
    socialMedia: {
      facebook: socialFacebook?.value.trim() || '',
      twitter: socialTwitter?.value.trim() || '',
      instagram: socialInstagram?.value.trim() || '',
    },
    guestbookEnabled: guestbookEnabled?.checked ?? true,
  };

  if (!isSupabaseReady()) {
    // Fallback to localStorage
    data.settings = settingsToSave;
    save(data);
    showAdminMessage('Settings saved to localStorage.');
    return;
  }

  try {
    // Save to site_settings table
    await saveSiteSetting('clubSettings', settingsToSave);

    // Also update localStorage
    data.settings = settingsToSave;
    save(data);

    showAdminMessage('Settings saved successfully.');
  } catch (err) {
    console.error('[settings] Save exception:', err);
    showAdminMessage('Failed to save settings.', 'notice');
  }
};
;

// Wraps a save function to give its button loading → saved → idle feedback
const withSaveFeedback = (btnId, saveFn) => async () => {
  const btn = adminGet(btnId);
  const originalLabel = btn?.textContent ?? 'Save Changes';
  setBtnState(btn, 'loading');
  await saveFn();
  setBtnState(btn, 'saved');
  setTimeout(() => {
    if (btn?.classList.contains('btn--saved')) setBtnState(btn, 'idle', originalLabel);
  }, 2200);
};

// approveEntry and rejectEntry are defined in admin-guestbook-module.js
// No need to duplicate them here

const loadAdminState = async () => {
  // Load hero text from site_settings
  const heroTitle = adminGet('admin-hero-title');
  const heroSubtitle = adminGet('admin-hero-subtitle');
  const about = adminGet('admin-about');
  
  if (isSupabaseReady()) {
    const heroTitleValue = await loadSiteSetting('heroTitle');
    const heroSubtitleValue = await loadSiteSetting('heroSubtitle');
    const aboutValue = await loadSiteSetting('about');
    
    if (heroTitle) heroTitle.value = heroTitleValue?.text || data.heroTitle || '';
    if (heroSubtitle) heroSubtitle.value = heroSubtitleValue?.text || data.heroSubtitle || '';
    if (about) about.value = aboutValue?.text || data.about || '';
  } else {
    if (heroTitle) heroTitle.value = data.heroTitle || '';
    if (heroSubtitle) heroSubtitle.value = data.heroSubtitle || '';
    if (about) about.value = data.about || '';
  }
  
  // Load hero slides from Supabase
  const heroSlides = await loadHeroSlides();
  data.heroSlides = heroSlides.length ? heroSlides : (data.heroSlides || []);
  renderImageRows('admin-hero-slide-list', data.heroSlides);
  
  // Load programme events from Supabase
  const events = await loadProgrammeEvents();
  data.programme = events.length ? events : (data.programme || []);
  renderEventEditor(data.programme);

  // Load tablers from Supabase
  const tablers = await loadTablers();
  data.tablers = tablers.length ? tablers : (data.tablers || []);
  tablers.forEach(t => { tabulersInEdit[t.id] = true; }); // Mark as existing
  renderTablerEditor(data.tablers);

  // Load settings from Supabase
  const contactEmail = adminGet('admin-contact-email');
  const meetingDay = adminGet('admin-meeting-day');
  const meetingTime = adminGet('admin-meeting-time');
  const meetingLocation = adminGet('admin-meeting-location');
  const socialFacebook = adminGet('admin-social-facebook');
  const socialTwitter = adminGet('admin-social-twitter');
  const socialInstagram = adminGet('admin-social-instagram');
  const guestbookEnabled = adminGet('admin-guestbook-enabled');

  if (isSupabaseReady()) {
    const clubSettings = await loadSiteSetting('clubSettings');
    if (clubSettings && typeof clubSettings === 'object') {
      if (contactEmail) contactEmail.value = clubSettings.contactEmail || '';
      if (meetingDay) meetingDay.value = clubSettings.meetingDay || '';
      if (meetingTime) meetingTime.value = clubSettings.meetingTime || '';
      if (meetingLocation) meetingLocation.value = clubSettings.meetingLocation || '';
      if (socialFacebook) socialFacebook.value = clubSettings.socialMedia?.facebook || '';
      if (socialTwitter) socialTwitter.value = clubSettings.socialMedia?.twitter || '';
      if (socialInstagram) socialInstagram.value = clubSettings.socialMedia?.instagram || '';
      if (guestbookEnabled) guestbookEnabled.checked = clubSettings.guestbookEnabled ?? true;
    } else {
      // Use defaults from localStorage or empty
      const settings = data.settings || {};
      if (contactEmail) contactEmail.value = settings.contactEmail || '';
      if (meetingDay) meetingDay.value = settings.meetingDay || '';
      if (meetingTime) meetingTime.value = settings.meetingTime || '';
      if (meetingLocation) meetingLocation.value = settings.meetingLocation || '';
      if (socialFacebook) socialFacebook.value = settings.socialMedia?.facebook || '';
      if (socialTwitter) socialTwitter.value = settings.socialMedia?.twitter || '';
      if (socialInstagram) socialInstagram.value = settings.socialMedia?.instagram || '';
      if (guestbookEnabled) guestbookEnabled.checked = settings.guestbookEnabled ?? true;
    }
  } else {
    // Fallback to localStorage
    const settings = data.settings || {};
    if (contactEmail) contactEmail.value = settings.contactEmail || '';
    if (meetingDay) meetingDay.value = settings.meetingDay || '';
    if (meetingTime) meetingTime.value = settings.meetingTime || '';
    if (meetingLocation) meetingLocation.value = settings.meetingLocation || '';
    if (socialFacebook) socialFacebook.value = settings.socialMedia?.facebook || '';
    if (socialTwitter) socialTwitter.value = settings.socialMedia?.twitter || '';
    if (socialInstagram) socialInstagram.value = settings.socialMedia?.instagram || '';
    if (guestbookEnabled) guestbookEnabled.checked = settings.guestbookEnabled ?? true;
  }
};;

const bindAdminEvents = () => {
  try {
    console.log('[admin] Binding panel switching events...');
    // Panel switching (with mobile touch support)
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    console.log(`[admin] Found ${navButtons.length} navigation buttons`);

    navButtons.forEach(btn => {
      const handler = () => {
        console.log('[admin] Nav button clicked:', btn.dataset.panel);
        switchPanel(btn.dataset.panel);
      };
      btn.addEventListener('click', handler);

      // Mobile touch support - don't prevent default to avoid breaking clicks
      btn.addEventListener('touchstart', (e) => {
        console.log('[admin] Touch on nav button:', btn.dataset.panel);
      }, { passive: true });
    });
    console.log('[admin] ✅ Panel switching events bound');
  } catch (error) {
    console.error('[admin] ❌ Error binding panel events:', error);
    throw error;
  }

  // Hero & About
  adminSafe('admin-save-hero', 'click', withSaveFeedback('admin-save-hero', saveHero));
  adminSafe('admin-add-hero-slide', 'click', () => {
    const list = adminGet('admin-hero-slide-list');
    if (list) list.appendChild(createImageRow({}));
  });

  // Gallery — handled by renderGalleryAdmin()
  adminSafe('admin-create-album', 'click', showCreateAlbumForm);
  adminSafe('admin-cancel-album', 'click', hideCreateAlbumForm);
  adminSafe('admin-confirm-album', 'click', createAlbum);

  // Programme
  adminSafe('admin-save-events', 'click', withSaveFeedback('admin-save-events', saveEvents));
  adminSafe('admin-add-event', 'click', () => {
    const list = adminGet('admin-event-list');
    if (list) list.appendChild(createEventRow({}));
  });

  // Tablers
  adminSafe('admin-save-tablers', 'click', withSaveFeedback('admin-save-tablers', saveTablers));
  adminSafe('admin-add-tabler', 'click', () => {
    const list = adminGet('admin-tabler-list');
    if (list) {
      const newRow = createTablerRow({});
      newRow.dataset.isNew = 'true';
      list.appendChild(newRow);
    }
  });

  // Bind delete buttons for tablers
  const bindTablerDelete = () => {
    document.querySelectorAll('.admin-tabler-remove').forEach(btn => {
      btn.removeEventListener('click', handleTablerDelete);
      btn.addEventListener('click', handleTablerDelete);
    });
  };

  const handleTablerDelete = (event) => {
    const row = event.target.closest('.admin-tabler-row');
    if (!row) return;

    const name = row.querySelector('.admin-tabler-name')?.value || 'this member';

    if (!confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) {
      return;
    }

    const id = row.dataset.tablerId;
    if (id && tabulersInEdit[id]) {
      // Soft delete from Supabase
      deleteTabler(id).then(success => {
        if (success) {
          row.remove();
          showAdminMessage(`${name} has been removed.`);
          delete tabulersInEdit[id];
        } else {
          showAdminMessage('Failed to delete member. Please try again.', 'notice');
        }
      });
    } else {
      // Just remove from UI if new
      row.remove();
      showAdminMessage(`${name} removed.`);
    }
  };

  bindTablerDelete();

  // Settings
  adminSafe('admin-save-settings', 'click', withSaveFeedback('admin-save-settings', saveSettings));

  // Reset
  adminSafe('admin-reset-content', 'click', async () => {
    const confirmText = 'This will permanently delete ALL your content (events, photos, member profiles, etc.) and cannot be undone. Are you absolutely sure?';

    if (!confirm(confirmText)) return;

    // Double confirmation for extra safety
    const confirmAgain = prompt('Type "RESET" in capital letters to confirm:');
    if (confirmAgain !== 'RESET') {
      showAdminMessage('Reset cancelled.', 'notice');
      return;
    }

    localStorage.removeItem(KEY);
    localStorage.removeItem(GUESTBOOK_KEY);
    localStorage.removeItem(GUESTBOOK_APPROVED_KEY);
    data = load();
    renderAll();
    await loadAdminState();
    await loadGuestbookDashboard();
    showAdminMessage('⚠️ All content has been reset to defaults.');
  });

  // Logout
  adminSafe('admin-logout', 'click', async () => {
    await signOut();
  });

  // Guestbook moderation
  const pendingEl = adminGet('pending-entries');
  if (pendingEl) {
    pendingEl.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const id = button.dataset.id;
      const index = Number(button.dataset.index);
      if (action === 'approve') await approveEntry(id, index);
      if (action === 'reject') await rejectEntry(id, index);
    });
  }
};

// ============================================================
// Gallery Album Management
// ============================================================

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const compressImage = (file, maxPx = 1920, quality = 0.82) =>
  new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else                 { width  = Math.round((width  / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });

const uploadGalleryFile = async (file, eventName) => {
  if (!isSupabaseReady()) {
    showAdminMessage('Supabase not configured – cannot upload files.', 'notice');
    return null;
  }
  const compressed = await compressImage(file);
  const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await SUPABASE.storage.from('gallery').upload(path, compressed, {
    cacheControl: '3600',
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    console.warn('Upload error:', error.message || error);
    showAdminMessage(`Upload failed: ${error.message || 'unknown error'}`, 'notice');
    return null;
  }
  const { data: urlData } = SUPABASE.storage.from('gallery').getPublicUrl(path);
  return urlData?.publicUrl || null;
};

const fetchGalleryAlbums = async () => {
  if (!isSupabaseReady()) return [];
  const { data: rows, error } = await SUPABASE
    .from('gallery_images')
    .select('*')
    .eq('active', true)
    .order('event_date', { ascending: false })
    .order('order', { ascending: true });
  if (error || !rows) return [];
  const albumMap = {};
  rows.forEach((img) => {
    const key = img.event_name || 'Uncategorised';
    if (!albumMap[key]) {
      albumMap[key] = { id: key, event_name: key, event_date: img.event_date || '', photos: [] };
    }
    albumMap[key].photos.push(img);
  });
  return Object.values(albumMap);
};

const renderGalleryAdmin = async () => {
  try {
    const container = adminGet('admin-gallery-albums');
    if (!container) {
      console.warn('[gallery] Container element not found - may not be visible on mobile viewport');
      return;
    }
    container.innerHTML = '<p class="muted" style="padding:1rem 0">Loading albums…</p>';
    const albums = await fetchGalleryAlbums();
    if (!albums.length) {
      container.innerHTML = '<p class="muted" style="padding:1rem 0">No albums yet. Click <strong>+ New Album</strong> to create your first event album.</p>';
      return;
    }
    container.innerHTML = '';
    albums.forEach((album) => container.appendChild(createAlbumCard(album)));
  } catch (error) {
    console.error('[gallery] Render error:', error.message);
    throw error; // Re-throw for initAdmin to catch
  }
};

const createAlbumCard = (album) => {
  const card = document.createElement('div');
  card.className = 'gallery-album-card admin-card';
  card.dataset.albumId = album.id;
  const thumbs = album.photos.slice(0, 5).map((p) => `<img class="gallery-album-thumb" src="${esc(p.src)}" alt="" />`).join('');
  const extra = album.photos.length > 5 ? `<div class="gallery-album-extra">+${album.photos.length - 5}</div>` : '';
  card.innerHTML = `
    <div class="gallery-album-header">
      <div class="gallery-album-info">
        <h3 class="gallery-album-name">${esc(album.event_name)}</h3>
        <span class="muted gallery-album-meta">${album.event_date ? formatDisplayDate(album.event_date) : 'No date'} &middot; ${album.photos.length} photo${album.photos.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="gallery-album-actions">
        <button class="btn btn-secondary gallery-btn-manage">Manage photos</button>
        <button class="btn btn-secondary gallery-btn-del-album">Delete album</button>
      </div>
    </div>
    <div class="gallery-album-preview">${thumbs}${extra}</div>
    <div class="gallery-album-body hidden"></div>
  `;
  card.querySelector('.gallery-btn-manage').addEventListener('click', () => toggleAlbumBody(album, card));
  card.querySelector('.gallery-btn-del-album').addEventListener('click', () => confirmDeleteAlbum(album));
  return card;
};

const toggleAlbumBody = async (album, card) => {
  const body = card.querySelector('.gallery-album-body');
  if (!body) return;
  if (!body.classList.contains('hidden')) {
    body.classList.add('hidden');
    body.innerHTML = '';
    return;
  }
  body.innerHTML = '<p class="muted" style="padding:.8rem 0">Loading photos…</p>';
  body.classList.remove('hidden');
  let photos = [];
  if (isSupabaseReady()) {
    const { data: rows } = await SUPABASE
      .from('gallery_images')
      .select('*')
      .eq('event_name', album.event_name)
      .eq('active', true)
      .order('order', { ascending: true });
    photos = rows || [];
  }
  renderAlbumBody(body, album, photos);
};

const renderAlbumBody = (body, album, photos) => {
  body.innerHTML = `
    <div class="gallery-album-edit-meta">
      <div class="admin-field-group admin-field-group-inline" style="flex:1">
        <label>Album name<input class="album-name-input" value="${esc(album.event_name)}" /></label>
        <label>Event date<input class="album-date-input" type="date" value="${esc(album.event_date || '')}" /></label>
      </div>
      <button class="btn btn-primary gallery-btn-save-meta" style="align-self:flex-end">Save details</button>
    </div>
    <div class="gallery-upload-zone">
      <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <p>Drag &amp; drop photos here, or <label class="gallery-upload-label">browse files<input type="file" class="gallery-file-input" accept="image/*" multiple /></label></p>
      <p class="muted" style="font-size:.8rem">Multi-file batch upload supported. JPG, PNG, WEBP.</p>
      <div class="gallery-upload-progress hidden"></div>
    </div>
    <div class="gallery-photo-grid">
      ${photos.map((p) => createPhotoItemHTML(p)).join('')}
    </div>
  `;

  // Save album meta
  body.querySelector('.gallery-btn-save-meta').addEventListener('click', async () => {
    const newName = body.querySelector('.album-name-input').value.trim();
    const newDate = body.querySelector('.album-date-input').value;
    if (!newName) { showAdminMessage('Album name cannot be empty.', 'notice'); return; }
    if (isSupabaseReady()) {
      await SUPABASE.from('gallery_images')
        .update({ event_name: newName, event_date: newDate || null })
        .eq('event_name', album.event_name);
    }
    album.event_name = newName;
    album.event_date = newDate;
    const card = body.closest('.gallery-album-card');
    if (card) {
      const nameEl = card.querySelector('.gallery-album-name');
      const metaEl = card.querySelector('.gallery-album-meta');
      if (nameEl) nameEl.textContent = newName;
      if (metaEl) metaEl.textContent = `${newDate ? formatDisplayDate(newDate) : 'No date'} · ${photos.length} photo${photos.length !== 1 ? 's' : ''}`;
      card.dataset.albumId = newName;
    }
    showAdminMessage('Album details saved.');
  });

  // File upload
  const fileInput = body.querySelector('.gallery-file-input');
  const uploadZone = body.querySelector('.gallery-upload-zone');
  const progressEl = body.querySelector('.gallery-upload-progress');
  const photoGrid = body.querySelector('.gallery-photo-grid');

  fileInput.addEventListener('change', () => handleFileUpload(fileInput.files, album, progressEl, photoGrid));
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFileUpload(e.dataTransfer.files, album, progressEl, photoGrid);
  });

  // Bind existing photo actions
  body.querySelectorAll('.gallery-photo-item').forEach((item) => bindPhotoItemActions(item));
};

const createPhotoItemHTML = (photo) => {
  const hasCaption = !!(photo.caption && photo.caption.trim());
  return `
  <div class="gallery-photo-item" data-id="${esc(photo.id)}">
    <div class="gallery-photo-img-wrap">
      <img src="${esc(photo.src)}" alt="${esc(photo.caption || '')}" loading="lazy" />
    </div>
    <div class="gallery-photo-caption-row">
      <textarea class="gallery-caption-input" rows="2" placeholder="Add a caption…">${esc(photo.caption || '')}</textarea>
      <div class="gallery-caption-actions">
        <button class="btn btn-secondary gallery-btn-save-caption"${hasCaption ? ' disabled' : ''}>${hasCaption ? '✓ Saved' : 'Save'}</button>
        <button class="btn btn-secondary gallery-btn-del-photo">✕</button>
      </div>
    </div>
  </div>
`;};

const bindPhotoItemActions = (item) => {
  const id = item.dataset.id;
  const saveBtn = item.querySelector('.gallery-btn-save-caption');
  const captionInput = item.querySelector('.gallery-caption-input');

  // Track original caption to enable/disable Save when dirty
  let originalCaption = captionInput?.value ?? '';

  const syncSaveState = () => {
    if (!saveBtn || !captionInput) return;
    const isDirty = captionInput.value !== originalCaption;
    if (isDirty) {
      setBtnState(saveBtn, 'idle', 'Save');
    } else {
      setBtnState(saveBtn, originalCaption ? 'saved' : 'clean', originalCaption ? '✓ Saved' : 'Save');
    }
  };

  if (captionInput) {
    captionInput.addEventListener('input', syncSaveState);
    captionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!saveBtn?.disabled) saveBtn?.click(); }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const caption = captionInput?.value?.trim() ?? '';
      setBtnState(saveBtn, 'loading');
      if (isSupabaseReady()) {
        const { error } = await SUPABASE.from('gallery_images').update({ caption }).eq('id', id);
        if (error) {
          showAdminMessage('Failed to save caption.', 'notice');
          setBtnState(saveBtn, 'idle', 'Save');
          return;
        }
      }
      originalCaption = caption;
      item.classList.remove('gallery-photo-item--new');
      setBtnState(saveBtn, 'saved', '✓ Saved');
      // Mark saved button as visually saved but keep disabled (caption is clean)
      saveBtn.disabled = true;
    });
  }

  const delBtn = item.querySelector('.gallery-btn-del-photo');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this photo from the gallery?')) return;
      if (isSupabaseReady()) {
        await SUPABASE.from('gallery_images').update({ active: false }).eq('id', id);
      }
      item.remove();
      showAdminMessage('Photo removed.');
    });
  }
};

const handleFileUpload = async (files, album, progressEl, photoGrid) => {
  if (!files || !files.length) return;
  if (!isSupabaseReady()) {
    showAdminMessage('Supabase storage not configured — cannot upload files.', 'notice');
    return;
  }
  const fileArr = Array.from(files);

  // Check file sizes before uploading
  const largeFiles = fileArr.filter(f => f.size > 5 * 1024 * 1024); // 5MB
  if (largeFiles.length > 0) {
    const fileNames = largeFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ');
    if (!confirm(`⚠️ Some files are quite large: ${fileNames}\n\nLarge files may be slow to load for visitors. Continue anyway?`)) {
      return;
    }
  }

  progressEl.classList.remove('hidden');
  let dbInserted = 0;
  let firstNewItem = null;

  for (let i = 0; i < fileArr.length; i++) {
    const fileSizeMB = (fileArr[i].size / 1024 / 1024).toFixed(1);
    progressEl.textContent = `Compressing & uploading ${i + 1} of ${fileArr.length}… (${fileSizeMB}MB)`;
    const url = await uploadGalleryFile(fileArr[i], album.event_name);
    if (url) {
      const existingCount = photoGrid.querySelectorAll('.gallery-photo-item').length;
      const { data: newRecord, error: dbError } = await SUPABASE.from('gallery_images').insert({
        src: url,
        caption: '',
        event_name: album.event_name,
        event_date: album.event_date || null,
        order: existingCount + i,
        active: true,
      }).select().single();
      if (dbError) {
        console.error('DB insert error:', dbError);
        showAdminMessage(`Photo uploaded to storage but failed to save: ${dbError.message}`, 'notice');
      } else if (newRecord) {
        dbInserted++;
        const temp = document.createElement('div');
        temp.innerHTML = createPhotoItemHTML(newRecord);
        const item = temp.firstElementChild;
        item.classList.add('gallery-photo-item--new');
        photoGrid.appendChild(item);
        bindPhotoItemActions(item);
        if (!firstNewItem) firstNewItem = item;
      }
    }
  }

  // Update album card header count
  const card = photoGrid.closest('.gallery-album-card');
  if (card) {
    const totalItems = card.querySelectorAll('.gallery-photo-item').length;
    const metaEl = card.querySelector('.gallery-album-meta');
    if (metaEl) {
      metaEl.textContent = `${album.event_date ? formatDisplayDate(album.event_date) : 'No date'} · ${totalItems} photo${totalItems !== 1 ? 's' : ''}`;
    }
    // Add new thumb to preview strip if under 5
    if (firstNewItem) {
      const preview = card.querySelector('.gallery-album-preview');
      const thumbCount = preview ? preview.querySelectorAll('img').length : 0;
      if (preview && thumbCount < 5) {
        const img = document.createElement('img');
        img.className = 'gallery-album-thumb';
        img.src = firstNewItem.querySelector('img')?.src || '';
        preview.insertBefore(img, preview.firstChild);
      }
    }
  }

  progressEl.textContent = `✓ ${dbInserted} of ${fileArr.length} photo${fileArr.length !== 1 ? 's' : ''} added to gallery.`;
  setTimeout(() => progressEl.classList.add('hidden'), 5000);

  // Scroll to first new photo and focus its caption
  if (firstNewItem) {
    firstNewItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      const captionInput = firstNewItem.querySelector('.gallery-caption-input');
      if (captionInput) { captionInput.focus(); captionInput.select(); }
    }, 400);
  }
};

const confirmDeleteAlbum = async (album) => {
  const photoCount = album.photos?.length || 0;
  const warningText = `Are you sure you want to delete "${album.event_name}"?\n\nThis will permanently delete ${photoCount} photo${photoCount !== 1 ? 's' : ''} and cannot be undone.`;

  if (!confirm(warningText)) return;

  // Double confirmation for albums with many photos
  if (photoCount > 10) {
    if (!confirm(`⚠️ Last chance! This album has ${photoCount} photos. Delete permanently?`)) {
      return;
    }
  }

  if (isSupabaseReady()) {
    await SUPABASE.from('gallery_images').update({ active: false }).eq('event_name', album.event_name);
  }
  showAdminMessage(`Album "${album.event_name}" and ${photoCount} photo${photoCount !== 1 ? 's' : ''} deleted.`);
  await renderGalleryAdmin();
};

const showCreateAlbumForm = () => {
  const form = adminGet('admin-new-album-form');
  if (form) form.style.display = '';
  const nameInput = adminGet('new-album-name');
  if (nameInput) { nameInput.value = ''; nameInput.focus(); }
};

const hideCreateAlbumForm = () => {
  const form = adminGet('admin-new-album-form');
  if (form) form.style.display = 'none';
};

const createAlbum = async () => {
  const nameInput = adminGet('new-album-name');
  const dateInput = adminGet('new-album-date');
  const name = nameInput?.value.trim();
  if (!name) { showAdminMessage('Please enter an album name.', 'notice'); return; }
  hideCreateAlbumForm();
  const album = { id: name, event_name: name, event_date: dateInput?.value || '', photos: [] };
  const container = adminGet('admin-gallery-albums');
  if (container) {
    const emptyMsg = container.querySelector('p.muted');
    if (emptyMsg) container.innerHTML = '';
    const card = createAlbumCard(album);
    container.insertBefore(card, container.firstChild);
    // Auto-expand the new album for immediate photo upload
    toggleAlbumBody(album, card);
  }
  showAdminMessage(`Album "${name}" created. Upload photos below.`);
};

// ============================================================
// ============================================================
// Hero Slides CRUD Operations with Supabase
// ============================================================

/**
 * Load hero slides from Supabase
 * @returns {Promise<Array>} Array of hero slide objects
 */
const loadHeroSlides = async () => {
  if (!isSupabaseReady()) {
    console.warn('[hero] Supabase not ready, using localStorage');
    return data.heroSlides || [];
  }
  try {
    const { data: rows, error } = await SUPABASE
      .from('hero_slides')
      .select('*')
      .eq('active', true)
      .order('order', { ascending: true });
    if (error) {
      console.error('[hero] Load error:', error.message);
      return data.heroSlides || [];
    }
    return rows || [];
  } catch (err) {
    console.error('[hero] Load exception:', err);
    return data.heroSlides || [];
  }
};

// ============================================================
// Programme Events CRUD Operations with Supabase
// ============================================================

/**
 * Load programme events from Supabase
 * @returns {Promise<Array>} Array of event objects
 */
const loadProgrammeEvents = async () => {
  if (!isSupabaseReady()) {
    console.warn('[events] Supabase not ready, using localStorage');
    return data.programme || [];
  }
  try {
    const { data: rows, error } = await SUPABASE
      .from('programme_events')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      console.error('[events] Load error:', error.message);
      return data.programme || [];
    }
    return rows || [];
  } catch (err) {
    console.error('[events] Load exception:', err);
    return data.programme || [];
  }
};

// ============================================================
// Site Settings CRUD Operations with Supabase
// ============================================================

/**
 * Load a single setting from Supabase
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value or null
 */
const loadSiteSetting = async (key) => {
  if (!isSupabaseReady()) {
    console.warn('[settings] Supabase not ready');
    return null;
  }
  try {
    const { data: row, error} = await SUPABASE
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error) {
      if (error.code !== 'PGRST116') { // Not found is okay
        console.error(`[settings] Load error for ${key}:`, error.message);
      }
      return null;
    }
    return row?.value;
  } catch (err) {
    console.error(`[settings] Load exception for ${key}:`, err);
    return null;
  }
};

/**
 * Save a single setting to Supabase
 * @param {string} key - Setting key
 * @param {any} value - Setting value (will be stored as JSON)
 * @returns {Promise<boolean>} Success status
 */
const saveSiteSetting = async (key, value) => {
  if (!isSupabaseReady()) {
    console.warn('[settings] Supabase not ready');
    return false;
  }
  try {
    const { error } = await SUPABASE
      .from('site_settings')
      .upsert({
        key,
        value: typeof value === 'object' ? value : { data: value },
      });
    if (error) {
      console.error(`[settings] Save error for ${key}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[settings] Save exception for ${key}:`, err);
    return false;
  }
};

/**
 * Handle URL parameters for email-to-dashboard actions
 * Example: ?action=approve&entry=uuid redirects to guestbook and highlights entry
 */
const handleURLParameters = () => {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const entryId = params.get('entry');
  const panel = params.get('panel');

  // Switch to specific panel if requested
  if (panel) {
    switchPanel(panel);
  }

  // Handle approve action from email
  if (action === 'approve' && entryId) {
    // Switch to guestbook panel
    switchPanel('panel-guestbook');

    // Wait a moment for panel to load, then highlight and prompt
    setTimeout(async () => {
      // Find the entry card in pending list
      const entryCard = document.querySelector(`[data-entry-id="${entryId}"]`);

      if (entryCard) {
        // Scroll to entry
        entryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight the entry
        entryCard.style.outline = '3px solid #4CAF50';
        entryCard.style.outlineOffset = '4px';

        // Show approve confirmation
        const confirmed = confirm('Approve this guestbook entry?\n\nClick OK to approve and publish it to your website.');

        if (confirmed) {
          // Find the approve button and click it
          const approveBtn = entryCard.querySelector('[data-action="approve"]');
          if (approveBtn) {
            approveBtn.click();
            showAdminMessage('Entry approved successfully! ✅', 'success');
          } else {
            // Fallback: call approveEntry directly
            const index = parseInt(entryCard.dataset.entryIndex || '0');
            await approveEntry(entryId, index);
            showAdminMessage('Entry approved successfully! ✅', 'success');
          }
        }

        // Remove highlight after 3 seconds
        setTimeout(() => {
          entryCard.style.outline = '';
          entryCard.style.outlineOffset = '';
        }, 3000);
      } else {
        showAdminMessage('Entry not found. It may have already been approved or rejected.', 'notice');
      }

      // Clean up URL
      window.history.replaceState({}, document.title, '/admin.html');
    }, 500);
  }
};

const initAdmin = async () => {
  try {
    console.log('[admin] Step 1: Checking auth...');
    await requireAuth();
    console.log('[admin] ✅ Auth complete');

    console.log('[admin] Step 2: Loading admin state...');
    await loadAdminState(); // Now async to load tablers from Supabase
    console.log('[admin] ✅ Admin state loaded');

    console.log('[admin] Step 3: Rendering gallery...');
    await renderGalleryAdmin();
    console.log('[admin] ✅ Gallery rendered');

    console.log('[admin] Step 4: Loading guestbook...');
    await loadGuestbookDashboard(); // Load guestbook with real-time updates
    console.log('[admin] ✅ Guestbook loaded');

    console.log('[admin] Step 5: Handling URL parameters...');
    handleURLParameters(); // Handle approve-from-email and other URL actions
    console.log('[admin] ✅ URL parameters handled');

    console.log('[admin] Step 6: Binding events...');
    bindAdminEvents();
    console.log('[admin] ✅ Events bound');

    console.log('[admin] ✅✅✅ INITIALIZATION COMPLETE ✅✅✅');

    // Show success message on mobile to confirm it worked
    showAdminMessage('Admin panel loaded successfully!', 'success');

  } catch (error) {
    console.error('[admin] ❌ Initialization failed');
    console.error('[admin] Error name:', error.name);
    console.error('[admin] Error message:', error.message);
    console.error('[admin] Error stack:', error.stack);

    // Show detailed error on screen for mobile debugging
    showAdminMessage(`Failed to initialize: ${error.message}`, 'notice');
  }
};

// Wait for Supabase to be ready before initializing admin
const waitForSupabaseAndInit = async () => {
  const maxRetries = 10;
  let retries = 0;

  const checkAndInit = async () => {
    if (isSupabaseReady()) {
      console.log('[admin] Supabase ready, initializing admin panel...');
      await initAdmin();
      return;
    }

    retries++;
    if (retries >= maxRetries) {
      console.error('[admin] Supabase failed to initialize after', maxRetries, 'attempts');
      showAdminMessage('Failed to connect to database. Please refresh the page.', 'notice');
      return;
    }

    console.log('[admin] Waiting for Supabase... (attempt', retries, '/', maxRetries, ')');
    setTimeout(checkAndInit, 300); // Retry after 300ms
  };

  checkAndInit();
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForSupabaseAndInit);
} else {
  waitForSupabaseAndInit();
}
