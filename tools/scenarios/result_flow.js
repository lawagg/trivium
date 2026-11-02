(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = { namesFilled: document.querySelector('#nameA').value };

  document.querySelector('#resultBtn').click();
  await wait(250);
  out.modalShown = !document.querySelector('#modal').hasAttribute('hidden');
  out.modalText = document.querySelector('#modalText').textContent;

  document.querySelector('#modalOk').click();
  await wait(400);

  const res = document.querySelector('#result');
  out.resultShown = !res.hasAttribute('hidden');
  out.verdict = document.querySelector('#verdict').textContent;
  out.cardNames = Array.from(res.querySelectorAll('.rcard-name')).map(n => n.textContent);
  out.buttonLabel = document.querySelector('#resultBtn').textContent;

  // повторное нажатие скрывает результат
  document.querySelector('#resultBtn').click();
  await wait(250);
  out.afterSecondClick = {
    resultHidden: res.hasAttribute('hidden'),
    label: document.querySelector('#resultBtn').textContent,
  };
  return out;
})()
