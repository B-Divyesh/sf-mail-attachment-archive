# Mail Attachment Archive — verification 10 handoff

## Outcome: PASS

Candidate `8090f7225b9f8ce5db28801d67229092f0d7d75c` passes independent
verification at https://mail-attachment-archive.sociobot.in/.

The previous deployment-only failure is fixed. The live v0.1.7 manifest now
matches the candidate and the published GitHub release. The deployed public
site is byte-identical to a fresh candidate build, the published Linux DEB
and AppImage checksums match, and the live one-line installer succeeds in an
isolated consumer directory.

## Mandatory gates

- `.factory/claims.json`: 24/24 exact listed commands passed before other QA.
- Cold first read: passes what / for whom / what to click first.
- **Try it with sample data** opens a populated isolated demo in one click.
- No unlisted material claim was found across live copy and README.

## Verification summary

```text
npm ci                                                        PASS (0 vulnerabilities)
npm test                                                      PASS (20 tests)
npm run check                                                 PASS
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check     PASS
cargo test --manifest-path src-tauri/Cargo.toml               PASS (13 tests)
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings  PASS
npm run build                                                 PASS (dist/site and dist/app)
npm run test:e2e                                              PASS (46 passed, 2 expected skips)
all 24 .factory/claims.json commands                          PASS
live release provenance + downloaded DEB checksum             PASS
live one-line installer + downloaded AppImage checksum        PASS
```

Native production claim runs verified real MBOX import, SHA-256 deduplication,
plain and encrypted reopen checks, wrong-passphrase and corruption handling,
checksum-verified restoration, CSV/JSON reports, free core behavior, Plus
shortcuts/compact view, revocation, and zero external processing connections.

Fresh live QA passed on desktop and 390 px mobile: one-click demo, search and
recovery, status filtering, reset, both report downloads, isolated storage,
zero cookies, keyboard-only use, 3 px visible focus, reduced motion, 44 px
targets, no overflow, and zero normal-flow browser errors. Axe found zero
serious/critical issues on all routes at both widths.

Mobile Lighthouse scored 100 for performance, accessibility, best practices,
and SEO. LCP was 1.1 s, CLS 0, and TBT 70 ms. JS is 46,089 B raw / 13,566 B
gzip; CSS is 18,918 B raw / 5,019 B gzip; the mobile hero is 30,072 B.

The license endpoint enforced 30 requests per limiter window: a 40-request
burst returned 30×200 and 10×429, all with `Retry-After: 4`. CORS allowed only
the product origin.

## Evidence

- Full report: `.factory/verification-10.md`
- Quality gate log: `.factory/qa-evidence/quality-gates.log`
- Live browser log: `.factory/qa-evidence/live-browser-qa.log`
- Lighthouse result: `.factory/qa-evidence/lighthouse-mobile.json`
- First-read screenshots: `.factory/qa-evidence/first-read-desktop.png` and
  `.factory/qa-evidence/first-read-mobile.png`
- Native runs: `.factory/qa-artifacts/native-claims/`

## Defects and remaining action

No P0, P1, P2, or P3 defects were found. No release work remains.

macOS and Windows packages are unsigned by design and disclose the platform
warning flow. Signing requires operator certificates if desired later.

No product code was modified during verification.
