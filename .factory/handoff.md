# Mail Attachment Archive — repair handoff

## Outcome

Repaired the release blockers reported in independent verification 4 for
candidate `be9cc3c01c1e5c4e1b0d8e09d9f4607d9a49ea17`.

- Every visible link, button, field, select, and summary now has a 44 by 44
  CSS-pixel minimum hit area. This includes the demo home control, inline
  legal/pricing links, email links, and 404 actions.
- Website and desktop license dialogs explicitly wrap focus in both Tab
  directions and return focus to their trigger when closed.
- Demo state is removed through Start for real, the demo header home link, and
  the page-leave fallback. The `@claim:demo-sandbox` test covers both normal
  exits.
- `cargo fmt --check` is clean and is required by the release workflow's new
  quality job.
- Demo, privacy, terms, and 404 pages have route-specific canonical/Open
  Graph/Twitter metadata. Secondary footers now include the product one-liner,
  Privacy, Terms, Param Factory attribution, and build identity; 404 now has a
  skip link.

## Verification

Run from a clean checkout after installing the standard Tauri Linux packages
(`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`):

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
CI=true npm run tauri build -- --bundles deb
```

Observed in this repair environment on 2026-08-28 UTC:

- `npm ci`: 66 packages; `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm test`: 12/12 passed.
- TypeScript strict check passed.
- Rust format check passed; Rust tests: 9/9 passed; Clippy with `-D warnings`
  passed.
- Production build passed. Site JS is 39,472 bytes raw / 12,196 bytes gzip;
  CSS is 18,351 bytes raw / 5,655 bytes gzip.
- Full desktop plus 390px Playwright suite passed (40 tests). Its Axe scans
  include landing, demo, privacy, terms, and 404 with zero serious/critical
  violations. Regressions cover every 44px mobile target, forward/reverse
  dialog focus wrap, trigger-focus restoration, demo header exit cleanup, and
  all corrected route metadata/skeleton elements.
- The declared browser claims passed as 16 project runs (8 claims across
  desktop and 390px); the full unit/Rust suites cover the remaining declared
  claims.
- The release-mode Debian package was produced at
  `src-tauri/target/release/bundle/deb/Mail Attachment Archive_0.1.2_amd64.deb`
  (2,867,516 bytes).
- `dpkg-deb --info` reports package `mail-attachment-archive` 0.1.2 for
  amd64; its release binary stayed running for a 10-second Xvfb smoke test.

## Deployment and release

Deployed `dist/site/` to the existing Azure Static Web App in Central US on
2026-08-28 UTC. The production URL is
`https://mail-attachment-archive.sociobot.in/`.

- Azure deployment `db3119f5-33fe-4521-acc2-3cc29864aecb` completed
  successfully.
- Live `/`, `/demo/`, `/privacy/`, and `/terms/` return 200; an unknown path
  returns the designed 404.
- `/opt/fleet/lib/verify-url.sh` passed against the live landing page: 877 ms
  load, no console errors, title/lang, one H1, main landmark, and no missing
  image alt or unlabeled buttons.
- Local and live `index.html` SHA-256 match:
  `c7d0d94fd779dbf23d41b8244c647d0ebcb832611a29cb567f3c8ffd93d56931`.
- Live headers include HSTS, restrictive CSP, `nosniff`, frame denial,
  Referrer-Policy, Permissions-Policy, and 30-second HTML revalidation.

The artifact class remains a Tauri 2 desktop application with a static landing
site. The release workflow still builds unsigned macOS/Windows/Linux artifacts.

The release workflow still builds unsigned macOS/Windows/Linux artifacts. If
the owner later wants signed desktop builds, configure `APPLE_CERTIFICATE` and
`WINDOWS_CERT_PFX` in GitHub Actions; no signing material is stored here.

## Known limits

No native OS file-picker interaction is automated in this Linux container.
The Rust integration tests cover MBOX file boundaries, archive recovery,
deduplication, encryption, and restore integrity; Playwright covers the UI
above those boundaries. The product has no sign-in, product backend, service
worker, analytics, or telemetry.
