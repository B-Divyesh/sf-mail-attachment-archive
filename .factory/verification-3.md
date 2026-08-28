# Independent verification 3 — FAIL

**Candidate:** `92de46409314c6ee5bb51977a33ebdf2eccbd445`  
**Live URL:** https://mail-attachment-archive.sociobot.in/  
**Verified:** 2026-08-28 UTC from this clean checkout

## Release decision

**FAIL.** The free local archive workflow, published desktop artifacts, static
deployment, demo, accessibility checks, and build/test gates all passed. The
candidate advertises Archive Plus for US $29 and claims that it uses the
Sociobot checkout, but its live checkout endpoint returns HTTP 404:

```
GET https://api.sociobot.in/api/v1/products/mail-attachment-archive/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

This prevents a visitor from buying the advertised product and is a
release-blocking production integration failure. The `plus-price` claim test
only checks the link string; it does not follow the link, so it did not catch
this failure.

## First-read gate

**PASS.** A cold 1440×900 browser visit showed, in the first screen:

- **What:** “Prove every attachment made it” and “turns an MBOX export into a
  checked local archive.”
- **For whom:** “people leaving or backing up an email account.”
- **First action:** **Try it with sample data**, followed by “Opens a separate
  demo. Nothing is saved.”

The one click opened `/demo/`, with four realistic references, visible
duplicate/failure evidence, and the persistent **Demo — sample data, nothing
is saved** banner with Reset demo and Start for real. The live cold load made
no console/page errors and no off-origin requests.

## Claims gate

`.factory/claims.json` is present and has 17 unique claims. Every declared
command was run verbatim; all final isolated runs passed. The first
`sample-evidence` invocation occurred while an earlier timed command's local
Playwright server was still being torn down and produced
`ERR_CONNECTION_REFUSED`; a clean no-prestarted-server retry passed 2/2 in
6.6 s. The full suite subsequently passed as well (`test-results/.last-run.json`:
`{"status":"passed","failedTests":[]}`). No source changed between runs.

| Claims | Exact command result |
| --- | --- |
| `demo-sandbox`, `local-only`, `evidence-reports`, `sample-evidence`, `csv-report`, `archive-search`, `plus-price`, `free-core` | PASS — each declared Playwright grep command (desktop + 390 px) |
| `mbox-import`, `safe-mbox-limit`, `sha256-dedup`, `encrypted-integrity`, `restore-integrity` | PASS — each declared Cargo command |
| `license-daily`, `release-assets`, `verified-installers`, `ubuntu-support` | PASS — each declared Vitest command |

The test coverage does not prove the live checkout response, which is the
blocker above.

## End-to-end and quality evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 12 tests |
| `npm run check` | PASS |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 9 tests |
| `npm run build` | PASS — produces `dist/site` and `dist/app` |
| `npm run test:e2e` | PASS — 36 project cases; 34 passed and 2 intentional desktop-only skips |
| Native release artifact | PASS — v0.1.2 DEB SHA-256 `d8c9c437e31f0d9b428c88664e05f78bbb41b27eb9e206a25acd375eeb77bbc9`; package is `mail-attachment-archive` 0.1.2 amd64; extracted executable stayed running under Xvfb for 8 s |
| One-line Linux installer | PASS — installed a 80,550,392-byte AppImage in an isolated temporary bin directory after checksum verification; SHA-256 `a768ea8cd64821ffb9baae91fa83d0939143ce1bffd22c438ad2f4bd66bb396a` |
| Live demo workflow | PASS — sender search 1 row, duplicate filter 1 row, CSV has the expected header and 6 lines, Reset restores 4 rows |
| Invalid/recovery state | PASS — sample’s decode failure stays visible; unmatched search renders the empty result; reset recovers it |

The Rust import tests cover a mixed valid/broken MBOX, the 256 MB plus one
byte rejection boundary, SHA-256 deduplication, encrypted corruption, and
fail-closed restore. The browser suite exercises the available desktop shell,
sample archive, report downloads, license restore UI, desktop and 390 px
layouts.

## Live deployment, privacy, and accessibility

- `verify-url.sh` against the live URL: HTTP 200; 2,166 ms cold browser load;
  title, `lang=en`, one H1, main landmark, zero missing image alts, zero
  unlabeled buttons, zero console/page errors.
- Independent Playwright Axe scans on `/`, `/demo/`, `/privacy/`, and `/terms/`
  at 1440 px and 390 px: zero serious or critical violations. No route had
  horizontal overflow.
- Keyboard/reduced-motion smoke: first Tab reaches the skip link with a
  designed `rgb(84, 214, 162) solid 3px` focus outline; Enter moves focus to
  main; reduced-motion mode had zero running animations.
- The live demo uses only `demo:mail-attachment-archive:state`; its local-only
  flow made no third-party requests. No analytics, external fonts, or scripts
  were observed. The only designed remote connection is the optional Sociobot
  license API, permitted by the CSP.
- Security response policy is present: HSTS, `nosniff`, DENY framing,
  Referrer-Policy, Permissions-Policy, and a restrictive CSP. The live hashed
  JavaScript is immutable-cached for one year.
- Mobile Lighthouse: Performance 100, Accessibility 100, SEO 100; FCP 0.9 s,
  LCP 1.1 s, CLS 0, 48 KiB total transfer. Built first-load JS is 37,723 B raw
  / 11,640 B gzip; CSS is 18,232 B raw / 4,860 B gzip.
- No sign-in, PWA service worker, application backend, or health endpoint
  exists; Entra and service-worker checks are not applicable.

## Deployment identity and API rate limiting

The candidate is contained by tag `v0.1.2`; its only post-tag differences are
`.factory/handoff.md` and `public/latest.json`. Local production build and
live files match exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `d33b96377c7e8202ac5dedaab428006254b433d68531bd783f54adb2e02d26ab` |
| `assets/index-B6ygWpAs.js` | `c8b4f293f0b8b937d7813f50c0243611c098ddef4b664fb99fa1f681f01ce208` |
| `latest.json` | `67ae19a823c45df33f16e7e0a5bc0db1395c23800be6941881e81b4aef484a93` |
| `404.html` | `088cd22c942d37637484cf7ec78c2a186f360705f7e33a1410dda378636e39df` |

A 40-request concurrent burst to the optional license verification endpoint
with an invalid test token returned 30× HTTP 200 and then 10× HTTP 429, each
with `Retry-After: 4`. Observed threshold: 30 requests per burst. This endpoint
therefore has working rate limiting. It does not repair the separate checkout
404.

## Defects by severity

### Blocker

1. **Archive Plus checkout is live-broken.** The visible Buy Archive Plus link
   and `plus-price` claim point to the specified Sociobot endpoint, but the
   endpoint returns `404 {"error":"enabled factory product"}` instead of
   checkout. Enable/register the `mail-attachment-archive` product with the
   billing API, then verify a browser navigation redirects to hosted checkout.
   Add a claim test that follows the live or recorded checkout response rather
   than asserting only the href.

### High / medium / low

No additional release-blocking defects were found in this pass.

## Verification limitation

The installed GUI could be launched under Xvfb, but the headless environment
cannot drive OS-native file picker selections. This is covered below the GUI
boundary by the real Rust import/restore/encryption command tests and above it
by browser desktop-shell tests; it does not affect the checkout blocker.
