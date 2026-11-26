'use strict';

// ---------- State ----------
const state = {
  token: localStorage.getItem('cc_token'),
  user: JSON.parse(localStorage.getItem('cc_user') || 'null'),
  authMode: 'login'
};

// ---------- DOM helpers ----------
const $ = (sel) => document.querySelector(sel);
const grid = $('#eventGrid');
const statusEl = $('#status');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- API wrapper (Fetch + async/await) ----------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ---------- Auth UI ----------
function renderAuthUI() {
  const loggedIn = !!state.user;
  $('#loginBtn').hidden = loggedIn;
  $('#registerBtn').hidden = loggedIn;
  $('#logoutBtn').hidden = !loggedIn;
  $('#userBadge').hidden = !loggedIn;
  $('#newEventBtn').hidden = !(loggedIn && state.user.role === 'organizer');
  if (loggedIn) $('#userBadge').textContent = `${state.user.name} (${state.user.role})`;
}

function openAuth(mode) {
  state.authMode = mode;
  $('#authTitle').textContent = mode === 'login' ? 'Login' : 'Create account';
  $('#nameRow').hidden = mode === 'login';
  $('#authError').textContent = '';
  $('#authForm').reset();
  $('#authModal').showModal();
}

$('#loginBtn').addEventListener('click', () => openAuth('login'));
$('#registerBtn').addEventListener('click', () => openAuth('register'));
$('#logoutBtn').addEventListener('click', () => {
  state.token = null; state.user = null;
  localStorage.removeItem('cc_token'); localStorage.removeItem('cc_user');
  renderAuthUI(); loadEvents();
});

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const data = await api(`/auth/${state.authMode}`, { method: 'POST', body: JSON.stringify(body) });
    state.token = data.token; state.user = data.user;
    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_user', JSON.stringify(data.user));
    $('#authModal').close();
    renderAuthUI(); loadEvents();
  } catch (err) {
    $('#authError').textContent = err.message;
  }
});

// ---------- Events ----------
function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function cardHTML(ev) {
  const uid = state.user?.id;
  const going = uid && ev.attendees.includes(uid);
  const mine = uid && ev.organizer?._id === uid;
  const left = ev.capacity - ev.attendees.length;
  return `
    <article class="card" data-id="${esc(ev._id)}">
      <span class="tag ${esc(ev.category)}">${esc(ev.category)}</span>
      <h3>${esc(ev.title)}</h3>
      <p>${esc(ev.description)}</p>
      <div class="meta">
        <span>🗓 ${formatDate(ev.date)}</span>
        <span>📍 ${esc(ev.venue)}</span>
        <span>🏷 ${esc(ev.club)} &middot; by ${esc(ev.organizer?.name || 'Unknown')}</span>
      </div>
      <span class="seats ${left <= 0 ? 'full' : ''}">${left > 0 ? left + ' seats left' : 'Fully booked'}</span>
      <div class="card-actions">
        <button class="btn ${going ? 'btn-ghost' : 'btn-primary'}" data-act="rsvp">${going ? 'Cancel RSVP' : 'RSVP'}</button>
        ${mine ? '<button class="btn btn-ghost" data-act="edit">Edit</button><button class="btn btn-danger" data-act="delete">Delete</button>' : ''}
      </div>
    </article>`;
}

let currentEvents = [];

async function loadEvents() {
  const params = new URLSearchParams();
  const q = $('#searchInput').value.trim();
  if (q) params.set('q', q);
  params.set('category', $('#categorySelect').value);
  params.set('upcoming', $('#upcomingCheck').checked);
  statusEl.textContent = 'Loading events...';
  try {
    currentEvents = await api(`/events?${params}`);
    grid.innerHTML = currentEvents.map(cardHTML).join('');
    statusEl.textContent = currentEvents.length ? '' : 'No events found. Try changing the filters.';
  } catch (err) {
    statusEl.textContent = `Could not load events: ${err.message}`;
  }
}

// Debounced search
let timer;
$('#searchInput').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadEvents, 350); });
$('#categorySelect').addEventListener('change', loadEvents);
$('#upcomingCheck').addEventListener('change', loadEvents);

// Event delegation for card buttons
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.closest('.card').dataset.id;
  const act = btn.dataset.act;
  try {
    if (act === 'rsvp') {
      if (!state.user) return openAuth('login');
      await api(`/events/${id}/rsvp`, { method: 'POST' });
      loadEvents();
    } else if (act === 'delete') {
      if (confirm('Delete this event?')) { await api(`/events/${id}`, { method: 'DELETE' }); loadEvents(); }
    } else if (act === 'edit') {
      openEventForm(currentEvents.find((x) => x._id === id));
    }
  } catch (err) { alert(err.message); }
});

// ---------- Event form (create / update) ----------
function openEventForm(ev) {
  const f = $('#eventForm');
  f.reset();
  $('#eventError').textContent = '';
  $('#eventTitle').textContent = ev ? 'Edit Event' : 'New Event';
  f.id.value = ev?._id || '';
  if (ev) {
    ['title', 'description', 'category', 'club', 'venue', 'capacity'].forEach((k) => (f[k].value = ev[k]));
    const d = new Date(ev.date);
    f.date.value = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  $('#eventModal').showModal();
}

$('#newEventBtn').addEventListener('click', () => openEventForm());

$('#eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  const id = body.id; delete body.id;
  body.date = new Date(body.date).toISOString();
  body.capacity = Number(body.capacity);
  try {
    await api(id ? `/events/${id}` : '/events', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    $('#eventModal').close();
    loadEvents();
  } catch (err) { $('#eventError').textContent = err.message; }
});

// Close buttons on dialogs
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

// ---------- Init ----------
renderAuthUI();
loadEvents();
