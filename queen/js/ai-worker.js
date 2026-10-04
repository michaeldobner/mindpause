// Rechnet die Züge des Computers und die Tipps im Hintergrund, damit die Oberfläche flüssig bleibt.
import { chooseMove } from './ai.js?v=1.1.1';

self.onmessage = (event) => {
  const { id, board, side, level } = event.data;
  const move = chooseMove(board, side, level);
  self.postMessage({ id, move });
};
