// ============================================================
// Layer Build Widget — "Una capa con varias neuronas" (paso a paso)
// El usuario avanza con un botón: primero entradas + salida; luego
// cada neurona oculta aparece UNA POR UNA al presionar "Siguiente".
// Cada neurona se conecta solo a ALGUNAS entradas (no siempre todas).
// ============================================================

function initNNLayerBuild() {
  const canvas = document.getElementById('nn-layer-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nextBtn = document.getElementById('nlb-next-btn');
  const resetBtn = document.getElementById('nlb-reset-btn');
  const stepLbl = document.getElementById('nlb-step');

  const inputs = [
    { name: 'price',     x: 150, y: 95 },
    { name: 'shipping',  x: 150, y: 175 },
    { name: 'marketing', x: 150, y: 255 },
    { name: 'material',  x: 150, y: 335 }
  ];
  // Conectividad PARCIAL: cada neurona usa solo algunas entradas
  const hidden = [
    { name: 'affordability',     x: 470, y: 130, ins: [0, 1] },   // price + shipping
    { name: 'awareness',         x: 470, y: 215, ins: [2] },      // marketing
    { name: 'perceived quality', x: 470, y: 300, ins: [0, 3] }    // price + material
  ];
  const out = { x: 810, y: 215, name: 'P(top seller)' };
  const N = hidden.length;

  let shown = 0;          // cuántas neuronas ocultas se muestran (0..N)
  let animT0 = 0, animing = false, rafId = null;
  const FADE = 420;       // ms de aparición de la nueva neurona

  function dot(x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }

  function draw(now) {
    const newAlpha = animing ? Math.max(0, Math.min(1, (now - animT0) / FADE)) : 1;
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 130);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // títulos de capa
    ctx.textAlign = 'center'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillStyle = '#FF862F'; ctx.fillText('input layer', 150, 45);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('hidden layer', 470, 45);
    ctx.fillStyle = '#FF40FF'; ctx.fillText('output layer', 810, 45);

    // neuronas mostradas (0..shown-1)
    for (let k = 0; k < shown; k++) {
      const nrn = hidden[k];
      const a = (k === shown - 1) ? newAlpha : 1;
      const justBorn = (k === shown - 1) && animing;
      ctx.globalAlpha = a;
      nrn.ins.forEach(ii => {
        const inp = inputs[ii];
        ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(inp.x + 9, inp.y); ctx.lineTo(nrn.x - 26, nrn.y); ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,64,255,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(nrn.x + 26, nrn.y); ctx.lineTo(out.x - 24, out.y); ctx.stroke();
      dot(nrn.x, nrn.y, 26, 'rgba(88,196,221,0.28)', justBorn ? '#FFFF00' : '#58C4DD', justBorn ? 1.5 + 2 * pulse : 2.5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#58C4DD'; ctx.font = '12px Fira Code, monospace'; ctx.textAlign = 'left';
      ctx.fillText(nrn.name, nrn.x + 34, nrn.y + 4);
    }

    // inputs (siempre)
    ctx.textAlign = 'right'; ctx.font = '13px Fira Code, monospace';
    inputs.forEach(inp => { ctx.fillStyle = '#FF862F'; ctx.fillText(inp.name, inp.x - 14, inp.y + 4); dot(inp.x, inp.y, 7, '#FF862F'); });

    // output (siempre)
    dot(out.x, out.y, 24, 'rgba(255,64,255,0.2)', '#FF40FF', 2.5);
    ctx.fillStyle = '#FF40FF'; ctx.font = '12px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(out.name, out.x, out.y + 48);

    if (shown >= N) {
      ctx.fillStyle = '#58C4DD'; ctx.font = 'italic 12px Fira Code, monospace'; ctx.textAlign = 'center';
      ctx.fillText('"activaciones"  a⁽¹⁾', 470, 360);
    }
    // mensaje contextual
    ctx.fillStyle = '#a8a290'; ctx.font = 'italic 11px Fira Code, monospace'; ctx.textAlign = 'left';
    const msg = shown === 0 ? 'Entradas y salida. Presiona "Siguiente paso" para agregar la 1ª neurona.'
              : (shown < N ? 'Cada neurona usa solo algunas entradas. Sigue presionando "Siguiente paso".'
                           : 'Capa oculta completa. Cada neurona usó solo algunas entradas (no todas).');
    ctx.fillText(msg, 60, H - 12);
  }

  function animateIn() {
    animing = true; animT0 = performance.now();
    cancelAnimationFrame(rafId);
    const tick = (now) => {
      draw(now);
      if (now - animT0 < FADE + 200) { rafId = requestAnimationFrame(tick); }
      else { animing = false; draw(now); }
    };
    rafId = requestAnimationFrame(tick);
  }

  function updateLabel() { if (stepLbl) stepLbl.textContent = 'Paso ' + shown + ' / ' + N; }
  function next() { if (shown < N) { shown++; updateLabel(); animateIn(); } }
  function reset() { cancelAnimationFrame(rafId); animing = false; shown = 0; updateLabel(); draw(performance.now()); }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);

  updateLabel();
  draw(performance.now());
}
