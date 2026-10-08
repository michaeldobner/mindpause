<div align="center">

# MIND PAUSE

**Calm, beautifully crafted puzzle games for iPhone and iPad.**

Classic board games, reimagined with tactile design and handcrafted sound. Free, offline, no ads.

[**▶ Open MIND PAUSE**](https://michaeldobner.github.io/mindpause/) · [Deutsch](README.de.md) · [Shell](shared/README.md)

[![Tests](https://github.com/michaeldobner/mindpause/actions/workflows/tests.yml/badge.svg)](https://github.com/michaeldobner/mindpause/actions/workflows/tests.yml)

</div>

## Games

| | Game | Description | Version |
|---|---|---|---|
| <img src="spring/icons/icon.svg" width="56" alt=""> | **[SPRING](spring/README.md)** · [play](https://michaeldobner.github.io/mindpause/spring/) | Peg solitaire on the classic cross-shaped board. Seven figures from easy to masterful, hints, a living rim, tilt | 2.1.2 |
| <img src="queen/icons/icon.svg" width="56" alt=""> | **[QUEEN](queen/README.md)** · [play](https://michaeldobner.github.io/mindpause/queen/) | German checkers against the computer at four levels or for two players on one device. Ebony, maple and an engraved golden crown, trays for captured pieces, your own pieces always at the bottom | 1.3.0 |
| <img src="karo/icons/icon.svg" width="56" alt=""> | **[KARO](karo/README.md)** · [play](https://michaeldobner.github.io/mindpause/karo/) | Classic solitaire as on Windows. Draw one or three, points or Vegas, levels that can always be solved, hints | 1.0.5 |
| <img src="fuge/icons/icon.svg" width="56" alt=""> | **[FUGE](fuge/README.md)** · [play](https://michaeldobner.github.io/mindpause/fuge/) | The classic falling block game as a lacquered wooden box. Classic, Sprint, 3 minutes and an endless Calm mode, gestures instead of buttons, thumb controls in landscape | 1.1.0 |
| <img src="muehle/icons/icon.svg" width="56" alt=""> | **[MÜHLE](muehle/README.md)** · [play](https://michaeldobner.github.io/mindpause/muehle/) | Nine men's morris against the computer on three levels or for two players on one device. Gold lines on black wood, glowing mills, trays as supply | 1.1.0 |
| <img src="blocks/icons/icon.svg" width="56" alt=""> | **[BLOCKS](blocks/README.md)** · [play](https://michaeldobner.github.io/mindpause/blocks/) | The block puzzle: drag pieces from the tray onto the board, full rows and columns clear. 30 levels with starting blocks and rising difficulty, plus Classic 8 × 8, Wide 10 × 10 and an endless Calm mode, streaks, preview while dragging, pieces of blue ceramic | 1.1.1 |

More games and play across two devices are on the way, see the [roadmap](#roadmap).

## What every game shares

All games are built on one common **shell** in [`shared/`](shared/README.md). Change something there, for example a font, and it changes in every game.

| Shared | Meaning |
|---|---|
| **Design tokens** | Fonts, colours, spacing, shadows and motion in `shared/tokens.css` |
| **Interface** | Header, control bar, picker as sheet or drawer, open by itself on the first start, settings, result card with stars, toasts, first launch hint |
| **Layouts** | portrait and landscape on iPhone and iPad, in landscape header on the left, full height board, controls on the right, light and dark mode, safe areas |
| **Sound engine** | Ceramic on wood in four layers, three sound styles, respects the silent switch |
| **Living rim** | Physics for marbles and pieces in a rim or in trays: tap, swipe, tilt |
| **Languages** | German on German devices, English everywhere else |
| **Offline** | Every game installs as its own app on the home screen and works without internet |

Each game keeps its own rules, board, sounds, README, changelog, documentation, version and address.

## Repository structure

```
mindpause/
├─ index.html              home page of the collection (built from games.json)
├─ games.json              list of all games
├─ shared/                 the shell, see shared/README.md
│  ├─ tokens.css           design tokens
│  ├─ shell.css            layout and building blocks
│  ├─ js/                  shell, languages, storage, sound engine, physics, tilt
│  └─ tests/               tests of the shell
├─ spring/                 SPRING, see spring/README.md
├─ queen/                  QUEEN, see queen/README.md
├─ karo/                   KARO, see karo/README.md
├─ fuge/                   FUGE, see fuge/README.md
├─ muehle/                 MÜHLE, see muehle/README.md
├─ blocks/                 BLOCKS, see blocks/README.md
├─ scripts/
│  ├─ release.mjs          sets the version of a game or of the shell
│  └─ e2e.mjs              browser test of the whole collection
├─ tests/                  tests across the collection
├─ Dockerfile              serves the collection with nginx (Coolify)
├─ deploy/nginx.conf       types, caching and redirects for nginx
└─ .github/workflows/      tests on every push, deploy once they are green
```

## Development

Requirements: Node.js 20 or newer and a modern browser. There are no dependencies and no build step.

```bash
npm start       # local server: http://localhost:3000/ (home), /spring/, /queen/
npm test        # logic tests of every game and the shell
npm run e2e     # browser test of every game on iPhone portrait and landscape, iPhone SE and iPad landscape
E2E_ENGINE=webkit npm run e2e   # the same in WebKit, the engine of Safari
```

The browser test needs Playwright once: `npm install --no-save playwright && npx playwright install chromium`.

On every push GitHub Actions runs both. The browser test uploads screenshots of every game as a download (artifact "screenshots"), so changes to the shell can be checked visually across all games.

## Publishing

* **Hosting:** Coolify on your own server. An nginx serves the files unchanged, see [`Dockerfile`](Dockerfile) and [`deploy/nginx.conf`](deploy/nginx.conf). GitHub Pages stays possible as a mirror, because the collection needs no build step and every reference is relative.
* **Way of working:** every change goes through a pull request. Once the tests are green it is merged into `main` and the branch is deleted automatically. Coolify then builds a new image and rolls it out.
* **Versions:** every game has its own version, the shell has its own version too.

```bash
node scripts/release.mjs spring 2.2.0   # new version of SPRING
node scripts/release.mjs shell 1.5.0    # new version of the shell, affects every game
```

Every reference carries its version (`?v=` for game files, `?shell=` for shell files). A device therefore never mixes old and new files after an update. `tests/release.test.js` checks this on every push.

### Setting up Coolify

1. **Create the resource:** open the project, "+ New Resource", this repository as the source, branch `main`.
2. **Build pack:** `Dockerfile`, base directory `/`, Dockerfile location `/Dockerfile`.
3. **Port:** `80`.
4. **Domain:** enter the address you want. Coolify obtains the certificate itself. HTTPS is required, otherwise no browser registers a service worker and the games do not run offline.
5. **Health check:** path `/healthz`.
6. Press **Deploy**. The build takes a few seconds, the image holds about 2 MB, see [`.dockerignore`](.dockerignore).

There are two ways to roll out every change:

* **Coolify listens itself:** switch on "Automatic Deployment" in the resource. It rolls out on every push to `main`, even when the tests are red.
* **Only once the tests are green:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) triggers Coolify after a successful test run. Set two repository secrets for it, `COOLIFY_WEBHOOK` (the resource's deploy URL) and `COOLIFY_TOKEN` (an API token from Coolify under "Keys & Tokens"). Without those secrets the workflow skips itself.

One thing to keep in mind when the address changes: a game sitting on the home screen from `michaeldobner.github.io` stays on that address, because service workers and storage belong to an origin. To move to the new address, add the game again from there. Saved games on the device do not travel along.

## Adding a game

1. Create a folder with the game's id, for example `mill/`.
2. Use the same structure as `spring/`: `index.html`, `js/main.js`, `js/strings.js`, `css/<id>.css`, `sw.js`, `manifest.webmanifest`, `icons/`, `tests/`, `README.md`, `README.de.md`, `CHANGELOG.md`, `CHANGELOG.de.md`, `docs/de`, `docs/en`.
3. In `main.js` call `createShell()` from the shell, see [shell documentation](shared/README.md#connecting-a-game).
4. Provide `window.__game` with `history` and `e2e.move()` for the browser test.
5. Add an entry to `games.json`. The home page, the release script and the tests pick it up automatically.
6. Add a row to the games table above.

## Roadmap

| Step | Contents | Status |
|---|---|---|
| SPRING | Peg solitaire, 7 figures, hints, tilt | Done |
| Collection | Shell, home page, tests across all games | Done |
| QUEEN | German checkers, four computer levels, two players on one device | Done |
| KARO | Klondike solitaire, draw one or three, Windows and Vegas scoring, solvable levels | Done |
| FUGE | Falling blocks as a wooden box, four modes, gestures, shell 1.3.0 with custom buttons | Done |
| MÜHLE | Nine men's morris with WMD rules, three computer levels, two players, design from QUEEN | Done |
| Landscape | Shell 1.5.0: landscape for every game, full height board, your own pieces at the bottom, FUGE with thumb controls | Done |
| BLOCKS | Block puzzle with three modes, streak and preview, colours of SPRING and QUEEN Midnight | Done |
| BLOCKS 1.1 | 30 levels in six chapters with a sawtooth difficulty curve, each one checked to be solvable | Done |
| QUEEN 1.4 | Playing each other on two devices, stage 1: move by link | Planned |
| Later | Live with a room code, more games | Idea |

## Writing style

Texts and documentation are always written in German and English, without dashes. Code comments are in German.
