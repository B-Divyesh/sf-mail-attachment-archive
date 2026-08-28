# Mail Attachment Archive v0.1.0 — handoff

## What was built

- A Tauri 2 desktop app with a Rust archive engine and a Vite/TypeScript UI.
- Local MBOX parsing with recursive MIME attachment extraction.
- SHA-256 content addressing and deduplication: repeat references share one
  inert stored file while retaining distinct manifest records.
- Optional Argon2 + XChaCha20-Poly1305 encryption at rest. Passphrases are not
  persisted. Restores authenticate, decrypt, and re-check SHA-256 before write.
- A versioned `manifest.json`, companion JSON verification report, and complete
  CSV report. Malformed messages, failed MIME decodes, missing files, and
  checksum mismatches are surfaced rather than dropped.
- Browse, search, status filters, dedup/storage statistics, empty/loading/error
  states, and safe restore-by-explicit-destination. Attachments never preview or
  execute inside the app.
- A responsive, OS-aware product site, `/privacy/`, `/terms/`, MIT license,
  checksum-verifying `install.sh`/`install.ps1`, and Archive Plus one-time
  license verification through the Sociobot billing API.
- A four-runner release workflow for Apple Silicon macOS, Intel macOS, Windows,
  and Linux. It publishes Tauri installers plus `SHA256SUMS` and `latest.json`.
- Original generated hero art and hand-authored geometric app icon. Prompt and
  provenance are recorded in `.factory/design.md` and the adjacent asset JSON.

## Verification performed

Run from `/work/repo`:

```sh
npm ci
npm run check
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
npm run test:e2e
```

Results on 2026-08-28:

- TypeScript: pass.
- Vitest: 3/3 pass.
- Rust: 4/4 pass, including an actual two-message multipart MBOX import,
  duplicate collapse, encryption round trip, and wrong-password rejection.
- Playwright: 7 pass, 1 intentionally skipped by project (the 390 px-only test
  in the desktop project). Chromium desktop and 390×844 mobile both pass.
- axe: zero serious or critical violations on landing and desktop shell.
- Console smoke test: zero page errors.
- Build output: `dist/site/index.html` and `dist/app/index.html`.
- Static payload: 24.70 KB JS, 16.88 KB CSS, 64.5 KB desktop hero / 30.1 KB
  mobile hero (all uncompressed and well below budget).
- Lighthouse 12.8.2 production preview, desktop: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0,
  total blocking time 20 ms.
- Visual inspection completed at desktop, 390×844, and desktop-app sizes.

## Release and deploy

- Static deploy command: `npm ci && npm run build:site`
- Static deploy root: `dist/site`
- Release v0.1.0: https://github.com/B-Divyesh/sf-mail-attachment-archive/releases/tag/v0.1.0
- GitHub Actions final run `33154594528`: four build jobs and manifest job passed.
- Published assets: Apple Silicon and Intel `.dmg`, Windows `.exe` and `.msi`,
  Linux `.AppImage`, `.deb`, and `.rpm`, plus `SHA256SUMS` and `latest.json`.
- Downloaded the published Windows `.exe` and verified its SHA-256 against the
  final published checksum: `004babee226fa59469033c0b00dddedbda372b259df6ef7d1834a004af51a8c9`.
- The site reads the release `latest.json`, detects macOS/Windows/Linux, and
  exposes a separate Intel Mac link. Install scripts verify SHA-256 before use.

## Known gaps / honest scope

- v0.1 imports standard MBOX exports, including Takeout and common mail-client
  exports. Direct live IMAP login is intentionally deferred; it would require
  audited OS-keychain integration and broader provider interoperability work.
- Encrypted archives can validate a file during explicit restore. A full
  encrypted-archive rescan requires entering the passphrase per restored file;
  there is no stored key or background keychain entry.
- MIME parsing follows standards but exotic proprietary message containers
  should be exported to MBOX first. Every parse/decode failure is reported.

## Needs operator action

- Register the paid product slug `mail-attachment-archive` with the Sociobot
  billing engine and set the production return URL.
- Binaries are deliberately unsigned for v0.1. For signed releases, configure
  `APPLE_CERTIFICATE` (plus its password/Apple notarization credentials) and
  `WINDOWS_CERT_PFX` (plus its password) and extend the workflow signing steps.
- Submit the built Windows installer to winget after signing if store-based
  distribution is desired. Tauri desktop distribution does not use Homebrew or
  Scoop CLI manifests.
