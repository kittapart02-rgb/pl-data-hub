/* components/ui.js — StatCard, Crest, Avatar, FormPills, Tabs, Pagination, SortHeader,
   LoadingSkeleton, EmptyState, ErrorState and small primitives. All return HTML strings. */

function luminance(hex) {
  const n = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function crestTextColor(team) {
  const [c1, c2] = team.colors;
  if (luminance(c1) > 0.5) return '#0A1224';
  return luminance(c2) > 0.35 ? c2 : '#FFFFFF';
}

/* ---- Images ----
   IMAGE_MODE is injected by build.py:
     'none'     published page (its security policy blocks remote images) -> generated crests and initials
     'remote'   local HTML file that loads the official Premier League images over the internet
     'embedded' images downloaded by etl/embed_images.py and stored as data URIs in IMAGE_DATA
   Club crests and player photos are copyrighted/trademarked: for personal use, not for redistribution. */
const PL_IMG = {
  player: code => [`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`, `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`],
  team: code => [`https://resources.premierleague.com/premierleague25/badges/${code}.svg`, `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`],
};
function imageSources(kind, id) {
  const mode = typeof IMAGE_MODE === 'undefined' ? 'none' : IMAGE_MODE;
  if (mode === 'embedded') { const d = typeof IMAGE_DATA !== 'undefined' && IMAGE_DATA[kind === 'team' ? 'teams' : 'players'][id]; return d ? [d] : []; }
  if (mode !== 'remote') return [];
  const code = kind === 'team' ? REAL_DATA.teamCodes[id] : PEOPLE[id] && PEOPLE[id].code;
  return code ? PL_IMG[kind](code) : [];
}
/* onerror: try the next source, then fall back to the generated crest / initials */
function imgNext(img) {
  const alt = img.getAttribute('data-alt');
  if (alt) { img.removeAttribute('data-alt'); img.src = alt; return; }
  const tpl = img.nextElementSibling;
  if (tpl && tpl.tagName === 'TEMPLATE') img.replaceWith(tpl.content.cloneNode(true)); else img.remove();
}
const imgTag = (srcs, attrs) => `<img src="${esc(srcs[0])}" ${srcs[1] ? `data-alt="${esc(srcs[1])}"` : ''} ${attrs} loading="lazy" referrerpolicy="no-referrer" onerror="imgNext(this)">`;

/** Team crest — official badge when images are enabled, otherwise a generated monogram shield. */
function Crest(teamOrId, size = 28) {
  const t = typeof teamOrId === 'string' ? TEAM_BY_ID[teamOrId] : teamOrId;
  if (!t) return '';
  const [c1, c2] = t.colors; const txt = crestTextColor(t);
  const inner = `<svg class="crest" width="${size}" height="${Math.round(size * 1.12)}" viewBox="0 0 40 45" role="img" aria-label="${esc(t.name)} crest"><path d="M20 1.5 37 7v14.5C37 33 29 40.5 20 43.5 11 40.5 3 33 3 21.5V7z" fill="${c1}" stroke="${luminance(c1) > 0.5 ? '#C9D2E3' : c2}" stroke-opacity=".55" stroke-width="1.6"/><path d="M20 5 33.5 9.4V21.3C33.5 30.5 27.4 36.7 20 39.6" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/><text x="20" y="${t.short.length > 3 ? 25.5 : 26}" text-anchor="middle" font-family="Manrope, Inter, system-ui, sans-serif" font-weight="800" font-size="${size < 24 ? 12 : 11}" letter-spacing=".4" fill="${txt}">${esc(t.short)}</text></svg>`;
  const srcs = t.logo ? [t.logo] : imageSources('team', t.id);
  if (srcs.length) return `<span class="crest-wrap" style="width:${size}px;height:${Math.round(size * 1.12)}px">${imgTag(srcs, `alt="${esc(t.name)} crest" class="crest-img"`)}<template>${inner}</template></span>`;
  return inner;
}

function initials(name) {
  const parts = name.replace(/[^\p{L}\s-]/gu, '').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Player avatar — photo when available, otherwise club-coloured initials (also the image-error fallback). */
function Avatar(player, size = 36) {
  const t = TEAM_BY_ID[player.teamId] || TEAMS[0];
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px;--c1:${t.colors[0]};--c2:${t.colors[1]}`;
  const srcs = player.photo ? [player.photo] : player.id ? imageSources('player', player.id) : [];
  const img = srcs.length ? imgTag(srcs, 'alt=""') : '';
  return `<span class="avatar" style="${style}" aria-hidden="true"><span>${esc(initials(player.name))}</span>${img}</span>`;
}

function TeamLink(teamId, { crest = 22, short = false } = {}) {
  const t = TEAM_BY_ID[teamId];
  if (!t) return `<span class="team-inline">${Crest(null)}${esc(teamId)}</span>`;
  return `<a class="team-inline" href="#/teams/${t.id}">${Crest(t, crest)}<span>${esc(short ? t.short : t.name)}</span></a>`;
}
function ClubLabel(clubOrId) {
  return TEAM_BY_ID[clubOrId] ? TeamLink(clubOrId) : `<span class="team-inline ext"><span class="ext-dot" aria-hidden="true"></span><span>${esc(clubOrId)}</span></span>`;
}
function PlayerLink(p, { size = 32, meta = true } = {}) {
  const t = TEAM_BY_ID[p.teamId];
  return `<a class="player-inline" href="#/players/${p.id}">${Avatar(p, size)}<span class="pi-text"><span class="pi-name">${esc(p.name)}</span>${meta ? `<span class="pi-meta">${esc(t ? t.name : '')}</span>` : ''}</span></a>`;
}

function StatCard({ icon: ic, label, value, dec = 0, suffix = '', sub = '', tone = '' }) {
  return `<div class="stat-card ${tone}">
    <div class="stat-top">${ic ? `<span class="stat-icon">${icon(ic, 16)}</span>` : ''}<span class="stat-label">${esc(label)}</span></div>
    <div class="stat-value" data-count="${value}" data-dec="${dec}" data-suffix="${esc(suffix)}">${fmt.n(value, dec)}${esc(suffix)}</div>
    ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
  </div>`;
}

const RESULT_WORD = { W: 'Win', D: 'Draw', L: 'Loss' };
function FormPills(form, { links = null, size = '' } = {}) {
  if (!form || !form.length) return '<span class="muted">No matches yet</span>';
  return `<span class="form ${size}" aria-label="Form, oldest to newest: ${form.map(f => RESULT_WORD[f.res || f]).join(', ')}">${form.map((f, i) => {
    const res = f.res || f;
    const tip = f.opp ? `${RESULT_WORD[res]} ${f.gf}–${f.ga} ${f.venue === 'H' ? 'vs' : 'at'} ${TEAM_BY_ID[f.opp].name} (MW${f.mw})` : RESULT_WORD[res];
    return links && f.matchId ? `<a class="pill r-${res}" href="#/matches/${f.matchId}" data-tip="${esc(tip)}">${res}</a>` : `<span class="pill r-${res}" data-tip="${esc(tip)}">${res}</span>`;
  }).join('')}</span>`;
}

function Tabs(id, tabs, active, label) {
  return `<div class="tabs" role="tablist" aria-label="${esc(label)}" id="${id}">${tabs.map(([k, l]) => `<button role="tab" type="button" class="tab" data-tab="${k}" aria-selected="${k === active}" tabindex="${k === active ? 0 : -1}">${esc(l)}</button>`).join('')}</div>`;
}
/** Wires arrow-key navigation + selection for a Tabs() block. */
function bindTabs(root, id, onSelect) {
  const list = $('#' + id, root); if (!list) return;
  list.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; select(b); });
  list.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const tabs = $$('[role=tab]', list); const i = tabs.indexOf(document.activeElement);
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); select(n);
  });
  function select(b) { $$('[role=tab]', list).forEach(t => { t.setAttribute('aria-selected', t === b); t.tabIndex = t === b ? 0 : -1; }); onSelect(b.dataset.tab); }
}

function Pagination(page, pages, total, label = 'results') {
  if (pages <= 1) return `<div class="pager"><span class="muted">${fmt.n(total)} ${label}</span></div>`;
  const nums = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return `<nav class="pager" aria-label="Pagination"><span class="muted">${fmt.n(total)} ${label}</span><div class="pager-btns">
    <button type="button" class="btn-icon" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevronLeft', 16)}</button>
    ${nums.map(n => (n === '…' ? '<span class="pager-gap">…</span>' : `<button type="button" class="pager-num ${n === page ? 'on' : ''}" data-page="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`)).join('')}
    <button type="button" class="btn-icon" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Next page">${icon('chevronRight', 16)}</button></div></nav>`;
}

function SortTh(key, label, sort, dir, { num = true, title = '' } = {}) {
  const active = sort === key;
  const aria = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return `<th scope="col" class="${num ? 'num' : ''} ${active ? 'sorted' : ''}" aria-sort="${aria}"><button type="button" class="th-sort" data-sort="${key}" ${title ? `data-tip="${esc(title)}"` : ''}>${esc(label)}${icon(active ? (dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'sort', 12)}</button></th>`;
}

function Select(id, label, options, value, { hideLabel = false, disabled = false } = {}) {
  return `<label class="field ${hideLabel ? 'field-bare' : ''}" for="${id}"><span class="${hideLabel ? 'sr-only' : 'field-label'}">${esc(label)}</span>
    <span class="select-wrap"><select id="${id}" ${disabled ? 'disabled' : ''}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${icon('chevronDown', 14)}</span></label>`;
}
function SearchField(id, label, value, placeholder) {
  return `<label class="field" for="${id}"><span class="field-label">${esc(label)}</span><span class="input-wrap">${icon('search', 15)}<input id="${id}" type="search" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></span></label>`;
}
const seasonLabelLong = s => (s.partial ? `${s.label} (to GW${s.playedWeeks})` : s.label);
const seasonOptions = () => SEASONS.map(s => [s.id, seasonLabelLong(s)]);
const teamOptions = (all = 'All teams') => [['', all], ...repo(State.season).teams.map(id => TEAM_BY_ID[id]).sort((a, b) => a.name.localeCompare(b.name)).map(t => [t.id, t.name])];
const positionOptions = () => [['', 'All positions'], ['GK', 'Goalkeepers'], ['DF', 'Defenders'], ['MF', 'Midfielders'], ['FW', 'Forwards']];

function Skeleton(kind = 'page') {
  const line = (w, h = 12) => `<span class="sk" style="width:${w};height:${h}px"></span>`;
  const rows = n => Array.from({ length: n }, () => `<div class="sk-row">${line('32px', 32)}${line('38%')}${line('14%')}${line('10%')}${line('8%')}</div>`).join('');
  const cards = n => `<div class="grid-kpi">${Array.from({ length: n }, () => `<div class="card sk-card">${line('40%')}${line('55%', 28)}</div>`).join('')}</div>`;
  const map = {
    page: `${line('240px', 30)}${line('360px')}<div class="spacer"></div>${cards(4)}<div class="card">${rows(8)}</div>`,
    table: `<div class="card">${rows(10)}</div>`,
    grid: `<div class="grid-teams">${Array.from({ length: 8 }, () => `<div class="card sk-card tall">${line('44px', 50)}${line('60%', 16)}${line('40%')}</div>`).join('')}</div>`,
    profile: `<div class="card sk-hero">${line('120px', 120)}<div style="flex:1">${line('50%', 34)}${line('30%')}${line('60%')}</div></div>${cards(8)}<div class="card">${line('100%', 220)}</div>`,
  };
  return `<div class="skeleton" aria-busy="true" aria-live="polite"><span class="sr-only">Loading…</span>${map[kind] || map.page}</div>`;
}

function EmptyState(title, text, action = '') {
  return `<div class="state empty"><span class="state-icon">${icon('searchX', 26)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
}
function ErrorState(message) {
  return `<div class="state error" role="alert"><span class="state-icon">${icon('alert', 26)}</span><h3>${esc(message)}</h3><p class="muted">Try again. If you turned on “Simulate API failure” in Settings, turn it off first.</p>
    <div class="state-actions"><button type="button" class="btn btn-primary" data-action="retry">${icon('refresh', 16)}Retry</button><a class="btn btn-ghost" href="#/settings">Open settings</a></div></div>`;
}

function SectionHead(title, action = '', sub = '') {
  return `<div class="section-head"><div><h2>${esc(title)}</h2>${sub ? `<p class="section-sub">${sub}</p>` : ''}</div>${action}</div>`;
}
function PageHead(title, sub, right = '') {
  return `<header class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}</div>${right}</header>`;
}
