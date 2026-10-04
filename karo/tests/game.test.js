import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deal, shuffled, suitOf, rankOf, cardOf } from '../js/cards.js';
import { Game, maxRecycles } from '../js/game.js';

const K = (suit, rank) => cardOf(suit, rank);

// Leere Stellung zum Ausprobieren einzelner Regeln
function empty(opts = {}) {
  const g = new Game(opts);
  g.tableau.forEach((c) => { c.down = []; c.up = []; });
  g.stock = [];
  g.waste = [];
  g.foundations = [0, 0, 0, 0];
  return g;
}

test('Gleiche Spielnummer, gleiche Verteilung; jede Karte genau einmal', () => {
  assert.deepEqual(shuffled(42), shuffled(42));
  assert.notDeepEqual(shuffled(42), shuffled(43));
  const d = deal(7);
  const all = [...d.stock, ...d.tableau.flatMap((c) => [...c.down, ...c.up])].sort((a, b) => a - b);
  assert.deepEqual(all, Array.from({ length: 52 }, (_, i) => i));
  d.tableau.forEach((c, i) => {
    assert.equal(c.down.length, i);
    assert.equal(c.up.length, 1);
  });
  assert.equal(d.stock.length, 24);
});

test('Karten: Farbe und Wert', () => {
  assert.equal(suitOf(K(3, 12)), 3);
  assert.equal(rankOf(K(3, 12)), 12);
});

test('Anlegen nur abwechselnd rot und schwarz, absteigend; König auf leere Spalte', () => {
  const g = empty();
  g.tableau[0].up = [K(0, 8)]; // Pik 8
  g.tableau[1].up = [K(1, 7)]; // Herz 7
  g.tableau[2].up = [K(2, 7)]; // Kreuz 7
  g.tableau[3].up = [K(3, 13)]; // Karo König
  assert.ok(g.canMove({ pile: 'tableau', col: 1 }, { pile: 'tableau', col: 0 }));
  assert.ok(!g.canMove({ pile: 'tableau', col: 2 }, { pile: 'tableau', col: 0 }));
  assert.ok(g.canMove({ pile: 'tableau', col: 3 }, { pile: 'tableau', col: 4 }));
  assert.ok(!g.canMove({ pile: 'tableau', col: 1 }, { pile: 'tableau', col: 4 }));
});

test('Ablage nur in Reihenfolge ab dem Ass', () => {
  const g = empty();
  g.tableau[0].up = [K(1, 2)];
  g.tableau[1].up = [K(1, 1)];
  assert.ok(!g.canMove({ pile: 'tableau', col: 0 }, { pile: 'foundation' }));
  assert.ok(g.move({ pile: 'tableau', col: 1 }, { pile: 'foundation' }));
  assert.ok(g.move({ pile: 'tableau', col: 0 }, { pile: 'foundation' }));
  assert.equal(g.foundations[1], 2);
});

test('Verdeckte Karte wird aufgedeckt, Punkte wie bei Windows', () => {
  const g = empty();
  g.tableau[0].down = [K(0, 5)];
  g.tableau[0].up = [K(1, 1)];
  const rec = g.move({ pile: 'tableau', col: 0 }, { pile: 'foundation' });
  assert.equal(rec.flipped, K(0, 5));
  assert.deepEqual(g.tableau[0].up, [K(0, 5)]);
  assert.equal(g.points, 10 + 5);
  g.waste = [K(1, 4)];
  g.move({ pile: 'waste' }, { pile: 'tableau', col: 0 });
  assert.equal(g.points, 20);
  g.foundations[0] = 3;
  g.points = 10;
  assert.ok(g.move({ pile: 'foundation', suit: 0 }, { pile: 'tableau', col: 0 }));
  assert.equal(g.points, 0, 'nie unter null');
});

test('Ganze Reihe verschieben', () => {
  const g = empty();
  g.tableau[0].up = [K(0, 9), K(1, 8), K(2, 7)];
  g.tableau[1].up = [K(3, 10)];
  assert.ok(g.move({ pile: 'tableau', col: 0, index: 0 }, { pile: 'tableau', col: 1 }));
  assert.deepEqual(g.tableau[1].up, [K(3, 10), K(0, 9), K(1, 8), K(2, 7)]);
});

test('Ziehen mit 1 und 3 Karten, neu durchlaufen mit Abzug', () => {
  const g1 = new Game({ seed: 3, draw: 1 });
  const first = g1.stock[0];
  g1.drawCards();
  assert.deepEqual(g1.waste, [first]);
  while (g1.stock.length) g1.drawCards();
  g1.points = 150;
  g1.drawCards();
  assert.equal(g1.stock.length, 24);
  assert.equal(g1.stock[0], first, 'Reihenfolge bleibt beim Umdrehen erhalten');
  assert.equal(g1.points, 50);

  const g3 = new Game({ seed: 3, draw: 3 });
  g3.drawCards();
  assert.equal(g3.waste.length, 3);
  assert.equal(g3.fan, 3);
});

test('Vegas: 52 Einsatz, 5 je Karte, begrenzte Durchgänge', () => {
  assert.equal(maxRecycles(1, 'vegas'), 0);
  assert.equal(maxRecycles(3, 'vegas'), 2);
  assert.equal(maxRecycles(3, 'standard'), Infinity);
  const g = new Game({ seed: 5, draw: 1, scoring: 'vegas' });
  assert.equal(g.score, -52);
  while (g.stock.length) g.drawCards();
  assert.equal(g.drawCards(), null, 'kein zweiter Durchgang');
  g.foundations = [13, 13, 13, 13];
  assert.equal(g.score, 208);
});

test('Zeit kostet 2 Punkte je 10 Sekunden, Bonus beim Sieg', () => {
  const g = empty();
  g.points = 100;
  g.moves = 1;
  g.tick(25);
  assert.equal(g.score, 96);
  g.foundations = [13, 13, 13, 13];
  assert.equal(g.finalScore, 96, 'unter 30 Sekunden kein Bonus');
  g.elapsed = 100;
  assert.equal(g.finalScore, 100 - 20 + 7000);
});

test('Zurück stellt alles wieder her', () => {
  const g = new Game({ seed: 11 });
  const before = JSON.stringify(g.snapshot());
  g.drawCards();
  g.drawCards();
  g.undo();
  g.undo();
  assert.equal(JSON.stringify(g.snapshot()), before);
  assert.equal(g.undos, 2);
});

test('Speichern und Laden', () => {
  const g = new Game({ seed: 12, draw: 3, scoring: 'vegas', level: 'hard' });
  g.drawCards();
  const copy = Game.restore(JSON.parse(JSON.stringify(g.serialize())));
  assert.deepEqual(copy.snapshot(), g.snapshot());
  assert.equal(copy.draw, 3);
  assert.equal(Game.restore({ seed: 1, state: { tableau: [] } }), null);
});

test('Automatisch beenden und festgefahren erkennen', () => {
  const g = empty();
  g.foundations = [12, 13, 13, 13];
  g.tableau[0].up = [K(0, 13)];
  assert.ok(g.canAutoComplete);
  const m = g.autoMove();
  g.move(m.from, m.to);
  assert.ok(g.isWon);

  const s = empty({ scoring: 'vegas' });
  s.tableau[0].up = [K(0, 5)];
  s.tableau[1].up = [K(2, 9)];
  s.foundations = [0, 13, 13, 13];
  s.waste = [K(0, 2)];
  s.recycles = 0;
  s.foundations[0] = 0;
  assert.ok(s.isStuck);
});
