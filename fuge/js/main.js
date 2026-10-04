// FUGE: das klassische Spiel mit fallenden Steinen, als Holzkasten mit lackierten Steinen.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was FUGE eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.3.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.3.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.3.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.3.0';
import { Game, HEIGHT, HIDDEN } from './game.js?v=1.0.1';
import { MODES, modeById, starsFor } from './modes.js?v=1.0.1';
import { FugeView, previewSvg } from './view.js?v=1.0.1';
import { Input } from './input.js?v=1.0.1';
import { FugeSound } from './sound.js?v=1.0.1';
import { FUGE_STRINGS } from './strings.js?v=1.0.1';

export const VERSION = '1.0.1';

// Eigene Schaltflächen der Steuerleiste, im Stil der Symbole der Hülle (Feld 24 × 24)
const ICON = {
  hold: '<rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M12 3.5v9M8.5 9 12 12.5 15.5 9"/>',
  pause: '<path d="M9 6.5v11M15 6.5v11"/>',
  play: '<path d="M8.5 6v12l9.5-6z"/>',
};

const storage = createStorage('fuge:');
const { load, save } = storage;
const i18n = createI18n(FUGE_STRINGS);
const { t, lang } = i18n;
const locale = lang === 'de' ? 'de-DE' : 'en-US';

// ---------- Zustand ----------

const sound = new FugeSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let mode = modeById(load('mode', 'classic')) || MODES[0];
let stats = load('stats', {});
const settings = { ghost: load('ghost', true), patterns: load('patterns', false) };
let paused = false;
let endTimer = null;

const newSeed = () => Math.floor(Math.random() * 2 ** 32) >>> 0;
let game = restoreGame() || new Game({ mode: mode.id, seed: newSeed() });
const resumed = game.state === 'playing';
if (resumed) paused = true;

function restoreGame() {
  const g = Game.restore(load('game', null));
  if (!g || g.isOver) return null;
  mode = modeById(g.mode) || mode;
  return g;
}

function persist() {
  if (game.isOver) save('game', null);
  else save('game', game.serialize());
}

const statsFor = (id) => stats[id] || { games: 0, best: null };

// ---------- Hülle ----------

const shell = createShell({
  title: 'FUGE',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: [
    { id: 'hold', icon: ICON.hold, labelKey: 'hold' },
    { id: 'pause', icon: ICON.pause, labelKey: 'pause' },
    'restart',
    'levels',
    'settings',
  ],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'again' },
  settings: [
    { id: 'ghost', nameKey: 'ghost', textKey: 'ghostText' },
    { id: 'patterns', nameKey: 'patterns', textKey: 'patternsText' },
  ],
  noteKey: 'note',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: {
    hold: () => (isActive() ? game.holdPiece() : confirm()),
    pause: () => (game.state === 'ready' ? startGame() : paused ? resume() : pause()),
    restart: () => newGame(),
    again: () => newGame(),
    back: () => {},
    next: () => {},
    selectLevel,
    setting: toggleSetting,
  },
});

shell.setSetting('ghost', settings.ghost);
shell.setSetting('patterns', settings.patterns);

// ---------- Kasten ----------

const view = new FugeView(shell.stage);
view.el.setAttribute('role', 'application');
view.el.setAttribute('aria-label', t('boardLabel'));
view.setSettings(settings);
view.setGame(game);

const isActive = () => game.state === 'playing' && !paused;

const input = new Input(shell.stage, {
  keysAllowed: () => document.getElementById('result').hidden,
  active: isActive,
  move: (dx) => isActive() && game.move(dx),
  rotate: (dir) => isActive() && game.rotate(dir),
  soft: (on) => game.setSoftDrop(on && isActive()),
  step: () => isActive() && game.dropStep(),
  hard: () => (isActive() ? game.hardDrop() : confirm()),
  hold: () => isActive() && game.holdPiece(),
  pause: () => (paused ? resume() : pause()),
  confirm,
}, () => view.metrics());

const pointerKind = () => {
  if (input.lastPointer === 'keys') return 'keys';
  if (input.lastPointer === 'touch') return 'touch';
  return window.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'keys';
};

// ---------- Start, Pause, Neu ----------

function confirm() {
  if (game.state === 'ready') startGame();
  else if (paused) resume();
}

function startGame() {
  if (!game.start()) return;
  paused = false;
  sound.start();
  view.setOverlay(null);
  shell.hideCoach();
  updateControls();
}

function pause() {
  if (game.state !== 'playing' || paused) return;
  paused = true;
  input.release();
  persist();
  showOverlay();
  updateControls();
}

function resume() {
  if (!paused || game.state !== 'playing') return;
  paused = false;
  view.setOverlay(null);
  updateControls();
}

function showOverlay() {
  const kind = pointerKind();
  const best = bestLine(mode.id);
  if (game.state === 'ready') {
    view.setOverlay({
      kicker: t(`modeMeta.${mode.id}`),
      title: t(`mode.${mode.id}`),
      text: t(`ready.${kind}`),
      help: helpRows(kind),
      best,
    });
  } else if (paused) {
    view.setOverlay({ kicker: t(`mode.${mode.id}`), title: t('paused.title'), text: t(`paused.${kind}`), help: helpRows(kind) });
  } else {
    view.setOverlay(null);
  }
}

// Bedienhilfe als Zeilen: „Taste|Wirkung“
const helpRows = (kind) => t(`help.${kind}`).map((row) => row.split('|'));

function newGame() {
  clearTimeout(endTimer);
  shell.hideResult();
  game = new Game({ mode: mode.id, seed: newSeed() });
  paused = false;
  view.setGame(game);
  persist();
  showOverlay();
  renderModes();
  updateControls();
}

function selectLevel(id) {
  const m = modeById(id);
  if (!m) return;
  shell.closePanels();
  if (m.id === mode.id && game.state === 'ready') return;
  mode = m;
  save('mode', m.id);
  newGame();
}

function toggleSetting(id, on) {
  settings[id] = on;
  save(id, on);
  shell.setSetting(id, on);
  view.setSettings(settings);
}

// ---------- Ereignisse aus dem Spiel ----------

const vibrate = (ms) => {
  try { navigator.vibrate?.(ms); } catch { /* nicht unterstützt */ }
};

function stackProgress() {
  for (let y = HIDDEN; y < HEIGHT; y++) if (game.board[y].some((c) => c)) return (HEIGHT - y) / (HEIGHT - HIDDEN);
  return 0;
}

function processEvents() {
  for (const e of game.drainEvents()) {
    view.handle(e);
    switch (e.type) {
      case 'move':
        sound.move();
        break;
      case 'rotate':
        sound.rotate(e.dir);
        break;
      case 'blocked':
        sound.blocked();
        break;
      case 'softDrop':
        sound.slide();
        break;
      case 'hardDrop':
        vibrate(8);
        break;
      case 'lock':
        sound.lock({ hard: e.hard, progress: stackProgress() });
        if (e.lines) {
          sound.clear(e.lines, { combo: e.combo, special: e.tspin !== 'none' });
          vibrate(e.lines === 4 ? 24 : 12);
        }
        announce(e);
        persist();
        break;
      case 'hold':
        sound.hold();
        break;
      case 'levelUp':
        sound.levelUp();
        view.label(t('levelUp', { n: e.level }), '', { big: true, dur: 1.4 });
        break;
      case 'calmClear':
        sound.calmClear();
        view.label(t('calmClear'), '', { dur: 1.6 });
        break;
      case 'gameOver':
        onEnd(false);
        break;
      case 'finish':
        onEnd(true);
        break;
      default:
        break;
    }
  }
}

// Schriftzug für besondere Reihen: ab zwei Reihen, bei T-Dreh, Serie und Folge
function announce(e) {
  let text = '';
  if (e.tspin !== 'none') {
    text = t(e.tspin === 'mini' ? 'tspinMini' : 'tspin');
    if (e.lines) text += ` ${t(`clear.${e.lines}`)}`;
  } else if (e.lines >= 2 || (e.lines === 1 && e.combo > 0)) {
    text = t(`clear.${e.lines}`);
  }
  const sub = [e.backToBack ? t('backToBack') : '', e.combo > 0 ? t('combo', { n: e.combo }) : ''].filter(Boolean).join(' · ');
  if (text) view.label(text, sub, { big: e.lines === 4 });
  if (e.perfect) view.label(t('perfect'), '', { big: true, dur: 1.5 });
}

// ---------- Ende ----------

const fmt = (n) => Number(n).toLocaleString(locale);
const clock = (s, tenths = false) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  if (!tenths) return `${m}:${String(Math.floor(sec)).padStart(2, '0')}`;
  const str = sec.toFixed(1).padStart(4, '0');
  return `${m}:${lang === 'de' ? str.replace('.', ',') : str}`;
};

function bestLine(id) {
  const best = statsFor(id).best;
  if (!best) return '';
  if (id === 'sprint') return best.time ? t('bestTime', { v: clock(best.time, true) }) : '';
  if (id === 'calm') return '';
  return t('best', { v: fmt(best.score) });
}

function onEnd(done) {
  input.release();
  const id = mode.id;
  const result = { score: game.score, lines: game.lines, level: game.level, time: game.elapsed };
  const s = { ...statsFor(id) };
  s.games += 1;
  const prev = s.best;
  let isBest = false;
  if (id === 'sprint') {
    if (done && (!prev || !prev.time || result.time < prev.time)) isBest = true;
    if (isBest) s.best = { ...result };
    else if (!prev) s.best = { ...result, time: null };
  } else if (!prev || result.score > prev.score) {
    // Das erste Spiel setzt den Bestwert still, erst danach wird ein neuer gefeiert
    isBest = Boolean(prev);
    s.best = { ...result };
  }
  stats = { ...stats, [id]: s };
  save('stats', stats);
  persist();
  if (done) sound.win(isBest);
  else sound.lose();
  updateControls();
  renderModes();
  clearTimeout(endTimer);
  endTimer = setTimeout(() => showEnd(done, isBest, result, Boolean(prev)), done ? 650 : 1150);
}

function showEnd(done, isBest, result, hadBest) {
  const id = mode.id;
  const best = statsFor(id).best;
  const parts = [];
  let key = isBest ? 'best' : 'plain';
  let params = {};
  if (id === 'sprint') {
    if (done) {
      key = isBest ? 'sprintBest' : 'sprintDone';
      params = { t: clock(result.time, true) };
      parts.push(t('stat.pieces', { v: game.pieces }), t('stat.quarts', { v: game.tally.quarts }));
      if (!isBest && hadBest && best?.time) parts.push(t('stat.bestTime', { v: clock(best.time, true) }));
    } else {
      key = 'sprintFail';
      params = { n: game.linesLeft };
      parts.push(t('stat.time', { v: clock(result.time) }));
    }
  } else {
    if (id === 'ultra' && done) {
      key = isBest ? 'ultraBest' : 'ultraDone';
      params = { n: fmt(result.score) };
    }
    parts.push(t('stat.score', { v: fmt(result.score) }), t('stat.lines', { v: result.lines }));
    if (id === 'classic') parts.push(t('stat.level', { v: result.level }), t('stat.time', { v: clock(result.time) }));
    if (!isBest && hadBest && best) parts.push(t('stat.best', { v: fmt(best.score) }));
  }
  const [title, text] = t(`over.${key}`, params);
  const stars = starsFor(id, id === 'sprint' ? { time: done ? result.time : null } : result);
  shell.showResult({ title, text, stars, stats: parts.join(' · '), highlight: isBest, showNext: false, showBack: false });
}

// ---------- Anzeige ----------

let lastHud = '';
function updateHud() {
  const counter = mode.id === 'sprint'
    ? [clock(game.elapsed), t('time')]
    : [fmt(game.score), t('points', { n: game.score })];
  const key = counter.join('|');
  if (key !== lastHud) {
    lastHud = key;
    shell.setCounter(counter[0], counter[1]);
  }
}

let lastControls = '';
function updateControls() {
  const holdOff = game.state === 'playing' && (paused || game.holdUsed || !game.active);
  const pauseOff = game.isOver;
  const key = `${holdOff}|${pauseOff}|${paused}|${game.state}`;
  if (key === lastControls) return;
  lastControls = key;
  shell.setDisabled('hold', holdOff || game.isOver);
  shell.setDisabled('pause', pauseOff);
  const showPlay = paused || game.state === 'ready';
  shell.setButton('pause', showPlay ? { icon: ICON.play, labelKey: game.state === 'ready' ? 'start' : 'resume' } : { icon: ICON.pause, labelKey: 'pause' });
  shell.setLevelLabel(t(`mode.${mode.id}`));
}

function sideStats() {
  const L = (k) => t(`side.${k}`).toUpperCase();
  let values;
  if (mode.id === 'sprint') values = [{ label: L('lines'), value: `${game.lines}/${mode.goalLines}` }, { label: L('pieces'), value: String(game.pieces) }];
  else if (mode.id === 'ultra') values = [{ label: L('left'), value: clock(Math.ceil(game.timeLeft)) }, { label: L('lines'), value: String(game.lines) }];
  else if (mode.id === 'calm') values = [{ label: L('lines'), value: String(game.lines) }, { label: L('pieces'), value: String(game.pieces) }];
  else values = [{ label: L('level'), value: String(game.level) }, { label: L('lines'), value: String(game.lines) }];
  return { labels: { hold: L('hold'), next: L('next') }, values };
}

const PREVIEWS = {
  classic: [['T', 1, 1], ['T', 2, 1], ['T', 3, 1], ['T', 2, 2], ['J', 0, 6], ['J', 1, 6], ['J', 2, 6], ['J', 0, 5], ['O', 3, 5], ['O', 4, 5], ['O', 3, 6], ['O', 4, 6], ['S', 1, 5], ['S', 2, 5], ['S', 0, 4], ['S', 1, 4], ['L', 4, 4]],
  sprint: [['I', 4, 0], ['I', 4, 1], ['I', 4, 2], ['I', 4, 3], ['Z', 0, 3], ['Z', 1, 3], ['L', 2, 3], ['L', 3, 3], ['O', 0, 4], ['O', 1, 4], ['J', 2, 4], ['J', 3, 4], ['O', 0, 5], ['O', 1, 5], ['T', 2, 5], ['T', 3, 5], ['S', 0, 6], ['S', 1, 6], ['T', 2, 6], ['J', 3, 6]],
  ultra: [['L', 0, 2], ['L', 1, 2], ['L', 2, 2], ['L', 2, 1], ['Z', 2, 5], ['Z', 3, 5], ['Z', 3, 6], ['Z', 4, 6], ['I', 0, 6], ['I', 1, 6], ['I', 2, 6], ['T', 0, 5], ['T', 1, 5], ['T', 0, 4], ['O', 4, 4], ['O', 4, 5]],
  calm: [['I', 1, 6], ['I', 2, 6], ['I', 3, 6], ['I', 4, 6], ['O', 2, 1], ['O', 3, 1], ['O', 2, 2], ['O', 3, 2]],
};

function renderModes() {
  shell.renderLevels(MODES.map((m) => {
    const s = statsFor(m.id);
    return {
      id: m.id,
      name: t(`mode.${m.id}`),
      meta: bestLine(m.id) || t(`modeMeta.${m.id}`),
      stars: starsFor(m.id, s.best),
      difficulty: m.difficulty,
      preview: previewSvg(PREVIEWS[m.id]),
      current: m.id === mode.id,
    };
  }));
}

// ---------- Bild für Bild ----------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const panelOpen = document.body.classList.contains('open-settings') || document.body.classList.contains('open-levels');
  if (panelOpen && isActive()) pause();
  if (isActive()) {
    input.update(dt);
    game.step(dt);
  }
  processEvents();
  updateControls();
  updateHud();
  view.update(dt);
  view.draw(dt, sideStatsCached());
  requestAnimationFrame(frame);
}

// Werte der Leiste nur neu zeichnen, wenn sie sich ändern
let lastSide = '';
let sideCache = null;
function sideStatsCached() {
  const s = sideStats();
  const key = JSON.stringify(s) + game.hold + game.holdUsed + game.queue.slice(0, 3).join('');
  if (key !== lastSide) {
    lastSide = key;
    sideCache = s;
    view.invalidate();
  }
  return sideCache;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pause();
    persist();
  }
  last = performance.now();
});
window.addEventListener('pagehide', persist);

// ---------- Start ----------

updateControls();
updateHud();
renderModes();
showOverlay();
if (resumed) shell.toast(t('resumed'), 2600);
setTimeout(() => shell.showCoach(), 900);
requestAnimationFrame(frame);

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
window.__game = {
  id: 'fuge',
  view,
  input,
  sound,
  shell,
  get game() { return game; },
  get history() { return game.pieces; },
  get paused() { return paused; },
  newGame,
  startGame,
  pause,
  resume,
  e2e: {
    // Einen gültigen Zug spielen: Spiel starten oder fortsetzen und den Stein fallen lassen
    async move() {
      confirm();
      game.hardDrop();
    },
  },
};
