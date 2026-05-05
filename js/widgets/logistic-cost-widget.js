// ============================================================
// Logistic Cost Widget
// Shows -log(f) for y=1 and -log(1-f) for y=0
// Slider for f(x) value showing cost at that prediction
// ============================================================

function initLogisticCostWidget() {
  const canvas = document.getElementById('logistic-cost-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Two charts side by side
  const margin = 15;
  const chartW = (W - 3 * margin) / 2;
  const chartH = H - 100;
  const topY = 40;

  let fVal = 0.7; // current prediction value

  function drawChart(x0, title, costFn, color, highlightCorrect) {
    const ox = x0 + 50;
    const oy = topY + chartH;
    const pw = chartW - 70;
    const ph = chartH - 20;
    const fMin = 0.01, fMax = 0.99;
    const cMin = 0, cMax = 5;

    function tx(v) { return ox + (v - fMin) / (fMax - fMin) * pw; }
    function ty(v) { return oy - (v - cMin) / (cMax - cMin) * ph; }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1; i += 0.25) {
      ctx.beginPath(); ctx.moveTo(tx(i), oy); ctx.lineTo(tx(i), oy - ph); ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(ox, ty(i)); ctx.lineTo(ox + pw, ty(i)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#a8a290';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 1; i += 0.25) {
      ctx.fillText(i.toFixed(2), tx(i), oy + 14);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      ctx.fillText(i, ox - 5, ty(i) + 3);
    }

    // Title
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, ox + pw / 2, topY - 5);

    // Axis label
    ctx.fillStyle = '#ece6d0';
    ctx.font = '10px Fira Code';
    ctx.fillText('f(x)', ox + pw / 2, oy + 28);
    ctx.save();
    ctx.translate(x0 + 12, topY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();

    // Draw cost curve
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    const steps = 150;
    for (let i = 0; i <= steps; i++) {
      const f = fMin + (fMax - fMin) * i / steps;
      const c = Math.min(costFn(f), cMax);
      const px = tx(f), py = ty(c);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Highlight current f value
    const cost = Math.min(costFn(fVal), cMax);
    const dotX = tx(fVal);
    const dotY = ty(cost);

    // Vertical line to point
    ctx.strokeStyle = 'rgba(255,255,0,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(dotX, oy); ctx.lineTo(dotX, dotY); ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFF00';
    ctx.fill();

    // Cost value
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 11px Fira Code';
    ctx.textAlign = 'left';
    const costText = cost >= cMax ? '> 5' : cost.toFixed(2);
    ctx.fillText('L = ' + costText, dotX + 10, dotY - 5);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Draw both charts
    drawChart(
      margin,
      'y = 1: L = -log(f(x))',
      function(f) { return -Math.log(f); },
      '#58C4DD',
      true
    );

    drawChart(
      margin + chartW + margin,
      'y = 0: L = -log(1 - f(x))',
      function(f) { return -Math.log(1 - f); },
      '#FC6255',
      false
    );

    // Bottom info
    ctx.fillStyle = '#ece6d0';
    ctx.font = '12px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('f(x) = ' + fVal.toFixed(2), W / 2, H - 20);

    // Interpretation
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code';
    const leftCost = -Math.log(fVal);
    const rightCost = -Math.log(1 - fVal);
    if (fVal > 0.7) {
      ctx.fillText('Si y=1: bajo costo ✓  |  Si y=0: alto costo ✗', W / 2, H - 4);
    } else if (fVal < 0.3) {
      ctx.fillText('Si y=1: alto costo ✗  |  Si y=0: bajo costo ✓', W / 2, H - 4);
    } else {
      ctx.fillText('Predicción incierta → costo moderado en ambos casos', W / 2, H - 4);
    }
  }

  // Slider
  const slider = document.getElementById('logcost-f-slider');
  const fLabel = document.getElementById('logcost-f-value');
  if (slider) {
    slider.addEventListener('input', function() {
      fVal = parseFloat(this.value);
      if (fLabel) fLabel.textContent = fVal.toFixed(2);
      draw();
    });
  }

  draw();
}
