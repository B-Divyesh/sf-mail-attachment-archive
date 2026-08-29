# Mail Attachment Archive — review 2 handoff

## Outcome

Completed the adversarial first-read review without changing product code.
The verdict is **FAIL**. The review is in `.factory/review-2.md`.

## Verification performed

- Cold live checks at desktop and 390px; no console/page errors.
- Live `?demo=1` sandbox, reset, exit, storage namespace, and request-log
  checks.
- All 18 declared claim commands passed after `npm ci` and documented Tauri
  Linux prerequisites were installed.
- `npm test` (16 passed), `npm run check`, `npm run build`, and the full
  Playwright suite (48 tests) passed.
- Live Axe scans at 390px found zero serious/critical issues on landing, demo,
  privacy, terms, and 404.

## Remaining work

The review reopens F-1-2 and F-1-3 as blockers: the green `local-only` and
`free-core` tests call backend Rust functions directly instead of proving the
public claims through a packaged desktop flow. F-1-29 also remains live as an
untestable funding-benefit claim. The review records four further unlisted
claims and three plain-language copy findings.

## How to reproduce

```sh
npm ci
npm test
npm run check
npm run build
npm run test:e2e
```

Run each exact command in `.factory/claims.json`; native commands require the
Tauri Linux prerequisites linked from README.
