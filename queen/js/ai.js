// Computergegner für QUEEN: Minimax mit Alpha-Beta-Schnitt (Negamax), schrittweise vertieft,
// mit Merkliste bekannter Stellungen und Ruhesuche bei Schlägen. Ohne Darstellung.

import { legalMoves, applyMove, BLUE } from './rules.js?v=1.1.0';

export const LEVELS = {
  easy: { depth: 2, time: 200, noise: 90, blunder: 0.22 },
  medium: { depth: 5, time: 500, noise: 12, blunder: 0 },
  hard: { depth: 14, time: 900, noise: 0, blunder: 0 },
};

const WIN = 100000;
const MAN = 100;
const KING = 320;

// Bewertung aus Sicht der Seite side
export function evaluate(board, side) {
  let score = 0;
  let pieces = 0;
  for (let i = 0; i < 64; i++) {
    const v = board[i];
    if (v === 0) continue;
    pieces++;
    const s = v > 0 ? 1 : -1;
    const r = i >> 3;
    const c = i & 7;
    let value;
    if (v === 2 || v === -2) {
      value = KING;
    } else {
      const advance = s === BLUE ? 7 - r : r; // 0 bis 7
      value = MAN + advance * 4;
      if ((s === BLUE && r === 7) || (s !== BLUE && r === 0)) value += 10; // sichere Grundreihe
      if (c === 0 || c === 7) value -= 4; // Rand ist schwächer
    }
    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) value += 8; // Mitte
    score += s * value;
  }
  // Im Endspiel zählt Material noch mehr: Tausch anstreben, wenn man vorne liegt
  if (pieces < 10) score *= 1.15;
  return score * side;
}

export function chooseMove(board, side, level = 'medium', { random = Math.random, now = () => Date.now() } = {}) {
  const cfg = LEVELS[level] || LEVELS.medium;
  const root = legalMoves(board, side);
  if (root.length === 0) return null;
  if (root.length === 1) return root[0];

  // Leicht: gelegentlich ein menschlicher Fehler
  if (cfg.blunder && random() < cfg.blunder) return root[Math.floor(random() * root.length)];

  const deadline = now() + cfg.time;
  const table = new Map();
  let nodes = 0;
  let stop = false;

  const order = (moves, best) => moves
    .map((m) => ({ m, k: (best && m.from === best.from && m.to === best.to ? 1000 : 0) + m.captured.length * 10 + (m.crown ? 5 : 0) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.m);

  function search(b, s, depth, alpha, beta, ply) {
    if ((++nodes & 2047) === 0 && now() > deadline) stop = true;
    if (stop) return 0;
    const moves = legalMoves(b, s);
    if (moves.length === 0) return -WIN + ply;
    // Schläge sind Pflicht: in solchen Stellungen weiterrechnen (Ruhesuche), höchstens 8 Halbzüge extra
    const forced = moves[0].captured.length > 0;
    if (depth <= 0 && (!forced || depth < -8)) return evaluate(b, s);

    const key = b.join('') + s;
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
      const score = -search(applyMove(b, m), -s, depth - 1, -beta, -alpha, ply + 1);
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
  let scored = root.map((m) => ({ m, score: 0 }));
  for (let depth = 1; depth <= cfg.depth; depth++) {
    const current = [];
    let alpha = -Infinity;
    for (const { m } of scored) {
      const score = -search(applyMove(board, m), -side, depth - 1, -Infinity, -alpha + cfg.noise + 1, 1);
      if (stop) break;
      current.push({ m, score });
      if (score > alpha) alpha = score;
    }
    if (stop) break;
    scored = current.sort((a, b) => b.score - a.score);
    if (scored[0].score > WIN - 100) break; // Gewinn gefunden
  }

  // Unter fast gleich guten Zügen zufällig wählen, damit das Spiel nicht immer gleich verläuft
  const top = scored[0].score;
  const near = scored.filter((x) => x.score >= top - cfg.noise);
  return near[Math.floor(random() * near.length)].m;
}
