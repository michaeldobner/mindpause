// Löser für KARO. Kennt alle Karten (auch verdeckte) und sucht per Tiefensuche einen Weg zum Sieg.
//
// Genutzt für:
//   * den Tipp im Spiel (im Hintergrund, solver-worker.js)
//   * die Einteilung der Spielnummern in Schwierigkeitsstufen (tools/deals.mjs, vorab auf dem Rechner)
//
// Der Stapel wird als eine Reihe betrachtet: talon = Ablagestapel + Nachziehstapel, w = Größe des
// Ablagestapels. Ziehen erhöht w, neu Durchlaufen setzt w auf 0. Statt einzelner Ziehzüge kennt der
// Löser nur „spiele die Karte an Stelle p“, das spart sehr viel Suche.

import { suitOf, rankOf, isRed } from './cards.js?v=1.0.0';

const stacks = (card, onto) => rankOf(onto) === rankOf(card) + 1 && isRed(onto) !== isRed(card);

// Zustand des Spiels in die Form des Lösers bringen
export function fromGame(game) {
  return {
    cols: game.tableau.map((c) => c.down.concat(c.up)),
    downs: game.tableau.map((c) => c.down.length),
    found: game.foundations.slice(),
    talon: game.waste.concat(game.stock),
    w: game.waste.length,
    rec: game.recycles,
  };
}

function key(s, limited) {
  const cols = s.cols.map((c, i) => String.fromCharCode(48 + s.downs[i]) + String.fromCharCode(...c.map((x) => x + 60))).sort();
  return `${s.found.join(',')}|${s.w}|${limited ? s.rec : ''}|${String.fromCharCode(...s.talon.map((x) => x + 60))}|${cols.join('/')}`;
}

const canFound = (s, card) => s.found[suitOf(card)] === rankOf(card) - 1;

// Eine Karte kann gefahrlos auf die Ablage, wenn alle Karten, die auf ihr liegen könnten,
// schon auf den Ablagen liegen
function safeToFound(s, card) {
  const r = rankOf(card);
  if (r <= 2) return true;
  const red = isRed(card);
  for (let suit = 0; suit < 4; suit++) {
    if ((suit % 2 === 1) !== red && s.found[suit] < r - 1) return false;
  }
  return true;
}

// Erreichbare Stellen im Stapel: [{ pos, rec }] mit pos = Größe des Ablagestapels danach + 1
function talonPositions(s, draw, maxRec) {
  const L = s.talon.length;
  const out = new Map();
  if (s.w > 0) out.set(s.w, s.rec);
  for (let w = s.w; w < L;) {
    w = Math.min(w + draw, L);
    if (!out.has(w)) out.set(w, s.rec);
  }
  if (s.rec < maxRec) {
    for (let w = 0; w < L;) {
      w = Math.min(w + draw, L);
      if (!out.has(w)) out.set(w, s.rec + 1);
    }
  }
  return [...out].map(([pos, rec]) => ({ pos, rec }));
}

function generate(s, draw, maxRec) {
  const tops = s.cols.map((c) => (c.length ? c[c.length - 1] : -1));
  const empty = tops.indexOf(-1);

  // Gefahrlose Ablage-Züge zuerst und allein
  for (let col = 0; col < 7; col++) {
    if (tops[col] >= 0 && canFound(s, tops[col]) && safeToFound(s, tops[col])) return [{ k: 'tf', col }];
  }
  if (s.w > 0) {
    const card = s.talon[s.w - 1];
    if (canFound(s, card) && safeToFound(s, card)) return [{ k: 'pf', pos: s.w, rec: s.rec }];
  }

  const found = [];
  const reveal = [];
  const fromTalon = [];
  const partial = [];
  const shift = [];
  const back = [];

  for (let col = 0; col < 7; col++) {
    if (tops[col] >= 0 && canFound(s, tops[col])) found.push({ k: 'tf', col });
  }
  const positions = talonPositions(s, draw, maxRec);
  for (const { pos, rec } of positions) {
    const card = s.talon[pos - 1];
    if (canFound(s, card)) found.push({ k: 'pf', pos, rec });
    for (let to = 0; to < 7; to++) {
      if (tops[to] >= 0 ? stacks(card, tops[to]) : rankOf(card) === 13 && to === empty) {
        fromTalon.push({ k: 'pt', pos, rec, to });
      }
    }
  }

  for (let col = 0; col < 7; col++) {
    const cards = s.cols[col];
    const d = s.downs[col];
    for (let idx = d; idx < cards.length; idx++) {
      const card = cards[idx];
      const opens = idx === d && d > 0;
      const clears = idx === 0;
      const frees = idx > d && canFound(s, cards[idx - 1]);
      if (!opens && !clears && !frees) continue;
      for (let to = 0; to < 7; to++) {
        if (to === col) continue;
        const ok = tops[to] >= 0 ? stacks(card, tops[to]) : rankOf(card) === 13 && to === empty && !clears;
        if (!ok) continue;
        const m = { k: 'tt', col, idx, to };
        if (opens) reveal.push([d, m]);
        else if (frees) partial.push(m);
        else shift.push(m);
      }
    }
  }

  // Von der Ablage zurück, nur wenn danach etwas daraufpassen kann
  for (let suit = 0; suit < 4; suit++) {
    const r = s.found[suit];
    if (r < 3) continue;
    const card = suit * 13 + r - 1;
    const wanted = (c) => rankOf(c) === r - 1 && isRed(c) !== isRed(card);
    let useful = s.talon.some(wanted);
    for (let col = 0; col < 7 && !useful; col++) {
      for (let i = s.downs[col]; i < s.cols[col].length; i++) if (wanted(s.cols[col][i])) useful = true;
    }
    if (!useful) continue;
    for (let to = 0; to < 7; to++) {
      if (tops[to] >= 0 && stacks(card, tops[to])) back.push({ k: 'ft', suit, to });
    }
  }

  reveal.sort((a, b) => b[0] - a[0]);
  return [...found, ...reveal.map((x) => x[1]), ...fromTalon, ...partial, ...shift, ...back];
}

function apply(s, m) {
  const n = { cols: s.cols.slice(), downs: s.downs.slice(), found: s.found, talon: s.talon, w: s.w, rec: s.rec };
  const flip = (col) => {
    if (n.downs[col] > 0 && n.downs[col] >= n.cols[col].length) n.downs[col] = n.cols[col].length - 1;
  };
  if (m.k === 'tf' || m.k === 'tt') {
    const from = s.cols[m.col];
    const idx = m.k === 'tf' ? from.length - 1 : m.idx;
    const moving = from.slice(idx);
    n.cols[m.col] = from.slice(0, idx);
    if (m.k === 'tf') {
      n.found = s.found.slice();
      n.found[suitOf(moving[0])] += 1;
    } else {
      n.cols[m.to] = s.cols[m.to].concat(moving);
    }
    flip(m.col);
  } else if (m.k === 'pf' || m.k === 'pt') {
    const card = s.talon[m.pos - 1];
    n.talon = s.talon.slice(0, m.pos - 1).concat(s.talon.slice(m.pos));
    n.w = m.pos - 1;
    n.rec = m.rec;
    if (m.k === 'pf') {
      n.found = s.found.slice();
      n.found[suitOf(card)] += 1;
    } else {
      n.cols[m.to] = s.cols[m.to].concat([card]);
    }
  } else if (m.k === 'ft') {
    n.found = s.found.slice();
    n.found[m.suit] -= 1;
    n.cols[m.to] = s.cols[m.to].concat([m.suit * 13 + s.found[m.suit] - 1]);
  }
  return n;
}

// Alles offen und kein Stapel: geht immer auf
const finished = (s) => s.talon.length === 0 && s.downs.every((d) => d === 0);

// Sucht eine Lösung. budget = höchstens so viele untersuchte Stellungen.
// Ergebnis: { status: 'solved' | 'unsolvable' | 'timeout', path, nodes }
export function solve(start, { draw = 1, maxRec = Infinity, budget = 200000 } = {}) {
  const limited = Number.isFinite(maxRec);
  const seen = new Set();
  const path = [];
  let nodes = 0;
  let timeout = false;

  function search(s) {
    if (finished(s)) return true;
    if (++nodes > budget) {
      timeout = true;
      return false;
    }
    const k = key(s, limited);
    if (seen.has(k)) return false;
    seen.add(k);
    for (const m of generate(s, draw, maxRec)) {
      path.push(m);
      if (search(apply(s, m))) return true;
      path.pop();
      if (timeout) return false;
    }
    return false;
  }

  const ok = search(start);
  return { status: ok ? 'solved' : timeout ? 'timeout' : 'unsolvable', path: ok ? path : [], nodes };
}

// Ersten Zug einer Lösung in einen Zug des Spiels übersetzen.
// { type: 'draw' } oder { type: 'move', from, to }
export function toGameMove(game, m) {
  if (!m) return null;
  if (m.k === 'tf') return { type: 'move', from: { pile: 'tableau', col: m.col, index: game.tableau[m.col].up.length - 1 }, to: { pile: 'foundation' } };
  if (m.k === 'tt') return { type: 'move', from: { pile: 'tableau', col: m.col, index: m.idx - game.tableau[m.col].down.length }, to: { pile: 'tableau', col: m.to } };
  if (m.k === 'ft') return { type: 'move', from: { pile: 'foundation', suit: m.suit }, to: { pile: 'tableau', col: m.to } };
  if (m.pos !== game.waste.length) return { type: 'draw' };
  return { type: 'move', from: { pile: 'waste' }, to: m.k === 'pf' ? { pile: 'foundation' } : { pile: 'tableau', col: m.to } };
}

// Tipp für die aktuelle Stellung
export function hintFor(game, budget = 60000) {
  if (game.canAutoComplete) {
    const m = game.autoMove();
    return m ? { status: 'solved', move: { type: 'move', ...m } } : { status: 'unsolvable' };
  }
  const r = solve(fromGame(game), { draw: game.draw, maxRec: game.maxRecycles, budget });
  return { status: r.status, move: r.status === 'solved' ? toGameMove(game, r.path[0]) : null, nodes: r.nodes };
}
