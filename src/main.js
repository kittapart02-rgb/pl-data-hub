/* main.js — mounts the shell, registers routes, global delegated interactions. */

Router.add('/', HomePage);
Router.add('/teams', TeamsPage);
Router.add('/teams/:teamId', TeamPage);
Router.add('/players', PlayersPage);
Router.add('/players/:playerId', PlayerPage);
Router.add('/fixtures', FixturesPage);
Router.add('/matches/:matchId', MatchPage, { seasonBound: true });
Router.add('/standings', StandingsPage);
Router.add('/statistics', StatisticsPage);
Router.add('/comparison', ComparisonPage);
Router.add('/transfers', TransfersPage);
Router.add('/records', RecordsPage);
Router.add('/fixture-difficulty', FixtureDifficultyPage);
Router.add('/settings', SettingsPage);

let navToken = 0; let lastPath = null;
async function renderRoute() {
  const token = ++navToken;
  const { path, query } = Router.current();
  const root = $('#page');
  const hit = Router.match(path);
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  updateNavActive(); Tip.hide();
  root.classList.remove('enter'); void root.offsetWidth; root.classList.add('enter');
  const ctx = { params: hit ? hit.params : {}, query, root, alive: () => token === navToken };
  try { await (hit ? hit.route.handler : NotFoundPage)(ctx); }
  catch (e) {
    if (!ctx.alive()) return;
    root.innerHTML = `<div class="card">${ErrorState(/not found/i.test(e.message) ? e.message : `Unable to load this page. ${e.message}`)}</div>`;
  }
  if (ctx.alive()) { const h = $('h1', root); if (document.activeElement === document.body && h && path !== '/') { h.setAttribute('tabindex', '-1'); } }
}
Router.onChange = renderRoute;

function boot() {
  document.documentElement.classList.toggle('reduce-motion', !!Settings.get('reduceMotion'));
  $('#sidebar').innerHTML = Sidebar();
  $('#topbar').innerHTML = TopNav();
  $('#footer').innerHTML = Footer();
  Tip.init(); initSearch(); initPopovers(); initDrawer(); initSeasonSelect();
  $('#lang-btn').addEventListener('click', () => I18n.set(Settings.get('lang') === 'th' ? 'en' : 'th'));
  I18n.init(); Galaxy.init();

  State.onSeason(() => {
    const { path } = Router.current(); const hit = Router.match(path);
    if (hit && hit.route.meta.seasonBound) Router.go('#/fixtures'); else renderRoute();
  });
  // page-level season selectors mirror the global one
  document.addEventListener('change', e => { if (e.target.matches('select[data-season-mirror]')) State.setSeason(e.target.value); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action=retry]')) { renderRoute(); return; }
    const ss = e.target.closest('[data-set-season]'); if (ss) { State.setSeason(ss.dataset.setSeason); return; }
    // clickable rows: whole row navigates unless an inner control was used
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a, button, input, select')) Router.go(row.dataset.href);
  });
  document.addEventListener('keydown', e => {
    const row = e.target.closest && e.target.closest('tr[data-href]');
    if (row && e.target === row && e.key === 'Enter') Router.go(row.dataset.href);
  });
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
  Galaxy.intro();
}
document.addEventListener('DOMContentLoaded', boot);
