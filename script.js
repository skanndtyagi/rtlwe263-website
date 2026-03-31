const KEY = 'lwe623-content-v3';
const GUESTBOOK_KEY = 'lwe623-guestbook-fallback';
const ADMIN_EMAIL = 'london.westend@roundtable.org.uk';
const ADMIN_LOGIN_URL = 'https://londonwestend623.org/admin-login.html';

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

const save = (payload) => localStorage.setItem(KEY, JSON.stringify(payload));

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

const renderGallery = () => {
  const galleryGrid = getById('gallery-grid');
  if (!galleryGrid) return;
  if (!Array.isArray(data.gallery) || data.gallery.length === 0) {
    galleryGrid.innerHTML = '<div class="gallery-empty">No gallery images are configured yet. Add them from the admin dashboard.</div>';
    return;
  }
  galleryGrid.innerHTML = data.gallery
    .map((item, i) => {
      const src = item?.src || item;
      const caption = item?.caption || '';
      return `<figure class="anim-rise"><img src="${esc(src)}" alt="London West End gallery image ${i + 1}" loading="lazy" /><figcaption>${esc(caption)}</figcaption></figure>`;
    })
    .join('');
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
  grid.innerHTML = data.tablers
    .map((t) => `<article class="tabler-card anim-rise">
        <div class="tabler-card-inner">
          <div class="tabler-front">
            <img src="${esc(t.photo || 'assets/tabler-placeholder.jpg')}" alt="${esc(t.name)}" loading="lazy" />
            <h3>${esc(t.name)}</h3>
            <p class="title">${esc(t.title)}</p>
            <p class="tap-note">Tap/hover to read more</p>
          </div>
          <div class="tabler-back">
            <h3>${esc(t.name)}</h3>
            <p class="title">${esc(t.title)}</p>
            <p>${esc(t.bio)}</p>
          </div>
        </div>
      </article>`)
    .join('');
};

const renderSchema = () => {
  const schemaNode = getById('schema-org');
  if (!schemaNode) return;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Round Table London West End 623',
        email: 'london.westend@roundtable.org.uk',
        url: 'https://londonwestend623.org',
        sameAs: [
          'https://www.instagram.com/rtlondonwestend?igsh=MTV6b2VrYTR6enh6bg==',
          'https://www.facebook.com/share/1DAJHdvB5D/?mibextid=wwXIfr',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I join an event?',
            acceptedAnswer: { '@type': 'Answer', text: 'Contact us by email or social channels to express interest.' },
          },
          {
            '@type': 'Question',
            name: 'Can visiting Tablers attend socials?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Visitors are welcome; please message us in advance.' },
          },
        ],
      },
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
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(nav.classList.contains('open')));
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
  renderGallery();
  renderProgramme();
  renderTablers();
  renderSchema();
  refreshEntries();
};

bindGuestbook();
bindMenu();
bindProgrammeClicks();
bindEventDetail();
renderAll();
