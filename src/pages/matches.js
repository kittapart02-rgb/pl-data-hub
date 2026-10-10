/* pages/matches.js — Fixtures (/fixtures) and Match Center (/matches/:matchId). */

async function FixturesPage(ctx) {
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Fixtures' }]);
  const hasUpcoming = repo(State.season).played.length < repo(State.season).matches.length;
  const q = { tab: ctx.query.tab === 'results' || (!ctx.query.tab && !hasUpcoming) ? 'results' : 'upcoming', month: ctx.query.month || '', team: ctx.query.team || '', venue: ctx.query.venue || '' };
  const head = PageHead('Fixtures & results', 'Every Premier League match. Select a match for the full match centre.');
  ctx.root.innerHTML = head + Skeleton('table');
  const status = () => (q.tab === 'results' ? 'finished' : 'scheduled');
  const load = fast => API.getMatches({ season: State.season, status: status(), month: q.month, team: q.team, venue: q.venue }, { fast });
  const first = await load(false);
  if (!ctx.alive()) return;
  ctx.root.innerHTML = head + `
    ${Tabs('fx-tabs', [['upcoming', 'Upcoming'], ['results', 'Results']], q.tab, 'Fixture list')}
    <div class="filter-bar card wrap">${SeasonField('fx-season')}<span id="fx-month-wrap"></span>${Select('fx-team', 'Team', teamOptions(), q.team)}
      ${Select('fx-venue', 'Home / away', [['', 'Home and away'], ['home', 'Home only'], ['away', 'Away only']], q.venue, { disabled: !q.team })}
      <p class="fine inline-hint" id="fx-venue-hint" ${q.team ? 'hidden' : ''}>Choose a team to filter by venue.</p></div>
    <div id="fx-list" aria-live="polite"></div>`;
  const list = $('#fx-list', ctx.root);
  const monthSelect = months => {
    if (q.month && !months.includes(q.month)) q.month = '';
    $('#fx-month-wrap', ctx.root).innerHTML = Select('fx-month', 'Month', [['', 'All months'], ...months.map(m => [m, fmt.month(m)])], q.month);
    $('#fx-month', ctx.root).addEventListener('change', e => { q.month = e.target.value; refresh(); });
  };
  const draw = res => {
    if (!res.rows.length) {
      const seasonDone = q.tab === 'upcoming' && !q.month && !q.team;
      list.innerHTML = EmptyState(seasonDone ? 'No upcoming fixtures' : 'No matches found', seasonDone ? `${seasonLabel(State.season)} is complete. Switch to Results to see every match.` : 'Try changing your filters.',
        seasonDone ? '<button type="button" class="btn btn-ghost" data-goto-tab="results">Show results</button>' : '<button type="button" class="btn btn-ghost" data-clear>Clear filters</button>');
      return;
    }
    const groups = []; res.rows.forEach(m => { const g = groups[groups.length - 1]; if (g && g.mw === m.matchweek) g.rows.push(m); else groups.push({ mw: m.matchweek, rows: [m] }); });
    list.innerHTML = groups.map(g => `<section class="mw-group" aria-labelledby="mw-${g.mw}"><h2 id="mw-${g.mw}" class="mw-title">Gameweek ${g.mw}<span>${fmt.date(g.rows[0].date)}${g.rows.length > 1 && g.rows[g.rows.length - 1].date !== g.rows[0].date ? ` to ${fmt.date(g.rows[g.rows.length - 1].date)}` : ''}</span></h2>
      <div class="grid-fixtures">${g.rows.map(FixtureCard).join('')}</div></section>`).join('');
  };
  let tok = 0;
  const refresh = async (resetMonth = false) => {
    const my = ++tok; if (resetMonth) q.month = ''; Router.setQuery(q);
    try { const res = await load(true); if (my !== tok || !ctx.alive()) return; monthSelect(res.months); draw(res); }
    catch (e) { if (my === tok) list.innerHTML = ErrorState(e.message); }
  };
  bindTabs(ctx.root, 'fx-tabs', tab => { q.tab = tab; refresh(true); });
  $('#fx-team', ctx.root).addEventListener('change', e => {
    q.team = e.target.value; const v = $('#fx-venue', ctx.root); v.disabled = !q.team; if (!q.team) { q.venue = ''; v.value = ''; }
    $('#fx-venue-hint', ctx.root).hidden = !!q.team; refresh();
  });
  $('#fx-venue', ctx.root).addEventListener('change', e => { q.venue = e.target.value; refresh(); });
  list.addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { Object.assign(q, { month: '', team: '', venue: '' }); $('#fx-team', ctx.root).value = ''; const v = $('#fx-venue', ctx.root); v.value = ''; v.disabled = true; $('#fx-venue-hint', ctx.root).hidden = false; refresh(); }
    const t = e.target.closest('[data-goto-tab]'); if (t) { const b = $(`[data-tab="${t.dataset.gotoTab}"]`, ctx.root); b && b.click(); }
  });
  monthSelect(first.months); draw(first);
}

async function MatchPage(ctx) {
  const id = ctx.params.matchId;
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Fixtures', href: '#/fixtures' }, { label: 'Match centre' }]);
  ctx.root.innerHTML = Skeleton('profile');
  const m = await API.getMatch(id);
  if (!ctx.alive()) return;
  const H = TEAM_BY_ID[m.home], A = TEAM_BY_ID[m.away]; const done = m.status === 'finished'; const si = m.seasonInfo;
  setCrumbs([{ label: 'Home', href: '#/' }, { label: 'Fixtures', href: `#/fixtures${done ? '?tab=results' : ''}` }, { label: `${H.short} v ${A.short}` }]);
  const seasonNote = m.season !== State.season ? `<p class="notice">${icon('info', 16)}This match is from ${seasonLabel(m.season)}. The season selector is set to ${seasonLabel(State.season)}.</p>` : '';
  const scorers = side => m.events.filter(e => (e.type === 'goal' || e.type === 'og') && e.side === side).map(e => `${esc(m.players.find(p => p.pid === e.pid).name)}${e.n > 1 ? ` ×${e.n}` : ''}${e.type === 'og' ? ' (og)' : ''}`).join('<br>');
  const header = `<section class="match-hero card">
    <div class="mh-meta"><span>${esc(seasonLabel(m.season))}, gameweek ${m.matchweek}</span><span>${icon('calendar', 13)}${fmt.dateLong(m.date)}</span><span>${icon('pin', 13)}${esc(m.stadium)}</span></div>
    <div class="mh-main">
      <a class="mh-team" href="#/teams/${H.id}">${Crest(H, 76)}<strong>${esc(H.name)}</strong><span>${ordinal(m.homeStanding.position)} in table</span></a>
      <div class="mh-score">${done ? `<div class="big-score" aria-label="${m.score.home} to ${m.score.away}">${m.score.home}<span>–</span>${m.score.away}</div><span class="status ft">Full time</span>` : `<div class="big-ko">${esc(m.time)}</div><span class="status">Kick-off, UK time</span>`}</div>
      <a class="mh-team" href="#/teams/${A.id}">${Crest(A, 76)}<strong>${esc(A.name)}</strong><span>${ordinal(m.awayStanding.position)} in table</span></a>
    </div>
    ${done && (m.score.home || m.score.away) ? `<div class="mh-scorers"><div>${scorers('home')}</div><span>${icon('ball', 14)}</span><div>${scorers('away')}</div></div>` : ''}
  </section>`;

  if (!done) {
    const hs = m.homeStanding, as = m.awayStanding;
    const row = (l, h, a, dec = 2, lowerBetter = false) => CompareRow(l, h, a, { dec, lowerBetter });
    ctx.root.innerHTML = seasonNote + header + `<div class="grid-2">
      <section class="card">${SectionHead('Form guide', '', 'Last five league matches, oldest to newest.')}
        <div class="form-guide"><div>${TeamLink(H.id)}${FormPills(hs.results.slice(-5), { links: true })}</div><div>${TeamLink(A.id)}${FormPills(as.results.slice(-5), { links: true })}</div></div></section>
      <section class="card">${SectionHead('Season comparison', '', 'Per-match averages so far this season.')}
        <div class="cmp-mini"><div class="cmp-row head"><span>${esc(H.short)}</span><span></span><span>${esc(A.short)}</span></div>
        ${hs.mp && as.mp ? row('Points per match', hs.pts / hs.mp, as.pts / as.mp) + row('Goals per match', hs.gf / hs.mp, as.gf / as.mp) + (si.hasXg ? row('xG per match', hs.xg / hs.mp, as.xg / as.mp) : '') + row('Conceded per match', hs.ga / hs.mp, as.ga / as.mp, 2, true) : '<p class="muted">No matches played yet.</p>'}</div></section></div>
      ${m.reverse && m.reverse.status === 'finished' ? `<section class="card">${SectionHead('Reverse fixture')}${MatchRow(m.reverse)}</section>` : ''}
      <section class="card">${EmptyState('Match not played yet', 'Match stats, events and player points appear here after full time.', '<a class="btn btn-ghost" href="#/fixtures">Back to fixtures</a>')}</section>`;
    return;
  }

  if (m.statsPending) {
    ctx.root.innerHTML = seasonNote + header + `<section class="card">${EmptyState('Player stats not published yet', 'The result is final and already counts in the table. Player stats for this gameweek are published once every match in it has been played, and appear here after the next data refresh.', '<a class="btn btn-ghost" href="#/fixtures?tab=results">Back to results</a>')}</section>`;
    return;
  }
  const order = p => 'GKDFMFFW'.indexOf(p.position);
  const lineup = side => m.players.filter(p => p.side === side).sort((a, b) => (b.start - a.start) || order(a) - order(b) || b.min - a.min);
  const best = m.players.slice().sort((a, b) => b.bps - a.bps)[0];
  const playerTable = (side, team) => `<div class="table-scroll"><table class="data-table ratings"><caption>${Crest(team, 18)} ${esc(team.name)}</caption><thead><tr><th scope="col">Player</th><th scope="col" class="num">Min</th><th scope="col" class="num">G</th><th scope="col" class="num">A</th>${si.hasXg ? '<th scope="col" class="num">xG</th>' : ''}<th scope="col" class="num" data-tip="Bonus points system score">BPS</th><th scope="col" class="num" data-tip="Fantasy Premier League points">Pts</th></tr></thead>
    <tbody>${lineup(side).map(s => `<tr data-href="#/players/${s.pid}"><td class="player-cell">${PlayerLink({ id: s.pid, name: s.name, teamId: team.id }, { size: 26, meta: false })}${s.start ? '' : '<span class="sub-tag">Sub</span>'}${best.pid === s.pid ? '<span class="motm" data-tip="Highest BPS score in the match">Top BPS</span>' : ''}</td><td class="num">${s.min}</td><td class="num">${s.g || ''}</td><td class="num">${s.a || ''}</td>${si.hasXg ? `<td class="num">${fmt.n(s.xg, 2)}</td>` : ''}<td class="num">${s.bps}</td><td class="num"><span class="rating-badge ${s.pts >= 8 ? 'hi' : s.pts <= 1 ? 'lo' : ''}">${s.pts}</span></td></tr>`).join('')}</tbody></table></div>`;

  ctx.root.innerHTML = seasonNote + header + `
    <div class="grid-2">
      <section class="card">${SectionHead('Match stats', '', m.opta ? 'Team stats from the match feed, plus totals of the players’ FPL stats.' : 'Totals of the players’ recorded stats for each side.')}<div class="sb-teams"><span>${Crest(H, 20)}${esc(H.short)}</span><span>${esc(A.short)}${Crest(A, 20)}</span></div>${MatchStatBars(m)}</section>
      <section class="card">${SectionHead('Match events')}${MatchEvents(m)}</section>
    </div>
    <section class="card">${SectionHead('Player performances', '', 'Starters first, then substitutes. FPL points and BPS are the official Fantasy Premier League scores for the match.')}<div class="grid-2 tight">${playerTable('home', H)}${playerTable('away', A)}</div></section>`;
}

function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
