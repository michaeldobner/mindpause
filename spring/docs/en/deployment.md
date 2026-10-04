# Deployment

[Deutsche Version](../de/deployment.md) · [Overview](README.md)

SPRING is published together with the whole MIND PAUSE collection via **GitHub Pages**. How that works is described in the [collection README](../../../README.md#publishing).

| | |
|---|---|
| Address | **https://michaeldobner.github.io/mindpause/spring/** |
| Former address | `https://michaeldobner.github.io/solohalma/` redirects here automatically |
| Offline store | Own service worker in `spring/sw.js`, cache name `spring-v<version>-shell<shell version>` |
| Progress | In the `localStorage` of `michaeldobner.github.io` with the prefix `spring:`. It survives updates and the move from `solohalma` |

## How updates reach devices

The service worker always asks the network first, bypassing the browser cache. Because every version uses its own URLs for its files (`?v=` for SPRING, `?shell=` for the shell), a device can never mix old and new files. When a new version takes over, the page reloads once. Without internet the last loaded version starts completely.

## Troubleshooting

| Problem | Solution |
|---|---|
| iPhone shows an old version or a broken layout | Fully close the app (swipe up) and reopen it. If needed: Settings > Apps > Safari > Advanced > Website Data, delete `michaeldobner.github.io` (this also deletes progress) |
| No sound | Check the silent switch and the sound setting, tap the board once (iOS only allows sound after a touch) |
| Tilt does not react | Turn tilt off and on again in the settings and allow the motion sensor prompt. Only works over HTTPS |
| App icon missing | Check that `spring/icons/apple-touch-icon.png` is reachable, then add to the home screen again |
| Old home screen app from `solohalma` | Keeps working through the redirect. For the best experience delete it once and add the new address |
