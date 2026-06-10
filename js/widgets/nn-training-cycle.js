// ============================================================
// NN Training Cycle Widget — Intuición de Backpropagation
// Animación del ciclo completo de entrenamiento sobre una red 3→4→1:
//   ① Forward (azul) → ② Loss (rojo) → ③ Backward / "Culpa" (amarillo) → ④ Update (verde)
// Valores precomputados con numpy (4 epochs); pred sube 0.38 → 0.64, cost
// baja 0.192 → 0.064. Refuerza la idea: cada neurona recibe una "cuota de
// culpa" del error total, propagada de la salida hacia la entrada.
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

  // Datos precomputados (red 3→4→1, x=[0.5,-0.3,0.8], y=1, α=1.5, 4 epochs)
  const EPOCHS_DATA = [
    { a1: [0.508, 0.433, 0.293, 0.486], a2: 0.380, err: -0.620, cost: 0.192, dz2: -0.146, dz1: [0.0259, -0.0079, 0.0192, 0.0361], W2: [-0.71, 0.22, -0.64, -0.99] },
    { a1: [0.489, 0.439, 0.281, 0.459], a2: 0.485, err: -0.515, cost: 0.133, dz2: -0.129, dz1: [0.0192, -0.0100, 0.0149, 0.0282], W2: [-0.60, 0.31, -0.57, -0.88] },
    { a1: [0.475, 0.446, 0.272, 0.438], a2: 0.575, err: -0.425, cost: 0.090, dz2: -0.104, dz1: [0.0130, -0.0103, 0.0106, 0.0203], W2: [-0.50, 0.40, -0.52, -0.79] },
    { a1: [0.465, 0.454, 0.266, 0.423], a2: 0.643, err: -0.357, cost: 0.064, dz2: -0.082, dz1: [0.0088, -0.0095, 0.0076, 0.0145], W2: [-0.43, 0.47, -0.47, -0.73] }
  ];
  const N_EPOCHS = EPOCHS_DATA.length;
  const INPUT = [0.5, -0.3, 0.8];
  const TARGET = 1.0;

  // Coordenadas de la red
  const inX = 130, hidX = 440, outX = 760;
  const inY = [110, 200, 290];
  const hidY = [70, 160, 240, 320];
  const outY = 200;
  const rIn = 22, rHid = 22, rOut = 26;

  // Estado
  let epoch = 0;
  let phase = 0;            // 0=idle, 1=forward, 2=loss, 3=backward, 4=update
  let phaseStart = 0;
  let animating = false;
  let rafId = null;
  const DURATION = { 1: 1500, 2: 1100, 3: 1800, 4: 1100 };

  const PHASE_NAMES = [
    'Inicio — presiona "Siguiente fase ▶"',
    '① Forward — calcular ŷ',
    '② Loss — medir el error',
    '③ Backward — propagar la "culpa"',
    '④ Update — ajustar los pesos'
  ];
  const NARRATIONS = [
    'Empezamos con pesos al azar; el modelo aún no sabe nada.',
    '<b style="color:#58C4DD;">Forward</b>: la señal fluye de la entrada a la salida; cada neurona calcula su activación.',
    'Comparamos ŷ con el verdadero <b>y=1</b>. La diferencia es el <b style="color:#FC6255;">error</b> que pagaremos.',
    '<b style="color:#FFFF00;">Backpropagation</b>: la <b>culpa</b> del error se reparte de la salida hacia la entrada. Cada neurona recibe una cuota proporcional a cuánto contribuyó.',
    'Cada peso se ajusta con su culpa: <i>w ← w − α · culpa(w)</i>. El error baja, ŷ se acerca a y.'
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(t) { return Math.max(0, Math.min(1, t)); }

  function drawNeuron(cx, cy, r, baseColor, fillAlpha, ringColor, ringWidth, label) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = baseColor.replace('ALPHA', fillAlpha); ctx.fill();
    ctx.strokeStyle = ringColor; ctx.lineWidth = ringWidth; ctx.stroke();
    if (label) {
      ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    }
  }

  function drawEdge(x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function draw(now) {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    const data = EPOCHS_DATA[Math.min(epoch, N_EPOCHS - 1)];
    const t = animating ? clamp01((now - phaseStart) / (DURATION[phase] || 1)) : 1;
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 130);

    // ====== Activación intensities por fase ======
    // forwardP: progreso del flujo forward (0..1) - 0..0.5 input→hidden, 0.5..1 hidden→out
    // backwardP: progreso del flujo backward (0..1) - 0..0.5 out→hidden, 0.5..1 hidden→input
    let forwardP = (phase >= 1) ? 1 : 0;
    if (phase === 1) forwardP = t;
    let backwardP = (phase >= 3) ? 1 : 0;
    if (phase === 3) backwardP = t;
    const lossP = (phase === 2) ? t : (phase >= 2 ? 1 : 0);
    const updateP = (phase === 4) ? t : 0;

    // ====== Aristas input→hidden ======
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        // Forward glow: solo cuando forwardP > 0.5 (segunda mitad) — no, queremos primer half
        const fGlow = clamp01(forwardP * 2);    // primer half del forward
        const bGlow = clamp01((backwardP - 0.5) * 2); // segunda half del backward
        let color, lw;
        if (bGlow > 0) {
          // backward iluminado amarillo
          color = 'rgba(255,255,0,' + (0.3 + 0.5 * bGlow) + ')';
          lw = 1 + 1.5 * bGlow;
        } else if (fGlow > 0) {
          color = 'rgba(88,196,221,' + (0.25 + 0.55 * fGlow) + ')';
          lw = 1 + 1.5 * fGlow;
        } else {
          color = 'rgba(168,162,144,0.22)'; lw = 1;
        }
        drawEdge(inX + rIn, inY[i], hidX - rHid, hidY[j], color, lw);
      }
    }
    // ====== Aristas hidden→output ======
    for (let j = 0; j < 4; j++) {
      const fGlow = clamp01((forwardP - 0.5) * 2);    // segunda half del forward
      const bGlow = clamp01(backwardP * 2);           // primer half del backward
      let color, lw;
      if (bGlow > 0) {
        color = 'rgba(255,255,0,' + (0.35 + 0.55 * bGlow) + ')';
        lw = 1.2 + 1.8 * bGlow;
      } else if (fGlow > 0) {
        color = 'rgba(88,196,221,' + (0.3 + 0.6 * fGlow) + ')';
        lw = 1.2 + 1.8 * fGlow;
      } else {
        color = 'rgba(255,64,255,0.32)'; lw = 1.2;
      }
      drawEdge(hidX + rHid, hidY[j], outX - rOut, outY, color, lw);
    }
    // pulso verde sobre TODAS las aristas durante update
    if (updateP > 0) {
      ctx.strokeStyle = 'rgba(131,193,103,' + (0.4 * (0.5 + 0.5 * pulse)) + ')';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
        ctx.beginPath(); ctx.moveTo(inX + rIn, inY[i]); ctx.lineTo(hidX - rHid, hidY[j]); ctx.stroke();
      }
      for (let j = 0; j < 4; j++) {
        ctx.beginPath(); ctx.moveTo(hidX + rHid, hidY[j]); ctx.lineTo(outX - rOut, outY); ctx.stroke();
      }
    }

    // ====== Nodos de entrada ======
    for (let i = 0; i < 3; i++) {
      const onF = phase >= 1 ? 1 : 0;
      drawNeuron(inX, inY[i], rIn, 'rgba(255,134,47,ALPHA)', 0.25 + 0.15 * onF,
                 '#FF862F', 2, INPUT[i].toFixed(1));
    }

    // ====== Nodos ocultos ======
    // intensity de "activación" durante forward (azul); intensity de "culpa" durante backward (rojo)
    for (let j = 0; j < 4; j++) {
      const a = data.a1[j];
      const blameMag = Math.abs(data.dz1[j]);
      const blameNorm = clamp01(blameMag / 0.04);  // normaliza a [0,1]
      // activación visual: cuando forward avanza a su segunda mitad las hidden están "encendidas"
      const actGlow = forwardP >= 0.5 ? Math.min(1, (forwardP - 0.5) * 2 + 0.3) : 0;
      const blameGlow = backwardP >= 0.5 ? Math.min(1, (backwardP - 0.5) * 2) : 0;
      // color base: azul para activación, rojo-amarillo para culpa
      let baseColor, ringColor, ringWidth;
      if (blameGlow > 0) {
        const r = 255, g = Math.round(255 - 165 * blameNorm), b = 0;
        baseColor = 'rgba(' + r + ',' + g + ',' + b + ',ALPHA)';
        ringColor = blameNorm > 0.5 ? '#FC6255' : '#FFFF00';
        ringWidth = 2 + blameNorm * 1.5;
      } else if (actGlow > 0) {
        baseColor = 'rgba(88,196,221,ALPHA)';
        ringColor = '#58C4DD'; ringWidth = 2.5;
      } else {
        baseColor = 'rgba(88,196,221,ALPHA)';
        ringColor = '#58C4DD'; ringWidth = 1.8;
      }
      const fillA = blameGlow > 0 ? (0.2 + 0.55 * blameNorm * blameGlow) :
                    actGlow > 0 ? (0.2 + 0.45 * actGlow) : 0.18;
      drawNeuron(hidX, hidY[j], rHid, baseColor, fillA, ringColor, ringWidth,
                 (forwardP >= 0.5 || backwardP > 0) ? a.toFixed(2) : '');
      // etiqueta de culpa al lado derecho durante backward
      if (backwardP >= 0.5) {
        ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 11px Fira Code, monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('culpa: ' + data.dz1[j].toFixed(3), hidX + rHid + 8, hidY[j]);
      }
    }

    // ====== Nodo de salida ======
    const outGlow = forwardP >= 1 ? 1 : (forwardP > 0.5 ? (forwardP - 0.5) * 2 : 0);
    const errPulse = (phase === 2) ? (0.6 + 0.4 * pulse) : (phase >= 2 ? 0.85 : 0);
    let outBase = 'rgba(255,64,255,ALPHA)', outRing = '#FF40FF', outW = 2.5;
    if (lossP > 0 && phase === 2) {
      outBase = 'rgba(252,98,85,ALPHA)'; outRing = '#FC6255'; outW = 3;
    }
    drawNeuron(outX, outY, rOut, outBase, 0.2 + 0.4 * outGlow,
               outRing, outW, forwardP > 0.5 ? data.a2.toFixed(2) : '');
    if (phase === 2 || phase === 3) {
      // aura roja pulsante del error
      ctx.beginPath(); ctx.arc(outX, outY, rOut + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(252,98,85,' + (0.4 * errPulse) + ')';
      ctx.lineWidth = 3; ctx.stroke();
    }
    // etiqueta de culpa del output durante backward
    if (backwardP > 0) {
      ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 11px Fira Code, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('culpa: ' + data.dz2.toFixed(3), outX + rOut + 8, outY + 20);
    }

    // ====== Etiquetas de capa (arriba) ======
    ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FF862F'; ctx.fillText('entradas x⃗', inX, 30);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('capa oculta (4)', hidX, 30);
    ctx.fillStyle = '#FF40FF'; ctx.fillText('salida ŷ', outX, 30);

    // ====== Panel derecho de info (epoch / pred / cost / target) ======
    const panelX = 850;
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('epoch ' + epoch + '/' + (N_EPOCHS - 1), panelX, 60);
    ctx.fillStyle = '#FF40FF'; ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('ŷ = ' + data.a2.toFixed(2), panelX, 90);
    ctx.fillStyle = '#83C167'; ctx.fillText('y = ' + TARGET.toFixed(1), panelX, 112);
    ctx.fillStyle = (phase >= 2 ? '#FC6255' : '#a8a290');
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('err = ' + data.err.toFixed(2), panelX, 142);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('cost = ' + data.cost.toFixed(3), panelX, 164);

    // ====== Mensaje narrativo abajo ======
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'left';
    const lbl = PHASE_NAMES[phase];
    ctx.fillText(lbl, 30, H - 14);

    // Flecha forward / backward indicador
    if (phase === 1 || phase === 3) {
      const arrowY = 360;
      ctx.strokeStyle = (phase === 1) ? '#58C4DD' : '#FFFF00';
      ctx.fillStyle = (phase === 1) ? '#58C4DD' : '#FFFF00';
      ctx.lineWidth = 2;
      const x1 = phase === 1 ? 200 : 700;
      const x2 = phase === 1 ? 700 : 200;
      ctx.beginPath(); ctx.moveTo(x1, arrowY); ctx.lineTo(x2, arrowY); ctx.stroke();
      const ax = x2;
      const dir = (x2 > x1) ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(ax + dir * 12, arrowY - 7);
      ctx.lineTo(ax, arrowY);
      ctx.lineTo(ax + dir * 12, arrowY + 7);
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
          // avance al siguiente epoch
          if (epoch < N_EPOCHS - 1) epoch++;
          phase = 0;
        }
      }
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  function updateLabels() {
    if (phaseLbl) phaseLbl.textContent = 'Epoch ' + epoch + ' · ' + PHASE_NAMES[phase];
    if (narration) narration.innerHTML = NARRATIONS[phase];
  }

  function next() {
    if (animating) return;
    if (phase < 4) phase++;
    else if (phase === 4) {
      // si está en update, avanzar al siguiente epoch y reiniciar a forward
      if (epoch < N_EPOCHS - 1) { epoch++; phase = 1; }
      else { return; } // no más epochs
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
