const KEY = 'lwe623-content-v3';
const GUESTBOOK_KEY = 'lwe623-guestbook-fallback';
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk';
const ADMIN_LOGIN_URL = 'admin-login.html';
const SITE_URL = 'https://lwe623.uk';

const defaultData = {
  heroTitle: 'The Westenders Guide 2026-2027',
  heroSubtitle:
    'A modern fellowship community for men under 45 — blending friendship, community impact, and unforgettable London socials.',
  about:
    'We are a vibrant Round Table based in central London. Across the year we host social nights, business meetings, volunteering initiatives, and national/international events. Our mission is simple: meaningful friendship, personal growth, and doing good while having fun.',
  heroImage: 'assets/hero-01.jpg',
  heroSlides: [
    { src: 'assets/hero-01.jpg', caption: 'West End fellowship in action' },
    { src: 'assets/hero-02.jpg', caption: 'Evening socials and community connection' },
    { src: 'assets/hero-03.jpg', caption: 'Nightlife, friendship and service' },
    { src: 'assets/hero-04.jpg', caption: 'London West End Tablers on a mission' },
  ],
  gallery: [],
  integrations: {
    guestbookSubmitUrl: '',
    guestbookFeedUrl: '',
    adminDashboardUrl: '',
  },
  programme: [
    {
      id: '2026-04-01-agm',
      date: '2026-04-01',
      time: '19:00',
      location: 'RT Pub, Soho',
      contact: 'JB',
      title: 'AGM',
      description: 'Annual general meeting to review the year and plan upcoming socials.',
    },
    {
      id: '2026-04-15-disko',
      date: '2026-04-15',
      time: '20:00',
      location: 'Albert Schloss, Soho',
      contact: 'Vedang',
      title: 'Disko Wunderbar',
      description: 'Club social night with music, games and fellowship.',
    },
    {
      id: '2026-05-06-business',
      date: '2026-05-06',
      time: '19:30',
      location: 'RT Pub, London West End',
      contact: 'Vedang',
      title: 'Business Meeting',
      description: 'Monthly business review and planning session.',
    },
    {
      id: '2026-05-20-arcade',
      date: '2026-05-20',
      time: '18:00',
      location: 'NQ64 Arcade, Soho',
      contact: 'Ryan',
      title: 'NQ64 Arcade Night',
      description: 'Retro games, pizza and a chance to meet visiting Tablers.',
    },
  ],
  tablers: [
    { name: 'Ryan Zammit', title: 'The Logistics Chief', photo: 'assets/tabler-ryan-zammit.jpg', bio: 'Project-managed energy, travel mindset, and motorsport precision.' },
    { name: 'Matteo', title: 'The Train Enthusiast', photo: 'assets/tabler-matteo.jpg', bio: 'Veteran tabler with social energy and proven community fundraising impact.' },
    { name: 'Amit Shah', title: 'The Tech Nomad', photo: 'assets/tabler-amit-shah.jpg', bio: 'Software engineer, global explorer, and craft-beer scout.' },
    { name: 'Steve', title: 'The Foundation', photo: 'assets/tabler-steve.jpg', bio: 'Phoenix founder and bedrock of the Table since re-charter.' },
    { name: 'John Bergqvist', title: 'The Forest Fellow', photo: 'assets/tabler-john-bergqvist.jpg', bio: 'Immediate Past Chairman (2025-26), scientist, strategist, and outdoorsman.' },
    { name: 'Kyle “Mitchi” West', title: 'The Workshop Wizard', photo: 'assets/tabler-kyle-west.jpg', bio: 'DnD and comics energy with a strong brotherhood spirit.' },
    { name: 'Vedang Tyagi', title: 'The Global Heir', photo: 'assets/tabler-vedang-tyagi.jpg', bio: 'Doctor, host, athlete, and lifelong tabling culture ambassador.' },
    { name: 'David Crow', title: 'The West End Maverick', photo: 'assets/tabler-david-crow.jpg', bio: 'International social operator and creative nightlife presence.' },
    { name: 'Amrinder Chana', title: 'Area 6 Legend in London', photo: 'assets/tabler-amrinder-chana.jpg', bio: '14+ years in Table leadership and Area 26 Chairman for 2026-27.' },
    { name: 'Jon Clark', title: 'The International Envoy', photo: 'assets/tabler-jon-clark.jpg', bio: 'Founding member and National President for RTBI (2025-26).' },
    { name: 'Jay Shah', title: 'The Global Adrenaline Hunter', photo: 'assets/tabler-jay-shah.jpg', bio: 'Multi-region leader, entrepreneur, and endurance adventurer.' },
  ],
};

const monthNameMap = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const getById = (id) => document.getElementById(id);
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const normalizeProgramme = (programme) => {
  if (Array.isArray(programme)) return programme;
  if (!programme || typeof programme !== 'object') return [];

  const events = [];
  Object.entries(programme).forEach(([monthKey, items]) => {
    const [monthPart, yearPart] = String(monthKey || '').split(' ');
    const monthCode = monthNameMap[monthPart?.slice(0, 3)] || 0;
    const year = Number(yearPart) || new Date().getFullYear();

    if (!Array.isArray(items)) return;

    items.forEach((raw) => {
      const text = String(raw).trim();
      const parts = text.split('|').map((part) => part.trim()).filter(Boolean);
      const dateMatch = text.match(/^(\d{1,2})\s+[A-Za-z]{3}/);
      const day = dateMatch ? Number(dateMatch[1]) : 1;
      const date = monthCode ? `${year}-${String(monthCode).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
      const title = parts.length ? parts[0].replace(/^\d{1,2}\s+[A-Za-z]{3}:?\s*/i, '').trim() : 'Event';
      let location = '';
      let contact = '';
      let description = '';

      parts.slice(1).forEach((part) => {
        if (/^Owner:/i.test(part)) contact = part.replace(/^Owner:/i, '').trim();
        else if (!location) location = part;
        else description += (description ? ' | ' : '') + part;
      });

      events.push({
        id: `legacy-${date}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        date,
        time: '',
        location,
        contact,
        title,
        description,
      });
    });
  });

  return events;
};

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    const data = {
      ...defaultData,
      ...parsed,
      integrations: { ...defaultData.integrations, ...(parsed.integrations || {}) },
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultData.gallery,
      programme: normalizeProgramme(parsed.programme || defaultData.programme),
      tablers: Array.isArray(parsed.tablers) ? parsed.tablers : defaultData.tablers,
    };
    return data;
  } catch {
    return defaultData;
  }
};

const save = (payload) => {
  localStorage.setItem(KEY, JSON.stringify(payload));
  persistSiteData(payload);
};

const fetchSiteData = async () => {
  if (!isSupabaseReady()) return null;

  try {
    const { data: row, error } = await SUPABASE.from('site_settings').select('value').eq('key', SUPABASE_SITE_KEY).single();
    if (error) {
      console.warn('Failed to fetch site data:', error.message || error);
      return null;
    }
    return row?.value || null;
  } catch (err) {
    console.warn('Failed to fetch site data:', err);
    return null;
  }
};

const persistSiteData = async (payload) => {
  if (!isSupabaseReady()) return false;

  try {
    const { error } = await SUPABASE.from('site_settings').upsert(
      { key: SUPABASE_SITE_KEY, value: payload },
      { onConflict: 'key' },
    );
    if (error) {
      console.warn('Failed to persist site data:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to persist site data:', err);
    return false;
  }
};

const mergeSiteData = (remoteData) => {
  if (!remoteData || typeof remoteData !== 'object') return data;
  return {
    ...data,
    ...remoteData,
    integrations: { ...data.integrations, ...(remoteData.integrations || {}) },
    gallery: Array.isArray(remoteData.gallery) ? remoteData.gallery : data.gallery,
    // Only use remote data if it has actual content — empty arrays fall back to local defaults
    programme: normalizeProgramme(
      (Array.isArray(remoteData.programme) && remoteData.programme.length) ? remoteData.programme : data.programme
    ),
    tablers: (Array.isArray(remoteData.tablers) && remoteData.tablers.length) ? remoteData.tablers : data.tablers,
  };
};

let data = load();
let heroSlides = [];
let heroIndex = 0;
let heroTimer = null;

const getSlides = () => (Array.isArray(data.heroSlides) && data.heroSlides.length ? data.heroSlides : [{ src: data.heroImage, caption: '' }]);

const updateHeroSlide = (index) => {
  const slides = getSlides();
  if (!slides.length) return;
  const slide = slides[index % slides.length];
  const heroImage = getById('hero-image');
  const heroCaption = getById('hero-slide-caption');

  if (heroImage) heroImage.src = slide?.src || data.heroImage;
  if (heroCaption) heroCaption.textContent = slide?.caption || '';
};

const startHeroSlider = () => {
  heroSlides = getSlides();
  if (!heroSlides.length) return;
  heroIndex = 0;
  updateHeroSlide(heroIndex);
  if (heroTimer) clearInterval(heroTimer);
  if (heroSlides.length > 1) {
    heroTimer = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      updateHeroSlide(heroIndex);
    }, 6000);
  }
};

const getSortedProgramme = () =>
  Array.isArray(data.programme)
    ? data.programme.slice().sort((a, b) => new Date(a.date || '2999-12-31') - new Date(b.date || '2999-12-31'))
    : [];

const getMonthLabel = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Upcoming events';
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const formatCalendarDate = (dateString, timeString) => {
  const dateTime = timeString ? `${dateString}T${timeString}` : dateString;
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const addOneHour = (timeString) => {
  const [hour, minute] = String(timeString).split(':').map(Number);
  if (Number.isNaN(hour)) return '10:00';
  const nextHour = (hour + 1) % 24;
  return `${String(nextHour).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
};

const makeGoogleMapsLink = (location) => {
  if (!location) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

const makeCalendarLink = (event) => {
  if (!event) return 'https://www.google.com/calendar';
  const title = event.title || 'Round Table Event';
  const details = `${event.description || ''}\nContact: ${event.contact || 'N/A'}`;
  const location = event.location || '';
  const start = formatCalendarDate(event.date, event.time || '09:00');
  const end = formatCalendarDate(event.date, event.time ? addOneHour(event.time) : '10:00');
  const dates = start && end ? `${start}/${end}` : '';
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(dates)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
};

const renderTopContent = () => {
  const heroTitle = getById('hero-title');
  const heroSubtitle = getById('hero-subtitle');
  const aboutCopy = getById('about-copy');

  if (heroTitle) heroTitle.textContent = data.heroTitle;
  if (heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
  if (aboutCopy) aboutCopy.textContent = data.about;

  startHeroSlider();
};

// ---- Lightbox state ----
let _lbPhotos = [];
let _lbIndex = 0;

const openLightbox = (photos, index) => {
  _lbPhotos = photos;
  _lbIndex = index;
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  updateLightboxSlide();
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  const lb = document.getElementById('gallery-lightbox');
  if (lb) lb.classList.add('hidden');
  document.body.style.overflow = '';
};

const updateLightboxSlide = () => {
  const img = document.getElementById('lb-img');
  const cap = document.getElementById('lb-caption');
  const counter = document.getElementById('lb-counter');
  if (!img) return;
  const photo = _lbPhotos[_lbIndex];
  img.src = photo.src;
  img.alt = photo.caption || '';
  if (cap) cap.textContent = photo.caption || '';
  if (counter) counter.textContent = `${_lbIndex + 1} / ${_lbPhotos.length}`;
};

const lbPrev = () => {
  if (!_lbPhotos.length) return;
  _lbIndex = (_lbIndex - 1 + _lbPhotos.length) % _lbPhotos.length;
  updateLightboxSlide();
};

const lbNext = () => {
  if (!_lbPhotos.length) return;
  _lbIndex = (_lbIndex + 1) % _lbPhotos.length;
  updateLightboxSlide();
};

const injectLightbox = () => {
  if (document.getElementById('gallery-lightbox')) return;
  const lb = document.createElement('div');
  lb.id = 'gallery-lightbox';
  lb.className = 'gallery-lightbox hidden';
  lb.innerHTML = `
    <div class="lb-overlay"></div>
    <div class="lb-content">
      <button class="lb-close" id="lb-close" aria-label="Close">&#10005;</button>
      <button class="lb-nav lb-prev" id="lb-prev" aria-label="Previous">&#8249;</button>
      <div class="lb-img-wrap">
        <img id="lb-img" src="" alt="" />
      </div>
      <button class="lb-nav lb-next" id="lb-next" aria-label="Next">&#8250;</button>
      <div class="lb-footer">
        <p id="lb-caption" class="lb-caption"></p>
        <span id="lb-counter" class="lb-counter"></span>
      </div>
    </div>
  `;
  document.body.appendChild(lb);
  lb.querySelector('.lb-overlay').addEventListener('click', closeLightbox);
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', lbPrev);
  document.getElementById('lb-next').addEventListener('click', lbNext);
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') lbPrev();
    if (e.key === 'ArrowRight') lbNext();
    if (e.key === 'Escape') closeLightbox();
  });
};

// ---- Gallery rendering (event-grouped) ----
const fetchGalleryFromSupabase = async () => {
  if (!isSupabaseReady()) return null;
  const { data: rows, error } = await SUPABASE
    .from('gallery_images')
    .select('id, src, caption, event_name, event_date')
    .eq('active', true)
    .order('event_date', { ascending: false })
    .order('order', { ascending: true });
  if (error || !rows || !rows.length) return null;
  return rows;
};

const renderGallery = async () => {
  const galleryGrid = getById('gallery-grid');
  if (!galleryGrid) return;

  const remotePhotos = await fetchGalleryFromSupabase();

  if (remotePhotos && remotePhotos.length) {
    const PREVIEW_ALBUM_LIMIT = 3;
    const PREVIEW_PHOTOS_PER_ALBUM = 4;

    // Group by event_name
    const albumMap = {};
    remotePhotos.forEach((img) => {
      const key = img.event_name || 'General';
      if (!albumMap[key]) {
        albumMap[key] = { event_name: key, event_date: img.event_date || '', photos: [] };
      }
      albumMap[key].photos.push(img);
    });

    const albums = Object.values(albumMap).sort((a, b) => {
      const da = a.event_date ? new Date(a.event_date).getTime() : 0;
      const db = b.event_date ? new Date(b.event_date).getTime() : 0;
      return db - da;
    });
    galleryGrid._albums = albums;

    const featuredAlbums = albums.slice(0, PREVIEW_ALBUM_LIMIT);
    const remainingAlbums = albums.slice(PREVIEW_ALBUM_LIMIT);

    const renderAlbum = (album, albumIndex) => {
      const dateStr = album.event_date
        ? new Date(album.event_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';
      const previewPhotos = album.photos.slice(0, PREVIEW_PHOTOS_PER_ALBUM);
      const photosHtml = previewPhotos.map((p, i) => `
        <figure class="gallery-event-photo reveal" data-album-index="${albumIndex}" data-idx="${i}">
          <img src="${esc(p.src)}" alt="${esc(p.caption || album.event_name)}" loading="lazy" decoding="async" />
          ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
        </figure>
      `).join('');

      return `
        <div class="gallery-event-group reveal">
          <div class="gallery-event-header">
            <h3 class="gallery-event-name">${esc(album.event_name)}</h3>
            ${dateStr ? `<span class="gallery-event-date">${esc(dateStr)}</span>` : ''}
            <span class="gallery-event-count">${album.photos.length} photo${album.photos.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="gallery-event-photos stagger">${photosHtml}</div>
        </div>
      `;
    };

    const featuredHtml = featuredAlbums
      .map((album, i) => renderAlbum(album, i))
      .join('');

    const remainingHtml = remainingAlbums.length
      ? `
        <div id="gallery-more-wrap" class="gallery-more-wrap">
          <button id="gallery-toggle-all" class="btn btn-secondary" type="button" aria-expanded="false">
            View all albums (${remainingAlbums.length})
          </button>
          <div id="gallery-more" class="gallery-more hidden"></div>
        </div>
      `
      : '';

    galleryGrid.innerHTML = `${featuredHtml}${remainingHtml}`;

    if (!galleryGrid.dataset.galleryBound) {
      galleryGrid.addEventListener('click', (event) => {
        const fig = event.target.closest('.gallery-event-photo');
        if (!fig) return;
        const albumIndex = Number(fig.dataset.albumIndex);
        const idx = Number(fig.dataset.idx);
        const album = (galleryGrid._albums || [])[albumIndex];
        if (album) openLightbox(album.photos, idx);
      });
      galleryGrid.dataset.galleryBound = 'true';
    }

    const toggleBtn = getById('gallery-toggle-all');
    const moreWrap = getById('gallery-more');
    if (toggleBtn && moreWrap) {
      toggleBtn.addEventListener('click', () => {
        const willOpen = moreWrap.classList.contains('hidden');
        if (willOpen && !moreWrap.dataset.rendered) {
          moreWrap.innerHTML = remainingAlbums
            .map((album, i) => renderAlbum(album, i + featuredAlbums.length))
            .join('');
          moreWrap.dataset.rendered = 'true';
        }
        moreWrap.classList.toggle('hidden');
        toggleBtn.setAttribute('aria-expanded', String(willOpen));
        toggleBtn.textContent = willOpen ? 'Show fewer albums' : `View all albums (${remainingAlbums.length})`;
        if (willOpen && window._revealObserver) {
          moreWrap.querySelectorAll('.reveal:not(.in-view)').forEach(el => window._revealObserver.observe(el));
        }
      });
    }

    // Trigger reveal observer for async-rendered gallery
    if (window._revealObserver) {
      galleryGrid.querySelectorAll('.reveal:not(.in-view)').forEach(el => window._revealObserver.observe(el));
    }
    return;
  }

  // Fallback: legacy flat gallery from localStorage
  if (!Array.isArray(data.gallery) || data.gallery.length === 0) {
    galleryGrid.innerHTML = '<div class="gallery-empty">No gallery images yet. Upload photos from the admin dashboard.</div>';
    return;
  }
  const flatPhotos = data.gallery.map((item) => ({ src: item?.src || item, caption: item?.caption || '' }));
  galleryGrid.innerHTML = `<div class="gallery-event-group reveal">
    <div class="gallery-event-header"><h3 class="gallery-event-name">Gallery</h3></div>
    <div class="gallery-event-photos stagger">
      ${flatPhotos.map((p, i) => `
        <figure class="gallery-event-photo reveal" data-album-index="0" data-idx="${i}">
          <img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy" decoding="async" />
          ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
        </figure>`).join('')}
    </div>
  </div>`;
  galleryGrid._albums = [{ photos: flatPhotos }];
  if (!galleryGrid.dataset.galleryBound) {
    galleryGrid.addEventListener('click', (event) => {
      const fig = event.target.closest('.gallery-event-photo');
      if (!fig) return;
      const albumIndex = Number(fig.dataset.albumIndex);
      const idx = Number(fig.dataset.idx);
      const album = (galleryGrid._albums || [])[albumIndex];
      if (album) openLightbox(album.photos, idx);
    });
    galleryGrid.dataset.galleryBound = 'true';
  }
};

const renderProgramme = () => {
  const programmeGrid = getById('programme-grid');
  if (!programmeGrid) return;

  const events = getSortedProgramme();
  if (!events.length) {
    programmeGrid.innerHTML = '<p>No upcoming events are scheduled yet.</p>';
    return;
  }

  let html = '';
  let currentMonth = '';

  events.forEach((event, index) => {
    const monthLabel = getMonthLabel(event.date);
    if (monthLabel !== currentMonth) {
      if (currentMonth) html += '</div></div>';
      html += `<div class="programme-group"><h3>${esc(monthLabel)}</h3><div class="programme-list">`;
      currentMonth = monthLabel;
    }
    const date = new Date(event.date || '');
    const day = String(date.getDate() || '').padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    html += `<article class="event-card anim-rise" data-index="${index}">
      <div class="event-card-date">
        <span class="event-card-day">${esc(day || 'TBD')}</span>
        <span class="event-card-month">${esc(month || 'TBD')}</span>
      </div>
      <div class="event-card-info">
        <h3>${esc(event.title || 'Untitled')}</h3>
        <p class="event-card-meta">${esc(event.location || 'Location TBA')} · ${esc(event.time || 'Time TBA')}</p>
        <p class="event-card-contact">Contact: ${esc(event.contact || 'N/A')}</p>
      </div>
    </article>`;
  });

  if (currentMonth) html += '</div></div>';
  programmeGrid.innerHTML = html;
};

const openEventDetail = (event) => {
  if (!event) return;
  const panel = getById('event-detail');
  const title = getById('detail-title');
  const description = getById('detail-description');
  const date = getById('detail-date');
  const time = getById('detail-time');
  const location = getById('detail-location');
  const contact = getById('detail-contact');
  const mapLink = getById('detail-map-link');
  const calendarLink = getById('detail-calendar-link');

  if (title) title.textContent = event.title || 'Event details';
  if (description) description.textContent = event.description || 'No additional details provided.';
  if (date) date.textContent = event.date || 'TBA';
  if (time) time.textContent = event.time || 'TBA';
  if (location) location.textContent = event.location || 'TBA';
  if (contact) contact.textContent = event.contact || 'TBA';
  if (mapLink) mapLink.href = makeGoogleMapsLink(event.location);
  if (calendarLink) calendarLink.href = makeCalendarLink(event);
  if (panel) panel.classList.remove('hidden');
};

const closeEventDetail = () => {
  const panel = getById('event-detail');
  if (panel) panel.classList.add('hidden');
};

const renderTablers = () => {
  const grid = getById('tablers-grid');
  if (!grid) return;
  grid.classList.remove('stagger');
  const isMobileTablerView = window.matchMedia('(max-width: 920px), (hover: none), (pointer: coarse)').matches;
  
  // Touch devices: expandable card layout (no 3D flip)
  if (isMobileTablerView) {
    grid.innerHTML = data.tablers
      .map((t, i) => `<article class="tabler-card tabler-mobile" style="animation-delay:${(i * 80)}ms" data-name="${esc(t.name)}">
          <div class="tabler-front">
            <img src="${esc(t.photo || 'assets/tabler-placeholder.jpg')}" alt="${esc(t.name)}" loading="lazy" decoding="async" />
            <h3>${esc(t.name)}</h3>
            <p class="title">${esc(t.title)}</p>
            <p class="tap-note">Member profile</p>
            <button class="tabler-bio-btn" type="button" aria-expanded="false">Read bio</button>
          </div>
          <div class="tabler-bio-expand" hidden>
            <p>${esc(t.bio)}</p>
          </div>
        </article>`)
      .join('');
    
    if (!grid.dataset.mobileTablersBound) {
      // Clean expand/collapse interaction via explicit CTA button
      grid.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.tabler-bio-btn');
        if (!toggleBtn) return;
        const card = toggleBtn.closest('.tabler-mobile');
        const bioDiv = card?.querySelector('.tabler-bio-expand');
        if (!card || !bioDiv) return;
        const isOpen = card.classList.toggle('is-open');
        bioDiv.hidden = !isOpen;
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        toggleBtn.textContent = isOpen ? 'Hide bio' : 'Read bio';
      });

      grid.dataset.mobileTablersBound = 'true';
    }
  } else {
    // Desktop: photo goes full colour on hover, bio slides in below
    grid.innerHTML = data.tablers
      .map((t, i) => `<article class="tabler-card" style="animation-delay:${(i * 80)}ms">
          <div class="tabler-front">
            <img src="${esc(t.photo || 'assets/tabler-placeholder.jpg')}" alt="${esc(t.name)}" loading="lazy" decoding="async" />
            <h3>${esc(t.name)}</h3>
            <p class="title">${esc(t.title)}</p>
          </div>
          <div class="tabler-bio-panel">
            <p>${esc(t.bio)}</p>
          </div>
        </article>`)
      .join('');
  }
};

const renderSchema = () => {
  const schemaNode = getById('schema-org');
  if (!schemaNode) return;

  const today = new Date().toISOString().slice(0, 10);

  // Upcoming programme events → schema.org SocialEvent
  const eventSchemas = getSortedProgramme()
    .filter(ev => ev.date >= today)
    .slice(0, 10)
    .map(ev => ({
      '@type': 'SocialEvent',
      name: ev.title,
      startDate: ev.time ? `${ev.date}T${ev.time}:00` : ev.date,
      ...(ev.description ? { description: ev.description } : {}),
      ...(ev.location ? {
        location: {
          '@type': 'Place',
          name: ev.location,
          address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
        },
      } : {}),
      organizer: { '@type': 'Organization', name: 'Round Table London West End No. 623', url: SITE_URL },
    }));

  // Current tablers → schema.org Person
  const memberSchemas = data.tablers.slice(0, 8).map(t => ({
    '@type': 'Person',
    name: t.name,
    ...(t.title ? { jobTitle: t.title } : {}),
    memberOf: { '@id': `${SITE_URL}/#organization` },
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'SportsClub'],
        '@id': `${SITE_URL}/#organization`,
        name: 'Round Table London West End No. 623',
        alternateName: ['LWE 623', 'RT LWE 623', 'London West End Tablers'],
        description: 'A fellowship and social club for men aged 18–45 in central London, part of Round Tables of Great Britain and Ireland (RTBI). We run socials, business meetings, volunteering projects, and international events year-round.',
        url: SITE_URL,
        logo: `${SITE_URL}/assets/london-west-end-logo.png`,
        email: 'london.westend@roundtable.org.uk',
        foundingDate: '2019',
        areaServed: { '@type': 'City', name: 'London' },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'London',
          addressRegion: 'West End',
          addressCountry: 'GB',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 51.5118, longitude: -0.1413 },
        memberOf: {
          '@type': 'Organization',
          name: 'Round Tables of Great Britain and Ireland',
          alternateName: 'RTBI',
          url: 'https://roundtable.org.uk',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'london.westend@roundtable.org.uk',
          contactType: 'membership',
          areaServed: 'GB',
        },
        sameAs: [
          'https://www.instagram.com/rtlondonwestend',
          'https://www.facebook.com/share/1DAJHdvB5D/',
          'https://roundtable.org.uk',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Round Table London West End 623',
        description: 'Official website — programme, members, gallery, and visiting book.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-GB',
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: 'Round Table London West End 623 | Fellowship in Central London',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-GB',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/#about` },
            { '@type': 'ListItem', position: 3, name: 'Programme', item: `${SITE_URL}/#programme` },
            { '@type': 'ListItem', position: 4, name: 'Meet the Tablers', item: `${SITE_URL}/#tablers` },
            { '@type': 'ListItem', position: 5, name: 'Gallery', item: `${SITE_URL}/#highlights` },
            { '@type': 'ListItem', position: 6, name: 'Visiting Book', item: `${SITE_URL}/#visiting-book` },
            { '@type': 'ListItem', position: 7, name: 'FAQ', item: `${SITE_URL}/#faq` },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Round Table London West End 623?',
            acceptedAnswer: { '@type': 'Answer', text: 'Round Table London West End No. 623 is a fellowship and social club for men aged 18–45 based in central London. Part of Round Tables of Great Britain and Ireland (RTBI), we run events, socials, volunteering projects, and international fellowship activities year-round.' },
          },
          {
            '@type': 'Question',
            name: 'Who can join Round Table London West End?',
            acceptedAnswer: { '@type': 'Answer', text: 'Membership is open to men aged 18–45. To express interest, contact london.westend@roundtable.org.uk or reach out via our social channels on Instagram or Facebook.' },
          },
          {
            '@type': 'Question',
            name: 'How do I join an event or social?',
            acceptedAnswer: { '@type': 'Answer', text: 'Contact us via email at london.westend@roundtable.org.uk or via our Instagram and Facebook pages. Visiting Tablers and guests are always welcome — please message us ahead of time.' },
          },
          {
            '@type': 'Question',
            name: 'Can visiting Tablers from other clubs attend?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. We welcome visiting Tablers from any Round Table club in the UK and internationally. Please message us in advance. You can also sign the digital Visiting Book on lwe623.uk.' },
          },
          {
            '@type': 'Question',
            name: "Where does London West End 623 meet?",
            acceptedAnswer: { '@type': 'Answer', text: "We meet at venues across London's West End, frequently in Soho and nearby areas. Specific locations for each event are shared via WhatsApp and Spond." },
          },
          {
            '@type': 'Question',
            name: 'What types of events does Round Table London West End 623 organise?',
            acceptedAnswer: { '@type': 'Answer', text: 'Monthly business meetings, themed social nights, sport and outdoor activities, charity fundraisers, and national/international Round Table gatherings. The programme runs from April to April each year.' },
          },
          {
            '@type': 'Question',
            name: 'Where are final event details published?',
            acceptedAnswer: { '@type': 'Answer', text: 'Official event updates and last-minute changes are shared via WhatsApp and Spond. The full schedule is listed on this website under the Programme section.' },
          },
        ],
      },
      ...memberSchemas,
      ...eventSchemas,
    ],
  };
  schemaNode.textContent = JSON.stringify(schema);
};

const readFallbackEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(GUESTBOOK_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeFallbackEntries = (entries) => {
  localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(entries));
};

const fetchApprovedEntries = async () => {
  if (!data.integrations.guestbookFeedUrl) return null;
  try {
    const response = await fetch(data.integrations.guestbookFeedUrl, { method: 'GET' });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!Array.isArray(payload)) return null;
    return payload;
  } catch {
    return null;
  }
};

const renderEntries = (entries) => {
  const list = getById('guestbook-list');
  if (!list) return;
  list.innerHTML = entries.length
    ? entries
        .slice()
        .reverse()
        .map((e) => `<li class="anim-rise"><strong>${esc(e.name)}</strong> · ${esc(e.club)}<p>${esc(e.message)}</p></li>`)
        .join('')
    : '<li><strong>No approved entries yet.</strong><p>Be the first to sign the book.</p></li>';
};

const refreshEntries = async () => {
  const remote = await fetchApprovedEntries();
  if (remote) {
    renderEntries(remote.filter((e) => e && e.name && e.club && e.message));
    return;
  }
  renderEntries(readFallbackEntries());
};

const mailToAdmin = (entry) => {
  const subject = `Guestbook entry from ${entry.name}`;
  const body = `Name: ${entry.name}\nClub: ${entry.club}\nMessage: ${entry.message}\nSubmitted: ${entry.createdAt}\n\nReview and approve entries here: ${ADMIN_LOGIN_URL} or admin-login.html`;
  window.location.href = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const submitRemoteEntry = async (entry) => {
  const submitUrl = data.integrations.guestbookSubmitUrl;
  if (!submitUrl) return false;
  try {
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return response.ok;
  } catch {
    return false;
  }
};

const bindGuestbook = () => {
  const form = getById('guestbook-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const entry = {
      name: String(fd.get('name') || '').trim(),
      club: String(fd.get('club') || '').trim(),
      message: String(fd.get('message') || '').trim(),
      createdAt: new Date().toISOString(),
      approved: false,
    };

    if (!entry.name || !entry.club || !entry.message) return;

    const remoteOk = await submitRemoteEntry(entry);
    if (remoteOk) {
      alert('Thanks! Your entry is submitted for admin approval and will appear after approval.');
    } else {
      const fallback = readFallbackEntries();
      fallback.push(entry);
      writeFallbackEntries(fallback);
      mailToAdmin(entry);
      alert('Your entry has been saved and an email has been prepared for the admin to approve or deny it.');
    }

    event.currentTarget.reset();
    await refreshEntries();
  });
};

const bindMenu = () => {
  const btn = getById('menu-btn');
  const nav = getById('site-nav');
  if (!btn || !nav) return;

  const closeMenu = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(nav.classList.contains('open')));
  });

  // Close when any nav link is tapped (hash links scroll then menu should disappear)
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Close when tapping anywhere outside the nav/button
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== btn) closeMenu();
  });
};

const bindProgrammeClicks = () => {
  const grid = getById('programme-grid');
  if (!grid) return;
  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.event-card');
    if (!card) return;
    const index = Number(card.dataset.index);
    const eventItem = getSortedProgramme()[index];
    openEventDetail(eventItem);
  });
};

const bindEventDetail = () => {
  const closeButton = getById('close-event-detail');
  if (closeButton) closeButton.addEventListener('click', closeEventDetail);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeEventDetail();
  });
};

const renderAll = () => {
  renderTopContent();
  renderGallery(); // async — updates DOM when Supabase responds
  renderProgramme();
  renderTablers();
  renderSchema();
  refreshEntries();
  // Re-observe any newly rendered elements (rAF ensures layout is complete)
  if (window._revealObserver) {
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal:not(.in-view)').forEach(el => window._revealObserver.observe(el));
    });
  }
};

const initScrollReveal = () => {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  window._revealObserver = observer;
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

const initSite = async () => {
  injectLightbox();
  initScrollReveal();
  const remote = await fetchSiteData();
  if (remote) {
    data = mergeSiteData(remote);
  }
  bindGuestbook();
  bindMenu();
  bindProgrammeClicks();
  bindEventDetail();
  renderAll();
};

const shouldInitSite = () => Boolean(document.getElementById('hero-image'));

if (shouldInitSite()) {
  initSite();
}
