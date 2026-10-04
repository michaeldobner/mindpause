// Karten, Zufall und Geben. Ohne DOM, damit Spiel, Löser und Tests dasselbe nutzen.
//
// Eine Karte ist eine Zahl von 0 bis 51: Farbe = Math.floor(karte / 13), Wert = karte % 13 + 1.
// Farben in dieser Reihenfolge: Pik, Herz, Kreuz, Karo. Ungerade Farben sind rot.

export const SUITS = ['spade', 'heart', 'club', 'diamond'];

export const suitOf = (card) => Math.floor(card / 13);
export const rankOf = (card) => (card % 13) + 1;
export const isRed = (card) => suitOf(card) % 2 === 1;
export const cardOf = (suit, rank) => suit * 13 + rank - 1;

// Kleiner, schneller Zufallsgenerator mit Startwert (mulberry32).
// Gleiche Spielnummer ergibt auf jedem Gerät dieselbe Verteilung.
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Gemischtes Deck für eine Spielnummer
export function shuffled(seed) {
  const rnd = random(seed);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Klassisch geben: reihenweise von links nach rechts, Spalte i bekommt i + 1 Karten.
// Die oberste Karte jeder Spalte liegt offen, der Rest kommt in den Stapel.
export function deal(seed) {
  const deck = shuffled(seed);
  const columns = Array.from({ length: 7 }, () => []);
  let k = 0;
  for (let row = 0; row < 7; row++) {
    for (let col = row; col < 7; col++) columns[col].push(deck[k++]);
  }
  return {
    tableau: columns.map((cards) => ({ down: cards.slice(0, -1), up: cards.slice(-1) })),
    stock: deck.slice(k), // die nächste gezogene Karte steht vorn
  };
}
