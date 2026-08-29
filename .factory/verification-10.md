# Independent verification 10 — PASS

**Candidate:** `8090f7225b9f8ce5db28801d67229092f0d7d75c`  
**Live URL:** https://mail-attachment-archive.sociobot.in/  
**Verified:** 29 August 2026 UTC from the clean candidate checkout

## Verdict

**PASS.** The previous deployment-only failure is repaired. Every required
claim command passes, the cold first screen passes the plain-words and
one-click-demo gates, the complete local quality matrix passes, all deployed
public bytes match the fresh candidate build, and the live v0.1.7 release
provenance chain is consistent through a downloaded installer checksum.

No P0, P1, P2, or P3 product defects were found.

## Mandatory first gates

### Claims

`.factory/claims.json` exists with 24 entries. Before any other QA, I ran each
entry's `test` string exactly as listed. Result: **24 passed, 0 failed**.

| Claims | Result | Fresh observable evidence |
| --- | --- | --- |
| `demo-sandbox`, `evidence-reports`, `sample-evidence`, `csv-report`, `archive-search`, `plus-price`, `site-privacy` | PASS | Each filtered Playwright command passed in desktop Chromium and the 390 px mobile project. |
| `local-only`, `free-core`, `plus-shortcuts` | PASS | Each built and drove the production Tauri binary. The regenerated artifacts report visible UI success, unchanged source input, and zero `connect`/`sendto` external connections. |
| `mbox-import`, `safe-mbox-limit`, `sha256-dedup`, `encrypted-integrity`, `restore-integrity`, `attachments-not-opened`, `plain-reopen-integrity` | PASS | Every exact filtered Cargo test passed against temporary real archive files. |
| `license-daily`, `paid-license`, `release-assets`, `verified-installers`, `ubuntu-support`, `release-workflow-assets`, `release-provenance` | PASS | Every exact filtered Vitest command passed. |

The native artifacts are under
`.factory/qa-artifacts/native-claims/`. I also cross-checked the live landing,
demo, privacy, terms, README, and copy audit against the manifest. I found no
material unlisted public claim.

### Cold first read

**PASS.** A new 1440×900 browser context with empty storage showed, without
scrolling:

- What: it “turns an MBOX export into a checked local archive.”
- For whom: “people leaving or backing up an email account.”
- First action: **Try it with sample data**, followed by “Opens a separate
  demo. Nothing is saved.”

That action opened `/demo/` in one click with four realistic attachment
references already visible. Evidence:
`.factory/qa-evidence/first-read-desktop.png` and
`.factory/qa-evidence/first-read-mobile.png`.

## Clean install, tests, and build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 20/20 Vitest tests |
| `npm run check` | PASS — TypeScript emits no errors |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 13/13 tests |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | PASS |
| `npm run build` | PASS — exact production build created `dist/site` and `dist/app` |
| `npm run test:e2e` | PASS — 46 passed, 2 expected project-specific skips |

The complete gate log is `.factory/qa-evidence/quality-gates.log`.

The native end-to-end runs exercised an unlicensed encrypted import, reopen,
passphrase scan, checksum-verified restore, CSV and JSON exports, paid recent
shortcuts and compact view, then revocation. Boundary and recovery coverage
included a 256 MB + 1 byte MBOX rejection before buffering, malformed MIME,
duplicate references, damaged plain and encrypted payloads, wrong passphrase,
unsafe filenames, blank and invalid license tokens, and invalid release
metadata fallback.

## Deployment and release identity

- Candidate `8090f72` is checked out at `origin/main`.
- A fresh `npm run build` was compared byte-for-byte with live. All 22 public
  files matched. `staticwebapp.config.json` correctly returned 404 because
  Azure consumes deployment configuration rather than serving it.
- Representative SHA-256 prefixes: `index.html` `7ffb2c126f660616`, site JS
  `c15a7823358a9096`, CSS `b8bc3c28797fbf45`, and `latest.json`
  `61ae66eb83fe6f8c`.
- Live `/latest.json` is byte-identical to candidate `public/latest.json`. It
  identifies desktop release v0.1.7 from tagged source
  `fed92d3d600350c109919e8c7005670c7828147a`.
- The repository's live provenance command passed. It matched the live and
  GitHub manifests, the release tag, all five platform assets,
  `SHA256SUMS`, and both live installers. It downloaded the Linux DEB and
  verified SHA-256
  `619a94cc59213989f820ffade967a73eb3014b3289e97720e21214f3cee38b55`.
- The exact live shell installer was run into a new temporary consumer bin.
  It installed an executable 80,009,720-byte AppImage whose SHA-256 was
  `2ca464c2e17faa6aff0333a54f072a24ca2ebbaacda19500376e91b7bd7bf4c7`,
  matching the live manifest.

## Live product QA

### Useful flow and recovery

On desktop and 390×844 mobile, the demo loaded 3 messages and 4 attachment
references, reported 3 of 4 resolved, retained one duplicate and one decode
failure, searched and filtered correctly, reset to its original state, and
exported valid CSV (six lines including the failure) and JSON (four records
and the issue). A repeated 2,500-character script-like search string rendered
an empty state without executing or crashing; clearing it restored all rows.

The demo used only `demo:mail-attachment-archive:state`; reset recreated that
sample key, leaving the demo removed it, and no cookies were set. A blank
license submission made no request and displayed its recovery message. An
invalid token sent only the `license` query value to the documented Sociobot
endpoint, returned a controlled invalid result, and left the free experience
usable.

### Accessibility and browser quality

- Desktop and 390 px: no horizontal overflow; all visible touch targets were
  at least 44×44 CSS px.
- Each tested route had `lang=en`, one H1, one main landmark, correct title and
  metadata, and an operable skip link.
- Keyboard focus started on the skip link, moved to `main`, and used a visible
  3 px mint outline. Existing dialog tests proved focus wrapping, Escape close,
  and trigger restoration.
- Reduced-motion contexts had zero running animations.
- Fresh Axe WCAG 2 A/AA scans found zero serious or critical findings on `/`,
  `/demo/`, `/privacy/`, `/terms/`, and the designed 404 at both widths.
- Normal flows produced zero console errors, page errors, or failed requests.
- Every live anchor resolved successfully (same-origin 200, documented
  external redirect, or explicit `mailto:`).

The live run log is `.factory/qa-evidence/live-browser-qa.log`; screenshots
include `.factory/qa-evidence/demo-mobile-viewport.png` and
`.factory/qa-evidence/live-demo-desktop.png`.

### Privacy, headers, caching, and endpoint limits

- Cold landing and the complete demo flow made only same-origin requests. The
  only optional off-origin request observed was the explicit license check to
  `api.sociobot.in`; there were no analytics, pixels, remote fonts, or scripts.
- Production responses include a restrictive CSP, `frame-ancestors 'none'`,
  HSTS on documents, `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  DENY`, strict referrer policy, and a restrictive permissions policy.
- Hashed JS and CSS use `Cache-Control: public, max-age=31536000, immutable`.
  HTML and live release metadata use a 30-second revalidation policy.
- After a fresh limiter window, 40 concurrent invalid license requests from
  one client produced **30×200 and 10×429**. Every 429 carried
  `Retry-After: 4`; CORS allowed exactly the product origin. The observed
  allowance is 30 requests per window.
- There is no product sign-in, so Entra tenant validation is not applicable.
  The product has no first-party backend, service worker, updater, or PWA
  claim; the billing check above is its only server endpoint.

### Performance budgets

- Site JavaScript: 46,089 B raw / 13,566 B gzip (budget 200 KB).
- CSS: 18,918 B raw / 5,019 B gzip (budget 50 KB).
- No font payload. Mobile hero: 30,072 B (budget 300 KB).
- Fresh mobile Lighthouse: performance 100, accessibility 100, best practices
  100, SEO 100; FCP 1.0 s, LCP 1.1 s, CLS 0, TBT 70 ms.

The Lighthouse JSON is `.factory/qa-evidence/lighthouse-mobile.json`.

## Defects by severity

- P0 / blocker: none.
- P1 / high: none.
- P2 / medium: none.
- P3 / low: none.

The disclosed unsigned macOS and Windows packages remain an operator-signing
limitation, not a hidden release defect. No product code was changed during
this independent verification.
