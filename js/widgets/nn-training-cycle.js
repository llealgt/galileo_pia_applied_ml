// ============================================================
// NN Training Cycle Widget — Intuición de Backpropagation
// Animación del ciclo completo de entrenamiento sobre una red 3→4→4→1:
//   ① Forward (azul) → ② Loss (rojo) → ③ Backward / "Culpa" (amarillo) → ④ Update (verde)
// Valores precomputados con numpy (4 epochs, dos capas ocultas); pred sube
// 0.476 → 0.710, cost baja 0.137 → 0.042. Refuerza la idea: la culpa del
// error se propaga de la salida hacia la entrada, capa por capa.
// ============================================================

function initNNTrainingCycle() {
  const canvas = document.getElementById('nn-training-cycle-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const nextBtn = document.getElementById('ntc-next-btn');
  const resetBtn = document.getElementById('ntc-reset-btn');
  const phaseLbl = document.getElementById('ntc-phase');
  const narration = document.getElementById('ntc-narration');

  // Datos precomputados (red 3→4→4→1, x=[0.5,-0.3,0.8], y=1, α=1.5, 4 epochs)
  //   a1 = activaciones capa oculta 1 (4) · a2 = activaciones capa oculta 2 (4)
  //   a3 = ŷ · dz3 = culpa salida · dz2 = culpa oculta 2 · dz1 = culpa oculta 1
  const EPOCHS_DATA = [
    { a1: [0.647, 0.566, 0.691, 0.552], a2: [0.383, 0.466, 0.769, 0.192], a3: 0.476, err: -0.524, cost: 0.137, dz3: -0.1306, dz2: [-0.0194, 0.0081, 0.0103, -0.0130], dz1: [0.0017, 0.0039, 0.0011, 0.0099] },
    { a1: [0.646, 0.563, 0.690, 0.545], a2: [0.403, 0.460, 0.761, 0.202], a3: 0.579, err: -0.421, cost: 0.088, dz3: -0.1025, dz2: [-0.0174, 0.0040, 0.0055, -0.0113], dz1: [0.0003, 0.0032, 0.0009, 0.0082] },
    { a1: [0.646, 0.561, 0.690, 0.539], a2: [0.420, 0.458, 0.756, 0.210], a3: 0.656, err: -0.344, cost: 0.059, dz3: -0.0775, dz2: [-0.0145, 0.0017, 0.0025, -0.0092], dz1: [-0.0004, 0.0024, 0.0007, 0.0065] },
    { a1: [0.646, 0.559, 0.689, 0.534], a2: [0.434, 0.457, 0.753, 0.218], a3: 0.710, err: -0.290, cost: 0.042, dz3: -0.0596, dz2: [-0.0119, 0.0005, 0.0010, -0.0075], dz1: [-0.0007, 0.0019, 0.0005, 0.0052] }
  ];
  const N_EPOCHS = EPOCHS_DATA.length;
  const INPUT = [0.5, -0.3, 0.8];
  const TARGET = 1.0;

  // Coordenadas de la red (4 columnas)
  const inX = 95, hid1X = 300, hid2X = 510, outX = 715;
  const inY = [120, 200, 280];
  const hid1Y = [70, 160, 240, 320];
  const hid2Y = [70, 160, 240, 320];
  const outY = 200;
  const rIn = 20, rHid = 20, rOut = 24;

  // Estado
  let epoch = 0;
  let phase = 0;            // 0=idle, 1=forward, 2=loss, 3=backward, 4=update
  let phaseStart = 0;
  let animating = false;
  let rafId = null;
  const DURATION = { 1: 1900, 2: 1100, 3: 2200, 4: 1100 };

  const PHASE_NAMES = [
    'Inicio — presiona "Siguiente fase ▶"',
    '① Forward — calcular ŷ',
    '② Loss — medir el error',
    '③ Backward — propagar la "culpa"',
    '④ Update — ajustar los pesos'
  ];
  const NARRATIONS = [
    'Empezamos con pesos al azar; el modelo aún no sabe nada.',
    '<b style="color:#58C4DD;">Forward</b>: la señal fluye de la entrada a la salida, capa por capa; cada neurona calcula su activación.',
    'Comparamos ŷ con el verdadero <b>y=1</b>. La diferencia es el <b style="color:#FC6255;">error</b> que pagaremos.',
    '<b style="color:#FFFF00;">Backpropagation</b>: la <b>culpa</b> del error se reparte de la salida hacia la entrada, atravesando <b>ambas capas ocultas</b>. Cada neurona recibe una cuota proporcional a cuánto contribuyó.',
    'Cada peso se ajusta con su culpa: <i>w ← w − α · culpa(w)</i>. El error baja, ŷ se acerca a y.'
  ];

  function clamp01(t) { return Math.max(0, Math.min(1, t)); }

  function drawNeuron(cx, cy, r, baseColor, fillAlpha, ringColor, ringWidth, label) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = baseColor.replace('ALPHA', fillAlpha); ctx.fill();
    ctx.strokeStyle = ringColor; ctx.lineWidth = ringWidth; ctx.stroke();
    if (label) {
      ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 11px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    }
  }

  // Dibuja todas las aristas entre dos capas con coloreado forward/backward/idle.
  function drawLayerEdges(sX, sY, sR, dX, dY, dR, fGlow, bGlow, idleColor) {
    for (let i = 0; i < sY.length; i++) {
      for (let j = 0; j < dY.length; j++) {
        let color, lw;
        if (bGlow > 0) {
          color = 'rgba(255,255,0,' + (0.3 + 0.55 * bGlow) + ')'; lw = 1 + 1.7 * bGlow;
        } else if (fGlow > 0) {
          color = 'rgba(88,196,221,' + (0.25 + 0.6 * fGlow) + ')'; lw = 1 + 1.7 * fGlow;
        } else {
          color = idleColor; lw = 1;
        }
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(sX + sR, sY[i]); ctx.lineTo(dX - dR, dY[j]); ctx.stroke();
      }
    }
  }

  function draw(now) {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    const data = EPOCHS_DATA[Math.min(epoch, N_EPOCHS - 1)];
    const t = animating ? clamp01((now - phaseStart) / (DURATION[phase] || 1)) : 1;
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 130);

    // forwardP / backwardP en [0,1]; el flujo cruza 3 tramos (1/3 cada uno).
    let forwardP = (phase >= 1) ? 1 : 0;
    if (phase === 1) forwardP = t;
    let backwardP = (phase >= 3) ? 1 : 0;
    if (phase === 3) backwardP = t;
    const updateP = (phase === 4) ? t : 0;

    // glow por tramo (forward = adelante; backward = al revés)
    const seg = (p, k) => clamp01((p - k / 3) * 3);           // progreso dentro del tramo k (0,1,2)
    const f_in_h1 = seg(forwardP, 0), f_h1_h2 = seg(forwardP, 1), f_h2_o = seg(forwardP, 2);
    const b_o_h2 = seg(backwardP, 0), b_h2_h1 = seg(backwardP, 1), b_h1_in = seg(backwardP, 2);

    // ====== Aristas ======
    drawLayerEdges(inX, inY, rIn, hid1X, hid1Y, rHid, f_in_h1, b_h1_in, 'rgba(168,162,144,0.20)');
    drawLayerEdges(hid1X, hid1Y, rHid, hid2X, hid2Y, rHid, f_h1_h2, b_h2_h1, 'rgba(168,162,144,0.20)');
    drawLayerEdges(hid2X, hid2Y, rHid, outX, [outY], rOut, f_h2_o, b_o_h2, 'rgba(255,64,255,0.28)');

    // pulso verde sobre TODAS las aristas durante update
    if (updateP > 0) {
      ctx.strokeStyle = 'rgba(131,193,103,' + (0.4 * (0.5 + 0.5 * pulse)) + ')';
      ctx.lineWidth = 2.2;
      const link = (sX, sY, sR, dX, dY, dR) => { for (const a of sY) for (const b of dY) { ctx.beginPath(); ctx.moveTo(sX + sR, a); ctx.lineTo(dX - dR, b); ctx.stroke(); } };
      link(inX, inY, rIn, hid1X, hid1Y, rHid);
      link(hid1X, hid1Y, rHid, hid2X, hid2Y, rHid);
      link(hid2X, hid2Y, rHid, outX, [outY], rOut);
    }

    // ====== Nodos de entrada ======
    for (let i = 0; i < 3; i++) {
      const onF = phase >= 1 ? 1 : 0;
      drawNeuron(inX, inY[i], rIn, 'rgba(255,134,47,ALPHA)', 0.25 + 0.15 * onF, '#FF862F', 2, INPUT[i].toFixed(1));
    }

    // ====== Helper para una capa oculta ======
    // actReady: forwardP umbral a partir del cual la capa está "activada"
    // blameReady: backwardP umbral a partir del cual la capa recibe culpa
    function drawHidden(xCol, yArr, acts, blames, actReady, blameReady) {
      for (let j = 0; j < yArr.length; j++) {
        const a = acts[j];
        const blameNorm = clamp01(Math.abs(blames[j]) / 0.02);
        const actGlow = forwardP >= actReady ? Math.min(1, (forwardP - actReady) * 3 + 0.3) : 0;
        const blameGlow = backwardP >= blameReady ? Math.min(1, (backwardP - blameReady) * 3) : 0;
        let baseColor, ringColor, ringWidth;
        if (blameGlow > 0) {
          const g = Math.round(255 - 165 * blameNorm);
          baseColor = 'rgba(255,' + g + ',0,ALPHA)';
          ringColor = blameNorm > 0.5 ? '#FC6255' : '#FFFF00';
          ringWidth = 2 + blameNorm * 1.5;
        } else {
          baseColor = 'rgba(88,196,221,ALPHA)'; ringColor = '#58C4DD'; ringWidth = actGlow > 0 ? 2.5 : 1.8;
        }
        const fillA = blameGlow > 0 ? (0.2 + 0.55 * blameNorm * blameGlow) : actGlow > 0 ? (0.2 + 0.45 * actGlow) : 0.18;
        const showVal = forwardP >= actReady || backwardP > 0;
        drawNeuron(xCol, yArr[j], rHid, baseColor, fillA, ringColor, ringWidth, showVal ? a.toFixed(2) : '');
        // etiqueta de culpa debajo del nodo durante backward
        if (backwardP >= blameReady) {
          ctx.fillStyle = '#FFFF00'; ctx.font = '9px Fira Code, monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(blames[j].toFixed(3), xCol, yArr[j] + rHid + 9);
        }
      }
    }
    // capa oculta 1: activa tras 1/3 forward; recibe culpa en el último tramo backward (>=2/3)
    drawHidden(hid1X, hid1Y, data.a1, data.dz1, 1 / 3, 2 / 3);
    // capa oculta 2: activa tras 2/3 forward; recibe culpa en el tramo medio backward (>=1/3)
    drawHidden(hid2X, hid2Y, data.a2, data.dz2, 2 / 3, 1 / 3);

    // ====== Nodo de salida ======
    const outGlow = forwardP >= 1 ? 1 : (forwardP > 2 / 3 ? (forwardP - 2 / 3) * 3 : 0);
    const errPulse = (phase === 2) ? (0.6 + 0.4 * pulse) : (phase >= 2 ? 0.85 : 0);
    let outBase = 'rgba(255,64,255,ALPHA)', outRing = '#FF40FF', outW = 2.5;
    if (phase === 2) { outBase = 'rgba(252,98,85,ALPHA)'; outRing = '#FC6255'; outW = 3; }
    drawNeuron(outX, outY, rOut, outBase, 0.2 + 0.4 * outGlow, outRing, outW, forwardP > 2 / 3 ? data.a3.toFixed(2) : '');
    if (phase === 2 || phase === 3) {
      ctx.beginPath(); ctx.arc(outX, outY, rOut + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(252,98,85,' + (0.4 * errPulse) + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    if (backwardP > 0) {
      ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 10px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('culpa: ' + data.dz3.toFixed(3), outX, outY + rOut + 14);
    }

    // ====== Etiquetas de capa (arriba) ======
    ctx.font = 'bold 11px Fira Code, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FF862F'; ctx.fillText('entradas x⃗', inX, 30);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('oculta 1 (4)', hid1X, 30);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('oculta 2 (4)', hid2X, 30);
    ctx.fillStyle = '#FF40FF'; ctx.fillText('salida ŷ', outX, 30);

    // ====== Panel derecho de info ======
    const panelX = 845;
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('epoch ' + epoch + '/' + (N_EPOCHS - 1), panelX, 60);
    ctx.fillStyle = '#FF40FF'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('ŷ = ' + data.a3.toFixed(2), panelX, 90);
    ctx.fillStyle = '#83C167'; ctx.fillText('y = ' + TARGET.toFixed(1), panelX, 112);
    ctx.fillStyle = (phase >= 2 ? '#FC6255' : '#a8a290'); ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('err = ' + data.err.toFixed(2), panelX, 142);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('cost = ' + data.cost.toFixed(3), panelX, 164);

    // ====== Mensaje narrativo abajo ======
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText(PHASE_NAMES[phase], 30, H - 12);

    // Flecha forward / backward
    if (phase === 1 || phase === 3) {
      const arrowY = 366;
      ctx.strokeStyle = (phase === 1) ? '#58C4DD' : '#FFFF00';
      ctx.fillStyle = (phase === 1) ? '#58C4DD' : '#FFFF00';
      ctx.lineWidth = 2;
      const x1 = phase === 1 ? 150 : 720;
      const x2 = phase === 1 ? 720 : 150;
      ctx.beginPath(); ctx.moveTo(x1, arrowY); ctx.lineTo(x2, arrowY); ctx.stroke();
      const dir = (x2 > x1) ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(x2 + dir * 12, arrowY - 7); ctx.lineTo(x2, arrowY); ctx.lineTo(x2 + dir * 12, arrowY + 7);
      ctx.closePath(); ctx.fill();
      ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'center';
      ctx.fillText(phase === 1 ? 'Forward' : 'Backward (culpa)', (x1 + x2) / 2, arrowY - 10);
    }
  }

  function tick(now) {
    if (canvas.offsetParent === null) { rafId = requestAnimationFrame(tick); return; }
    draw(now);
    if (animating) {
      const elapsed = now - phaseStart;
      const dur = DURATION[phase] || 1;
      if (elapsed >= dur) {
        animating = false;
        if (phase === 4) {
          if (epoch < N_EPOCHS - 1) epoch++;
          phase = 0;
        }
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function updateLabels() {
    if (phaseLbl) phaseLbl.textContent = 'Epoch ' + epoch + ' · ' + PHASE_NAMES[phase];
    if (narration) narration.innerHTML = NARRATIONS[phase];
  }

  function next() {
    if (animating) return;
    if (phase < 4) phase++;
    else if (phase === 4) {
      if (epoch < N_EPOCHS - 1) { epoch++; phase = 1; }
      else { return; }
    }
    phaseStart = performance.now();
    animating = true;
    updateLabels();
  }

  function reset() {
    epoch = 0; phase = 0; animating = false;
    updateLabels();
  }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (resetBtn) resetBtn.addEventListener('click', reset);

  updateLabels();
  rafId = requestAnimationFrame(tick);
}
