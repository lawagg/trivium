(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  document.querySelector('#panelInfo').click();
  await wait(400);
  const r = el => { const b = el.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height) }; };
  const info = document.querySelector('#info');
  return {
    infoVisible: !info.hasAttribute('hidden'),
    panel: r(document.querySelector('#panel')),
    info: r(info),
    infoScrollable: info.querySelector('.info-body').scrollHeight > info.querySelector('.info-body').clientHeight,
    stageScrollTop: document.querySelector('.stage').scrollTop,
    pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
  };
})()
