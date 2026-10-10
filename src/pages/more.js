/* pages/more.js — Standings, Statistics Explorer, Player Comparison, Transfers, Records, Settings, Not found. */

/* ================= STANDINGS ================= */
async function StandingsPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Standings' }]);
  const head = PageHead('Premier League table', '', `<div class="head-tools">${SeasonField('st-season')}</div>`);
  ctx.root.innerHTML = head + Skeleton('table');
  const d = await API.getStandings({ season: State.season });
  if (!ctx.alive()) return;
  ctx.root.innerHTML = head.replace('<p class="page-sub"></p>', '') + `
    <p class="page-sub standalone">${d.season.playedWeeks < 38 ? `After matchweek ${d.season.playedWeeks} of 38.` : 'Final table.'} Select a team to open its profile; select a form result to open the match.</p>
    <section class="card flush">${LeagueTable(d.rows, { full: true, form: true, caption: `Premier League table ${d.season.label}` })}</section>
    <section class="card zone-key" aria-label="Table zones">
      ${Object.entries(ZONES).map(([k, z]) => `<div><span class="zl ${k}">${z.short}</span><div><strong>${esc(z.label)}</strong><p class="muted">${esc(z.tip)}</p></div></div>`).join('')}
      <p class="fine">Ties are split by goal difference, then goals scored. European places can shift with domestic cup results.</p></section>`;
}

/* ================= STATISTICS EXPLORER ================= */
async function StatisticsPage(ctx) {
  const q = { metric: METRIC_BY_KEY[ctx.query.metric] && metricAvailable(METRIC_BY_KEY[ctx.query.metric], State.season) ? ctx.query.metric : 'g', team: ctx.query.team || '', position: ctx.query.position || '', minApps: ctx.query.minApps || '0', search: ctx.query.search || '', dir: ctx.query.dir === 'asc' ? 'asc' : 'desc', page: Number(ctx.query.page) || 1 };
  const titles = { g: 'Top scorers', a: 'Top assists' };
  setCrumbs([{ label: 'Home', href: '#/' }, { label: titles[q.metric] || 'Statistics explorer' }]);
  const head = PageHead(titles[q.metric] || 'Statistics explorer', 'Rank every player on any metric. Filter by team, position and appearances.');
  ctx.root.innerHTML = head + Skeleton('table');
  const first = await API.getStatistics({ season: State.season, ...q });
  if (!ctx.alive()) return;
  ctx.root.innerHTML = head + `
    <div class="filter-bar card wrap">
      ${Select('s-metric', 'Metric', metricsFor(State.season).map(m => [m.key, m.label]), q.metric)}${SeasonField('s-season')}
      ${Select('s-team', 'Team', teamOptions(), q.team)}${Select('s-pos', 'Position', positionOptions(), q.position)}
      ${Select('s-apps', 'Min. appearances', [['0', 'Any'], ['5', '5+'], ['10', '10+'], ['15', '15+'], ['20', '20+']], q.minApps)}</div>
    <div class="grid-2 stats-layout">
      <section class="card"><div id="s-chart-head"></div><div id="s-chart"></div></section>
      <section class="card flush-x"><div class="table-tools">${SearchField('s-search', 'Find player in ranking', q.search, 'Player name')}
        <div class="field"><span class="field-label">Order</span><button type="button" class="btn btn-ghost btn-sm" id="s-dir" aria-label="Toggle sort order">${icon(q.dir === 'desc' ? 'arrowDown' : 'arrowUp', 14)}<span>${q.dir === 'desc' ? 'Highest first' : 'Lowest first'}</span></button></div></div>
        <div id="s-table" aria-live="polite"></div></section></div>`;
  const draw = res => {
    const m = res.metric; q.page = res.page;
    const qual = [m.positions ? `Only ${m.positions.map(p => POSITION_LABEL[p].toLowerCase() + 's').join(' and ')}.` : '', m.minMinutes ? `Minimum ${m.minMinutes} minutes.` : ''].filter(Boolean).join(' ');
    $('#s-chart-head', ctx.root).innerHTML = SectionHead(`${q.dir === 'desc' ? 'Top' : 'Bottom'} 10 by ${m.short || m.label.toLowerCase()}`, '', qual || `${seasonLabel(State.season)}, current filters.`);
    const chart = $('#s-chart', ctx.root);
    if (res.chart.length) HBarChart(chart, { items: res.chart.map(c => ({ label: c.name, sub: TEAM_BY_ID[c.teamId].short, value: c.value, href: `#/players/${c.id}` })), fmtVal: v => fmt.metric(m, v), ariaLabel: `Players ranked by ${m.label}` });
    else chart.innerHTML = EmptyState('Nothing to chart', 'No players match these filters.');
    $('#s-table', ctx.root).innerHTML = res.rows.length ? `<div class="table-scroll"><table class="data-table"><caption class="sr-only">Ranking by ${esc(m.label)}</caption><thead><tr><th scope="col" class="num">Rank</th><th scope="col">Player</th><th scope="col">Team</th><th scope="col">Pos</th><th scope="col" class="num strong" aria-sort="${q.dir === 'desc' ? 'descending' : 'ascending'}">${esc(m.short || m.label)}</th></tr></thead>
      <tbody>${res.rows.map(r => `<tr data-href="#/players/${r.id}"><td class="num muted">${r.rank}</td><td class="player-cell">${PlayerLink(r, { size: 28, meta: false })}</td><td>${TeamLink(r.teamId, { crest: 18, short: true })}</td><td><span class="pos-badge pos-${r.position}">${r.position}</span></td><td class="num strong">${fmt.metric(m, r.value)}</td></tr>`).join('')}</tbody></table></div>${Pagination(res.page, res.pages, res.total, 'players')}`
      : EmptyState('No players found', 'Try changing your filters.', '<button type="button" class="btn btn-ghost" data-clear>Clear filters</button>');
  };
  let tok = 0;
  const refresh = async () => {
    const my = ++tok; Router.setQuery(q);
    try { const res = await API.getStatistics({ season: State.season, ...q }, { fast: true }); if (my === tok && ctx.alive()) draw(res); }
    catch (e) { if (my === tok) $('#s-table', ctx.root).innerHTML = ErrorState(e.message); }
  };
  const bind = (id, key) => $(id, ctx.root).addEventListener('change', e => { q[key] = e.target.value; q.page = 1; refresh(); });
  bind('#s-metric', 'metric'); bind('#s-team', 'team'); bind('#s-pos', 'position'); bind('#s-apps', 'minApps');
  $('#s-metric', ctx.root).addEventListener('change', () => setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Statistics explorer' }]));
  $('#s-search', ctx.root).addEventListener('input', debounce(e => { q.search = e.target.value; q.page = 1; refresh(); }, 200));
  $('#s-dir', ctx.root).addEventListener('click', e => {
    q.dir = q.dir === 'desc' ? 'asc' : 'desc'; q.page = 1;
    e.currentTarget.innerHTML = `${icon(q.dir === 'desc' ? 'arrowDown' : 'arrowUp', 14)}<span>${q.dir === 'desc' ? 'Highest first' : 'Lowest first'}</span>`; refresh();
  });
  $('#s-table', ctx.root).addEventListener('click', e => {
    const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { q.page = Number(pg.dataset.page); refresh(); }
    if (e.target.closest('[data-clear]')) { Object.assign(q, { team: '', position: '', minApps: '0', search: '', page: 1 }); ['#s-team', '#s-pos', '#s-search'].forEach(s => { $(s, ctx.root).value = ''; }); $('#s-apps', ctx.root).value = '0'; refresh(); }
  });
  draw(first);
}

/* ================= PLAYER COMPARISON ================= */
function PlayerPicker(id, label, player) {
  return `<div class="picker" id="${id}"><label class="field-label" for="${id}-input">${esc(label)}</label>
    <div class="picker-box">${Avatar(player, 40)}<input id="${id}-input" type="text" role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list" value="${esc(player.name)}" autocomplete="off"></div>
    <div class="search-results picker-list" id="${id}-list" role="listbox" hidden></div></div>`;
}
function bindPicker(root, id, onPick) {
  const wrap = $('#' + id, root), input = $('#' + id + '-input', root), list = $('#' + id + '-list', root);
  let active = -1; const original = input.value;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
  const show = () => {
    const s = slugify(input.value);
    const hits = repo(State.season).players.filter(p => p.stats.apps && (!s || slugify(p.name).includes(s) || slugify(TEAM_BY_ID[p.teamId].name).includes(s))).sort((a, b) => b.stats.min - a.stats.min).slice(0, 8);
    list.innerHTML = hits.length ? hits.map((p, i) => `<div role="option" id="${id}-o${i}" class="sr-item" data-id="${p.id}" aria-selected="false">${Avatar(p, 26)}<span class="sr-main"><strong>${esc(p.name)}</strong><span>${esc(TEAM_BY_ID[p.teamId].name)}, ${esc(POSITION_LABEL[p.position])}</span></span></div>`).join('') : '<div class="sr-empty">No players found.</div>';
    list.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
  };
  input.addEventListener('focus', () => { input.select(); show(); });
  input.addEventListener('input', show);
  input.addEventListener('keydown', e => {
    const opts = $$('[role=option]', list);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!opts.length) return; active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; opts.forEach((o, k) => o.setAttribute('aria-selected', k === active)); input.setAttribute('aria-activedescendant', opts[active].id); }
    if (e.key === 'Enter' && opts.length) { e.preventDefault(); onPick(opts[Math.max(0, active)].dataset.id); close(); }
    if (e.key === 'Escape') { input.value = original; close(); }
  });
  list.addEventListener('mousedown', e => e.preventDefault());
  list.addEventListener('click', e => { const o = e.target.closest('[role=option]'); if (o) { onPick(o.dataset.id); close(); } });
  input.addEventListener('blur', () => setTimeout(() => { if (!wrap.contains(document.activeElement)) { input.value = original; close(); } }, 120));
}

async function ComparisonPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Player comparison' }]);
  const R = repo(State.season); const hasXg = R.season.hasXg;
  const ranked = R.players.filter(p => p.stats.apps).sort((a, b) => b.stats.pts - a.stats.pts);
  const okId = id => (R.playerById[id] && R.playerById[id].stats.apps ? id : null);
  const q = { a: okId(ctx.query.a) || okId('mohamed-salah') || ranked[0].id, b: okId(ctx.query.b) || okId('erling-haaland') || ranked[1].id, mode: ctx.query.mode === 'p90' ? 'p90' : 'total', trend: 'g' };
  if (q.a === q.b) q.b = ranked.find(p => p.id !== q.a && p.position === R.playerById[q.a].position).id;
  const head = PageHead('Player comparison', 'Compare two players across output, creation and efficiency.');
  const missing = ['a', 'b'].filter(k => ctx.query[k] && !okId(ctx.query[k])).map(k => PEOPLE[ctx.query[k]] ? PEOPLE[ctx.query[k]].name : null).filter(Boolean);
  ctx.root.innerHTML = head + Skeleton('profile');
  const [A, B] = await API.comparePlayers({ season: State.season, playerIds: [q.a, q.b] });
  if (!ctx.alive()) return;
  Router.setQuery({ a: q.a, b: q.b, mode: q.mode === 'p90' ? 'p90' : '' });
  const pa = A.player, pb = B.player; const sa = pa.stats, sb = pb.stats;
  const rate = k => ['ppg'].includes(k);
  const v = (s, k) => (q.mode === 'p90' && !rate(k) ? per90(s[k], s.min) : s[k] ?? 0);
  const dec = k => (q.mode === 'p90' && !rate(k) ? 2 : ['xg', 'xa'].includes(k) ? 1 : 0);
  const sameGroup = (pa.position === 'GK') === (pb.position === 'GK');
  const cards = [['Goals', 'g'], ['Assists', 'a'], ...(hasXg ? [['xG', 'xg'], ['xA', 'xa']] : [['Minutes', 'min'], ['Bonus', 'bonus']]), ['FPL points', 'pts']];
  const bars = [['Goals', 'g'], ['Assists', 'a'], ...(hasXg ? [['xG', 'xg'], ['xA', 'xa']] : []), ['Threat', 'thr'], ['Creativity', 'cre'], ['Influence', 'inf'], ['Bonus points', 'bonus'], ...(R.season.hasDefensive ? [['Def. actions', 'dc']] : []), ['FPL points', 'pts']];

  ctx.root.innerHTML = head + `
    ${missing.length ? `<p class="notice">${icon('info', 16)}${esc(missing.join(' and '))} did not play in ${esc(R.season.label)}, so a different player is shown.</p>` : ''}
    <section class="card cmp-pickers">${PlayerPicker('pick-a', 'Player one', pa)}
      <button type="button" class="btn-icon swap" id="cmp-swap" aria-label="Swap players">${icon('compare', 18)}</button>${PlayerPicker('pick-b', 'Player two', pb)}</section>
    <div class="cmp-toolbar">${Tabs('cmp-mode', [['total', 'Season totals'], ['p90', 'Per 90 minutes']], q.mode, 'Comparison mode')}<span class="muted">${esc(R.season.label)}: ${fmt.n(sa.min)} vs ${fmt.n(sb.min)} minutes</span></div>
    <section class="cmp-cards" aria-label="Headline comparison">${cards.map(([l, k]) => {
      const x = v(sa, k), y = v(sb, k); const lead = x === y ? 0 : x > y ? -1 : 1;
      return `<div class="cmp-stat"><span class="cs-label">${l}${q.mode === 'p90' && !rate(k) && k !== 'min' ? ' per 90' : ''}</span><div class="cs-vals"><b class="${lead === -1 ? 'lead a' : ''}">${fmt.n(x, dec(k))}</b><span>vs</span><b class="${lead === 1 ? 'lead b' : ''}">${fmt.n(y, dec(k))}</b></div><span class="cs-bar" aria-hidden="true"><i class="a" style="flex:${Math.max(x, 0.0001)}"></i><i class="b" style="flex:${Math.max(y, 0.0001)}"></i></span>${lead ? `<span class="sr-only">${lead === -1 ? pa.name : pb.name} leads</span>` : ''}</div>`;
    }).join('')}</section>
    <div class="grid-2">
      <section class="card">${SectionHead('Profile overlay', '', sameGroup ? esc(A.radar.note) : 'Goalkeepers and outfield players are profiled on different axes, so they are shown separately.')}<div id="cmp-radar"></div>${sameGroup ? '' : '<div id="cmp-radar-b"></div>'}</section>
      <section class="card">${SectionHead('Head to head', '', q.mode === 'p90' ? 'Per 90 minutes played.' : 'Season totals.')}
        <div class="cmp-legend"><span class="a">${esc(pa.name)}</span><span class="b">${esc(pb.name)}</span></div>
        <div class="butterfly">${bars.map(([l, k]) => {
          const x = v(sa, k), y = v(sb, k); const mx = Math.max(x, y, 1e-9);
          return `<div class="bf-row"><span class="bf-v ${x > y ? 'lead' : ''}">${fmt.n(x, dec(k))}</span><span class="bf-track l"><i style="width:${(x / mx) * 100}%"></i></span><span class="bf-label">${l}</span><span class="bf-track r"><i style="width:${(y / mx) * 100}%"></i></span><span class="bf-v ${y > x ? 'lead' : ''}">${fmt.n(y, dec(k))}</span></div>`;
        }).join('')}</div><p class="fine">Threat, creativity and influence are FPL's ICT index components.</p></section></div>
    <section class="card">${SectionHead('Performance timeline')}${Tabs('cmp-trend', [['g', 'Goals'], ['a', 'Assists'], ...(hasXg ? [['xg', 'xG']] : []), ['pts', 'FPL points']], q.trend, 'Timeline metric')}<p class="fine" id="cmp-trend-note"></p><div id="cmp-trend-chart"></div>
      <div class="legend"><span><i style="background:#8B6CFF"></i>${esc(pa.name)}</span><span><i style="background:#FF3D81"></i>${esc(pb.name)}</span></div></section>`;

  const weeks = R.season.playedWeeks;
  const series = (p, key) => { const by = {}; p.stats.series.forEach(x => { by[x.mw] = (by[x.mw] || 0) + x[key]; }); let run = 0; return Array.from({ length: weeks }, (_, i) => { run += by[i + 1] || 0; return Math.round(run * 100) / 100; }); };
  const drawTrend = key => {
    $('#cmp-trend-note', ctx.root).textContent = 'Cumulative total after each gameweek.';
    const el = $('#cmp-trend-chart', ctx.root); el.__w = null;
    LineChart(el, { labels: Array.from({ length: weeks }, (_, i) => String(i + 1)), xPrefix: 'Gameweek ', series: [{ name: pa.name, values: series(pa, key), color: '#8B6CFF' }, { name: pb.name, values: series(pb, key), color: '#FF3D81' }], fmtVal: v2 => fmt.n(v2, key === 'xg' ? 1 : 0), ariaLabel: `Timeline comparison of ${pa.name} and ${pb.name}` });
  };
  if (sameGroup) RadarChart($('#cmp-radar', ctx.root), { axes: A.radar.axes.map(x => x.label), series: [{ name: pa.name, values: A.radar.axes.map(x => x.value), color: '#8B6CFF' }, { name: pb.name, values: B.radar.axes.map(x => x.value), color: '#FF3D81' }], ariaLabel: 'Percentile profile overlay' });
  else {
    RadarChart($('#cmp-radar', ctx.root), { axes: A.radar.axes.map(x => x.label), series: [{ name: pa.name, values: A.radar.axes.map(x => x.value), color: '#8B6CFF' }], maxSize: 300, ariaLabel: `${pa.name} profile` });
    RadarChart($('#cmp-radar-b', ctx.root), { axes: B.radar.axes.map(x => x.label), series: [{ name: pb.name, values: B.radar.axes.map(x => x.value), color: '#FF3D81' }], maxSize: 300, ariaLabel: `${pb.name} profile` });
  }
  drawTrend(q.trend);
  bindTabs(ctx.root, 'cmp-trend', drawTrend);
  const go = (a, b, mode = q.mode) => Router.go(`#/comparison?a=${a}&b=${b}${mode === 'p90' ? '&mode=p90' : ''}`);
  bindTabs(ctx.root, 'cmp-mode', mode => go(q.a, q.b, mode));
  bindPicker(ctx.root, 'pick-a', id => go(id, id === q.b ? q.a : q.b));
  bindPicker(ctx.root, 'pick-b', id => go(id === q.a ? q.b : q.a, id));
  $('#cmp-swap', ctx.root).addEventListener('click', () => go(q.b, q.a));
}

/* ================= TRANSFERS ================= */
async function TransfersPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Transfers' }]);
  const q = { team: ctx.query.team || '', direction: ctx.query.direction || '' };
  const head = PageHead('Transfers', 'Player moves derived from Premier League squad registrations. Reported fees are shown where known.');
  ctx.root.innerHTML = head + Skeleton('table');
  const first = await API.getTransfers({ season: State.season, ...q });
  if (!ctx.alive()) return;
  const R = repo(State.season); const oldest = State.season === first.oldest;
  ctx.root.innerHTML = head + `<div class="filter-bar card wrap">${SeasonField('tr-season')}${Select('tr-team', 'Team', teamOptions(), q.team)}
    ${Select('tr-dir', 'Direction', [['', 'In and out'], ['in', 'Arrivals'], ['out', 'Departures to PL clubs']], q.direction, { disabled: !q.team })}</div>
    <p class="fine">${oldest ? 'This is the first season in the dataset, so only moves made during the season (between Premier League clubs) can be detected. ' : ''}Moves between Premier League clubs come from squad registrations. Arrivals from outside the league use FPL's join date${R.season.startYear >= 2024 ? '' : ', which is only available from 2024/25, so they are not listed for this season'}. Fees are not in the source data; figures marked ≈ are approximate reported fees.</p>
    <div id="tr-body" aria-live="polite"></div>`;
  const body = $('#tr-body', ctx.root);
  const from = t => (t.from ? ClubLabel(t.from) : '<span class="team-inline ext"><span class="ext-dot" aria-hidden="true"></span><span>Outside the Premier League</span></span>');
  const fee = t => (t.fee === undefined ? '<span class="muted">–</span>' : `≈ ${fmt.fee(t.fee)}`);
  const draw = res => {
    if (!res.rows.length) { body.innerHTML = `<div class="card">${EmptyState('No transfers found', 'Try another team or direction.')}</div>`; return; }
    const top = res.rows.filter(t => typeof t.fee === 'number').slice(0, 4);
    const card = t => `<article class="transfer-card"><div class="trc-player">${Avatar({ name: t.playerName, teamId: t.to }, 44)}
      <div><a href="#/players/${t.playerId}"><strong>${esc(t.playerName)}</strong></a><span class="muted">${fmt.dateLong(t.date)}</span></div></div>
      <div class="trc-move">${from(t)}<span class="trc-arrow" aria-label="to">${icon('chevronRight', 16)}</span>${ClubLabel(t.to)}</div><div class="trc-fee">${fmt.fee(t.fee)}<small class="muted" style="font-size:12px;font-weight:600;margin-left:6px">reported</small></div></article>`;
    body.innerHTML = `${top.length ? `<section aria-label="Biggest reported fees"><h2 class="sr-only">Biggest reported fees</h2><div class="grid-transfers">${top.map(card).join('')}</div></section>` : ''}
      <section class="card flush"><div class="table-scroll"><table class="data-table"><caption class="sr-only">Transfers</caption><thead><tr><th scope="col">Player</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Window</th><th scope="col" class="num">Reported fee</th><th scope="col" class="num">Date</th></tr></thead>
      <tbody>${res.rows.map(t => `<tr data-href="#/players/${t.playerId}"><td>${PlayerLink({ id: t.playerId, name: t.playerName, teamId: t.to }, { size: 28, meta: false })}</td><td>${from(t)}</td><td>${ClubLabel(t.to)}</td><td class="muted">${t.midSeason ? 'Mid-season' : 'Summer'}</td><td class="num strong">${fee(t)}</td><td class="num">${fmt.date(t.date)}</td></tr>`).join('')}</tbody></table></div>
      <div class="pager"><span class="muted">${fmt.n(res.rows.length)} moves</span></div></section>`;
  };
  let tok = 0;
  const refresh = async () => { const my = ++tok; Router.setQuery(q); try { const r = await API.getTransfers({ season: State.season, ...q }, { fast: true }); if (my === tok && ctx.alive()) draw(r); } catch (e) { if (my === tok) body.innerHTML = ErrorState(e.message); } };
  $('#tr-team', ctx.root).addEventListener('change', e => { q.team = e.target.value; const d = $('#tr-dir', ctx.root); d.disabled = !q.team; if (!q.team) { q.direction = ''; d.value = ''; } refresh(); });
  $('#tr-dir', ctx.root).addEventListener('change', e => { q.direction = e.target.value; refresh(); });
  draw(first);
}

/* ================= RECORDS ================= */
async function RecordsPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Records' }]);
  const head = PageHead('Records', 'Season leaders for players and teams.', `<div class="head-tools">${SeasonField('rc-season')}</div>`);
  ctx.root.innerHTML = head + Skeleton('grid');
  const d = await API.getRecords({ season: State.season });
  if (!ctx.alive()) return;
  const pcard = (title, ic, rows, dec = 0, unit = '', metric = '') => `<article class="record-card">
    <header><span class="stat-icon">${icon(ic, 16)}</span><h3>${esc(title)}</h3>${metric ? `<a class="link sm" href="#/statistics?metric=${metric}">Full ranking</a>` : ''}</header>
    ${rows.length ? `<a class="rc-lead" href="#/players/${rows[0].id}">${Avatar(rows[0], 56)}<span><strong>${esc(rows[0].name)}</strong><span class="muted">${esc(TEAM_BY_ID[rows[0].teamId].name)}</span></span><b>${fmt.n(rows[0].value, dec)}<small>${unit}</small></b></a>
    <ol class="rc-rest" start="2">${rows.slice(1).map(r => `<li><a href="#/players/${r.id}"><span class="rank-n">${rows.indexOf(r) + 1}</span><span class="rc-name">${esc(r.name)}</span><span class="muted">${esc(TEAM_BY_ID[r.teamId].short)}</span><b>${fmt.n(r.value, dec)}</b></a></li>`).join('')}</ol>` : '<p class="muted">No data.</p>'}</article>`;
  const tcard = (title, ic, rows, unit) => `<article class="record-card">
    <header><span class="stat-icon">${icon(ic, 16)}</span><h3>${esc(title)}</h3></header>
    <a class="rc-lead" href="#/teams/${rows[0].teamId}">${Crest(rows[0].teamId, 50)}<span><strong>${esc(TEAM_BY_ID[rows[0].teamId].name)}</strong></span><b>${rows[0].value}<small>${unit}</small></b></a>
    <ol class="rc-rest" start="2">${rows.slice(1).map((r, i) => `<li><a href="#/teams/${r.teamId}"><span class="rank-n">${i + 2}</span><span class="rc-name">${esc(TEAM_BY_ID[r.teamId].name)}</span><b>${r.value}</b></a></li>`).join('')}</ol></article>`;
  const p = d.players, t = d.teams; const bw = t.biggestWin;
  ctx.root.innerHTML = head + `
    <h2 class="group-title">Player records</h2>
    <div class="grid-records">
      ${pcard('Most goals', 'ball', p.goals, 0, '', 'g')}${pcard('Most assists', 'share', p.assists, 0, '', 'a')}${pcard('Most clean sheets', 'shield', p.cleanSheets, 0, '', 'cs')}${pcard('Most appearances', 'clock', p.apps, 0, '', 'apps')}
      ${p.xg ? pcard('Highest xG', 'activity', p.xg, 1, '', 'xg') : ''}${p.xa ? pcard('Highest xA', 'trend', p.xa, 1, '', 'xa') : ''}${pcard('Most saves', 'users', p.saves, 0, '', 'sv')}${p.tackles ? pcard('Most tackles', 'flag', p.tackles, 0, '', 'tk') : ''}${pcard('Most FPL points', 'trophy', p.points, 0, '', 'pts')}
    </div>
    <h2 class="group-title">Team records</h2>
    <div class="grid-records">
      ${tcard('Most goals scored', 'target', t.mostGoals, '')}${tcard('Fewest goals conceded', 'shield', t.fewestConceded, '')}${tcard('Longest winning run', 'trend', t.winStreak, ' wins')}${tcard('Longest unbeaten run', 'flag', t.unbeaten, ' games')}
      ${bw ? `<article class="record-card wide"><header><span class="stat-icon">${icon('trophy', 16)}</span><h3>Biggest win</h3></header>${MatchRow(bw)}</article>` : ''}
    </div>`;
}

/* ================= SETTINGS ================= */
function SettingsPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Settings' }]);
  const toggle = (id, label, desc, on) => `<div class="setting-row"><div><label for="${id}"><strong>${esc(label)}</strong></label><p class="muted">${esc(desc)}</p></div><button type="button" role="switch" id="${id}" class="switch" aria-checked="${on}"><span></span></button></div>`;
  ctx.root.innerHTML = PageHead('Settings', 'Preferences are saved in this browser.') + `
    <section class="card settings" id="profile" aria-labelledby="h-prof"><h2 id="h-prof">Profile</h2>
      <div class="setting-row"><div><label for="set-name"><strong>Display name</strong></label><p class="muted">Shown in the sidebar and account menu.</p></div>
      <form id="name-form" class="inline-form"><input id="set-name" type="text" maxlength="40" value="${esc(Settings.get('displayName'))}"><button class="btn btn-primary btn-sm" type="submit">Save name</button><span class="saved" id="name-saved" hidden>${icon('check', 14)}Saved</span></form></div></section>
    <section class="card settings" aria-labelledby="h-pref"><h2 id="h-pref">Preferences</h2>
      <div class="setting-row"><div><label for="set-season"><strong>Default season</strong></label><p class="muted">The season shown when the app opens.</p></div>${Select('set-season', 'Default season', seasonOptions(), Settings.get('defaultSeason'), { hideLabel: true })}</div>
      <div class="setting-row"><div><label for="set-lang"><strong>Language</strong></label><p class="muted">Interface language. Player and club names stay as published.</p></div>${Select('set-lang', 'Language', [['en', 'English'], ['th', 'ไทย']], Settings.get('lang') === 'th' ? 'th' : 'en', { hideLabel: true })}</div>
      <div class="setting-row"><div><label for="set-theme"><strong>Theme</strong></label><p class="muted">Galaxy adds a moving starfield and softer, glowing cards.</p></div>${Select('set-theme', 'Theme', [['galaxy', 'Galaxy'], ['classic', 'Classic']], Settings.get('theme') === 'classic' ? 'classic' : 'galaxy', { hideLabel: true })}</div>
      ${toggle('set-intro', 'Opening animation', 'Play the warp intro once per visit (Galaxy theme only).', Settings.get('intro') !== false)}
      <div class="setting-row"><div><strong>Replay intro</strong><p class="muted">Watch the opening animation again now.</p></div><button type="button" class="btn btn-ghost btn-sm" id="set-replay">Replay intro</button></div>
      ${toggle('set-motion', 'Reduce motion', 'Turns off the intro, starfield, count-up numbers and chart animations.', !!Settings.get('reduceMotion'))}</section>
    <section class="card settings" aria-labelledby="h-dev"><h2 id="h-dev">Testing</h2>
      <div class="setting-row"><div><label for="set-latency"><strong>Simulated network speed</strong></label><p class="muted">The data ships inside the page; this adds artificial delay so you can review loading states.</p></div>${Select('set-latency', 'Network speed', [['off', 'Instant'], ['normal', 'Normal'], ['slow', 'Slow']], Settings.get('latency'), { hideLabel: true })}</div>
      ${toggle('set-fail', 'Simulate API failure', 'Every request fails so you can review error states. Turn off to recover.', !!Settings.get('simulateFailure'))}</section>
    <section class="card settings" id="about" aria-labelledby="h-about"><h2 id="h-about">About the data</h2>
      <p>All results and player statistics are real. Completed seasons come from the official Fantasy Premier League API, archived season by season in the open-source <strong>vaastav/Fantasy-Premier-League</strong> repository. The current season comes from <strong>olbauday/FPL-Core-Insights</strong>, which refreshes FPL and match data twice a day and also supplies team match stats such as possession and shots. Every score was cross-checked against the independent <strong>openfootball</strong> results feed, and player goals plus own goals reconcile with every final score. Snapshot built ${esc(REAL_DATA.generated)}.</p>
      <div class="table-scroll"><table class="coverage"><thead><tr><th scope="col">Season</th><th scope="col">Matches</th><th scope="col">xG / xA</th><th scope="col">Defensive actions</th><th scope="col">Players</th><th scope="col">Source</th></tr></thead>
      <tbody>${SEASONS.map(x => `<tr><td>${esc(x.label)}</td><td>${x.played} of 380${x.partial ? ` (to GW${x.playedWeeks})` : ''}</td><td class="${x.hasXg ? 'yes' : 'no'}">${x.hasXg ? 'Yes' : 'Not published'}</td><td class="${x.hasDefensive ? 'yes' : 'no'}">${x.hasDefensive ? 'Yes' : 'Not published'}</td><td>${fmt.n(REAL_DATA.seasons.find(r => r.id === x.id).players.length)}</td><td>${REAL_DATA.seasons.find(r => r.id === x.id).source === 'vaastav' ? 'vaastav' : 'FPL-Core-Insights'}</td></tr>`).join('')}</tbody></table></div>
      <p>Possession, shots, corners and fouls are available for ${esc(SEASONS[0].label)} matches only; earlier seasons do not have them in the source. Shot locations and event minutes are not shown. Match ratings are replaced by official FPL points and BPS. Crests and photos are generated placeholders. Transfer fees are approximate public reports, not source data. The data is a snapshot, current to gameweek ${SEASONS[0].playedWeeks} of ${esc(SEASONS[0].label)}; rerun the ETL to refresh it. Not affiliated with the Premier League, its clubs or FPL.</p>
      <div class="setting-row"><div><strong>Reset preferences</strong><p class="muted">Restores defaults, including the season and display name.</p></div><button type="button" class="btn btn-ghost btn-sm" id="set-reset">Reset preferences</button></div></section>`;
  const sect = ctx.query.section; if (sect && $('#' + sect, ctx.root)) setTimeout(() => $('#' + sect, ctx.root).scrollIntoView({ block: 'start' }), 30);
  const bindName = () => { $$('[data-bind=displayName]').forEach(el => { el.textContent = Settings.get('displayName'); }); $$('.avatar.me').forEach(el => { el.textContent = initials(Settings.get('displayName') || 'Guest'); }); };
  $('#name-form', ctx.root).addEventListener('submit', e => { e.preventDefault(); const v = $('#set-name', ctx.root).value.trim() || 'Guest analyst'; Settings.set('displayName', v); $('#set-name', ctx.root).value = v; bindName(); const s = $('#name-saved', ctx.root); s.hidden = false; setTimeout(() => { s.hidden = true; }, 1800); });
  $('#set-season', ctx.root).addEventListener('change', e => Settings.set('defaultSeason', e.target.value));
  $('#set-latency', ctx.root).addEventListener('change', e => Settings.set('latency', e.target.value));
  $('#set-lang', ctx.root).addEventListener('change', e => I18n.set(e.target.value));
  $('#set-theme', ctx.root).addEventListener('change', e => { Settings.set('theme', e.target.value); location.reload(); });
  $('#set-replay', ctx.root).addEventListener('click', () => Galaxy.intro(true));
  const sw = (id, key, after) => $('#' + id, ctx.root).addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', on); Settings.set(key, on); after && after(on); });
  sw('set-motion', 'reduceMotion', on => document.documentElement.classList.toggle('reduce-motion', on));
  sw('set-fail', 'simulateFailure');
  sw('set-intro', 'intro');
  $('#set-reset', ctx.root).addEventListener('click', () => { Settings.reset(); document.documentElement.classList.remove('reduce-motion'); bindName(); $('#notif-dot').hidden = false; SettingsPage(ctx); });
}

function NotFoundPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Not found' }]);
  ctx.root.innerHTML = `<div class="card">${EmptyState('Page not found', 'This link does not match a page in PL Data Hub.', '<a class="btn btn-primary" href="#/">Go to home</a>')}</div>`;
}

/* ================= FIXTURE DIFFICULTY ================= */
async function FixtureDifficultyPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Fixture difficulty' }]);
  const q = { weeks: [3, 5, 8].includes(Number(ctx.query.weeks)) ? Number(ctx.query.weeks) : 5, sort: ctx.query.sort === 'table' ? 'table' : 'easiest' };
  const head = PageHead('Fixture difficulty', 'How hard each club’s next gameweeks look, rated from opponent strength and venue.');
  ctx.root.innerHTML = head + Skeleton('table');
  let d = await API.getFixtureDifficulty({ season: State.season, weeks: q.weeks });
  if (!ctx.alive()) return;
  if (!d.gws.length) {
    ctx.root.innerHTML = head + `<div class="card">${EmptyState(`${d.season.label} has no fixtures left`, 'Fixture difficulty looks ahead, so it needs a season in progress.', d.season.id !== CURRENT_SEASON ? `<button class="btn btn-primary" type="button" data-set-season="${CURRENT_SEASON}">View ${seasonLabel(CURRENT_SEASON)}</button>` : '')}</div>`;
    return;
  }
  ctx.root.innerHTML = head + `
    <div class="filter-bar card wrap">${Select('fd-weeks', 'Gameweeks ahead', [[3, 'Next 3'], [5, 'Next 5'], [8, 'Next 8']], q.weeks)}${Select('fd-sort', 'Order', [['easiest', 'Easiest run first'], ['table', 'League position']], q.sort)}
      <div class="fdr-legend" aria-label="Difficulty scale">${[1, 2, 3, 4, 5].map(l => `<span class="fdr fdr-${l}">${l}</span>`).join('')}<span class="muted">1 easiest, 5 hardest</span></div></div>
    <div class="grid-2 fdr-layout"><section class="card flush"><div id="fd-table"></div></section>
      <section class="card">${SectionHead('Team strength', '', 'Expected-goal difference per match over each club’s last 38 league games in the dataset.')}<div id="fd-strength"></div></section></div>
    <section class="card"><h2 class="section-head-sm">How it is calculated</h2><p class="muted small">Each club’s strength is its xG difference per match across its most recent 38 Premier League matches (goal difference for 2021/22, which has no xG), pulled towards a prior when a club has few recent matches: 0 for established clubs, −0.5 for newly promoted ones. A fixture’s difficulty is the opponent’s strength plus ${HOME_ADV} for playing away (minus ${HOME_ADV} at home), then split into five equal-sized bands across all fixtures shown. Official FPL difficulty ratings are not used.</p></section>`;
  const draw = () => {
    const rows = d.rows.slice().sort((a, b) => (q.sort === 'table' ? a.position - b.position : (a.avg ?? 9) - (b.avg ?? 9) || a.position - b.position));
    $('#fd-table', ctx.root).innerHTML = `<div class="table-scroll"><table class="data-table fdr-table"><caption class="sr-only">Fixture difficulty by gameweek</caption>
      <thead><tr><th scope="col">Team</th><th scope="col" class="num" data-tip="Average difficulty of the fixtures shown">Avg</th>${d.gws.map(g => `<th scope="col" class="num">GW${g}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr><td class="team-cell">${TeamLink(r.teamId, { crest: 20 })}</td><td class="num strong">${r.avg == null ? '–' : fmt.n(r.avg, 1)}</td>
        ${r.cells.map(list => `<td class="fdr-cell">${list.length ? list.map(c => `<a class="fdr fdr-${c.level}" href="#/matches/${c.matchId}" data-tip="${esc(`${TEAM_BY_ID[c.opp].name} ${c.venue === 'H' ? '(home)' : '(away)'}, ${fmt.date(c.date)}\nDifficulty ${c.level} of 5`)}">${esc(TEAM_BY_ID[c.opp].short)}<small>${c.venue}</small></a>`).join('') : '<span class="muted" data-tip="No fixture this gameweek">–</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  const strengths = Object.entries(d.strengths).sort((a, b) => b[1].rating - a[1].rating);
  HBarChart($('#fd-strength', ctx.root), { items: strengths.map(([t, v]) => ({ label: TEAM_BY_ID[t].name, sub: v.matches < 38 ? `${v.matches} games` : '', value: v.rating, href: `#/teams/${t}`, color: v.rating >= 0 ? 'linear-gradient(90deg,#16A34A,#22C55E)' : 'linear-gradient(90deg,#B91C1C,#F87171)' })), fmtVal: v => (v > 0 ? '+' : '') + fmt.n(v, 2), ariaLabel: 'Team strength ratings' });
  draw();
  $('#fd-weeks', ctx.root).addEventListener('change', async e => { q.weeks = Number(e.target.value); Router.setQuery({ weeks: q.weeks, sort: q.sort }); d = await API.getFixtureDifficulty({ season: State.season, weeks: q.weeks }, { fast: true }); if (ctx.alive()) draw(); });
  $('#fd-sort', ctx.root).addEventListener('change', e => { q.sort = e.target.value; Router.setQuery({ weeks: q.weeks, sort: q.sort }); draw(); });
}
