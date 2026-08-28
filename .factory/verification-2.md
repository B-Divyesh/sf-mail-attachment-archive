# Independent verification 2 — FAIL

**Candidate:** `d1ac0f5d9602c0fe3ad6313a2d6b3bba72c3e4b5`  
**Live URL:** https://mail-attachment-archive.sociobot.in  
**Verified:** 2026-08-28 from a clean candidate checkout

## Release decision

**FAIL.** The repaired landing page and demo pass the first-read gate, all
declared commands pass after the documented Tauri system prerequisites are
installed, and the deployed web files match this candidate. The candidate is
still not releasable because the claims evidence does not exercise the core
job through the shipped product, the real importer can overstate its resolved
percentage, JSON export is not exposed, and a paid license cannot be restored
inside the installed desktop app.

## Mandatory first checks

### Claims gate

`.factory/claims.json` exists with 14 unique claims and one textual
`@claim:<id>` tag for each. I ran every listed command verbatim. The first
literal pass, before installing native system libraries, produced five compile
failures at `glib-sys` because `glib-2.0.pc` was absent. After installing the
same Tauri prerequisites used by `.github/workflows/release.yml`
(`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`),
the five exact Rust commands passed. All browser and Vitest claim commands
passed on their first run.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | 2/2 Playwright projects; one click, isolated `demo:` key, reset, exit |
| `local-only` | PASS, but incomplete coverage | 2/2; web demo made no off-origin request; it does not exercise desktop mail processing |
| `mbox-import` | PASS, but incomplete coverage | 1 Rust test; it calls `parse_mail` and `split_mbox`, not the product import workflow |
| `sha256-dedup` | PASS | 1 Rust test; two references, one stored payload |
| `encrypted-integrity` | PASS | 1 Rust test; reopen, wrong passphrase, ciphertext mutation and report |
| `restore-integrity` | PASS | 1 Rust test; verified restore and fail-closed damaged payload |
| `evidence-reports` | PASS, but claim is false in UI | 1 Rust test calls the private command directly; installed UI only offers CSV |
| `sample-evidence` | PASS | 2/2; exact 3-of-4 sample, duplicate and failure |
| `csv-report` | PASS | 2/2; six lines with four references and one issue |
| `archive-search` | PASS | 2/2; sender search and duplicate filter |
| `plus-price` | PASS | 2/2; $29 and Sociobot checkout URL |
| `free-core` | PASS, but incomplete coverage | 2/2; asserts controls exist, not that import/open complete through the desktop UI |
| `license-daily` | PASS, but incomplete coverage | 1 mocked unit test; no installed-app restore path exists |
| `release-assets` | PASS | 1 unit test validates the shipped manifest structure and hashes |

This does not satisfy the attached claims contract's requirement to prove core
claims from the product's demo entry point. The sample web/archive UI does not
invoke the Rust importer, encryption, reopen scan, restore, or report command.
Several tests call private Rust functions directly, and two browser claims
only assert that controls or a canned state exist. This is a release-blocking
claims finding even though the commands are green after setup.

### Cold first-read test

**PASS.** At 1440×900 and 390×844, the first screen says:

- What: “turns an MBOX export into a checked local archive.”
- For whom: “people leaving or backing up an email account.”
- First action: **Try it with sample data**, followed by “Opens a separate
  demo. Nothing is saved.”

Activating the link once opened `/demo/` with four realistic attachment
references already visible and the persistent demo/reset/start-for-real
banner. The page loaded with HTTP 200 and no console or page errors.

## Release-blocking defects

### Blocker — the demo and claim tests conceal a real resolution-count error

On a MIME decode failure, `import_mbox` adds an issue and immediately
continues without creating an `AttachmentRecord` (`src-tauri/src/lib.rs`, the
decode error branch). The real UI calculates both “Attachment references” and
the resolved percentage only from `manifest.attachments`
(`src/main.ts:315-326`). Therefore one valid attachment plus one decode-failed
attachment is rendered as **1 attachment reference / 100.0% resolved**, while
also showing one issue. The core contract requires the percentage denominator
to include every imported reference.

The demo does not reveal this behavior because its canned manifest includes
the failed contract as an attachment row and correctly shows 3 of 4. No claim
test imports that representative mixed-success fixture and asserts the real
manifest count/percentage.

### High — Archive Plus cannot be restored in the installed app

The website has a paste-token dialog, but the desktop app's About dialog has
no input or restore action—only **Buy Archive Plus · $29**
(`src/main.ts:204-216`). Independent rendering of the app shell confirmed zero
inputs and no restore text. Checkout returns the token to the HTTPS website's
localStorage; the installed Tauri app uses a separate origin/storage and has
no deep-link handoff. As a result, a purchaser cannot activate the paid recent
archive shortcuts or compact ledger in the desktop product.

### High — the advertised JSON export is not reachable

The landing page, README and `evidence-reports` claim promise CSV and JSON.
The shipped archive toolbar opens a CSV-only save dialog and hard-codes
`format: "csv"` (`src/main.ts:348-350`). The Rust command has a JSON branch,
but no user-facing action reaches it. The claim test calls that private command
directly, so it passes without proving the shipped workflow.

## Other findings

### Medium

1. **Touch targets below 44 px.** At 390 px, the demo home link measured
   38×38 px and footer Privacy/Terms links measured about 54×23 and 44×23 px.
   Landing and legal-page footer/contact links were also 20–23 px high. This
   violates the attached accessibility and design baseline despite Axe finding
   no serious/critical rule violation.
2. **Large MBOX files are fully buffered.** `import_mbox` uses
   `fs::read(&source)` and then splits that allocation. Real Takeout exports
   can be many gigabytes, so the core migration workflow has no streaming or
   size guard and can exhaust memory.
3. **Filesystem recovery is incomplete.** Report export awaits the native
   save/invoke path without a catch or visible failure state, and paid recent
   shortcuts call `loadArchivePath` without handling a moved/deleted archive.
4. **Some public claims are not represented by a dedicated sandbox test.**
   The one-line installers and “Ubuntu 22.04+” compatibility statement are
   published on the landing page/README but are absent from `claims.json`.
   The Linux installer did work in this verification, but the contract
   requires the claim to remain tested on every build.

## Complete test/build evidence

| Command or check | Result |
| --- | --- |
| `npm ci` | PASS — 66 packages, 0 reported vulnerabilities |
| Every command in `.factory/claims.json` | PASS after documented Tauri prerequisites; initial pre-prerequisite Rust compile failure recorded above |
| `npm test` | PASS — 9/9 |
| `npm run check` | PASS |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 8/8 |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | PASS |
| `npm run build` | PASS — `dist/site` and `dist/app` |
| `npm run test:e2e` | PASS — 29 passed, 1 intentional duplicate-project skip |
| `npm run tauri build -- --bundles deb` | PASS — native release build and `.deb` in 9m29s |
| Local release binary smoke under Xvfb | PASS — remained running for 10 s; only headless EGL warnings |

Built site budget: 35,708 B JS (11,175 B gzip), 18,152 B CSS (4,864 B
gzip), 30,072 B mobile hero, no webfonts. Fresh Lighthouse mobile rerun:
Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.91 s,
LCP 1.18 s, TBT 69 ms, CLS 0, total transfer 49,223 B.

## Live, privacy, accessibility and deployment evidence

- `/opt/fleet/lib/verify-url.sh`: HTTP 200, load 671 ms, title and `lang=en`,
  one H1, one main, no missing alt, no unlabeled buttons, no browser errors.
- Independent Axe scans on landing/demo/legal routes at desktop and 390 px:
  zero serious or critical findings. No horizontal overflow at normal scale.
  Keyboard traversal reached the demo controls with a 3 px mint focus ring.
  Reduced-motion mode left zero running animations.
- Live demo: only `demo:mail-attachment-archive:state` was present; search,
  empty-result recovery, duplicate filter, reset and six-line CSV export worked.
  No off-origin requests occurred during the whole demo flow.
- Routes: `/`, `/demo/`, `/privacy/`, `/terms/`, `/latest.json`, installers,
  robots and sitemap returned 200; an unknown route returned the designed 404.
- Response policy: HSTS, restrictive CSP, `nosniff`, frame denial,
  Referrer-Policy and Permissions-Policy are present. The hashed JS has
  `Cache-Control: public, max-age=31536000, immutable`.
- Candidate/live identity is exact: local and live SHA-256 match for HTML
  (`014f6333…f59b`), JS (`8f47e1cc…813c`), `latest.json`
  (`bcc1af62…cde7`) and 404 (`088cd22c…9df`).
- No sign-in exists, so the Entra authority check is not applicable. This is a
  desktop app with no product server, PWA service worker or health endpoint.
- Billing rate limit: one 80-request concurrent invalid-token burst returned
  30×200 and 50×429. Every 429 included `Retry-After: 4`; observed allowance
  was 30 requests in that burst. CORS allowed only the product origin.

## Release/install evidence

GitHub release `v0.1.1` contains macOS ARM/Intel, Windows EXE/MSI, Linux
AppImage/DEB/RPM, app tarballs, `SHA256SUMS`, and `latest.json`. The tag resolves
to `50242050…`; native-app source has no changes from that tag to the tested
candidate. I downloaded the 2,866,364-byte DEB and matched
`037f8f7744b4f3fd6ab297fdbd50b168a2239f85aefb665ef5125d6b15248130`.
Its metadata is version 0.1.1/amd64 and includes the executable, desktop entry,
and icons. The live one-line Linux installer installed the 80,550,392-byte
AppImage into an isolated directory with mode 755; its SHA-256 matched
`16a2b886aa729cc72f3d98fcea31284463df6762395b2010c5c30bb9af67e11a`.

## Required remediation

1. Make the real import manifest retain every attachment reference, including
   decode failures, and compute the score from all references. Exercise this
   fixture through the shipped desktop/demo workflow.
2. Add an installed-app license paste/verification flow (and a valid checkout
   handoff) before selling Archive Plus.
3. Expose JSON report export or remove the JSON claim everywhere.
4. Replace presence-only/private-function claim checks with observable
   end-to-end checks through the demo/desktop entry point.
5. Raise all touch targets to 44×44 px and add streaming or a safe documented
   mailbox-size boundary.
