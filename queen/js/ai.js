// Computergegner für QUEEN: Minimax mit Alpha-Beta-Schnitt (Negamax), schrittweise vertieft,
// mit Merkliste bekannter Stellungen und Ruhesuche bei Schlägen. Ohne Darstellung.

import { legalMoves, applyMove, BLUE } from './rules.js?v=1.3.0';

// depth: Suchtiefe in Halbzügen. quiet: wie viele Halbzüge ein laufender Schlagabtausch noch zu Ende
// gerechnet wird. noise: Spielraum in Punkten, gewählt wird zufällig unter Zügen, die höchstens so viel
// schlechter sind als der beste. Niedrige Stufen sehen deshalb nicht weit genug, statt plötzlich
// absichtlich einen Stein zu verschenken: Fehler wirken wie menschliches Übersehen. careless: Anteil
// unaufmerksamer Züge, die wie bei Einsteiger nur den eigenen Zug ansehen.
export const LEVELS = {
  beginner: { depth: 1, quiet: 0, time: 150, noise: 60 },
  easy: { depth: 2, quiet: 1, time: 250, noise: 35, careless: 0.5 },
  medium: { depth: 4, quiet: 6, time: 500, noise: 10, careless: 0.2 },
  hard: { depth: 14, quiet: 8, time: 900, noise: 0 },
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
  // Klarer Vorsprung im Endspiel: Damen des Stärkeren rücken an die letzten Steine heran.
  // Sonst würde der Computer einen einzelnen Stein endlos umkreisen, statt ihn einzufangen.
  if (pieces <= 9 && Math.abs(score) >= 150) score += hunt(board, score > 0 ? 1 : -1);
  return score * side;
}

// Je näher die Damen der Seite strong an den gegnerischen Steinen stehen, desto höher (aus Sicht von Blau)
function hunt(board, strong) {
  const targets = [];
  const kings = [];
  for (let i = 0; i < 64; i++) {
    const v = board[i];
    if (v === 0) continue;
    if (Math.sign(v) !== strong) targets.push(i);
    else if (v === 2 * strong) kings.push(i);
  }
  if (targets.length === 0 || kings.length === 0) return 0;
  let bonus = 0;
  // Lange Diagonale (a1 bis h8): wer sie hält, kann eine einzelne Dame nicht entkommen lassen
  const onLong = (i) => (i >> 3) + (i & 7) === 7;
  if (kings.some(onLong)) bonus += 40;
  if (targets.some((i) => onLong(i) && Math.abs(board[i]) === 2)) bonus -= 60;
  // Gegner einengen: je weniger Züge er hat, desto besser
  bonus += (16 - Math.min(16, legalMoves(board, -strong).length)) * 8;
  for (const k of kings) {
    let near = 8;
    for (const e of targets) near = Math.min(near, Math.max(Math.abs((k >> 3) - (e >> 3)), Math.abs((k & 7) - (e & 7))));
    bonus += (8 - near) * 4;
  }
  return bonus * strong;
}

export function chooseMove(board, side, level = 'medium', { random = Math.random, now = () => Date.now() } = {}) {
  let cfg = LEVELS[level] || LEVELS.medium;
  const root = legalMoves(board, side);
  if (root.length === 0) return null;
  if (root.length === 1) return root[0];
  // Unaufmerksamer Zug: schaut nur auf den eigenen Zug, wie ein Mensch, der gerade nicht genau hinsieht
  if (cfg.careless && random() < cfg.careless) cfg = LEVELS.beginner;

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
    // Schläge sind Pflicht: in solchen Stellungen weiterrechnen (Ruhesuche), höchstens quiet Halbzüge extra
    const forced = moves[0].captured.length > 0;
    if (depth <= 0 && (!forced || -depth >= cfg.quiet)) return evaluate(b, s);

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
