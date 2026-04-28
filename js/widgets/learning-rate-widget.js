// ============================================================
// Learning Rate Comparison Widget
// ============================================================

function initLearningRateWidget(data) {
  const canvases = [
    document.getElementById('lr-comp-1'),
    document.getElementById('lr-comp-2'),
    document.getElementById('lr-comp-3')
  ];
  const playBtn = document.getElementById('lr-comp-play');
  const resetBtn = document.getElementById('lr-comp-reset');

  if (!canvases[0] || !canvases[1] || !canvases[2]) return;

  const xData = data.x, yData = data.y;
  const m = xData.length;
  const alphas = [0.01, 0.5, 2.1];
  const maxIters = 150;

  // --- Mean-center x for well-conditioned GD ---
  const xMean = xData.reduce((a, b) => a + b, 0) / m;
  const xC = xData.map(x => x - xMean);

  // Cost in ORIGINAL (w, b) space
  function computeCostLocal(w, b) {
    let cost = 0;
    for (let i = 0; i < m; i++) {
      const err = w * xData[i] + b - yData[i];
      cost += err * err;
    }
    return cost / (2 * m);
  }

  // Precompute trajectories using centered GD
  const trajectories = alphas.map(alpha => {
    const traj = [];
    let wGD = 0, bcGD = 0;
    for (let iter = 0; iter <= maxIters; iter++) {
      const bOrig = bcGD - wGD * xMean;
      const cost = computeCostLocal(wGD, bOrig);
      traj.push({ w: wGD, b: bOrig, cost: Math.min(cost, 200000), iter });

      // Gradient in centered space
      let dw = 0, db = 0;
      for (let i = 0; i < m; i++) {
        const err = wGD * xC[i] + bcGD - yData[i];
        dw += err * xC[i];
        db += err;
      }
      dw /= m;
      db /= m;

      wGD -= alpha * dw;
      bcGD -= alpha * db;
    }
    return traj;
  });

  // Analytical optimum
  const wOpt = 209.4, bOpt = 2.4;

  let currentStep = 0;
  let isPlaying = false;
  let animId = null;
  let frameCounter = 0;

  function drawPanel(canvasIdx) {
    const canvas = canvases[canvasIdx];
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const traj = trajectories[canvasIdx];
    const step = Math.min(currentStep, traj.length - 1);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Top half: cost vs iteration
    const topH = H * 0.48;
    const ox = 35, pw = W - 45, ph = topH - 30;
    const oy = topH - 10;

    // Find max cost for scaling
    const maxCost = Math.min(200000, Math.max(...traj.slice(0, Math.min(step + 1, traj.length)).map(p => p.cost)));

    // Axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();

    // Labels
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.fillText('iter', ox + pw / 2, oy + 12);
    ctx.textAlign = 'left'; ctx.fillText('J', 3, oy - ph / 2);

    // Cost curve
    if (step > 0) {
      ctx.strokeStyle = canvasIdx === 1 ? '#83C167' : (canvasIdx === 0 ? '#FF862F' : '#FC6255');
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= step && i < traj.length; i++) {
        const x = ox + (i / maxIters) * pw;
        const y = oy - Math.min(1, traj[i].cost / (maxCost || 1)) * ph;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Bottom half: contour with GD path
    const botTop = H * 0.52;
    const botH = H - botTop - 10;
    const box = botTop + 5;
    const bpw = W - 20, bph = botH - 5;
    const bOx = 10;

    // Mini contour
    const wMin = -50, wMax = 400, bMin = -150, bMax = 350;
    const gridSize = 4;
    for (let py = 0; py < bph; py += gridSize) {
      for (let px = 0; px < bpw; px += gridSize) {
        const wv = wMin + (wMax - wMin) * px / bpw;
        const bv = bMax - (bMax - bMin) * py / bph;
        const c = computeCostLocal(wv, bv);
        const t = Math.min(1, Math.sqrt(c / 100000));
        const r = Math.round(27 + t * 228);
        const g = Math.round(27 + (1 - t) * 169);
        const bl = Math.round(47 + (1 - t) * 174);
        ctx.fillStyle = `rgb(${r},${g},${bl})`;
        ctx.fillRect(bOx + px, box + py, gridSize, gridSize);
      }
    }

    // GD path
    function tww(v) { return bOx + (v - wMin) / (wMax - wMin) * bpw; }
    function tbb(v) { return box + (bMax - v) / (bMax - bMin) * bph; }

    if (step > 0) {
      ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(
        Math.max(bOx, Math.min(bOx + bpw, tww(traj[0].w))),
        Math.max(box, Math.min(box + bph, tbb(traj[0].b)))
      );
      for (let i = 1; i <= step && i < traj.length; i++) {
        const tw = tww(traj[i].w), tb = tbb(traj[i].b);
        // Clamp to canvas area for drawing
        const cx = Math.max(bOx, Math.min(bOx + bpw, tw));
        const cy = Math.max(box, Math.min(box + bph, tb));
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Current point
    const pt = traj[step];
    const cpx = tww(pt.w), cpy = tbb(pt.b);
    if (cpx >= bOx - 10 && cpx <= bOx + bpw + 10 && cpy >= box - 10 && cpy <= box + bph + 10) {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath(); ctx.arc(cpx, cpy, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Minimum marker
    ctx.fillStyle = '#83C167';
    ctx.beginPath(); ctx.arc(tww(wOpt), tbb(bOpt), 3, 0, Math.PI * 2); ctx.fill();

    // Alpha label
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`\u03B1 = ${alphas[canvasIdx]}`, W / 2, 15);

    // Cost value
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = pt.cost < 2000 ? '#83C167' : (pt.cost > 50000 ? '#FC6255' : '#FF862F');
    ctx.fillText(`J=${pt.cost.toFixed(0)}`, W / 2, 28);
  }

  function render() {
    for (let i = 0; i < 3; i++) drawPanel(i);
  }

  function animate() {
    if (!isPlaying) return;
    frameCounter++;
    if (frameCounter % 3 === 0) {
      if (currentStep < maxIters) {
        currentStep++;
        render();
      } else {
        isPlaying = false;
        playBtn.innerHTML = '&#9654; Animar';
        return;
      }
    }
    animId = requestAnimationFrame(animate);
  }

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      playBtn.innerHTML = '&#9654; Animar';
      if (animId) cancelAnimationFrame(animId);
    } else {
      if (currentStep >= maxIters) currentStep = 0;
      isPlaying = true;
      playBtn.innerHTML = '&#9208; Pausa';
      animate();
    }
  });

  resetBtn.addEventListener('click', () => {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    currentStep = 0;
    playBtn.innerHTML = '&#9654; Animar';
    render();
  });

  render();
}
