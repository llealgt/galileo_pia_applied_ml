// ============================================================
// Activation Gallery Widget — resumen visual de las funciones
// de activación más populares: Identidad, Sigmoid, Tanh, ReLU,
// Leaky ReLU y Softmax.
// Una galería de mini-gráficas. Un slider de z mueve el punto
// g(z) sobre cada curva escalar; un slider α controla la
// pendiente negativa de Leaky ReLU; Softmax se muestra como
// barras de probabilidad para el vector [z, 1.5, -1].
// ============================================================

function initActivationGallery() {
  const canvas = document.getElementById('activation-gallery-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const zSlider = document.getElementById('ag-z');
  const zVal = document.getElementById('ag-z-val');
  const aSlider = document.getElementById('ag-alpha');
  const aVal = document.getElementById('ag-alpha-val');

  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const tanh = z => Math.tanh(z);
  const relu = z => Math.max(0, z);
  const linear = z => z;

  const COL = {
    linear: '#FF862F', sigmoid: '#58C4DD', tanh: '#FFFF00',
    relu: '#83C167', leaky: '#9A72AC', softmax: '#E48BB0'
  };

  // Funciones escalares: cada panel define su propio rango.
  function scalarPanels(alpha) {
    return [
      { title: 'Identidad', formula: 'g(z) = z', range: '(−∞, ∞)',
        color: COL.linear, f: linear, zR: [-3, 3], yR: [-3, 3] },
      { title: 'Sigmoid', formula: 'g(z) = 1/(1+e⁻ᶻ)', range: '(0, 1)',
        color: COL.sigmoid, f: sigmoid, zR: [-6, 6], yR: [-0.15, 1.15] },
      { title: 'Tanh', formula: 'g(z) = tanh(z)', range: '(−1, 1)',
        color: COL.tanh, f: tanh, zR: [-4, 4], yR: [-1.2, 1.2] },
      { title: 'ReLU', formula: 'g(z) = max(0, z)', range: '[0, ∞)',
        color: COL.relu, f: relu, zR: [-3, 3], yR: [-0.6, 3] },
      { title: 'Leaky ReLU', formula: 'g(z) = max(αz, z)', range: '(−∞, ∞)',
        color: COL.leaky, f: z => (z >= 0 ? z : alpha * z), zR: [-3, 3], yR: [-1.2, 3] }
    ];
  }

  // Layout: 3 columnas x 2 filas (6 celdas; la última es softmax).
  const COLS = 3, ROWS = 2;
  const m = 8;
  const cellW = (W - (COLS + 1) * m) / COLS;
  const cellH = (H - (ROWS + 1) * m) / ROWS;

  function cellOrigin(i) {
    const col = i % COLS, row = Math.floor(i / COLS);
    return { x: m + col * (cellW + m), y: m + row * (cellH + m) };
  }

  function drawScalarPanel(ox, oy, p, z0) {
    // marco
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.strokeStyle = 'rgba(168,162,144,0.22)'; ctx.lineWidth = 1;
    roundRect(ox, oy, cellW, cellH, 8); ctx.fill(); ctx.stroke();

    // título + fórmula
    ctx.textAlign = 'left';
    ctx.fillStyle = p.color; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText(p.title, ox + 10, oy + 17);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText(p.formula, ox + 10, oy + 31);

    // área de plot dentro de la celda
    const pad = { l: 26, r: 12, t: 38, b: 14 };
    const plx = ox + pad.l, ply = oy + pad.t;
    const plw = cellW - pad.l - pad.r, plh = cellH - pad.t - pad.b;
    const [zMin, zMax] = p.zR, [yMin, yMax] = p.yR;
    const px = z => plx + (z - zMin) / (zMax - zMin) * plw;
    const py = y => ply + plh - (y - yMin) / (yMax - yMin) * plh;

    // ejes (x=0, y=0 si caen en rango)
    ctx.strokeStyle = 'rgba(168,162,144,0.30)'; ctx.lineWidth = 1;
    if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(plx, py(0)); ctx.lineTo(plx + plw, py(0)); ctx.stroke(); }
    if (zMin <= 0 && zMax >= 0) { ctx.beginPath(); ctx.moveTo(px(0), ply); ctx.lineTo(px(0), ply + plh); ctx.stroke(); }

    // curva
    ctx.strokeStyle = p.color; ctx.lineWidth = 2.4; ctx.beginPath();
    let started = false;
    for (let i = 0; i <= plw; i += 2) {
      const z = zMin + i / plw * (zMax - zMin);
      const yv = p.f(z);
      const Y = Math.max(ply, Math.min(ply + plh, py(yv)));
      if (!started) { ctx.moveTo(px(z), Y); started = true; } else { ctx.lineTo(px(z), Y); }
    }
    ctx.stroke();

    // punto g(z0)
    const z0c = Math.max(zMin, Math.min(zMax, z0));
    const yc = p.f(z0c);
    // línea guía vertical en z0
    if (z0c >= zMin && z0c <= zMax) {
      ctx.strokeStyle = 'rgba(255,255,0,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px(z0c), ply); ctx.lineTo(px(z0c), ply + plh); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (yc >= yMin && yc <= yMax) {
      ctx.beginPath(); ctx.arc(px(z0c), py(yc), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.4; ctx.stroke();
    }

    // valor g(z0) y rango
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 10px Fira Code, monospace';
    ctx.fillText('g(z)=' + yc.toFixed(2), ox + cellW - 10, oy + 17);
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.fillText('rango ' + p.range, ox + cellW - 10, oy + cellH - 6);
  }

  function drawSoftmaxPanel(ox, oy, z0) {
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.strokeStyle = 'rgba(168,162,144,0.22)'; ctx.lineWidth = 1;
    roundRect(ox, oy, cellW, cellH, 8); ctx.fill(); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = COL.softmax; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('Softmax', ox + 10, oy + 17);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('eᶻⁱ / Σ eᶻʲ', ox + 10, oy + 31);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.fillText('vector → Σ=1', ox + cellW - 10, oy + 17);

    // vector de logits: el primero es z0; los otros fijos
    const logits = [z0, 1.5, -1.0];
    const mx = Math.max(...logits);
    const exps = logits.map(z => Math.exp(z - mx));
    const sum = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sum);
    const labels = ['z₁=' + z0.toFixed(1), 'z₂=1.5', 'z₃=−1.0'];
    const barCols = [COL.softmax, '#58C4DD', '#83C167'];

    const pad = { l: 14, r: 14, t: 42, b: 22 };
    const plx = ox + pad.l, ply = oy + pad.t;
    const plw = cellW - pad.l - pad.r, plh = cellH - pad.t - pad.b;
    const n = probs.length;
    const gap = 14;
    const bw = (plw - gap * (n - 1)) / n;
    // base line
    ctx.strokeStyle = 'rgba(168,162,144,0.30)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plx, ply + plh); ctx.lineTo(plx + plw, ply + plh); ctx.stroke();

    for (let i = 0; i < n; i++) {
      const bx = plx + i * (bw + gap);
      const bh = probs[i] * plh;
      ctx.fillStyle = barCols[i];
      roundRect(bx, ply + plh - bh, bw, bh, 4); ctx.fill();
      // probabilidad
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillText(probs[i].toFixed(2), bx + bw / 2, ply + plh - bh - 4);
      // etiqueta logit
      ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
      ctx.fillText(labels[i], bx + bw / 2, ply + plh + 14);
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    const z0 = zSlider ? parseFloat(zSlider.value) : 1.0;
    const alpha = aSlider ? parseFloat(aSlider.value) : 0.1;
    if (zVal) zVal.textContent = z0.toFixed(1);
    if (aVal) aVal.textContent = alpha.toFixed(2);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    const panels = scalarPanels(alpha);
    panels.forEach((p, i) => {
      const o = cellOrigin(i);
      drawScalarPanel(o.x, o.y, p, z0);
    });
    const o = cellOrigin(5);
    drawSoftmaxPanel(o.x, o.y, z0);
  }

  if (zSlider) zSlider.addEventListener('input', draw);
  if (aSlider) aSlider.addEventListener('input', draw);
  draw();
}
