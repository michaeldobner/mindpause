// Ein Spiel QUEEN: Brett, wer am Zug ist, Verlauf für Zurück, Spielende und Remis.
// Jeder Stein hat eine feste Nummer (id), damit die Darstellung ihn flüssig bewegen kann.

import { BLUE, BLACK, DRAW_PLIES, initialBoard, legalMoves, applyMove, countPieces, positionKey, sideOf, isKing } from './rules.js?v=1.3.0';

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = initialBoard();
    this.ids = this.board.map(() => null);
    let id = 0;
    this.board.forEach((v, i) => {
      if (v !== 0) this.ids[i] = id++;
    });
    this.turn = BLUE;
    this.quiet = 0; // Halbzüge in Folge nur mit Damen und ohne Schlag
    this.resigned = null; // Seite, die aufgegeben hat
    this.history = [];
    this.seen = new Map([[positionKey(this.board, this.turn), 1]]);
    this.moves = legalMoves(this.board, this.turn);
  }

  // Farbe eines Steins anhand seiner Nummer: 0 bis 11 schwarz, 12 bis 23 blau
  static colorOf(id) {
    return id < 12 ? BLACK : BLUE;
  }

  // Führen mehrere Schlagwege zum selben Feld, gilt der Weg mit den meisten geschlagenen Steinen
  findMove(from, to) {
    let best = null;
    for (const m of this.moves) {
      if (m.from === from && m.to === to && (!best || m.captured.length > best.captured.length)) best = m;
    }
    return best;
  }

  movesFrom(from) {
    return this.moves.filter((m) => m.from === from);
  }

  // Passenden erlaubten Zug zu einer Beschreibung { from, path } finden (zum Beispiel vom Computer)
  match(move) {
    return this.moves.find((m) => m.from === move.from && m.path.join() === move.path.join()) || null;
  }

  apply(move) {
    const before = { board: this.board, ids: this.ids, turn: this.turn, quiet: this.quiet, seen: new Map(this.seen) };
    const mover = this.ids[move.from];
    const capturedIds = move.captured.map((c) => this.ids[c]);
    const wasKing = isKing(this.board[move.from]);

    const ids = this.ids.slice();
    ids[move.from] = null;
    for (const c of move.captured) ids[c] = null;
    ids[move.to] = mover;

    this.board = applyMove(this.board, move);
    this.ids = ids;
    this.quiet = move.captured.length === 0 && wasKing ? this.quiet + 1 : 0;
    this.turn = -this.turn;
    const key = positionKey(this.board, this.turn);
    this.seen.set(key, (this.seen.get(key) || 0) + 1);
    this.moves = legalMoves(this.board, this.turn);

    const record = { move, mover, capturedIds, crowned: move.crown, side: -this.turn, before };
    this.history.push(record);
    return record;
  }

  undo() {
    const record = this.history.pop();
    if (!record) return null;
    const { board, ids, turn, quiet, seen } = record.before;
    Object.assign(this, { board, ids, turn, quiet, seen });
    this.moves = legalMoves(this.board, this.turn);
    return record;
  }

  get counts() {
    return countPieces(this.board);
  }

  // Aufgeben: die Seite side gibt auf, die andere gewinnt. Mit null wieder aufheben.
  resign(side) {
    this.resigned = side;
  }

  // Ergebnis: null (läuft), { winner: BLUE | BLACK, resigned? } oder { draw: 'repetition' | 'quiet' }
  get result() {
    if (this.resigned) return { winner: -this.resigned, resigned: true };
    if (this.moves.length === 0) return { winner: -this.turn };
    if (this.quiet >= DRAW_PLIES) return { draw: 'quiet' };
    if (this.seen.get(positionKey(this.board, this.turn)) >= 3) return { draw: 'repetition' };
    return null;
  }

  get isOver() {
    return this.result !== null;
  }

  pieceAt(i) {
    const v = this.board[i];
    return v === 0 ? null : { id: this.ids[i], side: sideOf(v), king: isKing(v) };
  }

  serialize() {
    return { board: this.board, ids: this.ids, turn: this.turn, quiet: this.quiet, plies: this.history.length, resigned: this.resigned };
  }

  // Gespeichertes Spiel fortsetzen (ohne Verlauf für Zurück)
  restore(data) {
    if (!data || !Array.isArray(data.board) || data.board.length !== 64 || !Array.isArray(data.ids)) return false;
    this.board = data.board;
    this.ids = data.ids;
    this.turn = data.turn === BLACK ? BLACK : BLUE;
    this.quiet = data.quiet || 0;
    this.resigned = data.resigned === BLUE || data.resigned === BLACK ? data.resigned : null;
    this.history = [];
    this.seen = new Map([[positionKey(this.board, this.turn), 1]]);
    this.moves = legalMoves(this.board, this.turn);
    return true;
  }
}
