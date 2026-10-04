// KARO: Klondike-Patience mit 1 oder 3 Karten, Punkte wie bei Windows oder Vegas.
// Die Oberfläche kommt aus der Hülle (shared/js/shell.js), hier steht nur, was KARO eigen ist.

import { createShell } from '../../shared/js/shell.js?shell=1.5.0';
import { createI18n } from '../../shared/js/i18n.js?shell=1.5.0';
import { createStorage } from '../../shared/js/storage.js?shell=1.5.0';
import { DEFAULT_STYLE } from '../../shared/js/sound-engine.js?shell=1.5.0';
import { Game } from './game.js?v=1.0.4';
import { TableView } from './view.js?v=1.0.4';
import { KaroSound } from './sound.js?v=1.0.4';
import { Celebration } from './celebrate.js?v=1.0.4';
import { deckDefs } from './faces.js?v=1.0.4';
import { LEVELS, levelById, seedFor } from './levels.js?v=1.0.4';
import { KARO_STRINGS } from './strings.js?v=1.0.4';

export const VERSION = '1.0.4';

const storage = createStorage('karo:');
const { load, save } = storage;
const i18n = createI18n(KARO_STRINGS);
const { t, lang } = i18n;

document.body.insertAdjacentHTML('afterbegin', deckDefs(lang));

// ---------- Zustand ----------

const sound = new KaroSound({ enabled: load('sound', true), style: load('soundStyle', DEFAULT_STYLE) });
let rules = { draw: load('draw', 1) === 3 ? 3 : 1, scoring: load('scoring', 'standard') === 'vegas' ? 'vegas' : 'standard' };
let level = levelById(load('level', 'medium')) || levelById('medium');
let stats = load('stats', {});
let bank = load('bank', 0); // Vegas-Konto über alle Spiele
let previousGame = null; // Neu startet sofort, Zurück holt das alte Spiel zurück
let autoRunning = false;
let celebration = null;

let game = restoreGame() || createGame();
persist();

function restoreGame() {
  const saved = load('game', null);
  const g = saved && Game.restore(saved);
  if (!g || g.isWon) return null;
  g.counted = Boolean(saved.counted);
  g.banked = Boolean(saved.banked);
  rules = { draw: g.draw, scoring: g.scoring };
  level = levelById(g.level) || level;
  return g;
}

function createGame(seed = null) {
  const s = seed ?? seedFor(level.id, rules.draw, storage);
  const g = new Game({ seed: s, draw: rules.draw, scoring: rules.scoring, level: level.id });
  g.counted = false;
  g.banked = false;
  return g;
}

function persist(g = game) {
  save('game', { ...g.serialize(), counted: g.counted, banked: g.banked });
}

const statKey = () => `${game.draw}:${level.id}`;
function statsFor(key) {
  return stats[key] || { games: 0, won: 0, stars: 0, best: null };
}

// ---------- Hülle ----------

const shell = createShell({
  title: 'KARO',
  version: VERSION,
  i18n,
  storage,
  sound,
  buttons: ['undo', 'hint', 'restart', 'levels', 'settings'],
  levels: { buttonKey: 'levels', titleKey: 'chooseLevel', nextKey: 'nextDeal', otherKey: 'otherLevel' },
  settings: [
    { id: 'draw3', nameKey: 'draw3', textKey: 'draw3Text' },
    { id: 'vegas', nameKey: 'vegasMode', textKey: 'vegasText' },
  ],
  noteKey: 'note',
  coachKey: 'coach',
  boardLabelKey: 'boardLabel',
  actions: {
    undo,
    hint,
    restart: () => newGame(),
    again: () => newGame({ seed: game.seed }),
    back: undo,
    next: () => newGame(),
    selectLevel,
    setting: toggleRule,
  },
});

shell.setSetting('draw3', rules.draw === 3);
shell.setSetting('vegas', rules.scoring === 'vegas');

// ---------- Tisch ----------

const view = new TableView(shell.stage, {
  touch: () => {
    if (celebration?.running) celebration.stop();
  },
  tap: (from) => {
    const to = game.bestTarget(from);
    if (!to) {
      sound.invalid();
      view.shake(game.cardsAt(from));
      return;
    }
    play(from, to);
  },
  move: (from, to) => (to.pile === 'none' ? false : play(from, to)),
  draw,
  lift: () => sound.draw(1),
  invalid: () => sound.invalid(),
});
view.el.setAttribute('role', 'application');
view.el.setAttribute('aria-label', t('boardLabel'));
view.setGame(game);

// ---------- Züge ----------

function play(from, to) {
  if (autoRunning) return false;
  const rec = game.move(from, to);
  if (!rec) return false;
  if (rec.to.pile === 'foundation') sound.found(game.foundationCount / 52);
  else sound.place();
  if (rec.flipped !== null) setTimeout(() => sound.flip(), 140);
  afterMove();
  return true;
}

function draw() {
  if (autoRunning) return;
  const rec = game.drawCards();
  if (!rec) {
    if (game.stock.length === 0 && game.waste.length > 0) shell.toast(t('noRecycle'));
    sound.invalid();
    return;
  }
  if (rec.type === 'recycle') {
    sound.recycle();
    const left = game.maxRecycles - game.recycles;
    if (Number.isFinite(left)) shell.toast(t('passesLeft', { n: left + 1 }));
  } else {
    sound.draw(rec.cards.length);
  }
  afterMove();
}

function afterMove() {
  previousGame = null;
  view.clearHint();
  shell.hideResult();
  view.render();
  updateHud();
  persist();
  if (game.isWon) win();
  else if (game.canAutoComplete) autoComplete();
  else if (game.isStuck) setTimeout(() => game.isStuck && !game.isWon && showStuck(), 500);
}

// Alles offen: die restlichen Karten wandern von allein auf die Ablagen
async function autoComplete() {
  if (autoRunning) return;
  autoRunning = true;
  const forGame = game;
  while (game === forGame && !game.isWon) {
    const m = game.autoMove();
    if (!m) break;
    game.move(m.from, m.to);
    sound.found(game.foundationCount / 52);
    view.render();
    updateHud();
    await new Promise((r) => setTimeout(r, 120));
  }
  autoRunning = false;
  if (game === forGame) {
    persist();
    if (game.isWon) win();
  }
}

// ---------- Ende ----------

function rating() {
  if (game.undos === 0 && game.hints === 0) return { key: 'perfect', stars: 3 };
  if (game.hints === 0) return { key: 'good', stars: 2 };
  return { key: 'solved', stars: 1 };
}

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const signed = (n) => (n < 0 ? `−${-n}` : String(n));

// Ein Vegas-Spiel zählt fürs Konto, sobald es gewonnen oder verlassen wird
function settleBank(g = game) {
  if (g.scoring !== 'vegas' || g.banked || !g.started) return;
  g.banked = true;
  bank += g.score;
  save('bank', bank);
}

function countGame(won) {
  if (game.counted) return;
  game.counted = true;
  const key = statKey();
  const s = { ...statsFor(key) };
  s.games += 1;
  if (won) {
    s.won += 1;
    s.stars = Math.max(s.stars, rating().stars);
    if (s.best === null || game.finalScore > s.best) s.best = game.finalScore;
  }
  stats = { ...stats, [key]: s };
  save('stats', stats);
}

async function win() {
  countGame(true);
  settleBank();
  persist();
  sound.win(rating().stars === 3);
  updateHud();
  renderLevelList();
  const forGame = game;
  celebration = celebration || new Celebration(view.el, lang);
  const show = () => game === forGame && !document.querySelector('#result:not([hidden])') && showWin();
  const timer = setTimeout(show, 2600);
  try {
    await celebration.run({
      rectFor: (suit) => view.foundationRect(suit),
      onMove: (c, x, y) => view.flyCard(c, x, y),
      onLand: (c) => view.hideCard(c),
    });
  } catch (err) {
    console.error(err);
  }
  clearTimeout(timer);
  show();
}

function showWin() {
  const r = rating();
  const [title, text] = t(`rating.${r.key}`);
  const s = statsFor(statKey());
  const parts = [t('stat.score', { n: signed(game.finalScore) })];
  if (game.scoring === 'standard' && game.timeBonus()) parts.push(t('stat.bonus', { n: game.timeBonus() }));
  parts.push(t('stat.time', { t: clock(game.elapsed) }), t('stat.moves', { n: game.moves }));
  if (game.scoring === 'vegas') parts.push(t('stat.bank', { n: signed(bank) }));
  parts.push(t('stat.won', { n: s.won, m: s.games }));
  shell.showResult({ title, text, stars: r.stars, stats: parts.join(' · '), highlight: r.stars === 3, showNext: true });
}

let verdictRequest = 0;
function showStuck() {
  const [title, text] = t('stuck');
  const parts = [t('stat.score', { n: signed(game.score) }), t('stat.time', { t: clock(game.elapsed) })];
  shell.showResult({ title, text, stars: null, stats: parts.join(' · '), showNext: true });
  // Bei Zufall verrät der Löser, ob das Spiel überhaupt zu gewinnen war
  if (game.level !== 'random') return;
  const id = ++verdictRequest;
  const forGame = game;
  ask({ fresh: true, budget: 150000 }).then((r) => {
    if (id !== verdictRequest || forGame !== game || !r || r.status === 'timeout') return;
    const el = document.getElementById('result-text');
    if (el && !document.getElementById('result').hidden) el.textContent = `${text} ${t(r.status === 'solved' ? 'wasSolvable' : 'wasUnsolvable')}`;
  });
}

// ---------- Anzeige ----------

function updateHud() {
  if (game.scoring === 'vegas') shell.setCounter(signed(game.score), t('vegas'));
  else shell.setCounter(game.score, t('points', { n: game.score }));
  shell.setDisabled('undo', game.history.length === 0 && !previousGame);
  shell.setDisabled('hint', game.isWon);
  shell.setLevelLabel(`${t(`level.${level.id}`)} · ${t('cards', { n: game.draw })}`);
}

// Vorschau in der Auswahl: aufgefächerte Karten, je schwerer, desto mehr
function preview(lv) {
  if (lv.id === 'daily') {
    const day = new Date().getDate();
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-6 50 50)"><use href="#karo-back" x="26" y="16" width="48" height="68"/></g>
      <rect x="31" y="27" width="38" height="46" rx="5" fill="#fbf8f2"/><text x="50" y="62" text-anchor="middle" font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="30" font-weight="700" fill="#c63b2c">${day}</text></svg>`;
  }
  if (lv.id === 'random') {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#karo-back" x="26" y="16" width="48" height="68"/>
      <circle cx="50" cy="50" r="15" fill="#fbf8f2"/><text x="50" y="59" text-anchor="middle" font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="26" font-weight="700" fill="#1c1d2a">?</text></svg>`;
  }
  const n = lv.fan;
  let cards = '';
  for (let i = 0; i < n; i++) {
    const angle = (i - (n - 1) / 2) * 14;
    cards += `<g transform="rotate(${angle} 50 92)"><use href="#karo-back" x="29" y="18" width="42" height="59"/></g>`;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${cards}</svg>`;
}

function renderLevelList() {
  shell.renderLevels(LEVELS.map((lv) => {
    const s = statsFor(`${rules.draw}:${lv.id}`);
    return {
      id: lv.id,
      name: t(`level.${lv.id}`),
      meta: t(`levelMeta.${lv.id}`),
      stars: lv.id === 'random' ? null : s.stars,
      difficulty: lv.difficulty[rules.draw],
      preview: preview(lv),
      current: lv.id === level.id,
    };
  }));
}

// ---------- Neu, Zurück, Stufen, Regeln ----------

function newGame({ seed = null, toast = null } = {}) {
  if (celebration?.running) celebration.stop();
  shell.hideResult();
  if (game.started && !game.isWon) {
    const data = JSON.parse(JSON.stringify(game.serialize()));
    const counted = game.counted;
    const before = bank;
    countGame(false);
    settleBank();
    previousGame = { data, counted, bankDelta: bank - before, level: game.level };
    shell.toast(toast || t('restartUndo'));
  } else {
    previousGame = null;
    if (toast) shell.toast(toast);
  }
  game = createGame(seed);
  persist();
  view.setGame(game, { deal: true });
  sound.shuffle();
  updateHud();
  renderLevelList();
}

function undo() {
  if (autoRunning) return;
  if (celebration?.running) celebration.stop();
  shell.hideResult();
  // Direkt nach Neu: Zurück holt das vorherige Spiel zurück
  if (game.history.length === 0 && previousGame) {
    const g = Game.restore(previousGame.data);
    if (g) {
      g.counted = previousGame.counted;
      g.banked = false;
      if (previousGame.bankDelta) {
        bank -= previousGame.bankDelta;
        save('bank', bank);
      }
      if (!previousGame.counted) {
        const key = `${g.draw}:${previousGame.level}`;
        const s = { ...statsFor(key) };
        s.games = Math.max(0, s.games - 1);
        stats = { ...stats, [key]: s };
        save('stats', stats);
      }
      game = g;
      rules = { draw: g.draw, scoring: g.scoring };
      level = levelById(g.level) || level;
      save('draw', rules.draw);
      save('scoring', rules.scoring);
      save('level', level.id);
      shell.setSetting('draw3', rules.draw === 3);
      shell.setSetting('vegas', rules.scoring === 'vegas');
    }
    previousGame = null;
    shell.hideToast();
    view.setGame(game);
    persist();
    updateHud();
    renderLevelList();
    return;
  }
  if (!game.undo()) return;
  sound.place({ soft: true });
  view.clearHint();
  view.hidden.clear();
  view.render();
  updateHud();
  persist();
}

function selectLevel(id) {
  const lv = levelById(id);
  if (!lv) return;
  shell.closePanels();
  if (lv.id === level.id && !game.isWon) return;
  level = lv;
  save('level', lv.id);
  newGame();
}

function toggleRule(id, on) {
  if (id === 'draw3') rules.draw = on ? 3 : 1;
  if (id === 'vegas') rules.scoring = on ? 'vegas' : 'standard';
  save('draw', rules.draw);
  save('scoring', rules.scoring);
  shell.setSetting('draw3', rules.draw === 3);
  shell.setSetting('vegas', rules.scoring === 'vegas');
  newGame({ toast: game.started && !game.isWon ? t('rulesChanged') : null });
}

// ---------- Tipps ----------

let worker = null;
let request = 0;

function ask({ fresh = false, budget = 60000 } = {}) {
  if (!worker) worker = new Worker(new URL('./solver-worker.js?v=1.0.4', import.meta.url), { type: 'module' });
  const id = ++request;
  return new Promise((resolve) => {
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      resolve(e.data.result);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ id, game: game.serialize(), fresh, budget });
  });
}

async function hint() {
  if (game.isWon || autoRunning) return;
  shell.setBusy('hint', true);
  const slow = setTimeout(() => shell.toast(t('thinking')), 350);
  const forGame = game;
  const moves = game.moves;
  const result = await ask();
  clearTimeout(slow);
  shell.setBusy('hint', false);
  if (forGame !== game || moves !== game.moves) return;
  if (!result || result.status === 'timeout') return shell.toast(t('hintTimeout'));
  if (result.status !== 'solved' || !result.move) return shell.toast(t('noSolution'));
  shell.hideToast();
  game.hints += 1;
  persist();
  view.showHint(result.move);
  if (result.move.type === 'draw') shell.toast(t('hintDraw'), 2000);
}

// ---------- Zeit ----------

let lastTick = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = Math.min(2, (now - lastTick) / 1000);
  lastTick = now;
  if (document.hidden || autoRunning || !game.started || game.isWon) return;
  if (!document.getElementById('result').hidden) return;
  const before = game.score;
  game.tick(dt);
  if (game.score !== before) updateHud();
  if (Math.floor(game.elapsed) % 5 === 0) persist();
}, 1000);

document.addEventListener('visibilitychange', () => {
  lastTick = performance.now();
  if (document.hidden) persist();
  // Zurück in der App: Tisch einmal neu zeichnen, damit sich ein Darstellungsfehler nie hält
  else if (!autoRunning && !celebration?.running) view.refresh();
});
window.addEventListener('pageshow', () => {
  if (!autoRunning && !celebration?.running) view.refresh();
});

// ---------- Start ----------

updateHud();
renderLevelList();
setTimeout(() => shell.showCoach(), 900);

// Kartenbilder für die Siegesfeier schon während des Spiels im Hintergrund vorbereiten
celebration = new Celebration(view.el, lang);
setTimeout(() => celebration.prepare(view.g.W), 2500);

// Für automatische Tests im Browser (scripts/e2e.mjs). Jedes Spiel stellt history und e2e.move bereit.
window.__game = {
  id: 'karo',
  view,
  sound,
  shell,
  get game() { return game; },
  get history() { return game.history.length; },
  newGame,
  e2e: {
    // Einen gültigen Zug spielen: eine Karte vom Stapel ziehen, sonst den Tipp ausführen
    async move() {
      if (game.stock.length || game.canRecycle) return draw();
      const r = await ask();
      if (r?.move?.type === 'move') play(r.move.from, r.move.to);
    },
    // Stellen, die auf dem Bildschirmfoto hell aussehen müssen: bei jeder offenen Zahlkarte oben
    // in einer Spalte das freie Papier links unter dem Index. Zeigt Safari dort die Rückseite,
    // ist es dunkel und bunt.
    looks() {
      const box = view.el.getBoundingClientRect();
      const { W, H } = view.g;
      const out = [];
      game.tableau.forEach((col, i) => {
        const card = col.up[col.up.length - 1];
        if (card === undefined || card % 13 === 0 || card % 13 > 9 || view.hidden.has(card)) return;
        const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(view.cards[card].style.transform);
        if (!m) return;
        out.push({ label: `Spalte ${i + 1}`, x: box.left + Number(m[1]) + W * 0.07, y: box.top + Number(m[2]) + H * 0.4, w: W * 0.17, h: H * 0.2 });
      });
      return out;
    },
    // Zusätzliche Prüfungen für den Browser-Test: jede liefert true, wenn alles stimmt
    checks: {
      // Die letzte Karte auf die Ablage: springen danach Karten von den Ablagen?
      async 'Siegesfeier'() {
        game.tableau.forEach((c) => { c.down = []; c.up = []; });
        game.stock = [];
        game.waste = [];
        game.foundations = [13, 13, 13, 12];
        game.tableau[0].up = [51];
        view.render({ animate: false });
        play({ pile: 'tableau', col: 0, index: 0 }, { pile: 'foundation' });
        // Die Feier muss anlaufen. Wie schnell, hängt vom Testrechner ab, darum bis zu 8 Sekunden warten.
        for (let t = 0; t < 80 && (celebration?.launched || 0) < 3; t++) await new Promise((r) => setTimeout(r, 100));
        const launched = celebration?.launched || 0;
        const canvas = Boolean(document.querySelector('.table .celebration'));
        celebration?.stop();
        // Bei einem Fehler genau sagen, was fehlt
        return launched >= 3 && canvas ? true : `gestartete Karten: ${launched}, Zeichenfläche: ${canvas}, Bilder fertig: ${celebration?.bitmaps.filter(Boolean).length}`;
      },
    },
  },
};
