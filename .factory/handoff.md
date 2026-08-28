# Mail Attachment Archive — repair handoff

> **Independent verification 6: PASS** — candidate `7f8cdafb2bfa0b4acd65cc46195d66669b99da41` at https://mail-attachment-archive.sociobot.in/. Fresh evidence: `.factory/verification-6.md`.

## Outcome

Repaired the release-blocking identity mismatch reported in independent
verification 5 for candidate `3bd876eb929b2bd660d65d3121385b79864e1e42`.

- `v0.1.4` is a complete desktop release built from tagged commit
  `62f8752149bcea42added1b502d5dfbcc38b0641`.
- The release manifest records that exact `source_commit`; all five advertised
  platform downloads have a SHA-256 value.
- Every release job checks out the requested tag, verifies its source commit
  and all package versions before building, and passes the source commit into
  the generated manifest. The check explicitly uses Bash on Windows so the
  tag environment variable is interpreted consistently.
- Regression coverage creates a temporary Git repository to confirm the
  identity verifier succeeds for the tagged commit and rejects a later commit.
  Workflow coverage also requires the three explicit Bash identity steps.

`v0.1.3` is not deployed or advertised by the current site: its Windows build
stopped at the identity step because that step used PowerShell with Bash
variable syntax. The corrected `v0.1.4` workflow completed every matrix job.

## Verification

Executed on 2026-08-28 UTC from a clean dependency install:

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

- `npm audit`: 0 vulnerabilities; `npm test`: 16/16 passed.
- TypeScript strict check, Cargo format, 9 Rust tests, and Clippy with warnings
  denied all passed.
- Production builds passed. The deployed site bundle is 39.55 KB raw / 12.22
  KB gzip; CSS is 18.35 KB raw / 4.89 KB gzip.
- Playwright passed 38 checks with 2 expected desktop-shell skips, covering
  desktop and 390px mobile, keyboard focus, reduced motion, demo isolation,
  same-origin demo requests, release fallback, and Axe checks.
- The local `0.1.3` Debian package was built and smoke-checked before the
  corrected cross-platform release. The published `v0.1.4` Debian package was
  then downloaded as a consumer, matched `SHA256SUMS`, reports
  `mail-attachment-archive 0.1.4 amd64`, and remained running for 12 seconds
  under Xvfb.
- GitHub Actions run
  `33198969585` completed successfully: quality plus Linux, Windows, macOS
  ARM, macOS Intel, and manifest jobs all passed.
- Public `v0.1.4/latest.json` says
  `source_commit: 62f8752149bcea42added1b502d5dfbcc38b0641`; it matches
  `git rev-list -n 1 v0.1.4`. Its downloaded Linux DEB SHA-256 is
  `36e0eaa0ada7c3d653efde76c0295ea3cb47f64fbd0464f16e66a386043645d4`.

## Deployment

Deployed `dist/site/` to the existing Azure Static Web App in Central US.

- Deployment ID: `186f2793-ac26-4338-b091-ff44046fb26e`.
- `https://mail-attachment-archive.sociobot.in/` returns 200. `/demo/`,
  `/privacy/`, `/terms/`, and `/latest.json` return 200; an unknown route
  returns the designed 404.
- The deployed `latest.json` has SHA-256
  `29edf0b2fe7c9c5b880c6abfbe9ae3b75f5b7e9e5a6f7b0402bd852d29944396`,
  exactly matching `public/latest.json`, and advertises only the completed
  v0.1.4 asset set.
- `/opt/fleet/lib/verify-url.sh` passed live: 754 ms load, no console errors,
  title/lang, one H1, main landmark, and no missing image alt or unnamed
  button. Live Axe scans found zero serious/critical issues for landing, demo,
  privacy, terms, and 404 at 1366px and 390px.
- Live headers include HSTS, CSP, `nosniff`, frame denial, Referrer-Policy,
  Permissions-Policy, and 30-second HTML revalidation.

## Known limits / operator action

The artifact class remains a Tauri 2 desktop application with a static landing
site. macOS and Windows releases are unsigned. To ship signed packages, the
operator must configure the GitHub Actions `APPLE_CERTIFICATE` and
`WINDOWS_CERT_PFX` secrets; no signing material is stored in this repository.
Native OS file-picker interaction is not automated in this Linux environment;
the Rust integration tests and desktop UI suite cover the surrounding archive
workflow.
