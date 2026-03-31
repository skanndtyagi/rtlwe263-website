const KEY = 'lwe623-content-v3';
const GUESTBOOK_KEY = 'lwe623-guestbook-fallback';

const defaultData = {
  heroTitle: 'The Westenders Guide 2026-2027',
  heroSubtitle:
    'A modern fellowship community for men under 45 — blending friendship, community impact, and unforgettable London socials.',
  about:
    'We are a vibrant Round Table based in central London. Across the year we host social nights, business meetings, volunteering initiatives, and national/international events. Our mission is simple: meaningful friendship, personal growth, and doing good while having fun.',
  heroImage: 'assets/hero.jpg',
  gallery: [
    'assets/gallery-01.jpg',
    'assets/gallery-02.jpg',
    'assets/gallery-03.jpg',
    'assets/gallery-04.jpg',
    'assets/gallery-05.jpg',
    'assets/gallery-06.jpg',
  ],
  integrations: {
    guestbookSubmitUrl: '',
    guestbookFeedUrl: '',
    adminDashboardUrl: '',
  },
  programme: {
    'April 2026': ['01 Apr: AGM | KoD | Owner: JB', '15 Apr: Albert Schloss Disko Wunderbar | Soho | Owner: Vedang'],
    'May 2026': ['06 May: Business Meeting | RT Pub | Owner: Vedang', '20 May: NQ64 Arcade | Soho | Owner: Ryan'],
    'June 2026': ['03 Jun: Padel | TBC | Owner: Satish', '17 Jun: Zoo Night / England vs Croatia | Owner: Amz'],
    'July 2026': ['05 Jul: F1 Silverstone | Owner: David / Ryan', '29 Jul: MI London vs London Spirits | Owner: Amz'],
    'August 2026': ['05 Aug: Thames Clipper River Pub Crawl | Owner: Ryan', '30 Aug: Picnic | Victoria Park | Owner: Vedang'],
    'September 2026': ['12-13 Sep: Westenders on Tour | Owner: Vedang', '30 Sep: Combined Social (Ladies Circle) | Owner: Jay'],
    'October 2026': ['04 Oct: MS-UK Tower Walk | Owner: Ryan', '31 Oct: Diwali Celebration | Owner: Vedang'],
    'November 2026': ['18 Nov: Business Meeting | RT Pub (LWE) | Owner: Vedang'],
    'December 2026': ['02 Dec: Hot Ones! Spicy Wing Night | Owner: Matteo', '16 Dec: LWE Christmas Tour / Markets | Owner: Amz'],
    'January 2027': ['06 Jan: Board Game Night @ Draughts | Owner: JB', '31 Jan: Volunteering Felix Project | Owner: Ryan'],
    'February 2027': ['03 Feb: Business Meeting | Owner: Vedang', '17 Feb: Duck Pin Bowling / Basketball Match | Owner: Amz'],
    'March 2027': ['03 Mar: Dungeons & Dragons | Owner: Kyle', "17 Mar: St. Patrick's Day Social | TBD"],
    'April 2027': ['07 Apr: AGM 2027 | TBD | Owner: Vedang'],
  },
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

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...defaultData,
      ...parsed,
      integrations: { ...defaultData.integrations, ...(parsed.integrations || {}) },
    };
  } catch {
    return defaultData;
  }
};
const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));
const esc = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

let data = load();

function renderGallery() {
  document.getElementById('gallery-grid').innerHTML = data.gallery
    .map((src, i) => `<figure class="anim-rise"><img src="${esc(src)}" alt="London West End gallery image ${i + 1}" loading="lazy" /></figure>`)
    .join('');
}

function renderProgramme() {
  document.getElementById('programme-grid').innerHTML = Object.entries(data.programme)
    .map(
      ([month, events]) => `<article class="month-card anim-rise"><h3>${esc(month)}</h3><ul>${events
        .map((e) => `<li>${esc(e)}</li>`)
        .join('')}</ul></article>`,
    )
    .join('');
}

function renderTablers() {
  document.getElementById('tablers-grid').innerHTML = data.tablers
    .map(
      (t) => `<article class="tabler-card anim-rise">
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
      </article>`,
    )
    .join('');
}

function renderTopContent() {
  document.getElementById('hero-title').textContent = data.heroTitle;
  document.getElementById('hero-subtitle').textContent = data.heroSubtitle;
  document.getElementById('about-copy').textContent = data.about;
  document.getElementById('hero-image').src = data.heroImage;

  const admin = document.getElementById('admin-approve-link');
  if (data.integrations.adminDashboardUrl) {
    admin.href = data.integrations.adminDashboardUrl;
    admin.hidden = false;
  } else {
    admin.hidden = true;
  }
}

function renderSchema() {
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
  document.getElementById('schema-org').textContent = JSON.stringify(schema);
}

function loadDashboard() {
  document.getElementById('dash-hero-title').value = data.heroTitle;
  document.getElementById('dash-hero-subtitle').value = data.heroSubtitle;
  document.getElementById('dash-about').value = data.about;
  document.getElementById('dash-hero-image').value = data.heroImage;
  document.getElementById('dash-gallery').value = data.gallery.join('\n');
  document.getElementById('dash-submit-url').value = data.integrations.guestbookSubmitUrl;
  document.getElementById('dash-feed-url').value = data.integrations.guestbookFeedUrl;
  document.getElementById('dash-admin-url').value = data.integrations.adminDashboardUrl;
}

function bindDashboard() {
  document.getElementById('save-dashboard').addEventListener('click', () => {
    data.heroTitle = document.getElementById('dash-hero-title').value.trim();
    data.heroSubtitle = document.getElementById('dash-hero-subtitle').value.trim();
    data.about = document.getElementById('dash-about').value.trim();
    data.heroImage = document.getElementById('dash-hero-image').value.trim() || defaultData.heroImage;
    data.gallery = document
      .getElementById('dash-gallery')
      .value.split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    data.integrations.guestbookSubmitUrl = document.getElementById('dash-submit-url').value.trim();
    data.integrations.guestbookFeedUrl = document.getElementById('dash-feed-url').value.trim();
    data.integrations.adminDashboardUrl = document.getElementById('dash-admin-url').value.trim();

    save(data);
    renderAll();
    alert('Saved. Content and integrations updated.');
  });

  document.getElementById('reset-dashboard').addEventListener('click', () => {
    localStorage.removeItem(KEY);
    data = load();
    renderAll();
  });
}

function readFallbackEntries() {
  try {
    return JSON.parse(localStorage.getItem(GUESTBOOK_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeFallbackEntries(entries) {
  localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(entries));
}

async function fetchApprovedEntries() {
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
}

function renderEntries(entries) {
  const list = document.getElementById('guestbook-list');
  list.innerHTML = entries.length
    ? entries
        .slice()
        .reverse()
        .map((e) => `<li class="anim-rise"><strong>${esc(e.name)}</strong> · ${esc(e.club)}<p>${esc(e.message)}</p></li>`)
        .join('')
    : '<li><strong>No approved entries yet.</strong><p>Be the first to sign the book.</p></li>';
}

async function refreshEntries() {
  const remote = await fetchApprovedEntries();
  if (remote) {
    renderEntries(remote.filter((e) => e && e.name && e.club && e.message));
    return;
  }
  renderEntries(readFallbackEntries());
}

async function submitRemoteEntry(entry) {
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
}

function bindGuestbook() {
  document.getElementById('guestbook-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
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
      alert('Thanks! Your entry is submitted for admin approval. It will appear after approval.');
    } else {
      const fallback = readFallbackEntries();
      fallback.push(entry);
      writeFallbackEntries(fallback);
      alert('Submitted in local demo mode (no remote moderation URL set yet).');
    }

    ev.currentTarget.reset();
    await refreshEntries();
  });
}

function bindMenu() {
  const btn = document.getElementById('menu-btn');
  const nav = document.getElementById('site-nav');
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(nav.classList.contains('open')));
  });
}

function renderAll() {
  renderTopContent();
  renderGallery();
  renderProgramme();
  renderTablers();
  renderSchema();
  loadDashboard();
  refreshEntries();
}

bindGuestbook();
bindDashboard();
bindMenu();
renderAll();
