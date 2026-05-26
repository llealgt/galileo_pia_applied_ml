// ============================================================
// Overfitting in Decision Trees Widget
// Ilustra underfitting → buen ajuste → overfitting variando la
// capacidad del árbol (max_depth). Panel izquierdo: frontera de
// decisión sobre train (lleno) y validación (anillo). Panel derecho:
// curva de accuracy train vs validación en función de max_depth.
// ============================================================

function initOverfitTreeWidget() {
  const canvas = document.getElementById('overfit-tree-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Frontera verdadera diagonal (x + y > 10) + ruido de etiqueta en train.
  // El árbol la aproxima con una "escalera": más profundidad = mejor
  // aproximación... hasta que empieza a memorizar el ruido.
  // La validación es LIMPIA → revela cuándo el árbol memoriza en vez de aprender.
  function gen(seedInit, n, noise) {
    let s = seedInit;
    const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = r() * 10, y = r() * 10;
      let lbl = (x + y > 10) ? 1 : 0;
      if (r() < noise) lbl = 1 - lbl;
      pts.push({ x, y, label: lbl });
    }
    return pts;
  }
  const train = gen(7, 100, 0.15);
  const val = gen(999, 120, 0.0);

  // ---- Árbol ----
  function gini(labels) {
    if (!labels.length) return 0;
    const c = {}; labels.forEach(l => c[l] = (c[l] || 0) + 1);
    let imp = 1; Object.values(c).forEach(n => { const p = n / labels.length; imp -= p * p; });
    return imp;
  }
  function majority(labels) {
    const c = {}; labels.forEach(l => c[l] = (c[l] || 0) + 1);
    let best = 0, lbl = 0; Object.entries(c).forEach(([l, n]) => { if (n > best) { best = n; lbl = +l; } });
    return lbl;
  }
  function buildTree(pts, depth, maxDepth) {
    const labels = pts.map(p => p.label);
    if (depth >= maxDepth || new Set(labels).size <= 1 || pts.length < 2) {
      return { leaf: true, label: majority(labels) };
    }
    let bestGain = 0, bestF = null, bestT = 0;
    const parent = gini(labels);
    for (const f of ['x', 'y']) {
      const vals = [...new Set(pts.map(p => p[f]))].sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const t = (vals[i] + vals[i + 1]) / 2;
        const L = pts.filter(p => p[f] <= t), R = pts.filter(p => p[f] > t);
        if (!L.length || !R.length) continue;
        const g = parent - (L.length * gini(L.map(p => p.label)) + R.length * gini(R.map(p => p.label))) / pts.length;
        if (g > bestGain) { bestGain = g; bestF = f; bestT = t; }
      }
    }
    if (!bestF) return { leaf: true, label: majority(labels) };
    const L = pts.filter(p => p[bestF] <= bestT), R = pts.filter(p => p[bestF] > bestT);
    return { leaf: false, f: bestF, t: bestT,
             left: buildTree(L, depth + 1, maxDepth), right: buildTree(R, depth + 1, maxDepth) };
  }
  function predict(tree, x, y) {
    if (tree.leaf) return tree.label;
    const v = tree.f === 'x' ? x : y;
    return v <= tree.t ? predict(tree.left, x, y) : predict(tree.right, x, y);
  }
  function acc(tree, pts) {
    let ok = 0; pts.forEach(p => { if (predict(tree, p.x, p.y) === p.label) ok++; });
    return ok / pts.length;
  }

  const MAXD = 12;
  const trees = [], trAcc = [], vaAcc = [];
  for (let d = 1; d <= MAXD; d++) {
    const t = buildTree(train, 0, d);
    trees[d] = t; trAcc[d] = acc(t, train); vaAcc[d] = acc(t, val);
  }
  // Profundidad con mejor validación (para el veredicto)
  let bestValD = 1; for (let d = 2; d <= MAXD; d++) if (vaAcc[d] > vaAcc[bestValD] + 1e-9) bestValD = d;

  // ---- Layout ----
  const xMin = 0, xMax = 10, yMin = 0, yMax = 10;
  const lp = { left: 40, top: 46, w: 360, h: 320 };
  function tx(v) { return lp.left + (v - xMin) / (xMax - xMin) * lp.w; }
  function ty(v) { return lp.top + lp.h - (v - yMin) / (yMax - yMin) * lp.h; }
  // panel derecho (curva)
  const rp = { left: 470, top: 60, w: 440, h: 280 };
  function cx(d) { return rp.left + (d - 1) / (MAXD - 1) * rp.w; }
  function cy(a) { return rp.top + rp.h - (a - 0.4) / (1.0 - 0.4) * rp.h; }

  const slider = document.getElementById('of-depth-slider');
  const dval = document.getElementById('of-depth-value');

  function draw() {
    const d = parseInt(slider.value);
    if (dval) dval.textContent = d;
    const tree = trees[d];

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // ===== LEFT: frontera + datos =====
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Frontera de decisión (max_depth = ' + d + ')', lp.left, 22);
    // legend
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('● train', lp.left, 38); ctx.fillText('○ validación', lp.left + 70, 38);

    const step = 5;
    for (let px = lp.left; px < lp.left + lp.w; px += step) {
      for (let py = lp.top; py < lp.top + lp.h; py += step) {
        const dx = xMin + (px - lp.left) / lp.w * (xMax - xMin);
        const dy = yMax - (py - lp.top) / lp.h * (yMax - yMin);
        ctx.fillStyle = predict(tree, dx, dy) === 1 ? 'rgba(252,98,85,0.13)' : 'rgba(88,196,221,0.13)';
        ctx.fillRect(px, py, step, step);
      }
    }
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.strokeRect(lp.left, lp.top, lp.w, lp.h);

    // train (filled)
    train.forEach(p => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? '#FC6255' : '#58C4DD'; ctx.fill();
    });
    // val (ring)
    val.forEach(p => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 4, 0, Math.PI * 2);
      ctx.strokeStyle = p.label === 1 ? '#FC6255' : '#58C4DD'; ctx.lineWidth = 1.6; ctx.stroke();
    });

    // ===== RIGHT: curva de accuracy =====
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Accuracy vs capacidad (max_depth)', rp.left, 22);

    // ejes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rp.left, rp.top); ctx.lineTo(rp.left, rp.top + rp.h); ctx.lineTo(rp.left + rp.w, rp.top + rp.h); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'right';
    [0.4, 0.6, 0.8, 1.0].forEach(a => { ctx.fillText(a.toFixed(1), rp.left - 4, cy(a) + 3); });
    ctx.textAlign = 'center';
    for (let dd = 1; dd <= MAXD; dd += 1) ctx.fillText(dd, cx(dd), rp.top + rp.h + 14);
    ctx.fillText('max_depth →  (capacidad)', rp.left + rp.w / 2, rp.top + rp.h + 30);

    // bandas de régimen
    ctx.fillStyle = 'rgba(88,196,221,0.06)'; ctx.fillRect(rp.left, rp.top, cx(bestValD - 0.5) - rp.left, rp.h);
    ctx.fillStyle = 'rgba(252,98,85,0.06)'; ctx.fillRect(cx(bestValD + 0.5), rp.top, rp.left + rp.w - cx(bestValD + 0.5), rp.h);

    // curva train
    ctx.strokeStyle = '#FF862F'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let dd = 1; dd <= MAXD; dd++) { const X = cx(dd), Y = cy(trAcc[dd]); dd === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); } ctx.stroke();
    // curva validación
    ctx.strokeStyle = '#83C167'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let dd = 1; dd <= MAXD; dd++) { const X = cx(dd), Y = cy(vaAcc[dd]); dd === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); } ctx.stroke();
    // puntos
    for (let dd = 1; dd <= MAXD; dd++) {
      ctx.beginPath(); ctx.arc(cx(dd), cy(trAcc[dd]), 2.5, 0, Math.PI * 2); ctx.fillStyle = '#FF862F'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx(dd), cy(vaAcc[dd]), 2.5, 0, Math.PI * 2); ctx.fillStyle = '#83C167'; ctx.fill();
    }
    // marcador de profundidad actual
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx(d), rp.top); ctx.lineTo(cx(d), rp.top + rp.h); ctx.stroke(); ctx.setLineDash([]);

    // leyenda curvas
    ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = '#FF862F'; ctx.fillText('━ train', rp.left + rp.w - 150, rp.top + 12);
    ctx.fillStyle = '#83C167'; ctx.fillText('━ validación', rp.left + rp.w - 90, rp.top + 12);

    // ===== Veredicto =====
    const gap = trAcc[d] - vaAcc[d];
    let verdict, vcolor;
    if (d < bestValD) { verdict = 'UNDERFITTING — poca capacidad, no captura el patrón'; vcolor = '#58C4DD'; }
    else if (d === bestValD) { verdict = 'BUEN AJUSTE — generaliza bien (validación máxima)'; vcolor = '#83C167'; }
    else { verdict = 'OVERFITTING — memoriza el ruido, no aprende el patrón'; vcolor = '#FC6255'; }

    ctx.textAlign = 'left'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.fillStyle = vcolor;
    ctx.fillText(verdict, lp.left, H - 26);
    ctx.font = '12px Fira Code, monospace'; ctx.fillStyle = '#a8a290';
    ctx.fillText(
      `train acc = ${(trAcc[d] * 100).toFixed(0)}%   ·   validación acc = ${(vaAcc[d] * 100).toFixed(0)}%   ·   gap = ${(gap * 100).toFixed(0)}%`,
      lp.left, H - 8);
  }

  slider.addEventListener('input', draw);
  draw();
}
