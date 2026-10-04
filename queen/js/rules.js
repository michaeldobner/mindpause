// Regeln der Deutschen Dame, ohne Darstellung. Schnell genug für den Computergegner.
//
// Brett: 64 Felder, Index = Zeile * 8 + Spalte. Gespielt wird nur auf den dunklen Feldern
// ((Zeile + Spalte) ungerade). Inhalt eines Feldes:
//    0  leer
//    1  blauer Stein      2  blaue Dame
//   -1  schwarzer Stein  -2  schwarze Dame
// Blau (Seite 1) beginnt unten und zieht nach oben, Schwarz (Seite -1) beginnt oben.
//
// Regeln:
// * Steine ziehen ein Feld diagonal vorwärts.
// * Steine schlagen diagonal vorwärts und rückwärts, indem sie über einen gegnerischen Stein springen.
// * Damen ziehen und schlagen über beliebig viele freie Felder (fliegende Damen).
// * Schlagpflicht. Gibt es mehrere Schlagmöglichkeiten, ist die Wahl frei.
// * Ein Schlag wird vollständig ausgeführt (Mehrfachschlag). Geschlagene Steine werden erst
//   am Ende entfernt und dürfen nicht zweimal übersprungen werden.
// * Ein Stein, der seinen Zug auf der gegnerischen Grundreihe beendet, wird zur Dame.
//   Kann er dort weiterschlagen, schlägt er als Stein weiter und wird nicht gekrönt.
// * Wer nicht mehr ziehen kann, hat verloren.
// * Remis: dreimal dieselbe Stellung, oder 30 Halbzüge in Folge nur mit Damen ohne Schlag.

export const BLUE = 1;
export const BLACK = -1;
export const DRAW_PLIES = 30;

const DIRS = [-9, -7, 7, 9];

const row = (i) => i >> 3;
const col = (i) => i & 7;

// Nächstes Feld in Richtung d, oder -1 am Rand
function step(i, d) {
  const c = col(i);
  if ((d === -9 || d === 7) && c === 0) return -1;
  if ((d === -7 || d === 9) && c === 7) return -1;
  const j = i + d;
  return j < 0 || j > 63 ? -1 : j;
}

export const isDark = (i) => ((row(i) + col(i)) & 1) === 1;
export const sideOf = (v) => Math.sign(v);
export const isKing = (v) => Math.abs(v) === 2;

export function initialBoard() {
  const b = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    if (!isDark(i)) continue;
    if (row(i) <= 2) b[i] = BLACK;
    if (row(i) >= 5) b[i] = BLUE;
  }
  return b;
}

const forward = (side) => (side === BLUE ? [-9, -7] : [7, 9]);
const crownRow = (side) => (side === BLUE ? 0 : 7);

// Alle Schlagfolgen eines Teils. Ergebnis: Züge { from, to, path, captured, crown }
function capturesFrom(board, from) {
  const piece = board[from];
  const side = sideOf(piece);
  const king = isKing(piece);
  const result = [];

  const walk = (pos, path, captured) => {
    let extended = false;
    for (const d of DIRS) {
      if (king) {
        // Fliegende Dame: über freie Felder bis zum ersten besetzten Feld
        let j = step(pos, d);
        while (j >= 0 && (board[j] === 0 || j === from)) j = step(j, d);
        if (j < 0 || sideOf(board[j]) !== -side || captured.includes(j)) continue;
        let land = step(j, d);
        while (land >= 0 && (board[land] === 0 || land === from)) {
          extended = true;
          walk(land, [...path, land], [...captured, j]);
          land = step(land, d);
        }
      } else {
        const over = step(pos, d);
        if (over < 0 || sideOf(board[over]) !== -side || captured.includes(over)) continue;
        const land = step(over, d);
        if (land < 0 || (board[land] !== 0 && land !== from)) continue;
        extended = true;
        walk(land, [...path, land], [...captured, over]);
      }
    }
    if (!extended && captured.length > 0) {
      const to = path[path.length - 1];
      result.push({ from, to, path, captured, crown: !king && row(to) === crownRow(side) });
    }
  };

  walk(from, [], []);
  return result;
}

function quietFrom(board, from) {
  const piece = board[from];
  const side = sideOf(piece);
  const moves = [];
  if (isKing(piece)) {
    for (const d of DIRS) {
      let j = step(from, d);
      while (j >= 0 && board[j] === 0) {
        moves.push({ from, to: j, path: [j], captured: [], crown: false });
        j = step(j, d);
      }
    }
  } else {
    for (const d of forward(side)) {
      const j = step(from, d);
      if (j >= 0 && board[j] === 0) moves.push({ from, to: j, path: [j], captured: [], crown: row(j) === crownRow(side) });
    }
  }
  return moves;
}

// Alle erlaubten Züge einer Seite (mit Schlagpflicht)
export function legalMoves(board, side) {
  const caps = [];
  const seen = new Set();
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) !== side) continue;
    for (const m of capturesFrom(board, i)) {
      // Gleiche Folge über andere Zwischenwege nur einmal anbieten
      const key = `${m.from}>${m.path.join('>')}`;
      if (!seen.has(key)) {
        seen.add(key);
        caps.push(m);
      }
    }
  }
  if (caps.length) return caps;
  const moves = [];
  for (let i = 0; i < 64; i++) if (sideOf(board[i]) === side) moves.push(...quietFrom(board, i));
  return moves;
}

// Zug ausführen, gibt ein neues Brett zurück
export function applyMove(board, move) {
  const b = board.slice();
  const piece = b[move.from];
  b[move.from] = 0;
  for (const c of move.captured) b[c] = 0;
  b[move.to] = move.crown ? 2 * sideOf(piece) : piece;
  return b;
}

export function countPieces(board) {
  let blue = 0;
  let black = 0;
  for (const v of board) {
    if (v > 0) blue++;
    else if (v < 0) black++;
  }
  return { blue, black };
}

export const positionKey = (board, side) => board.join('') + side;

export const coords = (i) => ({ r: row(i), c: col(i) });
export const indexOf = (r, c) => r * 8 + c;
