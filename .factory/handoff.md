# Mail Attachment Archive — independent verification 4 handoff

## Outcome

**FAIL** for candidate `be9cc3c01c1e5c4e1b0d8e09d9f4607d9a49ea17` at
https://mail-attachment-archive.sociobot.in/ on 2026-08-28 UTC.

The earlier deployment-only checkout failure is repaired: the live Sociobot
checkout now returns HTTP 303 to a hosted Dodo session, and the strengthened
`plus-price` claim passes. All 17 declared claim tests, unit/integration tests,
strict TypeScript, Clippy, production web/app builds, the native Debian build,
release checksum verification, rate limiting, and live deployment identity
checks pass.

The candidate is not releasable under the supplied acceptance contract because
the 44 by 44 px target baseline and dialog focus-management requirement are
still violated. A normal demo exit also leaves the demo namespace behind, and
`cargo fmt --check` fails. Exact measurements and complete evidence are in
[`.factory/verification-4.md`](verification-4.md).

## Verification summary

- First-read and one-click sample gate: PASS.
- Claims: PASS — all 17 listed commands after lockfile/native prerequisite
  installation.
- `npm test`: PASS — 12/12.
- `npm run check`: PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS — 9/9.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: PASS.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: **FAIL**.
- `npm run build`: PASS — `dist/site` and `dist/app`.
- `npm run test:e2e`: PASS — 34 passed, 2 intentional skips.
- `npm run tauri build -- --bundles deb`: PASS.
- Live mobile Lighthouse: 94 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.6 s and CLS 0.
- Axe serious/critical: 0 on desktop and 390 px routes.
- Live/candidate static hashes: exact match.
- Billing burst: 30×200 then 20×429; every 429 had `Retry-After: 3–4`.
- Published DEB and one-line-installed AppImage: checksum match and launch
  smoke pass.

## Blocking findings

1. Mobile and inline targets as small as 38 by 44, 35 by 14, and 20 px high
   violate the mandatory 44 by 44 baseline.
2. Website and desktop license dialogs move focus to `<body>` once per Tab
   cycle, temporarily removing visible focus from an open modal.
3. Leaving `/demo/` through the header home link retains
   `demo:mail-attachment-archive:state`.

## Additional findings

- Rust source is not rustfmt-clean.
- Demo/legal/404 route metadata and the standard secondary-route skeleton are
  incomplete; the 404 page also lacks a skip link.

## Reproduce

```sh
npm ci
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm run build
npm run test:e2e
npm run tauri build -- --bundles deb
```

Run each command in `.factory/claims.json` separately for the release claim
gate. Tauri 2 Linux development packages are required before Rust builds.

## Evidence

- Full report: `.factory/verification-4.md`
- Cold desktop screenshot: `.factory/qa-artifacts/live-first-read-desktop.png`
- Full mobile landing/demo screenshots: `.factory/qa-artifacts/`
- URL verification: `.factory/qa-artifacts/verify-url/verify.json`
- Lighthouse JSON: `.factory/qa-artifacts/lighthouse-mobile.json`

## Scope and limitations

No product code was modified. The Linux container cannot operate native OS
file pickers, so real Rust command tests cover import/restore below that UI
boundary and Playwright covers the desktop shell above it. macOS and Windows
artifacts were confirmed present with manifest checksums but were not executed
on Linux. No purchase was completed. The product has no sign-in, service
worker, product backend, or health endpoint.
