(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tri = window.__tri;
  if (!tri) return { error: 'нет отладочного хука' };

  const canvas = document.querySelector('#tetra');
  const rect = canvas.getBoundingClientRect();
  const clickNode = index => {
    const n = tri.nodes()[index];
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: rect.left + n.x,
      clientY: rect.top + n.y,
      bubbles: true, cancelable: true,
      pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1,
    }));
  };
  const snapshot = () => tri.nodes().map(p => [Math.round(p.x), Math.round(p.y)]);

  clickNode(1);                       // открываем «Разум»
  await wait(900);
  const opened = { anchor: tri.anchor(), nodes: snapshot() };

  clickNode(3);                       // переключаемся на «Душу», ничего не закрывая
  const t0 = snapshot();
  await wait(120);
  const t1 = snapshot();
  await wait(700);
  const t2 = { anchor: tri.anchor(), nodes: snapshot() };

  // насколько сдвинулись вершины за первые 120 мс
  const moved = t0.map((p, i) => Math.round(Math.hypot(p[0] - t1[i][0], p[1] - t1[i][1])));
  const totalFromOld = opened.nodes.map((p, i) =>
    Math.round(Math.hypot(p[0] - t2.nodes[i][0], p[1] - t2.nodes[i][1])));

  return {
    openedAnchor: opened.anchor,
    newAnchor: t2.anchor,
    nodesAfterOpen: opened.nodes,
    justAfterClick: t0,
    after120ms: t1,
    after800ms: t2.nodes,
    movedInFirst120ms: moved,
    totalShiftFromOldLayout: totalFromOld,
  };
})()
