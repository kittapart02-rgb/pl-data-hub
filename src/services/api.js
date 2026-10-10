/* services/api.js — the only data entry point the UI uses.
   Each method mirrors a REST endpoint (documented beside it) and resolves against the in-browser
   repository built from real FPL data. To use a live backend, replace `resolve` bodies with fetch() calls
   that return the same shapes. */

function apiDelay(fast) {
  const lat = Settings.get('latency');
  const base = lat === 'off' ? 0 : lat === 'slow' ? 1400 : 200;
  return new Promise(res => setTimeout(res, fast ? Math.min(base, 40) : base && base + Math.random() * 100));
}
async function resolve(endpoint, fn, opts = {}) {
  await apiDelay(opts.fast);
  if (Settings.get('simulateFailure')) throw new Error(`Request to ${endpoint} failed (simulated network error).`);
  return fn();
}

function teamSummary(R, id) { return { team: TEAM_BY_ID[id], standing: R.standingByTeam[id], stats: R.teamStats[id] }; }
function matchSummary(m) {
  return { id: m.id, season: m.season, matchweek: m.matchweek, date: m.date, time: m.time, home: m.home, away: m.away, stadium: m.stadium, status: m.status, score: m.score || null };
}
function playerRow(p) { return { id: p.id, name: p.name, teamId: p.teamId, position: p.position, age: p.age, birth: p.birth, photo: p.photo, stats: p.stats }; }

/* needs: 'xg' = expected-goals data (2022/23+), 'def' = defensive actions (2025/26+) */
const STAT_METRICS = [
  { key: 'g', label: 'Goals', dec: 0 },
  { key: 'a', label: 'Assists', dec: 0 },
  { key: 'xg', label: 'Expected goals (xG)', short: 'xG', dec: 2, needs: 'xg' },
  { key: 'xa', label: 'Expected assists (xA)', short: 'xA', dec: 2, needs: 'xg' },
  { key: 'xgi', label: 'Expected goal involvements (xGI)', short: 'xGI', dec: 2, needs: 'xg' },
  { key: 'pts', label: 'FPL points', dec: 0 },
  { key: 'ppg', label: 'FPL points per match', short: 'Pts/match', dec: 2, minMinutes: 900 },
  { key: 'bonus', label: 'Bonus points', dec: 0 },
  { key: 'bps', label: 'Bonus points system (BPS)', short: 'BPS', dec: 0 },
  { key: 'ict', label: 'ICT index', dec: 1 },
  { key: 'thr', label: 'Threat (ICT)', short: 'Threat', dec: 0 },
  { key: 'cre', label: 'Creativity (ICT)', short: 'Creativity', dec: 0 },
  { key: 'inf', label: 'Influence (ICT)', short: 'Influence', dec: 0 },
  { key: 'cs', label: 'Clean sheets', dec: 0, positions: ['GK', 'DF'] },
  { key: 'sv', label: 'Saves', dec: 0, positions: ['GK'] },
  { key: 'psv', label: 'Penalties saved', dec: 0, positions: ['GK'] },
  { key: 'tk', label: 'Tackles', dec: 0, needs: 'def' },
  { key: 'cbi', label: 'Clearances, blocks & interceptions', short: 'CBI', dec: 0, needs: 'def' },
  { key: 'rec', label: 'Recoveries', dec: 0, needs: 'def' },
  { key: 'dc', label: 'Defensive contributions', dec: 0, needs: 'def' },
  { key: 'dist', label: 'Distance covered (km)', short: 'Distance (km)', dec: 1, needs: 'adv' },
  { key: 'topSpeed', label: 'Top speed (km/h)', short: 'Top speed', dec: 1, needs: 'adv', minMinutes: 180 },
  { key: 'sprints', label: 'Sprints', dec: 0, needs: 'adv' },
  { key: 'duelsW', label: 'Duels won', dec: 0, needs: 'adv' },
  { key: 'aduels', label: 'Aerial duels won', dec: 0, needs: 'adv' },
  { key: 'touches', label: 'Touches', dec: 0, needs: 'adv' },
  { key: 'tib', label: 'Touches in opposition box', short: 'Box touches', dec: 0, needs: 'adv' },
  { key: 'cc', label: 'Chances created', dec: 0, needs: 'adv' },
  { key: 'f3', label: 'Final-third passes', dec: 0, needs: 'adv' },
  { key: 'shots', label: 'Shots', dec: 0, needs: 'adv' },
  { key: 'sot', label: 'Shots on target', dec: 0, needs: 'adv' },
  { key: 'xgot', label: 'xG on target (xGOT)', short: 'xGOT', dec: 2, needs: 'adv' },
  { key: 'gp', label: 'Goals prevented', dec: 2, needs: 'adv', positions: ['GK'] },
  { key: 'yc', label: 'Yellow cards', dec: 0 },
  { key: 'rc', label: 'Red cards', dec: 0 },
  { key: 'apps', label: 'Appearances', dec: 0 },
  { key: 'starts', label: 'Starts', dec: 0 },
  { key: 'min', label: 'Minutes', dec: 0 },
];
const METRIC_BY_KEY = Object.fromEntries(STAT_METRICS.map(m => [m.key, m]));
function metricAvailable(m, season) { const s = SEASONS.find(x => x.id === season); return !m.needs || ({ xg: s.hasXg, def: s.hasDefensive, adv: s.hasAdvanced })[m.needs]; }
function metricsFor(season) { return STAT_METRICS.filter(m => metricAvailable(m, season)); }

const API = {
  /** GET /api/seasons */
  getSeasons: () => resolve('/api/seasons', () => SEASONS, { fast: true }),

  /** GET /api/overview?season= */
  getOverview: ({ season }) => resolve('/api/overview', () => {
    const R = repo(season);
    const goals = R.played.reduce((s, m) => s + m.score.home + m.score.away, 0);
    const homeWins = R.played.filter(m => m.score.home > m.score.away).length;
    return {
      season: R.season,
      kpis: { teams: R.teams.length, players: R.players.filter(p => p.stats.apps).length, matches: R.matches.length, played: R.played.length, goals, goalsPerMatch: R.played.length ? goals / R.played.length : 0, homeWinPct: R.played.length ? homeWins / R.played.length * 100 : 0 },
      standings: R.standings, players: R.players.map(playerRow),
      upcoming: R.matches.filter(m => m.status === 'scheduled').slice(0, 5).map(matchSummary),
      results: R.played.slice(-6).reverse().map(matchSummary),
    };
  }),

  /** GET /api/teams?season=&search=&sort= */
  getTeams: ({ season, search = '', sort = 'position' }, opts) => resolve('/api/teams', () => {
    const R = repo(season); const q = search.trim().toLowerCase();
    const key = { position: r => r.standing.position, points: r => -r.standing.pts, goals: r => -r.standing.gf, xg: r => -r.standing.xg, conceded: r => r.standing.ga }[sort] || (r => r.standing.position);
    return R.teams.map(id => TEAM_BY_ID[id]).filter(t => !q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.fullName.toLowerCase().includes(q))
      .map(t => teamSummary(R, t.id)).sort((a, b) => key(a) - key(b) || a.standing.position - b.standing.position);
  }, opts),

  /** GET /api/teams/:id?season= */
  getTeam: (id, { season }) => resolve(`/api/teams/${id}`, () => {
    const R = repo(season);
    if (!TEAM_BY_ID[id]) throw new Error('Team not found.');
    if (!R.teams.includes(id)) throw new Error(`${TEAM_BY_ID[id].name} were not in the Premier League in ${R.season.label}.`);
    const matches = R.matches.filter(m => m.home === id || m.away === id);
    return {
      ...teamSummary(R, id), season: R.season,
      squad: (R.squads[id] || []).map(p => ({ ...playerRow(p), left: p.left })),
      leaderPoints: R.standings[0].pointsByWeek,
      averagePoints: R.standings[0].pointsByWeek.map((_, i) => r1(R.standings.reduce((s, row) => s + row.pointsByWeek[i], 0) / R.standings.length)),
      recent: matches.filter(m => m.status === 'finished').slice(-5).reverse().map(matchSummary),
      upcoming: matches.filter(m => m.status === 'scheduled').slice(0, 5).map(matchSummary),
    };
  }),

  /** GET /api/players?season=&team=&position=&age=&minApps=&search=&sort=&dir=&page=&pageSize= */
  getPlayers: (f, opts) => resolve('/api/players', () => {
    const R = repo(f.season); const q = slugify(f.search || '');
    const ageOk = a => !f.age || (a != null && (f.age === 'u21' ? a < 21 : f.age === '21-25' ? a >= 21 && a <= 25 : f.age === '26-29' ? a >= 26 && a <= 29 : a >= 30));
    const rows = R.players.filter(p => (!q || slugify(p.name).includes(q)) && (!f.team || p.teamId === f.team) && (!f.position || p.position === f.position)
      && ageOk(p.age) && p.stats.apps >= (Number(f.minApps) || 0));
    const sort = f.sort || 'g'; const dir = f.dir === 'asc' ? 1 : -1;
    const val = p => sort === 'name' ? p.name : sort === 'team' ? TEAM_BY_ID[p.teamId].name : sort === 'position' ? 'GKDFMFFW'.indexOf(p.position) : sort === 'age' ? (p.age ?? -1) : (p.stats[sort] ?? -1);
    const missing = p => sort === 'age' && p.age == null;   // unknown ages always sort last
    rows.sort((a, b) => { if (missing(a) !== missing(b)) return missing(a) ? 1 : -1; const va = val(a), vb = val(b); const c = typeof va === 'string' ? va.localeCompare(vb) : va - vb; return c * dir || b.stats.min - a.stats.min || a.name.localeCompare(b.name); });
    const pageSize = f.pageSize || 25; const total = rows.length; const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, f.page || 1), pages);
    return { total, page, pages, pageSize, rows: rows.slice((page - 1) * pageSize, page * pageSize).map(playerRow), hasXg: R.season.hasXg };
  }, opts),

  /** GET /api/players/:id?season= */
  getPlayer: (id, { season }) => resolve(`/api/players/${id}`, () => {
    const R = repo(season); const p = R.playerById[id];
    if (!p) {
      if (PEOPLE[id]) { const where = SEASONS.filter(s => repo(s.id).playerById[id]).map(s => s.id); const e = new Error(`${PEOPLE[id].name} was not registered with a Premier League club in ${R.season.label}.`); e.seasons = where; throw e; }
      throw new Error('Player not found.');
    }
    const matches = p.stats.series.slice(-6).reverse().map(s => ({ ...s, match: matchSummary(R.matchById[s.matchId]) }));
    const history = SEASONS.map(s => { const X = repo(s.id).playerById[id]; return X ? { season: s.id, label: s.label, teamId: X.teamId, apps: X.stats.apps, min: X.stats.min, g: X.stats.g, a: X.stats.a, pts: X.stats.pts } : null; }).filter(Boolean);
    return { player: playerRow(p), team: TEAM_BY_ID[p.teamId], season: R.season, radar: radarProfile(R, p), recentMatches: matches, playedWeeks: R.season.playedWeeks, history };
  }),

  /** GET /api/matches?season=&status=&month=&team=&venue= */
  getMatches: (f, opts) => resolve('/api/matches', () => {
    const R = repo(f.season);
    let rows = R.matches.filter(m => (!f.status || m.status === f.status) && (!f.month || (m.date || '').slice(0, 7) === f.month)
      && (!f.team || (f.venue === 'home' ? m.home === f.team : f.venue === 'away' ? m.away === f.team : m.home === f.team || m.away === f.team)));
    if (f.status === 'finished') rows = rows.slice().reverse();
    return { rows: rows.map(matchSummary), months: [...new Set(R.matches.filter(m => (!f.status || m.status === f.status) && m.date).map(m => m.date.slice(0, 7)))].sort() };
  }, opts),

  /** GET /api/matches/:id */
  getMatch: id => resolve(`/api/matches/${id}`, () => {
    const seasonId = id.slice(0, 7); const R = SEASONS.some(s => s.id === seasonId) ? repo(seasonId) : null;
    const m = R && R.matchById[id]; if (!m) throw new Error('Match not found.');
    return { ...m, homeStanding: R.standingByTeam[m.home], awayStanding: R.standingByTeam[m.away], seasonInfo: R.season,
      players: m.players.map(p => ({ ...p, name: R.playerById[p.pid].name, position: R.playerById[p.pid].position, teamId: m[p.side] })),
      reverse: (x => (x ? matchSummary(x) : null))(R.matches.find(x => x.home === m.away && x.away === m.home)) };
  }),

  /** GET /api/standings?season= */
  getStandings: ({ season }) => resolve('/api/standings', () => ({ season: repo(season).season, rows: repo(season).standings })),

  /** GET /api/statistics?season=&metric=&team=&position=&minApps=&search=&dir=&page= */
  getStatistics: (f, opts) => resolve('/api/statistics', () => {
    const R = repo(f.season); let metric = METRIC_BY_KEY[f.metric] || METRIC_BY_KEY.g;
    if (!metricAvailable(metric, f.season)) metric = METRIC_BY_KEY.g;
    const q = slugify(f.search || '');
    const pool = R.players.filter(p => p.stats.apps > 0 && p.stats.apps >= (Number(f.minApps) || 0) && (!f.team || p.teamId === f.team) && (!f.position || p.position === f.position)
      && (!metric.positions || metric.positions.includes(p.position)) && (!metric.minMinutes || p.stats.min >= metric.minMinutes) && p.stats[metric.key] != null);
    const dir = f.dir === 'asc' ? 1 : -1;
    pool.sort((a, b) => (a.stats[metric.key] - b.stats[metric.key]) * dir || a.name.localeCompare(b.name));
    let ranked = pool.map((p, i) => ({ p, rank: i + 1 }));
    ranked.forEach((x, i) => { if (i > 0 && x.p.stats[metric.key] === ranked[i - 1].p.stats[metric.key]) x.rank = ranked[i - 1].rank; });
    const chart = ranked.slice(0, 10).map(x => ({ id: x.p.id, name: x.p.name, teamId: x.p.teamId, value: x.p.stats[metric.key] }));
    if (q) ranked = ranked.filter(x => slugify(x.p.name).includes(q));
    const pageSize = 20; const total = ranked.length; const pages = Math.max(1, Math.ceil(total / pageSize)); const page = Math.min(Math.max(1, f.page || 1), pages);
    return { metric, total, page, pages, chart, rows: ranked.slice((page - 1) * pageSize, page * pageSize).map(x => ({ rank: x.rank, ...playerRow(x.p), value: x.p.stats[metric.key] })) };
  }, opts),

  /** GET /api/transfers?season=&team=&direction= */
  getTransfers: ({ season, team, direction }, opts) => resolve('/api/transfers', () => {
    const rows = derivedTransfers(season).filter(t => !team || (direction === 'in' ? t.to === team : direction === 'out' ? t.from === team : t.to === team || t.from === team));
    return { rows, oldest: SEASONS[SEASONS.length - 1].id };
  }, opts),

  /** POST /api/player-comparison { season, playerIds: [a, b] } */
  comparePlayers: ({ season, playerIds }, opts) => resolve('/api/player-comparison', () => {
    const R = repo(season);
    return playerIds.map(id => { const p = R.playerById[id]; if (!p) throw new Error(`${PEOPLE[id] ? PEOPLE[id].name : 'That player'} did not play in ${R.season.label}. Pick another player or season.`); return { player: playerRow(p), team: TEAM_BY_ID[p.teamId], radar: radarProfile(R, p) }; });
  }, opts),

  /** GET /api/records?season= */
  getRecords: ({ season }) => resolve('/api/records', () => {
    const R = repo(season);
    const top = (key, filter = () => true, n = 5) => R.players.filter(p => p.stats.apps && filter(p)).sort((a, b) => b.stats[key] - a.stats[key] || b.stats.min - a.stats.min || a.name.localeCompare(b.name)).slice(0, n).map(p => ({ ...playerRow(p), value: p.stats[key] }));
    const biggest = R.played.slice().sort((a, b) => Math.abs(b.score.home - b.score.away) - Math.abs(a.score.home - a.score.away) || (b.score.home + b.score.away) - (a.score.home + a.score.away))[0];
    const streaks = R.teams.map(t => {
      let best = 0, cur = 0, unb = 0, c2 = 0;
      R.standingByTeam[t].results.forEach(x => { cur = x.res === 'W' ? cur + 1 : 0; best = Math.max(best, cur); c2 = x.res !== 'L' ? c2 + 1 : 0; unb = Math.max(unb, c2); });
      return { teamId: t, wins: best, unbeaten: unb };
    });
    const teamTop = (fn, asc) => R.standings.slice().sort((a, b) => (asc ? fn(a) - fn(b) : fn(b) - fn(a)) || a.position - b.position).slice(0, 5).map(r => ({ teamId: r.teamId, value: fn(r) }));
    return {
      season: R.season,
      players: {
        goals: top('g'), assists: top('a'), cleanSheets: top('cs', p => p.position === 'GK'), apps: top('apps'),
        xg: R.season.hasXg ? top('xg') : null, xa: R.season.hasXg ? top('xa') : null, saves: top('sv', p => p.position === 'GK'),
        tackles: R.season.hasDefensive ? top('tk') : null, points: top('pts'),
      },
      teams: {
        mostGoals: teamTop(r => r.gf), fewestConceded: teamTop(r => r.ga, true), cleanSheets: teamTop(r => r.cs),
        winStreak: streaks.slice().sort((a, b) => b.wins - a.wins).slice(0, 5).map(s => ({ teamId: s.teamId, value: s.wins })),
        unbeaten: streaks.slice().sort((a, b) => b.unbeaten - a.unbeaten).slice(0, 5).map(s => ({ teamId: s.teamId, value: s.unbeaten })),
        biggestWin: biggest ? matchSummary(biggest) : null,
      },
    };
  }),

  /** GET /api/fixture-difficulty?season=&weeks= */
  getFixtureDifficulty: ({ season, weeks = 5 }) => resolve('/api/fixture-difficulty', () => {
    const R = repo(season); const str = teamStrengths(season);
    const upcoming = R.matches.filter(m => m.status === 'scheduled');
    if (!upcoming.length) return { season: R.season, gws: [], rows: [], strengths: str };
    const firstGw = Math.min(...upcoming.map(m => m.matchweek).filter(Boolean));
    const gws = Array.from({ length: weeks }, (_, i) => firstGw + i).filter(g => g <= 38);
    const cellsFor = t => gws.map(g => upcoming.filter(m => m.matchweek === g && (m.home === t || m.away === t)).map(m => {
      const home = m.home === t; const opp = home ? m.away : m.home;
      return { matchId: m.id, opp, venue: home ? 'H' : 'A', raw: str[opp].rating + (home ? -HOME_ADV : HOME_ADV), date: m.date };
    }));
    const rows = R.teams.map(t => ({ teamId: t, strength: str[t].rating, cells: cellsFor(t), position: R.standingByTeam[t].position }));
    // difficulty 1 (easiest) .. 5 (hardest): quintiles of every upcoming fixture in the window
    const all = rows.flatMap(r => r.cells.flat().map(c => c.raw)).sort((a, b) => a - b);
    const q = k => all[Math.min(all.length - 1, Math.floor(all.length * k))];
    const cuts = [q(0.2), q(0.4), q(0.6), q(0.8)];
    rows.forEach(r => {
      r.cells.forEach(list => list.forEach(c => { c.level = 1 + cuts.filter(x => c.raw > x).length; }));
      const flat = r.cells.flat(); r.avg = flat.length ? r2(flat.reduce((s, c) => s + c.level, 0) / flat.length) : null; r.games = flat.length;
    });
    return { season: R.season, gws, rows, strengths: str };
  }),

  /** GET /api/search?q=&season= */
  search: (q, { season }) => resolve('/api/search', () => {
    const R = repo(season); const s = slugify(q || '');
    if (s.length < 2) return { teams: [], players: [], matches: [] };
    const seasonTeams = R.teams.map(id => TEAM_BY_ID[id]);
    const teams = seasonTeams.filter(t => slugify(t.name).includes(s) || slugify(t.fullName).includes(s) || t.short.toLowerCase() === s);
    let players = R.players.filter(p => slugify(p.name).includes(s)).sort((a, b) => b.stats.min - a.stats.min);
    if (players.length < 6 && teams.length === 1) players = players.concat(R.players.filter(p => p.teamId === teams[0].id && !players.includes(p)).sort((a, b) => b.stats.min - a.stats.min));
    const words = (q || '').toLowerCase().split(/\s+v(?:s)?\.?\s+|\s+-\s+|\s+/).map(slugify).filter(w => w.length >= 3);
    const named = [...new Set(words.flatMap(w => seasonTeams.filter(t => slugify(t.name).includes(w) || t.short.toLowerCase() === w).map(t => t.id)))];
    let matches = [];
    if (named.length >= 2) matches = R.matches.filter(m => named.includes(m.home) && named.includes(m.away));
    else if (teams.length === 1) {
      const all = R.matches.filter(m => m.home === teams[0].id || m.away === teams[0].id);
      matches = [...all.filter(m => m.status === 'finished').slice(-2).reverse(), ...all.filter(m => m.status === 'scheduled').slice(0, 1)];
    }
    return { teams: teams.slice(0, 4), players: players.slice(0, 6).map(playerRow), matches: matches.slice(0, 4).map(matchSummary) };
  }, { fast: true }),
};
