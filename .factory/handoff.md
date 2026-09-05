# Mail Attachment Archive — review 4 handoff

## Outcome: PASS

Strict review 4 passed with zero P0–P3 findings and zero untested public
claims. The implementation reviewed is
`8090f7225b9f8ce5db28801d67229092f0d7d75c`; the documentation tip at review
start was `c924a3f46c8d9e4a4cea78c06f0f1922fc931cac`.

The live site at https://mail-attachment-archive.sociobot.in/ matches all 22
deployable files from a fresh candidate build. The live v0.1.7 desktop release
is bound to source `fed92d3d600350c109919e8c7005670c7828147a`; the differences
through the reviewed candidate are release metadata, release-provenance tests,
reports, and evidence rather than desktop app behavior.

## Verification summary

```text
npm ci                                                         PASS (0 vulnerabilities)
all 24 .factory/claims.json commands                           PASS
npm test                                                       PASS (20/20)
npm run check                                                  PASS
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check      PASS
cargo test --manifest-path src-tauri/Cargo.toml                PASS (13/13)
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings  PASS
npm run build                                                  PASS (dist/site and dist/app)
npm run test:e2e                                               PASS (46 passed, 2 expected skips)
live release provenance and downloaded DEB checksum            PASS
live installer, AppImage checksum, and clean-consumer launch   PASS
```

Fresh desktop and phone browsers passed the cold first-read, isolated sample,
reset/exit, CSV/JSON export, invalid search recovery, real-state sentinel,
keyboard, focus, reduced-motion, 200% text, touch-target, route, legal, privacy,
link, and designed-404 checks. Axe found zero serious or critical findings on
all routes at both widths. Normal flows had no console, page, or request errors.

Fresh mobile Lighthouse scored 100 for performance, accessibility, best
practices, and SEO. LCP was 1.06 s, TBT 29.5 ms, and CLS 0. Built site JS is
46,089 bytes raw / 13.68 KB gzip; CSS is 18,918 bytes raw / 5.00 KB gzip.

The live limiter returned 30×200 and 10×429 for a 40-request burst; every 429
had `Retry-After: 4`. The installed AppImage was 80,009,720 bytes, matched
SHA-256 `2ca464c2e17faa6aff0333a54f072a24ca2ebbaacda19500376e91b7bd7bf4c7`,
and started under Xvfb in a clean consumer directory.

## Evidence

- Full report: `.factory/review-4.md`
- Required evidence copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Fresh screenshots: `/work/.evidence/review-4-first-desktop.png`,
  `/work/.evidence/review-4-first-phone.png`,
  `/work/.evidence/review-4-demo-desktop.png`, and
  `/work/.evidence/review-4-demo-phone.png`
- Fresh URL verifier: `/work/.evidence/review-4-verify-url/`
- Fresh Lighthouse JSON: `/work/.evidence/review-4-lighthouse.json`

## Remaining action

No product repair or deployment remains. macOS and Windows signing still
requires operator certificates if desired; the unsigned flow is disclosed.
No product code was changed during this review.
