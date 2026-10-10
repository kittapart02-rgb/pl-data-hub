#!/usr/bin/env bash
# Download the raw sources into etl/raw/, then run: python3 etl/build_data.py && python3 build.py
set -e
cd "$(dirname "$0")"; mkdir -p raw
B=https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data
for s in 2026-27 2025-26 2024-25 2023-24 2022-23 2021-22; do
  for f in gws/merged_gw.csv teams.csv players_raw.csv fixtures.csv; do curl -sfL "$B/$s/$f" -o "raw/fpl_${s}_$(basename $f)"; done
  curl -sfL "https://raw.githubusercontent.com/openfootball/football.json/master/$s/en.1.json" -o "raw/of_$s.json" || true
done
# current season from FPL-Core-Insights (refreshed twice daily)
C="https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2026-2027"; mkdir -p raw/core
curl -sfL "$C/players.csv" -o raw/core/players.csv; curl -sfL "$C/teams.csv" -o raw/core/teams.csv
for g in $(seq 1 38); do
  T="$C/By%20Tournament/Premier%20League/GW$g"
  curl -sfL "$T/matches.csv" -o "raw/core/gw${g}_matches.csv" || continue
  if grep -q ",True," "raw/core/gw${g}_matches.csv"; then
    for f in player_gameweek_stats.csv playermatchstats.csv players.csv; do curl -sfL "$T/$f" -o "raw/core/gw${g}_$f"; done
  fi
done
echo "downloaded"; ls raw | wc -l
