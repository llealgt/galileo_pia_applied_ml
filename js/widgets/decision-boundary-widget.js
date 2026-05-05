// ============================================================
// Decision Boundary Widget
// Interactive visualization of logistic regression decision boundary
// Sliders for w1, w2, b — shows linear boundary separating 2 classes
// ============================================================

function initDecisionBoundaryWidget(data) {
  const canvas = document.getElementById('decision-boundary-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const class0 = data.class0;
  const class1 = data.class1;
  const labels = data.labels || ['Clase 0', 'Clase 1'];

  // Chart area
  const ox = 50, oy = H - 45;
  const pw = W - 240, ph = H - 80;
  const xMin = -0.5, xMax = 7, yMin = -0.5, yMax = 7;

  let w1 = 1.0, w2 = 1.0, bias = -12.0;

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Color regions (pixel-level classification)
    const imgData = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        // Convert pixel to data coords
        const x1 = xMin + (px - ox) / pw * (xMax - xMin);
        const x2 = yMax - (py - (oy - ph)) / ph * (yMax - yMin);

        if (px >= ox && px <= ox + pw && py >= oy - ph && py <= oy) {
          const z = w1 * x1 + w2 * x2 + bias;
          const idx = (py * W + px) * 4;
          if (z >= 0) {
            // Class 1 region (red tint)
            imgData.data[idx] = 252;
            imgData.data[idx + 1] = 98;
            imgData.data[idx + 2] = 85;
            imgData.data[idx + 3] = 20;
          } else {
            // Class 0 region (blue tint)
            imgData.data[idx] = 88;
            imgData.data[idx + 1] = 196;
            imgData.data[idx + 2] = 221;
            imgData.data[idx + 3] = 20;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
      ctx.beginPath(); ctx.moveTo(tx(i), oy); ctx.lineTo(tx(i), oy - ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, ty(i)); ctx.lineTo(ox + pw, ty(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();

    ctx.fillStyle = '#a8a290';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, tx(i), oy + 15);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, ox - 6, ty(i) + 4);
    }

    // Axis labels
    ctx.fillStyle = '#ece6d0';
    ctx.font = '12px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText('x₁', ox + pw / 2, oy + 32);
    ctx.save();
    ctx.translate(14, oy - ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();

    // Decision boundary line: w1*x1 + w2*x2 + b = 0
    // => x2 = -(w1*x1 + b) / w2  (if w2 != 0)
    if (Math.abs(w2) > 0.01) {
      const x1Start = xMin;
      const x1End = xMax;
      const x2Start = -(w1 * x1Start + bias) / w2;
      const x2End = -(w1 * x1End + bias) / w2;

      ctx.beginPath();
      ctx.moveTo(tx(x1Start), ty(x2Start));
      ctx.lineTo(tx(x1End), ty(x2End));
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (Math.abs(w1) > 0.01) {
      // Vertical line: x1 = -b/w1
      const xBound = -bias / w1;
      ctx.beginPath();
      ctx.moveTo(tx(xBound), ty(yMin));
      ctx.lineTo(tx(xBound), ty(yMax));
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw class 0 points
    class0.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 7, 0, Math.PI * 2);
      ctx.fillStyle = '#58C4DD';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw class 1 points
    class1.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Info panel
    const infoX = ox + pw + 20;
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Frontera de Decisión', infoX, 30);

    ctx.font = '11px Fira Code';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('w₁x₁+w₂x₂+b = 0', infoX, 55);

    ctx.fillStyle = '#83C167';
    ctx.font = '11px Fira Code';
    ctx.fillText('w₁ = ' + w1.toFixed(1), infoX, 85);
    ctx.fillText('w₂ = ' + w2.toFixed(1), infoX, 105);
    ctx.fillText('b  = ' + bias.toFixed(1), infoX, 125);

    ctx.fillStyle = '#58C4DD';
    ctx.fillText('● ' + labels[0], infoX, 155);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('● ' + labels[1], infoX, 175);

    // Classification accuracy
    let correct = 0, total = class0.length + class1.length;
    class0.forEach(p => { if (w1 * p[0] + w2 * p[1] + bias < 0) correct++; });
    class1.forEach(p => { if (w1 * p[0] + w2 * p[1] + bias >= 0) correct++; });
    const acc = (correct / total * 100).toFixed(0);

    ctx.fillStyle = '#a8a290';
    ctx.fillText('Accuracy:', infoX, 205);
    ctx.fillStyle = acc == 100 ? '#83C167' : '#FF862F';
    ctx.font = 'bold 14px Fira Code';
    ctx.fillText(acc + '%', infoX, 225);
  }

  // Sliders
  const w1Slider = document.getElementById('db-w1-slider');
  const w2Slider = document.getElementById('db-w2-slider');
  const bSlider = document.getElementById('db-b-slider');
  const w1Label = document.getElementById('db-w1-value');
  const w2Label = document.getElementById('db-w2-value');
  const bLabel = document.getElementById('db-b-value');

  if (w1Slider) {
    w1Slider.addEventListener('input', function() {
      w1 = parseFloat(this.value);
      if (w1Label) w1Label.textContent = w1.toFixed(1);
      draw();
    });
  }
  if (w2Slider) {
    w2Slider.addEventListener('input', function() {
      w2 = parseFloat(this.value);
      if (w2Label) w2Label.textContent = w2.toFixed(1);
      draw();
    });
  }
  if (bSlider) {
    bSlider.addEventListener('input', function() {
      bias = parseFloat(this.value);
      if (bLabel) bLabel.textContent = bias.toFixed(1);
      draw();
    });
  }

  draw();
}
