/* components/football.js — LeagueTable, PlayerTable, FixtureCard, MatchRow, MatchStatBars,
   MatchEvents, ComparisonCard. */

const ZONES = {
  ucl: { label: 'Champions League', short: 'UCL', tip: 'Positions 1–4 qualify for the UEFA Champions League league phase.' },
  uel: { label: 'Europa League', short: 'UEL', tip: 'Positions 5–6 qualify for the UEFA Europa League (subject to cup winners).' },
  rel: { label: 'Relegation', short: 'REL', tip: 'Positions 18–20 are relegated to the EFL Championship.' },
};

function LeagueTable(rows, { full = false, form = false, highlight = null, caption = 'Premier League table' } = {}) {
  return `<div class="table-scroll"><table class="data-table league ${full ? 'full' : 'compact'}"><caption class="sr-only">${esc(caption)}</caption>
    <thead><tr><th scope="col" class="pos">#</th><th scope="col">Team</th><th scope="col" class="num" data-tip="Matches played">MP</th><th scope="col" class="num">W</th><th scope="col" class="num">D</th><th scope="col" class="num">L</th>
    ${full ? '<th scope="col" class="num" data-tip="Goals for">GF</th><th scope="col" class="num" data-tip="Goals against">GA</th>' : ''}
    <th scope="col" class="num" data-tip="Goal difference">GD</th><th scope="col" class="num strong">Pts</th>${form ? '<th scope="col" class="form-col">Form</th>' : ''}</tr></thead>
    <tbody>${rows.map(r => {
      const t = TEAM_BY_ID[r.teamId]; const z = r.zone ? ZONES[r.zone] : null;
      return `<tr class="${z ? 'zone-' + r.zone : ''} ${highlight === r.teamId ? 'hl' : ''}" data-href="#/teams/${t.id}">
        <td class="pos"><span class="pos-num">${r.position}</span>${z ? `<span class="zone-tag" data-tip="${esc(z.label + ': ' + z.tip)}">${z.short}<span class="sr-only"> (${esc(z.label)})</span></span>` : ''}</td>
        <td class="team-cell"><a href="#/teams/${t.id}" class="team-inline">${Crest(t, 22)}<span class="t-full">${esc(t.name)}</span><span class="t-short">${esc(t.short)}</span></a></td>
        <td class="num">${r.mp}</td><td class="num">${r.w}</td><td class="num">${r.d}</td><td class="num">${r.l}</td>
        ${full ? `<td class="num">${r.gf}</td><td class="num">${r.ga}</td>` : ''}
        <td class="num">${fmt.signed(r.gd)}</td><td class="num strong">${r.pts}</td>
        ${form ? `<td class="form-col">${FormPills(r.results.slice(-5), { links: true })}</td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>`;
}

const PLAYER_COLUMNS = [
  ['name', 'Player', false], ['team', 'Team', false], ['position', 'Pos', false], ['age', 'Age', true], ['apps', 'Apps', true, 'Appearances'], ['min', 'Min', true, 'Minutes played'],
  ['g', 'Goals', true], ['a', 'Ast', true, 'Assists'], ['xg', 'xG', true, 'Expected goals'], ['xa', 'xA', true, 'Expected assists'], ['pts', 'FPL pts', true, 'Fantasy Premier League points'],
];
function PlayerTable(rows, sort, dir, hasXg = true) {
  return `<div class="table-scroll"><table class="data-table players"><caption class="sr-only">Players</caption><thead><tr>
    ${PLAYER_COLUMNS.map(([k, l, num, title]) => SortTh(k, l, sort, dir, { num, title })).join('')}</tr></thead>
    <tbody>${rows.map(p => `<tr data-href="#/players/${p.id}">
      <td class="player-cell">${PlayerLink(p, { size: 32, meta: false })}</td>
      <td>${TeamLink(p.teamId, { crest: 18, short: true })}</td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td class="num">${p.age ?? '–'}</td><td class="num">${p.stats.apps}</td><td class="num">${fmt.n(p.stats.min)}</td>
      <td class="num strong">${p.stats.g}</td><td class="num">${p.stats.a}</td><td class="num">${hasXg ? fmt.n(p.stats.xg, 1) : '–'}</td><td class="num">${hasXg ? fmt.n(p.stats.xa, 1) : '–'}</td>
      <td class="num">${p.stats.pts}</td></tr>`).join('')}</tbody></table></div>`;
}

function Scoreline(m) {
  return m.status === 'finished' ? `<span class="score" aria-label="${m.score.home} to ${m.score.away}">${m.score.home}<i>–</i>${m.score.away}</span>` : `<span class="ko">${esc(m.time)}</span>`;
}

function FixtureCard(m) {
  const H = TEAM_BY_ID[m.home], A = TEAM_BY_ID[m.away]; const done = m.status === 'finished';
  const label = done ? `${H.name} ${m.score.home}, ${A.name} ${m.score.away}. Full time.` : `${H.name} versus ${A.name}, ${fmt.date(m.date)} at ${m.time}`;
  return `<a class="fixture-card" href="#/matches/${m.id}" aria-label="${esc(label)}">
    <div class="fc-meta"><span>${icon('calendar', 13)}${fmt.date(m.date)}</span><span>${done ? 'Full time' : `${icon('clock', 13)}${esc(m.time)}`}</span></div>
    <div class="fc-body">
      <span class="fc-team">${Crest(H, 34)}<span>${esc(H.name)}</span></span>
      <span class="fc-mid">${done ? Scoreline(m) : '<span class="vs">vs</span>'}</span>
      <span class="fc-team away">${Crest(A, 34)}<span>${esc(A.name)}</span></span>
    </div>
    <div class="fc-foot">${icon('pin', 13)}${esc(m.stadium)}</div></a>`;
}

function MatchRow(m, { perspective = null } = {}) {
  const H = TEAM_BY_ID[m.home], A = TEAM_BY_ID[m.away]; const done = m.status === 'finished';
  let res = '';
  if (done && perspective) { const gf = perspective === m.home ? m.score.home : m.score.away; const ga = perspective === m.home ? m.score.away : m.score.home; const r = gf > ga ? 'W' : gf === ga ? 'D' : 'L'; res = `<span class="pill r-${r}" aria-label="${RESULT_WORD[r]}">${r}</span>`; }
  return `<a class="match-row" href="#/matches/${m.id}">
    <span class="mr-date">${fmt.date(m.date)}</span>
    <span class="mr-team home"><span class="n-full">${esc(H.name)}</span><span class="n-short">${esc(H.short)}</span>${Crest(H, 22)}</span>
    <span class="mr-mid">${Scoreline(m)}</span>
    <span class="mr-team">${Crest(A, 22)}<span class="n-full">${esc(A.name)}</span><span class="n-short">${esc(A.short)}</span></span>${res}</a>`;
}

function MatchStatBars(m) {
  const H = m.stats.home, A = m.stats.away; const si = m.seasonInfo; const O = m.opta;
  const rows = [['Goals', H.goals, A.goals, 0]];
  if (O) rows.push(['Possession (%)', O.home.possession, O.away.possession, 0], ['Shots', O.home.total_shots, O.away.total_shots, 0], ['Shots on target', O.home.shots_on_target, O.away.shots_on_target, 0],
    ['Big chances', O.home.big_chances, O.away.big_chances, 0], ['Pass accuracy (%)', O.home.accurate_passes_pct, O.away.accurate_passes_pct, 0], ['Corners', O.home.corners, O.away.corners, 0], ['Fouls', O.home.fouls_committed, O.away.fouls_committed, 0]);
  if (si.hasXg) rows.push(['Expected goals (xG)', H.xg, A.xg, 2], ['Expected assists (xA)', H.xa, A.xa, 2]);
  rows.push(['Goalkeeper saves', H.saves, A.saves, 0]);
  if (si.hasDefensive) rows.push(['Tackles', H.tackles, A.tackles, 0], ['Clearances, blocks & interceptions', H.cbi, A.cbi, 0]);
  rows.push(['Yellow cards', H.yellow, A.yellow, 0], ['Red cards', H.red, A.red, 0], ['Bonus points', H.bonus, A.bonus, 0], ['Players used', H.players, A.players, 0]);
  return `<div class="stat-bars">${rows.map(([l, h, a, d]) => {
    const tot = h + a; const hw = tot ? (h / tot) * 100 : 50;
    const lead = h === a ? '' : h > a ? 'home' : 'away';
    return `<div class="sb-row"><div class="sb-top"><span class="sb-val ${lead === 'home' ? 'lead' : ''}">${fmt.n(h, d)}</span><span class="sb-label">${esc(l)}</span><span class="sb-val ${lead === 'away' ? 'lead' : ''}">${fmt.n(a, d)}</span></div>
      <div class="sb-track" aria-hidden="true"><span class="sb-h" style="width:${hw}%"></span><span class="sb-a" style="width:${100 - hw}%"></span></div></div>`;
  }).join('')}</div>`;
}

const EVENT_LABEL = { goal: 'Goals', og: 'Own goals (credited to this side)', assist: 'Assists', pensave: 'Penalties saved', penmiss: 'Penalties missed', yellow: 'Yellow cards', red: 'Red cards' };
function eventGlyph(type) {
  if (type === 'goal' || type === 'og') return `<span class="ev-glyph goal">${icon('ball', 14)}</span>`;
  if (type === 'assist') return `<span class="ev-glyph sub">${icon('share', 13)}</span>`;
  if (type === 'yellow') return '<span class="ev-glyph ev-card yellow"></span>';
  if (type === 'red') return '<span class="ev-glyph ev-card red"></span>';
  return `<span class="ev-glyph sub">${icon('target', 13)}</span>`;
}
/** Match events grouped by type. The source records who scored/assisted/was booked, not the minute. */
function MatchEvents(m) {
  const name = pid => (m.players.find(p => p.pid === pid) || {}).name || pid;
  const types = ['goal', 'og', 'assist', 'pensave', 'penmiss', 'yellow', 'red'].filter(t => m.events.some(e => e.type === t));
  if (!types.length) return '<p class="muted">No goals, cards or penalty events.</p>';
  const list = (t, side) => m.events.filter(e => e.type === t && e.side === side)
    .map(e => `<li><a href="#/players/${e.pid}">${esc(name(e.pid))}</a>${e.n > 1 ? ` <span class="ev-n">×${e.n}</span>` : ''}${t === 'og' ? ' <span class="ev-n">(og)</span>' : ''}</li>`).join('');
  return `<div class="events">${types.map(t => `<div class="ev-row"><ul class="ev-home">${list(t, 'home')}</ul><span class="ev-type">${eventGlyph(t)}<span>${esc(EVENT_LABEL[t].split(' (')[0])}</span></span><ul class="ev-away">${list(t, 'away')}</ul></div>`).join('')}</div>
    <p class="fine">Event minutes are not included in the source data, so events are grouped by type rather than shown on a timeline.</p>`;
}

function CompareRow(label, a, b, { dec = 0, suffix = '', lowerBetter = false } = {}) {
  const lead = a === b ? 0 : (a > b) !== lowerBetter ? -1 : 1;
  return `<div class="cmp-row"><span class="cmp-v ${lead === -1 ? 'lead' : ''}">${fmt.n(a, dec)}${suffix}${lead === -1 ? '<span class="sr-only"> (leads)</span>' : ''}</span><span class="cmp-l">${esc(label)}</span><span class="cmp-v ${lead === 1 ? 'lead' : ''}">${fmt.n(b, dec)}${suffix}${lead === 1 ? '<span class="sr-only"> (leads)</span>' : ''}</span></div>`;
}
function ComparisonCard(a, b, hasXg = true) {
  return `<div class="card cmp-card"><div class="cmp-head">
    <a href="#/players/${a.id}" class="cmp-p">${Avatar(a, 56)}<strong>${esc(a.name)}</strong><span>${esc(TEAM_BY_ID[a.teamId].name)}</span></a>
    <span class="cmp-vs">vs</span>
    <a href="#/players/${b.id}" class="cmp-p">${Avatar(b, 56)}<strong>${esc(b.name)}</strong><span>${esc(TEAM_BY_ID[b.teamId].name)}</span></a></div>
    ${CompareRow('Goals', a.stats.g, b.stats.g)}${CompareRow('Assists', a.stats.a, b.stats.a)}${hasXg ? CompareRow('xG', a.stats.xg, b.stats.xg, { dec: 1 }) : CompareRow('Minutes', a.stats.min, b.stats.min)}${CompareRow('FPL points', a.stats.pts, b.stats.pts)}
    <a class="btn btn-primary block" href="#/comparison?a=${a.id}&b=${b.id}">Compare players${icon('chevronRight', 16)}</a></div>`;
}
