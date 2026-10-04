# Deployment

[Deutsche Version](../de/deployment.md) · [Overview](README.md)

QUEEN is published together with the whole MIND PAUSE collection through **GitHub Pages**. How this works is described in the [collection README](../../../README.md#publishing).

| | |
|---|---|
| Address | **https://michaeldobner.github.io/mindpause/queen/** |
| Offline storage | Own service worker in `queen/sw.js`, cache name `queen-v<version>-shell<shell version>` |
| Progress | In the `localStorage` of `michaeldobner.github.io` with the prefix `queen:`. It survives updates |
| Computer opponent | Runs entirely on the device, also offline |

## How updates reach devices

The service worker always asks the network first, bypassing the browser cache. Because every version uses its own addresses for its files (`?v=` for QUEEN, `?shell=` for the shell), a device can never mix old and new files. When a new version takes over, the page reloads once. Without internet the last loaded version starts completely.

## Troubleshooting

| Problem | Solution |
|---|---|
| iPhone shows an old version or a broken layout | Close the app completely (swipe up) and open it again. If needed: Settings > Apps > Safari > Advanced > Website Data, delete the entry `michaeldobner.github.io` (this also deletes the progress of every game) |
| Computer does not move | Tap Undo or New. If it persists, reopen the app. The Web Worker needs an up-to-date browser |
| No sound | Check the silent switch, check sound in the settings, tap the board once (iOS only allows sound after a touch) |
| Tilt does not react | Turn tilt off and on again in the settings and allow the motion sensor request. Works over HTTPS only |
| App icon missing | Check that `queen/icons/apple-touch-icon.png` is reachable, then add it to the Home Screen again |
