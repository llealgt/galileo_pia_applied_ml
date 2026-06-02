// ============================================================
// Linear Collapse Widget — ¿por qué necesitamos funciones de activación?
// Una red 1→(capa oculta de k unidades)→1 intenta ajustar una curva.
// Con activación LINEAL, la red colapsa a una RECTA (= regresión lineal),
// no importa cuántas unidades. Con ReLU, puede doblarse (piecewise-linear)
// y ajustar la curva. Toggle lineal/ReLU + slider de unidades.
// ============================================================

function initLinearCollapse() {
  const canvas = document.getElementById('linear-collapse-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const reluChk = document.getElementById('lc-relu');     // checked = ReLU, else lineal
  const unitsSld = document.getElementById('lc-units');    // nº de unidades ocultas (ReLU)
  const unitsVal = document.getElementById('lc-units-val');
  const note = document.getElementById('lc-note');

  // dominio y función objetivo (una curva no lineal)
  const xMin = 0, xMax = 6, yMin = -0.2, yMax = 2.4;
  const target = x => 1.2 + Math.sin(x - 1) * 0.9;   // curva suave

  const pad = { l: 44, r: 16, t: 16, b: 32 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const px = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
  const py = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;

  function draw() {
    const useRelu = reluChk ? reluChk.checked : true;
    const k = unitsSld ? parseInt(unitsSld.value) : 4;
    if (unitsVal) unitsVal.textContent = k;
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // ejes
    ctx.strokeStyle = 'rgba(168,162,144,0.2)'; ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x += 1) { ctx.beginPath(); ctx.moveTo(px(x), pad.t); ctx.lineTo(px(x), pad.t + ph); ctx.stroke(); }
    ctx.strokeStyle = '#a8a290'; ctx.beginPath(); ctx.moveTo(pad.l, py(0)); ctx.lineTo(pad.l + pw, py(0)); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x', pad.l + pw - 6, py(0) + 16);

    // curva objetivo (puntos tenues)
    ctx.strokeStyle = 'rgba(168,162,144,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath();
    for (let i = 0; i <= pw; i += 3) { const x = xMin + i / pw * (xMax - xMin); (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, px(x), py(target(x))); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#a8a290'; ctx.textAlign = 'left'; ctx.font = 'italic 11px Fira Code, monospace';
    ctx.fillText('objetivo', px(xMax) - 64, py(target(xMax)) - 8);

    if (!useRelu) {
      // LINEAL: ajuste por mínimos cuadrados (una recta) sobre la curva objetivo
      const N = 100; let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (let i = 0; i <= N; i++) { const x = xMin + i / N * (xMax - xMin); const y = target(x); sx += x; sy += y; sxx += x * x; sxy += x * y; }
      const n = N + 1; const m = (n * sxy - sx * sy) / (n * sxx - sx * sx); const b = (sy - m * sx) / n;
      ctx.strokeStyle = '#FF862F'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(px(xMin), py(m * xMin + b)); ctx.lineTo(px(xMax), py(m * xMax + b)); ctx.stroke();
      ctx.fillStyle = '#FF862F'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
      ctx.fillText('todo lineal → una RECTA', pad.l + 8, pad.t + 16);
      ctx.fillStyle = '#FC6255'; ctx.fillText('= regresión lineal (no importa cuántas capas)', pad.l + 8, pad.t + 34);
    } else {
      // ReLU: interpolación lineal por tramos en k+1 nudos (expresable como suma de ReLUs)
      ctx.strokeStyle = '#83C167'; ctx.lineWidth = 3; ctx.beginPath();
      for (let j = 0; j <= k; j++) {
        const x = xMin + j / k * (xMax - xMin); const y = target(x);
        (j === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, px(x), py(y));
      }
      ctx.stroke();
      // nudos
      for (let j = 0; j <= k; j++) { const x = xMin + j / k * (xMax - xMin); ctx.beginPath(); ctx.arc(px(x), py(target(x)), 3.5, 0, Math.PI * 2); ctx.fillStyle = '#83C167'; ctx.fill(); }
      ctx.fillStyle = '#83C167'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
      ctx.fillText('ReLU → curva quebrada (' + k + ' unidades)', pad.l + 8, pad.t + 16);
      ctx.fillStyle = '#FFFF00'; ctx.fillText('puede doblarse para ajustar lo no-lineal', pad.l + 8, pad.t + 34);
    }

    if (note) note.textContent = useRelu
      ? 'Con ReLU en las capas ocultas la red modela funciones no lineales (más unidades → mejor ajuste).'
      : 'Con activación lineal en todas las capas, la red entera es equivalente a una sola recta: regresión lineal.';
  }

  if (reluChk) reluChk.addEventListener('change', draw);
  if (unitsSld) unitsSld.addEventListener('input', draw);
  draw();
}
