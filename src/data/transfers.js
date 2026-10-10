/* data/transfers.js — reported transfer fees (£m, approximate, from public reporting).
   Transfer MOVES are derived from the real FPL squad data (see repository.js); fees are not part of that
   source, so these figures are only attached where a derived move matches season + destination club + surname.
   fee: null = free, 'loan' = loan. */

const REPORTED_FEES = [
  // 2025/26
  ['2025-26', 'Alexander Isak', 'newcastle', 'liverpool', 125, '2025-09-01'],
  ['2025-26', 'Florian Wirtz', 'Bayer Leverkusen', 'liverpool', 116, '2025-06-20'],
  ['2025-26', 'Benjamin Šeško', 'RB Leipzig', 'man-utd', 73.7, '2025-08-09'],
  ['2025-26', 'Bryan Mbeumo', 'brentford', 'man-utd', 71, '2025-07-21'],
  ['2025-26', 'Hugo Ekitiké', 'Eintracht Frankfurt', 'liverpool', 69, '2025-07-23'],
  ['2025-26', 'Nick Woltemade', 'VfB Stuttgart', 'newcastle', 69, '2025-08-30'],
  ['2025-26', 'Viktor Gyökeres', 'Sporting CP', 'arsenal', 63.5, '2025-07-26'],
  ['2025-26', 'Matheus Cunha', 'wolves', 'man-utd', 62.5, '2025-06-12'],
  ['2025-26', 'Eberechi Eze', 'crystal-palace', 'arsenal', 60, '2025-08-23'],
  ['2025-26', 'João Pedro', 'brighton', 'chelsea', 60, '2025-07-02'],
  ['2025-26', 'Yoane Wissa', 'brentford', 'newcastle', 55, '2025-09-01'],
  ['2025-26', 'Mohammed Kudus', 'west-ham', 'tottenham', 55, '2025-07-17'],
  ['2025-26', 'Xavi Simons', 'RB Leipzig', 'tottenham', 52, '2025-08-30'],
  ['2025-26', 'Martín Zubimendi', 'Real Sociedad', 'arsenal', 51, '2025-07-06'],
  ['2025-26', 'Tijjani Reijnders', 'AC Milan', 'man-city', 46.5, '2025-06-11'],
  ['2025-26', 'Milos Kerkez', 'bournemouth', 'liverpool', 40, '2025-06-19'],
  ['2025-26', 'Alejandro Garnacho', 'man-utd', 'chelsea', 40, '2025-08-30'],
  ['2025-26', 'Omari Hutchinson', 'Ipswich Town', 'nottm-forest', 37.5, '2025-07-18'],
  ['2025-26', 'Dan Ndoye', 'Bologna', 'nottm-forest', 34, '2025-08-06'],
  ['2025-26', 'Rayan Aït-Nouri', 'wolves', 'man-city', 31, '2025-06-09'],
  ['2025-26', 'Rayan Cherki', 'Lyon', 'man-city', 30.5, '2025-06-10'],
  ['2025-26', 'Liam Delap', 'Ipswich Town', 'chelsea', 30, '2025-06-06'],
  ['2025-26', 'Jeremie Frimpong', 'Bayer Leverkusen', 'liverpool', 29.5, '2025-05-30'],
  ['2025-26', 'Estêvão', 'Palmeiras', 'chelsea', 29, '2025-07-01'],
  ['2025-26', 'Gianluigi Donnarumma', 'Paris Saint-Germain', 'man-city', 26, '2025-09-02'],
  ['2025-26', 'Senne Lammens', 'Royal Antwerp', 'man-utd', 18, '2025-09-01'],
  ['2025-26', 'Granit Xhaka', 'Bayer Leverkusen', 'sunderland', 17, '2025-07-23'],
  ['2025-26', 'Caoimhín Kelleher', 'liverpool', 'brentford', 12.5, '2025-06-06'],
  ['2025-26', 'Kyle Walker', 'man-city', 'burnley', 5, '2025-07-01'],
  ['2025-26', 'Jack Grealish', 'man-city', 'everton', 'loan', '2025-08-11'],
  ['2025-26', 'Dominic Calvert-Lewin', 'everton', 'leeds', null, '2025-08-19'],
  ['2025-26', 'Jordan Henderson', 'Ajax', 'brentford', null, '2025-08-02'],
  // 2024/25
  ['2024-25', 'Omar Marmoush', 'Eintracht Frankfurt', 'man-city', 59, '2025-01-23'],
  ['2024-25', 'Dominic Solanke', 'bournemouth', 'tottenham', 55, '2024-08-10'],
  ['2024-25', 'Pedro Neto', 'wolves', 'chelsea', 54, '2024-08-11'],
  ['2024-25', 'Leny Yoro', 'Lille', 'man-utd', 52, '2024-07-18'],
  ['2024-25', 'Amadou Onana', 'everton', 'aston-villa', 50, '2024-07-19'],
  ['2024-25', 'Riccardo Calafiori', 'Bologna', 'arsenal', 42, '2024-07-29'],
  ['2024-25', 'Matthijs de Ligt', 'Bayern Munich', 'man-utd', 38.5, '2024-08-13'],
  ['2024-25', 'Savinho', 'Troyes', 'man-city', 30.8, '2024-07-18'],
  ['2024-25', 'Mikel Merino', 'Real Sociedad', 'arsenal', 32, '2024-08-27'],
  ['2024-25', 'Evanilson', 'Porto', 'bournemouth', 31, '2024-07-28'],
  ['2024-25', 'Nikola Milenković', 'Fiorentina', 'nottm-forest', 12, '2024-07-24'],
  ['2024-25', 'Igor Thiago', 'Club Brugge', 'brentford', 30, '2024-07-01'],
];

function reportedFee(season, playerName, toTeam) {
  const n = slugify(playerName);
  const hit = REPORTED_FEES.find(([s, name, , to]) => s === season && to === toTeam && (n.includes(slugify(name).split('-').pop()) || slugify(name).includes(n)));
  return hit ? { fee: hit[4] } : null;
}
