// Spiellogik von KARO: Klondike mit 1 oder 3 Karten, Punkte wie bei Windows oder Vegas.
// Ohne DOM. Die Darstellung (view.js) fragt hier nach und führt nur gültige Züge aus.
//
// Bereiche:
//   tableau     7 Spalten, je { down: verdeckte Karten, up: offene Karten }, letzte Karte oben
//   foundations 4 Ablagen nach Farbe (Pik, Herz, Kreuz, Karo), gespeichert als höchster Wert
//   stock       Nachziehstapel, die nächste gezogene Karte steht vorn
//   waste       gezogene Karten, die oberste steht hinten

import { deal, suitOf, rankOf, isRed } from './cards.js?v=1.0.2';

export const SCORING = {
  // Windows: Punkte für Züge, Abzug für Zeit und Durchgänge, Zeitbonus beim Sieg
  standard: { wasteToTableau: 5, toFoundation: 10, flip: 5, fromFoundation: -15, timeStep: 10, timeCost: 2, bonus: 700000 },
  // Vegas: 52 Einsatz, 5 je Karte auf einer Ablage
  vegas: { stake: 52, perCard: 5 },
};

// Wie oft der Stapel neu durchlaufen werden darf
export function maxRecycles(draw, scoring) {
  if (scoring !== 'vegas') return Infinity;
  return draw === 3 ? 2 : 0;
}

export const canStack = (card, onto) => rankOf(onto) === rankOf(card) + 1 && isRed(onto) !== isRed(card);

export class Game {
  constructor({ seed = 1, draw = 1, scoring = 'standard', level = 'random' } = {}) {
    this.seed = seed;
    this.draw = draw;
    this.scoring = scoring;
    this.level = level;
    this.reset();
  }

  reset() {
    const { tableau, stock } = deal(this.seed);
    this.tableau = tableau;
    this.stock = stock;
    this.waste = [];
    this.fan = 0; // so viele Karten des letzten Ziehens liegen noch aufgefächert
    this.foundations = [0, 0, 0, 0];
    this.recycles = 0;
    this.points = 0;
    this.elapsed = 0; // Sekunden, nur gezählt während gespielt wird
    this.moves = 0;
    this.undos = 0;
    this.hints = 0;
    this.history = [];
  }

  // ---------- Zustand ----------

  snapshot() {
    return {
      tableau: this.tableau.map((c) => ({ down: c.down.slice(), up: c.up.slice() })),
      stock: this.stock.slice(),
      waste: this.waste.slice(),
      fan: this.fan,
      foundations: this.foundations.slice(),
      recycles: this.recycles,
      points: this.points,
      moves: this.moves,
    };
  }

  load(s) {
    this.tableau = s.tableau.map((c) => ({ down: c.down.slice(), up: c.up.slice() }));
    this.stock = s.stock.slice();
    this.waste = s.waste.slice();
    this.fan = s.fan;
    this.foundations = s.foundations.slice();
    this.recycles = s.recycles;
    this.points = s.points;
    this.moves = s.moves;
  }

  serialize() {
    return {
      seed: this.seed,
      draw: this.draw,
      scoring: this.scoring,
      level: this.level,
      state: this.snapshot(),
      elapsed: this.elapsed,
      undos: this.undos,
      hints: this.hints,
      history: this.history,
    };
  }

  static restore(data) {
    try {
      const g = new Game({ seed: data.seed, draw: data.draw, scoring: data.scoring, level: data.level });
      g.load(data.state);
      g.elapsed = data.elapsed || 0;
      g.undos = data.undos || 0;
      g.hints = data.hints || 0;
      g.history = Array.isArray(data.history) ? data.history : [];
      return g.isValid() ? g : null;
    } catch {
      return null;
    }
  }

  // Jede Karte genau einmal vorhanden
  isValid() {
    const seen = new Set();
    const add = (c) => seen.add(c);
    this.tableau.forEach((col) => { col.down.forEach(add); col.up.forEach(add); });
    this.stock.forEach(add);
    this.waste.forEach(add);
    let count = seen.size;
    this.foundations.forEach((r) => { count += r; });
    const total = this.tableau.reduce((n, c) => n + c.down.length + c.up.length, 0) + this.stock.length + this.waste.length;
    return total === seen.size && count === 52 && [...seen].every((c) => c >= 0 && c < 52);
  }

  get maxRecycles() {
    return maxRecycles(this.draw, this.scoring);
  }

  get foundationCount() {
    return this.foundations.reduce((a, b) => a + b, 0);
  }

  get isWon() {
    return this.foundationCount === 52;
  }

  get started() {
    return this.moves > 0;
  }

  // Alles offen und kein Stapel mehr: der Rest geht von allein
  get canAutoComplete() {
    return !this.isWon && this.stock.length === 0 && this.waste.length === 0 && this.tableau.every((c) => c.down.length === 0);
  }

  get canRecycle() {
    return this.stock.length === 0 && this.waste.length > 0 && this.recycles < this.maxRecycles;
  }

  canFound(card) {
    return this.foundations[suitOf(card)] === rankOf(card) - 1;
  }

  topOf(col) {
    const up = this.tableau[col].up;
    return up.length ? up[up.length - 1] : null;
  }

  // ---------- Punkte ----------

  timePenalty() {
    const s = SCORING.standard;
    return Math.floor(this.elapsed / s.timeStep) * s.timeCost;
  }

  timeBonus() {
    return this.elapsed >= 30 ? Math.round(SCORING.standard.bonus / this.elapsed) : 0;
  }

  get score() {
    if (this.scoring === 'vegas') return this.foundationCount * SCORING.vegas.perCard - SCORING.vegas.stake;
    return Math.max(0, this.points - this.timePenalty());
  }

  // Endstand nach dem Sieg, bei Windows mit Zeitbonus
  get finalScore() {
    if (this.scoring === 'vegas') return this.score;
    return this.score + (this.isWon ? this.timeBonus() : 0);
  }

  addPoints(n) {
    if (this.scoring === 'standard') this.points = Math.max(0, this.points + n);
  }

  // Abzug fürs neue Durchlaufen des Stapels (Windows)
  recyclePenalty() {
    if (this.scoring !== 'standard') return 0;
    if (this.draw === 1) return -100;
    return this.recycles >= 3 ? -20 : 0;
  }

  tick(seconds) {
    if (this.started && !this.isWon) this.elapsed += seconds;
  }

  // ---------- Was liegt wo ----------

  // Karten, die ab einer Stelle bewegt würden. from: { pile, col, index, suit }
  cardsAt(from) {
    if (from.pile === 'waste') return this.waste.length ? [this.waste[this.waste.length - 1]] : [];
    if (from.pile === 'foundation') {
      const r = this.foundations[from.suit];
      return r ? [from.suit * 13 + r - 1] : [];
    }
    if (from.pile === 'tableau') {
      const up = this.tableau[from.col].up;
      const index = from.index ?? up.length - 1;
      return index >= 0 && index < up.length ? up.slice(index) : [];
    }
    return [];
  }

  // Darf diese Bewegung ausgeführt werden? to: { pile: 'tableau', col } oder { pile: 'foundation' }
  canMove(from, to) {
    const cards = this.cardsAt(from);
    if (!cards.length) return false;
    const first = cards[0];
    if (to.pile === 'foundation') {
      if (cards.length !== 1 || from.pile === 'foundation') return false;
      if (to.suit !== undefined && to.suit !== suitOf(first)) return false;
      return this.canFound(first);
    }
    if (to.pile === 'tableau') {
      if (from.pile === 'tableau' && from.col === to.col) return false;
      const top = this.topOf(to.col);
      if (top === null) return rankOf(first) === 13 && this.tableau[to.col].down.length === 0;
      return canStack(first, top);
    }
    return false;
  }

  // Alle erlaubten Ziele für eine Auswahl, die Ablage zuerst
  targetsFor(from) {
    const out = [];
    const cards = this.cardsAt(from);
    if (!cards.length) return out;
    if (cards.length === 1 && this.canMove(from, { pile: 'foundation' })) out.push({ pile: 'foundation', suit: suitOf(cards[0]) });
    for (let col = 0; col < 7; col++) {
      if (this.canMove(from, { pile: 'tableau', col })) out.push({ pile: 'tableau', col });
    }
    return out;
  }

  // Bestes Ziel für einen Tipp auf eine Karte: Ablage, sonst eine passende Spalte.
  // Ein König, der schon unten in einer leeren Spalte liegt, wird nicht sinnlos verschoben.
  bestTarget(from) {
    const targets = this.targetsFor(from);
    const cards = this.cardsAt(from);
    const useful = targets.filter((t) => {
      if (t.pile !== 'tableau' || from.pile !== 'tableau') return true;
      const col = this.tableau[from.col];
      const empty = this.topOf(t.col) === null;
      return !(empty && from.index === 0 && col.down.length === 0);
    });
    if (!useful.length) return null;
    // Bei einer Reihe aus der Spalte zuerst die Spalten probieren, dann die Ablage
    if (cards.length > 1) return useful.find((t) => t.pile === 'tableau') || null;
    const found = useful.find((t) => t.pile === 'foundation');
    if (found) return found;
    return useful.find((t) => this.topOf(t.col) !== null) || useful[0];
  }

  // ---------- Züge ----------

  // Ziehen vom Stapel, bei leerem Stapel neu durchlaufen. Liefert, was passiert ist, oder null.
  drawCards() {
    if (this.stock.length === 0) {
      if (!this.canRecycle) return null;
      this.remember();
      const penalty = this.recyclePenalty();
      this.addPoints(penalty);
      this.recycles += 1;
      this.stock = this.waste;
      this.waste = [];
      this.fan = 0;
      this.moves += 1;
      return { type: 'recycle', cards: this.stock.slice() };
    }
    this.remember();
    const cards = this.stock.splice(0, this.draw);
    this.waste.push(...cards);
    this.fan = cards.length;
    this.moves += 1;
    return { type: 'draw', cards };
  }

  // Karten bewegen. Deckt danach automatisch die nächste verdeckte Karte der Spalte auf.
  move(from, to) {
    if (!this.canMove(from, to)) return null;
    this.remember();
    const cards = this.cardsAt(from);
    const pts = SCORING.standard;
    if (from.pile === 'waste') {
      this.waste.pop();
      if (this.fan > 0) this.fan -= 1;
    } else if (from.pile === 'foundation') {
      this.foundations[from.suit] -= 1;
      this.addPoints(pts.fromFoundation);
    } else {
      this.tableau[from.col].up.splice(from.index ?? this.tableau[from.col].up.length - 1);
    }

    if (to.pile === 'foundation') {
      this.foundations[suitOf(cards[0])] += 1;
      this.addPoints(pts.toFoundation);
    } else {
      this.tableau[to.col].up.push(...cards);
      if (from.pile === 'waste') this.addPoints(pts.wasteToTableau);
    }

    let flipped = null;
    if (from.pile === 'tableau') {
      const col = this.tableau[from.col];
      if (col.up.length === 0 && col.down.length > 0) {
        flipped = col.down.pop();
        col.up.push(flipped);
        this.addPoints(pts.flip);
      }
    }
    this.moves += 1;
    return { type: 'move', from, to: to.pile === 'foundation' ? { pile: 'foundation', suit: suitOf(cards[0]) } : to, cards, flipped };
  }

  remember() {
    this.history.push(this.snapshot());
  }

  undo() {
    const prev = this.history.pop();
    if (!prev) return false;
    this.load(prev);
    this.undos += 1;
    return true;
  }

  // Nächster Zug zum automatischen Beenden: die niedrigste Karte, die auf eine Ablage passt
  autoMove() {
    let best = null;
    for (let col = 0; col < 7; col++) {
      const top = this.topOf(col);
      if (top !== null && this.canFound(top) && (best === null || rankOf(top) < rankOf(best.card))) {
        best = { card: top, from: { pile: 'tableau', col, index: this.tableau[col].up.length - 1 } };
      }
    }
    return best ? { from: best.from, to: { pile: 'foundation' } } : null;
  }

  // ---------- Festgefahren? ----------

  // Positionen im Stapel (Anzahl Karten im Ablagestapel), die durch Ziehen noch erreichbar sind
  reachableWaste() {
    const talon = this.waste.length + this.stock.length;
    const out = new Set();
    if (this.waste.length) out.add(this.waste.length);
    for (let w = this.waste.length; w < talon;) {
      w = Math.min(w + this.draw, talon);
      out.add(w);
    }
    if (this.recycles < this.maxRecycles) {
      for (let w = 0; w < talon;) {
        w = Math.min(w + this.draw, talon);
        out.add(w);
      }
    }
    return [...out];
  }

  // Gibt es noch einen Zug, der weiterhilft? Ziehen allein zählt nicht.
  hasUsefulMove() {
    const talon = this.waste.concat(this.stock);
    for (const w of this.reachableWaste()) {
      const card = talon[w - 1];
      if (this.canFound(card)) return true;
      for (let col = 0; col < 7; col++) {
        const top = this.topOf(col);
        if (top === null ? rankOf(card) === 13 : canStack(card, top)) return true;
      }
    }
    for (let col = 0; col < 7; col++) {
      const { up, down } = this.tableau[col];
      if (!up.length) continue;
      if (this.canFound(up[up.length - 1])) return true;
      for (let index = 0; index < up.length; index++) {
        const from = { pile: 'tableau', col, index };
        const opens = index === 0 && down.length > 0;
        const freesFoundation = index > 0 && this.canFound(up[index - 1]);
        if (!opens && !freesFoundation) continue;
        if (this.targetsFor(from).some((t) => t.pile === 'tableau')) return true;
      }
    }
    return false;
  }

  get isStuck() {
    return !this.isWon && !this.hasUsefulMove();
  }
}
