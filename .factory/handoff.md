# Mail Attachment Archive — polish 1 handoff

## Outcome

Repaired every finding in adversarial review 1. The landing now has phone-safe
downloads, a direct isolated `?demo=1` route, four original captioned desktop
workflow frames, consistent route navigation, route focus announcements,
complete static metadata, and rewritten plain-language copy. The desktop app
has an outcome-level free-core test and no opener capability.

## Verification

Fresh-dependency setup used `npm ci` and the README Tauri Linux prerequisites.

- `npm test`: 16 passing.
- `npm run check`: passing.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: passing.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 12 passing.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: passing.
- `npm run build`: passing; produces `dist/site` and `dist/app`.
- `npm run test:e2e`: 48 passing across desktop Chromium and 390 px mobile.
- Every one of the 18 exact commands in `.factory/claims.json` passed from the
  clean dependency install. The browser claims ran in desktop and mobile
  contexts; native claims used temporary MBOX/archive fixtures.

The production site bundle is 41.94 KB raw / 12.74 KB gzip. CSS is 18.92 KB
raw / 5.00 KB gzip. No external fonts or scripts were added.

## Key verification coverage

- Android and iPhone user agents receive no AppImage, DEB, DMG, or EXE link.
- `?demo=1` renders the persistent demo banner, four realistic sample rows,
  Reset demo, and Start for real. It uses only the `demo:` storage namespace.
- The native free-core fixture completes encrypted import, reopen, full scan,
  restore, CSV export, and JSON export without a license.
- The packaged capability list has no `opener:` permission; attachment import
  writes archive files without opening them.
- Browser route, Back, dialog, mobile target, static metadata, and Axe tests
  are covered by Playwright.

## Deployment

The static deployment is triggered by the factory from the pushed `main`
commit. After push, cold-check `/?demo=1`, `/privacy/`, `/terms/`, and a 404
before publishing the release handoff.

## Known gaps

None in the repair scope. Desktop release assets remain versioned through the
existing tag workflow; this repair does not alter the released binary version.
