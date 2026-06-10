// ============================================================
// K-Means Stepwise Widget
// Scatter 2D con 60 puntos (3 blobs sintéticos vía sklearn make_blobs).
// El usuario configura K (2-5) y avanza paso a paso:
//   Paso impar = ASIGNAR puntos al centroide más cercano (colores).
//   Paso par   = MOVER centroides al promedio de su cluster.
// Muestra el cost J (distortion) en vivo, decreciendo a cada paso.
// ============================================================

function initKMeansAnim() {
  const canvas = document.getElementById('kmeans-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const stepBtn = document.getElementById('km-step-btn');
  const runBtn = document.getElementById('km-run-btn');
  const resetBtn = document.getElementById('km-reset-btn');
  const kSlider = document.getElementById('km-k-slider');
  const kLabel = document.getElementById('km-k-val');
  const stepLbl = document.getElementById('km-step-info');
  const costLbl = document.getElementById('km-cost');

  // Dataset (60 puntos en [0,1]^2, 3 blobs sintéticos)
  const DATA = [[0.138,0.77],[0.922,0.201],[0.896,0.199],[0.066,0.733],[0.067,0.711],[0.835,0.205],[0.05,0.624],[0.875,0.108],[0.93,0.122],[0.06,0.762],[0.405,0.857],[0.118,0.713],[0.402,0.95],[0.402,0.881],[0.872,0.187],[0.357,0.835],[0.092,0.585],[0.408,0.804],[0.115,0.755],[0.378,0.855],[0.832,0.144],[0.05,0.622],[0.391,0.926],[0.075,0.736],[0.426,0.851],[0.835,0.142],[0.077,0.7],[0.42,0.872],[0.116,0.749],[0.379,0.864],[0.107,0.732],[0.881,0.117],[0.4,0.829],[0.844,0.158],[0.355,0.875],[0.882,0.05],[0.075,0.692],[0.118,0.685],[0.93,0.097],[0.382,0.913],[0.871,0.117],[0.092,0.682],[0.95,0.114],[0.379,0.838],[0.347,0.895],[0.398,0.943],[0.927,0.087],[0.071,0.681],[0.404,0.895],[0.078,0.682],[0.082,0.687],[0.359,0.832],[0.05,0.628],[0.901,0.069],[0.901,0.182],[0.866,0.131],[0.408,0.812],[0.412,0.857],[0.066,0.728],[0.069,0.726]];

  // Colores por cluster (hasta 5)
  const COLORS = ['#FC6255', '#58C4DD', '#83C167', '#FF862F', '#9A72AC'];
  const DIM = '#a8a290';

  // Estado
  let K = 3;
  let centroids = [];  // [[x,y]...]
  let assigns = new Array(DATA.length).fill(-1);
  let phase = 'init';  // 'init' | 'assign' | 'move'
  let step = 0;        // 1=assign, 2=move, 3=assign, ...
  let cost = null;
  let converged = false;
  let seedCounter = 0;

  // Mapeo coords data → canvas
  const pad = { l: 50, r: 200, t: 30, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const tx = x => pad.l + x * pw;
  const ty = y => pad.t + (1 - y) * ph;

  // RNG simple deterministico para que reset cambie la semilla
  function seededIndex(n, count, seed) {
    const arr = [], used = new Set();
    let s = seed * 9301 + 49297;
    while (arr.length < count) {
      s = (s * 9301 + 49297) % 233280;
      const idx = Math.floor((s / 233280) * n);
      if (!used.has(idx)) { used.add(idx); arr.push(idx); }
    }
    return arr;
  }

  function init(K_, seed) {
    K = K_;
    converged = false;
    phase = 'init';
    step = 0;
    cost = null;
    const idx = seededIndex(DATA.length, K, seed);
    centroids = idx.map(i => [DATA[i][0], DATA[i][1]]);
    assigns = new Array(DATA.length).fill(-1);
  }

  function computeAssign() {
    let total = 0;
    for (let i = 0; i < DATA.length; i++) {
      let best = 0, bestD = Infinity;
      for (let k = 0; k < K; k++) {
        const dx = DATA[i][0] - centroids[k][0];
        const dy = DATA[i][1] - centroids[k][1];
        const d = dx*dx + dy*dy;
        if (d < bestD) { bestD = d; best = k; }
      }
      assigns[i] = best;
      total += bestD;
    }
    cost = total / DATA.length;
  }

  function computeMove() {
    const newCentroids = centroids.map(c => [c[0], c[1]]);
    let changed = false;
    for (let k = 0; k < K; k++) {
      let sx = 0, sy = 0, n = 0;
      for (let i = 0; i < DATA.length; i++) {
        if (assigns[i] === k) { sx += DATA[i][0]; sy += DATA[i][1]; n++; }
      }
      if (n > 0) {
        const nx = sx / n, ny = sy / n;
        if (Math.abs(nx - centroids[k][0]) > 1e-4 || Math.abs(ny - centroids[k][1]) > 1e-4) changed = true;
        newCentroids[k] = [nx, ny];
      }
    }
    centroids = newCentroids;
    if (!changed) converged = true;
  }

  function doStep() {
    if (converged) return;
    if (phase === 'init' || phase === 'move') {
      computeAssign();
      phase = 'assign';
    } else {
      computeMove();
      phase = 'move';
    }
    step++;
  }

  function runUntilConvergence() {
    let safety = 50;
    while (!converged && safety-- > 0) doStep();
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // axes/grid
    ctx.strokeStyle = 'rgba(168,162,144,0.2)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = pad.l + i*pw/4;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t+ph); ctx.stroke();
      const y = pad.t + i*ph/4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+pw, y); ctx.stroke();
    }
    ctx.fillStyle = DIM; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x₁', pad.l + pw/2, H - 8);
    ctx.save(); ctx.translate(20, pad.t + ph/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('x₂', 0, 0); ctx.restore();

    // puntos
    for (let i = 0; i < DATA.length; i++) {
      const c = assigns[i] === -1 ? DIM : COLORS[assigns[i]];
      ctx.beginPath(); ctx.arc(tx(DATA[i][0]), ty(DATA[i][1]), 4, 0, Math.PI*2);
      ctx.fillStyle = c; ctx.fill();
    }

    // dibujar lineas de cada punto a su centroide solo en fase 'assign'
    if (phase === 'assign') {
      for (let i = 0; i < DATA.length; i++) {
        const k = assigns[i];
        if (k < 0) continue;
        ctx.strokeStyle = COLORS[k] + '60';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx(DATA[i][0]), ty(DATA[i][1]));
        ctx.lineTo(tx(centroids[k][0]), ty(centroids[k][1]));
        ctx.stroke();
      }
    }

    // centroides (✕ grandes)
    for (let k = 0; k < K; k++) {
      const x = tx(centroids[k][0]), y = ty(centroids[k][1]);
      ctx.strokeStyle = COLORS[k]; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x-10, y-10); ctx.lineTo(x+10, y+10);
      ctx.moveTo(x-10, y+10); ctx.lineTo(x+10, y-10);
      ctx.stroke();
      // ring
      ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.stroke();
    }

    // panel derecho
    const px = pad.l + pw + 24;
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('K-Means', px, 50);
    ctx.fillStyle = DIM; ctx.font = '11px Fira Code, monospace';
    ctx.fillText('K = ' + K, px, 72);
    ctx.fillText('iter = ' + Math.floor((step+1)/2), px, 92);
    ctx.fillText('paso = ' + step, px, 112);
    const phaseText = phase === 'init' ? 'init aleatorio' : phase === 'assign' ? '① ASIGNAR' : '② MOVER';
    const phaseColor = phase === 'assign' ? '#FFFF00' : phase === 'move' ? '#83C167' : DIM;
    ctx.fillStyle = phaseColor; ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillText(phaseText, px, 140);
    if (cost !== null) {
      ctx.fillStyle = '#FC6255'; ctx.font = 'bold 12px Fira Code, monospace';
      ctx.fillText('cost J = ' + cost.toFixed(4), px, 170);
    }
    if (converged) {
      ctx.fillStyle = '#83C167'; ctx.font = 'bold 13px Fira Code, monospace';
      ctx.fillText('✓ convergido', px, 200);
    }
    // leyenda colores
    ctx.fillStyle = DIM; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('clusters:', px, 230);
    for (let k = 0; k < K; k++) {
      ctx.fillStyle = COLORS[k];
      ctx.beginPath(); ctx.arc(px + 8, 248 + k*16, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = DIM;
      ctx.fillText('cluster ' + (k+1), px + 22, 252 + k*16);
    }

    if (stepLbl) stepLbl.textContent = phase === 'init' ? 'init · K=' + K : (phase === 'assign' ? '①' : '②') + ' · iter ' + Math.floor((step+1)/2);
    if (costLbl) costLbl.textContent = cost === null ? '—' : cost.toFixed(4);
  }

  function reseed() {
    seedCounter++;
    const k = kSlider ? parseInt(kSlider.value) : 3;
    if (kLabel) kLabel.textContent = k;
    init(k, seedCounter);
    draw();
  }

  if (stepBtn) stepBtn.addEventListener('click', () => { doStep(); draw(); });
  if (runBtn) runBtn.addEventListener('click', () => { runUntilConvergence(); draw(); });
  if (resetBtn) resetBtn.addEventListener('click', reseed);
  if (kSlider) kSlider.addEventListener('input', reseed);

  init(K, seedCounter);
  draw();
}
