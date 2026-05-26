// ============================================================
// Coffee Roasting Forward Pass Widget (2-3-1)
// Red neuronal real (pesos entrenados offline). Sliders temperatura
// y duración → calcula a^[1] (3 activaciones ocultas) y a^[2] (prob).
// Muestra la región de decisión 2D y el valor de cada neurona.
// ============================================================

function initNNCoffeeForward() {
  const canvas = document.getElementById('nn-coffee-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Pesos entrenados (net 2-3-1 sigmoide) + normalización de entrada
  const MU = [221.893, 13.45], SD = [41.9, 1.478];
  const W1 = [[-0.834, -3.41, -3.401], [-3.889, 2.958, -0.915]];
  const b1 = [-3.555, -3.22, 2.449];
  const W2 = [-15.736, -13.021, 15.201];
  const b2 = -4.634;
  const sig = z => 1 / (1 + Math.exp(-z));

  function forward(temp, dur) {
    const xn = [(temp - MU[0]) / SD[0], (dur - MU[1]) / SD[1]];
    const a1 = [0, 1, 2].map(j => sig(xn[0] * W1[0][j] + xn[1] * W1[1][j] + b1[j]));
    const z2 = a1[0] * W2[0] + a1[1] * W2[1] + a1[2] * W2[2] + b2;
    return { a1, a2: sig(z2) };
  }

  const tMin = 150, tMax = 295, dMin = 11, dMax = 16;
  const sT = document.getElementById('nc-temp'), sD = document.getElementById('nc-dur');
  const lT = document.getElementById('nc-temp-val'), lD = document.getElementById('nc-dur-val');

  // panel izquierdo (región)
  const pad = { l: 50, t: 28, b: 38 }, pw = 380, ph = H - pad.t - pad.b;
  const tx = v => pad.l + (v - tMin) / (tMax - tMin) * pw;
  const ty = v => pad.t + ph - (v - dMin) / (dMax - dMin) * ph;

  function draw() {
    const temp = parseFloat(sT.value), dur = parseFloat(sD.value);
    if (lT) lT.textContent = temp.toFixed(0);
    if (lD) lD.textContent = dur.toFixed(1);
    const { a1, a2 } = forward(temp, dur);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // región de decisión (pixelada)
    const step = 5;
    for (let px = pad.l; px < pad.l + pw; px += step) {
      for (let py = pad.t; py < pad.t + ph; py += step) {
        const tt = tMin + (px - pad.l) / pw * (tMax - tMin);
        const dd = dMax - (py - pad.t) / ph * (dMax - dMin);
        const p = forward(tt, dd).a2;
        ctx.fillStyle = p >= 0.5 ? 'rgba(131,193,103,0.18)' : 'rgba(252,98,85,0.10)';
        ctx.fillRect(px, py, step, step);
      }
    }
    // ejes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    for (let g = 175; g <= 275; g += 25) ctx.fillText(g, tx(g), pad.t + ph + 14);
    ctx.fillText('Temperatura (°C)', pad.l + pw / 2, H - 8);
    ctx.textAlign = 'right'; for (let g = 12; g <= 16; g += 1) ctx.fillText(g, pad.l - 5, ty(g) + 3);
    ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
    ctx.fillText('Duración (min)', 0, 0); ctx.restore();
    // leyenda
    ctx.textAlign = 'left'; ctx.fillStyle = '#83C167'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('verde = buen café', pad.l + 6, pad.t + 12);
    // punto actual
    ctx.beginPath(); ctx.arc(tx(temp), ty(dur), 7, 0, Math.PI * 2);
    ctx.fillStyle = a2 >= 0.5 ? '#83C167' : '#FC6255'; ctx.fill();
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 2; ctx.stroke();

    // --- Red 2-3-1 (derecha) ---
    const ox = 500;
    const inY = [120, 230], hY = [90, 175, 260], outY = 175;
    // edges in→hidden
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      ctx.strokeStyle = 'rgba(168,162,144,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ox + 22, inY[i]); ctx.lineTo(ox + 130 - 22, hY[j]); ctx.stroke();
    }
    // edges hidden→out
    for (let j = 0; j < 3; j++) { ctx.strokeStyle = 'rgba(168,162,144,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox + 130 + 22, hY[j]); ctx.lineTo(ox + 260 - 18, outY); ctx.stroke(); }
    // inputs
    const inLabels = ['temp', 'dur'], inVals = [temp.toFixed(0), dur.toFixed(1)];
    for (let i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.arc(ox, inY[i], 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,134,47,0.25)'; ctx.fill(); ctx.strokeStyle = '#FF862F'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ece6d0'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
      ctx.fillText(inVals[i], ox, inY[i] + 4); ctx.fillStyle = '#FF862F'; ctx.fillText(inLabels[i], ox, inY[i] - 26);
    }
    // hidden (color por activación)
    const hNames = ['a₁⁽¹⁾', 'a₂⁽¹⁾', 'a₃⁽¹⁾'];
    for (let j = 0; j < 3; j++) {
      const act = a1[j];
      ctx.beginPath(); ctx.arc(ox + 130, hY[j], 22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(88,196,221,${0.12 + 0.5 * act})`; ctx.fill(); ctx.strokeStyle = '#58C4DD'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace'; ctx.fillText(act.toFixed(2), ox + 130, hY[j] + 4);
      ctx.fillStyle = '#58C4DD'; ctx.font = '9px Fira Code, monospace'; ctx.fillText(hNames[j], ox + 130, hY[j] - 27);
    }
    // output
    ctx.beginPath(); ctx.arc(ox + 260, outY, 22, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,64,255,${0.15 + 0.5 * a2})`; ctx.fill(); ctx.strokeStyle = '#FF40FF'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace'; ctx.fillText(a2.toFixed(2), ox + 260, outY + 4);
    ctx.fillStyle = '#FF40FF'; ctx.font = '9px Fira Code, monospace'; ctx.fillText('a⁽²⁾', ox + 260, outY - 28);
    // veredicto
    ctx.fillStyle = a2 >= 0.5 ? '#83C167' : '#FC6255'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(a2 >= 0.5 ? '☕ ¡Buen café! (ŷ=1)' : '✗ Mal café (ŷ=0)', ox + 130, H - 24);
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.fillText('capa oculta (3)         salida', ox + 130, outY + 70);
  }

  [sT, sD].forEach(s => s && s.addEventListener('input', draw));
  draw();
}
