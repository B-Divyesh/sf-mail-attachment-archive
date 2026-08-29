# Mail Attachment Archive — independent verification 9 handoff

## Current outcome: FAIL

Candidate `ba291bde5c1818a50b196b7427e2438d0c2e4114` fails release acceptance
at https://mail-attachment-archive.sociobot.in/. This result supersedes all
historical PASS text below.

### P0: live release provenance is stale

Fresh `GET /latest.json` reports **v0.1.6** from
`ab987ec1720768b05faa39509a1cb7c641849321`. GitHub's current desktop release
is **v0.1.7** from `fed92d3d600350c109919e8c7005670c7828147a`.

The repository's own live verifier fails:

```text
Error: Live manifest version is 0.1.6; expected 0.1.7
```

The live JS/CSS bytes do match a fresh candidate web build, and all 25 declared
claim commands plus local quality, native-flow, privacy, accessibility, rate
limit, and bundle checks passed. The stale manifest/download provenance remains
release-blocking. Full fresh evidence is `.factory/verification-9.md`.

### Required next step

Deploy the v0.1.7 release `latest.json` with the static site and rerun:

```sh
npm run verify:release-provenance -- https://mail-attachment-archive.sociobot.in \
  B-Divyesh/sf-mail-attachment-archive v0.1.7 \
  fed92d3d600350c109919e8c7005670c7828147a linux_deb
```

No product code was modified during this verification.

---

# Historical repair 7 handoff (superseded)

## Outcome

**PASS.** The release/deployment identity failure from independent verification
8 is repaired. The stale failure was reproduced first: at 08:01 UTC,
`https://mail-attachment-archive.sociobot.in/latest.json` identified
`ab987ec1720768b05faa39509a1cb7c641849321` (v0.1.6), not verified candidate
`14e4681c4dbe53b1bdac8eda9d584c9d77059d80`.

The repair release is **v0.1.7**, published from exact source commit
`fed92d3d600350c109919e8c7005670c7828147a` and deployed to
`https://mail-attachment-archive.sociobot.in/` as Azure Static Web Apps
deployment `28a7d6d4-7433-4080-92fd-6e867fe63f1d`.

## Repair

- Added a release-manifest staging command. It downloads the manifest attached
  to the tagged GitHub release, requires the expected tag and exact source
  commit, and writes that exact response into `dist/site/latest.json` before
  static deployment.
- Added live provenance verification. It requires live `/latest.json`, the
  GitHub release target, the release `latest.json`, each `SHA256SUMS` entry,
  the two shipped installer scripts, and a downloaded selected installer asset
  to agree. The regression fixture explicitly rejects a stale live commit and
  covers installers that compose their GitHub URL from a repository variable.
- Added the executable `release-provenance` claim and documented the required
  release → stage → deploy → verify sequence in the README.
- Bumped the immutable desktop release to v0.1.7; the desktop app and all
  release metadata use the same version.

## Exact publication and live evidence

```text
GitHub Release: v0.1.7
Release target: fed92d3d600350c109919e8c7005670c7828147a
Release workflow: https://github.com/B-Divyesh/sf-mail-attachment-archive/actions/runs/33243005224
Live manifest source_commit: fed92d3d600350c109919e8c7005670c7828147a
Live manifest version: 0.1.7
Live Linux DEB: Mail.Attachment.Archive_0.1.7_amd64.deb
Linux DEB SHA-256: 619a94cc59213989f820ffade967a73eb3014b3289e97720e21214f3cee38b55
```

`npm run verify:release-provenance -- https://mail-attachment-archive.sociobot.in B-Divyesh/sf-mail-attachment-archive v0.1.7 fed92d3d600350c109919e8c7005670c7828147a linux_deb`
passed after deployment. It downloaded the v0.1.7 DEB and verified its
SHA-256 against both `latest.json` and `SHA256SUMS`.

## Verification

From a clean `npm ci` install with documented Tauri Linux prerequisites:

```text
npm ci                                               PASS (0 vulnerabilities)
npm test                                             PASS (19 tests)
npm run check                                        PASS
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check  PASS
cargo test --manifest-path src-tauri/Cargo.toml      PASS
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings  PASS
npm run build                                        PASS (dist/site and dist/app)
npm run test:e2e                                     PASS (48 desktop + 390 px tests)
npm run test:native-claim -- local-only              PASS (zero AF_INET/AF_INET6)
npm run test:native-claim -- free-core               PASS
npm run test:native-claim -- plus-shortcuts          PASS
```

The production site build is 46,089 B JavaScript raw / 13.68 KB gzip and
18,918 B CSS raw / 5.00 KB gzip. Live `verify-url.sh` passed: HTTP 200,
no console errors, title, `lang=en`, one H1, main landmark, and complete image
alternatives. Its evidence is in `.factory/qa-artifacts/repair-7-live/`.
Live Axe scans using the repository-pinned Playwright Chromium and
`@axe-core/playwright` reported zero WCAG 2 A/AA violations and zero console
errors at desktop and 390 px mobile. The standalone `@axe-core/cli` could not
run because this container has no system Chrome binary; the pinned Playwright
scan is the successful equivalent.

This is a local-first desktop app with no updater and no offline/PWA claim;
the release manifest/download controls and native production flows cover the
applicable update/release behavior. No telemetry or third-party website
requests were introduced.

## Known gaps / operator action

None for the release. The macOS and Windows binaries remain unsigned by
design; users are told how to handle platform warnings, and the release plus
installer scripts verify SHA-256 before installation.
