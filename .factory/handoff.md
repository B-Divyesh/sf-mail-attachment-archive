# Mail Attachment Archive — repair handoff

## Outcome

Repaired the release blockers recorded in independent verification report
`8374ccf0c6c44197331b63dd0e822440954607c3` against candidate
`d1ac0f5d9602c0fe3ad6313a2d6b3bba72c3e4b5`. The product remains a Tauri 2
desktop application with its static Vite landing site and Azure Static Web Apps
deployment class.

## Repairs

- Failed MIME attachment decodes now produce a first-class `decode_failed`
  attachment record as well as an issue. The manifest and UI denominator now
  include every attachment reference, so one verified plus one decode failure
  is correctly 50.0% resolved, never 100.0%.
- Reopening and encrypted verification preserve decode-failed records. Restore
  rejects such a record with a clear no-file-to-restore error.
- Added a 256 MB MBOX safety boundary before file read. The app explains that a
  larger export must be split, instead of buffering an unbounded Takeout export.
- Archive Plus can now be restored in the installed app: the About dialog has a
  labeled paste-and-verify field, daily verification, an explicit checkout
  return URL, and receipt-token handoff copy.
- The installed archive toolbar now exposes separate **Export CSV** and
  **Export JSON** actions; save/invoke failures are caught in an `aria-live`
  status. Stale recent archives render the recovery state rather than leaving a
  rejected native promise.
- The demo has visible CSV and JSON downloads. Its claim test parses the JSON
  output through the shipped control rather than calling the report command.
- Header, home, and legal/footer links have 44 px targets. The mobile browser
  suite measures every header/footer link at `/demo/`, `/privacy/`, and
  `/terms/`.
- Added claims for installer checksum behavior and the Ubuntu 22.04 build
  baseline. The claims gate now requires exactly one regression tag per claim.

## Regression evidence

- `claim_mbox_import_keeps_a_decode_failed_reference_in_the_real_manifest`
  sends a mixed valid/broken MBOX through the real import command, reopens the
  manifest, and proves two retained references: one verified and one failure.
- The visible score has a Vitest regression: one `verified` plus one
  `decode_failed` is exactly `{ resolved: 1, percent: "50.0" }`.
- Playwright `@claim:evidence-reports` downloads **Export JSON** from `/demo/`,
  parses all four references, and asserts the decode-failed reference and issue.
- The desktop-shell test verifies the installed-app license field, verification
  action, and checkout return URL; the free-core test confirms both report
  formats remain ungated.

## Verification

Run after the documented Tauri Linux prerequisites:

```sh
apt-get update
apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
npm run tauri build -- --bundles deb
```

Observed before final commit/deploy:

- `npm ci`: 66 packages, 0 vulnerabilities.
- `npm test`: 12/12 passed; TypeScript check passed.
- Rust tests: 9/9 passed; strict Clippy passed.
- `npm run build`: passed. Site JavaScript: 37,723 B raw / 11,640 B gzip; CSS:
  18,232 B raw / 4,860 B gzip.
- `npm run test:e2e`: 34 passed, 2 intentional mobile-only skips. It covers
  desktop and 390×844, keyboard skip navigation, reduced motion, demo
  isolation, local-only requests, report downloads, license restore shell, and
  Axe serious/critical checks.
- Every distinct command in `.factory/claims.json` was then invoked verbatim;
  all declared claim regressions passed.
- Local `verify-url.sh`: HTTP 200, title/lang, one H1, main, no missing image
  alt text, no unlabeled buttons, and no console errors. The standalone Axe CLI
  could not locate a system Chrome binary; the project’s Playwright Axe scans
  passed at desktop and mobile instead.

## Deployment and operator action

- Static Web App target: `sf-mail-attachment-archive` in `sociobot`, custom
  domain `mail-attachment-archive.sociobot.in`.
- The GitHub release workflow remains responsible for macOS, Windows, AppImage,
  and DEB artifacts. Binaries remain unsigned. macOS signing/notarization needs
  `APPLE_CERTIFICATE` and notarization credentials; Windows signing needs
  `WINDOWS_CERT_PFX` and its password.
- No telemetry, updater, or mail-data network path was introduced.

## Release evidence

- Repair commit: `ce5fc0a` (`fix: repair archive verification and desktop
  exports`), followed by release commits `bc780cc` and `8c2bc38`, all pushed to
  `origin/main`.
- Published GitHub release: `v0.1.2`. All macOS (Apple Silicon and Intel),
  Windows (EXE and MSI), and Ubuntu (AppImage, DEB, and RPM) builds succeeded.
  The workflow's `manifest` job succeeded and attached `SHA256SUMS` and
  `latest.json`. The site manifest now points only at those `v0.1.2` assets.
- Local package smoke package: `Mail Attachment Archive_0.1.1_amd64.deb`,
  2,867,164 bytes. `dpkg-deb -I` reports `Version: 0.1.1`, `Architecture:
  amd64`, and the expected WebKit/GTK dependencies. The CI release package is
  the repaired `v0.1.2` build.
- Static deployment: Azure Static Web Apps CLI 2.0.10 deployed `dist/site` to
  production at `https://black-moss-012bcc910.7.azurestaticapps.net` (custom
  domain `https://mail-attachment-archive.sociobot.in`).
- Live verification: custom-domain HTTP 200; browser load 2,093 ms; no console
  errors; title/lang, exactly one H1, main landmark, image alt text, and button
  labels all passed. Local/live `index.html` SHA-256 matched exactly:
  `1a45456a8842798379f5b782c9a57b3f15d94d9167966c035de36053bb418bb1`.
  Unknown routes return HTTP 404. Live CSP, HSTS, `nosniff`, frame denial,
  Referrer-Policy, Permissions-Policy, and immutable hashed-asset caching are
  present.
