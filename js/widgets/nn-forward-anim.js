// ============================================================
// Forward Propagation Animation Widget
// La señal fluye de izquierda a derecha: cada capa se "activa" en
// secuencia (las neuronas se encienden y las conexiones pulsan),
// mostrando a^[1] → a^[2] → a^[3] y la predicción final.
// ============================================================

function initNNForwardAnim() {
  const canvas = document.getElementById('nn-forward-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const playBtn = document.getElementById('nnf-play-btn');

  // Arquitectura: input(3) → hidden1(4) → hidden2(3) → output(1)
  const layers = [
    { n: 3, x: 90,  label: 'x⃗ (entrada)', color: '#FF862F', avec: ['x₁', 'x₂', 'x₃'] },
    { n: 4, x: 330, label: 'a⁽¹⁾', color: '#58C4DD', avec: ['0.7', '0.2', '0.9', '0.4'] },
    { n: 3, x: 560, label: 'a⁽²⁾', color: '#58C4DD', avec: ['0.8', '0.3', '0.6'] },
    { n: 1, x: 790, label: 'a⁽³⁾', color: '#FF40FF', avec: ['0.84'] }
  ];
  const topY = 70, botY = H - 80;
  function nodeY(li, i) { const L = layers[li]; if (L.n === 1) return (topY + botY) / 2; return topY + i * (botY - topY) / (L.n - 1); }

  // Horarios de activación por capa (t en [0,1])
  const sched = [ {s:0.00,e:0.08}, {s:0.12,e:0.36}, {s:0.42,e:0.66}, {s:0.72,e:0.92} ];
  const DURATION = 5200;
  let t = 0, running = true, last = null, rafId = null;

  function layerProg(li, tt) { const s = sched[li]; if (tt < s.s) return 0; if (tt > s.e) return 1; return (tt - s.s) / (s.e - s.s); }

  function draw(tt, ms) {
    const pulse = 0.5 + 0.5 * Math.sin(ms / 110);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Forward propagation: la señal fluye capa por capa →', W / 2, 24);

    // edges (entre capa li-1 y li) — pulsan mientras la capa li se activa
    for (let li = 1; li < layers.length; li++) {
      const p = layerProg(li, tt);
      const active = p > 0 && p < 1;
      for (let a = 0; a < layers[li - 1].n; a++) {
        for (let b = 0; b < layers[li].n; b++) {
          const x1 = layers[li - 1].x + 22, y1 = nodeY(li - 1, a);
          const x2 = layers[li].x - 22, y2 = nodeY(li, b);
          ctx.strokeStyle = p >= 1 ? 'rgba(92,208,179,0.5)' : (active ? `rgba(255,255,0,${0.25 + 0.5 * pulse})` : 'rgba(168,162,144,0.15)');
          ctx.lineWidth = active ? 1.8 : 1;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }

    // nodes
    layers.forEach((L, li) => {
      const p = li === 0 ? (tt >= sched[0].s ? 1 : 0) : layerProg(li, tt);
      ctx.fillStyle = L.color; ctx.font = 'bold 13px Fira Code, monospace'; ctx.textAlign = 'center';
      ctx.fillText(L.label, L.x, topY - 26);
      for (let i = 0; i < L.n; i++) {
        const y = nodeY(li, i);
        const on = p >= 1, mid = p > 0 && p < 1;
        ctx.beginPath(); ctx.arc(L.x, y, 20, 0, Math.PI * 2);
        if (li === 0) { ctx.fillStyle = on ? 'rgba(255,134,47,0.3)' : 'rgba(168,162,144,0.1)'; ctx.strokeStyle = on ? '#FF862F' : '#a8a290'; }
        else if (li === layers.length - 1) { ctx.fillStyle = on ? 'rgba(255,64,255,0.25)' : 'rgba(168,162,144,0.1)'; ctx.strokeStyle = on ? '#FF40FF' : (mid ? '#FFFF00' : '#a8a290'); }
        else { ctx.fillStyle = on ? 'rgba(88,196,221,0.28)' : 'rgba(168,162,144,0.1)'; ctx.strokeStyle = on ? '#58C4DD' : (mid ? '#FFFF00' : '#a8a290'); }
        ctx.lineWidth = mid ? 1.5 + 2 * pulse : 2; ctx.fill(); ctx.stroke();
        // valor de activación cuando la capa terminó
        ctx.globalAlpha = on ? 1 : (mid ? 0.4 : 0.25);
        ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace';
        ctx.fillText(L.avec[i], L.x, y + 4);
        ctx.globalAlpha = 1;
      }
    });

    // salida → predicción
    const outP = layerProg(3, tt);
    if (outP >= 1) {
      const oy = nodeY(3, 0);
      ctx.strokeStyle = '#FF40FF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(layers[3].x + 22, oy); ctx.lineTo(layers[3].x + 70, oy); ctx.stroke();
      ctx.fillStyle = '#FF40FF'; ctx.textAlign = 'left'; ctx.font = 'bold 12px Fira Code, monospace';
      ctx.fillText('a⁽³⁾ = 0.84', layers[3].x + 76, oy - 6);
      ctx.fillStyle = '#83C167'; ctx.fillText('≥ 0.5 → ŷ = 1', layers[3].x + 76, oy + 12);
    }

    // barra de avance
    const bx = 60, bw = W - 120, by = H - 26;
    ctx.fillStyle = 'rgba(168,162,144,0.18)'; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = '#5CD0B3'; ctx.fillRect(bx, by, bw * tt, 6);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('tiempo →', bx, by - 4);
  }

  function frame(ms) {
    if (!running) return;
    if (canvas.offsetParent === null) { rafId = requestAnimationFrame(frame); return; }
    if (last == null) last = ms;
    t += (ms - last) / DURATION; last = ms; if (t > 1) t -= 1;
    draw(t, ms); rafId = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = null; rafId = requestAnimationFrame(frame); } if (playBtn) playBtn.textContent = '⏸ Pausa'; }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); if (playBtn) playBtn.textContent = '▶ Reproducir'; }
  if (playBtn) playBtn.addEventListener('click', () => { running ? stop() : start(); });

  running = true; last = null; rafId = requestAnimationFrame(frame);
}
