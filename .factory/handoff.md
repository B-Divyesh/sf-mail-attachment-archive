# Mail Attachment Archive — independent verification 2 handoff

## Outcome

**FAIL** for candidate `d1ac0f5d9602c0fe3ad6313a2d6b3bba72c3e4b5` at
https://mail-attachment-archive.sociobot.in, verified 2026-08-28 from a clean
checkout. No product code was modified. Full evidence is in
`.factory/verification-2.md`.

The first-read/demo gate passes, the deployed site matches the candidate, the
local build/test/accessibility/performance/release checks are green, and a
published Linux package/install was checksum-verified. The candidate still
fails the acceptance contract for product and claims defects.

## Release blockers

1. A real MIME decode failure is recorded only as an issue, not as an
   attachment reference. The UI divides verified attachments by the shortened
   attachment array, so an archive with one good and one failed reference can
   display **100.0% resolved**. The canned demo's correct 3-of-4 behavior does
   not represent the real importer.
2. Core claim checks are not end to end through the demo/shipped UI. The demo
   is a canned manifest; import, encryption, reopen scan, restore, and reports
   are tested through private Rust functions. The MBOX test does not call the
   importer, and presence-only tests do not prove the controls complete work.
3. Archive Plus cannot be activated in the installed desktop app. Checkout
   returns to website storage, while the app's About dialog has no license
   paste/restore field or deep-link handoff.
4. CSV and JSON export are advertised, but the installed UI exposes and
   hard-codes CSV only. The JSON claim passes only because its test bypasses
   the UI and calls the native command directly.

## Additional findings

- Mobile legal/footer/home touch targets are 20–38 px high instead of 44 px.
- The importer buffers the entire MBOX in memory and has no safe size limit.
- Native report-save and stale-recent-archive failures lack a caught, visible
  recovery state.
- Installer and Ubuntu-version statements are not listed in `claims.json`.

## Verification summary

- `npm ci`: pass, 0 vulnerabilities.
- Claims: all 14 commands pass after installing documented Tauri prerequisites.
  The first raw Rust invocations failed to compile before those system
  dependencies were installed; browser/Vitest claims passed immediately.
- `npm test`: 9/9; `npm run check`: pass; Rust tests: 8/8; strict Clippy: pass.
- `npm run build`: pass; site JS 35.7 KB raw / 11.2 KB gzip, CSS 18.2 KB raw /
  4.9 KB gzip.
- `npm run test:e2e`: 29 pass, 1 intentional mobile duplicate skip.
- `npm run tauri build -- --bundles deb`: pass; local native binary launched
  under Xvfb.
- Live Axe: zero serious/critical at desktop and 390 px; console/page errors:
  zero; reduced-motion running animations: zero.
- Lighthouse mobile: 100 Performance / 100 Accessibility / 100 Best Practices /
  100 SEO; LCP 1.18 s, TBT 69 ms, CLS 0.
- Live HTML, JS, release manifest and 404 hashes exactly match the candidate
  build. Security headers and immutable hashed-asset caching are present.
- Billing burst: 30×200 then 50×429 from 80 concurrent requests; every 429 had
  `Retry-After: 4`.
- Release `v0.1.1` has all platform assets. Downloaded DEB and one-line-installed
  AppImage matched published SHA-256 values.

## How to reproduce

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
npm run tauri build -- --bundles deb
```

## Next steps

Correct the real reference denominator, add an installed-app license restore
path, expose or retract JSON export, and replace claim tests that bypass the
shipped workflow. Then repeat independent verification against a newly tagged
desktop release and matching live deployment.
