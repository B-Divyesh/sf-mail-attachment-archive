# Independent verification 5 — FAIL

**Candidate:** `3bd876eb929b2bd660d65d3121385b79864e1e42`  
**Live URL:** https://mail-attachment-archive.sociobot.in/  
**Verified:** 2026-08-28 UTC, clean checkout

## Release decision

**FAIL — release-blocking deployment identity mismatch.** The deployed static
site is exactly this candidate, but the downloadable desktop artifacts are not.
The live `latest.json` points to release `v0.1.2`; GitHub resolves that tag to
`8c2bc38ba45ca57386381be00fd886b5d312e298`, an ancestor of the candidate.
`git tag --contains 3bd876e` returned no tag. The release workflow builds
desktop binaries only on `v*` tags, and the range from that tag to the candidate
contains product changes, including `11fc0b4 fix: repair accessibility and demo
exit QA findings`. A person downloading the advertised desktop app therefore
does not receive the verified candidate.

This does not invalidate the positive web and local QA below; it does prevent
acceptance of this desktop-app candidate. Publish/tag binaries from this commit
(preferably a new version) and update `latest.json`, or deploy the tagged code
instead, then re-verify package identity.

## First-read gate — PASS

A cold 1440px visit returned HTTP 200 with no console/page errors. The first
viewport says what it does: “Prove every attachment made it” / turns an MBOX
export into a checked local archive; for whom: people leaving or backing up an
email account; and what to click: visible **Try it with sample data**, followed
by “Opens a separate demo. Nothing is saved.” One click opens `/demo/`.

## Claims gate — PASS

`.factory/claims.json` exists with 17 claims. After `npm ci` and installing the
documented Tauri Linux prerequisites, every declared command passed. The browser
claims ran against the demo entry point in both desktop Chromium and 390px
mobile; the six Rust claims each passed their exact filtered command.

| Claim | Result / evidence |
| --- | --- |
| `demo-sandbox` | PASS — declared Playwright run, desktop + 390px. |
| `local-only` | PASS — declared Playwright run; demo requests only same-origin assets. |
| `mbox-import` | PASS — exact filtered Cargo run, 1/1. |
| `safe-mbox-limit` | PASS — exact filtered Cargo run, 1/1. |
| `sha256-dedup` | PASS — exact filtered Cargo run, 1/1. |
| `encrypted-integrity` | PASS — exact filtered Cargo run, 1/1. |
| `restore-integrity` | PASS — exact filtered Cargo run, 1/1. |
| `evidence-reports` | PASS — declared Playwright run, desktop + 390px. |
| `sample-evidence` | PASS — declared Playwright run, desktop + 390px. |
| `csv-report` | PASS — declared Playwright run, desktop + 390px. |
| `archive-search` | PASS — declared Playwright run, desktop + 390px. |
| `plus-price` | PASS — declared Playwright run; gateway resolved checkout. |
| `free-core` | PASS — declared Playwright run, desktop + 390px. |
| `license-daily` | PASS — `npm test` 12/12 includes its named Vitest test. |
| `release-assets` | PASS — `npm test` 12/12 includes its named Vitest test. |
| `verified-installers` | PASS — `npm test` 12/12 includes its named Vitest test. |
| `ubuntu-support` | PASS — `npm test` 12/12 includes its named Vitest test. |

The demo independently showed 4 references, 1 visible decode failure, a sender
search and issue filter each reducing to one result, JSON download with 4
attachments/1 issue, reset back to 4 rows, and only
`demo:mail-attachment-archive:state` in storage.

## Local quality gates — PASS

- `npm ci`: 66 packages; `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm test`: 12/12 passed.
- `npm run check`: passed.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: passed.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 9/9 passed.
- `npm run test:e2e`: 38 passed; 2 expected desktop-only skips.
- `npm run build`: passed; `dist/site/` and `dist/app/` produced. Site JS is
  39,472 bytes raw / 12.20 KB gzip; CSS 18,351 bytes raw / 4.89 KB gzip.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`:
  passed.

The initial Cargo invocation could not compile until the repository's own
documented GTK/WebKit development dependencies were installed; this is an
environment prerequisite, not a source failure. The exact Rust claim commands
were rerun and passed afterward.

## Live web, accessibility, privacy, and policy — PASS

- Candidate-built `index-CevjitZt.js` SHA-256
  `b77712de80407c4a11571f461c58d942d03746a01106edb08666b688d372e4eb`
  and `index-DrS08cfn.css` SHA-256
  `8087f2938c62b19838924174f60d2f611629800a9b5f032eea881429893e4f2f`
  exactly equal the live assets.
- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` each return 200,
  have one `h1` and `main`, have no console/page errors, and have zero axe
  serious/critical findings on desktop and 390px mobile.
- `/opt/fleet/lib/verify-url.sh` passed against the live landing page: 921ms
  load, title/lang, one `h1`, main landmark, no missing image alt, no unlabeled
  button, and no browser errors.
- Keyboard smoke: first Tab lands on the skip link with a visible 3px green
  focus ring; Enter moves focus to main. At 390px there is no horizontal
  overflow, no target below 44px, and reduced motion has zero running
  animations.
- Demo flow requests only same-origin site assets. There are no CDN fonts,
  scripts, analytics, or telemetry. CSP limits connections to self and the
  Sociobot billing API; HSTS, `nosniff`, frame denial, referrer and permissions
  policies are present. JS/CSS are one-year immutable; HTML is 30-second
  revalidated.
- The license verify endpoint was burst-tested with 80 concurrent invalid
  tokens: 31 responses were 200 and 49 were 429; 429 included `Retry-After: 2`
  (and `x-ratelimit-after: 2`). No sign-in exists, so Entra is not applicable.

## Published package check — PASS, but stale

The Linux `.deb` download was 2,867,586 bytes and SHA-256
`d8c9c437e31f0d9b428c88664e05f78bbb41b27eb9e206a25acd375eeb77bbc9`,
matching live `latest.json`. It identifies as
`mail-attachment-archive 0.1.2 amd64` and remained running for 12 seconds under
Xvfb (only expected headless EGL warnings). This verifies that the published
artifact is sound, not that it contains the candidate.

## Defects by severity

### P0 — release blocker

1. **Published desktop artifacts do not match candidate `3bd876e`.** Live web
   assets match the candidate, while every advertised installer is the `v0.1.2`
   release built from tag target `8c2bc38`, before candidate UI/accessibility
   fixes. Tag/release the candidate, upload all platform artifacts and checksums,
   then update `latest.json` and repeat package identity verification.

### P1/P2

None found in the independently exercised web/demo path.
