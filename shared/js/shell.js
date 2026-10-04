// Die Hülle von MIND PAUSE: alles, was jedes Spiel gleich braucht.
// Kopfzeile, Steuerleiste, Auswahl (Blatt von unten, im Querformat Schublade von links), Einstellungen,
// Ergebniskarte, Hinweise, Erststart-Hinweis, Ton-Freigabe und Offline-Betrieb.
//
// Ein Spiel ruft createShell(config) auf, bekommt die Bühne (stage) für sein Brett
// und steuert die Oberfläche über die zurückgegebenen Funktionen. Siehe shared/README.md.

const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  hint: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  restart: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  levels: '<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  resign: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 4L17 12H6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
};

// Version der Hülle. Ändern nur über: node scripts/release.mjs shell <version>
export const SHELL_VERSION = '1.5.0';

export function createShell(config) {
  const {
    title,
    version,
    i18n,
    storage,
    sound,
    buttons = ['undo', 'hint', 'restart', 'levels', 'settings'],
    levels = null, // { buttonKey, titleKey, nextKey, otherKey }
    settings = [], // Schalter: [{ id, nameKey, textKey }], Auswahl: [{ id, nameKey, options: [{ value, labelKey }] }]
    noteKey = null,
    coachKey = null,
    boardLabelKey = null,
    actions = {},
    onGesture = () => {},
  } = config;
  const { t } = i18n;
  const $ = (sel) => document.querySelector(sel);
  const act = (name, ...args) => {
    const fn = actions[name];
    if (fn) fn(...args);
  };

  // ---------- Aufbau ----------

  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
  const buttonLabel = { undo: 'undo', hint: 'hint', restart: 'restart', resign: 'resign', levels: levels?.buttonKey, settings: 'settings' };

  // Eine Schaltfläche ist ein Name der Hülle ('undo', 'hint' …) oder eine eigene des Spiels:
  // { id, icon: SVG-Inhalt im Feld 24 × 24, labelKey }
  const controls = buttons.map((b) => (typeof b === 'string'
    ? { id: b, svg: icon(b), labelKey: buttonLabel[b] }
    : { id: b.id, svg: `<svg viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>`, labelKey: b.labelKey }));

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app${levels ? '' : ' no-levels'}">
      ${levels ? `
      <aside id="panel" class="panel" aria-labelledby="panel-title">
        <div class="grabber" aria-hidden="true"></div>
        <div class="panel-head">
          <h2 id="panel-title" data-i18n="${levels.titleKey}"></h2>
          <button id="panel-close" class="close-btn" type="button" data-i18n-label="close">${icon('close')}</button>
        </div>
        <ul id="level-list" class="level-list"></ul>
      </aside>` : ''}

      <header class="top">
        <div class="titles">
          <h1 class="brand">${title}</h1>
          ${levels ? `
          <button id="level-name" class="level-name" type="button" aria-haspopup="dialog">
            <span id="level-label"></span>${icon('chevron')}
          </button>` : ''}
          ${coachKey ? `<div id="coach" class="coach" role="status" hidden data-i18n="${coachKey}"></div>` : ''}
        </div>
        <div class="counter" aria-live="polite">
          <span id="count" class="count"></span>
          <span id="count-label" class="count-label"></span>
        </div>
      </header>

      <main class="stage" id="stage">
        <svg id="board" class="board" role="img" ${boardLabelKey ? `data-i18n-label="${boardLabelKey}"` : ''}></svg>
        <section id="result" class="result" hidden aria-live="polite">
          <div class="card">
            <p class="result-kicker" data-i18n="gameOver"></p>
            <h2 id="result-title" class="result-title"></h2>
            <div id="result-stars" class="stars" aria-hidden="true"></div>
            <p id="result-text" class="result-text"></p>
            <p id="result-stats" class="result-stats"></p>
            <div class="result-actions">
              <button id="again" class="btn ghost" type="button" data-i18n="again"></button>
              <button id="next" class="btn solid" type="button">
                <span data-i18n="${levels?.nextKey || 'again'}"></span> <span aria-hidden="true">→</span>
              </button>
            </div>
            <div class="result-links">
              <button id="back" class="link-btn" type="button" data-i18n="undoLast"></button>
              ${levels ? `<button id="other" class="link-btn" type="button" aria-haspopup="dialog" data-i18n="${levels.otherKey || levels.titleKey}"></button>` : ''}
            </div>
          </div>
        </section>
        <section id="confirm" class="result confirm" hidden role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="card">
            <h2 id="confirm-title" class="result-title"></h2>
            <p id="confirm-text" class="result-text"></p>
            <div class="result-actions">
              <button id="confirm-cancel" class="btn ghost" type="button"></button>
              <button id="confirm-ok" class="btn solid" type="button"></button>
            </div>
          </div>
        </section>
        <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
      </main>

      <nav class="controls${controls.length > 5 ? ' many' : ''}">
        ${controls.map((b) => `
        <button id="btn-${b.id}" class="icon-btn" type="button" data-action="${b.id}"
                ${b.id === 'levels' || b.id === 'settings' ? 'aria-haspopup="dialog"' : ''}>
          ${b.svg}<span data-i18n="${b.labelKey}"></span>
        </button>`).join('')}
      </nav>
    </div>

    <div id="scrim" class="scrim" hidden></div>

    <section id="settings" class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="grabber" aria-hidden="true"></div>
      <div class="panel-head">
        <h2 id="settings-title" data-i18n="settingsTitle"></h2>
        <button id="settings-close" class="close-btn" type="button" data-i18n-label="close">${icon('close')}</button>
      </div>
      ${settings.filter((s) => s.options).map((s) => `
      <div class="setting column">
        <p class="setting-name" data-i18n="${s.nameKey}"></p>
        <div id="${s.id}-choice" class="segmented" style="grid-template-columns: repeat(${s.options.length}, 1fr)" role="radiogroup" data-i18n-label="${s.nameKey}">
          ${s.options.map((o) => `<button type="button" role="radio" aria-checked="false" data-value="${o.value}" data-i18n="${o.labelKey}"></button>`).join('')}
        </div>
      </div>`).join('')}
      <div class="setting">
        <div>
          <p class="setting-name" data-i18n="sound"></p>
          <p class="setting-text" data-i18n="soundOn"></p>
        </div>
        <button id="sound-toggle" class="switch" type="button" role="switch" aria-checked="true" data-i18n-label="sound"><span></span></button>
      </div>
      <div class="setting column">
        <p class="setting-name" data-i18n="soundStyle"></p>
        <div id="style-choice" class="segmented" role="radiogroup" data-i18n-label="soundStyle">
          <button type="button" role="radio" data-style="warm" data-i18n="styles.warm"></button>
          <button type="button" role="radio" data-style="clear" data-i18n="styles.clear"></button>
          <button type="button" role="radio" data-style="soft" data-i18n="styles.soft"></button>
        </div>
      </div>
      ${settings.filter((s) => !s.options).map((s) => `
      <div class="setting">
        <div>
          <p class="setting-name" data-i18n="${s.nameKey}"></p>
          <p class="setting-text" data-i18n="${s.textKey}"></p>
        </div>
        <button id="${s.id}-toggle" class="switch" type="button" role="switch" aria-checked="false" data-i18n-label="${s.nameKey}"><span></span></button>
      </div>`).join('')}
      ${noteKey ? `<p class="setting-note" data-i18n="${noteKey}"></p>` : ''}
      <p id="version" class="setting-version"></p>
    </section>
  `);

  i18n.translateDocument();
  $('#version').textContent = `${title} · ${t('subtitle')} · ${t('version', { v: version })} · ${t('collection')}`;

  // ---------- Panels ----------

  // Erster Start: erst die Auswahl zeigen, beim Schließen dann die Sprechblase, wo man sie wiederfindet
  let firstRun = false;

  function openPanel(name) {
    closePanels();
    document.body.classList.add(`open-${name}`);
    $('#scrim').hidden = false;
    if (name === 'levels') {
      const current = $('#level-list .current');
      if (current) current.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }

  function closePanels() {
    document.body.classList.remove('open-levels', 'open-settings');
    $('#scrim').hidden = true;
    if (firstRun) {
      firstRun = false;
      setTimeout(showBubble, 450);
    }
  }

  // Blatt mit dem Finger nach unten wegwischen
  function swipeToClose(el) {
    if (!el) return;
    let start = null;
    el.addEventListener('touchstart', (e) => {
      start = e.target.closest('.level-list') ? null : e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (start !== null && e.changedTouches[0].clientY - start > 60) closePanels();
      start = null;
    }, { passive: true });
  }

  // ---------- Auswahl (Figuren, Modi, Level) ----------

  const starsHtml = (n) => [0, 1, 2].map((i) => `<span class="star${i < n ? ' on' : ''}">★</span>`).join('');

  // items: [{ id, name, meta, stars, difficulty, preview (SVG-Text), current }]
  function renderLevels(items) {
    const list = $('#level-list');
    if (!list) return;
    list.innerHTML = items.map((it) => {
      const dots = it.difficulty
        ? [1, 2, 3, 4, 5].map((i) => `<i class="${i <= it.difficulty ? 'on' : ''}"></i>`).join('')
        : '';
      const diff = it.difficulty ? t('difficulty', { n: it.difficulty }) : '';
      return `<li>
        <button class="level-card${it.current ? ' current' : ''}" type="button" data-id="${it.id}" aria-pressed="${Boolean(it.current)}">
          ${it.preview || ''}
          <span class="lc-name">${it.name}</span>
          <span class="lc-meta">${it.meta || ''}</span>
          ${it.stars === undefined || it.stars === null ? '<span class="lc-stars"></span>' : `<span class="lc-stars" aria-label="${it.stars}/3">${starsHtml(it.stars)}</span>`}
          <span class="lc-dots" title="${diff}" aria-label="${diff}">${dots}</span>
        </button>
      </li>`;
    }).join('');
  }

  // ---------- Anzeige ----------

  function setCounter(value, label) {
    $('#count').textContent = value;
    $('#count-label').textContent = label;
  }

  function setLevelLabel(text) {
    const el = $('#level-label');
    if (el) el.textContent = text;
    document.title = `${title} · ${text}`;
  }

  function setDisabled(name, disabled) {
    const el = $(`#btn-${name}`);
    if (el) el.disabled = disabled;
  }

  function setBusy(name, busy) {
    const el = $(`#btn-${name}`);
    if (el) el.classList.toggle('busy', busy);
  }

  // Eigene Schaltfläche umschalten, zum Beispiel Pause und Weiter: { icon, labelKey }
  function setButton(id, { icon: svg, labelKey } = {}) {
    const el = $(`#btn-${id}`);
    if (!el) return;
    if (svg) el.querySelector('svg').innerHTML = svg;
    if (labelKey) {
      const span = el.querySelector('span');
      span.dataset.i18n = labelKey;
      span.textContent = t(labelKey);
    }
  }

  // opts: { title, text, stars, stats, highlight, showNext, showBack, showOther }
  function showResult(opts) {
    $('#result-title').textContent = opts.title;
    $('#result-text').textContent = opts.text || '';
    $('#result-stars').innerHTML = opts.stars === null || opts.stars === undefined ? '' : starsHtml(opts.stars);
    $('#result-stats').textContent = opts.stats || '';
    $('#next').hidden = !opts.showNext;
    $('#back').hidden = opts.showBack === false;
    if ($('#other')) $('#other').hidden = opts.showOther === false;
    $('#result').classList.toggle('perfect', Boolean(opts.highlight));
    $('#result').hidden = false;
    requestAnimationFrame(() => $('#result').classList.add('show'));
  }

  function hideResult() {
    $('#result').classList.remove('show');
    $('#result').hidden = true;
  }

  // Rückfrage auf dem Brett, zum Beispiel vor dem Aufgeben. Ergebnis: true bei ok, sonst false.
  // opts: { title, text, ok, cancel }
  let confirmDone = null;
  function confirm(opts) {
    if (confirmDone) confirmDone(false);
    $('#confirm-title').textContent = opts.title;
    $('#confirm-text').textContent = opts.text || '';
    $('#confirm-ok').textContent = opts.ok;
    $('#confirm-cancel').textContent = opts.cancel || t('cancel');
    $('#confirm').hidden = false;
    requestAnimationFrame(() => $('#confirm').classList.add('show'));
    return new Promise((resolve) => {
      confirmDone = (answer) => {
        confirmDone = null;
        $('#confirm').classList.remove('show');
        $('#confirm').hidden = true;
        resolve(answer);
      };
    });
  }

  let toastTimer = null;
  function toast(text, ms = 3200) {
    const el = $('#toast');
    el.textContent = text;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms);
  }

  function hideToast() {
    const el = $('#toast');
    el.classList.remove('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 250);
  }

  // Einmalig beim ersten Start: die Auswahl öffnet sich von selbst, damit man sieht, was es gibt.
  // Wird sie geschlossen, zeigt eine Sprechblase am Namen der Stufe, wo man sie wiederfindet.
  function showCoach() {
    if (storage.load('coachSeen', false)) return;
    storage.save('coachSeen', true);
    const busy = !$('#result').hidden || !$('#confirm').hidden || $('#scrim').hidden === false;
    if (levels && !busy) {
      openPanel('levels');
      firstRun = true;
      return;
    }
    showBubble();
  }

  // Sprechblase unter dem Namen der Stufe. Verschwindet nach der ersten Berührung oder nach 6 Sekunden.
  function showBubble() {
    const el = $('#coach');
    if (!el || !el.hidden) return;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(hideCoach, 6000);
    document.addEventListener('pointerdown', hideCoach, { once: true });
  }

  function hideCoach() {
    const el = $('#coach');
    if (!el || el.hidden) return;
    el.classList.remove('show');
    setTimeout(() => (el.hidden = true), 300);
  }

  // ---------- Einstellungen ----------

  const settingState = {};
  // on: true oder false bei Schaltern, der gewählte Wert bei einer Auswahl
  function setSetting(id, on) {
    settingState[id] = on;
    const el = $(`#${id}-toggle`);
    if (el) el.setAttribute('aria-checked', String(on));
    document.querySelectorAll(`#${id}-choice [data-value]`).forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.value === on));
    });
  }

  function renderSettings() {
    $('#sound-toggle').setAttribute('aria-checked', String(sound.enabled));
    document.querySelectorAll('#style-choice [data-style]').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.style === sound.style));
    });
  }

  // ---------- Ereignisse ----------

  document.querySelectorAll('.controls [data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.action;
      hideCoach();
      if (name === 'levels') openPanel('levels');
      else if (name === 'settings') {
        renderSettings();
        openPanel('settings');
      } else act(name);
    });
  });

  $('#again').addEventListener('click', () => act('again'));
  $('#confirm-ok').addEventListener('click', () => confirmDone && confirmDone(true));
  $('#confirm-cancel').addEventListener('click', () => confirmDone && confirmDone(false));
  $('#next').addEventListener('click', () => act('next'));
  $('#back').addEventListener('click', () => act('back'));

  if (levels) {
    $('#level-name').addEventListener('click', () => {
      hideCoach();
      if (document.body.classList.contains('open-levels')) closePanels();
      else openPanel('levels');
    });
    $('#panel-close').addEventListener('click', closePanels);
    $('#level-list').addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      act('selectLevel', card.dataset.id);
      // Kurz warten, damit man die neue Auswahl aufleuchten sieht, dann gehört der Platz dem Brett
      setTimeout(() => {
        if (document.body.classList.contains('open-levels')) closePanels();
      }, 260);
    });
    $('#other').addEventListener('click', () => openPanel('levels'));
    swipeToClose($('#panel'));
  }

  $('#settings-close').addEventListener('click', closePanels);
  $('#scrim').addEventListener('click', closePanels);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (confirmDone) confirmDone(false);
    else closePanels();
  });
  swipeToClose($('#settings'));

  $('#sound-toggle').addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    storage.save('sound', sound.enabled);
    renderSettings();
  });
  $('#style-choice').addEventListener('click', (e) => {
    const b = e.target.closest('[data-style]');
    if (!b) return;
    sound.setStyle(b.dataset.style);
    storage.save('soundStyle', sound.style);
    renderSettings();
    sound.preview();
  });
  for (const s of settings) {
    if (s.options) {
      $(`#${s.id}-choice`).addEventListener('click', (e) => {
        const b = e.target.closest('[data-value]');
        if (b && b.dataset.value !== settingState[s.id]) act('setting', s.id, b.dataset.value);
      });
    } else {
      $(`#${s.id}-toggle`).addEventListener('click', () => act('setting', s.id, !settingState[s.id]));
    }
  }

  // Ton freischalten. iOS erlaubt das nur beim Loslassen des Fingers oder bei einem vollständigen
  // Tipp, nicht beim ersten Aufsetzen, und hält den Ton nach einem App-Wechsel an.
  const gesture = () => {
    sound.unlock();
    onGesture();
  };
  for (const type of ['touchend', 'click', 'keydown']) {
    document.addEventListener(type, gesture, { capture: true, passive: true });
  }
  document.addEventListener('pointerdown', () => sound.unlock(), { capture: true, passive: true });

  // Doppeltipp-Zoom und Pinch-Zoom in Safari unterbinden
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  registerServiceWorker();
  renderSettings();

  return {
    stage: $('#stage'),
    board: $('#board'),
    t,
    lang: i18n.lang,
    starsHtml,
    renderLevels,
    setCounter,
    setLevelLabel,
    setDisabled,
    setBusy,
    setButton,
    showResult,
    hideResult,
    confirm,
    toast,
    hideToast,
    showCoach,
    hideCoach,
    openPanel,
    closePanels,
    setSetting,
    renderSettings,
  };
}

// Offline-Betrieb. Übernimmt eine neue Version die Kontrolle, lädt die Seite einmal neu,
// damit nie Dateien zweier Versionen gleichzeitig laufen.
function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
}
