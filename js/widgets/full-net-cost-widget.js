// ============================================================
// Full Network Cost Widget — red neuronal completa interactiva
// Red 2 → 4 → 1 (densa, sigmoide). El usuario selecciona CUALQUIER
// parámetro (clic en una arista = peso, clic en un nodo = bias, o vía
// el menú) y mueve un slider para ajustar su valor. La red recalcula
// el forward y se refleja en la salida ŷ y en el costo J.
// Ejemplo fijo x=[1.0,0.5], objetivo y=1, J = ½(ŷ−y)².
// ============================================================

function initFullNetCost() {
  const canvas = document.getElementById('full-net-cost-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const selEl = document.getElementById('fnc-param');
  const slider = document.getElementById('fnc-val');
  const valLabel = document.getElementById('fnc-val-label');

  const X_IN = [1.0, 0.5], Y_TARGET = 1.0;
  const sigmoid = z => 1 / (1 + Math.exp(-z));

  // parámetros por defecto
  const P = {
    W1: [[0.8, -0.5], [-0.6, 0.9], [0.4, 0.7], [-0.3, -0.8]],
    b1: [0.1, -0.2, 0.0, 0.3],
    W2: [0.9, -0.7, 0.5, 0.6],
    b2: -0.2
  };
  const NH = 4;

  // accessores genéricos sobre un selector "W1-h-i" | "b1-h" | "W2-h" | "b2"
  function getVal(p, s) {
    const t = s.split('-');
    if (t[0] === 'W1') return p.W1[+t[1]][+t[2]];
    if (t[0] === 'b1') return p.b1[+t[1]];
    if (t[0] === 'W2') return p.W2[+t[1]];
    return p.b2;
  }
  function setVal(p, s, v) {
    const t = s.split('-');
    if (t[0] === 'W1') p.W1[+t[1]][+t[2]] = v;
    else if (t[0] === 'b1') p.b1[+t[1]] = v;
    else if (t[0] === 'W2') p.W2[+t[1]] = v;
    else p.b2 = v;
  }
  function label(s) {
    const t = s.split('-');
    if (t[0] === 'W1') return 'W₁[' + t[1] + ',' + t[2] + ']';
    if (t[0] === 'b1') return 'b₁[' + t[1] + ']';
    if (t[0] === 'W2') return 'W₂[' + t[1] + ']';
    return 'b₂';
  }

  let selected = 'W2-0';

  // poblar el menú
  if (selEl && !selEl.dataset.filled) {
    selEl.dataset.filled = '1';
    const groups = [
      ['Capa 1 · pesos W₁ (entrada → oculta)', () => { const o = []; for (let h = 0; h < NH; h++) for (let i = 0; i < 2; i++) o.push('W1-' + h + '-' + i); return o; }],
      ['Capa 1 · bias b₁', () => { const o = []; for (let h = 0; h < NH; h++) o.push('b1-' + h); return o; }],
      ['Capa 2 · pesos W₂ (oculta → salida)', () => { const o = []; for (let h = 0; h < NH; h++) o.push('W2-' + h); return o; }],
      ['Capa 2 · bias b₂', () => ['b2']]
    ];
    groups.forEach(([gl, gen]) => {
      const og = document.createElement('optgroup'); og.label = gl;
      gen().forEach(s => { const op = document.createElement('option'); op.value = s; op.textContent = label(s); og.appendChild(op); });
      selEl.appendChild(og);
    });
    selEl.value = selected;
  }

  // forward dado un set de parámetros
  function forward(p) {
    const a1 = [], z1 = [];
    for (let h = 0; h < NH; h++) {
      const z = p.W1[h][0] * X_IN[0] + p.W1[h][1] * X_IN[1] + p.b1[h];
      z1.push(z); a1.push(sigmoid(z));
    }
    let z2 = p.b2;
    for (let h = 0; h < NH; h++) z2 += p.W2[h] * a1[h];
    const yhat = sigmoid(z2);
    const J = 0.5 * (yhat - Y_TARGET) ** 2;
    return { a1, yhat, J };
  }
  function costAt(s, v) {
    const saved = getVal(P, s);
    setVal(P, s, v); const J = forward(P).J; setVal(P, s, saved);
    return J;
  }

  // geometría
  const inX = 105, inY = [150, 240];
  const hidX = 360, hidY = [60, 140, 220, 300];
  const outX = 585, outY = 180;
  const rIn = 22, rHid = 20, rOut = 26;
  const meterX = 905, meterTop = 60, meterH = 250;

  function lerpCol(a, b, t) {
    const c = (i) => Math.round(a[i] + (b[i] - a[i]) * t);
    return 'rgb(' + c(0) + ',' + c(1) + ',' + c(2) + ')';
  }

  // hit-testing para clic
  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function pick(mx, my) {
    // nodos (bias): oculta b1[h], salida b2
    for (let h = 0; h < NH; h++) if (Math.hypot(mx - hidX, my - hidY[h]) < rHid + 3) return 'b1-' + h;
    if (Math.hypot(mx - outX, my - outY) < rOut + 3) return 'b2';
    // aristas (pesos): entrada→oculta W1[h][i]; oculta→salida W2[h]
    let best = null, bd = 8;
    for (let h = 0; h < NH; h++) for (let i = 0; i < 2; i++) {
      const d = distToSeg(mx, my, inX + rIn, inY[i], hidX - rHid, hidY[h]);
      if (d < bd) { bd = d; best = 'W1-' + h + '-' + i; }
    }
    for (let h = 0; h < NH; h++) {
      const d = distToSeg(mx, my, hidX + rHid, hidY[h], outX - rOut, outY);
      if (d < bd) { bd = d; best = 'W2-' + h; }
    }
    return best;
  }

  function edgeStyle(w, isSel) {
    const mag = Math.min(1, Math.abs(w) / 3);
    const base = w >= 0 ? 'rgba(88,196,221,' : 'rgba(252,98,85,';
    return { color: isSel ? '#FFFF00' : base + (0.25 + 0.6 * mag) + ')', lw: (isSel ? 3.5 : 1 + 2.6 * mag) };
  }

  function draw() {
    const st = forward(P);
    const v = getVal(P, selected);
    if (valLabel) valLabel.textContent = v.toFixed(2);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // hidden afectada por el parámetro seleccionado (para resaltar el camino)
    const st0 = selected.split('-');
    const affHidden = (st0[0] === 'W1' || st0[0] === 'b1') ? +st0[1] : -1;

    // ---- aristas entrada→oculta ----
    for (let h = 0; h < NH; h++) for (let i = 0; i < 2; i++) {
      const isSel = selected === 'W1-' + h + '-' + i;
      const s = edgeStyle(P.W1[h][i], isSel);
      if (isSel) { ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 10; }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.lw;
      ctx.beginPath(); ctx.moveTo(inX + rIn, inY[i]); ctx.lineTo(hidX - rHid, hidY[h]); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // ---- aristas oculta→salida ----
    for (let h = 0; h < NH; h++) {
      const isSel = selected === 'W2-' + h;
      const s = edgeStyle(P.W2[h], isSel);
      if (isSel) { ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 10; }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.lw;
      ctx.beginPath(); ctx.moveTo(hidX + rHid, hidY[h]); ctx.lineTo(outX - rOut, outY); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ---- nodos de entrada ----
    for (let i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.arc(inX, inY[i], rIn, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,134,47,0.22)'; ctx.fill();
      ctx.strokeStyle = '#FF862F'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(X_IN[i].toFixed(1), inX, inY[i]);
    }
    // ---- nodos ocultos ----
    for (let h = 0; h < NH; h++) {
      const aff = h === affHidden;
      const selBias = selected === 'b1-' + h;
      if (aff || selBias) { ctx.shadowColor = selBias ? '#FFFF00' : '#E48BB0'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(hidX, hidY[h], rHid, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(88,196,221,0.2)'; ctx.fill();
      ctx.strokeStyle = selBias ? '#FFFF00' : '#58C4DD'; ctx.lineWidth = selBias ? 3 : 2; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace';
      ctx.fillText(st.a1[h].toFixed(2), hidX, hidY[h]);
    }
    // ---- nodo de salida ----
    const selB2 = selected === 'b2';
    ctx.shadowColor = selB2 ? '#FFFF00' : '#E48BB0'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(outX, outY, rOut, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(228,139,176,0.2)'; ctx.fill();
    ctx.strokeStyle = selB2 ? '#FFFF00' : '#E48BB0'; ctx.lineWidth = selB2 ? 3.5 : 2.8; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#E48BB0'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('ŷ', outX, outY - 6);
    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText(st.yhat.toFixed(3), outX, outY + 10);

    // ---- etiquetas de capa ----
    ctx.font = 'bold 11px Fira Code, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FF862F'; ctx.fillText('entradas', inX, 28);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('capa oculta (4)', hidX, 28);
    ctx.fillStyle = '#E48BB0'; ctx.fillText('salida', outX, 28);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('clic en una arista (peso) o un nodo (bias) para seleccionar', 330, H - 12);

    // ---- medidor de costo (barra vertical) ----
    const Jn = Math.min(1, st.J / 0.5);
    ctx.fillStyle = 'rgba(168,162,144,0.15)';
    ctx.fillRect(meterX, meterTop, 26, meterH);
    const fillH = Jn * meterH;
    ctx.fillStyle = lerpCol([131, 193, 103], [252, 98, 85], Jn);
    ctx.fillRect(meterX, meterTop + meterH - fillH, 26, fillH);
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1; ctx.strokeRect(meterX, meterTop, 26, meterH);
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('J', meterX + 13, meterTop - 8);

    // ---- panel de lectura ----
    const px = 650, py = 70;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('Parámetro seleccionado', px, py);
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 15px Fira Code, monospace';
    ctx.fillText(label(selected) + ' = ' + v.toFixed(2), px, py + 26);
    ctx.fillStyle = '#E48BB0'; ctx.font = '13px Fira Code, monospace';
    ctx.fillText('predicción ŷ = ' + st.yhat.toFixed(4), px, py + 56);
    ctx.fillStyle = '#83C167'; ctx.fillText('objetivo   y = ' + Y_TARGET.toFixed(1), px, py + 78);
    ctx.fillStyle = lerpCol([131, 193, 103], [252, 98, 85], Jn);
    ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillText('costo  J = ' + st.J.toFixed(4), px, py + 104);

    // ---- curva J vs parámetro (abajo) ----
    const pad = { l: 70, t: 345, r: 0 };
    const plw = 470, plh = H - pad.t - 28, plx = pad.l, ply = pad.t;
    const pMin = -3, pMax = 3;
    let jMax = 1e-9; const pts = [];
    for (let i = 0; i <= 120; i++) { const pv = pMin + (pMax - pMin) * i / 120; const j = costAt(selected, pv); pts.push([pv, j]); if (j > jMax) jMax = j; }
    const sx = pv => plx + (pv - pMin) / (pMax - pMin) * plw;
    const sy = j => ply + plh - (j / (jMax * 1.05)) * plh;
    ctx.strokeStyle = 'rgba(168,162,144,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plx, ply); ctx.lineTo(plx, ply + plh); ctx.lineTo(plx + plw, ply + plh); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(label(selected), plx + plw / 2, ply + plh + 20);
    ctx.save(); ctx.translate(plx - 48, ply + plh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('J', 0, 0); ctx.restore();
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.2; ctx.beginPath();
    pts.forEach((p, i) => { const X = sx(p[0]), Y = sy(p[1]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
    // punto actual
    const cxp = sx(v), cyp = sy(st.J);
    ctx.strokeStyle = 'rgba(255,255,0,0.4)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cxp, ply); ctx.lineTo(cxp, ply + plh); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(cxp, cyp, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#E48BB0'; ctx.fill(); ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('mueve el slider → J recorre esta curva', plx + plw / 2 - 80, ply - 6);
  }

  // ---- interacción ----
  function syncSliderToSelected() {
    if (!slider) return;
    slider.value = getVal(P, selected).toFixed(2);
  }
  if (selEl) selEl.addEventListener('change', () => { selected = selEl.value; syncSliderToSelected(); draw(); });
  if (slider) slider.addEventListener('input', () => { setVal(P, selected, parseFloat(slider.value)); draw(); });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    const my = (e.clientY - r.top) * (H / r.height);
    const hit = pick(mx, my);
    if (hit) { selected = hit; if (selEl) selEl.value = hit; syncSliderToSelected(); draw(); }
  });

  syncSliderToSelected();
  draw();
}
