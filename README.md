# PL Data Hub

Premier League analytics web app built on **real data**: 2021/22 to 2025/26 complete, plus the current 2026/27 season (refreshable twice daily).

## Data sources
- **Fantasy Premier League API** snapshots, archived in github.com/vaastav/Fantasy-Premier-League
  (per-player per-fixture stats: minutes, goals, assists, xG/xA from 2022/23, saves, cards, bonus/BPS, ICT, defensive actions from 2025/26).
- **openfootball/football.json**: independent results used to cross-check every score.
- **olbauday/FPL-Core-Insights** (refreshed twice daily): current season stats plus team match stats (possession, shots, corners, fouls).

Not in these sources, so not shown: possession, shots, passing, shot locations, event minutes. Transfer *moves* are derived from squad
registrations; fees are approximate public reports (`src/data/transfers.js`).

## Refresh the data
```
etl/fetch.sh                 # download raw CSV/JSON into etl/raw/
python3 etl/build_data.py    # -> src/data/real-data.js, prints integrity checks
python3 build.py             # -> dist/index.html
```
`build_data.py` reports, per season: duplicate source rows dropped, fixtures where player goals + own goals do not equal the
official score (must be 0), and mismatches against openfootball (must be 0).

## Structure
```
etl/         fetch.sh, build_data.py
src/data/    real-data.js (generated), teams.js (club reference), transfers.js (reported fees)
src/services repository.js (aggregations = SQL views), api.js (only data entry point for the UI)
src/lib/     core.js    src/components/  ui, charts, football, layout    src/pages/  home-teams, players, matches, more
schema.sql   PostgreSQL schema for a server-backed version
```
To run against a live backend, re-implement each `API.*` method in `src/services/api.js` as a `fetch()` returning the same shape.

## Club crests and player photos (personal use)
The published page cannot load remote images, so it uses generated crests and initials. Two local options:
- `python3 build.py --images remote` -> `dist/index-images-online.html`: open it in a browser with internet access;
  crests and photos load straight from resources.premierleague.com.
- Offline: `pip install pillow && python3 etl/embed_images.py && python3 build.py --images embedded`
  -> `dist/index-images.html` with the images embedded (about 2-3 MB extra for the current season; `--seasons all` for every player).
Any image that fails to load falls back to the generated crest or initials. Crests and photos are copyrighted: keep these files for personal use.

## Features added
- Match-feed stats on player pages (current season): physical, shooting, passing, duels, goalkeeping, with percentiles.
- Fixture difficulty (`#/fixture-difficulty`): 1-5 rating per upcoming fixture from opponent xG-difference strength and venue.
- Thai / English interface (`lib/i18n.js`): toggle in the top bar or Settings.
- Galaxy theme (`lib/galaxy.js`): starfield background, warp opening animation (once per visit, skippable), card reveals.
  Settings: theme (Galaxy/Classic), opening animation on/off, replay intro. All motion is off with Reduce motion.

## Automatic updates (GitHub Actions + GitHub Pages)
`.github/workflows/update.yml` runs twice a day (04:07 and 16:07 Bangkok time), on every push to `main`, and on demand
(Actions tab, "Update data and deploy", "Run workflow"). It downloads the sources, rebuilds the data with
`build_data.py --strict` and publishes `dist/index.html` to GitHub Pages.
- `--strict` stops the run, so nothing is deployed, if any finished match fails the goal check or disagrees with openfootball.
  GitHub emails the repo owner about failed runs; the live site keeps the last good version.
- A gameweek's player stats are used only once every finished match in it has match-level stats. Until then its results
  count in the table and those match pages say the stats are pending.
- The deployed site uses generated crests and initials. Build the image versions locally for personal use.
- GitHub disables scheduled workflows after 60 days without commits; re-enable from the Actions tab if that happens.
