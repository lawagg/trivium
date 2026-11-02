(() => {
  const r = el => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), w: Math.round(b.width), h: Math.round(b.height) };
  };
  const wide = [];
  document.querySelectorAll('body *').forEach(el => {
    const b = el.getBoundingClientRect();
    if (b.width > window.innerWidth + 1) {
      wide.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className || el.id,
        w: Math.round(b.width),
        x: Math.round(b.x),
      });
    }
  });
  const tri = window.__tri;
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    docScrollWidth: document.documentElement.scrollWidth,
    compact: document.body.classList.contains('compact'),
    wide: wide.slice(0, 8),
    canvas: r(document.querySelector('#tetra')),
    panel: r(document.querySelector('#panel')),
    songs: r(document.querySelector('.songs')),
    topbar: r(document.querySelector('.topbar')),
    themeBtn: r(document.querySelector('#themeBtn')),
    nodes: tri ? tri.nodes().map(p => [Math.round(p.x), Math.round(p.y)]) : null,
    geo: tri ? tri.geo() : null,
  };
})()
