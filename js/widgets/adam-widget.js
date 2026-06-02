// ============================================================
// Adam Widget — Gradient Descent (α fijo) vs Adam (adaptativo)
// Sobre un "bowl" cuadrático elongado J(w1,w2)=½(A·w1²+B·w2²), anima
// los dos caminos: GD zig-zaguea / es lento; Adam normaliza por dimensión
// y avanza más derecho y rápido al mínimo. Botón play/pausa.
// ============================================================

function initAdamWidget() {
  const canvas = document.getElementById('adam-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const playBtn = document.getElementById('adam-play-btn');

  // J(w) = 0.5*(A*w1^2 + B*w2^2); grad = [A*w1, B*w2]   (elongado: B>>A)
  const A = 1.0, B = 18.0;
  const grad = w => [A * w[0], B * w[1]];
  const start = [-2.6, 0.85];

  // mapeo de coordenadas
  const wx = [-3, 3], wy = [-1.2, 1.2];
  const pad = { l: 30, r: 14, t: 30, b: 14 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const px = w1 => pad.l + (w1 - wx[0]) / (wx[1] - wx[0]) * pw;
  const py = w2 => pad.t + (wy[1] - w2) / (wy[1] - wy[0]) * ph;

  // --- GD (α fijo) ---
  const alphaGD = 0.1;
  function gdStep(w) { const g = grad(w); return [w[0] - alphaGD * g[0], w[1] - alphaGD * g[1]]; }

  // --- Adam (simplificado) ---
  const aAdam = 0.18, b1 = 0.9, b2 = 0.999, eps = 1e-8;
  let m, v, t;
  function adamReset() { m = [0, 0]; v = [0, 0]; t = 0; }
  function adamStep(w) {
    t++; const g = grad(w); const out = [0, 0];
    for (let i = 0; i < 2; i++) {
      m[i] = b1 * m[i] + (1 - b1) * g[i];
      v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
      const mh = m[i] / (1 - Math.pow(b1, t)); const vh = v[i] / (1 - Math.pow(b2, t));
      out[i] = w[i] - aAdam * mh / (Math.sqrt(vh) + eps);
    }
    return out;
  }

  let gdPath, adamPath, step, running = true, rafId = null, lastT = 0;
  const MAX = 80, STEP_MS = 90;

  function reset() {
    gdPath = [start.slice()]; adamPath = [start.slice()]; step = 0; adamReset(); lastT = 0;
  }

  function drawContours() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    // elipses de nivel A*w1^2 + B*w2^2 = c
    ctx.lineWidth = 1;
    for (const c of [0.3, 1.2, 3, 6, 10, 16]) {
      ctx.strokeStyle = 'rgba(88,196,221,0.30)'; ctx.beginPath();
      const aR = Math.sqrt(2 * c / A), bR = Math.sqrt(2 * c / B);
      for (let th = 0; th <= Math.PI * 2 + 0.05; th += 0.06) {
        const x = px(aR * Math.cos(th)), y = py(bR * Math.sin(th));
        (th === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, x, y);
      }
      ctx.stroke();
    }
    // mínimo
    ctx.beginPath(); ctx.arc(px(0), py(0), 4, 0, Math.PI * 2); ctx.fillStyle = '#FFFF00'; ctx.fill();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('mínimo', px(0) + 7, py(0) - 6);
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('J(w₁,w₂) — valle elongado', W / 2, 18);
  }

  function drawPath(path, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    path.forEach((w, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, px(w[0]), py(w[1])));
    ctx.stroke();
    const last = path[path.length - 1];
    ctx.beginPath(); ctx.arc(px(last[0]), py(last[1]), 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }

  function render() {
    drawContours();
    drawPath(gdPath, '#FC6255');
    drawPath(adamPath, '#83C167');
    // leyenda
    ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = '#FC6255'; ctx.fillText('● Gradient descent (α fijo): zig-zag, lento', pad.l + 6, H - 24);
    ctx.fillStyle = '#83C167'; ctx.fillText('● Adam (α adaptativo por parámetro): directo, rápido', pad.l + 6, H - 8);
  }

  function frame(now) {
    if (!running) return;
    if (canvas.offsetParent === null) { rafId = requestAnimationFrame(frame); return; }
    if (now - lastT >= STEP_MS && step < MAX) {
      gdPath.push(gdStep(gdPath[gdPath.length - 1]));
      adamPath.push(adamStep(adamPath[adamPath.length - 1]));
      step++; lastT = now;
      if (step >= MAX) { setTimeout(() => { reset(); }, 900); }
    }
    render();
    rafId = requestAnimationFrame(frame);
  }

  function play() { if (!running) { running = true; lastT = 0; rafId = requestAnimationFrame(frame); } if (playBtn) playBtn.textContent = '⏸ Pausa'; }
  function pause() { running = false; if (rafId) cancelAnimationFrame(rafId); if (playBtn) playBtn.textContent = '▶ Reproducir'; }
  if (playBtn) playBtn.addEventListener('click', () => running ? pause() : play());

  reset(); running = true; rafId = requestAnimationFrame(frame);
}
