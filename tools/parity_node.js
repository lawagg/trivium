// Проверка совпадения расчётов: читает payloads.json, печатает результаты.
const fs = require('fs');
const vm = require('vm');

const file = process.argv[2];
const payloads = JSON.parse(fs.readFileSync(file, 'utf8'));

const root = __dirname.replace(/\\/g, '/') + '/..';
const sources = [
  root + '/web/data.js',
  root + '/web/scoring.js',
].map(p => fs.readFileSync(p, 'utf8')).join('\n');

vm.runInThisContext(sources + '\n;globalThis.__evaluate = evaluate;');

const out = payloads.map(p => globalThis.__evaluate(p));
process.stdout.write(JSON.stringify(out));
