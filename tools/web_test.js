// Прогоняет JS-сценарий в настоящем Chrome через DevTools Protocol.
// Запуск: node tools/web_test.js <url> <файл-со-скриптом.js>
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const url = process.argv[2];
const scriptPath = process.argv[3];

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + require('os').tmpdir() + '\\trivium-cdp',
    '--window-size=1440,900',
    url,
  ], { stdio: 'ignore' });

  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    await wait(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch (e) { /* ещё не поднялся */ }
  }
  if (!page) { console.log('НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(msg.params.args.map(a => a.value).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push('ИСКЛЮЧЕНИЕ: ' + (msg.params.exceptionDetails.exception
        ? msg.params.exceptionDetails.exception.description
        : msg.params.exceptionDetails.text));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });

  const send = (method, params) => new Promise(res => {
    const msgId = ++id;
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params: params || {} }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await wait(1500);

  const shotPath = process.argv[4];
  const realClick = process.argv[5];
  if (realClick) {
    const box = await send('Runtime.evaluate', {
      expression: (() => { const el = document.querySelector(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })(),
      returnByValue: true,
    });
    const pt = box.result && box.result.result ? box.result.result.value : null;
    if (pt) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await wait(400);
      console.log('клик мышью по ' + realClick + ' в (' + Math.round(pt.x) + ',' + Math.round(pt.y) + ')');
    } else {
      console.log('элемент не найден: ' + realClick);
    }
  }

  const source = fs.readFileSync(scriptPath, 'utf8');
  const result = await send('Runtime.evaluate', {
    expression: source,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });

  const value = result.result && result.result.result ? result.result.result.value : null;
  const error = result.result && result.result.exceptionDetails
    ? (result.result.exceptionDetails.exception
        ? result.result.exceptionDetails.exception.description
        : result.result.exceptionDetails.text)
    : null;

  if (shotPath) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result && shot.result.data) {
      fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
      console.log('снимок: ' + shotPath);
    }
  }

  if (error) console.log('ОШИБКА СЦЕНАРИЯ:\n' + error);
  if (value !== null && value !== undefined) console.log(JSON.stringify(value, null, 1));
  if (logs.length) console.log('КОНСОЛЬ:\n' + logs.join('\n'));

  ws.close();
  chrome.kill();
  process.exit(0);
})();
