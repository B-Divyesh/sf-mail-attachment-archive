# Independent verification 1 — FAIL

**Candidate:** `becaae419ab9c6ecef36abcb44fdb00c05a2f4d5`  
**Live URL:** https://mail-attachment-archive.sociobot.in  
**Verified:** 2026-08-28 (fresh checkout)

## Release decision

**FAIL.** The mandatory claims manifest is absent, and the live first screen
does not offer the mandatory one-click sample-data demo. These are explicit
release blockers in the acceptance contract, independent of the otherwise
clean web smoke tests.

## Mandatory first checks

### Claims

`rg --files --hidden -g '.factory/**'` found `.factory/brief.json`,
`.factory/design.md`, and `.factory/handoff.md`, but **no
`.factory/claims.json`**. Therefore there were no declared claim commands to
run; this is a blocking failure rather than a passing empty suite. There is
also no `.factory/demo.md`.

The landing page and README contain material, unlisted claims, including local
processing/no mail data leaves the device, MBOX parsing, SHA-256
deduplication, encryption, restoration verification, CSV/JSON reports, and
the displayed `99.4% references resolved` figure. The required claim-to-demo
test mapping does not exist.

### Cold first read of the live page

Rendered cold at 1440×900 with no console errors:

* It says it turns an MBOX export into a local, deduplicated attachment archive
  with checksums and a report. This answers **what**.
* It does not name the intended person/situation on the first screen (someone
  leaving or backing up an email account). This does not clearly answer
  **for whom**.
* Its first action is **Download for Linux**. There is no visible **Try it with
  sample data** action, no shipped sample project, no demo banner/reset/start
  for real controls, and no working `/demo` or `?demo=1` sandbox. `/demo`
  returns the ordinary landing HTML.

This independently fails the plain-words and demo-sandbox gate.

## Test and build evidence

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages installed; 0 reported vulnerabilities |
| `npm test` | PASS — 5 tests in 2 Vitest files |
| `npm run check` | PASS |
| `npm run test:e2e` | PASS — 11 passed, 1 mobile-project skip |
| `npm run build` | PASS — site and app Vite builds created `dist/` |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 4 tests |
| `cargo clippy --all-targets -- -D warnings` | PASS |
| Production site JS/CSS | PASS — 25.66 KB JS (8.98 KB gzip), 16.88 KB CSS (4.60 KB gzip); mobile hero 30.07 KB |

The package's exact `npm run build` is a frontend build only. It produced
`dist/site` and `dist/app` successfully. The native checks initially required
the standard Tauri Linux development libraries; after installing the same
class of dependencies specified in the release workflow, the Rust test and
strict clippy run above passed. Native release binaries are built by the
repository's GitHub Actions matrix rather than in the factory worker; the
published Linux AppImage was independently downloaded and checksum-verified.

## Live deployment, privacy, accessibility, and release evidence

* Deployment identity: live `index.html`, `assets/index-DCnKarWD.js`, and
  `latest.json` SHA-256 values exactly match the fresh candidate build:
  `a63289c8…`, `db76b646…`, and `1e47c4b1…`, respectively.
* Desktop and 390×844 mobile: no horizontal overflow; one `<h1>`, one
  `<main>`, `lang=en`, and no missing image `alt` attributes.
* Accessibility: fresh live Axe Playwright scans found **zero serious or
  critical** violations at desktop and 390 px. Keyboard Tab reaches every
  landing interaction; the visible focus is a `rgb(84,214,162)` 3 px outline.
  In a reduced-motion browser context there were no running animations or
  errors.
* Browser errors: none on the cold landing page or restore-license recovery
  flow. The first normal landing flow made only same-origin requests. The
  explicit invalid-license verification additionally contacted only
  `https://api.sociobot.in`, as disclosed; blank-token recovery announces
  “Paste a license token first.”
* Billing API rate limiting: a burst of 80 simultaneous invalid-token GETs to
  `/api/v1/products/mail-attachment-archive/verify` returned **30×200 and
  50×429**. 429 responses contained `Retry-After: 2` (and
  `x-ratelimit-after: 2`). No product sign-in is present, so Entra tenant
  validation is not applicable.
* Release: v0.1.0 exists with macOS ARM/Intel, Windows, Linux AppImage/DEB/RPM
  assets and `SHA256SUMS`. I downloaded the 80,472,568-byte Linux AppImage;
  its SHA-256 was
  `a546c65b75927fa27cfa058becac1c6476ef7ccbf0f617f93bed7cce52d518d2`,
  matching both the deployed manifest and `SHA256SUMS`.

## Defects

### Blocker

1. **Required claims contract is missing.** `.factory/claims.json` is absent,
   so no every-build, demo-entry claim tests can run. Existing marketing and
   product claims are unlisted and unproven in the required sandbox.
2. **No safe one-click demo.** There is no first-screen “Try it with sample
   data,” no bundled realistic sample archive, no isolated `demo:` storage
   namespace, no reset/start-for-real controls, and no demo documentation.
   The candidate cannot be tried or independently tested end to end without
   choosing real local data.

### High

1. **Encrypted archives do not produce the promised corruption report on
   reopen.** `load_manifest` checks an encrypted file only for existence;
   checksum/decryption verification is skipped whenever `manifest.encrypted`
   is true. A damaged encrypted attachment is still shown as verified until a
   user happens to restore that individual file. This conflicts with the brief
   requirement for missing/corrupt-item reporting and evidence that nothing
   was silently omitted.

### Medium

1. **The live site supplies no Content-Security-Policy.** Fresh headers have
   HSTS, Referrer-Policy, and `X-Content-Type-Options`, but no CSP. There is
   no `staticwebapp.config.json` or equivalent header configuration in the
   candidate.
2. **Hashed assets are cached for only 30 seconds.** The main JS and CSS have
   `Cache-Control: public, must-revalidate, max-age=30`, not a long-lived
   immutable cache policy.
3. **No real 404 route.** `/not-a-real-route` returns HTTP 200 and the landing
   page. The required styled 404 response is absent.
4. **First-screen audience is implicit rather than stated.** The copy explains
   MBOX processing but does not name people leaving/backing up an email account
   on the first screen.

## Required remediation before re-verification

1. Add the required demo, sample MBOX/archive, isolated storage namespace,
   `/demo` route, demo banner/reset/start-for-real controls, and
   `.factory/demo.md`.
2. Create `.factory/claims.json`; enumerate every user-facing claim and add
   one tagged observable test per claim, run from the demo entry point.
3. Make encrypted archive integrity verification and its report explicit (for
   example, a passphrase-gated full rescan) before presenting a resolved score.
4. Add CSP, immutable caching for hashed assets, and a styled HTTP 404; then
   repeat the live checks.
