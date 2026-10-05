// BLOCKS: Steine vom Tablett aufs Brett legen, volle Reihen und Spalten räumen ab.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was BLOCKS eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.5.0';
import { Game } from './game.js?v=1.0.0';
import { MODES, modeById, starsFor, STREAK_KEEP } from './modes.js?v=1.0.0';
import { shapeOf } from './shapes.js?v=1.0.0';
import { BlocksView, previewSvg } from './view.js?v=1.0.0';
import { Input } from './input.js?v=1.0.0';
import { BlocksSound } from './sound.js?v=1.0.0';
import { BLOCKS_STRINGS } from './strings.js?v=1.0.0';

export const VERSION = '1.0.0';

const storage = createStorage('blocks:');
const { load, save } = storage;
const i18n = createI18n(BLOCKS_STRINGS);
const { t, lang } = i18n;
const locale = lang === 'de' ? 'de-DE' : 'en-US';

// ---------- Zustand ----------

const sound = new BlocksSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let mode = modeById(load('mode', 'classic')) || MODES[0];
let stats = load('stats', {});
const settings = { preview: load('preview', true) };
let endTimer = null;
let restartSnap = null; // altes Spiel nach Neu, mit Zurück wiederherstellbar

const newSeed = () => Math.floor(Math.random() * 2 ** 32) >>> 0;
let game = restoreGame() || new Game({ mode: mode.id, seed: newSeed() });
const resumed = game.moves > 0;

function restoreGame() {
  const g = Game.restore(load('game', null));
  if (!g || g.isOver) return null;
  mode = modeById(g.mode) || mode;
  return g;
}

function persist() {
  save('game', game.isOver ? null : game.serialize());
}

const statsFor = (id) => stats[id] || { games: 0, best: null };

// ---------- Hülle ----------

const shell = createShell({
  title: 'BLOCKS',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'again', otherKey: 'otherMode' },
  settings: [{ id: 'preview', nameKey: 'preview', textKey: 'previewText' }],
  noteKey: 'note',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: {
    undo,
    hint,
    restart: newGame,
    again: () => newGame({ keep: false }),
    back: undo,
    next: () => {},
    selectLevel,
    setting: toggleSetting,
  },
});

shell.setSetting('preview', settings.preview);

// ---------- Brett ----------

const view = new BlocksView(shell.stage);
view.el.setAttribute('role', 'application');
view.el.setAttribute('aria-label', t('boardLabel'));
view.setGame(game);

const panelOpen = () => document.body.classList.contains('open-settings') || document.body.classList.contains('open-levels');
const allowed = () => document.getElementById('result').hidden && document.getElementById('confirm').hidden && !panelOpen();

const input = new Input(shell.stage, view, {
  allowed,
  canPick: (slot) => game.state === 'playing' && game.fits(slot),
  pick(slot) {
    if (game.state !== 'playing' || !game.tray[slot]) return false;
    sound.lift();
    view.showHint(null);
    return true;
  },
  canPlace: (slot, x, y) => game.canPlace(slot, x, y),
  preview: (slot, x, y) => (settings.preview ? game.preview(slot, x, y) : null),
  place: (slot, x, y) => Boolean(game.place(slot, x, y)),
  snap: () => sound.snap(),
  cancel: () => sound.back(),
  hint,
  undo,
});

// ---------- Aktionen ----------

function newGame({ keep = true } = {}) {
  clearTimeout(endTimer);
  shell.hideResult();
  input.release();
  // Ein laufendes Spiel lässt sich nach Neu mit Zurück wiederholen
  restartSnap = keep && game.moves > 0 && !game.isOver ? game.serialize() : null;
  game = new Game({ mode: mode.id, seed: newSeed() });
  view.setGame(game);
  persist();
  renderModes();
  updateControls();
  if (restartSnap) shell.toast(t('restartUndo'));
}

function undo() {
  if (game.canUndo) {
    clearTimeout(endTimer);
    shell.hideResult();
    input.release();
    game.undo();
    processEvents();
    persist();
    updateControls();
    return;
  }
  if (restartSnap && game.moves === 0) {
    const g = Game.restore(restartSnap);
    restartSnap = null;
    if (g) {
      game = g;
      mode = modeById(g.mode) || mode;
      view.setGame(game);
      persist();
      renderModes();
      updateControls();
      return;
    }
  }
  shell.toast(t('nothingToUndo'), 1800);
}

function hint() {
  if (game.state !== 'playing') return;
  const h = game.hint();
  if (!h) {
    shell.toast(t('noHint'), 1800);
    return;
  }
  view.showHint(h);
}

function selectLevel(id) {
  const m = modeById(id);
  if (!m) return;
  shell.closePanels();
  if (m.id === mode.id && game.moves === 0) return;
  mode = m;
  save('mode', m.id);
  newGame();
}

function toggleSetting(id, on) {
  settings[id] = on;
  save(id, on);
  shell.setSetting(id, on);
}

// ---------- Ereignisse aus dem Spiel ----------

const vibrate = (ms) => {
  try { navigator.vibrate?.(ms); } catch { /* nicht unterstützt */ }
};

const fillRatio = () => game.board.flat().filter(Boolean).length / (game.size * game.size);

function processEvents() {
  for (const e of game.drainEvents()) {
    view.handle(e);
    switch (e.type) {
      case 'place':
        sound.place(fillRatio(), shapeOf(e.key).size);
        restartSnap = null;
        persist();
        break;
      case 'clear':
        sound.clear(e.lines, { streak: e.streak, perfect: e.perfect });
        vibrate(e.lines >= 3 ? 24 : 12);
        announce(e);
        break;
      case 'refill':
        sound.refill();
        break;
      case 'calmClear':
        sound.calmClear();
        view.label(t('calmClear'));
        break;
      case 'gameOver':
        onEnd();
        break;
      default:
        break;
    }
  }
}

// Schriftzug ab zwei Linien, bei einer Serie und bei leerem Brett
function announce(e) {
  if (e.lines >= 2) view.label(e.lines <= 4 ? t(`lines.${e.lines}`) : t('lines.many', { n: e.lines }), { big: e.lines >= 3 });
  if (e.streak >= 2) view.label(t('streak', { n: e.streak }));
  if (e.perfect) view.label(t('perfect'), { big: true, dur: 1.5 });
}

// ---------- Ende ----------

const fmt = (n) => Number(n).toLocaleString(locale);

function bestLine(id) {
  const best = statsFor(id).best;
  return best && id !== 'calm' ? t('best', { v: fmt(best.score) }) : '';
}

function onEnd() {
  input.release();
  const id = mode.id;
  const result = { score: game.score, lines: game.lines, moves: game.moves };
  const s = { ...statsFor(id) };
  s.games += 1;
  const prev = s.best;
  // Das erste Spiel setzt den Bestwert still, erst danach wird ein neuer gefeiert
  const isBest = Boolean(prev) && result.score > prev.score;
  if (!prev || result.score > prev.score) s.best = { ...result };
  stats = { ...stats, [id]: s };
  save('stats', stats);
  persist();
  sound.lose();
  if (isBest) setTimeout(() => sound.win(true), 700);
  renderModes();
  updateControls();
  clearTimeout(endTimer);
  endTimer = setTimeout(() => showEnd(isBest, result, prev), 1150);
}

function showEnd(isBest, result, prev) {
  const [title, text] = t(`over.${isBest ? 'best' : 'plain'}`);
  const parts = [t('stat.score', { v: fmt(result.score) }), t('stat.lines', { v: result.lines }), t('stat.pieces', { v: result.moves })];
  if (game.tally.bestStreak >= 2) parts.push(t('stat.streak', { v: game.tally.bestStreak }));
  if (!isBest && prev) parts.push(t('stat.best', { v: fmt(Math.max(prev.score, result.score)) }));
  const stars = starsFor(mode.id, result);
  shell.showResult({ title, text, stars, stats: parts.join(' · '), highlight: isBest, showNext: false });
}

// ---------- Anzeige ----------

let lastHud = '';
function updateHud() {
  const key = `${game.score}`;
  if (key !== lastHud) {
    lastHud = key;
    shell.setCounter(fmt(game.score), t('points', { n: game.score }));
  }
  const best = statsFor(mode.id).best;
  view.setHud({
    best: best && mode.id !== 'calm' ? fmt(Math.max(best.score, game.score)) : '',
    bestLabel: t('head.best'),
    streak: game.streak,
    keep: STREAK_KEEP - game.idle,
    keepMax: STREAK_KEEP,
    streakLabel: t('head.streak'),
  });
}

let lastControls = '';
function updateControls() {
  const key = `${game.canUndo}|${Boolean(restartSnap)}|${game.state}|${mode.id}`;
  if (key === lastControls) return;
  lastControls = key;
  shell.setDisabled('hint', game.state !== 'playing');
  shell.setLevelLabel(t(`mode.${mode.id}`));
}

// Vorschau der Modi: ein paar liegende Steine
const PREVIEWS = {
  classic: [8, [[0, 7], [1, 7], [2, 7], [3, 7], [5, 7], [6, 7], [7, 7], [0, 6], [1, 6], [6, 6], [7, 6], [7, 5], [3, 2], [4, 2], [3, 3], [4, 3]]],
  wide: [10, [[0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [6, 9], [7, 9], [8, 9], [9, 9], [0, 8], [9, 8], [9, 7], [4, 3], [5, 3], [6, 3], [5, 4]]],
  calm: [8, [[1, 6], [2, 6], [5, 6], [6, 6], [1, 5], [6, 5]]],
};

function renderModes() {
  shell.renderLevels(MODES.map((m) => ({
    id: m.id,
    name: t(`mode.${m.id}`),
    meta: bestLine(m.id) || t(`modeMeta.${m.id}`),
    stars: starsFor(m.id, statsFor(m.id).best),
    difficulty: m.difficulty,
    preview: previewSvg(...PREVIEWS[m.id]),
    current: m.id === mode.id,
  })));
}

// ---------- Bild für Bild ----------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (panelOpen() && view.drag) input.release();
  processEvents();
  updateControls();
  updateHud();
  view.update(dt);
  view.draw();
  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    input.release();
    persist();
  }
  last = performance.now();
});
window.addEventListener('pagehide', persist);

// ---------- Start ----------

updateControls();
updateHud();
renderModes();
if (resumed) shell.toast(t('resumed'), 2600);
setTimeout(() => shell.showCoach(), 900);
requestAnimationFrame(frame);

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
window.__game = {
  id: 'blocks',
  view,
  input,
  sound,
  shell,
  get game() { return game; },
  get history() { return game.moves; },
  newGame,
  undo,
  e2e: {
    // Einen gültigen Zug spielen: den Stein des Tipps an seinen Platz legen
    async move() {
      const h = game.hint();
      if (h) game.place(h.slot, h.x, h.y);
    },
    checks: {
      // Ziehen mit der Maus: Stein vom Tablett an die Stelle des Tipps
      async Drag() {
        newGame({ keep: false });
        const h = game.hint();
        const s = shapeOf(game.tray[h.slot]);
        const r = view.el.getBoundingClientRect();
        const { grid, c } = view.metrics();
        const [sx, sy] = view.slotCenter(h.slot);
        const tx = r.left + grid.x + (h.x + s.w / 2) * c;
        const ty = r.top + grid.y + (h.y + s.h / 2) * c;
        const fire = (target, type, x, y) => target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', button: 0, bubbles: true, cancelable: true }));
        fire(view.canvas, 'pointerdown', r.left + sx, r.top + sy);
        for (let i = 1; i <= 6; i++) fire(window, 'pointermove', r.left + sx + ((tx - r.left - sx) * i) / 6, r.top + sy + ((ty - r.top - sy) * i) / 6);
        fire(window, 'pointerup', tx, ty);
        await new Promise((res) => setTimeout(res, 300));
        if (game.moves !== 1) return 'Stein wurde nicht gelegt';
        const placed = s.cells.every(([cx, cy]) => game.board[h.y + cy][h.x + cx]);
        return placed || 'Stein liegt an falscher Stelle';
      },
      // Daneben fallen lassen: der Stein bleibt auf dem Tablett
      async Return() {
        newGame({ keep: false });
        const r = view.el.getBoundingClientRect();
        const [sx, sy] = view.slotCenter(0);
        const key = game.tray[0];
        const fire = (target, type, x, y) => target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 8, pointerType: 'mouse', button: 0, bubbles: true, cancelable: true }));
        fire(view.canvas, 'pointerdown', r.left + sx, r.top + sy);
        fire(window, 'pointermove', r.left + 2, r.top + 2);
        fire(window, 'pointerup', r.left + 2, r.top + 2);
        await new Promise((res) => setTimeout(res, 300));
        return (game.moves === 0 && game.tray[0] === key) || 'Stein ging verloren';
      },
    },
  },
};
