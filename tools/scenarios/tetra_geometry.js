(() => {
  if (!window.__tri) return { error: 'нет отладочного хука' };
  const canvas = document.querySelector('#tetra');
  const panel = document.querySelector('#panel');
  const info = document.querySelector('#info');
  const cr = canvas.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  const ir = info.getBoundingClientRect();
  return {
    canvas: { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), h: Math.round(cr.height) },
    panel: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width) },
    info: { x: Math.round(ir.x), w: Math.round(ir.width) },
    morph: Number(window.__tri.morph().toFixed(3)),
    anchor: window.__tri.anchor(),
    geo: window.__tri.geo(),
    nodes: window.__tri.nodes().map(n => ({ x: Math.round(n.x), y: Math.round(n.y) })),
  };
})()
