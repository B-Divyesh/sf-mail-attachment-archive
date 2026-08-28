# Mail Attachment Archive v0.1.1 — repair handoff

## Outcome

Repaired every release blocker and severity finding from independent verifier
report `58a687c7f86be297094bfac9e1ed7167dc8b6678` against candidate
`becaae419ab9c6ecef36abcb44fdb00c05a2f4d5`. The product remains a Tauri 2
desktop app with a static Vite landing site.

## Finding-by-finding repair

- **Missing claims contract:** added `.factory/claims.json` with 14 claims.
  Each claim has one tagged regression command and a clean sandbox description.
- **No one-click demo:** added the first-screen **Try it with sample data**
  action, `/demo/`, an embedded leaving-account archive, persistent banner,
  reset/exit controls, desktop **Load sample project**, the exclusive
  `demo:mail-attachment-archive:state` namespace, a shipped MBOX fixture, and
  `.factory/demo.md`.
- **Encrypted reopen falsely looked verified:** encrypted files reopen as
  `unverified`; the UI withholds the resolved score and requires a passphrase
  for a full scan. New archives contain an independently encrypted passphrase
  probe. A wrong passphrase changes no file status. A valid scan authenticates,
  decrypts, hashes, propagates each result to duplicate references, and writes
  `verification-report.json`. Missing or damaged ciphertext is explicit.
- **No CSP / short asset caching:** added Azure Static Web Apps response policy
  with a restrictive CSP, frame denial, permissions policy, and one-year
  immutable caching for Vite's hashed `assets/index-*` output.
- **No real 404:** removed catch-all navigation fallback, routed only `/demo`
  to the SPA, and added a styled `404.html` plus an HTTP 404 response override.
- **Audience unclear:** the first sentence now names people leaving or backing
  up an email account and the change the app makes for them.

Related release-hardening work includes complete metadata, social card and
touch icon, semantic legal pages with skip links, claim-safe landing copy and
`.factory/copy-audit.md`, full demo accessibility coverage, v0.1.1 versioning,
and propagation of plain-file corruption to duplicate references.

## Verification evidence (2026-08-28)

Commands run from `/work/repo`:

```sh
npm ci
npm run check
npm test
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
npm run tauri build -- --bundles deb
```

- Clean install: 66 packages, 0 reported vulnerabilities.
- TypeScript: pass.
- Vitest: 9/9 pass across archive helpers, claims/policy, release metadata, and
  license response policy.
- Rust: 8/8 pass. The encrypted-integrity regression imports an encrypted
  archive, proves reopen is unverified, validates the correct passphrase,
  rejects a wrong one without false corruption, flips a ciphertext byte, and
  confirms both `corrupt` status and report output.
- Clippy with warnings denied: pass.
- Playwright 1.58.2: 29 pass, 1 intentional project skip. Chromium desktop and
  390×844 cover demo isolation/reset/exit, privacy requests, CSV contents,
  search/filter, same-origin release metadata, fallback, license pricing,
  empty/sample app states, responsive overflow, keyboard skip navigation, and
  reduced motion.
- Axe via Playwright: zero serious/critical violations on landing, `/demo/`,
  `/privacy/`, `/terms/`, and the desktop shell in both browser projects.
- Every command in `.factory/claims.json` was also run verbatim and passed.
- Production output: site JS 35.71 KB (11.26 KB gzip), CSS 18.15 KB (4.85 KB
  gzip), mobile hero 30.07 KB, social card 58.29 KB. `dist/site/` contains the
  CSP/cache/404 host configuration.
- Lighthouse 12.8.2 mobile against the production build: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, CLS 0,
  total blocking time 40 ms.
- Visual review: 1440×900 landing and 390×844 demo passed. The banner, first
  task, controls, exception, and ledger remain legible without overflow.
- Linux consumer package: `Mail Attachment Archive_0.1.1_amd64.deb`, 2,865,908
  bytes; Debian metadata reports version 0.1.1/amd64 and contains the desktop
  entry, icon set, and `/usr/bin/mail-attachment-archive`.

## Release and deployment

The final commit, GitHub Actions run, v0.1.1 asset/checksum evidence, Azure
Static Web Apps deployment identifier, live response headers, live 404, and
deployment identity are recorded here after publishing.

## Known gaps / operator action

- Direct IMAP login remains intentionally out of scope; users export MBOX first.
- Encrypted archives created by v0.1.0 lack the new independent passphrase
  probe. They reopen as unverified and receive an explicit instruction to
  re-import before relying on a full scan; they are never shown as resolved.
- Desktop binaries remain unsigned. Signing requires `APPLE_CERTIFICATE` and
  notarization credentials plus `WINDOWS_CERT_PFX` and its password.
- The Sociobot billing product must remain registered for
  `mail-attachment-archive`; no direct payment provider is embedded.
