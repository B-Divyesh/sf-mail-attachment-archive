# Polish 1 — review finding closure

Candidate repaired from review commit `f89057f15ae74321e471fac37360433f411d238c`.

| Finding | Change | Evidence |
| --- | --- | --- |
| F-1-1 | Android and iOS now receive an “Open this page on a computer” state, never a desktop artifact. | Playwright `Android and iPhone visitors are never offered desktop installers` |
| F-1-2 | The privacy claim now names native archive processing; a Rust fixture import/reopen proves filesystem-only archive output. | `@claim:local-only` Cargo test |
| F-1-3 | The free claim now runs unlicensed encrypted import, reopen, scan, restore, CSV, and JSON export. | `@claim:free-core` Cargo test |
| F-1-4 | Added four original, captioned desktop workflow frames for import, folder choice, report review, and restore. | Playwright `landing includes the captioned desktop walkthrough`; `public/assets/walkthrough-*.svg` |
| F-1-5 | Route navigation moves focus to the new h1 and announces it; Back restores h1 focus. | Playwright `document navigation moves focus to the new route heading` |
| F-1-6 | Landing, demo, and app-rendered legal routes share the compact primary header. Static legal/404 routes use the same links. | Playwright `secondary routes expose route-specific metadata and a complete site skeleton` |
| F-1-7 | Removed the time-sensitive unsigned-binary assertion; README now directs readers to release notes and SHA256SUMS. | README review; no unsupported signing claim remains |
| F-1-8 | Removed the unused opener plugin and permission. The attachment claim verifies the packaged allowlist has no opener capability. | `@claim:attachments-not-opened` Cargo test |
| F-1-9 | Rewrote eyebrow to “How attachment checks work”. | Landing copy audit |
| F-1-10 | Rewrote heading to “Check every attachment result”. | Landing copy audit |
| F-1-11 | Rewrote step to “Verify each attachment”. | Landing copy audit |
| F-1-12 | Rewrote step to “Review every failed attachment”. | Landing copy audit |
| F-1-13 | Rewrote privacy heading to “Mail processing stays on your computer”. | Landing copy audit; `@claim:local-only` |
| F-1-14 | Rewrote pricing eyebrow to “Archive Plus pricing”. | Landing copy audit |
| F-1-15 | Rewrote final eyebrow to “Keep a checked local archive”. | Landing copy audit |
| F-1-16 | Rewrote action to “Download Mail Attachment Archive”. | Landing copy audit |
| F-1-17 | Standardized product copy on “MBOX export”. | `.factory/copy-audit.md` |
| F-1-18 | Standardized CSV/JSON output on “verification report”. | `.factory/copy-audit.md`; `@claim:evidence-reports` |
| F-1-19 | Standardized desktop sample action on “Load sample archive”. | Playwright desktop-shell test |
| F-1-20 | Split the overlong README introduction. | README review; `.factory/copy-audit.md` |
| F-1-21 | Replaced unexplained “local-first” in README. | README review |
| F-1-22 | Replaced “dependency-light” in README. | README review |
| F-1-23 | Rewrote MIME jargon in README. | README review |
| F-1-24 | Rewrote “inertly” and added a storage-without-opening claim. | README; `@claim:attachments-not-opened` |
| F-1-25 | Rewrote “passphrase-gated” in README and claims. | README; `@claim:encrypted-integrity` |
| F-1-26 | Rewrote ciphertext format jargon in README. | README review |
| F-1-27 | Rewrote “fails closed” in README. | README review |
| F-1-28 | Split and simplified Archive Plus copy. | README review |
| F-1-29 | Replaced the untestable funding benefit with plain factual wording. | Landing copy audit |
| F-1-30 | Added the Apple touch icon to privacy, terms, and 404 static documents. | Playwright route metadata test |

## Cumulative verification findings

The earlier verification reports’ target-size, dialog focus, demo-exit,
formatting, metadata, footer, and release-identity findings were already present
in the reviewed candidate. This repair preserves their tests and adds route,
phone, walkthrough, and native-outcome regression coverage.

## Deployment re-check

After the repair commit is pushed, verify cold at
`https://mail-attachment-archive.sociobot.in/?demo=1`, `/privacy/`, `/terms/`,
and an unknown route. Record the deployed build identity in the handoff.
