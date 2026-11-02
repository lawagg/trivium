(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = { steps: [] };
  const tri = window.__tri;
  if (!tri) return { error: 'нет отладочного хука — открывай с ?demo=1' };

  const canvas = document.querySelector('#tetra');
  const rect = canvas.getBoundingClientRect();
  out.before = { morph: tri.morph(), active: tri.state.active, nodes: tri.nodes().map(n => [Math.round(n.x), Math.round(n.y)]) };

  // нажимаем по вершине «Развитие» (индекс 1 = Разум) как мышью
  const node = tri.nodes()[1];
  const opts = {
    clientX: rect.left + node.x,
    clientY: rect.top + node.y,
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
  };
  canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
  out.afterClick = { active: tri.state.active };
  await wait(700);

  out.afterAnim = {
    morph: Number(tri.morph().toFixed(3)),
    anchor: tri.anchor(),
    nodes: tri.nodes().map(n => [Math.round(n.x), Math.round(n.y)]),
    panelLeft: Math.round(document.querySelector('#panel').getBoundingClientRect().left),
    canvasLeft: Math.round(rect.left),
  };
  return out;
})()
