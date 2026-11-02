(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const st = () => ({
    panel: !document.querySelector('#panel').hasAttribute('hidden'),
    info: !document.querySelector('#info').hasAttribute('hidden'),
    active: window.__tri ? window.__tri.state.active : null,
    tetra: getComputedStyle(document.querySelector('#tetra')).display,
  });
  const out = { start: st() };
  document.querySelector('#panelInfo').click();
  await wait(300);
  out.afterOpenInfo = st();
  document.querySelector('#infoClose').click();
  await wait(300);
  out.afterInfoClose = st();
  return out;
})()
