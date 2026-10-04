// Ein Spiel MÜHLE: Brett, Vorrat, wer am Zug ist, Verlauf für Zurück, Spielende und Remis.
// Jeder Stein hat eine feste Nummer (id), damit die Darstellung ihn flüssig bewegen kann.

import {
  WHITE, BLACK, STONES, POINTS, DRAW_PLIES, initialState, legalMoves, applyMove, lossReason,
  positionKey, phaseOf, countOnBoard, material, millsAt,
} from './rules.js?v=1.0.0';

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    const s = initialState();
    this.board = s.board;
    this.hand = s.hand;
    this.turn = s.turn;
    this.ids = new Array(POINTS).fill(null);
    // Vorrat als Liste von Nummern: 0 bis 8 schwarz, 9 bis 17 weiß
    this.reserve = {
      [BLACK]: Array.from({ length: STONES }, (_, k) => k),
      [WHITE]: Array.from({ length: STONES }, (_, k) => STONES + k),
    };
    this.quiet = 0; // Halbzüge in Folge ohne Mühle, sobald beide Seiten alles gesetzt haben
    this.history = [];
    this.seen = new Map([[positionKey(this.state), 1]]);
    this.moves = legalMoves(this.state);
  }

  // Farbe eines Steins anhand seiner Nummer
  static colorOf(id) {
    return id < STONES ? BLACK : WHITE;
  }

  get state() {
    return { board: this.board, hand: this.hand, turn: this.turn };
  }

  phase(side = this.turn) {
    return phaseOf(this.state, side);
  }

  // Züge von einem Punkt (from = -1: Setzen) zu einem Punkt, mit allen Möglichkeiten zum Nehmen
  movesTo(from, to) {
    return this.moves.filter((m) => m.from === from && m.to === to);
  }

  // Ziele eines Steins (oder beim Setzen alle freien Punkte), jedes nur einmal
  targetsFrom(from) {
    return [...new Set(this.moves.filter((m) => m.from === from).map((m) => m.to))];
  }

  // Passenden erlaubten Zug zu einer Beschreibung finden (zum Beispiel vom Computer)
  match(move) {
    return this.moves.find((m) => m.from === move.from && m.to === move.to && m.remove === move.remove) || null;
  }

  apply(move) {
    const before = {
      board: this.board, hand: this.hand, turn: this.turn, ids: this.ids, quiet: this.quiet,
      reserve: { [WHITE]: this.reserve[WHITE].slice(), [BLACK]: this.reserve[BLACK].slice() },
      seen: new Map(this.seen),
    };
    const side = this.turn;
    const ids = this.ids.slice();
    let mover;
    if (move.from < 0) {
      mover = this.reserve[side].pop();
    } else {
      mover = ids[move.from];
      ids[move.from] = null;
    }
    ids[move.to] = mover;
    const mills = millsAt(move.from >= 0 ? this.board.map((v, i) => (i === move.from ? 0 : v)) : this.board, move.to, side);
    let removedId = null;
    if (move.remove >= 0) {
      removedId = ids[move.remove];
      ids[move.remove] = null;
    }

    const next = applyMove(this.state, move);
    this.board = next.board;
    this.hand = next.hand;
    this.turn = next.turn;
    this.ids = ids;
    const allPlaced = this.hand[WHITE] === 0 && this.hand[BLACK] === 0;
    this.quiet = allPlaced && move.remove < 0 ? this.quiet + 1 : 0;
    const key = positionKey(this.state);
    this.seen.set(key, (this.seen.get(key) || 0) + 1);
    this.moves = legalMoves(this.state);

    const record = { move, mover, removedId, mills, side, before };
    this.history.push(record);
    return record;
  }

  undo() {
    const record = this.history.pop();
    if (!record) return null;
    const { board, hand, turn, ids, quiet, reserve, seen } = record.before;
    Object.assign(this, { board, hand, turn, ids, quiet, reserve, seen });
    this.moves = legalMoves(this.state);
    return record;
  }

  // Steine je Seite auf dem Brett und im Vorrat
  get counts() {
    return {
      white: material(this.state, WHITE),
      black: material(this.state, BLACK),
      onBoard: { white: countOnBoard(this.board, WHITE), black: countOnBoard(this.board, BLACK) },
    };
  }

  // Ergebnis: null (läuft), { winner, reason: 'few' | 'blocked' } oder { draw: 'repetition' | 'quiet' }
  get result() {
    const loss = lossReason(this.state, this.moves);
    if (loss) return { winner: -this.turn, reason: loss };
    if (this.quiet >= DRAW_PLIES) return { draw: 'quiet' };
    if (this.seen.get(positionKey(this.state)) >= 3) return { draw: 'repetition' };
    return null;
  }

  get isOver() {
    return this.result !== null;
  }

  pieceAt(i) {
    const v = this.board[i];
    return v === 0 ? null : { id: this.ids[i], side: v };
  }

  serialize() {
    return {
      board: this.board, hand: this.hand, turn: this.turn, ids: this.ids, quiet: this.quiet,
      reserve: this.reserve, plies: this.history.length,
    };
  }

  // Gespeichertes Spiel fortsetzen (ohne Verlauf für Zurück)
  restore(data) {
    if (!data || !Array.isArray(data.board) || data.board.length !== POINTS || !Array.isArray(data.ids)) return false;
    if (!data.hand || !data.reserve || !Array.isArray(data.reserve[WHITE]) || !Array.isArray(data.reserve[BLACK])) return false;
    this.board = data.board;
    this.ids = data.ids;
    this.hand = { [WHITE]: data.hand[WHITE] | 0, [BLACK]: data.hand[BLACK] | 0 };
    this.reserve = { [WHITE]: data.reserve[WHITE].slice(), [BLACK]: data.reserve[BLACK].slice() };
    this.turn = data.turn === BLACK ? BLACK : WHITE;
    this.quiet = data.quiet || 0;
    this.history = [];
    this.seen = new Map([[positionKey(this.state), 1]]);
    this.moves = legalMoves(this.state);
    return true;
  }
}
