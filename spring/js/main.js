// SPRING: Solohalma auf dem englischen Kreuzbrett.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was SPRING eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.5.0';
import { FIGURES, GOAL, DEFAULT_FIGURE, figureById, nextFigure } from './figures.js?v=2.1.2';
import { Game } from './game.js?v=2.1.2';
import { BoardView } from './view.js?v=2.1.2';
import { SpringSound } from './sound.js?v=2.1.2';
import { Tilt } from '../../shared/js/tilt.js?shell=1.5.0';
import { SPRING_STRINGS } from './strings.js?v=2.1.2';

export const VERSION = '2.1.2';

const storage = createStorage('spring:');
const { load, save } = storage;
const i18n = createI18n(SPRING_STRINGS);
const { t, lang } = i18n;

migrateFromVersion1();

// ---------- Zustand ----------

const sound = new SpringSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let stats = load('stats', {});
const games = new Map();
let figure = figureById(load('figure', DEFAULT_FIGURE)) || figureById(DEFAULT_FIGURE);
let game = gameFor(figure, { resume: true });
let hintCache = null;
let previousGame = null; // Neu startet sofort, Zurück holt das alte Spiel zurück
let tilt = null;
persist();

// Nur die zuletzt gespielte Figur wird beim Start fortgesetzt. Ein beendetes Spiel beginnt neu.
function gameFor(fig, { resume = false } = {}) {
  if (!games.has(fig.id)) {
    const g = new Game(fig);
    g.startCount = g.cells.filter((c) => c.start).length;
    g.counted = false;
    games.set(fig.id, g);
  }
  const g = games.get(fig.id);
  const saved = resume ? load(`game:${fig.id}`, null) : null;
  if (saved && g.restore(saved) && !g.isOver) {
    g.counted = Boolean(saved.counted);
  } else {
    g.reset();
    g.counted = false;
  }
  return g;
}

function persist(g = game) {
  save(`game:${g.board.id}`, { ...g.serialize(), counted: g.counted });
}

function statsFor(id) {
  return stats[id] || { games: 0, solved: 0, perfect: 0, best: null, stars: 0 };
}

const progress = () => game.history.length / Math.max(1, game.startCount - 1);

// ---------- Hülle ----------

const shell = createShell({
  title: 'SPRING',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'figures', titleKey: 'chooseFigure', nextKey: 'nextFigure', otherKey: 'otherFigure' },
  settings: [{ id: 'tilt', nameKey: 'tilt', textKey: 'tiltText' }],
  noteKey: 'rimHint',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: {
    undo,
    hint,
    restart: newGame,
    again: newGame,
    back: undo,
    next: () => {
      const next = nextFigure(figure.id);
      if (next) switchFigure(next.id);
    },
    selectLevel: switchFigure,
    setting: (id) => id === 'tilt' && toggleTilt(),
  },
  onGesture: reconnectTilt,
});

// ---------- Brett ----------

const view = new BoardView(shell.board, {
  move(record, phase) {
    if (phase === 'jump') {
      previousGame = null;
      advanceHint(record);
      updateHud();
      persist();
    } else if (phase === 'land') {
      sound.land(progress());
    } else if (phase === 'gutter') {
      sound.gutter();
      checkEnd();
    }
  },
  invalid: () => sound.invalid(),
  lift: () => sound.lift(),
  clack: (i) => sound.clack(i),
});
view.setGame(game);

tilt = new Tilt((x, y) => view.setGravity(x, y), load('tilt', false));
shell.setSetting('tilt', tilt.wanted);

// ---------- Anzeige ----------

function updateHud() {
  const n = game.count;
  shell.setCounter(n, t('marbles', { n }));
  shell.setDisabled('undo', game.history.length === 0 && !(previousGame && previousGame.figure === figure.id));
  shell.setDisabled('hint', game.isOver);
  shell.setLevelLabel(figure.name[lang]);
  renderFigureList();
}

function checkEnd() {
  if (!game.isOver) return;
  const r = game.rating();
  if (!game.counted) {
    game.counted = true;
    const s = statsFor(figure.id);
    s.games += 1;
    if (r.left === 1) s.solved += 1;
    if (game.isPerfect) s.perfect += 1;
    if (s.best === null || r.left < s.best) s.best = r.left;
    s.stars = Math.max(s.stars, r.stars);
    stats = { ...stats, [figure.id]: s };
    save('stats', stats);
    persist();
  }
  if (r.left === 1) sound.win(game.isPerfect);
  const s = statsFor(figure.id);
  const [title, text] = t(`rating.${r.key}`, { n: r.left });
  const parts = [];
  if (s.best !== null) parts.push(t('best', { n: s.best }));
  if (s.solved > 0) parts.push(t('solved', { n: s.solved }));
  shell.showResult({
    title,
    text,
    stars: r.stars,
    stats: parts.join(' · '),
    highlight: game.isPerfect,
    showNext: Boolean(nextFigure(figure.id)),
  });
}

// ---------- Figuren ----------

function miniBoard(fig) {
  let dots = '';
  fig.layout.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (ch === ' ') return;
      const cls = ch === 'o' ? ((r + c) % 2 === 0 ? 'b' : 'k') : 'e';
      dots += `<circle class="${cls}" cx="${c * 10 + 5}" cy="${r * 10 + 5}" r="${ch === 'o' ? 4 : 1.6}"/>`;
    });
  });
  return `<svg viewBox="-2 -2 74 74" aria-hidden="true"><circle class="plate" cx="35" cy="35" r="37"/>${dots}</svg>`;
}

function renderFigureList() {
  shell.renderLevels(FIGURES.map((fig) => {
    const count = fig.layout.join('').split('o').length - 1;
    return {
      id: fig.id,
      name: fig.name[lang],
      meta: `${count} ${t('marbles', { n: count })}`,
      stars: statsFor(fig.id).stars,
      difficulty: fig.difficulty,
      preview: miniBoard(fig),
      current: fig.id === figure.id,
    };
  }));
}

// Beim Wechsel beginnt die gewählte Figur immer als neues Spiel
async function switchFigure(id) {
  const fig = figureById(id);
  if (!fig || fig.id === figure.id) return;
  shell.hideResult();
  figure = fig;
  game = gameFor(fig);
  hintCache = null;
  previousGame = null;
  save('figure', fig.id);
  persist();
  updateHud();
  await view.morph(game);
  sound.gutter();
}

// ---------- Tipps ----------

let worker = null;
let hintRequest = 0;

function occKey(g) {
  return g.marbles.map((m) => (m === null ? 0 : 1)).join('');
}

function advanceHint(record) {
  if (!hintCache) return;
  const [from, , to] = hintCache.moves[0] || [];
  if (record.from === from && record.to === to) {
    hintCache.moves.shift();
    hintCache.key = occKey(game);
  } else {
    hintCache = null;
  }
}

function askSolver() {
  if (!worker) worker = new Worker(new URL('./solver-worker.js?v=2.1.2', import.meta.url), { type: 'module' });
  const id = ++hintRequest;
  return new Promise((resolve) => {
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      resolve(e.data.result);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({
      id,
      cells: game.cells.map(({ r, c }) => ({ r, c })),
      occupied: game.occupancy(),
      goal: game.cellAt(...GOAL),
      budget: 4000,
    });
  });
}

async function hint() {
  if (view.busy || game.isOver) return;
  let moves;
  if (hintCache && hintCache.figure === figure.id && hintCache.key === occKey(game) && hintCache.moves.length) {
    moves = hintCache.moves;
  } else {
    shell.setBusy('hint', true);
    const slow = setTimeout(() => shell.toast(t('thinking')), 350);
    const forGame = game;
    const result = await askSolver();
    clearTimeout(slow);
    shell.setBusy('hint', false);
    if (forGame !== game) return;
    if (result === 'timeout') return shell.toast(t('hintTimeout'));
    if (!result) return shell.toast(t('noSolution'));
    moves = result;
    hintCache = { figure: figure.id, key: occKey(game), moves: result.slice() };
  }
  shell.hideToast();
  const [from, , to] = moves[0];
  view.showHint(from, to);
}

// ---------- Neu und Zurück ----------

async function newGame() {
  shell.hideResult();
  if (game.history.length > 0 && !game.isOver) {
    previousGame = { figure: figure.id, data: JSON.parse(JSON.stringify(game.serialize())), counted: game.counted };
    shell.toast(t('restartUndo'));
  } else {
    previousGame = null;
  }
  game.reset();
  game.counted = false;
  hintCache = null;
  persist();
  updateHud();
  await view.morph(game);
}

async function undo() {
  shell.hideResult();
  // Direkt nach Neu: Zurück holt das vorherige Spiel zurück
  if (game.history.length === 0 && previousGame && previousGame.figure === figure.id) {
    game.restore(previousGame.data);
    game.counted = previousGame.counted;
    previousGame = null;
    shell.hideToast();
    persist();
    updateHud();
    await view.morph(game);
    return;
  }
  const rec = await view.undo();
  if (!rec) return;
  hintCache = null;
  sound.land(progress(), { soft: true });
  updateHud();
  persist();
}

// ---------- Neigen ----------

async function toggleTilt() {
  if (tilt.wanted) {
    tilt.disable();
    save('tilt', false);
    shell.setSetting('tilt', false);
    return;
  }
  save('tilt', true);
  const pending = tilt.enable();
  shell.setSetting('tilt', true);
  const result = await pending;
  if (result === 'denied') shell.toast(t('tiltDenied'));
  if (result === 'unsupported') shell.toast(t('tiltUnsupported'));
  save('tilt', tilt.wanted);
  shell.setSetting('tilt', tilt.wanted);
}

// Neigen war eingeschaltet: Sensor nach einem Neustart wieder verbinden (iOS verlangt eine Berührung)
function reconnectTilt() {
  if (!tilt || !tilt.wanted || tilt.enabled || tilt.pending) return;
  tilt.enable().then(() => {
    save('tilt', tilt.wanted);
    shell.setSetting('tilt', tilt.wanted);
  });
}

// ---------- Übernahme aus Version 1 (damals unter dem Namen Solohalma) ----------

function migrateFromVersion1() {
  try {
    if (localStorage.getItem('spring:migrated')) return;
    const read = (k) => {
      const raw = localStorage.getItem(`solohalma:${k}`);
      return raw === null ? null : JSON.parse(raw);
    };
    const old = read('game:englisch');
    const oldStats = read('stats');
    const oldSound = read('sound');
    if (old) save('game:klassisch', old);
    if (oldStats) {
      const stars = oldStats.perfect > 0 ? 3 : oldStats.best === 1 ? 2 : oldStats.best !== null && oldStats.best <= 3 ? 1 : 0;
      save('stats', { klassisch: { ...oldStats, stars } });
    }
    if (oldSound !== null) save('sound', oldSound);
    save('migrated', true);
  } catch {
    // Ohne Speicher gibt es nichts zu übernehmen
  }
}

// ---------- Start ----------

updateHud();
setTimeout(() => shell.showCoach(), 900);

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
window.__game = {
  id: 'spring',
  view,
  sound,
  shell,
  get game() { return game; },
  get history() { return game.history.length; },
  switchFigure,
  figures: FIGURES,
  e2e: {
    // Einen richtigen Zug spielen: Tipp holen und genau diesen Zug ausführen
    async move() {
      await hint();
      const from = view.selected;
      const move = game.findMove(from, view.hintTo);
      if (move) await view.play(move);
    },
  },
};
