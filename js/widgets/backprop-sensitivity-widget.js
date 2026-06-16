// ============================================================
// Backprop Sensitivity Widget — "un cambio se propaga hacia adelante"
// Red en cadena: x → a⁽¹⁾ → a⁽²⁾ → ŷ → J(loss).
// El usuario elige un parámetro (w1,b1,w2,b2,w3,b3) y mueve su valor.
// El cambio se propaga hacia adelante: las capas siguientes, la
// predicción ŷ y el costo J se recalculan y se resaltan, con un
// pulso animado que viaja por el camino afectado.
// Abajo: curva J vs parámetro; su PENDIENTE en el punto actual es
// exactamente el gradiente ∂J/∂param que backpropagation calcula.
// ============================================================

function initBackpropSensitivity() {
  const canvas = document.getElementById('backprop-sensitivity-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sel = document.getElementById('bps-param');
  const slider = document.getElementById('bps-val');
  const valLabel = document.getElementById('bps-val-label');

  const X_IN = 1.5, Y_TARGET = 1.0;            // entrada y objetivo fijos
  const sigmoid = z => 1 / (1 + Math.exp(-z));

  // parámetros (valores por defecto)
  const P = { w1: 1.0, b1: 0.0, w2: 1.2, b2: 0.0, w3: 1.0, b3: 0.0 };

  function forward(p) {
    const z1 = p.w1 * X_IN + p.b1, a1 = sigmoid(z1);
    const z2 = p.w2 * a1 + p.b2, a2 = sigmoid(z2);
    const z3 = p.w3 * a2 + p.b3, yhat = sigmoid(z3);
    const loss = 0.5 * (yhat - Y_TARGET) ** 2;
    return { a1, a2, yhat, loss };
  }
  function lossOf(paramKey, v) {
    const p = Object.assign({}, P); p[paramKey] = v;
    return forward(p).loss;
  }
  function gradOf(paramKey, v) {
    const h = 1e-3;
    return (lossOf(paramKey, v + h) - lossOf(paramKey, v - h)) / (2 * h);
  }

  // geometría de la cadena
  const cy = 130, R = 30;
  const cx = [80, 290, 500, 700];   // x, a1, a2, ŷ
  const lossBox = { x: 850, y: cy, w: 70, h: 56 };
  // índice del primer nodo afectado según el parámetro elegido
  // (w1/b1 → a1 en adelante; w2/b2 → a2 en adelante; w3/b3 → ŷ en adelante)
  function startIndexFor(key) {
    if (key === 'w1' || key === 'b1') return 1;
    if (key === 'w2' || key === 'b2') return 2;
    return 3;
  }

  const COL = { in: '#FF862F', layer: '#58C4DD', out: '#E48BB0', loss: '#FFFF00', dim: '#6f6a5a' };

  let raf = null, t0 = 0;

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function arrow(x1, y1, x2, y2, color, active) {
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = active ? 3 : 1.8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function draw(pulse) {
    const key = sel ? sel.value : 'w1';
    const v = slider ? parseFloat(slider.value) : P[key];
    P[key] = v;
    if (valLabel) valLabel.textContent = v.toFixed(2);

    const st = forward(P);
    const startIdx = startIndexFor(key);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // ---- título de regiones ----
    ctx.textAlign = 'left'; ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('① Mueves un parámetro …', 24, 28);
    ctx.fillText('② … el cambio se propaga →  capas siguientes  →  predicción ŷ  →  costo J', 24, 250);

    // ---- centros de nodos / camino activo ----
    const centers = [{ x: cx[0], y: cy }, { x: cx[1], y: cy }, { x: cx[2], y: cy }, { x: cx[3], y: cy }, { x: lossBox.x, y: cy }];
    const labels = ['x', 'a⁽¹⁾', 'a⁽²⁾', 'ŷ', 'J'];
    const vals = [X_IN, st.a1, st.a2, st.yhat, st.loss];
    const cols = [COL.in, COL.layer, COL.layer, COL.out, COL.loss];

    // ---- aristas (forward) ----
    const edgeLabels = ['w₁', 'w₂', 'w₃', '(ŷ−y)²'];
    for (let i = 0; i < 4; i++) {
      const a = centers[i], b = centers[i + 1];
      const activeEdge = (i + 1) >= startIdx;   // arista que entra a un nodo afectado
      const x1 = a.x + (i === 0 ? R : R), y1 = a.y;
      const x2 = (i === 3 ? lossBox.x - lossBox.w / 2 - 6 : b.x - R), y2 = b.y;
      arrow(x1, y1, x2, y2, activeEdge ? COL.out : COL.dim, activeEdge);
      // etiqueta de peso
      ctx.textAlign = 'center'; ctx.font = 'bold 13px Fira Code, monospace';
      const isChosenEdge = (edgeLabels[i] === 'w₁' && (key === 'w1' || key === 'b1') && i === 0) ||
        (edgeLabels[i] === 'w₂' && (key === 'w2' || key === 'b2')) ||
        (edgeLabels[i] === 'w₃' && (key === 'w3' || key === 'b3'));
      ctx.fillStyle = isChosenEdge ? '#FFFF00' : (activeEdge ? COL.out : '#a8a290');
      ctx.fillText(edgeLabels[i], (x1 + x2) / 2, y1 - 12);
    }

    // ---- nodos ----
    for (let i = 0; i < 4; i++) {
      const c = centers[i], active = i >= startIdx;
      // glow si activo
      if (active) { ctx.shadowColor = cols[i]; ctx.shadowBlur = 14; } else { ctx.shadowBlur = 0; }
      ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fillStyle = active ? 'rgba(228,139,176,0.18)' : 'rgba(120,116,100,0.10)';
      ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = active ? cols[i] : COL.dim; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = active ? cols[i] : '#9a957f'; ctx.font = 'bold 14px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.fillText(labels[i], c.x, c.y - 3);
      ctx.font = '11px Fira Code, monospace'; ctx.fillStyle = active ? '#ece6d0' : '#807b69';
      ctx.fillText(vals[i].toFixed(3), c.x, c.y + 14);
    }
    // caja de loss J
    ctx.shadowColor = COL.loss; ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(255,255,0,0.12)';
    roundRect(lossBox.x - lossBox.w / 2, lossBox.y - lossBox.h / 2, lossBox.w, lossBox.h, 8);
    ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = COL.loss; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = COL.loss; ctx.font = 'bold 14px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('J', lossBox.x, lossBox.y - 6);
    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText(st.loss.toFixed(4), lossBox.x, lossBox.y + 12);
    // objetivo y
    ctx.fillStyle = '#83C167'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('objetivo y = ' + Y_TARGET.toFixed(1), lossBox.x - 40, lossBox.y + lossBox.h / 2 + 22);

    // ---- pulso animado a lo largo del camino afectado ----
    if (pulse != null && pulse < 1) {
      const path = centers.slice(startIdx); // desde primer nodo afectado hasta J
      // longitudes
      const segs = [];
      let total = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const d = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
        segs.push(d); total += d;
      }
      const target = pulse * total;
      let acc = 0, px = path[0].x, py = path[0].y;
      for (let i = 0; i < segs.length; i++) {
        if (target <= acc + segs[i]) {
          const f = (target - acc) / segs[i];
          px = path[i].x + (path[i + 1].x - path[i].x) * f;
          py = path[i].y + (path[i + 1].y - path[i].y) * f;
          break;
        }
        acc += segs[i]; px = path[i + 1].x; py = path[i + 1].y;
      }
      ctx.shadowColor = '#FFFF00'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00'; ctx.fill(); ctx.shadowBlur = 0;
    }

    // ================= curva de loss J vs parámetro =================
    const pad = { l: 70, r: 30, t: 290, b: 30 };
    const plw = 420, plh = H - pad.t - pad.b;
    const plx = pad.l, ply = pad.t;
    const pMin = -3, pMax = 3;
    // muestreo de J sobre el rango
    let jMax = 1e-9;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const pv = pMin + (pMax - pMin) * i / 120;
      const j = lossOf(key, pv);
      pts.push({ pv, j }); if (j > jMax) jMax = j;
    }
    const sx = pv => plx + (pv - pMin) / (pMax - pMin) * plw;
    const sy = j => ply + plh - (j / (jMax * 1.05)) * plh;

    // ejes
    ctx.strokeStyle = 'rgba(168,162,144,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plx, ply); ctx.lineTo(plx, ply + plh); ctx.lineTo(plx + plw, ply + plh); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.fillText(key, plx + plw / 2, ply + plh + 22);
    ctx.save(); ctx.translate(plx - 46, ply + plh / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('J (costo)', 0, 0); ctx.restore();

    // curva
    ctx.strokeStyle = COL.loss; ctx.lineWidth = 2.2; ctx.beginPath();
    pts.forEach((p, i) => { const X = sx(p.pv), Y = sy(p.j); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();

    // punto actual + tangente (= gradiente que calcula backprop)
    const g = gradOf(key, v);
    const jc = lossOf(key, v);
    const cxp = sx(v), cyp = sy(jc);
    // tangente
    const dv = 0.9;
    const yScale = (jMax * 1.05) > 0 ? plh / (jMax * 1.05) : 0;
    const xScale = plw / (pMax - pMin);
    ctx.strokeStyle = '#FC6255'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cxp - dv * xScale, cyp + g * dv * yScale);
    ctx.lineTo(cxp + dv * xScale, cyp - g * dv * yScale);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(cxp, cyp, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#E48BB0'; ctx.fill(); ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5; ctx.stroke();

    // ================= panel de lectura =================
    const rx = 560, ry = 285;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('Lectura', rx, ry);
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#E48BB0'; ctx.fillText('parámetro  ' + key + ' = ' + v.toFixed(2), rx, ry + 26);
    ctx.fillStyle = COL.out; ctx.fillText('predicción ŷ = ' + st.yhat.toFixed(4), rx, ry + 48);
    ctx.fillStyle = COL.loss; ctx.fillText('costo      J = ' + st.loss.toFixed(4), rx, ry + 70);
    ctx.fillStyle = '#FC6255'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('pendiente ∂J/∂' + key + ' ≈ ' + g.toFixed(3), rx, ry + 96);
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('↑ esto es lo que backprop calcula', rx, ry + 114);
    ctx.fillText('  (la pendiente de la curva roja)', rx, ry + 130);
  }

  function animate() {
    const t = (performance.now() - t0) / 650;
    draw(Math.min(t, 1));
    if (t < 1.05) raf = requestAnimationFrame(animate); else { raf = null; draw(1); }
  }
  function trigger() {
    if (raf) cancelAnimationFrame(raf);
    t0 = performance.now(); animate();
  }

  // al cambiar de parámetro, reposiciona el slider a su valor actual
  if (sel) sel.addEventListener('change', () => {
    if (slider) slider.value = P[sel.value];
    trigger();
  });
  if (slider) slider.addEventListener('input', trigger);

  draw(1);
}
