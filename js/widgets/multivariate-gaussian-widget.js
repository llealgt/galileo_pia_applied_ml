// ============================================================
// Multivariate Gaussian Widget — gaussiana multivariada 2D + 3D
// Panel izquierdo (canvas): contornos elípticos de p(x) sobre la nube
//   de datos, con punto de prueba arrastrable y frontera de decisión ε.
// Panel derecho (Plotly): la MISMA densidad como superficie 3D rotable.
//   Σ = [[σ₁², ρσ₁σ₂], [ρσ₁σ₂, σ₂²]]
//   ρ = 0  → campana alineada a los ejes = gaussianas INDEPENDIENTES.
//   ρ ≠ 0  → campana inclinada = captura la correlación.
// ============================================================

function initMultivariateGaussian() {
  const canvas = document.getElementById('mvg-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const plotDiv = document.getElementById('mvg-3d');

  const s1El = document.getElementById('mvg-s1'), s1V = document.getElementById('mvg-s1-val');
  const s2El = document.getElementById('mvg-s2'), s2V = document.getElementById('mvg-s2-val');
  const rhoEl = document.getElementById('mvg-rho'), rhoV = document.getElementById('mvg-rho-val');
  const epsEl = document.getElementById('mvg-eps'), epsV = document.getElementById('mvg-eps-val');
  const pV = document.getElementById('mvg-p'), dV = document.getElementById('mvg-d'), verdict = document.getElementById('mvg-verdict');

  // ---- nube de datos correlacionada (determinista) ----
  let seed = 20260616;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  function gauss() { const u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const DATA = [];
  for (let i = 0; i < 42; i++) {
    const t = gauss();
    DATA.push([5 + 1.55 * t + 0.55 * gauss(), 5 + 1.25 * t + 0.55 * gauss()]);
  }
  const MU = DATA.reduce((m, p) => [m[0] + p[0], m[1] + p[1]], [0, 0]).map(v => v / DATA.length);
  let test = [7.6, 3.4];

  // geometría del plano 2D
  const DMAX = 10, X0 = 58, Y0 = 16, SIDE = 360, sc = SIDE / DMAX;
  const sx = x => X0 + x * sc;
  const sy = y => Y0 + SIDE - y * sc;

  function covar(s1, s2, rho) { return { a: s1 * s1, b: rho * s1 * s2, c: s2 * s2 }; }
  function eig(a, b, c) {
    const half = (a + c) / 2, diff = Math.sqrt(((a - c) / 2) ** 2 + b * b);
    return { l1: half + diff, l2: half - diff, th: 0.5 * Math.atan2(2 * b, a - c) };
  }
  function pdf(x, y, a, b, c) {
    const det = a * c - b * b;
    if (det <= 1e-9) return { p: 0, d2: Infinity };
    const dx = x - MU[0], dy = y - MU[1];
    const d2 = (c * dx * dx - 2 * b * dx * dy + a * dy * dy) / det;
    return { p: Math.exp(-d2 / 2) / (2 * Math.PI * Math.sqrt(det)), d2 };
  }

  function ellipse(r, l1, l2, th, stroke, lw, dash) {
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
    ctx.beginPath();
    const A = r * Math.sqrt(Math.max(l1, 0)), B = r * Math.sqrt(Math.max(l2, 0));
    const cth = Math.cos(th), sth = Math.sin(th);
    for (let k = 0; k <= 64; k++) {
      const phi = k / 64 * 2 * Math.PI;
      const ex = A * Math.cos(phi), ey = B * Math.sin(phi);
      const X = sx(MU[0] + ex * cth - ey * sth), Y = sy(MU[1] + ex * sth + ey * cth);
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  }

  function draw2D(a, b, c, eps) {
    const { l1, l2, th } = eig(a, b, c);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    // grid + marco
    ctx.strokeStyle = 'rgba(168,162,144,0.15)'; ctx.lineWidth = 1;
    for (let g = 0; g <= DMAX; g += 2) {
      ctx.beginPath(); ctx.moveTo(sx(g), sy(0)); ctx.lineTo(sx(g), sy(DMAX)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(0), sy(g)); ctx.lineTo(sx(DMAX), sy(g)); ctx.stroke();
    }
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.2; ctx.strokeRect(sx(0), sy(DMAX), SIDE, SIDE);
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x₁', sx(5), sy(0) + 16);
    ctx.save(); ctx.translate(sx(0) - 14, sy(5)); ctx.rotate(-Math.PI / 2); ctx.fillText('x₂', 0, 0); ctx.restore();

    // contornos de densidad
    ellipse(1, l1, l2, th, 'rgba(252,98,85,0.85)', 2);
    ellipse(2, l1, l2, th, 'rgba(252,98,85,0.5)', 1.6);
    ellipse(3, l1, l2, th, 'rgba(252,98,85,0.3)', 1.3);
    // frontera de decisión (p = ε)
    const det = a * c - b * b, thr = -2 * Math.log(eps * 2 * Math.PI * Math.sqrt(det));
    if (det > 0 && thr > 0) ellipse(Math.sqrt(thr), l1, l2, th, '#FFFF00', 2, [6, 4]);
    // eje principal
    const cth = Math.cos(th), sth = Math.sin(th), L = 3 * Math.sqrt(l1);
    ctx.strokeStyle = 'rgba(255,255,0,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx(MU[0] - L * cth), sy(MU[1] - L * sth)); ctx.lineTo(sx(MU[0] + L * cth), sy(MU[1] + L * sth)); ctx.stroke();
    // datos
    ctx.fillStyle = '#58C4DD'; ctx.font = 'bold 13px Fira Code, monospace';
    DATA.forEach(p => ctx.fillText('×', sx(p[0]), sy(p[1]) + 4));
    // media
    ctx.fillStyle = '#FC6255'; ctx.beginPath(); ctx.arc(sx(MU[0]), sy(MU[1]), 4, 0, 2 * Math.PI); ctx.fill();
    // punto de prueba
    const r = pdf(test[0], test[1], a, b, c), isAnom = r.p < eps;
    ctx.beginPath(); ctx.arc(sx(test[0]), sy(test[1]), 8, 0, 2 * Math.PI);
    ctx.fillStyle = isAnom ? '#9A72AC' : '#FFFF00'; ctx.fill();
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ece6d0'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('x_test', sx(test[0]) + 11, sy(test[1]) - 8);
    // leyenda
    ctx.fillStyle = 'rgba(252,98,85,0.8)'; ctx.fillText('— densidad', X0 + 6, H - 22);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('- - frontera ε', X0 + 6, H - 8);
    return { p: r.p, d2: r.d2, isAnom };
  }

  // ----- superficie 3D (Plotly) -----
  const N = 40, xv = [];
  for (let i = 0; i < N; i++) xv.push(i / (N - 1) * DMAX);
  const CS = [[0, '#1b1b2f'], [0.15, '#58C4DD'], [0.4, '#5CD0B3'], [0.6, '#83C167'], [0.8, '#FF862F'], [1, '#FC6255']];
  const layout3d = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', margin: { l: 0, r: 0, t: 0, b: 0 },
    scene: {
      xaxis: { title: 'x₁', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      yaxis: { title: 'x₂', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      zaxis: { title: 'p(x)', color: '#a8a290', gridcolor: 'rgba(255,255,255,0.08)', backgroundcolor: '#0d0d1a' },
      camera: { eye: { x: 1.7, y: -1.6, z: 1.0 } }, bgcolor: '#0d0d1a'
    }
  };
  function zGrid(a, b, c) {
    const z = [];
    for (let j = 0; j < N; j++) { const row = []; for (let i = 0; i < N; i++) row.push(pdf(xv[i], xv[j], a, b, c).p); z.push(row); }
    return z;
  }
  function traces(a, b, c, pt, isAnom) {
    return [
      { x: xv, y: xv, z: zGrid(a, b, c), type: 'surface', colorscale: CS, showscale: false, opacity: 0.92, contours: { z: { show: true, usecolormap: true, highlightcolor: '#ece6d0' } }, hoverinfo: 'skip' },
      { x: [test[0], test[0]], y: [test[1], test[1]], z: [0, pt], type: 'scatter3d', mode: 'lines', line: { color: '#ece6d0', width: 4 }, hoverinfo: 'skip', showlegend: false },
      { x: [test[0]], y: [test[1]], z: [pt], type: 'scatter3d', mode: 'markers', marker: { size: 5, color: isAnom ? '#9A72AC' : '#FFFF00' }, hoverinfo: 'skip', showlegend: false }
    ];
  }
  let plotReady = false;
  const hasPlotly = typeof Plotly !== 'undefined' && plotDiv;

  function draw(full) {
    const s1 = parseFloat(s1El.value), s2 = parseFloat(s2El.value), rho = parseFloat(rhoEl.value), eps = parseFloat(epsEl.value);
    if (s1V) s1V.textContent = s1.toFixed(2);
    if (s2V) s2V.textContent = s2.toFixed(2);
    if (rhoV) rhoV.textContent = rho.toFixed(2);
    if (epsV) epsV.textContent = eps.toFixed(3);
    const { a, b, c } = covar(s1, s2, rho);

    const res = draw2D(a, b, c, eps);

    // lecturas HTML
    if (pV) pV.textContent = res.p < 1e-4 ? res.p.toExponential(2) : res.p.toFixed(4);
    if (dV) dV.textContent = Math.sqrt(Math.max(0, res.d2)).toFixed(2);
    if (verdict) { verdict.textContent = res.isAnom ? '⚠ anomalía' : '✓ normal'; verdict.style.color = res.isAnom ? '#9A72AC' : '#83C167'; }

    // 3D
    if (hasPlotly && plotReady) {
      if (full) {
        Plotly.react(plotDiv, traces(a, b, c, res.p, res.isAnom), layout3d, { responsive: true, displayModeBar: false });
      } else {
        Plotly.restyle(plotDiv, { x: [[test[0], test[0]], [test[0]]], y: [[test[1], test[1]], [test[1]]], z: [[0, res.p], [res.p]] }, [1, 2]);
        Plotly.restyle(plotDiv, { 'marker.color': [res.isAnom ? '#9A72AC' : '#FFFF00'] }, [2]);
      }
    }
  }

  // ---- arrastre del punto de prueba ----
  let dragging = false;
  function toData(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * (W / r.width) - X0) / sc, (Y0 + SIDE - (e.clientY - r.top) * (H / r.height)) / sc];
  }
  function near(e) {
    const r = canvas.getBoundingClientRect();
    return Math.hypot((e.clientX - r.left) * (W / r.width) - sx(test[0]), (e.clientY - r.top) * (H / r.height) - sy(test[1])) < 16;
  }
  function moveTo(e) {
    const d = toData(e);
    test = [Math.max(0, Math.min(DMAX, d[0])), Math.max(0, Math.min(DMAX, d[1]))];
    draw(false);
  }
  canvas.addEventListener('mousedown', e => { if (near(e)) dragging = true; });
  canvas.addEventListener('mousemove', e => { if (dragging) moveTo(e); });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', e => { if (near(e.touches[0])) { dragging = true; e.preventDefault(); } }, { passive: false });
  canvas.addEventListener('touchmove', e => { if (dragging) { e.preventDefault(); moveTo(e.touches[0]); } }, { passive: false });
  canvas.addEventListener('touchend', () => { dragging = false; });

  [s1El, s2El, rhoEl].forEach(el => el && el.addEventListener('input', () => draw(true)));
  if (epsEl) epsEl.addEventListener('input', () => draw(false));

  // init: construir superficie 3D una vez
  if (hasPlotly) {
    const s1 = parseFloat(s1El.value), s2 = parseFloat(s2El.value), rho = parseFloat(rhoEl.value), eps = parseFloat(epsEl.value);
    const { a, b, c } = covar(s1, s2, rho);
    const r0 = pdf(test[0], test[1], a, b, c);
    Plotly.newPlot(plotDiv, traces(a, b, c, r0.p, r0.p < eps), layout3d, { responsive: true, displayModeBar: false })
      .then(() => { plotReady = true; });
  }
  draw(false);
}
