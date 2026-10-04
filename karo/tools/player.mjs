// Ein einfacher Spieler zum Einteilen der Spielnummern. Sieht nur, was auch ein Mensch sieht,
// denkt nicht voraus und macht immer den naheliegenden Zug, mit etwas Zufall bei der Wahl.
// Gewinnt er eine Verteilung oft, ist sie leicht.

import { Game } from '../js/game.js';
import { random } from '../js/cards.js';

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];

export function playOnce(seed, draw, rnd) {
  const g = new Game({ seed, draw });
  let idle = 0;
  for (let step = 0; step < 2000; step++) {
    if (g.isWon || g.canAutoComplete) return true;
    const move = choose(g, rnd);
    if (move) {
      g.move(move.from, move.to);
      idle = 0;
      continue;
    }
    if (!g.drawCards()) return false;
    idle += 1;
    // Ein ganzer Durchgang durch den Stapel ohne einen sinnvollen Zug: aufgeben
    if (idle > Math.ceil((g.stock.length + g.waste.length) / draw) + 2) return false;
  }
  return false;
}

function choose(g, rnd) {
  const toFoundation = [];
  const reveal = [];
  const fromWaste = [];
  const frees = [];
  for (let col = 0; col < 7; col++) {
    const { up, down } = g.tableau[col];
    if (!up.length) continue;
    const top = { pile: 'tableau', col, index: up.length - 1 };
    if (g.canMove(top, { pile: 'foundation' })) toFoundation.push({ from: top, to: { pile: 'foundation' } });
    const first = { pile: 'tableau', col, index: 0 };
    if (down.length > 0) {
      for (const t of g.targetsFor(first)) if (t.pile === 'tableau') reveal.push({ from: first, to: t, weight: down.length });
    }
    for (let index = 1; index < up.length; index++) {
      if (!g.canFound(up[index - 1])) continue;
      const from = { pile: 'tableau', col, index };
      for (const t of g.targetsFor(from)) if (t.pile === 'tableau') frees.push({ from, to: t });
    }
  }
  if (g.waste.length) {
    const from = { pile: 'waste' };
    for (const t of g.targetsFor(from)) (t.pile === 'foundation' ? toFoundation : fromWaste).push({ from, to: t });
  }
  if (toFoundation.length) return pick(toFoundation, rnd);
  if (reveal.length) {
    const most = Math.max(...reveal.map((m) => m.weight));
    return pick(reveal.filter((m) => m.weight === most || rnd() < 0.3), rnd);
  }
  // Menschen übersehen manchmal eine Karte vom Stapel
  if (fromWaste.length && rnd() > 0.1) return pick(fromWaste, rnd);
  if (frees.length) return pick(frees, rnd);
  return null;
}

// Gewinnquote über mehrere Versuche mit unterschiedlichem Zufall
export function winRate(seed, draw, tries = 24) {
  const rnd = random(seed * 7919 + draw);
  let wins = 0;
  for (let i = 0; i < tries; i++) if (playOnce(seed, draw, rnd)) wins += 1;
  return wins / tries;
}
