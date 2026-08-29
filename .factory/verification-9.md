# Independent verification 9 — FAIL

**Candidate:** `ba291bde5c1818a50b196b7427e2438d0c2e4114`  
**Live URL:** https://mail-attachment-archive.sociobot.in/  
**Verified:** 2026-08-29 UTC

## Verdict

**FAIL — P0 release provenance mismatch.** The live app shell is built from
this candidate's web source, but the live release manifest points at the old
desktop release. The product's own live provenance verifier fails:

```text
npm run verify:release-provenance -- https://mail-attachment-archive.sociobot.in \
  B-Divyesh/sf-mail-attachment-archive v0.1.7 \
  fed92d3d600350c109919e8c7005670c7828147a linux_deb

Error: Live manifest version is 0.1.6; expected 0.1.7
```

Fresh `GET /latest.json` returned version `0.1.6`, source commit
`ab987ec1720768b05faa39509a1cb7c641849321`. GitHub's current release is
`v0.1.7`, target `fed92d3d600350c109919e8c7005670c7828147a`, with its v0.1.7
platform assets and checksum manifest. This makes live download/provenance
evidence stale, even though the live JS and CSS bytes match a fresh candidate
site build exactly (SHA-256 `c15a…7ab5` and `b8bc…5262`).

## First read and demo

Cold page result: “Prove every attachment made it.” It says it is for people
leaving or backing up an email account and turns an MBOX export into a checked
local archive. The first action is **Try it with sample data**, explicitly
stating that it opens a separate demo and saves nothing. This passes the
plain-words and one-click-demo gates.

## Claim tests

`.factory/claims.json` exists and contains 25 declared claims. Every listed
command was run from the clean candidate checkout after `npm ci`; native test
prerequisites `xvfb` and `strace`, plus the documented Tauri Linux packages,
were installed. The initial `local-only` invocation correctly stopped before
execution because `strace` was absent; the documented prerequisite was then
installed and the exact command passed.

| Claims | Result | Fresh evidence |
|---|---|---|
| demo-sandbox; evidence-reports; sample-evidence; csv-report; archive-search; plus-price; site-privacy | PASS | Exact Playwright claim commands passed on Chromium and 390px mobile (2/2 each). |
| local-only; free-core; plus-shortcuts | PASS | Exact production-Tauri claim commands; regenerated records report `ui.passed: true` and zero `connect`/`sendto` external connections. |
| mbox-import; safe-mbox-limit; sha256-dedup; encrypted-integrity; restore-integrity; attachments-not-opened; plain-reopen-integrity | PASS | Exact filtered Cargo commands all passed. |
| license-daily; paid-license; release-assets; verified-installers; ubuntu-support; release-workflow-assets; release-provenance | PASS | Exact filtered Vitest commands all passed against their fixtures. |

The fixture-based `release-provenance` claim cannot replace the failed live
provenance command above.

## Quality and product exercise

- `npm test`: PASS, 19 tests.
- `npm run check`: PASS.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS, 13 tests.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: PASS.
- `npm run build`: PASS; produced `dist/site` and `dist/app`.
- Bundle budget: site JS 46,089 B raw / 13.68 KB gzip; CSS 18,918 B raw / 5.00 KB gzip; mobile hero 30,072 B.
- Native flows covered MBOX import, >256 MB rejection, deduplication, encrypted scan/wrong passphrase/corruption, fail-closed restore, CSV/JSON reports, Plus shortcut/compact ledger and revocation.

## Live QA

- Desktop and 390px `/demo/`: one H1, `main`, `lang=en`, no console or page errors, zero cookies, and only same-origin requests (HTML, JS, CSS, hero image).
- Keyboard: skip link, demo reset/exit, search, filter, exports, and legal links were reachable in order. Reduced-motion styles reduce durations to `0.000001s`.
- Axe WCAG 2 A/AA scan: zero violations on desktop and mobile.
- Headers: HSTS, `nosniff`, restrictive CSP (`default-src 'self'`; external connection only to the billing API), `frame-ancestors 'none'`, and immutable one-year caching for hashed JS/CSS. Unknown route returns the designed HTTP 404.
- All same-origin navigation links returned 200; `/privacy/`, `/terms/`, installers, robots, and sitemap were available.
- Rate limiting: 40 concurrent invalid-license verification requests from one client produced 30 × 200 then 10 × 429; every 429 had `Retry-After: 4`. CORS allowed only the product origin. No sign-in is present, so Entra validation is not applicable.

## Defects

### P0 — live release manifest/download identity is stale

**Observed:** `/latest.json` identifies v0.1.6 / `ab987ec…`; the current
release is v0.1.7 / `fed92d3…`. The live verifier fails before checksum asset
validation.

**Impact:** the live download control and one-line installers use stale release
metadata, so the deployment cannot prove it serves the release claimed by the
current product handoff.

**Required fix:** stage the v0.1.7 `latest.json` from the release into the
static deployment, deploy it, then rerun the exact live provenance command
above and retain its successful checksum evidence.

No other P0/P1/P2 defects were found. This report modifies no product code.
