const ADMIN_AUTH_KEY = 'lwe623-admin-auth';
const GUESTBOOK_APPROVED_KEY = 'lwe623-guestbook-approved';

const adminGet = (id) => document.getElementById(id);
const adminSafe = (id, event, fn) => {
  const el = adminGet(id);
  if (!el) return;
  el.addEventListener(event, fn);
};

const isAuthorized = () => localStorage.getItem(ADMIN_AUTH_KEY) === '1';
const requireAuth = () => {
  if (!isAuthorized()) {
    window.location.href = 'admin-login.html';
  }
};

const formatGallery = (gallery) =>
  (gallery || [])
    .map((item) => `${item.src || ''} | ${item.caption || ''}`)
    .join('\n');

const parseGallery = (raw) =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [src, ...captionParts] = line.split('|');
      return { src: (src || '').trim(), caption: captionParts.join('|').trim() };
    })
    .filter((item) => item.src);

const createEventRow = (event = {}) => {
  const row = document.createElement('article');
  row.className = 'admin-event-row card';
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
  msg.className = `admin-message ${type}`;
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
  if (!pending.length) {
    list.innerHTML = '<p>No pending entries.</p>';
    return;
  }

  list.innerHTML = pending
    .map((entry, idx) => {
      const name = esc(entry.name || 'Anonymous');
      const club = esc(entry.club || 'Unknown');
      const message = esc(entry.message || '');
      return `
        <article class="card admin-card anim-rise">
          <h4>${name}</h4>
          <p class="muted">${club}</p>
          <p>${message}</p>
          <div class="hero-actions">
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
    list.innerHTML = '<p>No approved entries yet.</p>';
    return;
  }

  list.innerHTML = approved
    .map((entry) => `
      <article class="card admin-card anim-rise">
        <h4>${esc(entry.name || 'Anonymous')}</h4>
        <p class="muted">${esc(entry.club || 'Unknown')}</p>
        <p>${esc(entry.message || '')}</p>
      </article>`)
    .join('');
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
  const heroSlides = adminGet('admin-hero-slides');
  const heroImage = adminGet('admin-hero-image');
  const gallery = adminGet('admin-gallery');
  const submitUrl = adminGet('admin-submit-url');
  const feedUrl = adminGet('admin-feed-url');
  const adminUrl = adminGet('admin-admin-url');

  if (!heroTitle || !heroSubtitle || !about || !heroSlides || !heroImage || !gallery || !submitUrl || !feedUrl || !adminUrl) return;

  heroTitle.value = data.heroTitle;
  heroSubtitle.value = data.heroSubtitle;
  about.value = data.about;
  heroSlides.value = formatGallery(data.heroSlides || []);
  heroImage.value = data.heroImage;
  gallery.value = formatGallery(data.gallery);
  submitUrl.value = data.integrations.guestbookSubmitUrl;
  feedUrl.value = data.integrations.guestbookFeedUrl;
  adminUrl.value = data.integrations.adminDashboardUrl;
  renderEventEditor(data.programme);
};

const bindAdminEvents = () => {
  adminSafe('admin-add-event', 'click', () => {
    const list = adminGet('admin-event-list');
    if (!list) return;
    list.appendChild(createEventRow({}));
  });

  adminSafe('admin-save-content', 'click', () => {
    const heroTitle = adminGet('admin-hero-title');
    const heroSubtitle = adminGet('admin-hero-subtitle');
    const about = adminGet('admin-about');
    const heroSlides = adminGet('admin-hero-slides');
    const heroImage = adminGet('admin-hero-image');
    const gallery = adminGet('admin-gallery');
    const submitUrl = adminGet('admin-submit-url');
    const feedUrl = adminGet('admin-feed-url');
    const adminUrl = adminGet('admin-admin-url');

    if (!heroTitle || !heroSubtitle || !about || !heroSlides) return;

    data.heroTitle = heroTitle.value.trim();
    data.heroSubtitle = heroSubtitle.value.trim();
    data.about = about.value.trim();
    data.heroSlides = heroSlides ? parseGallery(heroSlides.value) : [];
    data.heroImage = heroImage.value.trim() || defaultData.heroImage;
    data.gallery = gallery ? parseGallery(gallery.value) : [];
    data.programme = collectEventRows();
    data.integrations.guestbookSubmitUrl = submitUrl.value.trim();
    data.integrations.guestbookFeedUrl = feedUrl.value.trim();
    data.integrations.adminDashboardUrl = adminUrl.value.trim();

    save(data);
    renderAll();
    showAdminMessage('Saved content successfully.');
  });

  adminSafe('admin-reset-content', 'click', () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(GUESTBOOK_KEY);
    localStorage.removeItem(GUESTBOOK_APPROVED_KEY);
    data = load();
    renderAll();
    loadAdminState();
    renderPendingEntries();
    renderApprovedEntries();
    showAdminMessage('Local content reset to default.');
  });

  adminSafe('admin-logout', 'click', () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = 'admin-login.html';
  });

  const pending = adminGet('pending-entries');
  if (pending) {
    pending.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      if (action === 'approve') approveEntry(index);
      if (action === 'delete') deleteEntry(index);
    });
  }
};

const initAdmin = () => {
  requireAuth();
  loadAdminState();
  renderPendingEntries();
  renderApprovedEntries();
  bindAdminEvents();
};

initAdmin();
