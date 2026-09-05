# Review 4 — Archive MBOX attachments and record every failure

Reviewed 5 September 2026 against
https://mail-attachment-archive.sociobot.in/ from a clean detached checkout.

## Verdict: PASS

**PASS.** There are zero P0, P1, P2, or P3 findings and zero untested public
claims. All 24 declared claim commands passed. The live site matches the
implementation candidate, the sample is isolated from real state, and the
published desktop artifact installs and starts in a clean consumer directory.

- Implementation candidate: `8090f7225b9f8ce5db28801d67229092f0d7d75c`
- Documentation tip at review start: `c924a3f46c8d9e4a4cea78c06f0f1922fc931cac`
- Published desktop release: v0.1.7 from
  `fed92d3d600350c109919e8c7005670c7828147a`
- Live URL: https://mail-attachment-archive.sociobot.in/

The two commits after the implementation candidate change only reports and
stored verification evidence. The v0.1.7 tag predates the candidate's staged
manifest and release-provenance tests; no desktop app source or interface
differs between the tag and candidate.

## First screen before scrolling

Fresh Chromium contexts were opened at 1440×900 and 390×844 with empty browser
state. Both showed the same clear answers without scrolling:

- Job: “Prove every attachment made it.” It turns an MBOX export into a
  checked local archive.
- Audience: people leaving or backing up an email account.
- First action: **Try it with sample data**, followed by “Opens a separate
  demo. Nothing is saved.”
- Facts: processing makes no network connections, core archive tools are free,
  and Archive Plus costs $29 once.

The title is “Mail Attachment Archive — check an MBOX export”. On the phone,
the download control correctly says **Open this page on a computer** and does
not link to a desktop binary.

## Claims: 24 passed, 0 failed, 0 untested

Every `test` string in `.factory/claims.json` was run as declared from the clean
candidate checkout after `npm ci` and the documented Tauri Linux prerequisites.

| Claim | Result | Fresh evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | Both browser projects opened the sample in one click, reset it, and removed its namespace on exit. |
| `local-only` | PASS | The production Tauri binary imported and reopened the shipped MBOX under Xvfb and process-level tracing with zero external `connect` or `sendto` calls. |
| `mbox-import` | PASS | The real import retained both decoded and failed attachment references. |
| `safe-mbox-limit` | PASS | A sparse 256 MB plus one byte input was rejected before parsing with split-and-retry guidance. |
| `sha256-dedup` | PASS | Two references retained one stored payload with a SHA-256 identity. |
| `encrypted-integrity` | PASS | Reopen, correct scan, wrong passphrase, damaged bytes, and saved failure report passed. |
| `restore-integrity` | PASS | A valid restore matched the checksum; damaged storage wrote no destination. |
| `evidence-reports` | PASS | The visible JSON export contained all four references and the failure. |
| `sample-evidence` | PASS | The sample showed 3 of 4 resolved, one duplicate, and one reported decode failure. |
| `csv-report` | PASS | The visible CSV export had its header, four reference rows, and one issue row. |
| `archive-search` | PASS | Sender search and duplicate filtering returned the expected records. |
| `plus-price` | PASS | The page showed $29 once and the live gateway returned HTTP 303 to Dodo checkout. |
| `plus-shortcuts` | PASS | The packaged app exposed recent shortcuts and compact view for a recorded valid license, then hid both after revocation. |
| `free-core` | PASS | Without a license, the packaged app completed encrypted import, reopen, passphrase scan, checksum restore, and CSV/JSON exports. |
| `attachments-not-opened` | PASS | Import wrote inert archive files and the packaged command allowlist had no file-opening capability. |
| `license-daily` | PASS | The URL token was captured and stripped; only the token was sent and repeat verification stayed within the daily cache. |
| `paid-license` | PASS | A recorded revoked verdict disabled Plus. |
| `site-privacy` | PASS | Landing and demo requests were same-origin, with zero cookies and only the demo storage namespace. |
| `release-assets` | PASS | The manifest contained checksummed macOS ARM/Intel, Windows, Linux AppImage, and Linux DEB assets. |
| `verified-installers` | PASS | Both installer scripts require a matching SHA-256 and stop on mismatch. |
| `ubuntu-support` | PASS | The workflow and visible note agree on Ubuntu 22.04+. |
| `plain-reopen-integrity` | PASS | A changed plain stored file reopened as corrupt and updated the saved report. |
| `release-workflow-assets` | PASS | The tag workflow covers all named platform builds plus `SHA256SUMS` and `latest.json`. |
| `release-provenance` | PASS | The contract test rejects stale release identity; the separate live provenance command also passed. |

I cross-checked the live landing, demo, privacy, terms, README, copy audit, and
release copy against this inventory. No missing, false, incomplete, duplicate,
or untested reliance claim remains.

## Live sample and recovery paths

The first click opened `/demo/` with the persistent **Demo — sample data,
nothing is saved** label. It immediately showed three messages and four
attachment references: three resolved references, one duplicate, and one
decode failure with a plain explanation.

Fresh desktop and phone runs both passed these checks:

- Sender/status filtering worked. A 2,500-character script-like search showed
  the empty result without execution or failure; clearing it restored all rows.
- **Reset demo** restored four rows and announced “Sample restored.”
- JSON contained four attachments and one issue. CSV contained its header,
  four reference rows, and one issue row.
- The demo used only `demo:mail-attachment-archive:state`. Seeded license and
  recent-archive sentinels remained byte-for-byte unchanged. Leaving removed
  only the demo key.
- A blank license is handled locally. An invalid license sent only the token to
  the documented Sociobot verify endpoint, showed a clear retry message, and
  left the free product usable.

Native normal, boundary, invalid, and recovery coverage included malformed
MIME, a retained decode failure, duplicate bytes, unsafe filenames, the 256 MB
limit, wrong encryption passphrase, damaged plain and encrypted objects,
checksum refusal before restore, missing paths, report export, valid/revoked
licenses, and release-metadata fallback.

## Installed desktop artifact and release identity

The live shell installer was run with a new temporary consumer bin. It
downloaded and installed an executable 80,009,720-byte AppImage. Its SHA-256
was `2ca464c2e17faa6aff0333a54f072a24ca2ebbaacda19500376e91b7bd7bf4c7`,
matching the live manifest. The installed application remained running for the
12-second Xvfb smoke interval.

The repository's live provenance command passed for v0.1.7 and source
`fed92d3d600350c109919e8c7005670c7828147a`, including a downloaded Linux DEB
checksum. A fresh candidate build was compared with live: all 22 public files
matched byte-for-byte. The 23rd build output,
`staticwebapp.config.json`, correctly returned HTTP 404 because the host
consumes it as deployment configuration.

## Accessibility, routes, privacy, and performance

- `/`, `/demo/`, `/privacy/`, `/terms/`, and a new unknown path were checked at
  desktop and phone widths. Each had the correct title, one H1, one main
  landmark, a skip link, complete shared structure, and zero serious or
  critical Axe findings.
- The unknown path returned the expected designed HTTP 404. It is not an error
  or defect.
- Every phone interaction target on every route was at least 44×44 CSS pixels.
  Normal 390 px layouts had no horizontal overflow. At 200% text size, the job,
  sample action, legal navigation, and scrolling content remained available.
- Keyboard use reached and activated the skip link. Dialog focus wrapped in
  both directions, Escape restored the trigger, and forward/back navigation
  focused the destination H1. The focus outline was 3 px mint. Reduced-motion
  mode had zero running animations.
- The live normal flow produced zero console errors, page errors, or failed
  requests. All visible links resolved to same-site HTTP 200, an expected
  download redirect, the checkout 303, GitHub HTTP 200, or an explicit
  `mailto:` address.
- Landing and the full sample flow requested only the product origin. There
  were no cookies, analytics, pixels, remote fonts, or third-party scripts.
  The optional license check contacted only `api.sociobot.in`.
- Security headers include a restrictive CSP, HSTS, `nosniff`, frame denial,
  strict referrer policy, and a restrictive permissions policy. Hashed JS/CSS
  use one-year immutable caching.
- The URL verifier passed in 790 ms with correct title, `lang=en`, H1, main,
  alt text, button names, and no browser errors.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.99 s, LCP 1.06 s, TBT 29.5 ms, CLS 0.
- Built site JS is 46,089 bytes raw / 13.68 KB gzip. CSS is 18,918 bytes raw /
  5.00 KB gzip. The mobile hero is 30,072 bytes and no fonts are downloaded.

This is a static site plus a local desktop app. It has no product-owned
backend, tenant system, sign-in, server-side state, health endpoint, service
worker, or updater promise. Backend tenant isolation, SQLite restart
persistence, Entra, and web update checks are therefore not applicable. The
desktop reopen tests and zero-network native traces cover its offline archive
behavior. The only server allowance in scope is the Sociobot license endpoint:
a fresh 40-request burst returned 30×200 and 10×429, every 429 with
`Retry-After: 4`, and CORS allowed only the product origin.

## Earlier findings and current disposition

Every earlier review, polish report, and verification report was inspected.
The current disposition was proved rather than copied from an earlier status.

| Earlier finding | Current disposition and fresh proof |
| --- | --- |
| Verification 1: missing claims/demo, encrypted corruption gap, no CSP, short asset cache, no 404, audience absent | FIXED — 24 claims ran; sample passed; encrypted mutation passed; live headers/cache passed; unknown route is a designed 404; both first screens name the audience. |
| Verification 2: shallow core tests, failed-reference denominator, no app license restore, no JSON action | FIXED — packaged native claims drive the command bridge and visible UI; mixed MBOX retains failure; license and JSON actions complete. |
| Verification 2: small targets, unbounded MBOX, filesystem recovery, unlisted installer/Ubuntu claims | FIXED — all-route phone targets pass; 256 MB + 1 byte rejection passes; recovery states are tested; dedicated claims pass. |
| Verification 3: checkout returned 404 | FIXED — live checkout returns 303 to a hosted Dodo session. |
| Verification 4: small targets, dialog focus escape, demo key retained | FIXED — fresh phone bounds, bidirectional focus wrap, trigger restoration, and both demo exit paths pass. |
| Verification 4: rustfmt, route metadata, secondary skeleton | FIXED — formatting passes; titles/canonicals/social metadata and complete header/footer/skip structure pass. |
| Verifications 5, 8, and 9: stale live release identity | FIXED — live v0.1.7 manifest, tag, release, checksums, installers, and candidate build agree. |
| Review 1 F-1-1–F-1-8 and F-1-30 | FIXED — phone guidance, packaged native evidence, four captioned frames, route focus, shared navigation, dedicated safety claim, and touch icons all pass. |
| Review 1 F-1-9–F-1-29 | FIXED — the cited metaphor, slogans, jargon, inconsistent terms, long copy, and untested funding/signing wording are absent. The current copy audit has no flagged item. |
| Review 2 F-1-2, F-1-3, F-1-29 and F-2-1–F-2-4 | FIXED — native network/free-core evidence is observable; the funding sentence is absent; broad claims were removed or narrowed to passing claims. |
| Review 2 F-2-5, F-2-7, F-2-8 | FIXED — headings name their sections, cryptography copy states user outcomes, and the demo failure uses plain words. |
| Review 3 F-3-1–F-3-3 | FIXED — `plus-shortcuts`, `plain-reopen-integrity`, and `release-workflow-assets` are listed and their exact tests pass. |

There is no missed AI, sync, or import/export step implied by the brief. The
core work is deterministic local parsing, hashing, storage, verification,
search, restore, and report export; adding model calls would weaken the stated
privacy goal without improving the required result.

## Clean checkout quality gates

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

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: none.
- Untested public claims: none.

Unsigned macOS and Windows packages remain clearly disclosed platform behavior
and require operator certificates if signing is desired. This is not a hidden
defect. No product code was modified during review 4.
