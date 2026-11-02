(() => {
  const info = sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const r = el.getBoundingClientRect();
    const cx = Math.round(r.x + r.width / 2);
    const cy = Math.round(r.y + r.height / 2);
    const top = document.elementFromPoint(cx, cy);
    return {
      sel,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      center: { cx, cy },
      topElement: top ? (top.id || top.className || top.tagName) : null,
      topIsSelf: top === el || (top && el.contains(top)),
    };
  };
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    resultBtn: info('#resultBtn'),
    helpBtn: info('#helpBtn'),
    resetBtn: info('#resetBtn'),
    footer: info('.bottom'),
  };
})()
