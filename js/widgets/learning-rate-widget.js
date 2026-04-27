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
  const alphas = [0.001, 0.1, 0.8];
  const maxIters = 150;

  function computeCostLocal(w, b) {
    let cost = 0;
    for (let i = 0; i < m; i++) {
      const err = w * xData[i] + b - yData[i];
      cost += err * err;
    }
    return cost / (2 * m);
  }

  function computeGradient(w, b) {
    let dw = 0, db = 0;
    for (let i = 0; i < m; i++) {
      const err = w * xData[i] + b - yData[i];
      dw += err * xData[i];
      db += err;
    }
    return { dw: dw / m, db: db / m };
  }

  // Precompute trajectories for each alpha
  const trajectories = alphas.map(alpha => {
    const traj = [];
    let w = 0, b = 0;
    for (let iter = 0; iter <= maxIters; iter++) {
      const cost = computeCostLocal(w, b);
      traj.push({ w, b, cost: Math.min(cost, 200000), iter });
      if (cost > 1e10) break; // Diverged
      const grad = computeGradient(w, b);
      w = w - alpha * grad.dw;
      b = b - alpha * grad.db;
    }
    return traj;
  });

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
    const maxCost = Math.min(100000, Math.max(...traj.slice(0, Math.min(step + 1, traj.length)).map(p => p.cost)));

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

    // Mini contour (simplified)
    const wMin = -100, wMax = 450, bMin = -150, bMax = 350;
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
      ctx.moveTo(tww(traj[0].w), tbb(traj[0].b));
      for (let i = 1; i <= step && i < traj.length; i++) {
        const tw = tww(traj[i].w), tb = tbb(traj[i].b);
        // Clamp to canvas
        if (tw < bOx - 20 || tw > bOx + bpw + 20 || tb < box - 20 || tb > box + bph + 20) break;
        ctx.lineTo(tw, tb);
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
    ctx.beginPath(); ctx.arc(tww(200), tbb(100), 3, 0, Math.PI * 2); ctx.fill();

    // Alpha label
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`α = ${alphas[canvasIdx]}`, W / 2, 15);

    // Cost value
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = pt.cost < 10 ? '#83C167' : (pt.cost > 50000 ? '#FC6255' : '#FF862F');
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
