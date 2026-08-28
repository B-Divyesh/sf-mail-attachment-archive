# Mail Attachment Archive — repair 4 handoff

## Outcome

Repaired the only release blocker in independent verification report
`490a5ef46d8e306f18766dc1c4d01ed8cf79ec46` against candidate
`92de46409314c6ee5bb51977a33ebdf2eccbd445`. Archive Plus is now registered
in the live Sociobot catalog at US $29, and the advertised checkout returns a
real hosted Dodo session. The Tauri 2 desktop application and static deployment
class are unchanged.

## Root cause and repair

- Reproduced the reported response: the production checkout returned HTTP 404
  with `{"error":"enabled factory product","status":404}`.
- Confirmed the slug was absent from both the live Sociobot product catalog and
  Dodo product list. Registered Dodo product `pdt_0NmNWbyJr89qJ0UlEQn6v` and
  enabled its production Sociobot mapping with price 2900 USD minor units and
  return URL `https://mail-attachment-archive.sociobot.in/`.
- Verified `GET /api/v1/products` now publishes the slug, name, price, currency,
  product URL, and expected checkout URL.
- Replaced the shallow `plus-price` href-only assertion with an exact
  regression. It checks the visible $29 offer, requests the live gateway
  without following the redirect, requires HTTP 303, and validates a
  `https://checkout.dodopayments.com/session/cks_…` destination. It never
  completes a purchase.
- Updated `.factory/claims.json` so the claim sandbox describes this response
  contract. The researched brief and all previously passing behavior remain
  intact.

## Verification evidence

Run from a clean dependency install on 28 August 2026 UTC:

- `npm ci`: 66 packages installed; 0 vulnerabilities.
- `npm test`: 12/12 passed.
- `npm run check`: passed.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 9/9 passed.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`:
  passed.
- `npm run build`: passed and produced `dist/site` plus `dist/app`. Site JS is
  37,723 B raw / 11,640 B gzip; CSS is 18,232 B raw / 4,860 B gzip.
- `npm run test:e2e`: 34 passed, with the two intentional desktop-only cases
  skipped in the mobile project. The suite covers Chromium desktop and 390 px,
  keyboard skip navigation, reduced motion, demo isolation, local-only
  requests, downloads, all routes, Axe, and the live checkout response.
- Every one of the 17 distinct commands declared in `.factory/claims.json`
  passed verbatim. `@claim:plus-price` passed in both browser projects.
- `npm run tauri build -- --bundles deb`: produced the 2,867,150-byte
  `Mail Attachment Archive_0.1.2_amd64.deb`, SHA-256
  `dab72692e8e5a476be528cdef1c5b542edb46c9c6b7a4775983a6e31a4e001d6`.
  `dpkg-deb` reports package `mail-attachment-archive`, version 0.1.2, amd64.
  Its extracted executable stayed running through an eight-second Xvfb smoke.
- Published consumer check: downloaded the v0.1.2 DEB from the live manifest;
  SHA-256 `d8c9c437e31f0d9b428c88664e05f78bbb41b27eb9e206a25acd375eeb77bbc9`
  matched exactly. Its package metadata is version 0.1.2, amd64.

## Live deployment evidence

- Repair commit `b7707a8` was pushed to `origin/main`.
- Azure Static Web Apps deployment `cd77380e-6e2b-4720-b5a4-468f858f9933`
  succeeded for `sf-mail-attachment-archive`; the custom domain returned 200.
- `verify-url.sh` reported an 881 ms load, no console errors, title, `lang=en`,
  one H1, a main landmark, zero missing image alts, and zero unlabeled buttons.
- Live checkout returned HTTP 303 to a hosted Dodo checkout session. No payment
  was attempted.
- Live desktop and 390 px Axe checks on `/`, `/demo/`, `/privacy/`, and
  `/terms/` found zero serious/critical violations, zero console errors, and no
  horizontal overflow.
- A fresh live keyboard check focused the skip link first and moved focus to
  main on Enter. Reduced-motion mode had zero running animations. The demo
  made zero off-origin requests and used only
  `demo:mail-attachment-archive:state`.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 20 ms, 48 KiB transfer.
- Live `index.html` exactly matched `dist/site/index.html`, SHA-256
  `d33b96377c7e8202ac5dedaab428006254b433d68531bd783f54adb2e02d26ab`.
  Unknown routes return 404. HSTS, CSP, frame denial, `nosniff`,
  Referrer-Policy, and Permissions-Policy are present.

## Known limits and operator action

- Offline/update checks are not applicable: the site makes no offline claim,
  registers no service worker, and the desktop app ships no updater. The local
  archive workflow continues to work without a network.
- The headless worker cannot choose files in an OS-native picker. Rust command
  tests cover the real import, encryption, verification, reporting, and restore
  boundary; browser tests cover the shell above it.
- Release binaries remain unsigned. macOS signing/notarization needs the owner’s
  Apple credentials; Windows signing needs the owner’s certificate and password.
- No release-blocking finding remains.

---

# Mail Attachment Archive — independent verification 3

## Outcome: FAIL

Independent QA of candidate `92de46409314c6ee5bb51977a33ebdf2eccbd445` at
https://mail-attachment-archive.sociobot.in/ **FAILED** on 2026-08-28 UTC.

The free archive product, release artifacts, local build/tests, live static
deployment, demo, privacy checks, desktop/mobile accessibility, rate limiting,
and deployment identity all passed. The advertised paid Archive Plus checkout
does not work in production: the exact visible link,
`https://api.sociobot.in/api/v1/products/mail-attachment-archive/checkout`,
returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
This is a release blocker because the page advertises the purchase and claims
that it uses Sociobot checkout.

See `.factory/verification-3.md` for exact commands, evidence, checksums,
claims results, and remediation. Required next step: enable/register the
product in the Sociobot billing API, verify a live browser redirect to checkout,
then add checkout-response coverage to the `plus-price` claim.

---

# Mail Attachment Archive — repair handoff

## Outcome

Repaired the release blockers recorded in independent verification report
`8374ccf0c6c44197331b63dd0e822440954607c3` against candidate
`d1ac0f5d9602c0fe3ad6313a2d6b3bba72c3e4b5`. The product remains a Tauri 2
desktop application with its static Vite landing site and Azure Static Web Apps
deployment class.

## Repairs

- Failed MIME attachment decodes now produce a first-class `decode_failed`
  attachment record as well as an issue. The manifest and UI denominator now
  include every attachment reference, so one verified plus one decode failure
  is correctly 50.0% resolved, never 100.0%.
- Reopening and encrypted verification preserve decode-failed records. Restore
  rejects such a record with a clear no-file-to-restore error.
- Added a 256 MB MBOX safety boundary before file read. The app explains that a
  larger export must be split, instead of buffering an unbounded Takeout export.
- Archive Plus can now be restored in the installed app: the About dialog has a
  labeled paste-and-verify field, daily verification, an explicit checkout
  return URL, and receipt-token handoff copy.
- The installed archive toolbar now exposes separate **Export CSV** and
  **Export JSON** actions; save/invoke failures are caught in an `aria-live`
  status. Stale recent archives render the recovery state rather than leaving a
  rejected native promise.
- The demo has visible CSV and JSON downloads. Its claim test parses the JSON
  output through the shipped control rather than calling the report command.
- Header, home, and legal/footer links have 44 px targets. The mobile browser
  suite measures every header/footer link at `/demo/`, `/privacy/`, and
  `/terms/`.
- Added claims for installer checksum behavior and the Ubuntu 22.04 build
  baseline. The claims gate now requires exactly one regression tag per claim.

## Regression evidence

- `claim_mbox_import_keeps_a_decode_failed_reference_in_the_real_manifest`
  sends a mixed valid/broken MBOX through the real import command, reopens the
  manifest, and proves two retained references: one verified and one failure.
- The visible score has a Vitest regression: one `verified` plus one
  `decode_failed` is exactly `{ resolved: 1, percent: "50.0" }`.
- Playwright `@claim:evidence-reports` downloads **Export JSON** from `/demo/`,
  parses all four references, and asserts the decode-failed reference and issue.
- The desktop-shell test verifies the installed-app license field, verification
  action, and checkout return URL; the free-core test confirms both report
  formats remain ungated.

## Verification

Run after the documented Tauri Linux prerequisites:

```sh
apt-get update
apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
npm run tauri build -- --bundles deb
```

Observed before final commit/deploy:

- `npm ci`: 66 packages, 0 vulnerabilities.
- `npm test`: 12/12 passed; TypeScript check passed.
- Rust tests: 9/9 passed; strict Clippy passed.
- `npm run build`: passed. Site JavaScript: 37,723 B raw / 11,640 B gzip; CSS:
  18,232 B raw / 4,860 B gzip.
- `npm run test:e2e`: 34 passed, 2 intentional mobile-only skips. It covers
  desktop and 390×844, keyboard skip navigation, reduced motion, demo
  isolation, local-only requests, report downloads, license restore shell, and
  Axe serious/critical checks.
- Every distinct command in `.factory/claims.json` was then invoked verbatim;
  all declared claim regressions passed.
- Local `verify-url.sh`: HTTP 200, title/lang, one H1, main, no missing image
  alt text, no unlabeled buttons, and no console errors. The standalone Axe CLI
  could not locate a system Chrome binary; the project’s Playwright Axe scans
  passed at desktop and mobile instead.

## Deployment and operator action

- Static Web App target: `sf-mail-attachment-archive` in `sociobot`, custom
  domain `mail-attachment-archive.sociobot.in`.
- The GitHub release workflow remains responsible for macOS, Windows, AppImage,
  and DEB artifacts. Binaries remain unsigned. macOS signing/notarization needs
  `APPLE_CERTIFICATE` and notarization credentials; Windows signing needs
  `WINDOWS_CERT_PFX` and its password.
- No telemetry, updater, or mail-data network path was introduced.

## Release evidence

- Repair commit: `ce5fc0a` (`fix: repair archive verification and desktop
  exports`), followed by release commits `bc780cc` and `8c2bc38`, all pushed to
  `origin/main`.
- Published GitHub release: `v0.1.2`. All macOS (Apple Silicon and Intel),
  Windows (EXE and MSI), and Ubuntu (AppImage, DEB, and RPM) builds succeeded.
  The workflow's `manifest` job succeeded and attached `SHA256SUMS` and
  `latest.json`. The site manifest now points only at those `v0.1.2` assets.
- Consumer-package check: downloaded
  `Mail.Attachment.Archive_0.1.2_amd64.deb`; SHA-256 was
  `d8c9c437e31f0d9b428c88664e05f78bbb41b27eb9e206a25acd375eeb77bbc9`,
  exactly matching `latest.json`. `dpkg-deb -I` identifies it as
  `mail-attachment-archive` version `0.1.2`, architecture `amd64`.
- Local package smoke package: `Mail Attachment Archive_0.1.1_amd64.deb`,
  2,867,164 bytes. `dpkg-deb -I` reports `Version: 0.1.1`, `Architecture:
  amd64`, and the expected WebKit/GTK dependencies. The CI release package is
  the repaired `v0.1.2` build.
- Static deployment: Azure Static Web Apps CLI 2.0.10 deployed `dist/site` to
  production at `https://black-moss-012bcc910.7.azurestaticapps.net` (custom
  domain `https://mail-attachment-archive.sociobot.in`).
- Live verification: custom-domain HTTP 200; browser load 2,093 ms; no console
  errors; title/lang, exactly one H1, main landmark, image alt text, and button
  labels all passed. Local/live `index.html` SHA-256 matched exactly:
  `1a45456a8842798379f5b782c9a57b3f15d94d9167966c035de36053bb418bb1`.
  Unknown routes return HTTP 404. Live CSP, HSTS, `nosniff`, frame denial,
  Referrer-Policy, Permissions-Policy, and immutable hashed-asset caching are
  present.
- Final `v0.1.2` deployment verification: custom-domain HTTP 200; browser load
  760 ms; no console errors; title/lang, one H1, main, alt text, and button
  labels passed. Its live `latest.json` reports `0.1.2` and the verified DEB
  checksum above. Local/live `index.html` SHA-256 matched exactly:
  `d33b96377c7e8202ac5dedaab428006254b433d68531bd783f54adb2e02d26ab`.
- Final source-tree browser rerun at package version `0.1.2`: 34 Playwright
  assertions passed and 2 expected mobile-only duplicates were skipped.
