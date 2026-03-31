const adminGet = (id) => document.getElementById(id);
const adminSafe = (id, event, fn) => {
  const el = adminGet(id);
  if (!el) return;
  el.addEventListener(event, fn);
};

const GUESTBOOK_APPROVED_KEY = 'lwe623-guestbook-approved';

const formatGallery = (gallery) =>
  (gallery || [])
    .map((item) => `${item.src || ''} | ${item.caption || ''}`)
    .join('\n');

const formatProgramme = (programme) =>
  Object.entries(programme || {})
    .map(([month, events]) => `${month} | ${events.join(' ; ')}`)
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

const parseProgramme = (raw) =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const [month, rest = ''] = line.split('|');
      const key = (month || '').trim();
      if (!key) return acc;
      acc[key] = rest
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);
      return acc;
    }, {});

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
      return `<article class="card admin-card anim-rise"><h4>${name}</h4><p class="muted">${club}</p><p>${message}</p><div class="hero-actions"><button class="btn btn-primary" data-action="approve" data-index="${idx}">Approve</button><button class="btn btn-secondary" data-action="reject" data-index="${idx}">Reject</button></div></article>`;
    })
    .join('');
};

const renderApprovedEntries = () => {
  const list = adminGet('approved-entries');
  if (!list) return;
  const approved = readApprovedEntries();
  if (!approved.length) {
    list.innerHTML = '<p>No approved entries.</p>';
    return;
  }

  list.innerHTML = approved
    .map((entry) => `<article class="card admin-card anim-rise"><h4>${esc(entry.name || 'Anonymous')}</h4><p class="muted">${esc(entry.club || 'Unknown')}</p><p>${esc(entry.message || '')}</p></article>`)
    .join('');
};

const approveEntry = (index) => {
  const entries = readFallbackEntries();
  const approved = readApprovedEntries();
  if (!entries[index]) return;
  approved.push({ ...entries[index], approvedAt: new Date().toISOString() });
  entries.splice(index, 1);
  writeApprovedEntries(approved);
  writeFallbackEntries(entries);
  renderPendingEntries();
  renderApprovedEntries();
  refreshEntries();
  showAdminMessage('Entry approved locally.');
};

const rejectEntry = (index) => {
  const entries = readFallbackEntries();
  if (!entries[index]) return;
  entries.splice(index, 1);
  writeFallbackEntries(entries);
  renderPendingEntries();
  showAdminMessage('Entry rejected.');
};

const bindAdminEvents = () => {
  adminSafe('admin-save-content', 'click', () => {
    const heroTitle = adminGet('admin-hero-title');
    const heroSubtitle = adminGet('admin-hero-subtitle');
    const about = adminGet('admin-about');
    const heroImage = adminGet('admin-hero-image');
    const gallery = adminGet('admin-gallery');
    const programme = adminGet('admin-programme');
    const submitUrl = adminGet('admin-submit-url');
    const feedUrl = adminGet('admin-feed-url');
    const adminUrl = adminGet('admin-admin-url');

    if (!heroTitle || !heroSubtitle || !about) return;
    data.heroTitle = heroTitle.value.trim();
    data.heroSubtitle = heroSubtitle.value.trim();
    data.about = about.value.trim();
    data.heroImage = heroImage.value.trim() || defaultData.heroImage;
    data.gallery = parseGallery(gallery.value);
    data.programme = parseProgramme(programme.value);
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
    renderPendingEntries();
    renderApprovedEntries();
    loadAdminState();
    showAdminMessage('Local content and guestbook state reset to defaults.');
  });

  const pending = adminGet('pending-entries');
  if (pending) {
    pending.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      if (action === 'approve') approveEntry(index);
      if (action === 'reject') rejectEntry(index);
    });
  }
};

const loadAdminState = () => {
  const heroTitle = adminGet('admin-hero-title');
  const heroSubtitle = adminGet('admin-hero-subtitle');
  const about = adminGet('admin-about');
  const heroImage = adminGet('admin-hero-image');
  const gallery = adminGet('admin-gallery');
  const programme = adminGet('admin-programme');
  const submitUrl = adminGet('admin-submit-url');
  const feedUrl = adminGet('admin-feed-url');
  const adminUrl = adminGet('admin-admin-url');

  if (!heroTitle || !heroSubtitle || !about || !heroImage || !gallery || !programme || !submitUrl || !feedUrl || !adminUrl) return;

  heroTitle.value = data.heroTitle;
  heroSubtitle.value = data.heroSubtitle;
  about.value = data.about;
  heroImage.value = data.heroImage;
  gallery.value = formatGallery(data.gallery);
  programme.value = formatProgramme(data.programme);
  submitUrl.value = data.integrations.guestbookSubmitUrl;
  feedUrl.value = data.integrations.guestbookFeedUrl;
  adminUrl.value = data.integrations.adminDashboardUrl;
};

const initAdmin = () => {
  if (!adminGet('admin-content-form')) return;
  loadAdminState();
  renderPendingEntries();
  renderApprovedEntries();
  bindAdminEvents();
};

initAdmin();
