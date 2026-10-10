-- PL Data Hub — PostgreSQL schema (Version 2 target). All foreign keys are IDs, never names.

CREATE TABLE seasons (
  id            TEXT PRIMARY KEY,            -- '2025-26'
  label         TEXT NOT NULL,               -- '2025/26'
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  is_current    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE teams (
  id            TEXT PRIMARY KEY,            -- 'liverpool'
  name          TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  short_name    CHAR(3) NOT NULL UNIQUE,     -- 'LIV'
  stadium       TEXT,
  city          TEXT,
  founded       SMALLINT,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url      TEXT
);

CREATE TABLE players (
  id            TEXT PRIMARY KEY,            -- 'mohamed-salah'
  name          TEXT NOT NULL,
  date_of_birth DATE,
  nationality   TEXT,
  position      TEXT NOT NULL CHECK (position IN ('GK','DF','MF','FW')),
  preferred_foot TEXT CHECK (preferred_foot IN ('Left','Right','Both')),
  photo_url     TEXT
);

-- squad membership per season (a player can move clubs between or within seasons)
CREATE TABLE squad_memberships (
  season_id     TEXT REFERENCES seasons(id),
  team_id       TEXT REFERENCES teams(id),
  player_id     TEXT REFERENCES players(id),
  shirt_number  SMALLINT,
  joined_on     DATE,
  left_on       DATE,
  PRIMARY KEY (season_id, team_id, player_id)
);

CREATE TABLE matches (
  id            TEXT PRIMARY KEY,            -- '2025-26-12-liv-che'
  season_id     TEXT NOT NULL REFERENCES seasons(id),
  matchweek     SMALLINT NOT NULL CHECK (matchweek BETWEEN 1 AND 38),
  kickoff_at    TIMESTAMPTZ NOT NULL,
  home_team_id  TEXT NOT NULL REFERENCES teams(id),
  away_team_id  TEXT NOT NULL REFERENCES teams(id),
  stadium       TEXT,
  status        TEXT NOT NULL CHECK (status IN ('scheduled','live','finished','postponed')),
  home_goals    SMALLINT,
  away_goals    SMALLINT,
  CHECK (home_team_id <> away_team_id)
);
CREATE INDEX ON matches (season_id, matchweek);
CREATE INDEX ON matches (home_team_id); CREATE INDEX ON matches (away_team_id);

CREATE TABLE match_stats (                   -- one row per team per match
  match_id      TEXT REFERENCES matches(id) ON DELETE CASCADE,
  team_id       TEXT REFERENCES teams(id),
  possession    NUMERIC(4,1), shots SMALLINT, shots_on_target SMALLINT, xg NUMERIC(5,2),
  passes        SMALLINT, pass_accuracy NUMERIC(4,1), corners SMALLINT, fouls SMALLINT,
  yellow_cards  SMALLINT, red_cards SMALLINT, tackles SMALLINT, interceptions SMALLINT,
  PRIMARY KEY (match_id, team_id)
);

CREATE TABLE match_events (                  -- timeline: goals, cards, substitutions
  id            BIGSERIAL PRIMARY KEY,
  match_id      TEXT REFERENCES matches(id) ON DELETE CASCADE,
  team_id       TEXT REFERENCES teams(id),
  minute        SMALLINT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('goal','own_goal','penalty_goal','yellow','red','sub')),
  player_id     TEXT REFERENCES players(id),
  related_player_id TEXT REFERENCES players(id)  -- assist, or player substituted off
);

CREATE TABLE shots (
  id            BIGSERIAL PRIMARY KEY,
  match_id      TEXT REFERENCES matches(id) ON DELETE CASCADE,
  team_id       TEXT REFERENCES teams(id),
  player_id     TEXT REFERENCES players(id),
  assist_player_id TEXT REFERENCES players(id),
  minute        SMALLINT, x_m NUMERIC(4,1), y_m NUMERIC(4,1), xg NUMERIC(4,2),
  outcome       TEXT CHECK (outcome IN ('goal','saved','blocked','missed')),
  is_penalty    BOOLEAN DEFAULT FALSE
);

CREATE TABLE player_match_stats (
  match_id      TEXT REFERENCES matches(id) ON DELETE CASCADE,
  player_id     TEXT REFERENCES players(id),
  team_id       TEXT REFERENCES teams(id),
  started       BOOLEAN, minutes SMALLINT, goals SMALLINT, assists SMALLINT,
  shots SMALLINT, shots_on_target SMALLINT, xg NUMERIC(4,2), xa NUMERIC(4,2), key_passes SMALLINT,
  big_chances SMALLINT, touches_in_box SMALLINT, passes SMALLINT, passes_completed SMALLINT,
  progressive_passes SMALLINT, progressive_carries SMALLINT, tackles SMALLINT, interceptions SMALLINT,
  pressures SMALLINT, saves SMALLINT, goals_conceded SMALLINT, clean_sheet BOOLEAN,
  yellow_cards SMALLINT, red_cards SMALLINT, rating NUMERIC(3,1),
  PRIMARY KEY (match_id, player_id)
);

-- Season aggregates are derived, never hand-entered, so they cannot drift from match data.
CREATE MATERIALIZED VIEW player_stats AS
SELECT m.season_id, pms.player_id, pms.team_id,
  COUNT(*) AS apps, COUNT(*) FILTER (WHERE pms.started) AS starts, SUM(pms.minutes) AS minutes,
  SUM(goals) AS goals, SUM(assists) AS assists, SUM(pms.xg) AS xg, SUM(pms.xa) AS xa, SUM(shots) AS shots,
  SUM(shots_on_target) AS shots_on_target, SUM(key_passes) AS key_passes, SUM(passes) AS passes,
  ROUND(100.0 * SUM(passes_completed) / NULLIF(SUM(passes), 0), 1) AS pass_accuracy,
  SUM(progressive_passes) AS progressive_passes, SUM(progressive_carries) AS progressive_carries,
  SUM(tackles) AS tackles, SUM(interceptions) AS interceptions, SUM(saves) AS saves,
  COUNT(*) FILTER (WHERE clean_sheet) AS clean_sheets, ROUND(AVG(rating), 2) AS rating
FROM player_match_stats pms JOIN matches m ON m.id = pms.match_id
GROUP BY m.season_id, pms.player_id, pms.team_id;

CREATE MATERIALIZED VIEW team_stats AS
SELECT m.season_id, ms.team_id, COUNT(*) AS matches, SUM(ms.shots) AS shots, SUM(ms.shots_on_target) AS shots_on_target,
  SUM(ms.xg) AS xg, ROUND(AVG(ms.possession), 1) AS possession, ROUND(AVG(ms.pass_accuracy), 1) AS pass_accuracy, SUM(ms.tackles) AS tackles
FROM match_stats ms JOIN matches m ON m.id = ms.match_id AND m.status = 'finished'
GROUP BY m.season_id, ms.team_id;

CREATE VIEW standings AS
WITH r AS (
  SELECT season_id, home_team_id AS team_id, home_goals AS gf, away_goals AS ga FROM matches WHERE status = 'finished'
  UNION ALL
  SELECT season_id, away_team_id, away_goals, home_goals FROM matches WHERE status = 'finished'
)
SELECT season_id, team_id, COUNT(*) AS mp,
  COUNT(*) FILTER (WHERE gf > ga) AS w, COUNT(*) FILTER (WHERE gf = ga) AS d, COUNT(*) FILTER (WHERE gf < ga) AS l,
  SUM(gf) AS gf, SUM(ga) AS ga, SUM(gf) - SUM(ga) AS gd,
  3 * COUNT(*) FILTER (WHERE gf > ga) + COUNT(*) FILTER (WHERE gf = ga) AS pts,
  RANK() OVER (PARTITION BY season_id ORDER BY 3 * COUNT(*) FILTER (WHERE gf > ga) + COUNT(*) FILTER (WHERE gf = ga) DESC, SUM(gf) - SUM(ga) DESC, SUM(gf) DESC) AS position
FROM r GROUP BY season_id, team_id;

CREATE TABLE transfers (
  id            BIGSERIAL PRIMARY KEY,
  season_id     TEXT REFERENCES seasons(id),
  player_id     TEXT REFERENCES players(id),
  from_team_id  TEXT REFERENCES teams(id),   -- NULL when the club is outside the league
  from_club_name TEXT,
  to_team_id    TEXT REFERENCES teams(id),
  to_club_name  TEXT,
  fee_gbp_m     NUMERIC(6,1),                -- NULL = free
  is_loan       BOOLEAN DEFAULT FALSE,
  transfer_date DATE NOT NULL
);
