# Mail Attachment Archive — polish 2 handoff

## Outcome

All cumulative review findings are implemented locally. The repair preserves
the evidentiary-geometry visual system and desktop-app deployment class. Release
and live cold verification remain in progress for this work order.

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
- Version 0.1.5 is prepared for the cross-platform release workflow.

## Local evidence

- `npm test`: 17 passed.
- `npm run check`: passed.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 12 passed.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: passed.
- `npm run test:e2e`: 46 passed, 2 expected project skips.
- `npm run test:native-claim -- local-only`: passed with zero external connections.
- `npm run test:native-claim -- free-core`: passed through import, reopen,
  encrypted scan, restore, and both report formats.
- `npm run build`: produced `dist/site` and `dist/app`; site JS is 44.77 KB raw
  and 13.39 KB gzip, CSS is 18.92 KB raw and 5.00 KB gzip.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s, CLS 0, TBT 0 ms.
- Local URL verifier: no console errors; title, language, H1, main, labels, and
  image alternatives pass.

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

Push/tag v0.1.5, wait for all release assets and checksums, update the same-origin
manifest, deploy `dist/site`, and cold-check every live route and finding.
