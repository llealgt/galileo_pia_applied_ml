// ============================================================
// NN NumPy Stepwise Widget — forward prop nodo por nodo
// Muestra una red 4 → 3 → 1 (referencia visual a lo Andrew Ng,
// con cajas de capa y labels w_j^[l], b_j^[l] en cada neurona)
// y, al lado, los bloques de código numpy correspondientes.
// El botón "Siguiente" resalta una neurona a la vez y su código.
// ============================================================

function initNNNumpyStepwise() {
  const canvas = document.getElementById('nn-numpy-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nextBtn = document.getElementById('nns-next-btn');
  const resetBtn = document.getElementById('nns-reset-btn');
  const stepLbl = document.getElementById('nns-step');

  // Bloques de código asociados
  const codeEls = ['nns-code-1', 'nns-code-2', 'nns-code-3', 'nns-code-out']
    .map(id => document.getElementById(id));
  const a1El = document.getElementById('nns-a1');
  const introEl = document.getElementById('nns-intro');

  let step = 0;
  const TOTAL = 5;

  // -------- coordenadas de la red --------
  const arrInX1 = 55, arrInX2 = 105;
  const box1X = 130, box1Y = 25, box1W = 160, box1H = H - 50;
  const cx1 = box1X + box1W / 2;
  const neuronYs = [box1Y + 38, box1Y + box1H / 2, box1Y + box1H - 38];
  const arrA1X1 = box1X + box1W;
  const arrA1X2 = arrA1X1 + 70;
  const box2X = arrA1X2 + 10;
  const box2W = 100;
  const box2Y = H / 2 - 40;
  const box2H = 80;
  const cxOut = box2X + box2W / 2;
  const cyOut = box2Y + box2H / 2;
  const arrA2X1 = box2X + box2W;
  const arrA2X2 = arrA2X1 + 70;

  function sub(n) {
    return String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
  }

  function rrect(x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); }
    else { ctx.strokeRect(x, y, w, h); }
  }

  function drawArrow(x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 12, y2); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2 - 12, y2 - 6); ctx.lineTo(x2, y2); ctx.lineTo(x2 - 12, y2 + 6);
    ctx.closePath(); ctx.fill();
  }

  function drawNeuron(cx, cy, r, isActive, baseColor) {
    // Aura de resaltado
    if (isActive) {
      ctx.beginPath(); ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,0,0.25)'; ctx.fill();
    }
    // Círculo
    const rgb = baseColor === '#FF40FF' ? '255,64,255' : '88,196,221';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb},${isActive ? 0.45 : 0.18})`; ctx.fill();
    ctx.strokeStyle = isActive ? '#FFFF00' : baseColor;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // Entrada x⃗
    ctx.fillStyle = '#FF862F'; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.textAlign = 'right'; ctx.fillText('x⃗', arrInX1 - 5, H / 2 + 5);
    drawArrow(arrInX1, H / 2, arrInX2, H / 2, '#FF862F', 2.5);

    // Caja 1 (capa oculta)
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 2;
    rrect(box1X, box1Y, box1W, box1H, 12);

    // 3 neuronas ocultas con label w⃗ⱼ⁽¹⁾, bⱼ⁽¹⁾
    for (let j = 0; j < 3; j++) {
      const isActive = (step === j + 1);
      drawNeuron(cx1, neuronYs[j], 20, isActive, '#58C4DD');
      ctx.fillStyle = isActive ? '#FFFF00' : '#58C4DD';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('w⃗' + sub(j + 1) + '⁽¹⁾', cx1, neuronYs[j] - 3);
      ctx.fillText('b' + sub(j + 1) + '⁽¹⁾', cx1, neuronYs[j] + 10);
    }

    // Flecha a⁽¹⁾
    const a1Highlight = (step === 4);
    drawArrow(arrA1X1, H / 2, arrA1X2, H / 2,
      a1Highlight ? '#FFFF00' : '#a8a290', a1Highlight ? 2.6 : 2);
    ctx.fillStyle = a1Highlight ? '#FFFF00' : '#58C4DD';
    ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('a⁽¹⁾', (arrA1X1 + arrA1X2) / 2, H / 2 - 10);

    // Caja 2 (salida)
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 2;
    rrect(box2X, box2Y, box2W, box2H, 10);

    // Neurona de salida
    const outActive = (step === 5);
    drawNeuron(cxOut, cyOut, 20, outActive, '#FF40FF');
    ctx.fillStyle = outActive ? '#FFFF00' : '#FF40FF';
    ctx.font = 'bold 9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('w⃗₁⁽²⁾', cxOut, cyOut - 3);
    ctx.fillText('b₁⁽²⁾', cxOut, cyOut + 10);

    // Flecha a⁽²⁾
    drawArrow(arrA2X1, H / 2, arrA2X2, H / 2,
      outActive ? '#FFFF00' : '#FF40FF', outActive ? 2.6 : 2);
    ctx.fillStyle = outActive ? '#FFFF00' : '#FF40FF';
    ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('a⁽²⁾', (arrA2X1 + arrA2X2) / 2, H / 2 - 10);

    // x = np.array(...) abajo
    ctx.fillStyle = '#ece6d0';
    ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('x = np.array([197, 184, 136, 214])', box1X - 8, H - 8);
  }

  function highlight(el, on, color) {
    if (!el) return;
    el.style.opacity = on ? '1' : '0.28';
    el.style.boxShadow = on ? `0 0 14px ${color || 'rgba(255,255,0,0.6)'}` : 'none';
    el.style.borderColor = on ? '#FFFF00' : 'transparent';
    el.style.transition = 'opacity 0.25s, box-shadow 0.25s';
  }

  function updateCodeBlocks() {
    for (let i = 0; i < 3; i++) highlight(codeEls[i], step === i + 1);
    highlight(codeEls[3], step === 5);
    if (a1El) highlight(a1El, step >= 4);
    if (introEl) introEl.style.opacity = step >= 1 ? '0.55' : '1';
  }

  function updateLabel() {
    if (!stepLbl) return;
    const L = [
      'Paso 0 / ' + TOTAL + ' — presiona "Siguiente"',
      'Paso 1 / ' + TOTAL + ' — Capa 1 · neurona 1',
      'Paso 2 / ' + TOTAL + ' — Capa 1 · neurona 2',
      'Paso 3 / ' + TOTAL + ' — Capa 1 · neurona 3',
      'Paso 4 / ' + TOTAL + ' — vector a⁽¹⁾',
      'Paso 5 / ' + TOTAL + ' — Capa 2 (salida)'
    ];
    stepLbl.textContent = L[step];
  }

  function next() { if (step < TOTAL) { step++; updateLabel(); updateCodeBlocks(); draw(); } }
  function reset() { step = 0; updateLabel(); updateCodeBlocks(); draw(); }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);

  updateLabel(); updateCodeBlocks(); draw();
}
