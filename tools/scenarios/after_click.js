(() => {
  const modal = document.querySelector('#modal');
  const res = document.querySelector('#result');
  return {
    modal: { hidden: modal.hasAttribute('hidden'), display: getComputedStyle(modal).display },
    modalTitle: document.querySelector('#modalTitle').textContent,
    result: { hidden: res.hasAttribute('hidden') },
    resultBtnText: document.querySelector('#resultBtn').textContent,
  };
})()
