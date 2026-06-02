// ============================================================
// Activation Functions Widget — Linear, Sigmoid, ReLU
// Grafica las tres funciones; checkboxes para mostrar/ocultar cada una
// y un slider de z que marca el punto g(z) sobre cada curva.
// ============================================================

function initActivationFunctions() {
  const canvas = document.getElementById('activation-fn-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const cbLin = document.getElementById('af-linear');
  const cbSig = document.getElementById('af-sigmoid');
  const cbRelu = document.getElementById('af-relu');
  const zSlider = document.getElementById('af-z');
  const zVal = document.getElementById('af-z-val');

  // rango de ejes
  const zMin = -6, zMax = 6, yMin = -2, yMax = 3;
  const pad = { l: 50, r: 20, t: 20, b: 36 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const px = z => pad.l + (z - zMin) / (zMax - zMin) * pw;
  const py = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;

  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const relu = z => Math.max(0, z);
  const linear = z => z;

  const FNS = [
    { key: 'linear', cb: cbLin, color: '#FF862F', name: 'Linear  g(z)=z', f: linear },
    { key: 'sigmoid', cb: cbSig, color: '#58C4DD', name: 'Sigmoid  g(z)=1/(1+e⁻ᶻ)', f: sigmoid },
    { key: 'relu', cb: cbRelu, color: '#83C167', name: 'ReLU  g(z)=max(0,z)', f: relu }
  ];

  function draw() {
    const z0 = zSlider ? parseFloat(zSlider.value) : 0;
    if (zVal) zVal.textContent = z0.toFixed(1);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // grid + ejes
    ctx.strokeStyle = 'rgba(168,162,144,0.18)'; ctx.lineWidth = 1;
    for (let z = zMin; z <= zMax; z += 2) { ctx.beginPath(); ctx.moveTo(px(z), pad.t); ctx.lineTo(px(z), pad.t + ph); ctx.stroke(); }
    for (let y = yMin; y <= yMax; y += 1) { ctx.beginPath(); ctx.moveTo(pad.l, py(y)); ctx.lineTo(pad.l + pw, py(y)); ctx.stroke(); }
    ctx.strokeStyle = '#a8a290'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px(0), pad.t); ctx.lineTo(px(0), pad.t + ph); ctx.stroke();   // eje y (z=0)
    ctx.beginPath(); ctx.moveTo(pad.l, py(0)); ctx.lineTo(pad.l + pw, py(0)); ctx.stroke();    // eje x (y=0)
    ctx.fillStyle = '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.fillText('z', pad.l + pw - 6, py(0) - 6);
    ctx.fillText('1', px(0) - 12, py(1) + 4);

    // línea vertical del z elegido
    ctx.strokeStyle = 'rgba(255,255,0,0.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(px(z0), pad.t); ctx.lineTo(px(z0), pad.t + ph); ctx.stroke();
    ctx.setLineDash([]);

    // curvas activas
    let legendY = pad.t + 6;
    FNS.forEach(fn => {
      if (fn.cb && !fn.cb.checked) return;
      ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.beginPath();
      let started = false;
      for (let i = 0; i <= pw; i += 2) {
        const z = zMin + i / pw * (zMax - zMin);
        const y = fn.f(z);
        const Y = Math.max(pad.t, Math.min(pad.t + ph, py(y)));
        if (!started) { ctx.moveTo(px(z), Y); started = true; } else { ctx.lineTo(px(z), Y); }
      }
      ctx.stroke();
      // punto g(z0)
      const yv = fn.f(z0);
      if (yv >= yMin && yv <= yMax) {
        ctx.beginPath(); ctx.arc(px(z0), py(yv), 5, 0, Math.PI * 2);
        ctx.fillStyle = fn.color; ctx.fill(); ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // leyenda con valor
      ctx.fillStyle = fn.color; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
      ctx.fillText(fn.name + '  →  g(' + z0.toFixed(1) + ') = ' + yv.toFixed(2), pad.l + 8, legendY + 4);
      legendY += 18;
    });
  }

  FNS.forEach(fn => fn.cb && fn.cb.addEventListener('change', draw));
  if (zSlider) zSlider.addEventListener('input', draw);
  draw();
}
