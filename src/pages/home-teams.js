/* pages/home-teams.js — Home (/), Teams (/teams), Team profile (/teams/:teamId). */

function SeasonField(id = 'page-season', label = 'Season') {
  return Select(id, label, seasonOptions(), State.season).replace('<select ', '<select data-season-mirror ');
}

/* ================= HOME ================= */
async function HomePage(ctx) {
  setCrumbs([{ label: 'Home' }]);
  ctx.root.innerHTML = Skeleton('page');
  const d = await API.getOverview({ season: State.season });
  if (!ctx.alive()) return;
  const k = d.kpis; const s = d.season; const inProgress = s.playedWeeks < 38;
  const byStat = (key, filter = () => true) => d.players.filter(p => p.stats.apps && filter(p)).sort((a, b) => (b.stats[key] ?? 0) - (a.stats[key] ?? 0) || a.name.localeCompare(b.name));
  const scorers = byStat('g').slice(0, 12);
  const hasXg = s.hasXg;
  const topBy = { g: byStat('g').slice(0, 5), a: byStat('a').slice(0, 5), pts: byStat('pts').slice(0, 5), xg: hasXg ? byStat('xg').slice(0, 5) : [] };
  const goalsTeams = d.standings.slice().sort((a, b) => b.gf - a.gf).slice(0, 5);
  const byId = id => d.players.find(p => p.id === id && p.stats.apps);
  let a = byId('mohamed-salah'), b = byId('erling-haaland');
  if (!a || !b) [a, b] = byStat('g').slice(0, 2);
  const race = d.standings.slice(0, 4);

  const topList = key => {
    const dec = key === 'xg' ? 1 : 0;
    if (!topBy[key].length) return EmptyState('No matches yet', 'Player rankings appear once games have been played.');
    return `<ol class="rank-list">${topBy[key].map((p, i) => `<li><a href="#/players/${p.id}" class="rank-row"><span class="rank-n">${i + 1}</span>${Avatar(p, 36)}<span class="rank-main"><strong>${esc(p.name)}</strong><span>${esc(TEAM_BY_ID[p.teamId].name)}</span></span><span class="rank-v">${fmt.n(p.stats[key], dec)}</span></a></li>`).join('')}</ol>`;
  };

  ctx.root.innerHTML = `
  <section class="hero card" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="hero-kicker">${icon('ball', 16)}Premier League</p>
      <h1 id="hero-title">Football data &amp; analytics</h1>
      <p class="hero-sub">Explore teams, players, matches and performance across the Premier League.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="#/teams">Explore teams</a><a class="btn btn-ghost" href="#/players">Explore players</a></div>
      <div class="hero-season">${SeasonField('hero-season')}<span class="hero-status">${inProgress ? `After gameweek ${s.playedWeeks} of 38 (${k.played} of 380 matches)` : 'Season complete'}</span></div>
    </div>
    <figure class="hero-visual"><div id="race-chart" class="hero-chart"></div><figcaption>${inProgress ? 'Race so far' : 'Title race'}: points after each gameweek for the top four in ${esc(s.label)}.</figcaption></figure>
  </section>

  <section class="grid-kpi six" aria-label="Season in numbers">
    ${StatCard({ icon: 'shield', label: 'Teams', value: k.teams })}
    ${StatCard({ icon: 'users', label: 'Players used', value: k.players, sub: 'appeared at least once' })}
    ${StatCard({ icon: 'calendar', label: 'Matches', value: k.matches, sub: `${k.played} played` })}
    ${StatCard({ icon: 'ball', label: 'Goals', value: k.goals })}
    ${StatCard({ icon: 'activity', label: 'Goals per match', value: k.goalsPerMatch, dec: 2 })}
    ${StatCard({ icon: 'percent', label: 'Home wins', value: k.homeWinPct, dec: 1, suffix: '%', sub: 'of matches played' })}
  </section>

  <div class="grid-2 wide-left">
    <section class="card" aria-labelledby="h-table">${SectionHead('League table', `<a class="link" href="#/standings">Full table${icon('chevronRight', 14)}</a>`)}
      <h2 id="h-table" class="sr-only">League table</h2>${LeagueTable(d.standings)}
      <p class="zone-legend"><span class="zl ucl">UCL</span>Champions League <span class="zl uel">UEL</span>Europa League <span class="zl rel">REL</span>Relegation</p></section>
    <section class="card" aria-labelledby="h-scorers">${SectionHead('Top scorers', `<a class="link" href="#/statistics?metric=g">All scorers${icon('chevronRight', 14)}</a>`)}
      <h2 id="h-scorers" class="sr-only">Top scorers</h2><div id="scorers-chart"></div></section>
  </div>

  <div class="grid-2">
    <section class="card">${SectionHead('Top players')}${Tabs('tp-tabs', [['g', 'Goals'], ['a', 'Assists'], ['pts', 'FPL points'], ...(hasXg ? [['xg', 'xG']] : [])], 'g', 'Top players by')}
      <div id="tp-panel" role="tabpanel" aria-live="polite">${topList('g')}</div>
      <p class="fine">${hasXg ? 'xG and xA come from Opta via the FPL API.' : 'Expected goals (xG) were not published in FPL data before 2022/23.'}</p></section>
    <section class="card">${SectionHead('Goals by team', '', `Top five attacks${hasXg ? ' against their xG' : ''}. Hover or focus a bar for detail; select one to open the team.`)}<div id="goals-chart"></div></section>
  </div>

  <div class="grid-3">
    ${a && b ? `<section aria-label="Player comparison preview">${ComparisonCard(a, b, hasXg)}</section>` : ''}
    <section class="card">${SectionHead('Upcoming fixtures', `<a class="link" href="#/fixtures">All fixtures${icon('chevronRight', 14)}</a>`)}
      ${d.upcoming.length ? `<div class="match-list">${d.upcoming.map(m => MatchRow(m)).join('')}</div>` : EmptyState(`${s.label} is complete`, 'All 380 matches have been played.', s.id !== CURRENT_SEASON ? `<button class="btn btn-ghost" type="button" data-set-season="${CURRENT_SEASON}">View ${seasonLabel(CURRENT_SEASON)}</button>` : '')}</section>
    <section class="card">${SectionHead('Latest results', `<a class="link" href="#/fixtures?tab=results">All results${icon('chevronRight', 14)}</a>`)}
      <div class="match-list">${d.results.slice(0, 5).map(m => MatchRow(m)).join('')}</div></section>
  </div>`;

  HBarChart($('#scorers-chart', ctx.root), { items: scorers.map(p => ({ label: p.name, sub: TEAM_BY_ID[p.teamId].short, value: p.stats.g, href: `#/players/${p.id}` })), ariaLabel: 'Top scorers by goals' });
  BarChart($('#goals-chart', ctx.root), {
    labels: goalsTeams.map(r => TEAM_BY_ID[r.teamId].short), ariaLabel: 'Goals for the five highest-scoring teams',
    series: [{ name: 'Goals', values: goalsTeams.map(r => r.gf), color: '#8B6CFF' }, ...(hasXg ? [{ name: 'xG', values: goalsTeams.map(r => r.xg), color: '#3B82F6' }] : [])],
    tip: i => `${TEAM_BY_ID[goalsTeams[i].teamId].name}\nGoals: ${goalsTeams[i].gf}${hasXg ? `\nxG: ${fmt.n(goalsTeams[i].xg, 1)}` : ''}`,
    onClick: i => Router.go(`#/teams/${goalsTeams[i].teamId}`),
  });
  bindTabs(ctx.root, 'tp-tabs', key => { $('#tp-panel', ctx.root).innerHTML = topList(key); });
  if (s.playedWeeks > 0) LineChart($('#race-chart', ctx.root), {
    labels: race[0].pointsByWeek.map((_, i) => String(i + 1)), xPrefix: 'Gameweek ', height: 300, ariaLabel: 'Points after each gameweek for the top four',
    series: race.map((r, i) => ({ name: TEAM_BY_ID[r.teamId].name, values: r.pointsByWeek, color: ['#8B6CFF', '#3B82F6', '#FF3D81', '#22C55E'][i] })),
  });
  $('#race-chart', ctx.root).insertAdjacentHTML('afterend', `<div class="legend">${race.map((r, i) => `<span><i style="background:${['#8B6CFF', '#3B82F6', '#FF3D81', '#22C55E'][i]}"></i>${esc(TEAM_BY_ID[r.teamId].name)} ${r.pts}</span>`).join('')}</div>`);
  animateCounts(ctx.root);
}

/* ================= TEAMS ================= */
async function TeamsPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Teams' }]);
  const q = { search: ctx.query.search || '', sort: ctx.query.sort || 'position' };
  ctx.root.innerHTML = PageHead('Premier League teams', 'Explore team performance, squad data and statistics.') + Skeleton('grid');
  const first = await API.getTeams({ season: State.season, ...q });
  if (!ctx.alive()) return;
  ctx.root.innerHTML = PageHead('Premier League teams', 'Explore team performance, squad data and statistics.') + `
    <div class="filter-bar card">${SeasonField('t-season')}${SearchField('t-search', 'Search team', q.search, 'Team name or code')}
      ${Select('t-sort', 'Sort by', [['position', 'League position'], ['points', 'Points'], ['goals', 'Goals scored'], ...(repo(State.season).season.hasXg ? [['xg', 'Expected goals (xG)']] : []), ['conceded', 'Fewest conceded']], q.sort)}</div>
    <div id="teams-grid" aria-live="polite"></div>`;
  const grid = $('#teams-grid', ctx.root);
  const draw = rows => {
    const metric = { points: r => `${r.standing.pts} pts`, goals: r => `${r.standing.gf} goals`, xg: r => `${fmt.n(r.standing.xg, 1)} xG`, conceded: r => `${r.standing.ga} conceded` }[q.sort];
    grid.innerHTML = rows.length ? `<div class="grid-teams">${rows.map(r => `<a class="team-card" href="#/teams/${r.team.id}" style="--tc:${r.team.colors[0]}">
      <div class="tc-top">${Crest(r.team, 48)}<span class="tc-pos" aria-label="League position ${r.standing.position}"><small>Pos</small>${r.standing.position}</span></div>
      <div class="tc-name"><strong>${esc(r.team.name)}</strong><span>${esc(r.team.short)}</span></div>
      <div class="tc-stats"><span><small>Points</small><b>${r.standing.pts}</b></span><span><small>GD</small><b>${fmt.signed(r.standing.gd)}</b></span>${metric ? `<span class="tc-sortval">${metric(r)}</span>` : ''}</div>
      <div class="tc-form"><small>Form</small>${FormPills(r.standing.form)}</div></a>`).join('')}</div>`
      : EmptyState('No teams found', 'Try a different team name or clear the search.', '<button type="button" class="btn btn-ghost" id="t-clear">Clear search</button>');
    const c = $('#t-clear', grid); if (c) c.addEventListener('click', () => { q.search = ''; $('#t-search', ctx.root).value = ''; refresh(); });
  };
  let tok = 0;
  const refresh = async () => {
    const my = ++tok; Router.setQuery(q);
    try { const rows = await API.getTeams({ season: State.season, ...q }, { fast: true }); if (my === tok && ctx.alive()) draw(rows); }
    catch (e) { if (my === tok) grid.innerHTML = ErrorState(e.message); }
  };
  draw(first);
  $('#t-search', ctx.root).addEventListener('input', debounce(e => { q.search = e.target.value; refresh(); }, 180));
  $('#t-sort', ctx.root).addEventListener('change', e => { q.sort = e.target.value; refresh(); });
}

/* ================= TEAM PROFILE ================= */
async function TeamPage(ctx) {
  const id = ctx.params.teamId; const t = TEAM_BY_ID[id];
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Teams', href: '#/teams' }, { label: t ? t.name : 'Team' }]);
  ctx.root.innerHTML = Skeleton('profile');
  const d = await API.getTeam(id, { season: State.season });
  if (!ctx.alive()) return;
  const st = d.standing, ts = d.stats, s = d.season;
  const sq = { sort: 'min', dir: 'desc' };
  const squadTable = () => {
    const val = p => sq.sort === 'name' ? p.name : sq.sort === 'position' ? 'GKDFMFFW'.indexOf(p.position) : sq.sort === 'age' ? (p.age ?? -1) : (p.stats[sq.sort] ?? -1);
    const rows = d.squad.slice().sort((a, b) => { const va = val(a), vb = val(b); const c = typeof va === 'string' ? va.localeCompare(vb) : va - vb; return (sq.dir === 'asc' ? c : -c) || a.name.localeCompare(b.name); });
    return `<div class="table-scroll"><table class="data-table"><caption class="sr-only">${esc(t.name)} squad</caption><thead><tr>
      ${SortTh('name', 'Player', sq.sort, sq.dir, { num: false })}${SortTh('position', 'Position', sq.sort, sq.dir, { num: false })}${SortTh('age', 'Age', sq.sort, sq.dir)}${SortTh('apps', 'Apps', sq.sort, sq.dir, { title: 'Appearances' })}${SortTh('min', 'Min', sq.sort, sq.dir, { title: 'Minutes' })}${SortTh('g', 'Goals', sq.sort, sq.dir)}${SortTh('a', 'Assists', sq.sort, sq.dir)}${SortTh('pts', 'FPL pts', sq.sort, sq.dir, { title: 'Fantasy Premier League points' })}</tr></thead>
      <tbody>${rows.map(p => `<tr data-href="#/players/${p.id}"><td class="player-cell">${PlayerLink(p, { size: 30, meta: false })}${p.left ? '<span class="left-tag" data-tip="Moved to another Premier League club during the season. Stats shown are for this club only.">Left</span>' : ''}</td><td><span class="pos-badge pos-${p.position}">${POSITION_LABEL[p.position]}</span></td><td class="num">${p.age ?? '–'}</td><td class="num">${p.stats.apps}</td><td class="num">${fmt.n(p.stats.min)}</td><td class="num strong">${p.stats.g}</td><td class="num">${p.stats.a}</td><td class="num">${p.stats.pts}</td></tr>`).join('')}</tbody></table></div>`;
  };
  const last10 = st.results.slice(-10);
  const z = st.zone ? ZONES[st.zone] : null;
  ctx.root.innerHTML = `
    <section class="profile-hero card" style="--tc:${t.colors[0]}">
      <div class="ph-crest">${Crest(t, 104)}</div>
      <div class="ph-main"><h1>${esc(t.fullName)}</h1>
        <div class="chips"><span class="chip-static">Premier League</span><span class="chip-static">${esc(s.label)}</span><span class="chip-static">${icon('pin', 13)}${esc(stadiumFor(t, s.startYear))}</span><span class="chip-static">Founded ${t.founded}</span></div></div>
      <div class="ph-figs"><div><small>Position</small><b>${st.position}</b>${z ? `<span class="zone-tag" data-tip="${esc(z.tip)}">${z.short}</span>` : ''}</div><div><small>Points</small><b>${st.pts}</b></div></div>
    </section>
    <section class="grid-kpi eight" aria-label="Team season totals">
      ${StatCard({ label: 'Matches', value: st.mp })}${StatCard({ label: 'Wins', value: st.w })}${StatCard({ label: 'Draws', value: st.d })}${StatCard({ label: 'Losses', value: st.l })}
      ${StatCard({ label: 'Goals', value: st.gf })}${StatCard({ label: 'Goals conceded', value: st.ga })}${StatCard({ label: 'Goal difference', value: st.gd })}${StatCard({ label: 'Clean sheets', value: st.cs })}
    </section>
    <div class="grid-2 wide-left">
      <section class="card">${SectionHead('Points by gameweek', '', `Compared with the league leader and the league average after each gameweek.`)}<div id="pts-chart"></div></section>
      <section class="card">${SectionHead('Attack vs defence')}
        <div class="ad-grid"><div class="ad-col"><h3>${icon('target', 15)}Attack</h3>
          <dl><div><dt>Goals</dt><dd>${st.gf}</dd></div><div><dt>xG</dt><dd>${s.hasXg ? fmt.n(st.xg, 1) : '–'}</dd></div><div><dt>Goals per match</dt><dd>${st.mp ? fmt.n(st.gf / st.mp, 2) : '–'}</dd></div><div><dt>Goals minus xG</dt><dd>${s.hasXg ? fmt.signed(r1(st.gf - st.xg)) : '–'}</dd></div></dl></div>
        <div class="ad-col"><h3>${icon('shield', 15)}Defence</h3>
          <dl><div><dt>Goals conceded</dt><dd>${st.ga}</dd></div><div><dt>xG against</dt><dd>${s.hasXg ? fmt.n(st.xga, 1) : '–'}</dd></div><div><dt>Clean sheets</dt><dd>${st.cs}</dd></div><div><dt>${s.hasDefensive ? 'Tackles' : 'Goalkeeper saves'}</dt><dd>${s.hasDefensive ? ts.tackles : ts.saves}</dd></div></dl></div></div>
        <p class="fine">${ts.playersUsed} players used. ${ts.yellow} yellow and ${ts.red} red cards.${s.hasXg ? '' : ' xG was not published in FPL data before 2022/23.'}</p></section>
    </div>
    <section class="card">${SectionHead('Form', '', 'Last 10 league matches, oldest to newest. Select a result to open the match.')}<div class="form-lg">${FormPills(last10, { links: true, size: 'lg' })}</div></section>
    <section class="card">${SectionHead('Squad', '', 'Everyone registered to the club this season, with stats for this club. Select a column to sort, or a player to open their profile.')}<div id="squad">${squadTable()}</div></section>
    <div class="grid-2">
      <section class="card">${SectionHead('Upcoming fixtures')}${d.upcoming.length ? `<div class="match-list">${d.upcoming.map(m => MatchRow(m)).join('')}</div>` : EmptyState('No fixtures left', `${s.label} is complete for ${t.name}.`)}</section>
      <section class="card">${SectionHead('Recent results', `<a class="link" href="#/fixtures?tab=results&team=${t.id}">All results${icon('chevronRight', 14)}</a>`)}<div class="match-list">${d.recent.map(m => MatchRow(m, { perspective: t.id })).join('')}</div></section>
    </div>`;
  if (st.mp) LineChart($('#pts-chart', ctx.root), {
    labels: st.pointsByWeek.map((_, i) => String(i + 1)), xPrefix: 'Gameweek ', ariaLabel: `${t.name} points accumulated by matchweek`, yLabel: 'Points',
    series: [{ name: t.name, values: st.pointsByWeek, color: '#8B6CFF' }, { name: 'Leader', values: d.leaderPoints, color: '#94A3B8', dashed: true }, { name: 'League average', values: d.averagePoints, color: '#3B82F6', dashed: true }],
    fmtVal: v => fmt.n(v, Number.isInteger(v) ? 0 : 1),
  });
  $('#pts-chart', ctx.root).insertAdjacentHTML('afterend', `<div class="legend"><span><i style="background:#8B6CFF"></i>${esc(t.name)}</span><span><i class="dash" style="background:#94A3B8"></i>Leader</span><span><i class="dash" style="background:#3B82F6"></i>League average</span></div>`);
  $('#squad', ctx.root).addEventListener('click', e => {
    const b = e.target.closest('[data-sort]'); if (!b) return;
    const key = b.dataset.sort; sq.dir = sq.sort === key && sq.dir === 'desc' ? 'asc' : (key === 'name' || key === 'position') && sq.sort !== key ? 'asc' : 'desc'; sq.sort = key;
    $('#squad', ctx.root).innerHTML = squadTable(); const nb = $(`[data-sort="${key}"]`, ctx.root); nb && nb.focus();
  });
  animateCounts(ctx.root);
}
