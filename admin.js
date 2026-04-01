const ADMIN_AUTH_KEY = 'lwe623-admin-auth';
const GUESTBOOK_APPROVED_KEY = 'lwe623-guestbook-approved';

const adminGet = (id) => document.getElementById(id);
const adminSafe = (id, event, fn) => {
  const el = adminGet(id);
  if (!el) return;
  el.addEventListener(event, fn);
};

const getSupabaseSession = async () => {
  if (!isSupabaseReady()) return null;
  const { data, error } = await SUPABASE.auth.getSession();
  if (error) {
    console.warn('Failed to load Supabase session:', error.message || error);
    return null;
  }
  return data?.session || null;
};

const isAuthorized = async () => {
  if (isSupabaseReady()) {
    const session = await getSupabaseSession();
    if (session) return true;
  }
  return localStorage.getItem(ADMIN_AUTH_KEY) === '1';
};

const requireAuth = async () => {
  if (!(await isAuthorized())) {
    window.location.href = 'admin-login.html';
  }
};

const signOutAdmin = async () => {
  if (isSupabaseReady()) {
    await SUPABASE.auth.signOut();
  }
  localStorage.removeItem(ADMIN_AUTH_KEY);
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
        <label>Photo URL<input class="admin-tabler-photo" type="url" placeholder="https://\u2026" value="${esc(photo)}" /></label>
        <label>Bio<textarea class="admin-tabler-bio" rows="3" placeholder="Short bio\u2026">${esc(tabler.bio || '')}</textarea></label>
      </div>
      <button class="btn btn-secondary admin-tabler-remove" type="button">Remove</button>
    </div>
  `;
  const photoInput = row.querySelector('.admin-tabler-photo');
  const img = row.querySelector('.admin-tabler-preview-img');
  const placeholder = row.querySelector('.admin-tabler-preview-placeholder');
  photoInput.addEventListener('input', () => {
    const val = photoInput.value.trim();
    img.src = val;
    img.style.display = val ? '' : 'none';
    placeholder.style.display = val ? 'none' : '';
  });
  row.querySelector('.admin-tabler-remove').addEventListener('click', () => row.remove());
  return row;
};

const collectTablerRows = () =>
  Array.from(document.querySelectorAll('.admin-tabler-row'))
    .map(row => ({
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
  const msg = adminGet('admin-message');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `admin-message ${type} visible`;
  clearTimeout(showAdminMessage._timer);
  showAdminMessage._timer = setTimeout(() => { if (msg) msg.classList.remove('visible'); }, 3500);
};

const readFallbackEntries = () => {
  try {
    return JSON.parse(localStorage.getItem('lwe623-guestbook-fallback') || '[]');
  } catch {
    return [];
  }
};

const writeFallbackEntries = (entries) => {
  localStorage.setItem('lwe623-guestbook-fallback', JSON.stringify(entries));
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

const renderPendingEntries = () => {
  const list = adminGet('pending-entries');
  if (!list) return;
  const pending = readFallbackEntries();
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
      return `
        <article class="admin-entry-card">
          <div class="admin-entry-meta"><strong>${name}</strong><span class="muted">${club}</span></div>
          <p>${message}</p>
          <div class="admin-entry-actions">
            <button class="btn btn-primary" data-action="approve" data-index="${idx}">Approve</button>
            <button class="btn btn-secondary" data-action="delete" data-index="${idx}">Delete</button>
          </div>
        </article>`;
    })
    .join('');
};

const renderApprovedEntries = () => {
  const list = adminGet('approved-entries');
  if (!list) return;
  const approved = readApprovedEntries();
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

const saveHero = () => {
  const heroTitle = adminGet('admin-hero-title');
  const heroSubtitle = adminGet('admin-hero-subtitle');
  const about = adminGet('admin-about');
  if (heroTitle) data.heroTitle = heroTitle.value.trim() || data.heroTitle;
  if (heroSubtitle) data.heroSubtitle = heroSubtitle.value.trim() || data.heroSubtitle;
  if (about) data.about = about.value.trim() || data.about;
  data.heroSlides = collectImageRows('admin-hero-slide-list');
  if (data.heroSlides.length) data.heroImage = data.heroSlides[0].src;
  save(data);
  renderAll();
  showAdminMessage('Hero & About saved successfully.');
};

const saveGallery = () => {
  data.gallery = collectImageRows('admin-gallery-list');
  save(data);
  renderAll();
  showAdminMessage('Gallery saved successfully.');
};

const saveEvents = () => {
  data.programme = collectEventRows();
  save(data);
  renderAll();
  showAdminMessage('Programme saved successfully.');
};

const saveTablers = () => {
  data.tablers = collectTablerRows();
  save(data);
  renderAll();
  showAdminMessage('Tablers saved successfully.');
};

const saveSettings = () => {
  const submitUrl = adminGet('admin-submit-url');
  const feedUrl = adminGet('admin-feed-url');
  const adminUrl = adminGet('admin-admin-url');
  if (submitUrl) data.integrations.guestbookSubmitUrl = submitUrl.value.trim();
  if (feedUrl) data.integrations.guestbookFeedUrl = feedUrl.value.trim();
  if (adminUrl) data.integrations.adminDashboardUrl = adminUrl.value.trim();
  save(data);
  showAdminMessage('Settings saved successfully.');
};

const approveEntry = (index) => {
  const pending = readFallbackEntries();
  const approved = readApprovedEntries();
  if (!pending[index]) return;
  approved.push({ ...pending[index], approvedAt: new Date().toISOString(), approved: true });
  pending.splice(index, 1);
  writeApprovedEntries(approved);
  writeFallbackEntries(pending);
  renderPendingEntries();
  renderApprovedEntries();
  refreshEntries();
  showAdminMessage('Entry approved locally.');
};

const deleteEntry = (index) => {
  const pending = readFallbackEntries();
  if (!pending[index]) return;
  pending.splice(index, 1);
  writeFallbackEntries(pending);
  renderPendingEntries();
  showAdminMessage('Entry deleted.');
};

const loadAdminState = () => {
  const heroTitle = adminGet('admin-hero-title');
  const heroSubtitle = adminGet('admin-hero-subtitle');
  const about = adminGet('admin-about');
  if (heroTitle) heroTitle.value = data.heroTitle || '';
  if (heroSubtitle) heroSubtitle.value = data.heroSubtitle || '';
  if (about) about.value = data.about || '';
  renderImageRows('admin-hero-slide-list', data.heroSlides || []);
  renderImageRows('admin-gallery-list', data.gallery || []);
  renderEventEditor(data.programme);
  renderTablerEditor(data.tablers);
  const submitUrl = adminGet('admin-submit-url');
  const feedUrl = adminGet('admin-feed-url');
  const adminUrl = adminGet('admin-admin-url');
  if (submitUrl) submitUrl.value = data.integrations?.guestbookSubmitUrl || '';
  if (feedUrl) feedUrl.value = data.integrations?.guestbookFeedUrl || '';
  if (adminUrl) adminUrl.value = data.integrations?.adminDashboardUrl || '';
};

const bindAdminEvents = () => {
  // Panel switching
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // Hero & About
  adminSafe('admin-save-hero', 'click', saveHero);
  adminSafe('admin-add-hero-slide', 'click', () => {
    const list = adminGet('admin-hero-slide-list');
    if (list) list.appendChild(createImageRow({}));
  });

  // Gallery
  adminSafe('admin-save-gallery', 'click', saveGallery);
  adminSafe('admin-add-gallery-image', 'click', () => {
    const list = adminGet('admin-gallery-list');
    if (list) list.appendChild(createImageRow({}));
  });

  // Programme
  adminSafe('admin-save-events', 'click', saveEvents);
  adminSafe('admin-add-event', 'click', () => {
    const list = adminGet('admin-event-list');
    if (list) list.appendChild(createEventRow({}));
  });

  // Tablers
  adminSafe('admin-save-tablers', 'click', saveTablers);
  adminSafe('admin-add-tabler', 'click', () => {
    const list = adminGet('admin-tabler-list');
    if (list) list.appendChild(createTablerRow({}));
  });

  // Settings
  adminSafe('admin-save-settings', 'click', saveSettings);

  // Reset
  adminSafe('admin-reset-content', 'click', () => {
    if (!confirm('Reset all content to defaults? This cannot be undone.')) return;
    localStorage.removeItem(KEY);
    localStorage.removeItem(GUESTBOOK_KEY);
    localStorage.removeItem(GUESTBOOK_APPROVED_KEY);
    data = load();
    renderAll();
    loadAdminState();
    renderPendingEntries();
    renderApprovedEntries();
    showAdminMessage('Content reset to defaults.');
  });

  // Logout
  adminSafe('admin-logout', 'click', async () => {
    await signOutAdmin();
    window.location.href = 'admin-login.html';
  });

  // Guestbook moderation
  const pendingEl = adminGet('pending-entries');
  if (pendingEl) {
    pendingEl.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      if (action === 'approve') approveEntry(index);
      if (action === 'delete') deleteEntry(index);
    });
  }
};

const initAdmin = async () => {
  await requireAuth();
  loadAdminState();
  renderPendingEntries();
  renderApprovedEntries();
  bindAdminEvents();
};

initAdmin();
