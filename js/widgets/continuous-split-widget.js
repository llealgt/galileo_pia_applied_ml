// ============================================================
// Continuous Split Widget
// Feature continua (Peso). El usuario hace click / arrastra sobre la
// gráfica para elegir un umbral; el Information Gain se recalcula en vivo
// y se muestran todos los cálculos en pantalla.
// ============================================================

function initContinuousSplitWidget() {
  const canvas = document.getElementById('cont-split-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // w = peso (lbs), c = 1 si es gato. Mismos datos que la slide siguiente.
  const data = [
    { w: 7.2, c: 1 }, { w: 7.6, c: 1 }, { w: 8.4, c: 1 }, { w: 8.8, c: 1 }, { w: 10.2, c: 1 },
    { w: 9.2, c: 0 }, { w: 11, c: 0 }, { w: 15, c: 0 }, { w: 18, c: 0 }, { w: 20, c: 0 }
  ];
  const N = data.length;
  const wMin = 6, wMax = 21;
  const padL = 62, padR = 28, plotW = W - padL - padR;
  const catY = 56, dogY = 116, axisY = 150;

  function xw(w) { return padL + (w - wMin) / (wMax - wMin) * plotW; }
  function wx(x) { return wMin + (x - padL) / plotW * (wMax - wMin); }
  function Hf(p) { if (p <= 0 || p >= 1) return 0; return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); }

  let threshold = 9.0; // arranca en el mejor umbral (IG = 0.61)

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    const L = data.filter(d => d.w <= threshold), R = data.filter(d => d.w > threshold);
    const nL = L.length, nR = R.length;
    const cL = L.filter(d => d.c === 1).length, cR = R.filter(d => d.c === 1).length;
    const pL = nL ? cL / nL : 0, pR = nR ? cR / nR : 0;
    const HL = Hf(pL), HR = Hf(pR);
    const ig = 1.0 - (nL / N * HL + nR / N * HR);

    const tx = xw(threshold);

    // Tint de regiones según clase mayoritaria (sugerencia de predicción)
    const leftCat = cL >= nL - cL;
    const rightCat = cR >= nR - cR;
    if (nL) { ctx.fillStyle = leftCat ? 'rgba(252,98,85,0.10)' : 'rgba(88,196,221,0.10)'; ctx.fillRect(padL, 32, tx - padL, axisY - 32); }
    if (nR) { ctx.fillStyle = rightCat ? 'rgba(252,98,85,0.10)' : 'rgba(88,196,221,0.10)'; ctx.fillRect(tx, 32, padL + plotW - tx, axisY - 32); }

    // Eje
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, axisY); ctx.lineTo(padL + plotW, axisY); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    [6, 8, 10, 12, 14, 16, 18, 20].forEach(w => ctx.fillText(w, xw(w), axisY + 14));
    ctx.fillText('Peso (lbs)', padL + plotW / 2, axisY + 30);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FC6255'; ctx.fillText('Gato', padL - 8, catY + 4);
    ctx.fillStyle = '#58C4DD'; ctx.fillText('No Gato', padL - 8, dogY + 4);
    ctx.textAlign = 'center';

    // Línea de umbral
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tx, 34); ctx.lineTo(tx, axisY); ctx.stroke();
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('≤ ' + threshold.toFixed(1), tx, 28);

    // Puntos
    data.forEach(d => {
      const y = d.c === 1 ? catY : dogY;
      ctx.fillStyle = d.c === 1 ? '#FC6255' : '#58C4DD';
      ctx.font = 'bold 17px Fira Code, monospace';
      ctx.fillText('×', xw(d.w), y + 5);
    });

    // Cálculos
    ctx.textAlign = 'left';
    const ix = 62; let iy = 196;
    const fL = nL ? `${cL}/${nL}=${pL.toFixed(2)}` : '—';
    const fR = nR ? `${cR}/${nR}=${pR.toFixed(2)}` : '—';
    ctx.fillStyle = '#ece6d0'; ctx.font = '12px Fira Code, monospace';
    ctx.fillText('Umbral seleccionado:  Peso ≤ ' + threshold.toFixed(1), ix, iy); iy += 23;
    ctx.fillStyle = '#FC6255';
    ctx.fillText(`Izquierda (≤${threshold.toFixed(1)}):  n=${nL}, gatos=${cL}  →  p=${fL},  H=${HL.toFixed(3)}`, ix, iy); iy += 20;
    ctx.fillStyle = '#58C4DD';
    ctx.fillText(`Derecha   (>${threshold.toFixed(1)}):  n=${nR}, gatos=${cR}  →  p=${fR},  H=${HR.toFixed(3)}`, ix, iy); iy += 24;
    ctx.fillStyle = '#a8a290';
    ctx.fillText('H(padre) = 1.000   (5 gatos, 5 perros)', ix, iy); iy += 26;
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 15px Fira Code, monospace';
    ctx.fillText(`IG = 1.000 − (${nL}/10·${HL.toFixed(3)} + ${nR}/10·${HR.toFixed(3)}) = ${ig.toFixed(3)}`, ix, iy);

    // Pista de mejor IG
    ctx.fillStyle = (ig >= 0.609) ? '#83C167' : '#a8a290';
    ctx.font = 'italic 11px Fira Code, monospace'; ctx.textAlign = 'right';
    const msg = (ig >= 0.609) ? '¡Máximo IG! (umbral óptimo ≈ 9)' : 'Mueve el umbral para maximizar el IG';
    ctx.fillText(msg, W - 16, iy);
    ctx.textAlign = 'left';
  }

  function setFromEvent(clientX) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    let w = wx(mx);
    w = Math.max(wMin + 0.2, Math.min(wMax - 0.2, w));
    threshold = Math.round(w * 10) / 10;
    draw();
  }

  let dragging = false;
  canvas.addEventListener('mousedown', e => { dragging = true; setFromEvent(e.clientX); });
  canvas.addEventListener('mousemove', e => { if (dragging) setFromEvent(e.clientX); });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('touchstart', e => { setFromEvent(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => { setFromEvent(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  canvas.style.cursor = 'ew-resize';

  draw();
}
