// Die Stufen von KARO und welche Spielnummer als Nächstes kommt.
// Die Listen der Spielnummern stehen in deals.js (erzeugt von tools/deals.mjs).

import { DEALS } from './deals.js?v=1.0.2';

// difficulty: Punkte in der Auswahl je Ziehmodus (1 oder 3 Karten), fan: Karten in der Vorschau
export const LEVELS = [
  { id: 'easy', difficulty: { 1: 1, 3: 2 }, fan: 1 },
  { id: 'medium', difficulty: { 1: 2, 3: 3 }, fan: 2 },
  { id: 'hard', difficulty: { 1: 3, 3: 4 }, fan: 3 },
  { id: 'master', difficulty: { 1: 4, 3: 5 }, fan: 4 },
  { id: 'daily', difficulty: { 1: 2, 3: 3 } },
  { id: 'random', difficulty: { 1: null, 3: null } },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || null;

// Tage seit dem 1. Januar 2026, nach Ortszeit
export function dayNumber(date = new Date()) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((local - Date.UTC(2026, 0, 1)) / 86400000);
}

// Tagesspiel: für alle gleich, aus den mittleren Spielen, jeden Tag ein anderes
export function dailySeed(draw, date = new Date()) {
  const list = DEALS[draw].medium;
  const n = list.length;
  return list[(((dayNumber(date) * 37) % n) + n) % n];
}

// Nächste Spielnummer einer Stufe. Jedes Gerät beginnt an einer zufälligen Stelle der Liste
// und geht sie dann der Reihe nach durch, so wiederholt sich lange nichts.
export function seedFor(levelId, draw, storage, rnd = Math.random) {
  if (levelId === 'daily') return dailySeed(draw);
  const list = DEALS[draw]?.[levelId];
  if (!list || !list.length) return 1 + Math.floor(rnd() * 999999);
  const key = `pos:${draw}:${levelId}`;
  let pos = storage ? storage.load(key, null) : null;
  if (pos === null) pos = Math.floor(rnd() * list.length);
  if (storage) storage.save(key, pos + 1);
  return list[pos % list.length];
}
