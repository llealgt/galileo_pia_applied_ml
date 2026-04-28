// ============================================================
// Feature Scaling Widget
// Dual contour plot: unscaled (elliptical) vs scaled (circular)
// Shows GD path convergence comparison
// ============================================================

function initFeatureScalingWidget() {
  const canvas = document.getElementById('feature-scaling-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Two panels side by side
  const panelW = W / 2 - 15;
  const panelH = H - 60;
  const leftX = 10, rightX = W / 2 + 5;
  const topY = 40;

  // Contour parameters
  // Unscaled: J(w1, w2) = 50*(w1-3)^2 + 2*(w2-200)^2  (very elongated)
  // Scaled: J(w1, w2) = 10*(w1-0.5)^2 + 10*(w2-0.3)^2  (circular)

  // GD paths (precomputed)
  const unscaledPath = computeGDPath(
    (w1, w2) => 50 * (w1 - 3) ** 2 + 2 * (w2 - 200) ** 2,
    (w1, w2) => [100 * (w1 - 3), 4 * (w2 - 200)],
    [0, 50], 0.003, 60
  );

  const scaledPath = computeGDPath(
    (w1, w2) => 10 * (w1 - 0.5) ** 2 + 10 * (w2 - 0.3) ** 2,
    (w1, w2) => [20 * (w1 - 0.5), 20 * (w2 - 0.3)],
    [-0.8, -0.6], 0.04, 30
  );

  function computeGDPath(costFn, gradFn, start, alpha, maxIter) {
    const path = [{ w1: start[0], w2: start[1], cost: costFn(start[0], start[1]) }];
    let w1 = start[0], w2 = start[1];
    for (let i = 0; i < maxIter; i++) {
      const [g1, g2] = gradFn(w1, w2);
      w1 -= alpha * g1;
      w2 -= alpha * g2;
      path.push({ w1, w2, cost: costFn(w1, w2) });
    }
    return path;
  }

  // Animation state
  let step = 0;
  let maxStep = Math.max(unscaledPath.length, scaledPath.length) - 1;
  let playing = false;
  let animId = null;

  function drawContour(ox, oy, w, h, costFn, w1Range, w2Range, levels, title, path, currentStep, optW1, optW2) {
    // Background
    ctx.fillStyle = 'rgba(13,13,26,0.7)';
    ctx.fillRect(ox, oy, w, h);
    ctx.strokeStyle = 'rgba(88,196,221,0.15)';
    ctx.strokeRect(ox, oy, w, h);

    // Title
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, ox + w / 2, oy - 5);

    // Mapping functions
    const mapX = (v) => ox + 30 + ((v - w1Range[0]) / (w1Range[1] - w1Range[0])) * (w - 50);
    const mapY = (v) => oy + h - 25 - ((v - w2Range[0]) / (w2Range[1] - w2Range[0])) * (h - 45);

    // Draw contour lines
    const resolution = 60;
    for (let l = 0; l < levels.length; l++) {
      const level = levels[l];
      const alpha = 0.15 + (1 - l / levels.length) * 0.35;
      ctx.strokeStyle = `rgba(88,196,221,${alpha})`;
      ctx.lineWidth = 0.8;

      // Simple contour: scan grid for boundary crossings
      for (let i = 0; i < resolution; i++) {
        const w1 = w1Range[0] + (i / resolution) * (w1Range[1] - w1Range[0]);
        for (let j = 0; j < resolution; j++) {
          const w2 = w2Range[0] + (j / resolution) * (w2Range[1] - w2Range[0]);
          const v = costFn(w1, w2);
          const dw1 = (w1Range[1] - w1Range[0]) / resolution;
          const dw2 = (w2Range[1] - w2Range[0]) / resolution;
          const vr = costFn(w1 + dw1, w2);
          const vb = costFn(w1, w2 + dw2);

          if ((v <= level && vr > level) || (v > level && vr <= level)) {
            ctx.fillStyle = `rgba(88,196,221,${alpha})`;
            ctx.fillRect(mapX(w1), mapY(w2), 2, 2);
          }
          if ((v <= level && vb > level) || (v > level && vb <= level)) {
            ctx.fillStyle = `rgba(88,196,221,${alpha})`;
            ctx.fillRect(mapX(w1), mapY(w2), 2, 2);
          }
        }
      }
    }

    // Draw optimal point
    ctx.beginPath();
    ctx.arc(mapX(optW1), mapY(optW2), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#83C167';
    ctx.fill();
    ctx.strokeStyle = '#1b1b2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw GD path
    const nSteps = Math.min(currentStep + 1, path.length);
    if (nSteps > 1) {
      ctx.strokeStyle = '#FC6255';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mapX(path[0].w1), mapY(path[0].w2));
      for (let i = 1; i < nSteps; i++) {
        ctx.lineTo(mapX(path[i].w1), mapY(path[i].w2));
      }
      ctx.stroke();

      // Draw points along path
      for (let i = 0; i < nSteps; i++) {
        ctx.beginPath();
        ctx.arc(mapX(path[i].w1), mapY(path[i].w2), i === nSteps - 1 ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = i === nSteps - 1 ? '#FFFF00' : '#FC6255';
        ctx.fill();
      }
    } else if (nSteps === 1) {
      ctx.beginPath();
      ctx.arc(mapX(path[0].w1), mapY(path[0].w2), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('w₁', ox + w / 2, oy + h - 3);
    ctx.save();
    ctx.translate(ox + 10, oy + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('w₂', 0, 0);
    ctx.restore();

    // Step count
    ctx.fillStyle = '#FFFF00';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'right';
    const stepsShown = Math.min(currentStep, path.length - 1);
    ctx.fillText('Paso: ' + stepsShown, ox + w - 10, oy + 15);
    if (stepsShown < path.length) {
      ctx.fillStyle = '#a8a290';
      ctx.fillText('J = ' + path[stepsShown].cost.toFixed(1), ox + w - 10, oy + 28);
    }
  }

  function draw() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Unscaled contour (left)
    const unscaledLevels = [100, 500, 2000, 5000, 15000, 40000, 80000];
    drawContour(
      leftX, topY, panelW, panelH,
      (w1, w2) => 50 * (w1 - 3) ** 2 + 2 * (w2 - 200) ** 2,
      [-1, 7], [-50, 450],
      unscaledLevels,
      'Sin Feature Scaling',
      unscaledPath, step,
      3, 200
    );

    // Scaled contour (right)
    const scaledLevels = [0.1, 0.5, 1.5, 3, 6, 10, 15];
    drawContour(
      rightX, topY, panelW, panelH,
      (w1, w2) => 10 * (w1 - 0.5) ** 2 + 10 * (w2 - 0.3) ** 2,
      [-1, 2], [-1, 1.5],
      scaledLevels,
      'Con Feature Scaling (Z-score)',
      scaledPath, step,
      0.5, 0.3
    );

    // Controls
    const btnY = H - 15;
    drawBtn(W / 2 - 100, btnY, 60, playing ? '⏸ Pause' : '▶ Play');
    drawBtn(W / 2 - 30, btnY, 60, '↺ Reset');
    drawBtn(W / 2 + 40, btnY, 60, '→ Step');
  }

  function drawBtn(x, y, w, text) {
    ctx.fillStyle = 'rgba(88,196,221,0.1)';
    ctx.strokeStyle = '#58C4DD';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y - 16, w, 20);
    ctx.strokeRect(x, y - 16, w, 20);
    ctx.fillStyle = '#58C4DD';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y - 1);
  }

  function animateStep() {
    if (!playing) return;
    step++;
    if (step >= maxStep) {
      step = maxStep;
      playing = false;
    }
    draw();
    if (playing) {
      animId = setTimeout(animateStep, 200);
    }
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const btnY = H - 15;

    if (my >= btnY - 18 && my <= btnY + 6) {
      // Play/Pause
      if (mx >= W / 2 - 100 && mx <= W / 2 - 40) {
        playing = !playing;
        if (playing) {
          if (step >= maxStep) step = 0;
          animateStep();
        } else {
          if (animId) clearTimeout(animId);
        }
        draw();
      }
      // Reset
      if (mx >= W / 2 - 30 && mx <= W / 2 + 30) {
        playing = false;
        if (animId) clearTimeout(animId);
        step = 0;
        draw();
      }
      // Step
      if (mx >= W / 2 + 40 && mx <= W / 2 + 100) {
        playing = false;
        if (animId) clearTimeout(animId);
        if (step < maxStep) step++;
        draw();
      }
    }
  });

  draw();
}
