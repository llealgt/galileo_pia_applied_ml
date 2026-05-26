// ============================================================
// Bagging vs Boosting — Animación Paralelo vs Secuencial
// Sobre una MISMA línea de tiempo: en bagging los 3 modelos se
// entrenan a la vez (paralelo); en boosting cada modelo solo arranca
// cuando el anterior terminó (secuencial).
// ============================================================

function initBaggingBoostingAnim() {
  const canvas = document.getElementById('bag-boost-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DURATION = 7000; // ms por ciclo
  let t = 0, running = true, last = null, rafId = null;

  const playBtn = document.getElementById('bb-play-btn');

  // Horarios (t en [0,1]) — compartidos en la misma línea de tiempo
  // Bagging: los 3 modelos entrenan juntos
  const BAG = { start: 0.18, end: 0.46 };
  // Boosting: secuencial, cada uno espera al anterior
  const BOO = [ { s: 0.10, e: 0.30 }, { s: 0.35, e: 0.55 }, { s: 0.60, e: 0.80 } ];
  const BAG_RESULT = 0.52, BOO_RESULT = 0.86;

  function state(s, e, tt) { return tt < s ? 'idle' : (tt < e ? 'train' : 'done'); }

  // ---- iconos ----
  function dataset(x, y, color, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1;
    roundRect(x - 16, y - 21, 32, 42, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(27,27,47,0.7)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 16, y - 21 + i * 10.5); ctx.lineTo(x + 16, y - 21 + i * 10.5); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x, y - 21); ctx.lineTo(x, y + 21); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function treeIcon(x, y, stroke) {
    ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x - 9, y + 4); ctx.lineTo(x + 9, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - 1.5, y + 4, 3, 7);
  }
  function model(x, y, st, label, pulse) {
    const w = 64, h = 50;
    let fill, stroke, lw = 1.8;
    if (st === 'idle') { fill = 'rgba(168,162,144,0.10)'; stroke = 'rgba(168,162,144,0.5)'; }
    else if (st === 'train') { fill = 'rgba(255,255,0,0.14)'; stroke = '#FFFF00'; lw = 1.5 + 2 * pulse; }
    else { fill = 'rgba(131,193,103,0.25)'; stroke = '#83C167'; }
    ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    roundRect(x - w / 2, y - h / 2, w, h, 7); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = st === 'idle' ? 0.45 : 1;
    treeIcon(x, y - 4, st === 'done' ? '#83C167' : (st === 'train' ? '#FFFF00' : '#a8a290'));
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ece6d0'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 21);
    if (st === 'train') { ctx.fillStyle = '#FFFF00'; ctx.font = '8px Fira Code, monospace'; ctx.fillText('entrena…', x, y - 18); }
    if (st === 'done') { ctx.fillStyle = '#83C167'; ctx.font = 'bold 11px Fira Code, monospace'; ctx.fillText('✓', x + w / 2 - 9, y - h / 2 + 12); }
  }
  function arrow(x1, y1, x2, y2, color, wdt) {
    ctx.strokeStyle = color; ctx.lineWidth = wdt || 1.4; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(ang - 0.4), y2 - 7 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 7 * Math.cos(ang + 0.4), y2 - 7 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function curve(x1, y1, x2, y2, color, wdt) {
    ctx.strokeStyle = color; ctx.lineWidth = wdt || 1.4; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 - 50, y1 + 30, x2 + 50, y2 - 30, x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 + 8, y2 - 5); ctx.lineTo(x2 + 8, y2 + 5); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // posiciones
  const bagRows = [95, 210, 325];
  const booRows = [95, 210, 325];

  function draw(tt, ms) {
    const pulse = 0.5 + 0.5 * Math.sin(ms / 120);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);

    // títulos
    ctx.textAlign = 'center'; ctx.font = 'bold 16px Lora, serif';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('Bagging · Paralelo', 235, 26);
    ctx.fillStyle = '#FF862F'; ctx.fillText('Boosting · Secuencial', 715, 26);
    // divisor
    ctx.strokeStyle = 'rgba(168,162,144,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(480, 14); ctx.lineTo(480, 392); ctx.stroke();

    // ===== BAGGING =====
    const bagSt = state(BAG.start, BAG.end, tt);
    dataset(50, 210, '#83C167', 1);
    // arrows orig→bootstrap, bootstrap→model, model→result
    bagRows.forEach((ry, i) => {
      arrow(68, 210, 138, ry, '#a8a290', 1.2);
      dataset(155, ry, '#9A72AC', tt > 0.08 ? 1 : 0.3);
      arrow(174, ry, 251, ry, '#a8a290', 1.2);
      model(285, ry, bagSt, 'Árbol ' + (i + 1), pulse);
      const done = bagSt === 'done';
      arrow(318, ry, 402, 210, done ? '#83C167' : 'rgba(168,162,144,0.4)', done ? 1.8 : 1.2);
    });
    // resultado
    const bagOn = tt >= BAG_RESULT;
    ctx.fillStyle = bagOn ? 'rgba(255,255,0,0.2)' : 'rgba(168,162,144,0.1)';
    ctx.strokeStyle = bagOn ? '#FFFF00' : 'rgba(168,162,144,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(420, 210, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bagOn ? '#FFFF00' : '#a8a290'; ctx.font = '18px serif'; ctx.textAlign = 'center';
    ctx.fillText('💡', 420, 217);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('Voto / Promedio', 420, 250);
    // mensaje
    ctx.fillStyle = bagSt === 'done' ? '#83C167' : '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText(bagSt === 'done' ? '✓ 3 árboles listos en 1 ronda' : 'los 3 entrenan a la vez', 235, 378);

    // ===== BOOSTING =====
    dataset(525, 210, '#83C167', 1);
    const booSt = BOO.map(b => state(b.s, b.e, tt));
    booRows.forEach((ry, i) => {
      // dataset i (el i>0 "se crea" cuando termina el modelo anterior)
      const dsReady = i === 0 ? tt > 0.06 : booSt[i - 1] === 'done';
      dataset(635, ry, '#9A72AC', dsReady ? 1 : 0.28);
      arrow(652, ry, 731, ry, dsReady ? '#a8a290' : 'rgba(168,162,144,0.3)', 1.2);
      model(765, ry, booSt[i], 'Árbol ' + (i + 1), pulse);
      const done = booSt[i] === 'done';
      arrow(798, ry, 884, 210, done ? '#83C167' : 'rgba(168,162,144,0.4)', done ? 1.8 : 1.2);
    });
    // orig → dataset1
    arrow(540, 200, 620, 100, '#a8a290', 1.2);
    // handoffs secuenciales (modelo k → dataset k+1) — se encienden al terminar el modelo k
    const h1 = booSt[0] === 'done';
    curve(765, 120, 652, 200, h1 ? '#FC6255' : 'rgba(252,98,85,0.25)', h1 ? 2 : 1.2);
    const h2 = booSt[1] === 'done';
    curve(765, 235, 652, 315, h2 ? '#FC6255' : 'rgba(252,98,85,0.25)', h2 ? 2 : 1.2);
    ctx.fillStyle = '#FC6255'; ctx.font = 'italic 8px Fira Code, monospace'; ctx.textAlign = 'center';
    if (h1) ctx.fillText('errores→', 690, 165);
    if (h2) ctx.fillText('errores→', 690, 280);
    // resultado boosting
    const booOn = tt >= BOO_RESULT;
    ctx.fillStyle = booOn ? 'rgba(255,255,0,0.2)' : 'rgba(168,162,144,0.1)';
    ctx.strokeStyle = booOn ? '#FFFF00' : 'rgba(168,162,144,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(905, 210, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = booOn ? '#FFFF00' : '#a8a290'; ctx.font = '18px serif'; ctx.textAlign = 'center';
    ctx.fillText('💡', 905, 217);
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('Suma ponderada', 905, 250);
    const nDone = booSt.filter(s => s === 'done').length;
    ctx.fillStyle = nDone === 3 ? '#83C167' : '#a8a290'; ctx.font = '11px Fira Code, monospace';
    ctx.fillText(nDone === 3 ? '✓ 3 árboles, pero en 3 rondas' : `cada árbol espera al anterior (${nDone}/3)`, 715, 378);

    // ===== Barra de tiempo compartida =====
    const bx = 60, bw = W - 120, by = 410;
    ctx.fillStyle = 'rgba(168,162,144,0.18)'; roundRect(bx, by, bw, 8, 4); ctx.fill();
    ctx.fillStyle = '#FFFF00'; roundRect(bx, by, bw * tt, 8, 4); ctx.fill();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('tiempo →', bx, by - 4);
  }

  function frame(ms) {
    if (!running) return;
    if (canvas.offsetParent === null) { rafId = requestAnimationFrame(frame); return; } // pausa si no visible
    if (last == null) last = ms;
    t += (ms - last) / DURATION; last = ms;
    if (t > 1) t -= 1;
    draw(t, ms);
    rafId = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = null; rafId = requestAnimationFrame(frame); } if (playBtn) playBtn.textContent = '⏸ Pausa'; }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); if (playBtn) playBtn.textContent = '▶ Reproducir'; }

  if (playBtn) playBtn.addEventListener('click', () => { running ? stop() : start(); });

  running = true; last = null; rafId = requestAnimationFrame(frame);
}
