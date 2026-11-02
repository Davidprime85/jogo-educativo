// Gerador de perguntas de matemática (multiplicação e frações) e de inglês.
// A dificuldade vai de 1 (fase 1) até 5 (fase 5).

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function lcm(a, b) { return a / gcd(a, b) * b; }
function frac(n, d) { return `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`; }

// Configuração de dificuldade por fase
const DIFFICULTY = {
  1: { mult: [2, 5, 2, 10],  fracDen: [2],             fracNum: 'unit', fracMax: 20, compare: ['sameDen'],                     types: ['mult', 'mult', 'fracOf', 'compare'] },
  2: { mult: [2, 7, 2, 10],  fracDen: [2, 3, 4],       fracNum: 'unit', fracMax: 40, compare: ['sameDen', 'unit'],             types: ['mult', 'mult', 'fracOf', 'compare', 'missing'] },
  3: { mult: [3, 9, 3, 10],  fracDen: [2, 3, 4, 5],    fracNum: 'any',  fracMax: 50, compare: ['unit', 'sameNum', 'half'],     types: ['mult', 'missing', 'fracOf', 'compare', 'equiv'] },
  4: { mult: [6, 12, 3, 12], fracDen: [3, 4, 5, 6, 8], fracNum: 'any',  fracMax: 80, compare: ['half', 'diff'],                types: ['mult', 'missing', 'fracOf', 'compare', 'equiv'] },
  5: { mult: [11, 25, 3, 9], fracDen: [4, 5, 6, 8, 10],fracNum: 'any',  fracMax: 120, compare: ['diff'],                       types: ['mult', 'missing', 'fracOf', 'compare', 'equiv'] }
};

const recentQuestions = [];

function numericOptions(answer, extras, count = 4) {
  const set = new Set([answer]);
  extras.forEach(v => { if (v > 0 && set.size < count) set.add(v); });
  let tries = 0;
  while (set.size < count && tries++ < 50) {
    const v = answer + rnd(-10, 10);
    if (v > 0) set.add(v);
  }
  return shuffle([...set]).map(v => ({ label: String(v), value: v }));
}

// Explicação da multiplicação usando um "atalho" que a criança entende
function multExplain(a, b, r) {
  if (b === 10) return `${a} × 10 = ${r}. Dica: para multiplicar por 10, coloque um zero no final do ${a}!`;
  if (b % 2 === 0 && b > 2) {
    const half = a * (b / 2);
    return `${a} × ${b} = ${r}. Pense assim: ${a} × ${b / 2} = ${half}, e o dobro de ${half} é ${r}.`;
  }
  if (b > 2) {
    const prev = a * (b - 1);
    return `${a} × ${b} = ${r}. Pense assim: ${a} × ${b - 1} = ${prev}, e mais um ${a}: ${prev} + ${a} = ${r}.`;
  }
  return `${a} × ${b} = ${r}. É o mesmo que ${Array(b).fill(a).join(' + ')} = ${r}.`;
}

const MathGen = {
  mult(cfg) {
    const [aMin, aMax, bMin, bMax] = cfg.mult;
    let a = rnd(aMin, aMax), b = rnd(bMin, bMax);
    if (Math.random() < 0.5) [a, b] = [b, a];
    const r = a * b;
    const big = Math.max(a, b), small = Math.min(a, b);
    return {
      key: `m${small}x${big}`,
      text: `What is ${a} × ${b}?`,
      textPt: `Quanto é ${a} × ${b}?`,
      answer: r,
      options: numericOptions(r, [a * (b + 1), a * (b - 1), (a + 1) * b, r + 10, r - 10]),
      explain: multExplain(big, small, r)
    };
  },

  missing(cfg) {
    const [aMin, aMax, bMin, bMax] = cfg.mult;
    const a = rnd(Math.max(2, aMin), Math.min(aMax, 12)), b = rnd(bMin, bMax);
    const r = a * b;
    return {
      key: `x${a}_${b}`,
      text: `? × ${b} = ${r}`,
      textPt: `Qual número vezes ${b} dá ${r}?`,
      answer: a,
      options: numericOptions(a, [a + 1, a - 1, a + 2, b]),
      explain: `Para achar o número que falta, divida: ${r} ÷ ${b} = ${a}. Confira: ${a} × ${b} = ${r}.`
    };
  },

  fracOf(cfg) {
    const d = pick(cfg.fracDen);
    const n = cfg.fracNum === 'unit' || d === 2 ? 1 : rnd(1, d - 1);
    const part = rnd(2, Math.max(2, Math.floor(cfg.fracMax / d)));
    const total = part * d;
    const r = part * n;
    const explainN = n === 1
      ? `Para achar ${frac(1, d)} de ${total}, divida ${total} em ${d} partes iguais: ${total} ÷ ${d} = ${r}.`
      : `Para achar ${frac(n, d)} de ${total}: primeiro divida ${total} ÷ ${d} = ${part} (uma parte). Depois pegue ${n} partes: ${part} × ${n} = ${r}.`;
    return {
      key: `f${n}/${d}of${total}`,
      text: `What is ${frac(n, d)} of ${total}?`,
      textPt: `Quanto é ${frac(n, d)} de ${total}?`,
      answer: r,
      options: numericOptions(r, [part, total - r, r + part, total / 2 !== r ? total / 2 : r + 1].map(Math.round)),
      explain: explainN,
      visual: { bars: [[n, d]] }
    };
  },

  equiv(cfg) {
    const d = pick(cfg.fracDen.filter(x => x <= 6));
    const n = rnd(1, d - 1);
    const k = rnd(2, 4);
    const r = n * k;
    return {
      key: `e${n}/${d}k${k}`,
      text: `${frac(n, d)} = ${frac('?', d * k)}`,
      textPt: `Qual número completa a fração igual?`,
      answer: r,
      options: numericOptions(r, [r + 1, r - 1, n + k, d * k - r]),
      explain: `O de baixo foi multiplicado por ${k} (${d} × ${k} = ${d * k}). Então o de cima também: ${n} × ${k} = ${r}. ${frac(n, d)} = ${frac(r, d * k)}.`,
      visual: { bars: [[n, d], [r, d * k]] }
    };
  },

  compare(cfg) {
    const mode = pick(cfg.compare);
    let a, b, explain;
    if (mode === 'sameDen') {
      const d = pick([3, 4, 5, 6, 8]);
      const n1 = rnd(1, d - 1); let n2 = rnd(1, d - 1);
      while (n2 === n1) n2 = rnd(1, d - 1);
      a = [n1, d]; b = [n2, d];
      const big = n1 > n2 ? a : b;
      explain = `Os dois têm o mesmo número embaixo (${d}), então os pedaços são do mesmo tamanho. Quem tem mais pedaços ganha: ${frac(big[0], d)} é maior.`;
    } else if (mode === 'unit') {
      const d1 = rnd(2, 8); let d2 = rnd(2, 10);
      while (d2 === d1) d2 = rnd(2, 10);
      a = [1, d1]; b = [1, d2];
      const big = d1 < d2 ? a : b;
      explain = `Quanto maior o número de baixo, menor fica cada pedaço (dividir uma pizza para mais gente!). Por isso ${frac(1, big[1])} é maior.`;
    } else if (mode === 'sameNum') {
      const n = rnd(2, 4);
      const d1 = rnd(n + 1, n + 5); let d2 = rnd(n + 1, n + 6);
      while (d2 === d1) d2 = rnd(n + 1, n + 6);
      a = [n, d1]; b = [n, d2];
      const big = d1 < d2 ? a : b;
      explain = `Os dois têm ${n} pedaços. Mas pedaços de ${frac(1, Math.min(d1, d2))} são maiores que de ${frac(1, Math.max(d1, d2))}. Então ${frac(n, big[1])} é maior.`;
    } else {
      // denominadores diferentes (ex.: 2/3 ou 3/4)
      let tries = 0;
      do {
        const d1 = pick([3, 4, 5, 6, 8]), d2 = pick([3, 4, 5, 6, 8, 10]);
        a = [rnd(1, d1 - 1), d1]; b = [rnd(1, d2 - 1), d2];
        if (mode === 'half') a = [1, 2];
      } while ((a[1] === b[1] || a[0] * b[1] === b[0] * a[1]) && tries++ < 50);
      const m = lcm(a[1], b[1]);
      const na = a[0] * m / a[1], nb = b[0] * m / b[1];
      const big = na > nb ? a : b;
      explain = `Deixe os dois com o mesmo número embaixo (${m}): ${frac(a[0], a[1])} = ${frac(na, m)} e ${frac(b[0], b[1])} = ${frac(nb, m)}. Como ${Math.max(na, nb)} > ${Math.min(na, nb)}, ${frac(big[0], big[1])} é maior.`;
    }
    if (Math.random() < 0.5) [a, b] = [b, a];
    const answer = a[0] / a[1] > b[0] / b[1] ? 'a' : 'b';
    return {
      key: `c${a.join('/')}-${b.join('/')}`,
      text: `Which fraction is bigger?`,
      textPt: `Qual fração é maior?`,
      answer,
      options: [{ label: frac(a[0], a[1]), value: 'a' }, { label: frac(b[0], b[1]), value: 'b' }],
      explain,
      visual: { bars: [a, b] }
    };
  }
};

function makeMathQuestion(level, boss = false) {
  const due = Review.take('math');
  if (due) return Object.assign({}, due.q, { options: shuffle(due.q.options), fromReview: true, reviewKey: due.key });
  const lv = Math.min(5, Math.max(1, boss ? level + 1 : level));
  const cfg = DIFFICULTY[lv];
  let q, tries = 0;
  do {
    q = MathGen[pick(cfg.types)](cfg);
  } while (recentQuestions.includes(q.key) && tries++ < 20);
  recentQuestions.push(q.key);
  if (recentQuestions.length > 15) recentQuestions.shift();
  q.kind = 'math';
  return q;
}

// Palavras em inglês por fase (as opções erradas vêm de todas as palavras)
const ENGLISH_WORDS = {
  1: ['fish', 'sun', 'boat', 'star', 'tree'],
  2: ['tree', 'flower', 'apple', 'house', 'cat'],
  3: ['key', 'moon', 'star', 'ball', 'cat'],
  4: ['sun', 'moon', 'apple', 'key', 'flower'],
  5: ['boat', 'fish', 'key', 'star', 'house']
};

function makeEnglishQuestion(level, word) {
  const due = Review.take('english');
  if (due && PICTURES[due.word]) word = due.word;
  word = word || pick(ENGLISH_WORDS[level] || ENGLISH_WORDS[1]);
  const nOptions = level <= 2 ? 3 : 4;
  const others = shuffle(Object.keys(PICTURES).filter(w => w !== word)).slice(0, nOptions - 1);
  const options = shuffle([word, ...others]).map(w => ({ label: w, value: w }));
  return {
    kind: 'english',
    word,
    text: 'What is this? Choose the right word.',
    textPt: 'O que é isto? Escolha a palavra certa.',
    picture: word,
    answer: word,
    options,
    speakAfter: `This is a ${word}.`,
    fromReview: !!(due && due.word === word),
    reviewKey: 'w:' + word,
    explainFor(chosen) {
      const right = `A figura é <b>${word}</b> (${PICTURES[word].pt}).`;
      return chosen && chosen !== word
        ? `Você escolheu <b>${chosen}</b>, que quer dizer "${PICTURES[chosen].pt}". ${right}`
        : right;
    }
  };
}

// ---------- Frases para completar (inglês, fase 2 em diante) ----------
const WORD_PT = {
  in: 'dentro de', on: 'em cima de', under: 'embaixo de',
  two: 'dois', three: 'três', four: 'quatro', five: 'cinco', six: 'seis',
  red: 'vermelho', blue: 'azul', green: 'verde'
};

const SENTENCES = [
  { scene: 'cat_on_box', en: 'The cat is ___ the box.', answer: 'on', options: ['in', 'on', 'under'], full: 'The cat is on the box.', pt: 'O gato está em cima da caixa.' },
  { scene: 'cat_in_box', en: 'The cat is ___ the box.', answer: 'in', options: ['in', 'on', 'under'], full: 'The cat is in the box.', pt: 'O gato está dentro da caixa.' },
  { scene: 'cat_under_table', en: 'The cat is ___ the table.', answer: 'under', options: ['in', 'on', 'under'], full: 'The cat is under the table.', pt: 'O gato está embaixo da mesa.' },
  { scene: 'apples_3', en: 'I see ___ apples.', answer: 'three', options: ['two', 'three', 'five'], full: 'I see three apples.', pt: 'Eu vejo três maçãs.' },
  { scene: 'apples_4', en: 'I see ___ apples.', answer: 'four', options: ['three', 'four', 'six'], full: 'I see four apples.', pt: 'Eu vejo quatro maçãs.' },
  { scene: 'ball_red', en: 'The ball is ___.', answer: 'red', options: ['red', 'blue', 'green'], full: 'The ball is red.', pt: 'A bola é vermelha.' },
  { scene: 'ball_blue', en: 'The ball is ___.', answer: 'blue', options: ['red', 'blue', 'green'], full: 'The ball is blue.', pt: 'A bola é azul.' },
  { scene: 'ball_green', en: 'The ball is ___.', answer: 'green', options: ['red', 'blue', 'green'], full: 'The ball is green.', pt: 'A bola é verde.' }
];

function makeSentenceQuestion() {
  const s = pick(SENTENCES);
  return {
    kind: 'sentence',
    text: s.en.replace('___', '<span class="blank">___</span>'),
    textPt: 'Complete a frase em inglês olhando a figura.',
    picture: s.scene,
    answer: s.answer,
    options: shuffle(s.options).map(w => ({ label: w, value: w })),
    speakAfter: s.full,
    explainFor(chosen) {
      const base = `<b>${s.full}</b> = ${s.pt} ("${s.answer}" = ${WORD_PT[s.answer]})`;
      return chosen && chosen !== s.answer ? `Você escolheu "${chosen}" (${WORD_PT[chosen]}). ${base}` : base;
    }
  };
}

// ---------- Conta da oficina (troco) ----------
function makeShopQuestion(wallet, price) {
  const r = wallet - price;
  const tens = Math.floor(price / 10) * 10, units = price % 10;
  let explain = `${wallet} − ${price} = ${r}.`;
  if (tens && units) {
    const mid = wallet - tens;
    explain += ` Dica: primeiro tire as dezenas: ${wallet} − ${tens} = ${mid}. Depois tire as unidades: ${mid} − ${units} = ${r}.`;
  } else {
    explain += ` Confira somando: ${r} + ${price} = ${wallet}.`;
  }
  return {
    kind: 'math',
    key: `s${wallet}-${price}`,
    text: `You have ${wallet} coins. It costs ${price}. How many coins will you have left?`,
    textPt: `Você tem ${wallet} moedas. Custa ${price}. Com quantas moedas você vai ficar?`,
    answer: r,
    options: numericOptions(r, [r + 10, r - 10, r + 1, r - 1, price]),
    explain
  };
}

// ---------- Revisão: o que a criança errou volta depois ----------
const Review = {
  MAX: 20,

  // guarda só dados simples (sem funções) para salvar no navegador
  add(q) {
    let item = null;
    if (q.kind === 'math') {
      const { key, text, textPt, answer, options, explain, visual } = q;
      item = { kind: 'math', key, q: { key, text, textPt, answer, options, explain, visual, kind: 'math' } };
    } else if (q.kind === 'english' && q.word) {
      item = { kind: 'english', key: 'w:' + q.word, word: q.word };
    }
    if (!item || !item.key) return;
    item.wait = 3; // volta depois de outras perguntas
    Save.update(d => {
      d.review = d.review.filter(r => r.key !== item.key);
      d.review.push(item);
      if (d.review.length > this.MAX) d.review.shift();
    });
  },

  remove(key) { Save.update(d => { d.review = d.review.filter(r => r.key !== key); }); },

  // pega uma pergunta de revisão "vencida" (e conta mais uma pergunta para as outras)
  take(kind) {
    let found = null;
    Save.update(d => {
      d.review.forEach(r => { r.wait--; });
      found = d.review.find(r => r.kind === kind && r.wait <= 0) || null;
      if (found) found.wait = 3;
    });
    return found;
  },

  record(q, correct) {
    if (!correct) this.add(q);
    else if (q.fromReview) this.remove(q.reviewKey);
  },

  count() { return Save.load().review.length; }
};
