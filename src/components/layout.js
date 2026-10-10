/* components/layout.js — Layout shell: Sidebar, TopNavbar, GlobalSearch, SeasonSelector, notifications, Footer. */

const NAV = [
  { href: '#/', label: 'Home', icon: 'home', match: p => p === '/' },
  { href: '#/teams', label: 'Teams', icon: 'shield', match: p => p.startsWith('/teams') },
  { href: '#/players', label: 'Players', icon: 'users', match: p => p.startsWith('/players') },
  { href: '#/fixtures', label: 'Fixtures', icon: 'calendar', match: p => p.startsWith('/fixtures') || p.startsWith('/matches') },
  { href: '#/standings', label: 'Standings', icon: 'table', match: p => p.startsWith('/standings') },
  { href: '#/statistics', label: 'Statistics', icon: 'chart', match: (p, q) => p.startsWith('/statistics') && !['g', 'a'].includes(q.metric) },
  { href: '#/comparison', label: 'Comparison', icon: 'compare', match: p => p.startsWith('/comparison') },
  { href: '#/transfers', label: 'Transfers', icon: 'transfer', match: p => p.startsWith('/transfers') },
];
const DISCOVER = [
  { href: '#/statistics?metric=g', label: 'Top scorers', icon: 'target', match: (p, q) => p.startsWith('/statistics') && q.metric === 'g' },
  { href: '#/statistics?metric=a', label: 'Top assists', icon: 'share', match: (p, q) => p.startsWith('/statistics') && q.metric === 'a' },
  { href: '#/fixture-difficulty', label: 'Fixture difficulty', icon: 'activity', match: p => p.startsWith('/fixture-difficulty') },
  { href: '#/records', label: 'Team records', icon: 'trophy', match: p => p.startsWith('/records') },
];

function Logo() {
  return `<a href="#/" class="logo" aria-label="PL Data Hub home"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="url(#lg)"/><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C4DFF"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><circle cx="17" cy="17" r="8.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M17 8.5v17M8.5 17h17" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><circle cx="17" cy="17" r="2.4" fill="#fff"/></svg><span class="logo-text"><b>PL</b><span>Data Hub</span></span></a>`;
}

function Sidebar() {
  const item = n => `<li><a href="${n.href}" class="nav-item" data-nav="${n.href}" data-tip-compact="${esc(n.label)}">${icon(n.icon, 18)}<span class="nav-label">${esc(n.label)}</span></a></li>`;
  const initialsName = initials(Settings.get('displayName') || 'Guest');
  return `<div class="sidebar-inner">${Logo()}
    <nav aria-label="Main"><ul class="nav-list">${NAV.map(item).join('')}</ul>
    <p class="nav-group" id="discover-h">Discover</p><ul class="nav-list" aria-labelledby="discover-h">${DISCOVER.map(item).join('')}</ul></nav>
    <div class="sidebar-bottom"><ul class="nav-list">${item({ href: '#/settings', label: 'Settings', icon: 'settings' })}</ul>
    <a href="#/settings?section=profile" class="profile-chip" data-tip-compact="Your profile"><span class="avatar me">${esc(initialsName)}</span><span class="nav-label"><strong data-bind="displayName">${esc(Settings.get('displayName'))}</strong><span>View profile</span></span></a></div></div>`;
}

function TopNav() {
  return `<div class="topbar-inner">
    <button type="button" class="btn-icon only-mobile" id="menu-btn" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${icon('menu', 20)}</button>
    <div class="crumbs" id="crumbs" aria-label="Breadcrumb"></div>
    <div class="search" id="search" role="search">
      <div class="search-box">${icon('search', 16)}<input id="search-input" type="text" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" aria-label="Search players, teams, matches" placeholder="Search players, teams, matches…" autocomplete="off"><kbd class="hide-mobile">/</kbd>
      <button type="button" class="btn-icon search-clear" id="search-clear" aria-label="Clear search" hidden>${icon('x', 14)}</button></div>
      <div class="search-results" id="search-results" role="listbox" aria-label="Search results" hidden></div>
    </div>
    <div class="top-right">
      <button type="button" class="btn-icon lang-btn" id="lang-btn" aria-label="${Settings.get('lang') === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}">${Settings.get('lang') === 'th' ? 'EN' : 'TH'}</button>
      <a class="demo-badge real" href="#/settings?section=about" data-tip="Real data from the Fantasy Premier League API (via vaastav/Fantasy-Premier-League). Select for sources and coverage.">Real data</a>
      <label class="season-select"><span class="sr-only">Season</span><select id="season-select">${SEASONS.map(s => `<option value="${s.id}">${seasonLabelLong(s)}</option>`).join('')}</select>${icon('chevronDown', 14)}</label>
      <div class="pop-wrap"><button type="button" class="btn-icon" id="notif-btn" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notif-pop">${icon('bell', 19)}<span class="dot" id="notif-dot"></span></button>
        <div class="popover" id="notif-pop" hidden></div></div>
      <div class="pop-wrap"><button type="button" class="avatar me btn-avatar" id="user-btn" aria-label="Account menu" aria-haspopup="true" aria-expanded="false" aria-controls="user-pop">${esc(initials(Settings.get('displayName') || 'Guest'))}</button>
        <div class="popover" id="user-pop" hidden><div class="pop-head"><strong data-bind="displayName">${esc(Settings.get('displayName'))}</strong><span class="muted">Local profile</span></div>
          <a class="pop-link" href="#/settings?section=profile">${icon('user', 16)}Profile</a><a class="pop-link" href="#/settings">${icon('settings', 16)}Settings</a></div></div>
    </div></div>`;
}

function Footer() {
  return `<footer class="footer"><div class="footer-top"><div><div class="footer-brand">${Logo()}</div><p class="muted">Football data. Deeper insights.</p></div>
    <nav aria-label="Footer"><a href="#/teams">Teams</a><a href="#/players">Players</a><a href="#/statistics">Statistics</a><a href="#/fixtures">Fixtures</a><a href="#/settings?section=about">About</a></nav></div>
    <div class="footer-stats"><span><b>20</b> teams</span><span><b>380</b> matches per season</span><span><b>${fmt.n(Object.keys(PEOPLE).length)}</b> players across ${SEASONS.length} seasons</span><span><b>1</b> league</span></div>
    <p class="footer-note">Data: Fantasy Premier League API snapshots via github.com/vaastav/Fantasy-Premier-League and github.com/olbauday/FPL-Core-Insights; scores cross-checked against openfootball. Coverage ${SEASONS[SEASONS.length - 1].label} to ${SEASONS[0].label} (to gameweek ${SEASONS[0].playedWeeks}). Not affiliated with the Premier League, its clubs or FPL.</p></footer>`;
}

function updateNavActive() {
  const { path, query } = Router.current();
  $$('[data-nav]').forEach(a => {
    const n = [...NAV, ...DISCOVER].find(x => x.href === a.dataset.nav) || { match: p => p.startsWith('/settings') };
    const on = n.match(path, query);
    a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

function setCrumbs(items) {
  const el = $('#crumbs');
  el.innerHTML = `<ol>${items.map((c, i) => `<li>${i < items.length - 1 && c.href ? `<a href="${c.href}">${esc(c.label)}</a>${icon('chevronRight', 13)}` : `<span aria-current="page">${esc(c.label)}</span>`}</li>`).join('')}</ol>`;
  document.title = `${items[items.length - 1].label} · PL Data Hub`;
}

/* ---- Global search (autocomplete, keyboard navigable; navigates only on selection) ---- */
function initSearch() {
  const input = $('#search-input'), box = $('#search-results'), clear = $('#search-clear');
  let items = [], active = -1, token = 0;
  const mqS = window.matchMedia && window.matchMedia('(max-width: 760px)');
  const ph = () => { input.placeholder = mqS && mqS.matches ? 'Search' : 'Search players, teams, matches…'; if (typeof I18n !== 'undefined' && I18n.lang === 'th') I18n.translate(input); };
  ph(); mqS && mqS.addEventListener && mqS.addEventListener('change', ph);
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; input.removeAttribute('aria-activedescendant'); };
  const open = () => { box.hidden = false; input.setAttribute('aria-expanded', 'true'); };
  const setActive = i => {
    const opts = $$('[role=option]', box); if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach((o, k) => o.setAttribute('aria-selected', k === active));
    input.setAttribute('aria-activedescendant', opts[active].id); opts[active].scrollIntoView({ block: 'nearest' });
  };
  const choose = href => { close(); input.value = ''; clear.hidden = true; input.blur(); document.body.classList.remove('search-open'); Router.go(href); };
  const render = (q, res) => {
    items = [];
    const group = (title, list, fn) => (list.length ? `<div class="sr-group" role="presentation"><p class="sr-title">${title}</p>${list.map(x => { const o = fn(x); items.push(o.href); return `<div role="option" id="sr-${items.length - 1}" class="sr-item" data-href="${o.href}" aria-selected="false">${o.html}</div>`; }).join('')}</div>` : '');
    const html = group('Teams', res.teams, t => ({ href: `#/teams/${t.id}`, html: `${Crest(t, 26)}<span class="sr-main"><strong>${esc(t.name)}</strong><span>${esc(stadiumFor(t, repo(State.season).season.startYear))}</span></span>` }))
      + group('Players', res.players, p => ({ href: `#/players/${p.id}`, html: `${Avatar(p, 28)}<span class="sr-main"><strong>${esc(p.name)}</strong><span>${esc(TEAM_BY_ID[p.teamId].name)}, ${esc(POSITION_LABEL[p.position])}</span></span>` }))
      + group('Matches', res.matches, m => ({ href: `#/matches/${m.id}`, html: `<span class="sr-match">${Crest(m.home, 20)}${Crest(m.away, 20)}</span><span class="sr-main"><strong>${esc(TEAM_BY_ID[m.home].name)} ${m.score ? `${m.score.home}–${m.score.away}` : 'vs'} ${esc(TEAM_BY_ID[m.away].name)}</strong><span>${fmt.date(m.date)}, matchweek ${m.matchweek}</span></span>` }));
    box.innerHTML = html || `<div class="sr-empty">No players, teams or matches match “${esc(q)}”.</div>`;
    open(); active = -1;
  };
  const run = debounce(async q => {
    const my = ++token;
    if (q.trim().length < 2) { close(); return; }
    try { const res = await API.search(q, { season: State.season }); if (my === token && input.value === q) render(q, res); }
    catch (e) { if (my === token) { box.innerHTML = `<div class="sr-empty">Search is unavailable: ${esc(e.message)}</div>`; open(); } }
  }, 140);
  input.addEventListener('input', () => { clear.hidden = !input.value; run(input.value); });
  input.addEventListener('focus', () => { if (input.value.trim().length >= 2) run(input.value); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (box.hidden) run(input.value); else setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { const opts = $$('[role=option]', box); const o = opts[active >= 0 ? active : 0]; if (!box.hidden && o) { e.preventDefault(); choose(o.dataset.href); } }
    else if (e.key === 'Escape') { close(); }
  });
  box.addEventListener('mousedown', e => e.preventDefault());
  box.addEventListener('click', e => { const o = e.target.closest('[role=option]'); if (o) choose(o.dataset.href); });
  clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; close(); input.focus(); });
  document.addEventListener('click', e => { if (!e.target.closest('#search')) close(); });
  document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); input.focus(); } });
}

function initPopovers() {
  const pairs = [['#notif-btn', '#notif-pop'], ['#user-btn', '#user-pop']];
  const closeAll = except => pairs.forEach(([b, p]) => { if (p !== except) { $(p).hidden = true; $(b).setAttribute('aria-expanded', 'false'); } });
  pairs.forEach(([b, p]) => $(b).addEventListener('click', e => {
    e.stopPropagation(); const pop = $(p); const willOpen = pop.hidden; closeAll(p);
    pop.hidden = !willOpen; $(b).setAttribute('aria-expanded', String(willOpen));
    if (willOpen && p === '#notif-pop') renderNotifications();
  }));
  document.addEventListener('click', e => { if (!e.target.closest('.pop-wrap')) closeAll(); if (e.target.closest('.popover a')) closeAll(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  $('#notif-dot').hidden = !!Settings.get('notificationsRead');
}

function renderNotifications() {
  const R = repo(State.season);
  const next = R.matches.find(m => m.status === 'scheduled');
  const leader = R.standings[0]; const scorer = R.players.slice().sort((a, b) => b.stats.g - a.stats.g)[0];
  const items = [
    next ? { icon: 'calendar', text: `Matchweek ${next.matchweek} kicks off ${fmt.date(next.date)}`, href: '#/fixtures' } : { icon: 'flag', text: `${R.season.label} is complete`, href: '#/standings' },
    { icon: 'trophy', text: `${TEAM_BY_ID[leader.teamId].name} ${R.season.playedWeeks < 38 ? 'lead' : 'finished top'} with ${leader.pts} points`, href: '#/standings' },
    { icon: 'target', text: `${scorer.name} leads the scoring charts on ${scorer.stats.g}`, href: `#/players/${scorer.id}` },
    { icon: 'info', text: `Data covers ${SEASONS[SEASONS.length - 1].label} to ${SEASONS[0].label} (${SEASONS[0].label} to gameweek ${SEASONS[0].playedWeeks})`, href: '#/settings?section=about' },
  ];
  const pop = $('#notif-pop');
  pop.innerHTML = `<div class="pop-head row"><strong>Notifications</strong><button type="button" class="link-btn" id="notif-read">Mark all as read</button></div>
    ${items.map(i => `<a class="pop-link ${Settings.get('notificationsRead') ? '' : 'unread'}" href="${i.href}">${icon(i.icon, 16)}<span>${esc(i.text)}</span></a>`).join('')}`;
  $('#notif-read').addEventListener('click', e => { e.stopPropagation(); Settings.set('notificationsRead', true); $('#notif-dot').hidden = true; renderNotifications(); });
}

function initDrawer() {
  const btn = $('#menu-btn'), side = $('#sidebar'), scrim = $('#scrim');
  const set = open => {
    document.body.classList.toggle('drawer-open', open); btn.setAttribute('aria-expanded', String(open)); scrim.hidden = !open;
    if (open) { side.setAttribute('role', 'dialog'); side.setAttribute('aria-modal', 'true'); side.setAttribute('aria-label', 'Navigation'); const f = $('a', side); f && f.focus(); }
    else { side.removeAttribute('role'); side.removeAttribute('aria-modal'); side.removeAttribute('aria-label'); }
  };
  btn.addEventListener('click', () => set(true));
  scrim.addEventListener('click', () => set(false));
  side.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) { set(false); btn.focus(); } });
  // compact sidebar (tablet) shows labels as tooltips
  const mq = window.matchMedia ? window.matchMedia('(min-width: 761px) and (max-width: 1180px)') : null;
  const syncTips = () => $$('[data-tip-compact]', side).forEach(a => { if (mq && mq.matches) a.setAttribute('data-tip', a.dataset.tipCompact); else a.removeAttribute('data-tip'); });
  syncTips(); mq && mq.addEventListener && mq.addEventListener('change', syncTips);
}

function initSeasonSelect() {
  const sel = $('#season-select'); sel.value = State.season;
  sel.addEventListener('change', () => State.setSeason(sel.value));
  State.onSeason(id => { sel.value = id; $$('select[data-season-mirror]').forEach(s => { s.value = id; }); });
}
