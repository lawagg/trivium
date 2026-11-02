(async () => {
  const out = {};
  const btn = document.querySelector('#resultBtn');
  out.buttonFound = !!btn;

  btn.click();
  await new Promise(r => setTimeout(r, 300));

  const modal = document.querySelector('#modal');
  out.modalHiddenAttr = modal.hasAttribute('hidden');
  out.modalDisplay = getComputedStyle(modal).display;
  out.modalTitle = document.querySelector('#modalTitle').textContent;

  // заполняем имена и жмём «Понятно» → модалка закрывается
  document.querySelector('#nameA').value = 'Трек 1';
  document.querySelector('#nameB').value = 'Трек 2';
  document.querySelector('#modalOk').click();
  await new Promise(r => setTimeout(r, 200));

  out.afterOkHidden = document.querySelector('#modal').hasAttribute('hidden');

  btn.click();
  await new Promise(r => setTimeout(r, 300));
  out.secondTitle = document.querySelector('#modalTitle').textContent;
  out.secondText = document.querySelector('#modalText').textContent;

  document.querySelector('#modalOk').click();
  await new Promise(r => setTimeout(r, 500));

  const res = document.querySelector('#result');
  out.resultHiddenAttr = res.hasAttribute('hidden');
  out.resultDisplay = getComputedStyle(res).display;
  out.verdict = document.querySelector('#verdict').textContent;
  out.cards = document.querySelector('#resultCards').children.length;

  return out;
})()
