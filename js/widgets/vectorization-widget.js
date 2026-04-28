// ============================================================
// Vectorization Widget
// Animated comparison: sequential loop vs parallel dot product
// ============================================================

function initVectorizationWidget() {
  const canvas = document.getElementById('vectorization-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const N = 8; // number of elements
  const w = [0.2, 1.5, -0.7, 3.1, 0.4, -1.2, 2.8, 0.6];
  const x = [1.0, 2.0, 3.0, 0.5, 1.5, 2.5, 0.8, 1.2];

  // State
  let loopStep = -1;     // -1 = not started, 0..N-1 = computing, N = done
  let dotStep = -1;      // -1 = not started, 0 = computing all, 1 = done
  let animating = false;
  let animId = null;
  let loopPartial = 0;
  let dotResult = 0;

  // Precompute
  const products = w.map((wi, i) => wi * x[i]);
  const totalSum = products.reduce((a, b) => a + b, 0);

  // Layout
  const colW = W / 2 - 20;
  const leftX = 15;
  const rightX = W / 2 + 5;
  const topY = 50;
  const cellH = 32;
  const cellW = colW - 20;

  function draw() {
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 10);
    ctx.lineTo(W / 2, H - 10);
    ctx.stroke();

    // Titles
    ctx.font = 'bold 14px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FC6255';
    ctx.fillText('Loop (secuencial)', leftX + colW / 2, 25);
    ctx.fillStyle = '#83C167';
    ctx.fillText('np.dot (paralelo)', rightX + colW / 2, 25);

    // Draw loop side
    for (let i = 0; i < N; i++) {
      const y = topY + i * cellH;
      let bg = 'rgba(255,255,255,0.03)';
      let textColor = '#a8a290';

      if (i < loopStep) {
        bg = 'rgba(88,196,221,0.15)';
        textColor = '#58C4DD';
      } else if (i === loopStep && loopStep < N) {
        bg = 'rgba(252,98,85,0.25)';
        textColor = '#FFFF00';
      }

      // Cell background
      ctx.fillStyle = bg;
      ctx.fillRect(leftX + 5, y, cellW, cellH - 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeRect(leftX + 5, y, cellW, cellH - 4);

      // Text
      ctx.fillStyle = textColor;
      ctx.font = '11px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `f += w[${i}]×x[${i}] = ${w[i].toFixed(1)}×${x[i].toFixed(1)} = ${products[i].toFixed(2)}`,
        leftX + 10, y + 19
      );

      // Arrow showing sequence
      if (i < N - 1 && i < loopStep) {
        ctx.fillStyle = '#58C4DD';
        ctx.beginPath();
        ctx.moveTo(leftX + cellW + 8, y + cellH / 2);
        ctx.lineTo(leftX + cellW + 8, y + cellH - 2);
        ctx.lineTo(leftX + cellW + 12, y + cellH - 6);
        ctx.fill();
      }
    }

    // Loop result
    const loopResY = topY + N * cellH + 10;
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center';
    if (loopStep >= N) {
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('f = ' + totalSum.toFixed(2) + ' ✓', leftX + colW / 2, loopResY);
    } else if (loopStep >= 0) {
      ctx.fillStyle = '#FC6255';
      ctx.fillText('f = ' + loopPartial.toFixed(2) + ' (parcial)', leftX + colW / 2, loopResY);
    } else {
      ctx.fillStyle = '#a8a290';
      ctx.fillText('f = 0 (esperando...)', leftX + colW / 2, loopResY);
    }

    // Draw dot product side
    for (let i = 0; i < N; i++) {
      const y = topY + i * cellH;
      let bg = 'rgba(255,255,255,0.03)';
      let textColor = '#a8a290';

      if (dotStep === 0) {
        bg = 'rgba(131,193,103,0.2)';
        textColor = '#FFFF00';
      } else if (dotStep >= 1) {
        bg = 'rgba(131,193,103,0.15)';
        textColor = '#83C167';
      }

      ctx.fillStyle = bg;
      ctx.fillRect(rightX + 5, y, cellW, cellH - 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeRect(rightX + 5, y, cellW, cellH - 4);

      ctx.fillStyle = textColor;
      ctx.font = '11px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `w[${i}]×x[${i}] = ${w[i].toFixed(1)}×${x[i].toFixed(1)} = ${products[i].toFixed(2)}`,
        rightX + 10, y + 19
      );
    }

    // Dot result
    const dotResY = topY + N * cellH + 10;
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center';
    if (dotStep >= 1) {
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('f = ' + totalSum.toFixed(2) + ' ✓', rightX + colW / 2, dotResY);
    } else if (dotStep === 0) {
      ctx.fillStyle = '#83C167';
      ctx.fillText('Σ = calculando...', rightX + colW / 2, dotResY);
    } else {
      ctx.fillStyle = '#a8a290';
      ctx.fillText('f = ? (esperando...)', rightX + colW / 2, dotResY);
    }

    // Time comparison bar at bottom
    const barY = H - 35;
    const barMaxW = (W - 60) / 2 - 20;

    // Loop time bar
    const loopProgress = loopStep < 0 ? 0 : Math.min(1, loopStep / N);
    ctx.fillStyle = 'rgba(252,98,85,0.3)';
    ctx.fillRect(leftX + 5, barY, barMaxW, 16);
    ctx.fillStyle = '#FC6255';
    ctx.fillRect(leftX + 5, barY, barMaxW * loopProgress, 16);
    ctx.fillStyle = '#ece6d0';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tiempo: ' + (loopStep < 0 ? '0' : loopStep) + '/' + N + ' pasos', leftX + 5 + barMaxW / 2, barY + 12);

    // Dot time bar
    const dotProgress = dotStep < 0 ? 0 : dotStep >= 1 ? 1 : 0.5;
    ctx.fillStyle = 'rgba(131,193,103,0.3)';
    ctx.fillRect(rightX + 5, barY, barMaxW, 16);
    ctx.fillStyle = '#83C167';
    ctx.fillRect(rightX + 5, barY, barMaxW * dotProgress, 16);
    ctx.fillStyle = '#ece6d0';
    ctx.fillText('Tiempo: ' + (dotStep < 0 ? '0' : '1') + '/1 paso', rightX + 5 + barMaxW / 2, barY + 12);

    // Buttons
    drawButton(W / 2 - 50, H - 20, 100, 'Play ▶', animating);
  }

  function drawButton(x, y, w, text, active) {
    ctx.fillStyle = active ? 'rgba(88,196,221,0.3)' : 'rgba(88,196,221,0.1)';
    ctx.strokeStyle = '#58C4DD';
    ctx.lineWidth = 1;
    const bh = 22;
    ctx.fillRect(x, y - bh + 4, w, bh);
    ctx.strokeRect(x, y - bh + 4, w, bh);
    ctx.fillStyle = '#58C4DD';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y - 2);
  }

  function animate() {
    if (!animating) return;

    // Advance loop
    if (loopStep < N) {
      loopStep++;
      if (loopStep <= N - 1) {
        loopPartial += products[loopStep];
      }
    }

    // Start dot after 2 loop steps to show contrast
    if (loopStep === 2 && dotStep < 0) {
      dotStep = 0;
    }
    if (loopStep === 3 && dotStep === 0) {
      dotStep = 1;
      dotResult = totalSum;
    }

    draw();

    if (loopStep >= N) {
      animating = false;
      draw();
      return;
    }

    animId = setTimeout(animate, 400);
  }

  function reset() {
    animating = false;
    if (animId) clearTimeout(animId);
    loopStep = -1;
    dotStep = -1;
    loopPartial = 0;
    dotResult = 0;
    draw();
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    // Play button
    if (mx >= W / 2 - 50 && mx <= W / 2 + 50 && my >= H - 38 && my <= H - 8) {
      if (animating) {
        animating = false;
        if (animId) clearTimeout(animId);
      } else if (loopStep >= N) {
        reset();
        setTimeout(() => {
          animating = true;
          animate();
        }, 200);
      } else {
        animating = true;
        animate();
      }
    }
  });

  draw();
}
