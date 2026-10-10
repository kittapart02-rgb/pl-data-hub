/* lib/core.js — settings, global state, DOM + format helpers, icons, router. */

const Settings = (() => {
  const KEY = 'pldh:settings';
  const defaults = { defaultSeason: DEFAULT_SEASON, reduceMotion: false, latency: 'normal', simulateFailure: false, displayName: 'Guest analyst', notificationsRead: false };
  let data = { ...defaults };
  try { data = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* storage unavailable */ }
  return {
    get: k => data[k],
    set(k, v) { data[k] = v; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } },
    reset() { data = { ...defaults }; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
  };
})();

const State = {
  season: SEASONS.some(s => s.id === Settings.get('defaultSeason')) ? Settings.get('defaultSeason') : DEFAULT_SEASON,
  listeners: [],
  setSeason(id) { if (id === this.season) return; this.season = id; this.listeners.forEach(fn => fn(id)); },
  onSeason(fn) { this.listeners.push(fn); },
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const seasonLabel = id => (SEASONS.find(s => s.id === id) || {}).label || id;
const reducedMotion = () => Settings.get('reduceMotion') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const fmt = {
  n: (v, d = 0) => (v == null || Number.isNaN(v) ? '–' : Number(v).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })),
  signed: v => (v > 0 ? `+${v}` : `${v}`),
  date: iso => !iso ? 'TBC' : new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
  dateLong: iso => !iso ? 'Date to be confirmed' : new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  month: ym => new Date(ym + '-15T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  fee: f => (f === 'loan' ? 'Loan' : f == null ? 'Free' : `£${fmt.n(f, f % 1 ? 1 : 0)}m`),
  metric: (m, v) => (v == null ? '–' : fmt.n(v, m.dec) + (m.suffix || '')),
  minute: m => (m > 90 ? `90+${m - 90}′` : `${m}′`),
};

/* Lucide icon paths (ISC licence), inlined so the page has no icon dependency. */
const ICON_PATHS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  table: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  compare: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  transfer: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  settings: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  sort: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  ball: '<circle cx="12" cy="12" r="10"/><path d="m12 7 4 3-1.5 4.5h-5L8 10z"/><path d="M12 2v5M16 10l5-1.5M14.5 14.5l2.5 4.5M9.5 14.5 7 19M8 10 3 8.5"/>',
  searchX: '<path d="m13.5 8.5-5 5M8.5 8.5l5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  swap: '<path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3 14 10"/><path d="M3 21l7-7"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  stadium: '<ellipse cx="12" cy="8" rx="9" ry="4"/><path d="M3 8v6c0 2.2 4 4 9 4s9-1.8 9-4V8"/>',
};
const icon = (name, size = 18, cls = '') => `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name] || ''}</svg>`;

/* ---- hash router ---- */
const Router = {
  routes: [],
  add(pattern, handler, meta = {}) {
    const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    this.routes.push({ pattern, re, keys, handler, meta });
  },
  current() {
    const raw = (location.hash || '#/').slice(1) || '/';
    const [path, qs = ''] = raw.split('?');
    return { path, query: Object.fromEntries(new URLSearchParams(qs)), raw };
  },
  match(path) {
    for (const r of this.routes) { const m = path.match(r.re); if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; }
    return null;
  },
  go(hash) { if (location.hash === hash) this.onChange && this.onChange(); else location.hash = hash; },
  setQuery(q, { replace = true } = {}) {
    const { path } = this.current();
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== '' && v != null)).toString();
    const h = '#' + path + (qs ? '?' + qs : '');
    if (replace) history.replaceState(null, '', h); else location.hash = h;
  },
};

/* ---- tooltip (charts, zone markers, compact sidebar) ---- */
const Tip = {
  el: null,
  init() {
    this.el = document.createElement('div'); this.el.className = 'tip'; this.el.setAttribute('role', 'tooltip'); document.body.appendChild(this.el);
    const show = (t, x, y) => { const txt = t.getAttribute('data-tip'); if (!txt) return; this.el.textContent = txt; this.el.classList.add('show'); this.place(x, y, t); };
    document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) show(t, e.clientX, e.clientY); else this.hide(); });
    document.addEventListener('mousemove', e => { if (this.el.classList.contains('show')) this.place(e.clientX, e.clientY); });
    document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) { const b = t.getBoundingClientRect(); show(t, b.left + b.width / 2, b.top); } });
    document.addEventListener('focusout', () => this.hide());
    document.addEventListener('scroll', () => this.hide(), true);
  },
  place(x, y) {
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    let left = x + 14, top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    this.el.style.left = `${Math.max(8, left)}px`; this.el.style.top = `${top}px`;
  },
  hide() { this.el && this.el.classList.remove('show'); },
};

/* ---- count-up for [data-count] ---- */
function animateCounts(root) {
  $$('[data-count]', root).forEach(el => {
    const target = Number(el.dataset.count); const dec = Number(el.dataset.dec || 0); const suffix = el.dataset.suffix || '';
    if (reducedMotion() || !window.requestAnimationFrame) { el.textContent = fmt.n(target, dec) + suffix; return; }
    const t0 = performance.now(), dur = 900;
    const step = t => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt.n(target * e, dec) + suffix; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
