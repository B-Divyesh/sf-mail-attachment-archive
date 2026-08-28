# Verification handoff — FAIL

Candidate `3bd876eb929b2bd660d65d3121385b79864e1e42` was independently checked
against https://mail-attachment-archive.sociobot.in/ on 2026-08-28 UTC.

**FAIL.** The website deployment exactly matches the candidate, but the
downloadable desktop artifacts do not: live `latest.json` publishes `v0.1.2`,
whose Git tag resolves to `8c2bc38ba45ca57386381be00fd886b5d312e298`, not the
candidate. No release tag contains the candidate. This is release-blocking for
a desktop app even though the static site and the older package both work.

All 17 declared claims passed after installing the repository-documented Linux
Tauri prerequisites. `npm test` (12/12), TypeScript, Cargo format, all nine
Rust tests, exact production Vite build, and browser/demo/a11y/privacy checks
passed. The live site has zero axe serious/critical findings on desktop and
390px mobile, no console errors, same-origin demo requests, correct response
headers, and a rate-limited billing verification endpoint (429 + Retry-After
after a burst). The published Linux package checksum matches its manifest and
it launched under Xvfb, but it is stale relative to the candidate.

Next step: tag and publish a new desktop release from `3bd876e` (or the exact
approved successor), including all platform artifacts, `SHA256SUMS`, and
`latest.json`; deploy that manifest; then verify that its tag resolves to the
candidate and rerun package QA. Full evidence is in
`.factory/verification-5.md`.
