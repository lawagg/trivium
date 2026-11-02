(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tri = window.__tri;
  if (!tri) return { error: 'нет отладочного хука' };

  const canvas = document.querySelector('#tetra');
  const rect = canvas.getBoundingClientRect();
  const clickNode = index => {
    const n = tri.nodes()[index];
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: rect.left + n.x, clientY: rect.top + n.y,
      bubbles: true, cancelable: true,
      pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1,
    }));
  };
  const snap = () => tri.nodes().map(p => ({ x: p.x, y: p.y }));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  clickNode(1);
  await wait(900);
  const before = snap();

  clickNode(3);                       // переключаем на «Душу»
  const start = performance.now();
  const first = snap();
  let frames = 0;
  let elbowSettled = 0;

  const target = (() => {
    // ждём, пока позиции перестанут меняться
    return null;
  })();

  let prev = first;
  let settledAfter = null;
  for (let i = 0; i < 40; i++) {
    await wait(40);
    frames++;
    const now = snap();
    const moved = now.reduce((acc, p, k) => Math.max(acc, dist(p, prev[k])), 0);
    prev = now;
    if (moved < 0.5 && settledAfter === null) {
      settledAfter = performance.now() - start;
      break;
    }
  }

  const after = snap();
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    firstFrameShift: Math.round(first.reduce((acc, p, k) => Math.max(acc, dist(p, before[k])), 0)),
    settledAfterMs: settledAfter === null ? 'не остановилось' : Math.round(settledAfter),
    samples: frames,
    totalShift: Math.round(after.reduce((acc, p, k) => Math.max(acc, dist(p, before[k])), 0)),
    anchorNow: tri.anchor(),
  };
})()
