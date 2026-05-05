// ============================================================
// KNN Widget
// Interactive K-Nearest Neighbors visualization
// Click to classify a new point, slider for K
// ============================================================

function initKNNWidget(data) {
  const canvas = document.getElementById('knn-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const class0 = data.class0;
  const class1 = data.class1;
  const labels = data.labels || ['Clase 0', 'Clase 1'];

  // Chart area
  const ox = 50, oy = H - 50;
  const pw = W - 260, ph = H - 90;
  const xMin = 0, xMax = 7, yMin = 0, yMax = 7;

  let K = 3;
  let queryPoint = null;
  let neighbors = [];

  function tx(v) { return ox + (v - xMin) / (xMax - xMin) * pw; }
  function ty(v) { return oy - (v - yMin) / (yMax - yMin) * ph; }
  function fromCanvasX(cx) { return xMin + (cx - ox) / pw * (xMax - xMin); }
  function fromCanvasY(cy) { return yMax - (cy - (oy - ph)) / ph * (yMax - yMin); }

  function euclidean(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }

  function classify(point) {
    // Combine all points with labels
    const all = [];
    class0.forEach(p => all.push({ x: p[0], y: p[1], cls: 0 }));
    class1.forEach(p => all.push({ x: p[0], y: p[1], cls: 1 }));

    // Sort by distance
    all.sort((a, b) => euclidean([a.x, a.y], point) - euclidean([b.x, b.y], point));

    // Take K nearest
    const kNearest = all.slice(0, K);
    neighbors = kNearest;

    // Vote
    let votes = [0, 0];
    kNearest.forEach(n => votes[n.cls]++);
    return votes[1] > votes[0] ? 1 : 0;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

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

    // Axis labels
    ctx.fillStyle = '#a8a290';
    ctx.font = '12px Fira Code, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, tx(i), oy + 18);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 7; i++) {
      ctx.fillText(i, ox - 8, ty(i) + 4);
    }

    // Draw radius circle if query point exists
    if (queryPoint && neighbors.length > 0) {
      const lastNeighbor = neighbors[neighbors.length - 1];
      const radius = euclidean([lastNeighbor.x, lastNeighbor.y], queryPoint);
      const rPx = radius / (xMax - xMin) * pw;
      ctx.beginPath();
      ctx.arc(tx(queryPoint[0]), ty(queryPoint[1]), rPx, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw lines to neighbors
      neighbors.forEach(n => {
        ctx.beginPath();
        ctx.moveTo(tx(queryPoint[0]), ty(queryPoint[1]));
        ctx.lineTo(tx(n.x), ty(n.y));
        ctx.strokeStyle = n.cls === 0 ? 'rgba(88,196,221,0.4)' : 'rgba(252,98,85,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // Draw class 0 points
    class0.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 8, 0, Math.PI * 2);
      ctx.fillStyle = '#58C4DD';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw class 1 points
    class1.forEach(p => {
      ctx.beginPath();
      ctx.arc(tx(p[0]), ty(p[1]), 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Highlight neighbors
    if (queryPoint && neighbors.length > 0) {
      neighbors.forEach(n => {
        ctx.beginPath();
        ctx.arc(tx(n.x), ty(n.y), 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
    }

    // Draw query point
    if (queryPoint) {
      const result = classify(queryPoint);
      ctx.beginPath();
      ctx.arc(tx(queryPoint[0]), ty(queryPoint[1]), 10, 0, Math.PI * 2);
      ctx.fillStyle = result === 0 ? '#58C4DD' : '#FC6255';
      ctx.fill();
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw ? inside
      ctx.fillStyle = '#1b1b2f';
      ctx.font = 'bold 12px Fira Code';
      ctx.textAlign = 'center';
      ctx.fillText('?', tx(queryPoint[0]), ty(queryPoint[1]) + 4);
    }

    // Legend / Info panel
    const infoX = ox + pw + 20;
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 14px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('K-Nearest Neighbors', infoX, 35);

    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD';
    ctx.fillText('● ' + labels[0], infoX, 65);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('● ' + labels[1], infoX, 85);

    ctx.fillStyle = '#a8a290';
    ctx.fillText('K = ' + K, infoX, 115);

    if (queryPoint) {
      const result = classify(queryPoint);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('Resultado:', infoX, 145);
      ctx.fillStyle = result === 0 ? '#58C4DD' : '#FC6255';
      ctx.fillText(labels[result], infoX, 165);

      // Vote counts
      let votes = [0, 0];
      neighbors.forEach(n => votes[n.cls]++);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('Votos:', infoX, 195);
      ctx.fillStyle = '#58C4DD';
      ctx.fillText(labels[0] + ': ' + votes[0], infoX, 215);
      ctx.fillStyle = '#FC6255';
      ctx.fillText(labels[1] + ': ' + votes[1], infoX, 235);
    } else {
      ctx.fillStyle = '#a8a290';
      ctx.font = '11px Fira Code';
      ctx.fillText('Click para', infoX, 145);
      ctx.fillText('clasificar', infoX, 163);
      ctx.fillText('un punto', infoX, 181);
    }
  }

  // Click handler
  canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const px = fromCanvasX(cx);
    const py = fromCanvasY(cy);

    if (px >= xMin && px <= xMax && py >= yMin && py <= yMax) {
      queryPoint = [px, py];
      neighbors = [];
      classify(queryPoint);
      draw();
    }
  });

  // K slider
  const slider = document.getElementById('knn-k-slider');
  const kLabel = document.getElementById('knn-k-value');
  if (slider) {
    slider.addEventListener('input', function() {
      K = parseInt(this.value);
      if (kLabel) kLabel.textContent = K;
      if (queryPoint) classify(queryPoint);
      draw();
    });
  }

  draw();
}
