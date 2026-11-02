(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  document.querySelector('#resultBtn').click();
  await wait(250);
  document.querySelector('#modalOk').click();
  await wait(600);
  return {
    resultShown: !document.querySelector('#result').hasAttribute('hidden'),
    songsVisible: getComputedStyle(document.querySelector('.songs')).display,
    radar: (() => { const c = document.querySelector('#radar'); return { w: c.width, h: c.height, css: c.style.width }; })(),
  };
})()
