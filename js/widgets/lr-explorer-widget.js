// ============================================================
// Learning Rate Explorer Widget
// User adjusts alpha and sees ball bouncing on J(w) parabola
// ============================================================

function initLRExplorerWidget() {
  const canvas = document.getElementById('lr-explorer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const alphaSlider = document.getElementById('lr-explorer-alpha');
  const alphaVal = document.getElementById('lr-explorer-alpha-val');
  const playBtn = document.getElementById('lr-explorer-play');
  const stepBtn = document.getElementById('lr-explorer-step');
  const resetBtn = document.getElementById('lr-explorer-reset');

  // J(w) = (w - 3)^2 + 0.5
  // dJ/dw = 2(w - 3)
  const wOpt = 3, jMin = 0.5;
  function J(w) { return (w - wOpt) * (w - wOpt) + jMin; }

  // Layout
  const topH = H * 0.55;   // J(w) curve panel
  const botTop = H * 0.62;  // J vs iter panel
  const botH = H - botTop - 5;

  // J(w) curve area
  const wMin = -3, wMax = 9;
  const jMax = 12;
  const ox1 = 50, oy1 = topH - 15, pw1 = W - 70, ph1 = topH - 40;
  function twJ(w) { return ox1 + (w - wMin) / (wMax - wMin) * pw1; }
  function tyJ(j) { return oy1 - Math.min(1, j / jMax) * ph1; }

  // J vs iter area
  const maxIters = 40;
  const ox2 = 50, oy2 = H - 10, pw2 = W - 70, ph2 = botH - 20;
  function txI(i) { return ox2 + (i / maxIters) * pw2; }
  function tyI(j) { return oy2 - Math.min(1, j / jMax) * ph2; }

  // State
  let trajectory = [];
  let currentStep = 0;
  let isPlaying = false;
  let animId = null;
  let frameCounter = 0;

  function computeTrajectory() {
    const alpha = parseFloat(alphaSlider.value);
    trajectory = [];
    let w = 0; // start at w=0
    for (let i = 0; i <= maxIters; i++) {
      const cost = J(w);
      trajectory.push({ w, cost: Math.min(cost, 200), iter: i });
      // GD update
      const grad = 2 * (w - wOpt);
      w = w - alpha * grad;
      // Clamp to prevent NaN
      if (Math.abs(w) > 50) {
        w = w > 0 ? 50 : -50;
      }
    }
  }

  function getStatusColor(alpha) {
    if (alpha < 0.3) return '#FF862F';     // slow - orange
    if (alpha <= 0.7) return '#83C167';     // good - green
    if (alpha <= 1.0) return '#FFFF00';     // oscillating - yellow
    return '#FC6255';                        // diverge - red
  }

  function getStatusText(alpha) {
    if (alpha < 0.3) return 'Convergencia lenta';
    if (alpha <= 0.7) return 'Convergencia rápida';
    if (alpha <= 1.0) return 'Oscilación (converge)';
    return 'Diverge!';
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const alpha = parseFloat(alphaSlider.value);
    const statusColor = getStatusColor(alpha);
    const step = Math.min(currentStep, trajectory.length - 1);
    const pt = trajectory[step];

    // ===== TOP: J(w) curve =====
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let w = -2; w <= 8; w += 2) {
      ctx.beginPath(); ctx.moveTo(twJ(w), oy1); ctx.lineTo(twJ(w), oy1 - ph1); ctx.stroke();
    }
    for (let j = 0; j <= 10; j += 2) {
      ctx.beginPath(); ctx.moveTo(ox1, tyJ(j)); ctx.lineTo(ox1 + pw1, tyJ(j)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox1, oy1 - ph1); ctx.lineTo(ox1, oy1); ctx.lineTo(ox1 + pw1, oy1); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let w = -2; w <= 8; w += 2) ctx.fillText(w, twJ(w), oy1 + 12);
    ctx.fillText('w', ox1 + pw1 / 2, oy1 + 24);
    ctx.textAlign = 'right';
    for (let j = 0; j <= 10; j += 4) ctx.fillText(j, ox1 - 5, tyJ(j) + 4);
    ctx.save();
    ctx.translate(12, oy1 - ph1 / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('J(w)', 0, 0);
    ctx.restore();

    // Draw J(w) parabola
    ctx.strokeStyle = '#58C4DD'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= pw1; px += 2) {
      const w = wMin + (px / pw1) * (wMax - wMin);
      const j = J(w);
      const sy = tyJ(j);
      if (sy >= oy1 - ph1 - 5 && sy <= oy1 + 5) {
        if (first) { ctx.moveTo(ox1 + px, sy); first = false; }
        else ctx.lineTo(ox1 + px, sy);
      } else {
        first = true;
      }
    }
    ctx.stroke();

    // Minimum marker
    ctx.fillStyle = '#83C167';
    ctx.beginPath(); ctx.arc(twJ(wOpt), tyJ(jMin), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(131,193,103,0.5)';
    ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('mín', twJ(wOpt) + 8, tyJ(jMin) + 4);

    // Draw previous steps as faded dots
    if (step > 0) {
      for (let i = 0; i < step && i < trajectory.length; i++) {
        const p = trajectory[i];
        const px = twJ(p.w), py = tyJ(p.cost);
        if (px >= ox1 && px <= ox1 + pw1 && py >= oy1 - ph1 && py <= oy1) {
          ctx.fillStyle = `rgba(252,98,85,${0.2 + 0.5 * (i / step)})`;
          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
        }
        // Draw step arrows
        if (i < step - 1) {
          const p2 = trajectory[i + 1];
          const px2 = twJ(p2.w), py2 = tyJ(p2.cost);
          if (px >= ox1 - 5 && px <= ox1 + pw1 + 5 && px2 >= ox1 - 5 && px2 <= ox1 + pw1 + 5) {
            ctx.strokeStyle = `rgba(252,98,85,${0.15 + 0.3 * (i / step)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px2, py2); ctx.stroke();
          }
        }
      }
    }

    // Current ball
    const bx = twJ(pt.w), by = tyJ(pt.cost);
    if (bx >= ox1 - 10 && bx <= ox1 + pw1 + 10 && by >= oy1 - ph1 - 10 && by <= oy1 + 10) {
      // Glow
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,0,0.15)`;
      ctx.fill();
      // Ball
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.fill();
    }

    // Vertical dashed line from ball to x-axis
    if (bx >= ox1 && bx <= ox1 + pw1) {
      ctx.strokeStyle = 'rgba(255,255,0,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(bx, Math.max(by, oy1 - ph1)); ctx.lineTo(bx, oy1); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ===== DIVIDER =====
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox1, botTop - 8); ctx.lineTo(ox1 + pw1, botTop - 8); ctx.stroke();

    // ===== BOTTOM: J vs iteration =====
    // Axes
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox2, oy2 - ph2); ctx.lineTo(ox2, oy2); ctx.lineTo(ox2 + pw2, oy2); ctx.stroke();

    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('iteraciones', ox2 + pw2 / 2, oy2 + 12);
    ctx.textAlign = 'right';
    ctx.fillText('J', ox2 - 8, oy2 - ph2 / 2 + 4);

    // Tick marks
    ctx.textAlign = 'center';
    ctx.font = '8px Fira Code, monospace';
    for (let i = 0; i <= maxIters; i += 10) ctx.fillText(i, txI(i), oy2 + 10);

    // Cost curve
    if (step > 0) {
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= step && i < trajectory.length; i++) {
        const x = txI(i);
        const y = tyI(trajectory[i].cost);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Current iteration dot
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath(); ctx.arc(txI(step), tyI(pt.cost), 4, 0, Math.PI * 2); ctx.fill();

    // ===== INFO OVERLAY =====
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(getStatusText(alpha), W - 15, 18);

    ctx.fillStyle = '#ece6d0';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText(`iter: ${step}  w=${pt.w.toFixed(2)}  J=${pt.cost.toFixed(2)}`, W - 15, 34);
  }

  function animate() {
    if (!isPlaying) return;
    frameCounter++;
    if (frameCounter % 4 === 0) {
      if (currentStep < maxIters) {
        currentStep++;
        draw();
      } else {
        isPlaying = false;
        playBtn.innerHTML = '&#9654; Iniciar';
        return;
      }
    }
    animId = requestAnimationFrame(animate);
  }

  // Controls
  alphaSlider.addEventListener('input', () => {
    alphaVal.textContent = parseFloat(alphaSlider.value).toFixed(2);
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    currentStep = 0;
    playBtn.innerHTML = '&#9654; Iniciar';
    computeTrajectory();
    draw();
  });

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      playBtn.innerHTML = '&#9654; Continuar';
      if (animId) cancelAnimationFrame(animId);
    } else {
      if (currentStep >= maxIters) {
        currentStep = 0;
      }
      isPlaying = true;
      playBtn.innerHTML = '&#9208; Pausa';
      animate();
    }
  });

  stepBtn.addEventListener('click', () => {
    if (currentStep < maxIters) {
      currentStep++;
      draw();
    }
  });

  resetBtn.addEventListener('click', () => {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    currentStep = 0;
    playBtn.innerHTML = '&#9654; Iniciar';
    draw();
  });

  // Initialize
  computeTrajectory();
  draw();
}
