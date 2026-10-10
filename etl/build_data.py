"""ETL for PL Data Hub (real data).

Sources (downloaded into etl/raw/ by fetch.sh):
  * vaastav/Fantasy-Premier-League on GitHub — official FPL API snapshots:
      merged_gw.csv (one row per player per fixture), fixtures.csv, teams.csv, players_raw.csv
  * openfootball/football.json — independent results feed, used only to cross-check scores.
  * olbauday/FPL-Core-Insights on GitHub — refreshed twice daily; used for the CURRENT season because the
      vaastav archive lags. Provides per-gameweek FPL stats, per-match player stats and Opta-style team match
      stats (possession, shots, ...). Files in etl/raw/core/.

Output: src/data/real-data.js  (const REAL_DATA = {...})
"""
import csv, json, re, unicodedata, datetime, sys
from pathlib import Path

RAW = Path(__file__).parent / 'raw'
OUT = Path(__file__).parent.parent / 'src' / 'data' / 'real-data.js'
SEASONS = ['2026-27', '2025-26', '2024-25', '2023-24', '2022-23', '2021-22']

TEAM_SLUG = {
    'Arsenal': 'arsenal', 'Aston Villa': 'aston-villa', 'Bournemouth': 'bournemouth', 'Brentford': 'brentford',
    'Brighton': 'brighton', 'Burnley': 'burnley', 'Chelsea': 'chelsea', 'Crystal Palace': 'crystal-palace',
    'Everton': 'everton', 'Fulham': 'fulham', 'Leeds': 'leeds', 'Liverpool': 'liverpool', 'Man City': 'man-city',
    'Man Utd': 'man-utd', 'Newcastle': 'newcastle', "Nott'm Forest": 'nottm-forest', 'Sunderland': 'sunderland',
    'Spurs': 'tottenham', 'West Ham': 'west-ham', 'Wolves': 'wolves', 'Ipswich': 'ipswich', 'Ipswich Town': 'ipswich',
    'Leicester': 'leicester', 'Southampton': 'southampton', 'Luton': 'luton', 'Sheffield Utd': 'sheffield-utd',
    'Norwich': 'norwich', 'Watford': 'watford', 'Hull City': 'hull', 'Coventry City': 'coventry',
}
# openfootball names -> slug (cross-check only)
OF_SLUG = {
    'Arsenal FC': 'arsenal', 'Aston Villa FC': 'aston-villa', 'AFC Bournemouth': 'bournemouth', 'Brentford FC': 'brentford',
    'Brighton & Hove Albion FC': 'brighton', 'Burnley FC': 'burnley', 'Chelsea FC': 'chelsea', 'Crystal Palace FC': 'crystal-palace',
    'Everton FC': 'everton', 'Fulham FC': 'fulham', 'Leeds United FC': 'leeds', 'Liverpool FC': 'liverpool',
    'Manchester City FC': 'man-city', 'Manchester United FC': 'man-utd', 'Newcastle United FC': 'newcastle',
    'Nottingham Forest FC': 'nottm-forest', 'Sunderland AFC': 'sunderland', 'Tottenham Hotspur FC': 'tottenham',
    'West Ham United FC': 'west-ham', 'Wolverhampton Wanderers FC': 'wolves', 'Ipswich Town FC': 'ipswich',
    'Leicester City FC': 'leicester', 'Southampton FC': 'southampton', 'Luton Town FC': 'luton',
    'Sheffield United FC': 'sheffield-utd', 'Norwich City FC': 'norwich', 'Watford FC': 'watford',
}
POS = {'1': 'GK', '2': 'DF', '3': 'MF', '4': 'FW'}


def slugify(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('ø', 'o').replace('Ø', 'o').replace('đ', 'd').replace('ı', 'i').replace('ł', 'l').replace('ß', 'ss')
    return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))


def read(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return list(csv.DictReader(f))


def num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


# ---- people: stable id by FPL `code` across seasons; newest season wins for name/birth date
people = {}  # code -> dict
for s in SEASONS:  # newest first
    for r in read(RAW / f'fpl_{s}_players_raw.csv'):
        if r.get('element_type') not in POS:
            continue
        code = r['code']
        p = people.setdefault(code, {})
        if 'name' not in p:
            known = (r.get('known_name') or '').strip()
            full = f"{r['first_name'].strip()} {r['second_name'].strip()}".strip()
            web = r.get('web_name', '').strip()
            if not known and len(full) > 24 and web:
                # very long registered names (e.g. 'Cristiano Ronaldo dos Santos Aveiro') -> first name + FPL short name
                short = web.split('.')[-1].strip()
                first = r['first_name'].strip().split(' ')[0]
                known = short if slugify(first).startswith(slugify(short)) else f'{first} {short}'
            p['name'] = known or full
            p['web'] = web
        if not p.get('birth') and r.get('birth_date') not in (None, '', 'None'):
            p['birth'] = r['birth_date']

used = {}
for code, p in sorted(people.items(), key=lambda kv: int(kv[0])):
    base = slugify(p['name']) or f'player-{code}'
    pid = base if base not in used else f'{base}-{code}'
    used[pid] = code
    p['id'] = pid

CORE = RAW / 'core'
CORE_SEASON = '2026-27'
POS_WORD = {'Goalkeeper': 'GK', 'Defender': 'DF', 'Midfielder': 'MF', 'Forward': 'FW'}
ADV_SUM = ['minutes_played', 'distance_covered', 'running_distance', 'sprinting_distance', 'number_of_sprints', 'touches', 'touches_opposition_box',
           'accurate_passes', 'chances_created', 'final_third_passes', 'accurate_crosses', 'accurate_long_balls', 'total_shots', 'shots_on_target',
           'xgot', 'big_chances_missed', 'duels_won', 'duels_lost', 'ground_duels_won', 'aerial_duels_won', 'tackles_won', 'interceptions',
           'blocks', 'clearances', 'recoveries', 'dribbled_past', 'was_fouled', 'fouls_committed', 'dispossessed', 'offsides',
           'xgot_faced', 'goals_prevented', 'sweeper_actions', 'high_claim', 'saves_inside_box']
ADV_COLS = ADV_SUM + ['top_speed', 'pass_pct', 'matches']
MATCH_STAT_COLS = ['possession', 'total_shots', 'shots_on_target', 'big_chances', 'accurate_passes_pct', 'corners', 'fouls_committed', 'offsides', 'expected_goals_xg']


def build_core_season(s):
    """Current season from FPL-Core-Insights: all 380 fixtures + stats for every finished gameweek."""
    teams_by_code = {r['code']: TEAM_SLUG[r['name']] for r in read(CORE / 'teams.csv')}
    # identities for players signed after the vaastav snapshot
    for r in read(CORE / 'players.csv'):
        code = r['player_code']
        if code not in people:
            full = f"{r['first_name'].strip()} {r['second_name'].strip()}".strip()
            web = r['web_name'].split('.')[-1].strip()
            name = full if len(full) <= 24 else f"{r['first_name'].split(' ')[0]} {web}"
            base = slugify(name)
            pid = base if base not in used else f'{base}-{code}'
            used[pid] = code
            people[code] = {'name': name, 'id': pid}
    matches = []
    for g in range(1, 39):
        f = CORE / f'gw{g}_matches.csv'
        if f.exists():
            matches += read(f)
    matches.sort(key=lambda m: (m['kickoff_time'] or '9999', m['match_id']))
    fx_rows, fx_by_match, stats_rows = [], {}, {}
    for i, m in enumerate(matches):
        done = m['finished'] == 'True'
        fx_by_match[m['match_id']] = i
        ko = (m['kickoff_time'] + 'Z') if m['kickoff_time'] and not m['kickoff_time'].endswith('Z') else m['kickoff_time']
        fx_rows.append([i + 1, int(float(m['gameweek'])), ko or None, teams_by_code[str(int(float(m['home_team'])))],
                        teams_by_code[str(int(float(m['away_team'])))], int(float(m['home_score'])) if done else None, int(float(m['away_score'])) if done else None])
        if done and m.get('stats_processed', 'True') == 'True':
            stats_rows[i] = [[num(m.get(f'{side}_{c}')) for c in MATCH_STAT_COLS] for side in ('home', 'away')]
    pl_index, pl_list, memberships, apps, dupes = {}, [], {}, [], 0
    code_of = {}
    stats_gws = set()
    adv = {}   # person id -> [sums..., top speed, pass% (minute-weighted), matches]
    for g in range(1, 39):
        gs, pmf, plf = CORE / f'gw{g}_player_gameweek_stats.csv', CORE / f'gw{g}_playermatchstats.csv', CORE / f'gw{g}_players.csv'
        # the source publishes player stats only once the whole gameweek is complete
        if not gs.exists() or not read(gs) or not pmf.exists():
            continue
        # use a gameweek only when every finished match in it has match-level stats; until then the source's
        # gameweek file is a live, partial snapshot
        pm_matches = {r['match_id'] for r in read(pmf)}
        done_ids = [m['match_id'] for m in matches if int(float(m['gameweek'])) == g and m['finished'] == 'True']
        if not done_ids or any(mid not in pm_matches for mid in done_ids):
            continue
        stats_gws.add(g)
        team_of = {r['player_id']: teams_by_code[r['team_code']] for r in read(plf)}
        code_of.update({r['player_id']: r['player_code'] for r in read(plf)})
        pos_of = {r['player_id']: POS_WORD.get(r['position']) for r in read(plf)}
        pm_by_player = {}
        for r in read(pmf):
            if r['match_id'] in fx_by_match:
                pm_by_player.setdefault(r['player_id'], []).append(r)
                mins = num(r['minutes_played'])
                if mins > 0 and r['player_id'] in code_of:
                    a = adv.setdefault(people[code_of[r['player_id']]]['id'], [0.0] * len(ADV_SUM) + [0.0, [0.0, 0.0], 0])
                    for k, c in enumerate(ADV_SUM):
                        a[k] += num(r.get(c))
                    a[len(ADV_SUM)] = max(a[len(ADV_SUM)], num(r.get('top_speed')))
                    if r.get('accurate_passes_percent') not in (None, ''):
                        a[len(ADV_SUM) + 1][0] += num(r['accurate_passes_percent']) * mins; a[len(ADV_SUM) + 1][1] += mins
                    a[-1] += 1
        seen = set()
        for r in read(gs):
            pidf = r['id']
            if pidf in seen:
                dupes += 1
                continue
            seen.add(pidf)
            if pidf not in team_of or not pos_of.get(pidf):
                continue
            person = people[code_of[pidf]]
            team = team_of[pidf]
            if person['id'] not in pl_index:
                pl_index[person['id']] = len(pl_list)
                pl_list.append([person['id'], person['name'], pos_of[pidf], person.get('birth'), int(code_of[pidf])])
            pi = pl_index[person['id']]
            team_fx = [i for i, f in enumerate(fx_rows) if f[1] == g and team in (f[3], f[4])]
            if not team_fx:
                continue
            date = (fx_rows[team_fx[0]][2] or '')[:10]
            mm = memberships.setdefault((pi, team), [date, date]); mm[1] = date
            mins = int(num(r['minutes']))
            if mins <= 0:
                continue
            pms = [x for x in pm_by_player.get(pidf, []) if x['match_id'] in fx_by_match]
            fi = fx_by_match[pms[0]['match_id']] if pms else team_fx[0]
            home = fx_rows[fi][3] == team
            apps.append([fi, pi, 1 if home else 0, mins, int(num(r['starts'])), int(num(r['goals_scored'])), int(num(r['assists'])),
                         round(num(r['expected_goals']) * 100), round(num(r['expected_assists']) * 100), round(num(r['expected_goals_conceded']) * 100),
                         int(num(r['clean_sheets'])), int(num(r['goals_conceded'])), int(num(r['saves'])), int(num(r['penalties_saved'])),
                         int(num(r['penalties_missed'])), int(num(r['own_goals'])), int(num(r['yellow_cards'])), int(num(r['red_cards'])),
                         int(num(r['bonus'])), int(num(r['bps'])), int(num(r['event_points'])), round(num(r['influence']) * 10),
                         round(num(r['creativity']) * 10), round(num(r['threat']) * 10), int(num(r['tackles'])),
                         int(num(r['clearances_blocks_interceptions'])), int(num(r['recoveries'])), int(num(r['defensive_contribution']))])
    adv_rows = {}
    for pid, a in adv.items():
        pct = a[len(ADV_SUM) + 1]
        adv_rows[pid] = [round(v, 2) for v in a[:len(ADV_SUM)]] + [round(a[len(ADV_SUM)], 1), round(pct[0] / pct[1], 1) if pct[1] else None, a[-1]]
    return fx_rows, pl_list, memberships, apps, dupes, stats_rows, adv_rows, stats_gws


out = {'generated': datetime.date.today().isoformat(), 'sources': [
    'Fantasy Premier League API snapshots via github.com/vaastav/Fantasy-Premier-League',
    'Results cross-checked against github.com/openfootball/football.json'], 'seasons': []}
report = []
problems = []

for s in SEASONS:
    use_core = s == CORE_SEASON and (CORE / 'teams.csv').exists()
    teams = {r['id']: TEAM_SLUG[r['name']] for r in read(RAW / f'fpl_{s}_teams.csv')}
    raw_players = {r['id']: r for r in read(RAW / f'fpl_{s}_players_raw.csv') if r.get('element_type') in POS}
    fixtures = read(RAW / f'fpl_{s}_fixtures.csv')
    fx_rows, fx_index = [], {}
    for f in sorted(fixtures, key=lambda f: (f['kickoff_time'] or '9999', int(f['id']))):
        done = f['finished'] == 'True'
        gw = int(f['event']) if f['event'] not in ('', 'None') else 0
        fx_index[f['id']] = len(fx_rows)
        fx_rows.append([int(f['id']), gw, f['kickoff_time'] or None, teams[f['team_h']], teams[f['team_a']],
                        int(float(f['team_h_score'])) if done else None, int(float(f['team_a_score'])) if done else None])

    gw_rows = read(RAW / f'fpl_{s}_merged_gw.csv')
    has_xg = any(num(r.get('expected_goals')) > 0 for r in gw_rows)
    has_def = 'tackles' in gw_rows[0] and any(num(r.get('tackles')) > 0 for r in gw_rows)
    pl_index, pl_list, memberships, apps = {}, [], {}, []
    seen, dupes = set(), 0
    for r in sorted(gw_rows, key=lambda r: (r['kickoff_time'], r['fixture'])):
        key = (r['element'], r['fixture'])
        if key in seen:  # the source occasionally repeats a player-fixture row
            dupes += 1
            continue
        seen.add(key)
        rp = raw_players.get(r['element'])
        if rp is None or r['fixture'] not in fx_index:
            continue
        person = people[rp['code']]
        if person['id'] not in pl_index:
            pl_index[person['id']] = len(pl_list)
            pl_list.append([person['id'], person['name'], POS[rp['element_type']], person.get('birth'), int(rp['code'])])
        pi = pl_index[person['id']]
        team = TEAM_SLUG[r['team']]
        m = memberships.setdefault((pi, team), [r['kickoff_time'][:10], r['kickoff_time'][:10]])
        m[1] = r['kickoff_time'][:10]
        mins = int(num(r['minutes']))
        if mins <= 0:
            continue
        fi = fx_index[r['fixture']]
        home = r['was_home'] == 'True'
        apps.append([fi, pi, 1 if home else 0, mins, int(num(r.get('starts'), 1 if mins >= 60 else 0)),
                     int(num(r['goals_scored'])), int(num(r['assists'])),
                     round(num(r.get('expected_goals')) * 100), round(num(r.get('expected_assists')) * 100),
                     round(num(r.get('expected_goals_conceded')) * 100),
                     int(num(r['clean_sheets'])), int(num(r['goals_conceded'])), int(num(r['saves'])),
                     int(num(r['penalties_saved'])), int(num(r['penalties_missed'])), int(num(r['own_goals'])),
                     int(num(r['yellow_cards'])), int(num(r['red_cards'])), int(num(r['bonus'])), int(num(r['bps'])),
                     int(num(r['total_points'])), round(num(r['influence']) * 10), round(num(r['creativity']) * 10),
                     round(num(r['threat']) * 10), int(num(r.get('tackles'))), int(num(r.get('clearances_blocks_interceptions'))),
                     int(num(r.get('recoveries'))), int(num(r.get('defensive_contribution')))])

    match_stats, adv_rows, stats_gws = {}, {}, None
    if use_core:
        fx_rows, pl_list, memberships, apps, dupes, match_stats, adv_rows, stats_gws = build_core_season(s)
        has_xg, has_def = True, True

    # ---- integrity checks: player goals + opponent own goals must equal the official score
    by_fix = {}
    for a in apps:
        d = by_fix.setdefault(a[0], {1: [0, 0], 0: [0, 0]})
        d[a[2]][0] += a[5]; d[a[2]][1] += a[15]
    goal_mismatch = 0
    pending = []   # finished fixtures whose player stats are not published yet (gameweek in progress)
    for fi, f in enumerate(fx_rows):
        if f[5] is None:
            continue
        if stats_gws is not None and f[1] not in stats_gws:
            pending.append(fi)
            continue
        d = by_fix.get(fi, {1: [0, 0], 0: [0, 0]})
        if d[1][0] + d[0][1] != f[5] or d[0][0] + d[1][1] != f[6]:
            goal_mismatch += 1
    of_mismatch = of_checked = 0
    of_path = RAW / f'of_{s}.json'
    if of_path.exists():
        of = {(OF_SLUG.get(m['team1']), OF_SLUG.get(m['team2'])): m['score']['ft'] for m in json.load(open(of_path))['matches'] if 'score' in m and 'ft' in m['score']}
        for f in fx_rows:
            if f[5] is None:
                continue
            key = (f[3], f[4])
            if key in of:
                of_checked += 1
                if list(of[key]) != [f[5], f[6]]:
                    of_mismatch += 1
    if goal_mismatch or of_mismatch:
        problems.append(f'{s}: {goal_mismatch} goal-sum mismatches, {of_mismatch} openfootball mismatches')
    played = sum(1 for f in fx_rows if f[5] is not None)
    through = max((f[1] for f in fx_rows if f[5] is not None), default=0)
    last = max((f[2] for f in fx_rows if f[5] is not None), default=None)
    report.append(f'{s} [{"FPL-Core-Insights" if use_core else "vaastav"}]: fixtures {len(fx_rows)}, played {played}, through GW{through}, players {len(pl_list)}, appearances {len(apps)}, '
                  f'duplicate rows dropped {dupes}, awaiting player stats {len(pending)}, goal-sum mismatches {goal_mismatch}, openfootball checked {of_checked} mismatches {of_mismatch}')

    transfers_in = []
    for code_row in raw_players.values():
        if code_row.get('team_join_date') not in (None, '', 'None'):
            transfers_in.append([people[code_row['code']]['id'], teams[code_row['team']], code_row['team_join_date']])

    out['seasons'].append({
        'id': s, 'label': s.replace('-', '/'), 'teams': sorted(set(teams.values())), 'hasXg': has_xg, 'hasDefensive': has_def,
        'played': played, 'throughGw': through, 'lastMatch': last, 'players': pl_list,
        'memberships': [[pi, t, a, b] for (pi, t), (a, b) in memberships.items()],
        'fixtures': fx_rows, 'apps': apps, 'joinDates': transfers_in,
        'pendingStats': pending,
        'source': 'FPL-Core-Insights' if use_core else 'vaastav', 'matchStatCols': MATCH_STAT_COLS if match_stats else [],
        'matchStats': {str(k): v for k, v in match_stats.items()},
        'advancedCols': ADV_COLS if adv_rows else [], 'advanced': adv_rows,
    })

team_codes = {}
for s2 in SEASONS:
    for r in read(RAW / f'fpl_{s2}_teams.csv'):
        team_codes.setdefault(TEAM_SLUG[r['name']], int(r['code']))
out['teamCodes'] = team_codes
OUT.write_text('/* Generated by etl/build_data.py — do not edit by hand. */\nconst REAL_DATA = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n', encoding='utf-8')
print('\n'.join(report))
print('written', OUT, OUT.stat().st_size // 1024, 'KB')
if '--strict' in sys.argv and problems:
    sys.exit('Integrity check failed, not deploying:\n' + '\n'.join(problems))
