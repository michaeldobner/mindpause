// BLOCKS: Steine vom Tablett aufs Brett legen, volle Reihen und Spalten räumen ab.
// 30 Level mit Startsteinen und Punkteziel, dazu drei freie Modi.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was BLOCKS eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.5.0';
import { Game } from './game.js?v=1.1.0';
import { MODES, modeById, starsFor, STREAK_KEEP } from './modes.js?v=1.1.0';
import { levelDef, levelStars, LEVEL_COUNT } from './levels.js?v=1.1.0';
import { shapeOf } from './shapes.js?v=1.1.0';
import { BlocksView, previewSvg } from './view.js?v=1.1.0';
import { Input } from './input.js?v=1.1.0';
import { BlocksSound } from './sound.js?v=1.1.0';
import { BLOCKS_STRINGS } from './strings.js?v=1.1.0';

export const VERSION = '1.1.0';

const storage = createStorage('blocks:');
const { load, save } = storage;
const i18n = createI18n(BLOCKS_STRINGS);
const { t, lang } = i18n;
const locale = lang === 'de' ? 'de-DE' : 'en-US';

// ---------- Zustand ----------

const sound = new BlocksSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
// Auswahl: ein freier Modus ('classic', 'wide', 'calm') oder ein Level ('level-7').
// Wer neu anfängt, beginnt mit Level 1.
const levelOf = (id) => (/^level-(\d+)$/.test(id || '') ? Number(id.slice(6)) : 0);
const validChoice = (id) => Boolean(modeById(id)) || (levelOf(id) >= 1 && levelOf(id) <= LEVEL_COUNT);
let choice = validChoice(load('mode', null)) ? load('mode', null) : 'level-1';
let stats = load('stats', {});
// Fortschritt der Level: höchstes freies Level und je Level Sterne, Punkte, Steine
let progress = { unlocked: 1, levels: {}, ...load('progress', {}) };
const settings = { preview: load('preview', true) };
let endTimer = null;
let restartSnap = null; // altes Spiel nach Neu, mit Zurück wiederherstellbar

const newSeed = () => Math.floor(Math.random() * 2 ** 32) >>> 0;
const isUnlocked = (n) => n >= 1 && n <= Math.min(LEVEL_COUNT, progress.unlocked);
if (levelOf(choice) && !isUnlocked(levelOf(choice))) choice = `level-${progress.unlocked}`;

function createGame() {
  const n = levelOf(choice);
  return n ? new Game({ mode: 'level', level: n }) : new Game({ mode: choice, seed: newSeed() });
}

let game = restoreGame() || createGame();
const resumed = game.moves > 0;

function restoreGame() {
  const g = Game.restore(load('game', null));
  if (!g || g.isOver) return null;
  choice = g.mode === 'level' ? `level-${g.level}` : g.mode;
  return g;
}

function persist() {
  save('game', game.isOver ? null : game.serialize());
}

const statsFor = (id) => stats[id] || { games: 0, best: null };
const levelRecord = (n) => progress.levels[n] || null;

// ---------- Hülle ----------

const shell = createShell({
  title: 'BLOCKS',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'levelsButton', titleKey: 'chooseLevel', nextKey: 'nextLevel', otherKey: 'otherLevel' },
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
    next: nextLevel,
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
  game = createGame();
  view.setGame(game);
  persist();
  renderLevels();
  updateControls();
  if (restartSnap) shell.toast(t('restartUndo'));
}

function undo() {
  // Ein geschafftes Level bleibt geschafft
  if (game.canUndo && game.state !== 'won') {
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
      choice = g.mode === 'level' ? `level-${g.level}` : g.mode;
      view.setGame(game);
      persist();
      renderLevels();
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

function choose(id) {
  choice = id;
  save('mode', id);
  newGame();
}

function selectLevel(id) {
  if (!validChoice(id)) return;
  const n = levelOf(id);
  if (n && !isUnlocked(n)) {
    shell.toast(t('locked', { n: n - 1 }), 2200);
    return;
  }
  shell.closePanels();
  if (id === choice && game.moves === 0) return;
  choose(id);
}

function nextLevel() {
  const n = levelOf(choice);
  if (n && n < LEVEL_COUNT && isUnlocked(n + 1)) choose(`level-${n + 1}`);
  else newGame({ keep: false });
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
      case 'levelDone':
        onLevelDone();
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

// Level geschafft: Sterne nach Steinen, nächstes Level freischalten
function onLevelDone() {
  input.release();
  const n = game.level;
  const stars = levelStars(n, game.moves);
  const prev = levelRecord(n);
  const better = !prev || stars > prev.stars || (stars === prev.stars && game.moves < prev.pieces);
  const levels = { ...progress.levels };
  if (better) levels[n] = { stars, score: game.score, pieces: game.moves };
  progress = { unlocked: Math.max(progress.unlocked, Math.min(LEVEL_COUNT, n + 1)), levels };
  save('progress', progress);
  persist();
  sound.win(stars === 3);
  renderLevels();
  updateControls();
  clearTimeout(endTimer);
  const parts = [t('stat.score', { v: fmt(game.score) }), t('stat.pieces', { v: game.moves })];
  if (stars < 3) parts.push(t('stat.par', { v: levelDef(n).par }));
  endTimer = setTimeout(() => {
    const last = n === LEVEL_COUNT;
    shell.showResult({
      title: t('levelDone.title', { n }),
      text: last ? t('levelDone.last') : t(`levelDone.text${stars}`),
      stars,
      stats: parts.join(' · '),
      highlight: stars === 3,
      showNext: !last,
      showBack: false,
    });
  }, 900);
}

function onEnd() {
  input.release();
  sound.lose();
  clearTimeout(endTimer);
  if (game.mode === 'level') {
    const n = game.level;
    const parts = [t('stat.score', { v: fmt(game.score) }), t('goal.short', { a: fmt(game.score), b: fmt(game.def.target) })];
    if (game.preLeft) parts.push(t('stat.preLeft', { v: game.preLeft }));
    persist();
    updateControls();
    endTimer = setTimeout(() => {
      const [title, text] = t('levelFail', { n });
      shell.showResult({ title, text, stars: 0, stats: parts.join(' · '), showNext: false });
    }, 1150);
    return;
  }
  const id = game.mode;
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
  if (isBest) setTimeout(() => sound.win(true), 700);
  renderLevels();
  updateControls();
  endTimer = setTimeout(() => showEnd(isBest, result, prev), 1150);
}

function showEnd(isBest, result, prev) {
  const [title, text] = t(`over.${isBest ? 'best' : 'plain'}`);
  const parts = [t('stat.score', { v: fmt(result.score) }), t('stat.lines', { v: result.lines }), t('stat.pieces', { v: result.moves })];
  if (game.tally.bestStreak >= 2) parts.push(t('stat.streak', { v: game.tally.bestStreak }));
  if (!isBest && prev) parts.push(t('stat.best', { v: fmt(Math.max(prev.score, result.score)) }));
  shell.showResult({ title, text, stars: starsFor(game.mode, result), stats: parts.join(' · '), highlight: isBest, showNext: false });
}

// ---------- Anzeige ----------

const choiceLabel = () => (levelOf(choice) ? t('levelName', { n: levelOf(choice) }) : t(`mode.${choice}`));

let lastHud = '';
function updateHud() {
  const key = `${game.score}`;
  if (key !== lastHud) {
    lastHud = key;
    shell.setCounter(fmt(game.score), t('points', { n: game.score }));
  }
  const level = game.mode === 'level';
  const best = level ? null : statsFor(game.mode).best;
  view.setHud({
    best: best && game.mode !== 'calm' ? fmt(Math.max(best.score, game.score)) : '',
    bestLabel: t('head.best'),
    goal: level ? { score: fmt(Math.min(game.score, game.def.target)), target: fmt(game.def.target), done: game.score >= game.def.target, pre: game.preLeft } : null,
    goalLabel: t('head.goal'),
    streak: game.streak,
    keep: STREAK_KEEP - game.idle,
    keepMax: STREAK_KEEP,
    streakLabel: t('head.streak'),
  });
}

let lastControls = '';
function updateControls() {
  const key = `${game.canUndo}|${Boolean(restartSnap)}|${game.state}|${choice}`;
  if (key === lastControls) return;
  lastControls = key;
  shell.setDisabled('hint', game.state !== 'playing');
  shell.setLevelLabel(choiceLabel());
}

// Vorschau der freien Modi: ein paar liegende Steine
const PREVIEWS = {
  classic: [8, [[0, 7], [1, 7], [2, 7], [3, 7], [5, 7], [6, 7], [7, 7], [0, 6], [1, 6], [6, 6], [7, 6], [7, 5], [3, 2], [4, 2], [3, 3], [4, 3]]],
  wide: [10, [[0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [6, 9], [7, 9], [8, 9], [9, 9], [0, 8], [9, 8], [9, 7], [4, 3], [5, 3], [6, 3], [5, 4]]],
  calm: [8, [[1, 6], [2, 6], [5, 6], [6, 6], [1, 5], [6, 5]]],
};

// Auswahl: erst die 30 Level, dann die freien Modi
function renderLevels() {
  const items = [];
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const def = levelDef(n);
    const rec = levelRecord(n);
    const open = isUnlocked(n);
    const cells = [];
    def.board.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && cells.push([x, y])));
    items.push({
      id: `level-${n}`,
      name: t('levelName', { n }),
      meta: open ? (rec ? t('stat.pieces', { v: rec.pieces }) : t('levelMeta', { v: fmt(def.target) })) : t('lockedMeta'),
      stars: rec ? rec.stars : 0,
      difficulty: def.difficulty,
      preview: previewSvg(def.size, [], { pre: cells, locked: !open }),
      current: choice === `level-${n}`,
    });
  }
  for (const m of MODES) {
    items.push({
      id: m.id,
      name: t(`mode.${m.id}`),
      meta: bestLine(m.id) || t(`modeMeta.${m.id}`),
      stars: starsFor(m.id, statsFor(m.id).best),
      difficulty: m.difficulty,
      preview: previewSvg(...PREVIEWS[m.id]),
      current: m.id === choice,
    });
  }
  shell.renderLevels(items);
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
renderLevels();
if (resumed) shell.toast(t('resumed'), 2600);
setTimeout(() => shell.showCoach(), 900);
requestAnimationFrame(frame);

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
const fire = (target, type, x, y, id) => target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'mouse', button: 0, bubbles: true, cancelable: true }));

window.__game = {
  id: 'blocks',
  view,
  input,
  sound,
  shell,
  get game() { return game; },
  get history() { return game.moves; },
  get progress() { return progress; },
  newGame,
  undo,
  choose,
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
        fire(view.canvas, 'pointerdown', r.left + sx, r.top + sy, 7);
        for (let i = 1; i <= 6; i++) fire(window, 'pointermove', r.left + sx + ((tx - r.left - sx) * i) / 6, r.top + sy + ((ty - r.top - sy) * i) / 6, 7);
        fire(window, 'pointerup', tx, ty, 7);
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
        fire(view.canvas, 'pointerdown', r.left + sx, r.top + sy, 8);
        fire(window, 'pointermove', r.left + 2, r.top + 2, 8);
        fire(window, 'pointerup', r.left + 2, r.top + 2, 8);
        await new Promise((res) => setTimeout(res, 300));
        return (game.moves === 0 && game.tray[0] === key) || 'Stein ging verloren';
      },
      // Level 1 nach Tipps durchspielen: geschafft, Level 2 frei, Ergebniskarte mit „Nächstes Level“
      async Level() {
        const before = { ...progress };
        choose('level-1');
        for (let i = 0; i < 400 && game.state === 'playing'; i++) {
          const h = game.hint();
          if (!h) break;
          game.place(h.slot, h.x, h.y);
          processEvents();
        }
        if (game.state !== 'won') return `Level 1 nicht geschafft (${game.state})`;
        if (progress.unlocked < 2) return 'Level 2 nicht freigeschaltet';
        await new Promise((res) => setTimeout(res, 1300));
        const next = document.getElementById('next');
        const ok = !document.getElementById('result').hidden && !next.hidden;
        progress = before;
        save('progress', progress);
        return ok || 'Ergebniskarte ohne „Nächstes Level“';
      },
    },
  },
};
