'use strict';
/* Ядро судейства — перенос trivium/scoring.py на JavaScript.
 * Формулы должны совпадать с Python до последнего знака: за это отвечает
 * tools/parity_test.py.
 */

const BASE_MIN = 1.0;
const BASE_MAX = 6.0;
const BASE_STEP = 0.1;
const ART_MIN = 1.0;
const ART_MAX = 1.5;
const ART_STEP = 0.01;
const OV_MIN = 0;
const OV_MAX = 10;
const ART_BONUS_MODE = 'delta';
const EPS = 1e-9;

const BLOCKS = (typeof SPEC !== 'undefined' ? SPEC.blocks : []);
const BASE_KEYS = BLOCKS.filter(b => b.kind === 'base').flatMap(b => b.criteria.map(c => c.key));
const ART_KEYS = BLOCKS.filter(b => b.kind === 'art').flatMap(b => b.criteria.map(c => c.key));

// Округление как в Python: по точному десятичному разложению числа,
// половина уходит к чётному (19.625 -> 19.62). Умножение на 10^n и
// toFixed так не умеют — первый врёт на двоичных дробях, второй округляет
// половину от нуля.
function round(value, digits) {
  const v = Number(value);
  if (!isFinite(v)) return v;
  const abs = Math.abs(v);
  const text = abs.toFixed(20);
  const parts = text.split('.');
  const intPart = parts[0];
  const fracPart = parts[1] || '';
  const rest = fracPart.slice(digits);
  const firstExtra = rest.length ? Number(rest[0]) : 0;
  const tailNonZero = rest.length > 1 && /[1-9]/.test(rest.slice(1));

  const digitsArr = (intPart + fracPart.slice(0, digits).padEnd(digits, '0')).split('').map(Number);

  let roundUp;
  if (firstExtra > 5) roundUp = true;
  else if (firstExtra < 5) roundUp = false;
  else if (tailNonZero) roundUp = true;
  else roundUp = digitsArr[digitsArr.length - 1] % 2 === 1;

  if (roundUp) {
    let i = digitsArr.length - 1;
    for (; i >= 0; i--) {
      if (digitsArr[i] === 9) digitsArr[i] = 0;
      else { digitsArr[i] += 1; break; }
    }
    if (i < 0) digitsArr.unshift(1);
  }

  const str = digitsArr.join('');
  const intLen = str.length - digits;
  const result = Number(str.slice(0, intLen) + '.' + str.slice(intLen));
  return v < 0 ? -result : result;
}

function clampPos(value) {
  const pos = Number(value);
  if (!isFinite(pos)) return 0;
  return Math.max(-1, Math.min(1, pos));
}

function floorTo(value, step) {
  if (!(step > 0)) return value;
  const steps = Math.floor(value / step + 1e-9);
  return Math.round(steps * step * 1e6) / 1e6;
}

function criterionPair(pos, lo, hi, step) {
  lo = lo === undefined ? BASE_MIN : lo;
  hi = hi === undefined ? BASE_MAX : hi;
  step = step === undefined ? BASE_STEP : step;
  const p = clampPos(pos);
  if (Math.abs(p) <= EPS) return [lo, lo];
  let lead = floorTo(lo + Math.abs(p) * (hi - lo), step);
  lead = Math.max(lo, Math.min(hi, lead));
  return p < 0 ? [lead, lo] : [lo, lead];
}

function artPair(pos) {
  const p = clampPos(pos);
  if (Math.abs(p) <= EPS) return [0, 0];
  let lead = floorTo(ART_MIN + Math.abs(p) * (ART_MAX - ART_MIN), ART_STEP);
  lead = Math.max(ART_MIN, Math.min(ART_MAX, lead));
  if (ART_BONUS_MODE === 'delta') lead = lead - ART_MIN;
  return p < 0 ? [lead, 0] : [0, lead];
}

function nameOf(value, fallback) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function formatNum(value, decimals) {
  decimals = decimals === undefined ? 2 : decimals;
  const rounded = round(Number(value), decimals);
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
  let text = rounded.toFixed(decimals);
  text = text.replace(/0+$/, '').replace(/\.$/, '');
  return text.replace('.', ',');
}

function timesWord(value) {
  const nearest = Math.round(Number(value));
  if (Math.abs(Number(value) - nearest) > 1e-9) return 'раза';
  const m100 = ((nearest % 100) + 100) % 100;
  if (m100 === 11 || m100 === 12 || m100 === 13 || m100 === 14) return 'раз';
  const m10 = nearest % 10;
  if (m10 >= 5 || m10 === 0) return 'раз';
  return 'раза';
}

function evaluate(payload) {
  payload = payload || {};
  const basePositions = payload.base || {};
  const artPositions = payload.art || {};
  const nameA = nameOf(payload.song_a, 'Трек 1');
  const nameB = nameOf(payload.song_b, 'Трек 2');

  const blocksA = {};
  const blocksB = {};
  const criteria = {};

  for (const block of BLOCKS) {
    if (block.kind !== 'base') continue;
    let sumA = 0;
    let sumB = 0;
    for (const item of block.criteria) {
      const raw = basePositions[item.key];
      const [sa, sb] = criterionPair(raw === undefined || raw === null ? 0 : raw);
      sumA += sa;
      sumB += sb;
      criteria[item.key] = {
        label: item.label,
        pos: clampPos(raw === undefined || raw === null ? 0 : raw),
        a: sa,
        b: sb,
      };
    }
    blocksA[block.key] = round(sumA, 4);
    blocksB[block.key] = round(sumB, 4);
  }

  const sum4 = o => round(Object.keys(o).reduce((acc, k) => acc + o[k], 0), 4);
  const baseA = sum4(blocksA);
  const baseB = sum4(blocksB);

  const artA = {};
  const artB = {};
  let bonusA = 0;
  let bonusB = 0;
  for (const key of ART_KEYS) {
    const raw = artPositions[key];
    const [pa, pb] = artPair(raw === undefined || raw === null ? 0 : raw);
    artA[key] = round(pa, 4);
    artB[key] = round(pb, 4);
    bonusA += pa;
    bonusB += pb;
  }

  const totalA = round(baseA * (1 + bonusA), 4);
  const totalB = round(baseB * (1 + bonusB), 4);

  const parseOv = value => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!isFinite(n)) return null;
    return Math.trunc(Math.max(OV_MIN, Math.min(OV_MAX, Math.round(n))));
  };
  const ovA = parseOv(payload.ov_a);
  const ovB = parseOv(payload.ov_b);

  let tiebreak = null;
  let winner;
  if (Math.abs(totalA - totalB) > 1e-9) {
    winner = totalA > totalB ? 'A' : 'B';
  } else if (ovA !== null && ovB !== null && ovA !== ovB) {
    winner = ovA > ovB ? 'A' : 'B';
    tiebreak = 'ov';
  } else {
    winner = 'draw';
  }

  let winnerName = '';
  let loserName = '';
  let winnerTotal = 0;
  let loserTotal = 0;
  let winnerOv = null;
  let loserOv = null;

  if (winner === 'A') {
    winnerName = nameA; loserName = nameB;
    winnerTotal = totalA; loserTotal = totalB;
    winnerOv = ovA; loserOv = ovB;
  } else if (winner === 'B') {
    winnerName = nameB; loserName = nameA;
    winnerTotal = totalB; loserTotal = totalA;
    winnerOv = ovB; loserOv = ovA;
  } else {
    winnerTotal = Math.max(totalA, totalB);
    loserTotal = winnerTotal;
  }

  const high = Math.max(totalA, totalB);
  const low = Math.min(totalA, totalB);
  const ratioRaw = low > 1e-9 ? high / low : 1;
  const ratio = round(ratioRaw, 2);

  const multA = 1 + bonusA;
  const multB = 1 + bonusB;
  const radarLabels = BASE_KEYS.map(k => criteria[k].label);
  const radarA = BASE_KEYS.map(k => round(criteria[k].a * multA, 3));
  const radarB = BASE_KEYS.map(k => round(criteria[k].b * multB, 3));

  const strengthsA = [], weaknessesA = [], strengthsB = [], weaknessesB = [];
  for (const key of BASE_KEYS) {
    const item = criteria[key];
    const diff = item.a - item.b;
    const entry = { label: item.label, a: item.a, b: item.b, diff: round(diff, 2) };
    if (diff > 1e-9) {
      strengthsA.push(entry);
      weaknessesB.push(entry);
    } else if (diff < -1e-9) {
      strengthsB.push(entry);
      weaknessesA.push(entry);
    }
  }
  strengthsA.sort((x, y) => y.diff - x.diff);
  strengthsB.sort((x, y) => y.diff - x.diff);
  weaknessesA.sort((x, y) => x.diff - y.diff);
  weaknessesB.sort((x, y) => y.diff - x.diff);

  let artFlip = false;
  let baseLeader = null;
  if (Math.abs(baseA - baseB) > 1e-9) baseLeader = baseA > baseB ? 'A' : 'B';
  if ((winner === 'A' || winner === 'B') && baseLeader !== null) artFlip = baseLeader !== winner;

  let gap;
  if (winner === 'draw') gap = 'Ничья';
  else if (ratioRaw < 1.05) gap = 'На грани';
  else if (ratioRaw < 1.2) gap = 'Уверенная победа';
  else gap = 'Разгром';

  let kind;
  let verdict;
  if (winner === 'draw') {
    kind = 'draw';
    verdict = 'Ничья: после всех коэффициентов баллы равны' +
      (ovA !== null && ovA === ovB ? ' и общее впечатление тоже.' : '.');
  } else if (tiebreak === 'ov') {
    kind = 'draw_ov';
    verdict = 'Баллы равны — победитель определён по общему впечатлению.';
  } else if (artFlip) {
    kind = 'art_flip';
    const leaderName = baseLeader === 'A' ? nameA : nameB;
    verdict = 'Переворот Артом: по базовым критериям сильнее «' + leaderName +
      '», но коэффициент блока «Арт» перевернул итог.';
  } else {
    kind = 'win';
    verdict = 'Победа и по базовым критериям, и по итогу.';
  }

  let verdictLabel;
  if (kind === 'draw') verdictLabel = 'Ничья';
  else if (kind === 'draw_ov') verdictLabel = 'По общему впечатлению';
  else if (kind === 'art_flip') verdictLabel = 'Переворот Артом';
  else verdictLabel = gap;

  const sentence = winner === 'draw'
    ? 'Ничья: «' + nameA + '» и «' + nameB + '» набрали одинаковые баллы' +
      (ovA !== null && ovA === ovB ? ' и одинаковое общее впечатление.' : '.')
    : 'Песня «' + winnerName + '» сильнее песни «' + loserName + '» в ' +
      formatNum(ratio) + ' ' + timesWord(ratio) + '.';

  return {
    ok: true,
    mode: ART_BONUS_MODE,
    winner,
    draw: winner === 'draw',
    tiebreak,
    name_a: nameA,
    name_b: nameB,
    winner_name: winnerName,
    loser_name: loserName,
    winner_ov: winnerOv === null ? '—' : String(winnerOv),
    loser_ov: loserOv === null ? '—' : String(loserOv),
    ov_a: ovA === null ? '—' : String(ovA),
    ov_b: ovB === null ? '—' : String(ovB),
    winner_total: round(winnerTotal, 2),
    loser_total: round(loserTotal, 2),
    total_a: round(totalA, 2),
    total_b: round(totalB, 2),
    base_a: round(baseA, 2),
    base_b: round(baseB, 2),
    ratio,
    ratio_text: winner === 'draw' ? '1,00' : formatNum(ratio),
    sentence,
    blocks: { a: blocksA, b: blocksB },
    art: { a: artA, b: artB },
    criteria,
    kind,
    verdict,
    verdict_label: verdictLabel,
    gap,
    art_flip: artFlip,
    multipliers: { a: round(multA, 4), b: round(multB, 4) },
    radar: { labels: radarLabels, a: radarA, b: radarB, max: radarMax(radarA, radarB) },
    strengths_a: strengthsA,
    weaknesses_a: weaknessesA,
    strengths_b: strengthsB,
    weaknesses_b: weaknessesB,
  };
}

function radarMax(valuesA, valuesB) {
  const all = valuesA.concat(valuesB, [BASE_MIN]);
  const top = Math.ceil(Math.max.apply(null, all));
  return Math.max(2, top);
}
