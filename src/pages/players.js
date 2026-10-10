/* pages/players.js — Players (/players) and Player profile (/players/:playerId). */

async function PlayersPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Players' }]);
  const q = {
    search: ctx.query.search || '', team: ctx.query.team || '', position: ctx.query.position || '',
    age: ctx.query.age || '', minApps: ctx.query.minApps || '0', sort: ctx.query.sort || 'g', dir: ctx.query.dir || 'desc', page: Number(ctx.query.page) || 1,
  };
  const head = PageHead('Players', 'Explore player performance across the Premier League.');
  ctx.root.innerHTML = head + Skeleton('table');
  const first = await API.getPlayers({ season: State.season, ...q });
  if (!ctx.alive()) return;
  ctx.root.innerHTML = head + `
    <div class="filter-bar card wrap">
      ${SearchField('p-search', 'Search player', q.search, 'Player name')}
      ${Select('p-team', 'Team', teamOptions(), q.team)}
      ${Select('p-pos', 'Position', positionOptions(), q.position)}
      ${Select('p-age', 'Age', [['', 'All ages'], ['u21', 'Under 21'], ['21-25', '21–25'], ['26-29', '26–29'], ['30+', '30 and over']], q.age)}
      ${SeasonField('p-season')}
      ${Select('p-apps', 'Min. appearances', [['0', 'Any (whole squad)'], ['1', '1+'], ['5', '5+'], ['10', '10+'], ['15', '15+'], ['20', '20+'], ['25', '25+']], q.minApps)}
      <button type="button" class="btn btn-ghost btn-sm reset" id="p-reset">Reset filters</button>
    </div>
    <section class="card flush" aria-live="polite"><div id="p-table"></div></section>`;
  const box = $('#p-table', ctx.root);
  const draw = res => {
    box.innerHTML = res.rows.length ? PlayerTable(res.rows, q.sort, q.dir, res.hasXg) + Pagination(res.page, res.pages, res.total, 'players')
      : EmptyState('No players found', 'Try changing your filters.', '<button type="button" class="btn btn-ghost" data-reset>Reset filters</button>');
    q.page = res.page;
  };
  let tok = 0;
  const refresh = async () => {
    const my = ++tok; Router.setQuery(q); box.classList.add('refreshing');
    try { const res = await API.getPlayers({ season: State.season, ...q }, { fast: true }); if (my === tok && ctx.alive()) draw(res); }
    catch (e) { if (my === tok) box.innerHTML = ErrorState(e.message); }
    finally { box.classList.remove('refreshing'); }
  };
  const bind = (id, key) => $(id, ctx.root).addEventListener('change', e => { q[key] = e.target.value; q.page = 1; refresh(); });
  bind('#p-team', 'team'); bind('#p-pos', 'position'); bind('#p-age', 'age'); bind('#p-apps', 'minApps');
  $('#p-search', ctx.root).addEventListener('input', debounce(e => { q.search = e.target.value; q.page = 1; refresh(); }, 200));
  const reset = () => { Object.assign(q, { search: '', team: '', position: '', age: '', minApps: '0', page: 1 }); ['#p-search', '#p-team', '#p-pos', '#p-age'].forEach(s => { $(s, ctx.root).value = ''; }); $('#p-apps', ctx.root).value = '0'; refresh(); };
  $('#p-reset', ctx.root).addEventListener('click', reset);
  box.addEventListener('click', e => {
    if (e.target.closest('[data-reset]')) return reset();
    const s = e.target.closest('[data-sort]');
    if (s) { const k = s.dataset.sort; q.dir = q.sort === k ? (q.dir === 'desc' ? 'asc' : 'desc') : (['name', 'team', 'position'].includes(k) ? 'asc' : 'desc'); q.sort = k; q.page = 1; refresh().then(() => { const nb = $(`[data-sort="${k}"]`, box); nb && nb.focus(); }); return; }
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { q.page = Number(pg.dataset.page); refresh().then(() => box.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })); }
  });
  draw(first);
}

/* Match-feed stats (current season): totals, per 90 and percentile vs the same position group. */
function AdvancedStats(R, p) {
  const s = p.stats; if (!s.advMatches) return '';
  const isGK = p.position === 'GK';
  const pool = R.players.filter(x => x.stats.advMin >= 180 && (x.position === 'GK') === isGK);
  const per = (x, k) => per90(x.stats[k] || 0, x.stats.advMin);
  const pct = (k, rate, lowerBetter) => { const fn = x => (rate ? (x.stats[k] ?? 0) : per(x, k)) * (lowerBetter ? -1 : 1); return s.advMin >= 180 ? percentileScorer(pool, fn)(fn(p)) : null; };
  const row = ([label, k, opt = {}]) => {
    const v = s[k]; if (v == null) return '';
    const pc = pct(k, opt.rate, opt.lower);
    return `<div class="adv-row"><span class="adv-l">${esc(label)}</span><span class="adv-v">${fmt.n(v, opt.dec || 0)}${opt.unit || ''}</span><span class="adv-p90">${opt.rate ? '' : fmt.n(per(p, k), 2)}</span>
      <span class="adv-bar" ${pc == null ? '' : `data-tip="${esc(`${label}: ${pc}th percentile${opt.rate ? '' : ' (per 90)'}${opt.lower ? ', lower is better' : ''}`)}"`}><i style="width:${pc ?? 0}%" class="${pc >= 80 ? 'hi' : pc != null && pc < 25 ? 'lo' : ''}"></i></span><span class="adv-pc">${pc ?? '–'}</span></div>`;
  };
  const groups = isGK ? [
    ['Goalkeeping', [['Goals prevented', 'gp', { dec: 2 }], ['xGOT faced', 'xgotF', { dec: 2 }], ['Saves inside box', 'svBox'], ['Sweeper actions', 'sweep'], ['High claims', 'claims']]],
    ['Distribution', [['Touches', 'touches'], ['Pass accuracy', 'passPct', { rate: true, dec: 1, unit: '%' }], ['Accurate long balls', 'longb']]],
    ['Physical', [['Distance covered', 'dist', { dec: 1, unit: ' km' }], ['Top speed', 'topSpeed', { rate: true, dec: 1, unit: ' km/h' }]]],
  ] : [
    ['Physical', [['Distance covered', 'dist', { dec: 1, unit: ' km' }], ['Top speed', 'topSpeed', { rate: true, dec: 1, unit: ' km/h' }], ['Sprints', 'sprints']]],
    ['Shooting', [['Shots', 'shots'], ['Shots on target', 'sot'], ['xG on target (xGOT)', 'xgot', { dec: 2 }], ['Touches in opposition box', 'tib'], ['Big chances missed', 'bcm', { lower: true }]]],
    ['Passing & creation', [['Touches', 'touches'], ['Pass accuracy', 'passPct', { rate: true, dec: 1, unit: '%' }], ['Chances created', 'cc'], ['Final-third passes', 'f3'], ['Accurate crosses', 'crosses'], ['Accurate long balls', 'longb']]],
    ['Duels & defending', [['Duels won', 'duelsW'], ['Duel success', 'duelPct', { rate: true, dec: 1, unit: '%' }], ['Aerial duels won', 'aduels'], ['Tackles won', 'tkw'], ['Interceptions', 'int'], ['Clearances', 'clr'], ['Recoveries', 'recv'], ['Dribbled past', 'dribPast', { lower: true }], ['Fouls won', 'fouled']]],
  ];
  return `<section class="card">${SectionHead('Match-feed stats', '', `${s.advMatches} matches, ${fmt.n(s.advMin)} minutes. Bars show the percentile against ${isGK ? 'goalkeepers' : 'outfield players'} with 180+ minutes (per 90 unless it is a rate).`)}
    <div class="adv-grid">${groups.map(([title, rows]) => `<div class="adv-group"><h3>${esc(title)}</h3><div class="adv-head"><span></span><span>Total</span><span>Per 90</span><span></span><span>Pct</span></div>${rows.map(row).join('')}</div>`).join('')}</div></section>`;
}

async function PlayerPage(ctx) {
  const base = PEOPLE[ctx.params.playerId];
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Players', href: '#/players' }, { label: base ? base.name : 'Player' }]);
  ctx.root.innerHTML = Skeleton('profile');
  let d;
  try { d = await API.getPlayer(ctx.params.playerId, { season: State.season }); }
  catch (e) {
    if (!e.seasons || !ctx.alive()) throw e;
    ctx.root.innerHTML = `<div class="card">${EmptyState(`No ${seasonLabel(State.season)} data for ${base.name}`, e.message, e.seasons.map(sid => `<button class="btn btn-ghost" type="button" data-set-season="${sid}">View ${seasonLabel(sid)}</button>`).join(' '))}</div>`;
    return;
  }
  if (!ctx.alive()) return;
  const p = d.player, s = p.stats, t = d.team, isGK = p.position === 'GK', hasXg = d.season.hasXg, hasDef = d.season.hasDefensive;
  const kpis = isGK
    ? [['Appearances', s.apps], ['Clean sheets', s.cs], ['Saves', s.sv], ['Goals conceded', s.gc], ...(hasXg ? [['xG conceded', s.xgc, 1]] : []), ['Penalties saved', s.psv], ['Minutes', s.min], ['FPL points', s.pts]]
    : [['Goals', s.g], ['Assists', s.a], ...(hasXg ? [['xG', s.xg, 1], ['xA', s.xa, 1]] : [['Starts', s.starts], ['Bonus points', s.bonus]]), ['Appearances', s.apps], ['Minutes', s.min], ['FPL points', s.pts], ['ICT index', s.ict, 1]];
  const cat = (title, rows) => `<div class="stat-cat"><h3>${esc(title)}</h3><dl>${rows.map(([l, v, dec = 0, suf = '']) => `<div><dt>${esc(l)}</dt><dd>${v == null ? '–' : fmt.n(v, dec) + suf}</dd></div>`).join('')}</dl></div>`;
  const R = repo(State.season);
  const others = R.players.filter(x => x.position === p.position && x.id !== p.id && x.stats.apps).sort((a, b) => b.stats.pts - a.stats.pts);
  const cmpWith = (others[0] || R.players.find(x => x.id !== p.id)).id;
  const birth = p.birth ? new Date(p.birth + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;

  ctx.root.innerHTML = `
    <section class="profile-hero card player" style="--tc:${t.colors[0]}">
      <div class="ph-photo">${Avatar(p, 128)}</div>
      <div class="ph-main"><h1>${esc(p.name)}</h1>
        <a class="ph-team" href="#/teams/${t.id}">${Crest(t, 22)}${esc(t.name)}</a>
        <dl class="bio"><div><dt>Position</dt><dd>${esc(POSITION_LABEL[p.position])}</dd></div><div><dt>Age (1 Aug ${d.season.startYear})</dt><dd>${p.age ?? '–'}</dd></div>${birth ? `<div><dt>Born</dt><dd>${birth}</dd></div>` : ''}<div><dt>Season</dt><dd>${esc(d.season.label)}</dd></div></dl></div>
      <div class="ph-actions"><a class="btn btn-primary" href="#/comparison?a=${p.id}&b=${cmpWith}">${icon('compare', 16)}Compare</a></div>
    </section>
    ${s.apps === 0 ? `<div class="card">${EmptyState('No appearances this season', `${p.name} was registered with ${t.name} in ${d.season.label} but did not play a league minute.`)}</div>` : `
    <section class="grid-kpi eight" aria-label="Season totals, ${esc(d.season.label)}">${kpis.slice(0, 8).map(([l, v, dec = 0, suf = '']) => StatCard({ label: l, value: v, dec, suffix: suf })).join('')}</section>
    <div class="grid-2 wide-left">
      <section class="card">${SectionHead('Performance trend')}${Tabs('trend-tabs', isGK ? [['pts', 'FPL points'], ['sv', 'Saves'], ['cs', 'Clean sheets']] : [['g', 'Goals'], ['a', 'Assists'], ...(hasXg ? [['xg', 'xG']] : []), ['pts', 'FPL points']], isGK ? 'pts' : 'g', 'Trend metric')}
        <p class="fine" id="trend-note"></p><div id="trend-chart"></div></section>
      <section class="card">${SectionHead('Player profile', '', esc(d.radar.note))}<div id="radar"></div></section>
    </div>
    <section class="card">${SectionHead('Season statistics', '', `${esc(d.season.label)} totals across all clubs.`)}<div class="stat-cats">
      ${cat('Attack', [['Goals', s.g], ['xG', hasXg ? s.xg : null, 2], ['Penalties missed', s.pm], ['Threat (ICT)', s.thr]])}
      ${cat('Creation', [['Assists', s.a], ['xA', hasXg ? s.xa : null, 2], ['xG involvements', hasXg ? s.xgi : null, 2], ['Creativity (ICT)', s.cre]])}
      ${cat('Defending', isGK ? [['Saves', s.sv], ['Penalties saved', s.psv], ['Clean sheets', s.cs], ['Goals conceded', s.gc], ['xG conceded', hasXg ? s.xgc : null, 2]]
        : hasDef ? [['Tackles', s.tk], ['Clearances, blocks, interceptions', s.cbi], ['Recoveries', s.rec], ['Defensive contributions', s.dc], ['Clean sheets', s.cs]] : [['Clean sheets', s.cs], ['Goals conceded on pitch', s.gc], ['xG conceded on pitch', hasXg ? s.xgc : null, 2]])}
      ${cat('Discipline', [['Yellow cards', s.yc], ['Red cards', s.rc], ['Own goals', s.og]])}
      ${cat('Usage & FPL', [['Appearances', s.apps], ['Starts', s.starts], ['Minutes', s.min], ['FPL points', s.pts], ['Bonus points', s.bonus], ['BPS', s.bps], ['Influence (ICT)', s.inf]])}</div></section>
    ${AdvancedStats(R, p)}
    <div class="grid-2">
    <section class="card">${SectionHead('Recent matches')}<div class="table-scroll"><table class="data-table"><caption class="sr-only">Recent matches</caption><thead><tr><th scope="col">Match</th><th scope="col" class="num">GW</th><th scope="col" class="num">Min</th><th scope="col" class="num">G</th><th scope="col" class="num">A</th>${hasXg ? '<th scope="col" class="num">xG</th>' : ''}<th scope="col" class="num">Pts</th></tr></thead>
      <tbody>${d.recentMatches.map(r => `<tr data-href="#/matches/${r.matchId}"><td><a class="match-inline" href="#/matches/${r.matchId}">${Crest(r.match.home, 18)} ${esc(TEAM_BY_ID[r.match.home].short)} ${r.match.score.home}–${r.match.score.away} ${esc(TEAM_BY_ID[r.match.away].short)} ${Crest(r.match.away, 18)}</a></td><td class="num">${r.mw}</td><td class="num">${r.min}</td><td class="num">${r.g}</td><td class="num">${r.a}</td>${hasXg ? `<td class="num">${fmt.n(r.xg, 2)}</td>` : ''}<td class="num strong">${r.pts}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card">${SectionHead('Premier League history', '', 'Seasons in this dataset. Select a season to switch.')}<div class="table-scroll"><table class="data-table"><caption class="sr-only">Season history</caption><thead><tr><th scope="col">Season</th><th scope="col">Club</th><th scope="col" class="num">Apps</th><th scope="col" class="num">Min</th><th scope="col" class="num">G</th><th scope="col" class="num">A</th><th scope="col" class="num">Pts</th></tr></thead>
      <tbody>${d.history.map(h => `<tr class="${h.season === d.season.id ? 'hl' : ''}"><td><button type="button" class="link-btn" data-set-season="${h.season}" ${h.season === d.season.id ? 'aria-current="true"' : ''}>${esc(h.label)}</button></td><td>${TeamLink(h.teamId, { crest: 18, short: true })}</td><td class="num">${h.apps}</td><td class="num">${fmt.n(h.min)}</td><td class="num">${h.g}</td><td class="num">${h.a}</td><td class="num strong">${h.pts}</td></tr>`).join('')}</tbody></table></div></section>
    </div>`}`;
  if (s.apps === 0) return;

  const weeks = Array.from({ length: d.playedWeeks }, (_, i) => i + 1);
  const byWeek = {}; s.series.forEach(x => { const w = byWeek[x.mw] = byWeek[x.mw] || { g: 0, a: 0, xg: 0, pts: 0, sv: 0, cs: 0 }; ['g', 'a', 'xg', 'pts', 'sv', 'cs'].forEach(k => { w[k] += x[k]; }); });
  const drawTrend = key => {
    const name = { g: 'Goals', a: 'Assists', xg: 'xG', pts: 'FPL points', sv: 'Saves', cs: 'Clean sheets' }[key];
    let run = 0; const values = weeks.map(w => { run += byWeek[w] ? byWeek[w][key] : 0; return Math.round(run * 100) / 100; });
    const note = `Cumulative ${key === 'xg' ? 'xG' : name.toLowerCase()} after each gameweek.`;
    $('#trend-note', ctx.root).textContent = note;
    $('#trend-chart', ctx.root).__w = null;
    LineChart($('#trend-chart', ctx.root), { labels: weeks.map(String), xPrefix: 'Gameweek ', series: [{ name, values, color: '#8B6CFF' }], fmtVal: v => fmt.n(v, key === 'xg' ? 1 : 0), ariaLabel: `${p.name}: ${note}` });
  };
  drawTrend(isGK ? 'pts' : 'g');
  bindTabs(ctx.root, 'trend-tabs', drawTrend);
  RadarChart($('#radar', ctx.root), { axes: d.radar.axes.map(a => a.label), series: [{ name: p.name, values: d.radar.axes.map(a => a.value), color: '#8B6CFF' }], ariaLabel: `${p.name} percentile profile` });
  animateCounts(ctx.root);
}
