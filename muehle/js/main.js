// MÜHLE: Neun Männer Mühle gegen den Computer oder zu zweit an einem Gerät.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was MÜHLE eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.5.0';
import { Tilt } from '../../shared/js/tilt.js?shell=1.5.0';
import { WHITE, BLACK, pointAt } from './rules.js?v=1.1.0';
import { Game } from './game.js?v=1.1.0';
import { MuehleView } from './view.js?v=1.1.0';
import { MuehleSound } from './sound.js?v=1.1.0';
import { THEMES, THEME_IDS, DEFAULT_THEME } from './themes.js?v=1.1.0';
import { MUEHLE_STRINGS } from './strings.js?v=1.1.0';

export const VERSION = '1.1.0';

const MODES = [
  { id: 'easy', computer: true, difficulty: 1 },
  { id: 'medium', computer: true, difficulty: 3 },
  { id: 'hard', computer: true, difficulty: 5 },
  { id: 'duo', computer: false, difficulty: 0 },
];
const HUMAN = WHITE; // gegen den Computer spielt man Weiß, von unten, und beginnt

const storage = createStorage('muehle:');
const { load, save } = storage;
const i18n = createI18n(MUEHLE_STRINGS);
const { t } = i18n;

// ---------- Zustand ----------

const sound = new MuehleSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let stats = load('stats', {});
let mode = MODES.find((m) => m.id === load('mode', 'medium')) || MODES[1];
const game = new Game();
let flipWanted = load('flip', false);
let theme = THEME_IDS.includes(load('theme', DEFAULT_THEME)) ? load('theme', DEFAULT_THEME) : DEFAULT_THEME;
let previousGame = null; // Neu startet sofort, Zurück holt das alte Spiel zurück
let aiRequest = 0;
let thinking = false;
let counted = false;
let tilt = null;

const saved = load('game', null);
if (!(saved && saved.mode === mode.id && game.restore(saved.state) && !game.isOver)) game.reset();

function persist() {
  save('game', { mode: mode.id, state: game.serialize() });
}

const statsFor = (id) => stats[id] || { games: 0, wins: 0, losses: 0, draws: 0 };
const starsFor = (wins) => (wins >= 10 ? 3 : wins >= 3 ? 2 : wins >= 1 ? 1 : 0);
// Fortschritt für die Tonhöhe: steigt mit jedem gesetzten und genommenen Stein
const progress = () => {
  const { white, black } = game.counts;
  const placed = 18 - game.hand[WHITE] - game.hand[BLACK];
  const taken = 18 - white - black;
  return Math.min(1, (placed + taken * 2) / 30);
};

// ---------- Hülle ----------

const shell = createShell({
  title: 'MÜHLE',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'modes', titleKey: 'chooseMode', nextKey: 'nextLevel', otherKey: 'otherMode' },
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

let millToastShown = load('millToastSeen', false);

const view = new MuehleView(shell.board, {
  canMove: () => !game.isOver && !thinking && (!mode.computer || game.turn === HUMAN),
  move: (m, fromPos, staged) => humanMove(m, fromPos, staged),
  lift: () => sound.lift(),
  invalid: () => sound.invalid(),
  land: () => sound.place(progress()),
  mill: (count) => sound.mill(count),
  take: () => sound.take(),
  rim: () => sound.rim(),
  clack: (i) => sound.clack(i),
  pending: (on) => {
    updateHud();
    // Beim ersten Mal erklären, was jetzt zu tun ist
    if (on && !millToastShown) {
      millToastShown = true;
      save('millToastSeen', true);
      shell.toast(t('millToast'));
    }
  },
}, theme);
view.setGame(game);
view.setFlip(boardFlipped());

tilt = new Tilt((x, y) => view.setGravity(x, y), load('tilt', false));
shell.setSetting('tilt', tilt.wanted);
shell.setSetting('flip', flipWanted);
shell.setSetting('theme', theme);

// ---------- Anzeige ----------

// Farbname einer Seite im aktuellen Brettstil: Weiß oder Blau unten, Schwarz oben
function sideName(side) {
  const { p1, p2 } = THEMES[theme].sides;
  return t(`side.${side === WHITE ? p1 : p2}`);
}

function boardFlipped() {
  return mode.id === 'duo' && flipWanted && game.turn === BLACK;
}

function turnLabel() {
  if (game.isOver) return t('over');
  const side = sideName(game.turn);
  if (thinking) return t('thinkingTurn', { side });
  if (view.pending) return t('removeTurn', { side });
  return t(`phase.${game.phase()}`, { side });
}

function updateHud() {
  const { white, black } = game.counts;
  shell.setCounter(`${white}:${black}`, turnLabel());
  shell.setDisabled('undo', game.history.length === 0 && !view.pending && !(previousGame && previousGame.mode === mode.id));
  shell.setDisabled('hint', game.isOver || (mode.computer && game.turn !== HUMAN));
  shell.setLevelLabel(t(`modeLabel.${mode.id}`));
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

// Kleine Vorschau: das Mühlebrett mit ein paar Steinen, bei „Schwer“ mit leuchtender Mühle
function modePreview(m) {
  const at = (x, y) => [11 + x * 8, 11 + y * 8];
  let lines = '';
  for (let r = 0; r < 3; r++) {
    const [a] = at(r, r);
    const size = (6 - 2 * r) * 8;
    lines += `<rect x="${a}" y="${a}" width="${size}" height="${size}" class="ln"/>`;
  }
  lines += '<path d="M35 11 V27 M35 43 V59 M11 35 H27 M43 35 H59" class="ln"/>';
  const disc = ([x, y], cls) => `<circle cx="${x}" cy="${y}" r="4.6" class="${cls}"/>`;
  const layouts = {
    easy: [[[0, 0], 'b'], [[6, 6], 'k']],
    medium: [[[0, 0], 'b'], [[3, 1], 'b'], [[6, 6], 'k'], [[4, 4], 'k']],
    hard: [[[0, 6], 'b'], [[3, 6], 'b'], [[6, 6], 'b'], [[0, 0], 'k'], [[3, 2], 'k'], [[5, 3], 'k']],
    duo: [[[0, 6], 'b'], [[2, 4], 'b'], [[6, 0], 'k'], [[4, 2], 'k']],
  };
  const mill = m.id === 'hard' ? '<path d="M11 59 H59" class="mill"/>' : '';
  const stones = layouts[m.id].map(([p, cls]) => disc(at(...p), cls)).join('');
  return `<svg viewBox="0 0 70 70" aria-hidden="true"><rect x="2" y="2" width="66" height="66" rx="10" class="plate"/>${lines}${mill}${stones}</svg>`;
}

// ---------- Züge ----------

async function humanMove(m, fromPos, staged = false) {
  previousGame = null;
  if (staged) view.pending = null; // der Stein zum Nehmen ist gewählt, die Kopfzeile zeigt schon die Gegenseite
  const record = game.apply(m);
  updateHud();
  persist();
  await view.run(() => view.playNow(record, fromPos, staged));
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
  const rest = 450 - (performance.now() - started);
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
  updateHud();
  await view.play(record);
  afterMove();
}

// ---------- Computer im Hintergrund ----------

let worker = null;
function askAI(level, only = null) {
  if (!worker) worker = new Worker(new URL('./ai-worker.js?v=1.1.0', import.meta.url), { type: 'module' });
  const id = Math.random();
  return new Promise((resolve) => {
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      resolve(e.data.move);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ id, state: game.state, level, only });
  });
}

async function hint() {
  if (view.busy || game.isOver || thinking) return;
  if (mode.computer && game.turn !== HUMAN) return;
  shell.setBusy('hint', true);
  const slow = setTimeout(() => shell.toast(t('thinking')), 350);
  const plies = game.history.length;
  // Steht schon eine Mühle, geht es nur noch um den besten Stein zum Nehmen
  const pending = view.pending;
  const move = await askAI('hard', pending ? pending.options : null);
  clearTimeout(slow);
  shell.setBusy('hint', false);
  if (plies !== game.history.length || pending !== view.pending) return;
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
  if (result.draw) {
    [title] = t('draw');
    text = t(result.draw === 'repetition' ? 'drawRepetition' : 'drawQuiet');
  } else if (mode.computer) {
    const won = result.winner === HUMAN;
    [title] = t(won ? 'won' : 'lost');
    text = t(`reason.${result.reason}`, { side: sideName(-result.winner) });
    highlight = won;
  } else {
    title = t('sideWins', { side: sideName(result.winner) });
    text = t(`reason.${result.reason}`, { side: sideName(-result.winner) });
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

async function undo() {
  shell.hideResult();
  // Mühle steht, aber noch kein Stein genommen: nur diesen halben Zug zurücknehmen
  if (view.pending) {
    sound.place(progress(), { soft: true });
    await view.sync(game);
    updateHud();
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
  id: 'muehle',
  view,
  sound,
  shell,
  game,
  get history() { return game.history.length; },
  get mode() { return mode.id; },
  switchMode,
  newGame,
  refresh: updateHud,
  e2e: {
    // Einen eigenen Zug spielen (den ersten erlaubten) und auf die Antwort des Computers warten
    async move() {
      const m = game.moves[0];
      if (!m || !view.events.canMove()) return;
      await humanMove(m);
    },
    checks: {
      // Die Schalen liegen hoch oben (Gegner) und unten (eigene), quer links und rechts, Weiß bleibt unten
      Seat() {
        const box = (el) => el.getBoundingClientRect();
        const [opp, own] = [...document.querySelectorAll('#board .tray-bed')].map(box);
        const wide = innerWidth > innerHeight;
        return (wide ? opp.right < own.left && own.height > own.width : opp.bottom < own.top && own.width > own.height) || 'Schalen falsch';
      },
      // Eine Mühle schließen: der Zug wartet auf die Wahl des Steins, Zurück nimmt nur diesen halben Zug zurück
      async Mill() {
        await switchMode('duo');
        // Weiß setzt a7 und d7, Schwarz g1 und g4, dann schließt Weiß mit g7 die obere Reihe
        for (const name of ['a7', 'g1', 'd7', 'g4']) await humanMove(game.movesTo(-1, pointAt(name))[0]);
        const options = game.movesTo(-1, pointAt('g7'));
        if (!options.length || options[0].remove < 0) return 'keine Mühle';
        await view.stage(-1, pointAt('g7'), options);
        if (!view.pending) return 'keine Auswahl';
        await undo();
        if (view.pending || game.history.length !== 4) return 'Zurück nicht halb';
        await view.stage(-1, pointAt('g7'), options);
        await humanMove(options[0], null, true);
        return (game.counts.white === 9 && game.counts.black === 8) || 'Stein nicht genommen';
      },
    },
  },
};
