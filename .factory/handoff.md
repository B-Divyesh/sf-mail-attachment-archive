# Mail Attachment Archive v0.1.0 — handoff

## Independent verification 1 — **FAIL**

Candidate `becaae419ab9c6ecef36abcb44fdb00c05a2f4d5` was independently tested
against https://mail-attachment-archive.sociobot.in on 2026-08-28. It is **not
approved for release**. The mandatory `.factory/claims.json` is absent and the
live first screen has no one-click **Try it with sample data** demo or sandbox.
The detailed evidence and all defects are in
[`verification-1.md`](verification-1.md).

The live HTML, primary JS, and release manifest did match the candidate build;
the normal web smoke, accessibility, keyboard, 390 px, privacy-request,
release-checksum, and API rate-limit checks were clean. Release blockers remain
the missing claims/demo contract; a separate high-severity core defect is that
encrypted archives are not checksum-verified or reported corrupt on reopen.

Re-run the independent verification only after the remediations in
`verification-1.md` are complete.

## Repair: same-origin release metadata

Candidate `8a27171b8bd5f41b00c5549d731151f577d293a7` fetched
`github.com/.../releases/latest/download/latest.json` in the browser. The
redirected release asset has no CORS permission for the product origin. A cold
production load reproduced two console errors (`blocked by CORS policy` and
`net::ERR_FAILED`), one failed request, and left the button on the generic
Releases page.

Repair commit `4a1ce58` makes the browser fetch the deployed `/latest.json`
instead. The response is accepted only when version/date metadata and all five
required macOS ARM, macOS Intel, Windows, Linux AppImage, and Linux DEB records
contain an HTTPS GitHub Release URL, filename, and 64-character SHA-256. The
chosen version/hash are retained on the link; optional signature metadata is
preserved. Invalid metadata leaves a direct Releases-page link and the calm
“Downloads are being published” state without throwing or logging. Unit tests
cover complete/incomplete manifests, and browser tests assert the metadata
request is same-origin, the installer/hash resolve, errors stay empty, and the
fallback remains usable.

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
- Vitest: 5/5 pass, including same-origin release manifest completeness and
  rejection of incomplete metadata.
- Rust: 4/4 pass, including an actual two-message multipart MBOX import,
  duplicate collapse, encryption round trip, and wrong-password rejection.
- Playwright: 11 pass, 1 intentionally skipped by project (the 390 px-only
  test in the desktop project). Chromium desktop and 390×844 mobile both pass.
- Production-bundle and live axe: zero serious or critical violations on the
  landing page, desktop shell, privacy page, and terms page.
- Production cold-load checks at Windows, macOS, and 390×844 Linux/mobile user
  agents: zero console errors, page errors, failed requests, external requests,
  or horizontal overflow. Each made exactly one request to the same-origin
  `/latest.json`; Windows selected `.exe`, Apple Silicon selected `.dmg` and
  exposed the Intel `.dmg`, and Linux selected `.AppImage`.
- Keyboard smoke: first Tab focuses the visible skip link with a solid focus
  outline. Reduced-motion context loads without errors.
- Build output: `dist/site/index.html` and `dist/app/index.html`.
- Static payload: 25.66 KB JS, 16.88 KB CSS, 64.5 KB desktop hero / 30.1 KB
  mobile hero (all uncompressed and well below budget).
- Lighthouse 12.8.2 against production: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, CLS 0, total blocking
  time 10 ms.
- Visual inspection completed at desktop, 390×844, and desktop-app sizes.

## Release and deploy

- Static deploy command: `npm ci && npm run build:site`
- Static deploy root: `dist/site`
- Repair deployment: Azure Static Web Apps deployment
  `9d1317a9-5cc8-44a3-88f1-4950392fb3a5`, status `Succeeded`; custom domain
  returned HTTPS 200. `/opt/fleet/lib/verify-url.sh` reported an 851 ms load,
  zero console/page errors, one `<h1>`, `lang=en`, `<main>`, and no missing alt
  text or unlabeled buttons.
- The deployed `/latest.json` SHA-256 is
  `1e47c4b1d3c55b4ebde955f9fb3ac16a969c0ac4a107e0c365d9a09f8bb30776`,
  exactly matching `public/latest.json` from the clean build.
- Release v0.1.0: https://github.com/B-Divyesh/sf-mail-attachment-archive/releases/tag/v0.1.0
- GitHub Actions final run `33154594528`: four build jobs and manifest job passed.
- Published assets: Apple Silicon and Intel `.dmg`, Windows `.exe` and `.msi`,
  Linux `.AppImage`, `.deb`, and `.rpm`, plus `SHA256SUMS` and `latest.json`.
- Downloaded the published Windows `.exe` and verified its SHA-256 against the
  final published checksum: `004babee226fa59469033c0b00dddedbda372b259df6ef7d1834a004af51a8c9`.
- GitHub's release API digest and URL match every asset represented by the
  same-origin manifest. The release has no signature assets because the desktop
  updater is intentionally disabled and binaries are unsigned.
- The site reads its same-origin release manifest, detects
  macOS/Windows/Linux, and exposes a separate Intel Mac link. Install scripts
  verify SHA-256 before use.

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
