// QUEEN: Deutsche Dame gegen den Computer oder zu zweit an einem Gerät.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was QUEEN eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.3.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.3.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.3.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.3.0';
import { Tilt } from '../../shared/js/tilt.js?shell=1.3.0';
import { BLUE, BLACK } from './rules.js?v=1.2.0';
import { Game } from './game.js?v=1.2.0';
import { QueenView } from './view.js?v=1.2.0';
import { QueenSound } from './sound.js?v=1.2.0';
import { THEMES, THEME_IDS, DEFAULT_THEME } from './themes.js?v=1.2.0';
import { QUEEN_STRINGS } from './strings.js?v=1.2.0';

export const VERSION = '1.2.0';

const MODES = [
  { id: 'beginner', computer: true, difficulty: 1 },
  { id: 'easy', computer: true, difficulty: 2 },
  { id: 'medium', computer: true, difficulty: 3 },
  { id: 'hard', computer: true, difficulty: 5 },
  { id: 'duo', computer: false, difficulty: 0 },
];
const HUMAN = BLUE; // gegen den Computer spielt man Blau, von unten

const storage = createStorage('queen:');
const { load, save } = storage;
const i18n = createI18n(QUEEN_STRINGS);
const { t, lang } = i18n;

// ---------- Zustand ----------

const sound = new QueenSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let stats = load('stats', {});
let mode = MODES.find((m) => m.id === load('mode', 'easy')) || MODES[1];
const game = new Game();
let flipWanted = load('flip', false);
let theme = THEME_IDS.includes(load('theme', DEFAULT_THEME)) ? load('theme', DEFAULT_THEME) : DEFAULT_THEME;
let previousGame = null; // Neu startet sofort, Zurück holt das alte Spiel zurück
let aiRequest = 0;
let thinking = false;
let counted = false;
let tilt = null;

const saved = load('game', null);
if (saved && saved.mode === mode.id && game.restore(saved.state) && !game.isOver) counted = false;
else game.reset();

function persist() {
  save('game', { mode: mode.id, state: game.serialize() });
}

const statsFor = (id) => stats[id] || { games: 0, wins: 0, losses: 0, draws: 0 };
const starsFor = (wins) => (wins >= 10 ? 3 : wins >= 3 ? 2 : wins >= 1 ? 1 : 0);
const progress = () => {
  const { blue, black } = game.counts;
  return (24 - blue - black) / 22;
};

// ---------- Hülle ----------

const shell = createShell({
  title: 'QUEEN',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'resign', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'nextLevel' },
  settings: [
    { id: 'theme', nameKey: 'theme', options: THEME_IDS.map((id) => ({ value: id, labelKey: `themes.${id}` })) },
    { id: 'flip', nameKey: 'flip', textKey: 'flipText' },
    { id: 'tilt', nameKey: 'tilt', textKey: 'tiltText' },
  ],
  noteKey: 'trayHint',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: {
    undo,
    hint,
    restart: newGame,
    resign,
    again: newGame,
    back: undo,
    next: () => {
      const i = MODES.findIndex((m) => m.id === mode.id);
      if (MODES[i + 1] && MODES[i + 1].computer) switchMode(MODES[i + 1].id);
    },
    selectLevel: switchMode,
    setting: (id, value) => (id === 'theme' ? setTheme(value) : id === 'tilt' ? toggleTilt() : toggleFlip()),
  },
  onGesture: reconnectTilt,
});

// ---------- Brett ----------

const view = new QueenView(shell.board, {
  canMove: () => !game.isOver && !thinking && (!mode.computer || game.turn === HUMAN),
  move: (m, fromPos) => humanMove(m, fromPos),
  lift: () => sound.lift(),
  invalid: () => sound.invalid(),
  land: () => sound.place(progress()),
  hop: (record, k) => sound.hop(k),
  crown: () => sound.crown(),
  rim: () => sound.rim(),
  clack: (i) => sound.clack(i),
}, theme);
view.setGame(game);
view.setFlip(boardFlipped());

tilt = new Tilt((x, y) => view.setGravity(x, y), load('tilt', false));
shell.setSetting('tilt', tilt.wanted);
shell.setSetting('flip', flipWanted);
shell.setSetting('theme', theme);

// ---------- Anzeige ----------

// Farbname einer Seite im aktuellen Brettstil: Blau oder Weiß unten, Schwarz oben
function sideName(side) {
  const { p1, p2 } = THEMES[theme].sides;
  return t(`side.${side === BLUE ? p1 : p2}`);
}

function boardFlipped() {
  return mode.id === 'duo' && flipWanted && game.turn === BLACK;
}

function updateHud() {
  const { blue, black } = game.counts;
  const label = game.isOver ? t('over') : t(thinking ? 'thinkingTurn' : 'turn', { side: sideName(game.turn) });
  shell.setCounter(`${blue}:${black}`, label);
  shell.setDisabled('undo', game.history.length === 0 && !(previousGame && previousGame.mode === mode.id));
  shell.setDisabled('hint', game.isOver || (mode.computer && game.turn !== HUMAN));
  shell.setDisabled('resign', game.isOver || game.history.length === 0);
  shell.setLevelLabel(t(`modeLabel.${mode.id}`));
  const last = game.history[game.history.length - 1];
  view.markLast(last ? last.move : null);
  shell.renderLevels(MODES.map((m) => {
    const s = statsFor(m.id);
    return {
      id: m.id,
      name: t(`mode.${m.id}`),
      meta: m.computer ? (s.wins ? t('wins', { n: s.wins }) : t('vsComputer')) : t('onOneDevice'),
      stars: m.computer ? starsFor(s.wins) : null,
      difficulty: m.difficulty || null,
      preview: modePreview(m),
      current: m.id === mode.id,
    };
  }));
}

// Kleine Vorschau: ein Ausschnitt des Bretts, bei „Zu zweit“ je ein Stein auf beiden Seiten
function modePreview(m) {
  let squares = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      squares += `<rect x="${7 + c * 14}" y="${7 + r * 14}" width="14" height="14" class="${(r + c) % 2 ? 'd' : 'l'}"/>`;
    }
  }
  // Steine nur auf dunklen Feldern (Zeile plus Spalte ungerade)
  const disc = (x, y, cls) => `<circle cx="${x}" cy="${y}" r="5" class="${cls}"/>`;
  const crownAt = (x, y) => `<path d="M ${x - 6} ${y + 3} L ${x - 7} ${y - 3} L ${x - 3} ${y} L ${x} ${y - 5} L ${x + 3} ${y} L ${x + 7} ${y - 3} L ${x + 6} ${y + 3} Z" class="g"/>`;
  const stones = m.computer
    ? disc(28, 14, 'k') + disc(14, 28, 'k') + disc(42, 56, 'b') + disc(56, 42, 'b') + (m.id === 'hard' ? disc(56, 14, 'k') : '')
    : disc(28, 14, 'k') + disc(42, 28, 'k') + disc(14, 56, 'b') + disc(42, 56, 'b');
  const crown = m.id === 'hard' ? crownAt(56, 42) : m.id === 'duo' ? crownAt(42, 56) : '';
  return `<svg viewBox="0 0 70 70" aria-hidden="true"><rect x="2" y="2" width="66" height="66" rx="10" class="plate"/>${squares}${stones}${crown}</svg>`;
}

// ---------- Züge ----------

async function humanMove(m, fromPos) {
  previousGame = null;
  const record = game.apply(m);
  updateHud();
  persist();
  await view.run(() => view.playNow(record, fromPos));
  afterMove();
}

function afterMove() {
  updateHud();
  persist();
  if (checkEnd()) return;
  if (mode.id === 'duo') {
    view.setFlip(boardFlipped());
    return;
  }
  if (game.turn !== HUMAN) computerMove();
}

async function computerMove() {
  thinking = true;
  updateHud();
  const request = ++aiRequest;
  const started = performance.now();
  const move = await askAI(mode.id);
  // Kurze, natürliche Pause, auch wenn die Rechnung schnell war
  const rest = 700 - (performance.now() - started);
  if (rest > 0) await new Promise((r) => setTimeout(r, rest));
  if (request !== aiRequest) return; // inzwischen Zurück, Neu oder Moduswechsel
  thinking = false;
  const m = move && game.match(move);
  if (!m) {
    updateHud();
    return;
  }
  const record = game.apply(m);
  persist();
  await view.play(record);
  afterMove();
}

// ---------- Computer im Hintergrund ----------

let worker = null;
function askAI(level) {
  if (!worker) worker = new Worker(new URL('./ai-worker.js?v=1.2.0', import.meta.url), { type: 'module' });
  const id = Math.random();
  return new Promise((resolve) => {
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      resolve(e.data.move);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ id, board: game.board, side: game.turn, level });
  });
}

async function hint() {
  if (view.busy || game.isOver || thinking) return;
  if (mode.computer && game.turn !== HUMAN) return;
  shell.setBusy('hint', true);
  const slow = setTimeout(() => shell.toast(t('thinking')), 350);
  const plies = game.history.length;
  const move = await askAI('hard');
  clearTimeout(slow);
  shell.setBusy('hint', false);
  if (plies !== game.history.length) return;
  const m = move && game.match(move);
  if (!m) return shell.toast(t('noHint'));
  shell.hideToast();
  view.showHint(m);
}

// ---------- Spielende ----------

function checkEnd() {
  const result = game.result;
  if (!result) return false;
  const s = statsFor(mode.id);
  let title;
  let text;
  let highlight = false;
  if (result.resigned) {
    // Aufgegeben: gegen den Computer immer eine Niederlage, zu zweit gewinnt die andere Seite
    const [win, gaveUp] = t('resigned');
    title = mode.computer ? t('lost')[0] : win.replace('{side}', sideName(result.winner));
    text = gaveUp.replace('{side}', sideName(-result.winner));
    highlight = !mode.computer;
  } else if (result.draw) {
    [title] = t('draw');
    text = t(result.draw === 'repetition' ? 'drawRepetition' : 'drawQuiet');
  } else if (mode.computer) {
    const won = result.winner === HUMAN;
    [title, text] = t(won ? 'won' : 'lost');
    highlight = won;
  } else {
    const [win, stuck] = t('sideWins');
    title = win.replace('{side}', sideName(result.winner));
    text = stuck.replace('{side}', sideName(-result.winner));
    highlight = true;
  }
  if (!counted) {
    counted = true;
    s.games += 1;
    if (result.draw) s.draws += 1;
    else if (mode.computer && result.winner === HUMAN) s.wins += 1;
    else if (mode.computer) s.losses += 1;
    stats = { ...stats, [mode.id]: s };
    save('stats', stats);
  }
  if (highlight) sound.win(true);
  else if (!result.draw) sound.lose();
  const i = MODES.findIndex((m) => m.id === mode.id);
  const won = mode.computer && result.winner === HUMAN;
  shell.showResult({
    title,
    text,
    stars: mode.computer ? starsFor(s.wins) : null,
    stats: mode.computer ? t('wins', { n: s.wins }) : '',
    highlight,
    showNext: won && MODES[i + 1] && MODES[i + 1].computer,
  });
  updateHud();
  return true;
}

// ---------- Neu, Zurück, Modus ----------

function stopComputer() {
  aiRequest++;
  thinking = false;
}

async function newGame() {
  shell.hideResult();
  stopComputer();
  if (game.history.length > 0 && !game.isOver) {
    previousGame = { mode: mode.id, history: game.history.slice(), state: JSON.parse(JSON.stringify(game.serialize())) };
    shell.toast(t('restartUndo'));
  } else {
    previousGame = null;
  }
  game.reset();
  counted = false;
  persist();
  view.setFlip(boardFlipped());
  updateHud();
  await view.sync(game);
}

// Aufgeben nach einer Rückfrage. Gegen den Computer gibt immer die eigene Seite auf, zu zweit die Seite am Zug.
async function resign() {
  if (game.isOver || game.history.length === 0) return;
  const side = mode.computer ? HUMAN : game.turn;
  const ok = await shell.confirm({
    title: t('resignTitle'),
    text: mode.computer ? t('resignText') : t('resignTextDuo', { side: sideName(side), other: sideName(-side) }),
    ok: t('resign'),
  });
  if (!ok || game.isOver) return;
  stopComputer();
  previousGame = null;
  game.resign(side);
  persist();
  updateHud();
  checkEnd();
}

async function undo() {
  shell.hideResult();
  // Nach dem Aufgeben: Zurück nimmt nur das Aufgeben zurück
  if (game.resigned) {
    game.resign(null);
    if (counted) {
      // Die schon gezählte Niederlage wieder herausnehmen
      const st = statsFor(mode.id);
      stats = { ...stats, [mode.id]: { ...st, games: Math.max(0, st.games - 1), losses: Math.max(0, st.losses - (mode.computer ? 1 : 0)) } };
      save('stats', stats);
      counted = false;
    }
    persist();
    updateHud();
    if (mode.computer && game.turn !== HUMAN) computerMove();
    return;
  }
  // Direkt nach Neu: Zurück holt das vorherige Spiel zurück
  if (game.history.length === 0 && previousGame && previousGame.mode === mode.id) {
    game.restore(previousGame.state);
    game.history = previousGame.history;
    previousGame = null;
    shell.hideToast();
    persist();
    view.setFlip(boardFlipped());
    updateHud();
    await view.sync(game);
    return;
  }
  if (game.history.length === 0) return;
  const wasThinking = thinking;
  stopComputer();
  // Gegen den Computer: bis zum letzten eigenen Zug zurück
  game.undo();
  if (mode.computer && !wasThinking && game.turn !== HUMAN && game.history.length > 0) game.undo();
  counted = false;
  persist();
  view.setFlip(boardFlipped());
  updateHud();
  sound.place(progress(), { soft: true });
  await view.sync(game);
  if (mode.computer && game.turn !== HUMAN) computerMove();
}

// Beim Wechsel beginnt immer ein neues Spiel
async function switchMode(id) {
  const next = MODES.find((m) => m.id === id);
  if (!next || next.id === mode.id) return;
  shell.hideResult();
  stopComputer();
  mode = next;
  save('mode', mode.id);
  game.reset();
  counted = false;
  previousGame = null;
  persist();
  view.setFlip(boardFlipped());
  updateHud();
  await view.sync(game);
  sound.rim();
}

// ---------- Einstellungen ----------

// Brettstil wechseln: das Brett blendet kurz aus und im neuen Stil wieder ein, das Spiel läuft weiter
function setTheme(id) {
  if (!THEME_IDS.includes(id) || id === theme) return;
  theme = id;
  save('theme', theme);
  shell.setSetting('theme', theme);
  document.body.dataset.theme = theme;
  const board = shell.board;
  board.style.transition = 'opacity 160ms ease';
  board.style.opacity = '0';
  setTimeout(() => {
    view.setTheme(theme);
    updateHud();
    board.style.opacity = '1';
  }, 170);
}

function toggleFlip() {
  flipWanted = !flipWanted;
  save('flip', flipWanted);
  shell.setSetting('flip', flipWanted);
shell.setSetting('theme', theme);
  view.setFlip(boardFlipped());
}

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

// ---------- Start ----------

document.body.dataset.theme = theme;
updateHud();
setTimeout(() => shell.showCoach(), 900);
if (mode.computer && game.turn !== HUMAN && !game.isOver) computerMove();

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
window.__game = {
  id: 'queen',
  view,
  sound,
  shell,
  game,
  get history() { return game.history.length; },
  get mode() { return mode.id; },
  switchMode,
  refresh: updateHud,
  e2e: {
    // Einen eigenen Zug spielen (den ersten erlaubten) und auf die Antwort des Computers warten
    async move() {
      const m = game.moves[0];
      if (!m || !view.events.canMove()) return;
      await humanMove(m);
    },
  },
};
