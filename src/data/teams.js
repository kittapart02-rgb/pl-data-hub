/* data/teams.js — club reference data (names, stadiums, colours) for every club in the dataset,
   plus the season list, which comes from the generated REAL_DATA. */

const SEASONS = REAL_DATA.seasons.map(s => ({
  id: s.id, label: s.label, startYear: Number(s.id.slice(0, 4)),
  playedWeeks: s.throughGw, played: s.played, partial: s.played < 380, hasXg: s.hasXg, hasDefensive: s.hasDefensive, lastMatch: s.lastMatch,
  hasAdvanced: !!(s.advancedCols && s.advancedCols.length), source: s.source,
}));
const CURRENT_SEASON = SEASONS[0].id;                                   // newest season (may be in progress)
// open on the current season once it has a few gameweeks, otherwise on the newest complete one
const DEFAULT_SEASON = (SEASONS[0].played >= 30 ? SEASONS[0] : (SEASONS.find(s => !s.partial) || SEASONS[0])).id;

const TEAMS = [
  { id: 'arsenal', name: 'Arsenal', fullName: 'Arsenal FC', short: 'ARS', stadium: 'Emirates Stadium', city: 'London', founded: 1886, colors: ['#EF0107', '#FFFFFF'] },
  { id: 'aston-villa', name: 'Aston Villa', fullName: 'Aston Villa FC', short: 'AVL', stadium: 'Villa Park', city: 'Birmingham', founded: 1874, colors: ['#670E36', '#95BFE5'] },
  { id: 'bournemouth', name: 'Bournemouth', fullName: 'AFC Bournemouth', short: 'BOU', stadium: 'Vitality Stadium', city: 'Bournemouth', founded: 1899, colors: ['#DA291C', '#111111'] },
  { id: 'brentford', name: 'Brentford', fullName: 'Brentford FC', short: 'BRE', stadium: 'Gtech Community Stadium', city: 'London', founded: 1889, colors: ['#E30613', '#FFFFFF'] },
  { id: 'brighton', name: 'Brighton', fullName: 'Brighton & Hove Albion', short: 'BHA', stadium: 'American Express Stadium', city: 'Brighton', founded: 1901, colors: ['#0057B8', '#FFFFFF'] },
  { id: 'burnley', name: 'Burnley', fullName: 'Burnley FC', short: 'BUR', stadium: 'Turf Moor', city: 'Burnley', founded: 1882, colors: ['#6C1D45', '#99D6EA'] },
  { id: 'chelsea', name: 'Chelsea', fullName: 'Chelsea FC', short: 'CHE', stadium: 'Stamford Bridge', city: 'London', founded: 1905, colors: ['#034694', '#FFFFFF'] },
  { id: 'coventry', name: 'Coventry City', fullName: 'Coventry City FC', short: 'COV', stadium: 'Coventry Building Society Arena', city: 'Coventry', founded: 1883, colors: ['#6CB4E4', '#FFFFFF'] },
  { id: 'crystal-palace', name: 'Crystal Palace', fullName: 'Crystal Palace FC', short: 'CRY', stadium: 'Selhurst Park', city: 'London', founded: 1905, colors: ['#1B458F', '#C4122E'] },
  { id: 'everton', name: 'Everton', fullName: 'Everton FC', short: 'EVE', stadium: 'Hill Dickinson Stadium', oldStadium: 'Goodison Park', stadiumSince: 2025, city: 'Liverpool', founded: 1878, colors: ['#003399', '#FFFFFF'] },
  { id: 'fulham', name: 'Fulham', fullName: 'Fulham FC', short: 'FUL', stadium: 'Craven Cottage', city: 'London', founded: 1879, colors: ['#F2F2F2', '#111111'] },
  { id: 'hull', name: 'Hull City', fullName: 'Hull City AFC', short: 'HUL', stadium: 'MKM Stadium', city: 'Hull', founded: 1904, colors: ['#F5A12D', '#111111'] },
  { id: 'ipswich', name: 'Ipswich Town', fullName: 'Ipswich Town FC', short: 'IPS', stadium: 'Portman Road', city: 'Ipswich', founded: 1878, colors: ['#0044A9', '#FFFFFF'] },
  { id: 'leeds', name: 'Leeds United', fullName: 'Leeds United FC', short: 'LEE', stadium: 'Elland Road', city: 'Leeds', founded: 1919, colors: ['#FFFFFF', '#1D428A'] },
  { id: 'leicester', name: 'Leicester City', fullName: 'Leicester City FC', short: 'LEI', stadium: 'King Power Stadium', city: 'Leicester', founded: 1884, colors: ['#003090', '#FDBE11'] },
  { id: 'liverpool', name: 'Liverpool', fullName: 'Liverpool FC', short: 'LIV', stadium: 'Anfield', city: 'Liverpool', founded: 1892, colors: ['#C8102E', '#FFFFFF'] },
  { id: 'luton', name: 'Luton Town', fullName: 'Luton Town FC', short: 'LUT', stadium: 'Kenilworth Road', city: 'Luton', founded: 1885, colors: ['#F78F1E', '#002A5C'] },
  { id: 'man-city', name: 'Manchester City', fullName: 'Manchester City FC', short: 'MCI', stadium: 'Etihad Stadium', city: 'Manchester', founded: 1880, colors: ['#6CABDD', '#1C2C5B'] },
  { id: 'man-utd', name: 'Manchester United', fullName: 'Manchester United FC', short: 'MUN', stadium: 'Old Trafford', city: 'Manchester', founded: 1878, colors: ['#DA291C', '#FBE122'] },
  { id: 'newcastle', name: 'Newcastle United', fullName: 'Newcastle United FC', short: 'NEW', stadium: "St James' Park", city: 'Newcastle', founded: 1892, colors: ['#241F20', '#FFFFFF'] },
  { id: 'norwich', name: 'Norwich City', fullName: 'Norwich City FC', short: 'NOR', stadium: 'Carrow Road', city: 'Norwich', founded: 1902, colors: ['#00A650', '#FFF200'] },
  { id: 'nottm-forest', name: "Nott'm Forest", fullName: 'Nottingham Forest FC', short: 'NFO', stadium: 'City Ground', city: 'Nottingham', founded: 1865, colors: ['#DD0000', '#FFFFFF'] },
  { id: 'sheffield-utd', name: 'Sheffield United', fullName: 'Sheffield United FC', short: 'SHU', stadium: 'Bramall Lane', city: 'Sheffield', founded: 1889, colors: ['#EE2737', '#FFFFFF'] },
  { id: 'southampton', name: 'Southampton', fullName: 'Southampton FC', short: 'SOU', stadium: "St Mary's Stadium", city: 'Southampton', founded: 1885, colors: ['#D71920', '#FFFFFF'] },
  { id: 'sunderland', name: 'Sunderland', fullName: 'Sunderland AFC', short: 'SUN', stadium: 'Stadium of Light', city: 'Sunderland', founded: 1879, colors: ['#EB172B', '#FFFFFF'] },
  { id: 'tottenham', name: 'Tottenham', fullName: 'Tottenham Hotspur FC', short: 'TOT', stadium: 'Tottenham Hotspur Stadium', city: 'London', founded: 1882, colors: ['#132257', '#FFFFFF'] },
  { id: 'watford', name: 'Watford', fullName: 'Watford FC', short: 'WAT', stadium: 'Vicarage Road', city: 'Watford', founded: 1881, colors: ['#FBEE23', '#ED2127'] },
  { id: 'west-ham', name: 'West Ham', fullName: 'West Ham United FC', short: 'WHU', stadium: 'London Stadium', city: 'London', founded: 1895, colors: ['#7A263A', '#1BB1E7'] },
  { id: 'wolves', name: 'Wolves', fullName: 'Wolverhampton Wanderers FC', short: 'WOL', stadium: 'Molineux Stadium', city: 'Wolverhampton', founded: 1877, colors: ['#FDB913', '#231F20'] },
];
const TEAM_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]));

function stadiumFor(team, startYear) {
  if (team.oldStadium && startYear < team.stadiumSince) return team.oldStadium;
  return team.stadium;
}
const POSITION_LABEL = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
function slugify(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[øØ]/g, 'o').replace(/[đĐ]/g, 'd').replace(/ı/g, 'i').replace(/ł/g, 'l')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
