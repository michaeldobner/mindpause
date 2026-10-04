# Deployment

[Deutsche Version](../de/deployment.md) · [Overview](README.md)

## Overview

SPRING runs on **GitHub Pages** at

**https://michaeldobner.github.io/solohalma/**

```
push to main
   │
   ├─► GitHub Pages publishes main directly (workflow "pages build and deployment")
   │
   └─► GitHub Actions: workflow "Tests" checks the logic (.github/workflows/tests.yml)
```

There is no build step. The files on `main` are served as they are. So always develop changes on a separate branch, let the tests run there and only then merge into `main`.

## Repository settings

| Setting | Value |
|---|---|
| Visibility | Public (GitHub Pages for private repositories requires a paid plan) |
| Settings > Pages > Source | Deploy from a branch |
| Branch | `main`, folder `/ (root)` |

The `.nojekyll` file makes GitHub serve the files unchanged.

## Releasing a new version

1. Make and check changes on a branch (see [Development](development.md#release-checklist)).
2. Set the new version everywhere: `node scripts/release.mjs 2.1.0`. The script updates `package.json`, `js/main.js`, `sw.js` and every `?v=` reference. Also add new JavaScript files to the list in `sw.js` (the test reports it otherwise).
3. Run `npm test`.
4. Update both changelogs.
5. Merge the branch into `main`. The new version is live after one or two minutes.

The **Actions** tab in the repository shows the progress.

## How updates reach devices

The service worker always asks the network first, bypassing the browser cache. Because every version uses its own URLs for CSS and JavaScript, a device can never mix old and new files. When a new version takes over, the page reloads once and old caches are removed. Without internet the last loaded version starts completely.

Progress is stored in the `localStorage` of `michaeldobner.github.io` and survives updates.

## Renaming the repository

Renaming the repository changes the address (for example `/spring/`). GitHub Pages does **not** redirect the old address. Installed home screen apps then have to be added again. Progress is kept because it belongs to `michaeldobner.github.io`, not to the path.

## Troubleshooting

| Problem | Solution |
|---|---|
| Page shows 404 | Under Settings > Pages check that `main` and `/ (root)` are selected and that "pages build and deployment" succeeded |
| "Tests" workflow is red | Run `npm test` locally, fix the error, push again |
| iPhone shows an old version or a broken layout | Fully close the app (swipe up) and reopen it. Since version 2.0.1 this cannot happen any more, only the switch from older versions can be affected once. If needed: Settings > Apps > Safari > Advanced > Website Data, delete `michaeldobner.github.io` (this also deletes progress) |
| No sound | Check the silent switch and the sound setting, tap the board once (iOS only allows sound after a touch) |
| Tilt does not react | Turn tilt off and on again in the settings and allow the motion sensor prompt. Only works over HTTPS |
| App icon missing | Check that `icons/apple-touch-icon.png` is reachable, then add to the home screen again |
