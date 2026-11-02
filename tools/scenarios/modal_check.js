(async () => {
  const out = { url: location.href };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  out.infoOpen = !document.querySelector('#info').hasAttribute('hidden');
  out.panelOpen = !document.querySelector('#panel').hasAttribute('hidden');

  document.querySelector('#resultBtn').click();
  await wait(300);

  const modal = document.querySelector('#modal');
  out.modalHidden = modal.hasAttribute('hidden');
  out.modalDisplay = getComputedStyle(modal).display;
  out.modalZ = getComputedStyle(modal).zIndex;
  out.modalTitle = document.querySelector('#modalTitle').textContent;
  out.modalRect = (() => {
    const r = modal.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  })();
  // что реально в центре экрана
  const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  out.elementAtCenter = mid ? (mid.id || mid.className || mid.tagName) : null;

  return out;
})()
