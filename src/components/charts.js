/* components/charts.js — LineChart, BarChart, HBarChart, RadarChart.
   Dependency-free SVG, re-rendered on container resize, hover/focus tooltips via [data-tip]. */

const CHART_COLORS = ['#8B6CFF', '#3B82F6', '#FF3D81', '#22C55E', '#F59E0B'];

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
/** Ticks at clean steps; integer data gets integer ticks. */
function niceTicks(lo, hi, integer) {
  let step = niceStep(Math.max(hi - lo, 1e-9) / 4); if (integer) step = Math.max(1, Math.round(step));
  const top = Math.ceil(hi / step) * step; const ticks = []; for (let t = lo; t <= top + 1e-9; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return { ticks, top };
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function mountChart(el, render) {
  if (!el) return;
  const draw = () => { const w = el.clientWidth || 640; if (w === el.__w) return; el.__w = w; render(el, w); };
  el.__w = null; draw();
  if (window.ResizeObserver) { if (el.__ro) el.__ro.disconnect(); el.__ro = new ResizeObserver(debounce(draw, 100)); el.__ro.observe(el); }
}
function animClass() { return reducedMotion() ? '' : 'anim'; }

/** series: [{ name, values: (number|null)[], color, dashed }] */
function LineChart(el, { labels, series, height = 260, yLabel = '', fmtVal = v => fmt.n(v, 0), xPrefix = '', ariaLabel = 'Line chart', yMin = 0, yMax: yMaxFixed }) {
  mountChart(el, (node, w) => {
    const h = height, pl = 40, pr = 14, pt = 14, pb = 30;
    const iw = w - pl - pr, ih = h - pt - pb;
    const all = series.flatMap(s => s.values.filter(v => v != null));
    const lo = yMin; const intData = all.every(v => Number.isInteger(v));
    const nt = niceTicks(lo, yMaxFixed ?? Math.max(...all, 1), intData); const yMax = yMaxFixed ?? nt.top;
    const x = i => pl + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
    const y = v => pt + ih - ((v - lo) / (yMax - lo)) * ih;
    const ticks = nt.ticks.filter(t => t <= yMax);
    const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(iw / 44))));
    const paths = series.map((s, si) => {
      let d = ''; let pen = false;
      s.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
      const c = s.color || CHART_COLORS[si];
      const dots = labels.length <= 40 ? s.values.map((v, i) => (v == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.6" fill="${c}"/>`)).join('') : '';
      return `<path class="line ${animClass()}" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="2.4" ${s.dashed ? 'stroke-dasharray="4 5"' : ''} stroke-linejoin="round" stroke-linecap="round"/>${s.dashed ? '' : dots}`;
    }).join('');
    const hot = labels.map((l, i) => {
      const lines = series.map(s => `${s.name}: ${s.values[i] == null ? '–' : fmtVal(s.values[i])}`).join('\n');
      const bw = labels.length > 1 ? iw / (labels.length - 1) : iw;
      return `<rect class="hot" x="${(x(i) - bw / 2).toFixed(1)}" y="${pt}" width="${bw.toFixed(1)}" height="${ih}" data-tip="${esc(`${xPrefix}${l}\n${lines}`)}"/><line class="hot-line" x1="${x(i)}" x2="${x(i)}" y1="${pt}" y2="${pt + ih}"/>`;
    }).join('');
    node.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ariaLabel)}">
      ${ticks.map(t => `<line class="grid" x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${fmtVal(t)}</text>`).join('')}
      ${labels.map((l, i) => (i % every === 0 || (i === labels.length - 1 && i % every >= every / 2) ? `<text class="axis" x="${x(i)}" y="${h - 8}" text-anchor="middle">${esc(l)}</text>` : '')).join('')}
      ${yLabel ? `<text class="axis" x="${pl}" y="${pt - 2}" dy="-2">${esc(yLabel)}</text>` : ''}
      ${paths}${hot}</svg>`;
  });
}

/** Vertical grouped bars. series: [{ name, values, color }] */
function BarChart(el, { labels, series, height = 260, fmtVal = v => fmt.n(v, 0), tip, ariaLabel = 'Bar chart', onClick, labelRender }) {
  mountChart(el, (node, w) => {
    const h = height, pl = 36, pr = 8, pt = 16, pb = 44;
    const iw = w - pl - pr, ih = h - pt - pb;
    const nt = niceTicks(0, Math.max(...series.flatMap(s => s.values), 1), true); const max = nt.top;
    const gw = iw / labels.length; const bw = Math.min(34, (gw * 0.62) / series.length);
    const y = v => pt + ih - (v / max) * ih;
    const ticks = nt.ticks;
    const bars = labels.map((l, i) => {
      const gx = pl + gw * i + (gw - bw * series.length - 4 * (series.length - 1)) / 2;
      const t = tip ? tip(i) : `${l}\n${series.map(s => `${s.name}: ${fmtVal(s.values[i])}`).join('\n')}`;
      const b = series.map((s, si) => { const v = s.values[i]; const bx = gx + si * (bw + 4); return `<rect class="bar ${animClass()}" style="animation-delay:${i * 50}ms" x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, ih - (y(v) - pt)).toFixed(1)}" rx="4" fill="${s.color || CHART_COLORS[si]}"/>`; }).join('');
      return `<g class="bar-group ${onClick ? 'clickable' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(t.replace(/\n/g, ', '))}" data-tip="${esc(t)}"><rect class="hot" x="${pl + gw * i}" y="${pt}" width="${gw}" height="${ih}"/>${b}<text class="axis strong" x="${pl + gw * i + gw / 2}" y="${h - 22}" text-anchor="middle">${esc(labelRender ? labelRender(l, gw) : l)}</text></g>`;
    }).join('');
    node.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ariaLabel)}">
      ${ticks.map(t => `<line class="grid" x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${fmtVal(t)}</text>`).join('')}
      ${bars}</svg>
      <div class="legend">${series.map((s, si) => `<span><i style="background:${s.color || CHART_COLORS[si]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
    if (onClick) $$('.bar-group', node).forEach(g => { const go = () => onClick(Number(g.dataset.i)); g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  });
}

/** Horizontal ranked bars (HTML — best for long player names). items: [{ label, sub, value, href, color }] */
function HBarChart(el, { items, fmtVal = v => fmt.n(v, 0), ariaLabel = 'Ranking chart' }) {
  const max = Math.max(...items.map(i => Math.abs(i.value)), 1e-9);
  el.innerHTML = `<ol class="hbar" aria-label="${esc(ariaLabel)}">${items.map((it, i) => `<li>
    <a class="hbar-row" href="${it.href || '#'}"><span class="hbar-label"><span class="hbar-rank">${i + 1}</span><span class="hbar-name">${esc(it.label)}</span><span class="hbar-sub">${esc(it.sub || '')}</span></span>
    <span class="hbar-track"><span class="hbar-fill ${animClass()}" style="width:${Math.max(1.5, (Math.abs(it.value) / max) * 100).toFixed(1)}%;${it.color ? `--bar:${it.color}` : ''};animation-delay:${i * 40}ms"></span></span>
    <span class="hbar-val">${fmtVal(it.value)}</span></a></li>`).join('')}</ol>`;
}

/** axes: string[]; series: [{ name, values: 0..100[], color }] */
function RadarChart(el, { axes, series, ariaLabel = 'Radar chart', maxSize = 380 }) {
  mountChart(el, (node, w) => {
    const R = Math.max(50, Math.min((w - 250) / 2, (maxSize - 120) / 2)); const width = w, size = Math.round(R * 2 + 76); const cx = width / 2, cy = size / 2 + 2;
    const ang = i => -Math.PI / 2 + (i / axes.length) * Math.PI * 2;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
    const rings = [25, 50, 75, 100].map(r => `<polygon class="ring" points="${axes.map((_, i) => pt(i, r).join(',')).join(' ')}"/>`).join('');
    const spokes = axes.map((a, i) => { const [x, y] = pt(i, 100); const [lx, ly] = pt(i, 122); const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'; return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text class="axis strong" x="${lx}" y="${ly + 4}" text-anchor="${anchor}">${esc(a)}</text>`; }).join('');
    const polys = series.map((s, si) => { const c = s.color || CHART_COLORS[si]; return `<g class="radar-shape ${animClass()}" style="transform-origin:${cx}px ${cy}px"><polygon points="${s.values.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="2"/>${s.values.map((v, i) => { const [x, y] = pt(i, v); return `<circle cx="${x}" cy="${y}" r="4" fill="${c}" data-tip="${esc(`${s.name}\n${axes[i]}: ${v}th percentile`)}"/>`; }).join('')}</g>`; }).join('');
    node.innerHTML = `<div class="radar-box"><svg width="${width}" height="${size}" viewBox="0 0 ${width} ${size}" role="img" aria-label="${esc(ariaLabel)}">${rings}${spokes}${polys}</svg></div>
      ${series.length > 1 ? `<div class="legend center">${series.map((s, si) => `<span><i style="background:${s.color || CHART_COLORS[si]}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}
      <div class="sr-only"><table><caption>${esc(ariaLabel)}</caption><tr><th>Metric</th>${series.map(s => `<th>${esc(s.name)}</th>`).join('')}</tr>${axes.map((a, i) => `<tr><td>${esc(a)}</td>${series.map(s => `<td>${s.values[i]}</td>`).join('')}</tr>`).join('')}</table></div>`;
  });
}
