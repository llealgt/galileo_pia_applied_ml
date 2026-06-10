// ============================================================
// PCA Widget — Análisis de Componentes Principales
// Scatter 2D centrado e inclinado (~30°). Slider para rotar manualmente
// un eje candidato; muestra la VARIANZA PROYECTADA en una barra lateral.
// Botón "Encontrar PC1" anima la rotación hasta el óptimo (calculado
// offline con SVD = 31.59°). Debajo: proyección 1D del cloud sobre el eje.
// ============================================================

function initPCAWidget() {
  const canvas = document.getElementById('pca-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const angleSlider = document.getElementById('pca-angle-slider');
  const angleVal = document.getElementById('pca-angle-val');
  const runBtn = document.getElementById('pca-run-btn');
  const resetBtn = document.getElementById('pca-reset-btn');
  const varLbl = document.getElementById('pca-var-val');

  // Datos centrados (cloud inclinado a ~30°, precomputado)
  const DATA = [[-0.45,-0.429],[0.117,0.03],[-3.504,-2.017],[2.964,1.886],[-2.51,-2.368],[3.146,1.628],[-1.144,-0.788],[3.063,1.642],[1.026,0.788],[-1.305,-0.741],[-1.466,-0.911],[3.001,1.804],[-0.685,-0.336],[-1.07,-1.151],[-3.075,-1.713],[-0.484,-0.336],[1.187,0.628],[1.626,0.918],[-3.077,-1.802],[2.077,1.135],[1.196,0.78],[1.227,0.788],[-2.116,-1.218],[1.486,0.945],[0.717,0.4],[-0.485,-0.236],[-1.07,-0.612],[-0.945,-0.612],[1.917,1.222],[-0.205,-0.078],[-2.07,-1.121],[-0.444,-0.236],[1.586,0.918],[-3.205,-2.06],[0.027,0.142],[-1.07,-0.711],[-1.27,-0.512],[2.187,1.328],[1.586,1.06],[-1.444,-1.018],[2.07,1.222],[3.077,1.811],[0.205,0.236],[-1.07,-0.812],[1.886,1.211],[0.444,0.336],[1.917,1.222],[-2.187,-1.328],[1.586,0.918],[-1.27,-0.612],[-1.07,-0.612],[2.187,1.328],[1.27,0.712],[-2.07,-1.222],[1.27,0.812],[-0.045,0.036],[-3.077,-1.811],[2.187,1.328],[1.586,0.918],[-2.187,-1.328]];
  const OPTIMAL_ANGLE = 31.59;

  // Layout: scatter principal arriba, proyección 1D abajo, panel derecho
  const padR = 200;
  const pad = { l: 50, r: padR, t: 30, b: 130 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  // Coords data
  const xRange = 4, yRange = 4;
  const cx = pad.l + pw / 2, cy = pad.t + ph / 2;
  const tx = x => cx + x * (pw / (2 * xRange));
  const ty = y => cy - y * (ph / (2 * yRange));

  // proyección 1D abajo
  const proj1DY = pad.t + ph + 45;
  const proj1DXmin = pad.l, proj1DXmax = pad.l + pw;
  const projT = t => proj1DXmin + (t + xRange*1.4) / (2*xRange*1.4) * (proj1DXmax - proj1DXmin);

  let angle = 0;     // ángulo actual del eje candidato (grados)
  let animating = false;
  let animTarget = 0, animStart = 0, animT0 = 0;
  const ANIM_DUR = 1500;

  function project(theta_deg) {
    const a = theta_deg * Math.PI / 180;
    const dir = [Math.cos(a), Math.sin(a)];
    const projs = DATA.map(p => p[0]*dir[0] + p[1]*dir[1]);
    const mean = projs.reduce((s,v)=>s+v,0) / projs.length;
    const variance = projs.reduce((s,v)=>s+(v-mean)*(v-mean),0) / projs.length;
    return { projs, variance, dir };
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    // grid scatter
    ctx.strokeStyle = 'rgba(168,162,144,0.18)'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(tx(i), pad.t); ctx.lineTo(tx(i), pad.t+ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, ty(i)); ctx.lineTo(pad.l+pw, ty(i)); ctx.stroke();
    }
    // ejes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.l, ty(0)); ctx.lineTo(pad.l+pw, ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(0), pad.t); ctx.lineTo(tx(0), pad.t+ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x₁', tx(xRange) - 8, ty(0) + 14);
    ctx.fillText('x₂', tx(0) + 12, pad.t + 12);

    const { projs, variance, dir } = project(angle);

    // eje candidato (línea + flecha)
    const lineLen = xRange * 1.2;
    const ax = lineLen * dir[0], ay = lineLen * dir[1];
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(tx(-ax), ty(-ay)); ctx.lineTo(tx(ax), ty(ay)); ctx.stroke();
    // arrow head
    const hx = tx(ax), hy = ty(ay);
    const baseAngle = Math.atan2(-(ay - (-ay)), ax - (-ax)) - Math.PI;
    // simpler arrow head
    ctx.fillStyle = '#FFFF00';
    ctx.save();
    ctx.translate(hx, hy);
    // Get screen-space angle of the line
    const screenAngle = Math.atan2(ty(ay) - ty(-ay), tx(ax) - tx(-ax));
    ctx.rotate(screenAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -7); ctx.lineTo(-14, 7); ctx.closePath(); ctx.fill();
    ctx.restore();

    // dropdown lines: from each point to the projection on the axis
    ctx.strokeStyle = 'rgba(255,255,0,0.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < DATA.length; i++) {
      const t = projs[i];
      const px = t * dir[0], py = t * dir[1];
      ctx.beginPath();
      ctx.moveTo(tx(DATA[i][0]), ty(DATA[i][1]));
      ctx.lineTo(tx(px), ty(py));
      ctx.stroke();
    }

    // puntos data
    for (const p of DATA) {
      ctx.beginPath(); ctx.arc(tx(p[0]), ty(p[1]), 4.5, 0, Math.PI*2);
      ctx.fillStyle = '#58C4DD'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.7; ctx.stroke();
    }

    // puntos proyectados sobre el eje
    for (let i = 0; i < DATA.length; i++) {
      const t = projs[i];
      const px = t * dir[0], py = t * dir[1];
      ctx.beginPath(); ctx.arc(tx(px), ty(py), 3.5, 0, Math.PI*2);
      ctx.fillStyle = '#FC6255'; ctx.fill();
    }

    // ====== Proyección 1D abajo ======
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(proj1DXmin, proj1DY); ctx.lineTo(proj1DXmax, proj1DY); ctx.stroke();
    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Proyección 1D (dim reducida)', (proj1DXmin + proj1DXmax)/2, proj1DY - 14);
    for (const t of projs) {
      ctx.beginPath(); ctx.arc(projT(t), proj1DY, 4, 0, Math.PI*2);
      ctx.fillStyle = '#FC6255'; ctx.fill();
    }

    // ====== Panel derecho ======
    const ix = pad.l + pw + 24;
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('PCA', ix, 50);
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('ángulo: ' + angle.toFixed(1) + '°', ix, 72);
    ctx.fillStyle = '#FFFF00'; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText('var. proy.', ix, 100);
    ctx.fillStyle = '#FC6255'; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillText(variance.toFixed(3), ix, 122);
    // barra
    const barMax = 5;
    const barH = 100;
    const barY = 140;
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.strokeRect(ix, barY, 50, barH);
    const fillH = Math.min(barH, (variance / barMax) * barH);
    ctx.fillStyle = '#FC6255';
    ctx.fillRect(ix, barY + (barH - fillH), 50, fillH);
    // óptimo
    const optVar = project(OPTIMAL_ANGLE).variance;
    const optY = barY + (barH - (optVar / barMax) * barH);
    ctx.strokeStyle = '#83C167'; ctx.lineWidth = 2; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(ix - 6, optY); ctx.lineTo(ix + 56, optY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#83C167'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('PC1 ✓', ix + 60, optY + 4);
    // labels
    ctx.fillStyle = '#a8a290';
    ctx.fillText('máx', ix - 28, barY + 5);
    ctx.fillText('0', ix - 14, barY + barH);
    ctx.fillStyle = (Math.abs(angle - OPTIMAL_ANGLE) < 1 ? '#83C167' : '#a8a290');
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText(Math.abs(angle - OPTIMAL_ANGLE) < 1 ? '✓ PC1 alcanzado' : 'óptimo: ' + OPTIMAL_ANGLE + '°', ix, 260);

    if (angleVal) angleVal.textContent = angle.toFixed(1);
    if (varLbl) varLbl.textContent = variance.toFixed(3);
  }

  function animate() {
    if (canvas.offsetParent === null) { requestAnimationFrame(animate); return; }
    const now = performance.now();
    const t = Math.min(1, (now - animT0) / ANIM_DUR);
    // ease-out
    const e = 1 - Math.pow(1 - t, 3);
    angle = animStart + (animTarget - animStart) * e;
    if (angleSlider) angleSlider.value = angle;
    draw();
    if (t < 1) requestAnimationFrame(animate);
    else animating = false;
  }

  function runToOptimal() {
    if (animating) return;
    animating = true;
    animStart = angle;
    animTarget = OPTIMAL_ANGLE;
    animT0 = performance.now();
    requestAnimationFrame(animate);
  }

  function reset() {
    if (animating) return;
    angle = 0;
    if (angleSlider) angleSlider.value = 0;
    draw();
  }

  if (angleSlider) angleSlider.addEventListener('input', e => {
    if (!animating) { angle = parseFloat(angleSlider.value); draw(); }
  });
  if (runBtn) runBtn.addEventListener('click', runToOptimal);
  if (resetBtn) resetBtn.addEventListener('click', reset);

  draw();
}
