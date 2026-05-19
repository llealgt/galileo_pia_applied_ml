// ============================================================
// Softmax Widget
// Interactive sliders for K=4 logits with real-time probability bars.
// ============================================================

function initSoftmaxWidget() {
  const K = 4;
  const sliders = [];
  const zLabels = [];
  const bars = [];
  const probLabels = [];
  for (let i = 1; i <= K; i++) {
    sliders.push(document.getElementById(`softmax-z${i}-slider`));
    zLabels.push(document.getElementById(`softmax-z${i}-val`));
    bars.push(document.getElementById(`softmax-a${i}-bar`));
    probLabels.push(document.getElementById(`softmax-a${i}-val`));
  }
  if (!sliders[0]) return;

  function update() {
    const z = sliders.map(s => parseFloat(s.value));
    // Numerically stable softmax
    const maxZ = Math.max.apply(null, z);
    const expZ = z.map(zi => Math.exp(zi - maxZ));
    const sumExp = expZ.reduce((s, v) => s + v, 0);
    const probs = expZ.map(v => v / sumExp);

    for (let i = 0; i < K; i++) {
      zLabels[i].textContent = z[i].toFixed(1);
      bars[i].style.width = (probs[i] * 100) + '%';
      probLabels[i].textContent = probs[i].toFixed(3);
    }
  }

  sliders.forEach(s => s.addEventListener('input', update));
  update();
}
