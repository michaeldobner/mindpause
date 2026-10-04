// Rechnet Tipps im Hintergrund, damit die Oberfläche flüssig bleibt.
import { prepare, solve } from './solver.js?v=2.0.3';

let cache = null;

self.onmessage = (event) => {
  const { id, cells, occupied, goal, budget } = event.data;
  const sig = JSON.stringify(cells);
  if (!cache || cache.sig !== sig) cache = { sig, prepared: prepare(cells) };
  const result = solve(cache.prepared, occupied, goal, budget);
  self.postMessage({ id, result });
};
