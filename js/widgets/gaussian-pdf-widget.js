// ============================================================
// Gaussian PDF Widget
// Sliders interactivos de μ y σ para la distribución normal.
// Dibuja la curva en vivo + un punto de test movible cuyo p(x_test)
// aparece como etiqueta. Refuerza la intuición usada en anomaly detection.
// ============================================================

function initGaussianPDF() {
  const canvas = document.getElementById('gauss-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const muSlider = document.getElementById('g-mu-slider');
  const sigSlider = document.getElementById('g-sigma-slider');
  const xSlider = document.getElementById('g-x-slider');
  const muVal = document.getElementById('g-mu-val');
  const sigVal = document.getElementById('g-sigma-val');
  const xVal = document.getElementById('g-x-val');
  const probLbl = document.getElementById('g-prob');

  const pad = { l: 50, r: 30, t: 30, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const xMin = -6, xMax = 6;
  const yMax = 1.0;
  const tx = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
  const ty = y => pad.t + ph - y / yMax * ph;

  function pdf(x, mu, sig) {
    const z = (x - mu) / sig;
    return Math.exp(-0.5 * z * z) / (sig * Math.sqrt(2 * Math.PI));
  }

  function draw() {
    const mu = muSlider ? parseFloat(muSlider.value) : 0;
    const sig = sigSlider ? parseFloat(sigSlider.value) : 1;
    const xTest = xSlider ? parseFloat(xSlider.value) : 0;
    if (muVal) muVal.textContent = mu.toFixed(2);
    if (sigVal) sigVal.textContent = sig.toFixed(2);
    if (xVal) xVal.textContent = xTest.toFixed(2);
    const p = pdf(xTest, mu, sig);
    if (probLbl) probLbl.textContent = p.toFixed(4);

    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(168,162,144,0.18)'; ctx.lineWidth = 1;
    for (let x = xMin; x <= xMax; x += 1) {
      ctx.beginPath(); ctx.moveTo(tx(x), pad.t); ctx.lineTo(tx(x), pad.t + ph); ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = i * yMax / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, ty(y)); ctx.lineTo(pad.l + pw, ty(y)); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.l, ty(0)); ctx.lineTo(pad.l + pw, ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(0), pad.t); ctx.lineTo(tx(0), pad.t + ph); ctx.stroke();
    // labels
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    for (let x = xMin; x <= xMax; x += 2) ctx.fillText(x, tx(x), pad.t + ph + 14);
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) { const y = i * yMax / 4; ctx.fillText(y.toFixed(2), pad.l - 4, ty(y) + 3); }
    ctx.textAlign = 'center';
    ctx.fillText('x', pad.l + pw / 2, H - 5);
    ctx.save(); ctx.translate(15, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('p(x)', 0, 0); ctx.restore();

    // bell curve
    ctx.strokeStyle = '#58C4DD'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    const N = 400;
    for (let i = 0; i <= N; i++) {
      const x = xMin + i / N * (xMax - xMin);
      const y = pdf(x, mu, sig);
      if (i === 0) ctx.moveTo(tx(x), ty(Math.min(y, yMax)));
      else ctx.lineTo(tx(x), ty(Math.min(y, yMax)));
    }
    ctx.stroke();

    // shade ±1σ
    ctx.fillStyle = 'rgba(88,196,221,0.18)';
    ctx.beginPath();
    ctx.moveTo(tx(mu - sig), ty(0));
    for (let i = 0; i <= 50; i++) {
      const x = mu - sig + (i / 50) * (2 * sig);
      ctx.lineTo(tx(x), ty(Math.min(pdf(x, mu, sig), yMax)));
    }
    ctx.lineTo(tx(mu + sig), ty(0));
    ctx.closePath(); ctx.fill();

    // mu marker
    ctx.strokeStyle = '#FC6255'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(tx(mu), ty(0)); ctx.lineTo(tx(mu), ty(yMax)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#FC6255'; ctx.font = 'bold 11px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('μ = ' + mu.toFixed(2), tx(mu), pad.t - 10);

    // x_test point
    const yTest = Math.min(pdf(xTest, mu, sig), yMax);
    // drop line
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx(xTest), ty(0)); ctx.lineTo(tx(xTest), ty(yTest)); ctx.stroke();
    ctx.setLineDash([]);
    // point
    ctx.beginPath(); ctx.arc(tx(xTest), ty(yTest), 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFF00'; ctx.fill();
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 2; ctx.stroke();
    // label
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('x_test = ' + xTest.toFixed(2), tx(xTest) + 10, ty(yTest) - 8);
    ctx.fillText('p(x_test) = ' + p.toFixed(4), tx(xTest) + 10, ty(yTest) + 8);
  }

  [muSlider, sigSlider, xSlider].forEach(s => s && s.addEventListener('input', draw));
  draw();
}
