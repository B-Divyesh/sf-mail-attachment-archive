# Polish 3 — zero-finding closure

Release source commit `ab987ec1720768b05faa39509a1cb7c641849321` is tagged
`v0.1.6`. GitHub Actions run
`https://github.com/B-Divyesh/sf-mail-attachment-archive/actions/runs/33238677733`
completed successfully and published the macOS ARM/Intel, Windows, AppImage,
and DEB assets with `SHA256SUMS` and `latest.json`. The static deployment
`ca0309ac-c748-4a1e-9ec4-5cd45d52adf5` is live at
`https://mail-attachment-archive.sociobot.in/`.

The evidence paths below are committed under `.factory/qa-artifacts/`.
`polish-3-live/live-journey.json` is a cold live desktop, Android, and iPhone
route check. `polish-3-live/axe-live.json` records desktop and 390 px Axe
checks for landing, direct demo, legal pages, and the intentional 404.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept explicit Android/iOS detection ahead of desktop OS detection; phones receive computer-only guidance. | Playwright phone regression; `polish-3-live/live-journey.json`; live `/` |
| F-1-2 | Kept the packaged-production import/reopen trace with zero AF_INET/AF_INET6 connections. | `@claim:local-only`; `native-claims/local-only.json` |
| F-1-3 | Kept the unlicensed production workflow through import, encrypted scan, restore, CSV, and JSON. | `@claim:free-core`; `native-claims/free-core.json` |
| F-1-4 | Kept four original captioned desktop walkthrough frames, with responsive stacking and useful alt text. | Playwright walkthrough test; `polish-3-live/landing/screenshot-mobile.png` |
| F-1-5 | Kept destination-H1 focus and polite announcement for forward navigation and Back. | Playwright navigation test; `polish-3-live/live-journey.json` |
| F-1-6 | Kept the shared four-link header and footer on landing, demo, legal, and 404 pages. | Playwright route-skeleton test; live `/demo/`, `/privacy/`, `/terms/` |
| F-1-7 | Kept changing unsigned-binary status out of visitor-facing general copy. | README audit; release notes are release-specific |
| F-1-8 | Kept the no-opener capability boundary and storage-without-opening behavior. | `@claim:attachments-not-opened` Cargo test |
| F-1-9 | Uses “How attachment checks work.” | `.factory/copy-audit.md`; live `/` |
| F-1-10 | Uses “Check every attachment result.” | `.factory/copy-audit.md`; live `/` |
| F-1-11 | Uses “Verify each attachment.” | `.factory/copy-audit.md`; live `/` |
| F-1-12 | Uses “Review every failed attachment.” | `.factory/copy-audit.md`; live `/` |
| F-1-13 | Uses “Mail processing stays on your computer.” | `@claim:local-only`; live `/` |
| F-1-14 | Uses “Archive Plus pricing.” | `.factory/copy-audit.md`; live `/` |
| F-1-15 | Uses “Keep a checked local archive.” | `.factory/copy-audit.md`; live `/` |
| F-1-16 | Uses “Download Mail Attachment Archive.” | `.factory/copy-audit.md`; live `/` |
| F-1-17 | Uses “MBOX export” consistently. | terminology audit in `.factory/copy-audit.md` |
| F-1-18 | Uses “verification report” consistently for CSV/JSON output. | `@claim:evidence-reports`; copy audit |
| F-1-19 | Uses “Load sample archive” in desktop first-run state. | Playwright desktop-shell test |
| F-1-20 | Keeps the README introduction split into short sentences. | `.factory/copy-audit.md` |
| F-1-21 | Explains on-computer processing without “local-first.” | `.factory/copy-audit.md` |
| F-1-22 | Names the stack without vague marketing adjectives. | `.factory/copy-audit.md` |
| F-1-23 | Says “attached files,” not MIME jargon. | `.factory/copy-audit.md` |
| F-1-24 | Says attachments are stored without opening them. | `@claim:attachments-not-opened` |
| F-1-25 | Uses a complete passphrase instruction. | `@claim:encrypted-integrity`; README audit |
| F-1-26 | Keeps cryptography implementation names out of the user-facing feature list. | `.factory/copy-audit.md` |
| F-1-27 | Explains that restore stops before writing on a failed check. | `@claim:restore-integrity` |
| F-1-28 | Keeps Plus price and free-core facts as short separate statements. | `@claim:plus-price`; `@claim:free-core` |
| F-1-29 | Keeps the untestable funding-benefit copy deleted. | `rg` copy audit; live `/` |
| F-1-30 | Keeps favicon and Apple touch icon metadata on legal and 404 documents. | Playwright metadata test; `polish-3-live/404/screenshot-desktop.png` |
| F-2-1 | Keeps the untested mailbox-login promise off the first screen. | first-screen live journey evidence |
| F-2-2 | Keeps privacy copy narrowed to observable chosen-input/chosen-folder behavior. | `@claim:local-only`; README audit |
| F-2-3 | Keeps provider-deletion promises absent and tells users to retain the source export. | README audit |
| F-2-4 | Keeps commercial copy to tested Dodo checkout and revoked-license behavior. | `@claim:plus-price`; `@claim:paid-license` |
| F-2-5 | Keeps headings and footer as direct section/product descriptions. | `.factory/copy-audit.md`; live landing screenshot |
| F-2-7 | Keeps user-facing encryption copy outcome-focused. | README audit; `@claim:encrypted-integrity` |
| F-2-8 | Keeps the plain demo error about incomplete attachment data. | `@claim:sample-evidence`; live `?demo=1` |
| F-3-1 | Added a real packaged-app Plus workflow: a recorded valid verdict enables a saved recent shortcut and Compact; a recorded revoked verdict hides both. | `@claim:plus-shortcuts`; `native-claims/plus-shortcuts.json` |
| F-3-2 | Plain `load_manifest` now persists its fresh verification report. A damaged payload reopens as corrupt in both IPC result and JSON report. | `@claim:plain-reopen-integrity` Cargo test |
| F-3-3 | Added a claim test that verifies the v* workflow matrix, target build, manifest generation, and release upload of both verification files. | `@claim:release-workflow-assets`; successful v0.1.6 Actions run |

## Verification

- Clean clone: `git clone --depth 1 --branch v0.1.6 …`, then `npm ci`.
- Every exact command in `.factory/claims.json` passed in that clean checkout:
  seven browser claim commands, six Vitest claim commands, seven Cargo claim
  commands, and all three packaged-app native claim commands.
- Full clean-clone gates passed: `npm test` (18), `npm run check`, `cargo fmt
  --check`, `cargo test` (13), `cargo clippy -- -D warnings`, `npm run build`,
  and `npm run test:e2e` (48).
- v0.1.6 Linux DEB was downloaded and matched SHA-256
  `cbae3f196fa3a86cf4c3acf2b0750bc5344369a966b6ec79571426a6c88dc73c`.
- Cold live `verify-url.sh` checks have no console errors and report one H1,
  `lang=en`, main, and complete image alternatives. Live Axe reports no serious
  or critical violations. Lighthouse mobile is 100/100/100/100 with LCP
  1.09 s, CLS 0, and TBT 7 ms.

There are no remaining review findings or known product gaps for this work
order.
