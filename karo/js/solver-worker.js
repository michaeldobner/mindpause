// Löser im Hintergrund, damit das Spiel während der Suche flüssig bleibt.
// fresh: das Spiel ab dem Geben prüfen (war es überhaupt lösbar?), sonst Tipp für die aktuelle Stellung.
import { Game } from './game.js?v=1.0.2';
import { hintFor, solve, fromGame } from './solver.js?v=1.0.2';

self.onmessage = (e) => {
  const { id, game: data, fresh, budget } = e.data;
  let result = null;
  try {
    if (fresh) {
      const g = new Game({ seed: data.seed, draw: data.draw, scoring: data.scoring });
      const r = solve(fromGame(g), { draw: g.draw, maxRec: g.maxRecycles, budget });
      result = { status: r.status };
    } else {
      const g = Game.restore(data);
      result = g ? hintFor(g, budget) : null;
    }
  } catch (err) {
    result = null;
  }
  self.postMessage({ id, result });
};
