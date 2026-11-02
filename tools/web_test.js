// Прогоняет JS-сценарий в настоящем Chrome через DevTools Protocol.
// Запуск: node tools/web_test.js <url> <сценарий.js> [снимок.png] [селектор для настоящего клика]
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const url = process.argv[2];
const scriptPath = process.argv[3];
const shotPath = process.argv[4];
const realClick = process.argv[5];

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const headless = process.env.WEB_HEADED !== '1';
  const args = [
    '--disable-gpu',
    '--hide-scrollbars',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + os.tmpdir() + '\\trivium-cdp',
    '--window-size=' + (process.env.WEB_SIZE || '1440,900'),
    url,
  ];
  if (headless) {
    args.unshift('--headless=new');
  } else {
    args.unshift('--window-position=-32000,-32000', '--no-first-run', '--no-default-browser-check');
  }

  const chrome = spawn(CHROME, args, { stdio: 'ignore' });

  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    await wait(250);
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    } catch (e) { /* браузер ещё поднимается */ }
  }
  if (!page) {
    console.log('НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ');
    chrome.kill();
    process.exit(1);
  }

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
      const d = msg.params.exceptionDetails;
      logs.push('ИСКЛЮЧЕНИЕ: ' + (d.exception ? d.exception.description : d.text));
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

  const evaluate = async expression => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    const box = res.result || {};
    if (box.exceptionDetails) {
      const d = box.exceptionDetails;
      return { __error: d.exception ? d.exception.description : d.text };
    }
    return box.result ? box.result.value : undefined;
  };

  await send('Runtime.enable');
  await send('Page.enable');

  // ждём, пока страница и скрипты реально поднимутся
  const readyExpr = "document.readyState === 'complete' && document.body && !document.body.classList.contains('booting')";
  for (let i = 0; i < 60; i++) {
    if (await evaluate(readyExpr) === true) break;
    await wait(250);
  }
  await wait(400);

  if (realClick) {
    const pt = await evaluate('(() => { const el = document.querySelector(' + JSON.stringify(realClick) +
      '); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()');
    if (pt && typeof pt === 'object') {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await wait(400);
      console.log('клик мышью по ' + realClick + ' в (' + Math.round(pt.x) + ',' + Math.round(pt.y) + ')');
    } else {
      console.log('элемент не найден: ' + realClick);
    }
  }

  const outcome = await evaluate(fs.readFileSync(scriptPath, 'utf8'));

  if (shotPath) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result && shot.result.data) {
      fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
      console.log('снимок: ' + shotPath);
    }
  }

  if (outcome && outcome.__error) console.log('ОШИБКА СЦЕНАРИЯ:\n' + outcome.__error);
  else if (outcome !== undefined) console.log(JSON.stringify(outcome, null, 1));

  if (logs.length) console.log('КОНСОЛЬ:\n' + logs.join('\n'));

  ws.close();
  chrome.kill();
  process.exit(0);
})();
