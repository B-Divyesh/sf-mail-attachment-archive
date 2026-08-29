# Independent verification 8 — FAIL

**Candidate:** `14e4681c4dbe53b1bdac8eda9d584c9d77059d80`
**URL tested:** https://mail-attachment-archive.sociobot.in/
**Verified:** 2026-08-29 UTC from a clean checkout

## Release decision

**FAIL.** The live deployment does not identify the requested candidate. Its
same-origin `/latest.json`, fetched at 07:26 UTC, declares source commit
`ab987ec1720768b05faa39509a1cb7c641849321` and `published_at`
`2026-08-29T06:43:38.492Z`, not the candidate
`14e4681c4dbe53b1bdac8eda9d584c9d77059d80`. The older source is an ancestor
of the candidate, but it is not an exact deployment match. Candidate-vs-live
diff also includes `public/latest.json`; deployment identity is therefore
material, not inferential.

### Blocking defect

| Severity | Finding | Fresh evidence | Required resolution |
| --- | --- | --- | --- |
| P0 / release blocker | Live deployment is stale for the requested candidate. | `GET /latest.json` returns `source_commit: ab987ec…`, whereas `git rev-parse HEAD` is `14e4681…`. Live HTML/assets have `Last-Modified: 06:59:20 GMT`; candidate build was verified locally after that. | Deploy this exact candidate and make the deployed manifest identify `14e4681…`; then rerun live identity QA. |

No product-code failure was found locally. This decision is solely sufficient
to reject the candidate as a deployable release: a verifier cannot claim that
the specified commit is what users receive.

## Required first-read and demo check

**PASS.** A cold live desktop page says “Prove every attachment made it.” It
plainly says it is for people leaving or backing up an email account and turns
an MBOX export into a checked local archive. The first visible primary action
is **Try it with sample data**, with “Opens a separate demo. Nothing is
saved.” One click opened `/demo/`, showing four realistic attachment references,
three resolved, one duplicate, and one reported damaged reference. The demo
banner says sample data is not saved and provides Reset demo and Start for
real.

## Claims: 23/23 PASS after documented native prerequisites

`.factory/claims.json` exists and all 23 listed claim tests were executed from
the declared browser demo or native entry point. On the untouched container,
the first native claim initially could not start because `strace` and Tauri
Linux headers were absent; README documents these prerequisites. After adding
`strace`, `xvfb`, and Tauri GTK/WebKit development prerequisites, all claims
passed with no assertion failure.

- `npm run test:e2e` — 48/48 passed across Chromium desktop and 390 px. This
  includes demo sandbox, sample evidence, CSV/JSON export, search/filter,
  privacy, and price/checkout claims.
- `npm test` — 18/18 passed, including daily license verification, revocation,
  release manifest, installers, Ubuntu support, and release workflow claims.
- Exact Cargo claim patterns all passed: MBOX import/failure retention,
  >256 MB pre-read rejection, SHA-256 deduplication, encrypted scan/corruption,
  checksum-before-restore, inert attachment storage, and plain-reopen
  corruption report.
- Exact packaged-Tauri claims `local-only`, `free-core`, and `plus-shortcuts`
  passed. Native `strace` evidence recorded zero AF_INET/AF_INET6 connections;
  the free flow completed encrypted import, reopen, scan, restore, CSV, and
  JSON export; valid/revoked fixture verdicts enabled then removed Plus
  shortcuts and compact ledger.

## Local quality gates

- `npm ci` — passed, 0 reported vulnerabilities.
- `npm test` — 18 passed.
- `npm run check` — passed.
- `cargo test --manifest-path src-tauri/Cargo.toml` — 13 passed.
- `npm run build` — passed and created `dist/site` and `dist/app`.
  Site JS: 46,089 B raw / 13.68 KB gzip; CSS: 18,918 B raw / 5.00 KB gzip.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` — passed.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
  — passed.

## Live QA evidence (the stale deployment)

- Request capture for cold landing plus entered demo contained only
  `https://mail-attachment-archive.sociobot.in` resources. No browser console
  or page errors occurred; no tracking requests, third-party scripts/fonts,
  pixels, or analytics were observed.
- Headers: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  strict referrer policy, restrictive CSP, and permissions policy were present.
  Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML uses
  `public, must-revalidate, max-age=30`.
- Live axe scans on desktop `/` and 390 px `/demo/` produced zero serious or
  critical violations. First Tab focused the visible green 3 px skip-link
  outline. Under reduced motion, the page exposed no running animations.
- All same-origin navigation links from landing returned HTTP 200. Checkout
  returned HTTP 303 to `checkout.dodopayments.com` as claimed.
- This is a static site/client; it has no product-owned server endpoint or
  sign-in flow. The external Sociobot checkout is not a candidate backend, so
  client allowance/Entra/PWA/health checks are not applicable here.

## Scope and recovery coverage

The shipped native claim harness exercised normal MBOX import, duplicate
references, encryption/reopen, checksum restoration, reports, revocation, and
the oversized-input boundary. Browser claims exercised demo reset/exit,
search, status filtering, and report downloads. Those paths meet the brief's
central requirement that failures remain explicit rather than silently
omitting attachments.

## Handoff

Deploy candidate `14e4681…` before any acceptance decision. Re-fetch
`/latest.json` and require an exact `source_commit` match, then repeat a cold
request/console/axe smoke test. No product-code changes were made by this
verification.
