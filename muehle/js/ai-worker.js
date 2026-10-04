// Rechnet die Züge des Computers und die Tipps im Hintergrund, damit die Oberfläche flüssig bleibt.
import { chooseMove } from './ai.js?v=1.1.0';

self.onmessage = (event) => {
  const { id, state, level, only } = event.data;
  const move = chooseMove(state, level, { only });
  self.postMessage({ id, move });
};
