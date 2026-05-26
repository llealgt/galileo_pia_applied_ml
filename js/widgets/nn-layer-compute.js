// ============================================================
// Layer Compute Widget — cálculo de una capa, neurona por neurona
// El usuario avanza con un botón: cada neurona revela sus parámetros,
// el pre-activación z = w·entrada + b, y la activación a = g(z).
// Al terminar, las activaciones se agrupan en el vector a^[l]
// (o, en la capa de salida, queda un escalar).
// ============================================================

function buildNNLayerCompute(canvasId, nextBtnId, resetBtnId, stepLblId, cfg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nextBtn = document.getElementById(nextBtnId);
  const resetBtn = document.getElementById(resetBtnId);
  const stepLbl = document.getElementById(stepLblId);

  const sig = z => 1 / (1 + Math.exp(-z));
  const N = cfg.neurons.length;
  const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = '⁽' + String(cfg.layer).split('').map(d => SUPS[d]).join('') + '⁾'; // superíndice de capa
  const supLayer = sup;
  // posiciones verticales de las neuronas (repartidas uniformemente)
  const ny = [];
  if (N === 1) ny.push(H / 2);
  else { const top = 130, bot = 350; for (let i = 0; i < N; i++) ny.push(top + i * (bot - top) / (N - 1)); }
  const NX = 250;                              // x del centro de las neuronas
  const colN = '#58C4DD', colOut = '#FF40FF', colIn = '#FF862F', colDim = '#a8a290';
  const neuronColor = cfg.scalar ? colOut : colN;

  let step = 0;                 // 0..N+1
  const TOTAL = N + 1;
  let animT0 = 0, animing = false, rafId = null;
  const FADE = 420;

  function dot(x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }

  function drawInputVector(cx, cy, vals, label, color) {
    const lh = 22, h = vals.length * lh + 14;
    const top = cy - h / 2;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    // corchetes
    ctx.beginPath();
    ctx.moveTo(cx - 26, top); ctx.lineTo(cx - 34, top); ctx.lineTo(cx - 34, top + h); ctx.lineTo(cx - 26, top + h);
    ctx.moveTo(cx + 26, top); ctx.lineTo(cx + 34, top); ctx.lineTo(cx + 34, top + h); ctx.lineTo(cx + 26, top + h);
    ctx.stroke();
    ctx.fillStyle = '#ece6d0'; ctx.font = '14px Fira Code, monospace'; ctx.textAlign = 'center';
    vals.forEach((v, i) => ctx.fillText(v, cx, top + 20 + i * lh));
    ctx.fillStyle = color; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillText(label, cx, top - 10);
  }

  function draw(now) {
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 130);
    const newAlpha = animing ? Math.max(0, Math.min(1, (now - animT0) / FADE)) : 1;
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // título / función de activación
    ctx.textAlign = 'left'; ctx.fillStyle = colDim; ctx.font = 'italic 12px Fira Code, monospace';
    ctx.fillText('g(z) = 1 / (1 + e⁻ᶻ)', W - 230, 26);
    ctx.textAlign = 'center'; ctx.fillStyle = neuronColor; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillText(cfg.title, W / 2, 24);

    // vector de entrada (izquierda)
    drawInputVector(70, H / 2, cfg.inputs, cfg.inputLabel, colIn);
    // flecha entrada -> capa
    ctx.strokeStyle = colIn; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(110, H / 2); ctx.lineTo(NX - 40, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(NX - 40, H / 2); ctx.lineTo(NX - 48, H / 2 - 5); ctx.lineTo(NX - 48, H / 2 + 5); ctx.closePath();
    ctx.fillStyle = colIn; ctx.fill();

    // neuronas + cálculos
    const shownN = Math.min(step, N);
    for (let k = 0; k < N; k++) {
      const y = ny[k];
      const revealed = k < shownN;
      const justBorn = (k === shownN - 1) && animing;
      const a = revealed ? (justBorn ? newAlpha : 1) : 0.18;
      ctx.globalAlpha = a;

      // círculo de la neurona
      dot(NX, y, 26, revealed ? (cfg.scalar ? 'rgba(255,64,255,0.28)' : 'rgba(88,196,221,0.28)') : 'rgba(168,162,144,0.08)',
        revealed ? (justBorn ? '#FFFF00' : neuronColor) : colDim, justBorn ? 1.5 + 2 * pulse : 2.5);
      // etiqueta de parámetros del neurona
      ctx.fillStyle = revealed ? '#9A72AC' : colDim; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
      ctx.fillText('w⃗' + cfg.neurons[k].sub + sup, NX, y - 34);
      ctx.fillText('b' + cfg.neurons[k].sub + sup, NX, y + 42);

      if (revealed) {
        const n = cfg.neurons[k];
        const av = sig(n.z);
        const fx = NX + 42;
        // fórmula principal
        ctx.textAlign = 'left'; ctx.fillStyle = '#ece6d0'; ctx.font = '14px Fira Code, monospace';
        ctx.fillText('a' + n.sub + sup + ' = g( w⃗' + n.sub + sup + '·' + cfg.inputLabel + ' + b' + n.sub + sup + ' )', fx, y - 6);
        // z y resultado
        ctx.font = '12px Fira Code, monospace'; ctx.fillStyle = '#5CD0B3';
        ctx.fillText('z' + n.sub + ' = ' + n.z.toFixed(2), fx, y + 16);
        ctx.fillStyle = colDim; ctx.fillText('→', fx + 110, y + 16);
        ctx.fillStyle = neuronColor; ctx.font = 'bold 13px Fira Code, monospace';
        ctx.fillText('a' + n.sub + sup + ' = g(' + n.z.toFixed(2) + ') = ' + av.toFixed(2), fx + 134, y + 16);
      }
      ctx.globalAlpha = 1;
    }

    // ---- panel derecho: agrupar en vector / escalar ----
    const rx = W - 95;
    if (cfg.scalar) {
      // capa de salida: un único escalar
      if (step >= 1) {
        const av = sig(cfg.neurons[0].z);
        const grouped = step >= TOTAL;
        ctx.textAlign = 'center';
        ctx.fillStyle = grouped ? '#FFFF00' : colOut; ctx.font = 'bold 22px Fira Code, monospace';
        ctx.fillText(av.toFixed(2), rx, H / 2 + 4);
        ctx.fillStyle = colOut; ctx.font = 'bold 13px Fira Code, monospace';
        ctx.fillText(cfg.outSym, rx, H / 2 - 30);
        ctx.fillStyle = colDim; ctx.font = 'italic 11px Fira Code, monospace';
        ctx.fillText('un escalar', rx, H / 2 + 30);
        if (grouped) { ctx.fillStyle = '#83C167'; ctx.fillText('(no es un vector)', rx, H / 2 + 46); }
      }
    } else {
      // capa oculta: vector de activaciones
      const lh = 30, h = N * lh + 14, top = H / 2 - h / 2;
      const grouped = step >= TOTAL;
      const anyShown = shownN > 0;
      if (anyShown) {
        ctx.strokeStyle = grouped ? '#FFFF00' : neuronColor; ctx.lineWidth = grouped ? 2.5 : 2;
        ctx.beginPath();
        ctx.moveTo(rx - 30, top); ctx.lineTo(rx - 40, top); ctx.lineTo(rx - 40, top + h); ctx.lineTo(rx - 30, top + h);
        ctx.moveTo(rx + 30, top); ctx.lineTo(rx + 40, top); ctx.lineTo(rx + 40, top + h); ctx.lineTo(rx + 30, top + h);
        ctx.stroke();
        ctx.font = '15px Fira Code, monospace'; ctx.textAlign = 'center';
        for (let k = 0; k < N; k++) {
          if (k < shownN) {
            ctx.fillStyle = grouped ? '#FFFF00' : '#ece6d0';
            ctx.fillText(sig(cfg.neurons[k].z).toFixed(2), rx, top + 24 + k * lh);
          } else {
            ctx.fillStyle = 'rgba(168,162,144,0.3)';
            ctx.fillText('·', rx, top + 24 + k * lh);
          }
        }
        ctx.fillStyle = grouped ? '#FFFF00' : neuronColor; ctx.font = 'bold 14px Fira Code, monospace';
        ctx.fillText(cfg.outSym, rx, top - 12);
        if (grouped) {
          ctx.fillStyle = '#83C167'; ctx.font = 'italic 11px Fira Code, monospace';
          ctx.fillText('vector de', rx, top + h + 18);
          ctx.fillText('activaciones', rx, top + h + 32);
        }
      }
      // flecha capa -> vector (cuando hay algo)
      if (anyShown) {
        ctx.strokeStyle = colDim; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(NX + 250, H / 2); ctx.lineTo(rx - 50, H / 2); ctx.stroke();
      }
    }

    // mensaje contextual (abajo)
    ctx.fillStyle = colDim; ctx.font = 'italic 11px Fira Code, monospace'; ctx.textAlign = 'left';
    let msg;
    if (step === 0) msg = 'Presiona "Siguiente neurona" para calcular la 1ª activación.';
    else if (step < N) msg = 'Cada neurona usa sus propios parámetros (w⃗, b). Sigue presionando.';
    else if (step === N) msg = cfg.scalar ? 'La capa de salida produce un único número.' : 'Todas las activaciones calculadas. Presiona para agruparlas en un vector.';
    else msg = cfg.scalar ? 'a' + supLayer + ' es un escalar: la predicción de la red.' : 'Las activaciones se agrupan en a' + supLayer + ', la entrada de la siguiente capa.';
    ctx.fillText(msg, 60, H - 14);
  }

  function animateIn() {
    animing = true; animT0 = performance.now();
    cancelAnimationFrame(rafId);
    const tick = (now) => {
      draw(now);
      if (now - animT0 < FADE + 200) rafId = requestAnimationFrame(tick);
      else { animing = false; draw(now); }
    };
    rafId = requestAnimationFrame(tick);
  }

  function updateLabel() { if (stepLbl) stepLbl.textContent = 'Paso ' + step + ' / ' + TOTAL; }
  function next() { if (step < TOTAL) { step++; updateLabel(); animateIn(); } }
  function reset() { cancelAnimationFrame(rafId); animing = false; step = 0; updateLabel(); draw(performance.now()); }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);
  updateLabel();
  draw(performance.now());
}

function initNNLayerComputeHidden() {
  buildNNLayerCompute('nn-lc-hidden-canvas', 'nlch-next-btn', 'nlch-reset-btn', 'nlch-step', {
    layer: 1,
    title: 'Capa 1 (oculta) — 3 neuronas',
    inputs: ['197', '184', '136', '214'],
    inputLabel: 'x⃗',
    outSym: 'a⁽¹⁾',
    scalar: false,
    neurons: [
      { sub: '₁', z: -0.85 },
      { sub: '₂', z: 0.85 },
      { sub: '₃', z: -1.39 }
    ]
  });
}

function initNNLayerComputeOutput() {
  buildNNLayerCompute('nn-lc-output-canvas', 'nlco-next-btn', 'nlco-reset-btn', 'nlco-step', {
    layer: 2,
    title: 'Capa 2 (salida) — 1 neurona',
    inputs: ['0.3', '0.7', '0.2'],
    inputLabel: 'a⁽¹⁾',
    outSym: 'a⁽²⁾',
    scalar: true,
    neurons: [
      { sub: '₁', z: 1.66 }
    ]
  });
}

// ---- Red más compleja (4 capas: x⃗ → 3 → 3 → 3 → 1) ----
// a⁽¹⁾=[0.60,0.45,0.75]  a⁽²⁾=[0.69,0.38,0.55]  a⁽³⁾=[0.77,0.50,0.31]  a⁽⁴⁾=0.82
function initNNComplexL1() {
  buildNNLayerCompute('nnc-l1-canvas', 'nnc-l1-next', 'nnc-l1-reset', 'nnc-l1-step', {
    layer: 1, title: 'Capa 1 — 3 neuronas', inputs: ['0.8', '1.5', '0.3'], inputLabel: 'x⃗',
    outSym: 'a⁽¹⁾', scalar: false,
    neurons: [{ sub: '₁', z: 0.4 }, { sub: '₂', z: -0.2 }, { sub: '₃', z: 1.1 }]
  });
}
function initNNComplexL2() {
  buildNNLayerCompute('nnc-l2-canvas', 'nnc-l2-next', 'nnc-l2-reset', 'nnc-l2-step', {
    layer: 2, title: 'Capa 2 — 3 neuronas', inputs: ['0.60', '0.45', '0.75'], inputLabel: 'a⁽¹⁾',
    outSym: 'a⁽²⁾', scalar: false,
    neurons: [{ sub: '₁', z: 0.8 }, { sub: '₂', z: -0.5 }, { sub: '₃', z: 0.2 }]
  });
}
function initNNComplexL3() {
  buildNNLayerCompute('nnc-l3-canvas', 'nnc-l3-next', 'nnc-l3-reset', 'nnc-l3-step', {
    layer: 3, title: 'Capa 3 — 3 neuronas', inputs: ['0.69', '0.38', '0.55'], inputLabel: 'a⁽²⁾',
    outSym: 'a⁽³⁾', scalar: false,
    neurons: [{ sub: '₁', z: 1.2 }, { sub: '₂', z: 0.0 }, { sub: '₃', z: -0.8 }]
  });
}
function initNNComplexL4() {
  buildNNLayerCompute('nnc-l4-canvas', 'nnc-l4-next', 'nnc-l4-reset', 'nnc-l4-step', {
    layer: 4, title: 'Capa 4 (salida) — 1 neurona', inputs: ['0.77', '0.50', '0.31'], inputLabel: 'a⁽³⁾',
    outSym: 'a⁽⁴⁾', scalar: true,
    neurons: [{ sub: '₁', z: 1.5 }]
  });
}
