# Independent verification 4 — FAIL

**Candidate:** `be9cc3c01c1e5c4e1b0d8e09d9f4607d9a49ea17`
**Live URL:** https://mail-attachment-archive.sociobot.in/
**Verified:** 2026-08-28 UTC from the clean `main` checkout

## Release decision

**FAIL.** The product's core archive work, live checkout, release artifacts,
static deployment, performance budget, declared claims, and automated
accessibility scans pass. The candidate still misses the attached
non-negotiable accessibility and demo-sandbox contract: several interactive
targets are smaller than 44 by 44 CSS pixels, both license dialogs lose focus
to the page body during keyboard traversal, and the demo's home link leaves its
demo storage key behind. `cargo fmt --check` also fails. No product source was
changed during this verification.

## First-read gate

**PASS.** A cold 1440 by 900 visit answered all three required questions in
the first viewport:

- **What:** “Prove every attachment made it” and “turns an MBOX export into a
  checked local archive.”
- **For whom:** “people leaving or backing up an email account.”
- **First click:** **Try it with sample data**, immediately followed by
  “Opens a separate demo. Nothing is saved.”

The action opened `/demo/` in one click with four realistic attachment
references, one duplicate, one visible decode failure, Reset demo, and Start
for real. The cold response was HTTP 200 with no page or console error.
Screenshot: `.factory/qa-artifacts/live-first-read-desktop.png`.

## Claims gate

`.factory/claims.json` exists and contains 17 unique claims. Every listed
command was run from this checkout after `npm ci` and the documented Tauri 2
Linux prerequisites. All final claim runs passed. The very first command was
attempted before dependency installation, as requested, and could not start
because `@playwright/test` was not yet installed; no test assertion ran. After
the lockfile install, the same command passed 2/2.

| Claim | Exact declared command result |
| --- | --- |
| `demo-sandbox` | PASS — 2/2 browser projects |
| `local-only` | PASS — 2/2 browser projects |
| `mbox-import` | PASS — 1 Rust test |
| `safe-mbox-limit` | PASS — 1 Rust test |
| `sha256-dedup` | PASS — 1 Rust test |
| `encrypted-integrity` | PASS — 1 Rust test |
| `restore-integrity` | PASS — 1 Rust test |
| `evidence-reports` | PASS — 2/2 browser projects |
| `sample-evidence` | PASS — 2/2 browser projects |
| `csv-report` | PASS — 2/2 browser projects |
| `archive-search` | PASS — 2/2 browser projects |
| `plus-price` | PASS — 2/2 browser projects; live gateway returned 303 |
| `free-core` | PASS — 2/2 browser projects |
| `license-daily` | PASS — 1 Vitest test |
| `release-assets` | PASS — 1 Vitest test |
| `verified-installers` | PASS — 1 Vitest test |
| `ubuntu-support` | PASS — 1 Vitest test |

Landing and README claims were cross-checked against this inventory. No new
unlisted functional claim was found. The manual demo exit defect below is a
path omitted by the otherwise passing `demo-sandbox` test.

## Build and test evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages, 0 reported vulnerabilities |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 12/12 tests |
| `npm run check` | PASS — strict TypeScript check |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 9/9 tests |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | PASS |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | **FAIL** — committed `src-tauri/src/lib.rs` differs from rustfmt output |
| `npm run build` | PASS — produced `dist/site` and `dist/app` |
| `npm run test:e2e` | PASS — 34 passed, 2 intentional desktop-only mobile skips |
| `npm run tauri build -- --bundles deb` | PASS — optimized binary and Debian bundle built in 10m11s |
| Candidate binary smoke | PASS — remained running for the 10-second Xvfb interval; only headless EGL warnings |

The candidate Debian bundle is 2,867,146 bytes, package
`mail-attachment-archive` version 0.1.2 for amd64. The release binary is
6,696,008 bytes.

## End-to-end and recovery coverage

- Normal archive path: imported a mixed MBOX, retained the valid and failed
  references, deduplicated identical bytes by SHA-256, reopened the manifest,
  searched it, exported CSV and JSON, and restored checksum-verified bytes.
- Boundary path: a sparse 256 MB plus one byte MBOX was rejected before the
  file was read into memory, with split-and-retry guidance.
- Corruption path: wrong encryption passwords fail; damaged encrypted files
  are reported corrupt; damaged plain stored bytes are refused before restore.
- Browser recovery: unmatched search shows a clear empty state, filters can be
  reset, Reset demo restores all four rows, empty license input gives an
  announced instruction, and bad release metadata retains a calm release-page
  fallback.
- Native UI: the published AppImage and freshly built candidate binary both
  launched under Xvfb. The container could not drive native OS file pickers;
  the real Rust command tests cover the file boundary while Playwright covers
  the UI above it.

## Live deployment, privacy, and browser policy

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 791 ms load, title,
  `lang=en`, one H1, main landmark, no missing alts, no unlabeled buttons, and
  no browser errors. Evidence is under `.factory/qa-artifacts/verify-url/`.
- Landing, demo, privacy, and terms returned 200. An unknown path returned the
  designed 404. All crawled HTTP links resolved or intentionally redirected.
- Landing/demo use no third-party scripts, fonts, pixels, or analytics. The
  complete live demo flow made only same-origin requests and left only the
  documented `demo:mail-attachment-archive:state` key.
- HSTS, restrictive CSP, `nosniff`, frame denial, Referrer-Policy, and
  Permissions-Policy are present. Hashed JS/CSS receive one-year immutable
  caching; HTML receives a 30-second revalidation policy.
- No embedded key or private-key pattern was found. No sign-in exists, so the
  Entra authority check is not applicable. This is not a PWA and registers no
  service worker. It has no product backend or health endpoint.

## Accessibility and responsive evidence

- Independent Axe scans at 1440 px and 390 px found zero serious or critical
  violations on landing, demo, privacy, terms, and the 404 page.
- All audited routes had one H1, one main landmark, `lang=en`, alt text, and no
  horizontal overflow. Desktop and mobile screenshots are in
  `.factory/qa-artifacts/`.
- The first Tab reaches the skip link with a 3 px mint focus outline; Enter
  moves focus to `main`. Reduced-motion mode left zero running animations.
- Color contrast passed Axe. The single dark treatment is explicitly justified
  in `.factory/design.md`.
- Manual bounding-box and dialog traversal tests found the release-blocking
  baseline defects listed below.

## Performance

- Built landing JS: 37,723 bytes raw / 11.64 KB gzip, under 200 KB.
- Built CSS: 18,232 bytes raw / 4.86 KB gzip, under 50 KB.
- Fonts: 0 bytes. Mobile hero: 30,072 bytes, under 300 KB.
- Fresh live mobile Lighthouse: Performance 94, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.4 s, LCP 1.6 s, TBT 270 ms, CLS 0, total 48
  KiB. Lighthouse JSON is `.factory/qa-artifacts/lighthouse-mobile.json`.

## Deployment identity and release evidence

Local production output and the live deployment match byte-for-byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `d33b96377c7e8202ac5dedaab428006254b433d68531bd783f54adb2e02d26ab` |
| `assets/index-B6ygWpAs.js` | `c8b4f293f0b8b937d7813f50c0243611c098ddef4b664fb99fa1f681f01ce208` |
| `assets/index-CsMYcdIR.css` | `3affc5825607fb2fc289645c709b949d430d12f49c555a9c2e91febd60d78f25` |
| `latest.json` | `67ae19a823c45df33f16e7e0a5bc0db1395c23800be6941881e81b4aef484a93` |
| `404.html` | `088cd22c942d37637484cf7ec78c2a186f360705f7e33a1410dda378636e39df` |

The latest GitHub release is v0.1.2 and has macOS ARM/Intel DMGs, Windows
EXE/MSI, Linux AppImage/DEB/RPM, application archives, `SHA256SUMS`, and
`latest.json`. Candidate changes after tag v0.1.2 do not alter product source.
The downloaded 2,867,586-byte DEB matched its published checksum
`d8c9c437e31f0d9b428c88664e05f78bbb41b27eb9e206a25acd375eeb77bbc9`.
The live one-line installer placed an executable 80,550,392-byte AppImage in an
isolated directory; its checksum matched
`a768ea8cd64821ffb9baae91fa83d0939143ce1bffd22c438ad2f4bd66bb396a`.

The live checkout returned HTTP 303 to
`https://checkout.dodopayments.com/session/cks_…`. A concurrent 50-request
burst to the license verification endpoint returned 30 HTTP 200 responses and
20 HTTP 429 responses. Every 429 had `Retry-After: 3` or `4`; the observed
burst allowance was 30 requests. CORS returned only the product origin.

## Defects by severity

### Medium

1. **Interactive targets miss the mandated 44 by 44 px baseline.** At 390 px,
   the demo home target is 38 by 44 px, the landing pricing Terms link is about
   35 by 14 px, legal email links are 20 px high, and 404 actions are 20 px
   high. The existing regression checks only header/footer link height and
   therefore miss width and inline targets.
2. **Modal keyboard focus disappears once per cycle.** In both the website
   restore-license dialog and desktop About/license dialog, focus proceeds
   through the controls and then lands on `<body>` before returning to the
   close button. The visible focus indicator disappears while a modal remains
   open, violating the attached dialog focus-management requirement. Escape
   does close the dialog and restore trigger focus.
3. **One normal demo exit does not discard the demo namespace.** Start for
   real removes the key, but selecting the demo header's home link leaves
   `demo:mail-attachment-archive:state` in localStorage after returning home.
   The retained value is only a start timestamp, not mail data, but it still
   contradicts the required “leaving demo mode discards demo data” behavior.

### Low

1. **Rust formatting gate fails.** `cargo fmt --check` reports changes in
   `src-tauri/src/lib.rs`.
2. **Route metadata is incomplete.** `/demo/` retains the home canonical and
   home Open Graph title. Privacy and terms omit Open Graph/Twitter metadata;
   the 404 page omits description/canonical/social metadata.
3. **The standard site skeleton is incomplete on secondary routes.** The 404
   page has no skip link, and landing/legal footers do not consistently include
   the required Param Factory attribution plus version/build identity.

### Critical / high

No critical or high-severity defect was found in this pass.

## Required remediation

1. Give every interactive target a 44 by 44 px hit area, including icon-only,
   inline legal, pricing, and 404 links; extend regression coverage to width and
   all routes.
2. Explicitly wrap focus inside each open dialog without a body-focus gap and
   test forward and reverse Tab cycles.
3. Remove the demo key on every exit path, including the header home link, and
   cover that path in `@claim:demo-sandbox`.
4. Apply rustfmt and add `cargo fmt --check` to CI.
5. Complete per-route metadata, skip-link, and footer/build identity coverage.
