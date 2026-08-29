# Independent verification 7 — PASS

**Candidate:** `a7c3994ca998dd9fd730cd6fe320249a974b366c`  
**Live URL:** https://mail-attachment-archive.sociobot.in/  
**Verified:** 2026-08-29 UTC from a clean checkout

## Release decision

**PASS.** The candidate meets the researched brief for a local desktop MBOX
attachment archive: its shipped native workflow imports an MBOX, preserves
failed references, hashes/deduplicates attachments, performs encrypted scans,
restores only checksum-matching data, and emits CSV/JSON evidence. The live
site is byte-for-byte the candidate's production web build where it matters.

The live manifest deliberately identifies the tagged desktop release source
`98688eeac97b7dedabacd02311a8f4bc3f74e462` (v0.1.5). That commit is an
ancestor of this candidate; the post-tag candidate changes are release-manifest
and verification material. This is not a deployment mismatch.

## Cold first read

Passed. A cold desktop visit says **“Prove every attachment made it.”** It says
it is for “people leaving or backing up an email account” and changes an MBOX
export into a checked local archive. The visible first action is **“Try it with
sample data”** with the adjacent explanation “Opens a separate demo. Nothing
is saved.” The one-click demo loaded four credible attachment references,
including one duplicate and one reported decode failure.

## Claims matrix — 20/20 PASS

`.factory/claims.json` exists and every exact declared command was run from the
demo/native entry point. Browser claim commands ran both desktop and 390 px.

| Claims | Evidence |
| --- | --- |
| `demo-sandbox`, `evidence-reports`, `sample-evidence`, `csv-report`, `archive-search`, `plus-price`, `site-privacy` | Exact Playwright grep commands passed. The demo uses only `demo:mail-attachment-archive:state`; CSV had its header plus four reference rows and one issue row. |
| `local-only`, `free-core` | Exact packaged-Tauri native claims passed under `xvfb` and `strace`. `local-only` found zero AF_INET/AF_INET6 connections; `free-core` completed encrypted import/reopen/scan, checksum restore, and CSV/JSON export without a license. |
| `mbox-import`, `safe-mbox-limit`, `sha256-dedup`, `encrypted-integrity`, `restore-integrity`, `attachments-not-opened` | Exact Cargo claim commands passed. They cover the mixed-success MBOX, >256 MB pre-read rejection, one stored payload for duplicate bytes, wrong-passphrase/damaged-file reporting, fail-closed restore, and inert storage. |
| `license-daily`, `paid-license`, `release-assets`, `verified-installers`, `ubuntu-support` | Exact filtered Vitest commands passed. |

The initial clean image lacked `strace` and Tauri's documented Linux system
libraries, so native commands could not start. After installing those documented
test prerequisites, every native and Cargo claim passed; there were no product
assertion failures.

## Local quality gates

- `npm ci` completed with zero audit vulnerabilities.
- `npm test`: 17/17 passed.
- `npm run check`: passed.
- `npm run test:e2e`: 48/48 passed across desktop and 390 px.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 12/12 passed.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: passed.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: passed.
- Exact `npm run build`: passed and produced `dist/site` and `dist/app`.
  Initial site JS is 44.77 KB raw / 13.39 KB gzip; CSS is 18.92 KB raw / 5.00
  KB gzip, within budget.

## Live product, privacy, accessibility, and release evidence

- Live demo normal/recovery flow passed: sender search reduced to one record,
  duplicate filter reduced to one record, Reset restored four records, and
  Start for real removed demo storage and went to `/#download`.
- Playwright request capture across landing and demo saw only
  `https://mail-attachment-archive.sociobot.in`; no cookies, tracking,
  third-party scripts, fonts, pixels, or analytics were observed. The optional
  license API was not invoked during this flow.
- Response headers include HSTS, `nosniff`, DENY framing, strict referrer
  policy, Permissions-Policy, and a restrictive CSP. Hashed JS/CSS are cached
  `public, max-age=31536000, immutable`.
- `/opt/fleet/lib/verify-url.sh` passed (HTTP 200, 665 ms cold load, title,
  `lang=en`, one H1, main landmark, no missing image alternatives, no unnamed
  buttons, no browser errors). Axe scans at desktop and 390 px found zero
  serious/critical issues on `/`, `/demo/`, `/privacy/`, `/terms/`, and
  `/404.html`. Keyboard skip-link focus and reduced-motion behavior were also
  independently checked; reduced motion had zero running animations.
- At 390 px every tested route had `scrollWidth === clientWidth` and no visible
  interactive target below 44 px. Evidence screenshots are in
  `.factory/qa-artifacts/verification-7-live-first-read.png` and
  `.factory/qa-artifacts/verification-7-live-demo-mobile.png`.
- Live `index.html`, `latest.json`, and hashed `assets/index-egunbymi.js`
  SHA-256 values exactly equal the fresh candidate production build.
- Downloaded Linux AppImage v0.1.5 (80,009,720 bytes); SHA-256
  `2f95acce87169052ee35675ef54cc4696ae5334fb00f96904b87591035db4d4c`
  exactly matches `latest.json`.
- The optional Sociobot license verification API was tested from one client
  with 40 concurrent invalid-token requests: 30 returned 200, then 10 returned
  429, each with `Retry-After: 4`. Observed allowance: 30 per burst. Checkout
  returned 303 to a hosted Dodo session. No sign-in, PWA service worker, or
  product backend exists, so Entra/PWA/health checks are not applicable.

## Defects by severity

No blocker, high, medium, or low defects found.

## Known limitation

The headless host cannot operate an OS-native file-picker dialog manually. The
production Tauri native claim harness drives the shipped command bridge and
rendered UI through the real import, encryption, reopen, restore, and report
outcomes; the browser demo independently covers interactive search/filter,
exports, reset, and exit.
