// Computergegner für MÜHLE: Minimax mit Alpha-Beta-Schnitt (Negamax), schrittweise vertieft,
// mit Merkliste bekannter Stellungen. Ohne Darstellung.

import { legalMoves, applyMove, lossReason, positionKey, phaseOf, countOnBoard, MILLS, ADJACENT, POINTS } from './rules.js?v=1.0.0';

export const LEVELS = {
  easy: { depth: 2, time: 200, noise: 60, blunder: 0.25 },
  medium: { depth: 4, time: 500, noise: 8, blunder: 0 },
  hard: { depth: 12, time: 1000, noise: 0, blunder: 0 },
};

const WIN = 100000;
const STONE = 100;

// Bewertung aus Sicht der Seite side
export function evaluate(state, side) {
  const { board, hand } = state;
  let score = 0;
  for (const s of [side, -side]) {
    const sign = s === side ? 1 : -1;
    const stones = countOnBoard(board, s) + hand[s];
    let value = stones * STONE;
    // Mühlen und offene Zweier (zwei eigene Steine, dritter Punkt frei) auf jeder Linie
    for (const m of MILLS) {
      let own = 0;
      let free = 0;
      for (const p of m) {
        if (board[p] === s) own++;
        else if (board[p] === 0) free++;
      }
      if (own === 3) value += 8;
      else if (own === 2 && free === 1) value += 14;
    }
    // Beweglichkeit in der Zugphase: eingesperrte Steine sind schwach, ganz eingesperrt verliert
    if (phaseOf(state, s) === 'move') {
      let mobility = 0;
      for (let i = 0; i < POINTS; i++) {
        if (board[i] !== s) continue;
        let free = 0;
        for (const j of ADJACENT[i]) if (board[j] === 0) free++;
        mobility += free;
        if (free === 0) value -= 6;
      }
      value += mobility * 4;
    }
    score += sign * value;
  }
  return score;
}

// only: Auswahl auf bestimmte Züge beschränken, zum Beispiel beim Tipp, welcher Stein genommen wird
export function chooseMove(state, level = 'medium', { random = Math.random, now = () => Date.now(), only = null } = {}) {
  const cfg = LEVELS[level] || LEVELS.medium;
  const root = only && only.length ? only : legalMoves(state);
  if (root.length === 0) return null;
  if (root.length === 1) return root[0];

  // Leicht: gelegentlich ein menschlicher Fehler, aber eine Mühle lässt auch Leicht nicht liegen
  if (cfg.blunder && random() < cfg.blunder) {
    const quiet = root.filter((m) => m.remove < 0);
    if (quiet.length === root.length) return root[Math.floor(random() * root.length)];
  }

  const deadline = now() + cfg.time;
  const table = new Map();
  let nodes = 0;
  let stop = false;

  const same = (a, b) => b && a.from === b.from && a.to === b.to && a.remove === b.remove;
  const order = (moves, best) => moves
    .map((m) => ({ m, k: (same(m, best) ? 1000 : 0) + (m.remove >= 0 ? 50 : 0) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.m);

  function search(s, depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && now() > deadline) stop = true;
    if (stop) return 0;
    const moves = legalMoves(s);
    if (lossReason(s, moves)) return -WIN + ply;
    if (depth <= 0) return evaluate(s, s.turn);

    const key = positionKey(s);
    const hit = table.get(key);
    if (hit && hit.depth >= depth) {
      if (hit.flag === 0) return hit.score;
      if (hit.flag === 1 && hit.score >= beta) return hit.score;
      if (hit.flag === -1 && hit.score <= alpha) return hit.score;
    }

    let best = -Infinity;
    let bestMove = null;
    const a0 = alpha;
    for (const m of order(moves, hit && hit.move)) {
      const score = -search(applyMove(s, m), depth - 1, -beta, -alpha, ply + 1);
      if (stop) return 0;
      if (score > best) {
        best = score;
        bestMove = m;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    table.set(key, { depth, score: best, move: bestMove, flag: best <= a0 ? -1 : best >= beta ? 1 : 0 });
    return best;
  }

  // Schrittweise tiefer rechnen, solange Zeit bleibt
  let scored = order(root, null).map((m) => ({ m, score: 0 }));
  for (let depth = 1; depth <= cfg.depth; depth++) {
    const current = [];
    let alpha = -Infinity;
    for (const { m } of scored) {
      const score = -search(applyMove(state, m), depth - 1, -Infinity, -alpha + cfg.noise + 1, 1);
      if (stop) break;
      current.push({ m, score });
      if (score > alpha) alpha = score;
    }
    if (stop) break;
    scored = current.sort((a, b) => b.score - a.score);
    if (scored[0].score > WIN - 100) break; // Gewinn gefunden
    if (scored[0].score < -WIN + 100 && depth > 1) break; // Verlust ist nicht mehr abzuwenden
  }

  // Unter fast gleich guten Zügen zufällig wählen, damit das Spiel nicht immer gleich verläuft
  const top = scored[0].score;
  const near = scored.filter((x) => x.score >= top - cfg.noise);
  return near[Math.floor(random() * near.length)].m;
}
