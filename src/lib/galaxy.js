/* lib/galaxy.js — Galaxy theme: a slow starfield + nebula behind the app, an opening "warp" intro,
   and scroll-in reveals for cards. Everything is skipped when reduced motion is on, and the canvases
   pause while the tab is hidden. */

const Galaxy = {
  enabled() { return Settings.get('theme') !== 'classic'; },

  init() {
    document.documentElement.classList.toggle('theme-galaxy', this.enabled());
    if (!this.enabled()) return;
    this.background();
    this.reveals();
  },

  /* ---- background starfield ---- */
  background() {
    const c = document.createElement('canvas'); c.id = 'starfield'; c.setAttribute('aria-hidden', 'true');
    document.body.prepend(c);
    const ctx = c.getContext && c.getContext('2d'); if (!ctx) return;
    let w, h, dpr, stars = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(260, (w * h) / 5200));
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), r: Math.random() * 1.2 + 0.2, tw: Math.random() * Math.PI * 2, hue: [255, 220, 330][Math.floor(Math.random() * 3)] }));
    };
    resize(); window.addEventListener('resize', debounce(resize, 150));
    const still = () => reducedMotion();
    let t0 = performance.now(), scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    const draw = now => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const drift = still() ? 0 : t * (4 + s.z * 10);
        const x = (s.x + drift) % w; const y = ((s.y - scrollY * (0.05 + s.z * 0.12)) % h + h) % h;
        const a = 0.35 + 0.55 * (still() ? 0.6 : (Math.sin(t * (0.8 + s.z * 1.6) + s.tw) * 0.5 + 0.5));
        ctx.beginPath(); ctx.arc(x, y, s.r * (0.6 + s.z), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 90%, ${s.hue === 255 ? 92 : 80}%, ${a * (0.4 + s.z * 0.6)})`; ctx.fill();
        if (s.r > 1.25 && s.z > 0.7) { ctx.fillStyle = `hsla(${s.hue}, 90%, 85%, ${a * 0.12})`; ctx.beginPath(); ctx.arc(x, y, s.r * 4, 0, Math.PI * 2); ctx.fill(); }
      }
      if (!still() && !document.hidden) this.bgRaf = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(this.bgRaf); this.bgRaf = requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    start();
  },

  /* ---- cards drift in as they enter the viewport ---- */
  reveals() {
    if (reducedMotion() || !window.IntersectionObserver) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' });
    const scan = root => $$('.card, .stat-card, .team-card, .fixture-card, .record-card, .transfer-card, .cmp-stat', root).forEach((el, i) => {
      if (el.classList.contains('rv')) return; el.classList.add('rv'); el.style.setProperty('--rv-d', `${Math.min(i, 10) * 40}ms`); io.observe(el);
    });
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n.parentElement || n); }))).observe($('#page'), { childList: true, subtree: true });
    scan(document);
  },

  /* ---- opening intro: warp through the stars, then the logo ---- */
  intro(force = false) {
    if (!this.enabled() && !force) return Promise.resolve();
    if (!force && (Settings.get('intro') === false || reducedMotion())) return Promise.resolve();
    try { if (!force && sessionStorage.getItem('pldh:intro')) return Promise.resolve(); sessionStorage.setItem('pldh:intro', '1'); } catch (e) { /* ignore */ }
    return new Promise(resolve => {
      const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'PL Data Hub opening animation');
      el.innerHTML = `<canvas aria-hidden="true"></canvas>
        <div class="intro-brand"><div class="intro-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="intro-logo">${Logo().replace('href="#/"', 'tabindex="-1"')}</div>
          <p class="intro-tag">Football data. Deeper insights.</p></div>
        <button type="button" class="intro-skip">Skip intro</button>`;
      document.body.appendChild(el);
      const cv = $('canvas', el), ctx = cv.getContext && cv.getContext('2d');
      const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx && ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const stars = Array.from({ length: 520 }, () => ({ x: (Math.random() - 0.5) * W * 2, y: (Math.random() - 0.5) * H * 2, z: Math.random() * W, pz: 0, hue: [255, 215, 330][Math.floor(Math.random() * 3)] }));
      stars.forEach(s => { s.pz = s.z; });
      const t0 = performance.now(); let raf, done = false;
      const frame = now => {
        const t = (now - t0) / 1000;
        const speed = t < 1.4 ? 6 + t * t * 38 : Math.max(2, 80 - (t - 1.4) * 70);   // accelerate into warp, then ease out
        if (ctx) {
          ctx.fillStyle = 'rgba(3,6,16,0.34)'; ctx.fillRect(0, 0, W, H);
          for (const s of stars) {
            s.pz = s.z; s.z -= speed; if (s.z < 1) { s.z = W; s.pz = W; s.x = (Math.random() - 0.5) * W * 2; s.y = (Math.random() - 0.5) * H * 2; }
            const sx = W / 2 + (s.x / s.z) * W * 0.5, sy = H / 2 + (s.y / s.z) * W * 0.5;
            const px = W / 2 + (s.x / s.pz) * W * 0.5, py = H / 2 + (s.y / s.pz) * W * 0.5;
            const a = Math.min(1, (1 - s.z / W) * 1.4);
            ctx.strokeStyle = `hsla(${s.hue}, 95%, 82%, ${a})`; ctx.lineWidth = Math.max(0.6, (1 - s.z / W) * 2.6);
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
          }
        }
        if (t > 1.15) el.classList.add('show-brand');
        if (t > 3.6) return finish();
        raf = requestAnimationFrame(frame);
      };
      const finish = () => {
        if (done) return; done = true; cancelAnimationFrame(raf);
        el.classList.add('leaving');
        setTimeout(() => { el.remove(); resolve(); }, 600);
        document.removeEventListener('keydown', onKey);
      };
      const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
      $('.intro-skip', el).addEventListener('click', finish); el.addEventListener('click', e => { if (!e.target.closest('.intro-skip')) finish(); });
      document.addEventListener('keydown', onKey);
      $('.intro-skip', el).focus();
      raf = requestAnimationFrame(frame);
    });
  },
};
