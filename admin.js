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

  // Gallery — handled by renderGalleryAdmin()
  adminSafe('admin-create-album', 'click', showCreateAlbumForm);
  adminSafe('admin-cancel-album', 'click', hideCreateAlbumForm);
  adminSafe('admin-confirm-album', 'click', createAlbum);

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
  const container = adminGet('admin-gallery-albums');
  if (!container) return;
  container.innerHTML = '<p class="muted" style="padding:1rem 0">Loading albums…</p>';
  const albums = await fetchGalleryAlbums();
  if (!albums.length) {
    container.innerHTML = '<p class="muted" style="padding:1rem 0">No albums yet. Click <strong>+ New Album</strong> to create your first event album.</p>';
    return;
  }
  container.innerHTML = '';
  albums.forEach((album) => container.appendChild(createAlbumCard(album)));
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

const createPhotoItemHTML = (photo) => `
  <div class="gallery-photo-item" data-id="${esc(photo.id)}">
    <div class="gallery-photo-img-wrap">
      <img src="${esc(photo.src)}" alt="${esc(photo.caption || '')}" loading="lazy" />
    </div>
    <div class="gallery-photo-caption-row">
      <input class="gallery-caption-input" value="${esc(photo.caption || '')}" placeholder="Add a caption…" />
      <button class="btn btn-secondary gallery-btn-save-caption">Save</button>
      <button class="btn btn-secondary gallery-btn-del-photo">✕</button>
    </div>
  </div>
`;

const bindPhotoItemActions = (item) => {
  const id = item.dataset.id;
  const saveBtn = item.querySelector('.gallery-btn-save-caption');
  const captionInput = item.querySelector('.gallery-caption-input');
  if (captionInput) {
    captionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveBtn?.click(); }
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const caption = captionInput?.value.trim() ?? '';
      if (isSupabaseReady()) {
        const { error } = await SUPABASE.from('gallery_images').update({ caption }).eq('id', id);
        if (error) { showAdminMessage('Failed to save caption.', 'notice'); return; }
      }
      item.classList.remove('gallery-photo-item--new');
      showAdminMessage('Caption saved.');
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
  progressEl.classList.remove('hidden');
  let dbInserted = 0;
  let firstNewItem = null;

  for (let i = 0; i < fileArr.length; i++) {
    progressEl.textContent = `Compressing & uploading ${i + 1} of ${fileArr.length}…`;
    const url = await uploadGalleryFile(fileArr[i], album.event_name);
    if (url) {
      const { data: newRecord, error: dbError } = await SUPABASE.from('gallery_images').insert({
        src: url,
        caption: '',
        event_name: album.event_name,
        event_date: album.event_date || null,
        order: Date.now() + i,
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
  if (!confirm(`Delete the "${album.event_name}" album and all its photos? This cannot be undone.`)) return;
  if (isSupabaseReady()) {
    await SUPABASE.from('gallery_images').update({ active: false }).eq('event_name', album.event_name);
  }
  showAdminMessage(`Album "${album.event_name}" deleted.`);
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

const initAdmin = async () => {
  await requireAuth();
  loadAdminState();
  renderGalleryAdmin(); // async — updates DOM when Supabase responds
  renderPendingEntries();
  renderApprovedEntries();
  bindAdminEvents();
};

initAdmin();
