const form = document.getElementById('guestbook-form');
const list = document.getElementById('guestbook-list');
const storageKey = 'lwe623-guestbook';

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function renderEntries() {
  const entries = readEntries();

  if (!entries.length) {
    list.innerHTML = '<li><strong>No entries yet.</strong><p>Be the first to sign the Visiting Book.</p></li>';
    return;
  }

  list.innerHTML = entries
    .slice()
    .reverse()
    .map((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return `<li><strong>${escapeHtml(entry.name)}</strong> · ${escapeHtml(entry.club)} · ${date}<p>${escapeHtml(entry.message)}</p></li>`;
    })
    .join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const entry = {
    name: String(formData.get('name') || '').trim(),
    club: String(formData.get('club') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    createdAt: new Date().toISOString(),
  };

  if (!entry.name || !entry.club || !entry.message) {
    return;
  }

  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries);
  form.reset();
  renderEntries();
});

renderEntries();
