// ============================================================
// Anomaly Detection 2D Widget
// 50 puntos normales (datos honestos: gauss en 2D, μ≈[5,3], σ≈[1.5,0.9]).
// Renderiza contornos de p(x) = p(x₁)·p(x₂).
// El usuario arrastra un punto de test y ve p(x_test) en vivo.
// Slider de ε controla el umbral; etiqueta OK/ANOMALY se actualiza.
// ============================================================

function initAnomaly2D() {
  const canvas = document.getElementById('anom-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const epsSlider = document.getElementById('anom-eps');
  const epsVal = document.getElementById('anom-eps-val');
  const probLbl = document.getElementById('anom-prob');
  const verdictLbl = document.getElementById('anom-verdict');

  // Dataset honesto (50 puntos gaussianos 2D)
  const DATA = [[2.81,3.5],[4.81,2.66],[5.97,3.32],[6.45,3.71],[4.94,2.74],[8.45,3.45],[6.18,3.41],[5.6,2.18],[6.86,2.69],[5.45,3.31],[5.6,1.32],[5.13,3.71],[8.43,2.81],[6.45,2.83],[3.79,1.51],[4.99,3.47],[2.18,3.05],[7.04,1.85],[3.27,2.51],[4.65,3.51],[5.4,3.31],[2.16,2.51],[3.34,3.41],[7.27,2.84],[3.61,2.78],[6.5,3.12],[3.99,3.66],[5.43,3.0],[3.98,1.93],[6.43,4.05],[5.59,3.04],[4.97,1.43],[5.74,2.05],[3.51,2.06],[6.6,3.02],[3.84,3.21],[7.34,2.65],[5.13,2.96],[5.99,4.05],[6.07,3.5],[6.85,2.71],[6.06,2.07],[4.05,3.78],[6.48,2.5],[5.61,1.87],[3.7,3.24],[5.27,3.27],[5.41,1.99],[4.48,2.5],[8.18,3.79]];
  const MU = [5.199, 2.901];
  const VAR = [1.742, 0.759];
  const SIG = [Math.sqrt(VAR[0]), Math.sqrt(VAR[1])];

  // Rango de visualización
  const xMin = 0, xMax = 10, yMin = 0, yMax = 6;
  const pad = { l: 50, r: 200, t: 30, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const tx = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
  const ty = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;
  const invTx = px => xMin + (px - pad.l) / pw * (xMax - xMin);
  const invTy = py => yMin + (pad.t + ph - py) / ph * (yMax - yMin);

  function gauss1d(x, mu, sig) {
    const z = (x - mu) / sig;
    return Math.exp(-0.5 * z * z) / (sig * Math.sqrt(2 * Math.PI));
  }
  function pdf2d(x, y) {
    return gauss1d(x, MU[0], SIG[0]) * gauss1d(y, MU[1], SIG[1]);
  }

  // Punto de test (arrastrable)
  let xt = 7.5, yt = 4.5;
  let dragging = false;

  function pxToData(px, py) {
    const r = canvas.getBoundingClientRect();
    // canvas internal coords vs CSS coords
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return [invTx((px - r.left) * scaleX), invTy((py - r.top) * scaleY)];
  }

  canvas.addEventListener('mousedown', e => {
    const [cx, cy] = pxToData(e.clientX, e.clientY);
    const dx = cx - xt, dy = cy - yt;
    if (Math.sqrt(dx*dx + dy*dy) < 0.5) dragging = true;
  });
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const [cx, cy] = pxToData(e.clientX, e.clientY);
    xt = Math.max(xMin, Math.min(xMax, cx));
    yt = Math.max(yMin, Math.min(yMax, cy));
    draw();
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // contornos de p(x,y): niveles logarítmicos
    const levels = [0.001, 0.005, 0.02, 0.05, 0.10, 0.15];
    const colors = ['rgba(252,98,85,0.55)', 'rgba(252,98,85,0.45)', 'rgba(255,255,0,0.40)', 'rgba(131,193,103,0.45)', 'rgba(88,196,221,0.55)', 'rgba(88,196,221,0.7)'];
    // raster simple para contornos: campo de p en grid
    const Nx = 80, Ny = 50;
    const grid = [];
    for (let j = 0; j <= Ny; j++) {
      const row = [];
      for (let i = 0; i <= Nx; i++) {
        const x = xMin + i / Nx * (xMax - xMin);
        const y = yMin + j / Ny * (yMax - yMin);
        row.push(pdf2d(x, y));
      }
      grid.push(row);
    }
    // marching square minimalista: para cada nivel, recorrer celdas y dibujar segmentos
    function drawContour(lvl, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      for (let j = 0; j < Ny; j++) {
        for (let i = 0; i < Nx; i++) {
          const v00 = grid[j][i], v10 = grid[j][i+1], v01 = grid[j+1][i], v11 = grid[j+1][i+1];
          const cx = xMin + i / Nx * (xMax - xMin);
          const cy = yMin + j / Ny * (yMax - yMin);
          const cdx = (xMax - xMin) / Nx, cdy = (yMax - yMin) / Ny;
          // linear interp boundaries
          const pts = [];
          if ((v00 < lvl) !== (v10 < lvl)) {
            const t = (lvl - v00) / (v10 - v00); pts.push([cx + t*cdx, cy]);
          }
          if ((v10 < lvl) !== (v11 < lvl)) {
            const t = (lvl - v10) / (v11 - v10); pts.push([cx + cdx, cy + t*cdy]);
          }
          if ((v01 < lvl) !== (v11 < lvl)) {
            const t = (lvl - v01) / (v11 - v01); pts.push([cx + t*cdx, cy + cdy]);
          }
          if ((v00 < lvl) !== (v01 < lvl)) {
            const t = (lvl - v00) / (v01 - v00); pts.push([cx, cy + t*cdy]);
          }
          if (pts.length === 2) {
            ctx.beginPath();
            ctx.moveTo(tx(pts[0][0]), ty(pts[0][1]));
            ctx.lineTo(tx(pts[1][0]), ty(pts[1][1]));
            ctx.stroke();
          }
        }
      }
    }
    for (let i = 0; i < levels.length; i++) drawContour(levels[i], colors[i]);

    // axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t+ph); ctx.lineTo(pad.l+pw, pad.t+ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t+ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    for (let x = 0; x <= 10; x += 2) ctx.fillText(x, tx(x), pad.t + ph + 14);
    ctx.textAlign = 'right';
    for (let y = 0; y <= 6; y += 1) ctx.fillText(y, pad.l - 4, ty(y) + 3);
    ctx.textAlign = 'center';
    ctx.fillText('x₁ (feature 1)', pad.l + pw/2, H - 8);
    ctx.save(); ctx.translate(15, pad.t + ph/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('x₂ (feature 2)', 0, 0); ctx.restore();

    // dataset (puntos normales)
    for (const p of DATA) {
      ctx.beginPath(); ctx.arc(tx(p[0]), ty(p[1]), 4, 0, Math.PI*2);
      ctx.fillStyle = '#83C167'; ctx.fill();
    }

    // umbral ε
    const eps = epsSlider ? parseFloat(epsSlider.value) : 0.02;
    if (epsVal) epsVal.textContent = eps.toFixed(3);

    // x_test point
    const pTest = pdf2d(xt, yt);
    const isAnomaly = pTest < eps;
    const color = isAnomaly ? '#FC6255' : '#FFFF00';
    ctx.beginPath(); ctx.arc(tx(xt), ty(yt), 12, 0, Math.PI*2);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(tx(xt), ty(yt), 7, 0, Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5; ctx.stroke();
    // label
    ctx.fillStyle = color; ctx.font = 'bold 11px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('x_test', tx(xt) + 14, ty(yt) - 8);
    ctx.fillText('p = ' + pTest.toFixed(4), tx(xt) + 14, ty(yt) + 8);

    if (probLbl) probLbl.textContent = pTest.toFixed(4);
    if (verdictLbl) {
      verdictLbl.textContent = isAnomaly ? '🚨 ANOMALY' : '✓ OK';
      verdictLbl.style.color = isAnomaly ? '#FC6255' : '#83C167';
    }

    // panel derecho info
    const ix = pad.l + pw + 20;
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Density model', ix, 50);
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('μ₁ = ' + MU[0].toFixed(2), ix, 75);
    ctx.fillText('μ₂ = ' + MU[1].toFixed(2), ix, 91);
    ctx.fillText('σ²₁ = ' + VAR[0].toFixed(2), ix, 110);
    ctx.fillText('σ²₂ = ' + VAR[1].toFixed(2), ix, 126);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('ε = ' + eps.toFixed(3), ix, 150);
    ctx.fillStyle = '#FC6255'; ctx.fillText('p(x_test) = ' + pTest.toFixed(4), ix, 170);
    ctx.fillStyle = color; ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillText(isAnomaly ? '🚨 ANOMALY' : '✓ OK', ix, 200);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('arrastra el punto', ix, 230);
    ctx.fillText('amarillo/rojo', ix, 244);
  }

  if (epsSlider) epsSlider.addEventListener('input', draw);
  draw();
}
