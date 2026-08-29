# Mail Attachment Archive — handoff

## Independent verification 7 — PASS

Candidate `a7c3994ca998dd9fd730cd6fe320249a974b366c` is **PASS** for
https://mail-attachment-archive.sociobot.in/ as of 2026-08-29 UTC. All 20
declared claim tests passed after installing the documented Linux native-test
prerequisites; local unit, type, browser, Rust, format, Clippy, and production
build gates passed. Live demo, privacy/request logging, response headers,
desktop/390px accessibility, keyboard/reduced-motion, release checksum, and
license API allowance checks passed.

The deployed web artifacts exactly match a fresh candidate production build.
The v0.1.5 release manifest names tagged source `98688ee…`, an ancestor of the
candidate, as intended. No defects by severity were found. Full commands,
observed outcomes, and caveats are in `.factory/verification-7.md`.

## Previous polish handoff

## Outcome

All cumulative review findings are closed. The repair preserves the
evidentiary-geometry visual system and desktop-app deployment class. Commit
`1351d2ad134df0a3744f0d059f6c1e8e90468954` is pushed to `main`; static
deployment `04eec903-9a36-4d3a-b596-f05f9d9845be` is live.

## Material repairs

- Native claims now launch the production Tauri binary, use shipped IPC, render
  workflow states, record filesystem outcomes, and trace network syscalls.
- The free path completes encrypted import, reopen, full scan, restore, CSV,
  and JSON export without a license.
- Reopened encrypted archives now receive the correct unverified IPC state and
  require a passphrase scan before showing a resolved result.
- Every review-2 reliance statement is removed, narrowed, or listed and tested.
- First-screen facts, section headings, demo error, README, footer, and pricing
  copy use direct wording and consistent terminology.
- The site manifest now points at the completed v0.1.5 cross-platform release,
  whose source is `98688eeac97b7dedabacd02311a8f4bc3f74e462`.

## Local evidence

- `npm test`: 17 passed.
- `npm run check`: passed.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 12 passed.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: passed.
- `npm run test:e2e`: 48 passed across desktop and 390 px.
- `npm run test:native-claim -- local-only`: passed with zero external connections.
- `npm run test:native-claim -- free-core`: passed through import, reopen,
  encrypted scan, restore, and both report formats.
- `npm run build`: produced `dist/site` and `dist/app`; site JS is 44.77 KB raw
  and 13.39 KB gzip, CSS is 18.92 KB raw and 5.00 KB gzip.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s, CLS 0, TBT 0 ms.
- A fresh clone of `1351d2a` passed `npm ci`, `npm test` (17), `npm run check`,
  `npm run build`, `npm run test:e2e` (48), Cargo tests (12), and Clippy.
- Live `verify-url.sh`: 200, no console errors, route title, `lang=en`, one H1,
  main landmark, and complete image alternatives. Live Axe on `/`, `?demo=1`,
  privacy, terms, and the real 404 passed at desktop and 390 px with no serious
  or critical findings. See `.factory/qa-artifacts/polish-2-live/`.

## Verify

```sh
npm ci
npm test
npm run check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run build
npm run test:e2e
npm run test:native-claim -- local-only
npm run test:native-claim -- free-core
```

Linux native claim tests require the Tauri prerequisites, `xvfb`, and `strace`.
Every exact claim command is listed in `.factory/claims.json`.

## Operator action

The release remains unsigned unless the operator supplies Apple and Windows
signing credentials. Signing is not required for the tested checksum-guided
release path.

## Remaining work

None. The binaries are intentionally unsigned; their v0.1.5 release checksums
are published and the installer scripts verify them before installation.
