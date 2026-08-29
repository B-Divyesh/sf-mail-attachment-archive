# Polish 2 — cumulative finding closure

Candidate `a4ae7081ccc0564eb98050ae4158a27a050bfa6b` was repaired against
`review-1.md`, `polish-1.md`, and `review-2.md`. This table maps every finding;
post-deploy URLs and screenshots are recorded in the final verification section.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Preserved Android/iOS detection before desktop OS detection; phones receive no binary URL. | Playwright `Android and iPhone visitors are never offered desktop installers`; mobile screenshot |
| F-1-2 | Replaced the direct-function claim with a production Tauri binary run under process-level `connect`/`sendto` tracing. The shipped IPC imports and reopens the fixture with zero AF_INET/AF_INET6 connections. | `npm run test:native-claim -- local-only`; `.factory/qa-artifacts/native-claims/local-only.json` |
| F-1-3 | The unlicensed production binary now drives encrypted import, reopen, scan, restore, CSV export, and JSON export through shipped IPC and visible UI states. | `npm run test:native-claim -- free-core`; `.factory/qa-artifacts/native-claims/free-core.json` |
| F-1-4 | Preserved four captioned desktop workflow frames with useful alt text and responsive stacking. | Playwright `landing includes the captioned desktop walkthrough at desktop and phone widths` |
| F-1-5 | Preserved route H1 focus, polite announcement, and Back focus restoration. | Playwright `document navigation moves focus to the new route heading` |
| F-1-6 | Preserved the shared wordmark and four-link primary header across landing, demo, legal, and 404 routes. | Playwright route skeleton test; live route crawl |
| F-1-7 | Kept the changing unsigned-status assertion out of general copy; release notes carry release-specific signing status. | README audit; release workflow body |
| F-1-8 | Preserved the no-opener capability boundary and checksum-before-restore test. | Cargo `claim_attachments_not_opened_import_writes_only_archive_files` |
| F-1-9 | Uses “How attachment checks work.” | `.factory/copy-audit.md` |
| F-1-10 | Uses “Check every attachment result.” | `.factory/copy-audit.md` |
| F-1-11 | Uses “Verify each attachment.” | `.factory/copy-audit.md` |
| F-1-12 | Uses “Review every failed attachment”; remaining “exception report” wording was removed from UI and release copy. | `rg` terminology audit; `.factory/copy-audit.md` |
| F-1-13 | Uses “Mail processing stays on your computer.” | `@claim:local-only`; landing screenshot |
| F-1-14 | Uses “Archive Plus pricing.” | `.factory/copy-audit.md` |
| F-1-15 | Uses “Keep a checked local archive.” | `.factory/copy-audit.md` |
| F-1-16 | Uses “Download Mail Attachment Archive.” | `.factory/copy-audit.md` |
| F-1-17 | Standardized user copy and native errors on “MBOX export.” | `rg` terminology audit; Cargo error paths |
| F-1-18 | Standardized the problems list and CSV/JSON output on “verification report.” | `rg` terminology audit; `@claim:evidence-reports` |
| F-1-19 | Preserved “Load sample archive” in the desktop first-run state. | Playwright desktop-shell test |
| F-1-20 | README introduction remains split into short sentences. | `.factory/copy-audit.md` |
| F-1-21 | README explains on-computer processing without “local-first.” | README and copy audit |
| F-1-22 | README names Rust, Tauri, Vite, and TypeScript without marketing adjectives. | README and copy audit |
| F-1-23 | README says “attached files,” not MIME jargon. | README and copy audit |
| F-1-24 | README says attachments are stored without opening. | `@claim:attachments-not-opened` |
| F-1-25 | Passphrase instructions use a full plain sentence. | README and native encrypted flow |
| F-1-26 | Algorithm names are absent from the user-facing feature list. | README audit |
| F-1-27 | Restore failure says it stops before writing the destination. | README; `@claim:restore-integrity` |
| F-1-28 | Archive Plus price and free-core facts are separate short sentences. | `@claim:plus-price`; `@claim:free-core` |
| F-1-29 | Deleted “Helps fund future app updates” completely. | `rg` copy audit; pricing screenshot |
| F-1-30 | Preserved SVG favicon and Apple touch icon on legal and 404 documents. | Playwright route metadata test |
| F-2-1 | Removed “Works without a mailbox login” from the first-screen facts. | First-screen screenshot; `rg` copy audit |
| F-2-2 | Narrowed README to the observable chosen-input/chosen-folder behavior. Native request tracing proves the remaining privacy copy. | README; `@claim:local-only` |
| F-2-3 | Removed the provider-deletion promise. README now tells users to keep the source export. | README; `rg` copy audit |
| F-2-4 | Replaced merchant/refund assertions with two tested facts: Dodo hosts checkout, and revoked licenses disable Plus. | `@claim:plus-price`; `@claim:paid-license` |
| F-2-5 | Rewrote the eyebrow, sample heading, final heading, and footer as direct section/product descriptions. | `.factory/copy-audit.md`; desktop/mobile screenshots |
| F-2-7 | User-facing encryption copy states the outcome and passphrase behavior without algorithm names. | README audit |
| F-2-8 | Demo error now says the attachment data was incomplete and the file could not be saved. | `@claim:sample-evidence`; demo mobile screenshot |

## Additional defect closed

The new native workflow caught an omitted `verification_complete` IPC field.
Reopened encrypted archives could show “accounted for” while records were still
unverified. The field now crosses IPC but is never trusted from disk. The native
claim requires the passphrase prompt before accepting the scan, and the Cargo
test asserts the serialized false state.

## Verification evidence

- Local screenshots: `.factory/qa-artifacts/polish-2/screenshot-desktop.png`,
  `screenshot-mobile.png`, and `demo-mobile.png`.
- Local URL verification: `.factory/qa-artifacts/polish-2/verify.json` — no
  console errors, one H1, `lang=en`, main landmark, complete alt text.
- Lighthouse mobile: `.factory/qa-artifacts/polish-2/lighthouse-mobile.json` —
  performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.2 s,
  CLS 0, TBT 0 ms.
- Live deployment `04eec903-9a36-4d3a-b596-f05f9d9845be` was verified cold at
  `https://mail-attachment-archive.sociobot.in/`. The site's `latest.json`
  now names v0.1.5/source `98688eeac97b7dedabacd02311a8f4bc3f74e462` and its
  published macOS, Windows, AppImage, and DEB checksums.
- Live evidence: `.factory/qa-artifacts/polish-2-live/verify.json`,
  `screenshot-desktop.png`, `screenshot-mobile.png`, `demo-mobile.png`, and
  `live-journey.json`. The cold demo has four rows, only the `demo:` storage
  key, resets to four rows, and leaves with empty storage. Pixel and iPhone
  both receive “Open this page on a computer,” not a binary link.
- Live accessibility: `.factory/qa-artifacts/polish-2-live/axe-live.json`
  records no serious or critical Axe findings and no application console errors
  at desktop and 390 px on `/`, `?demo=1`, `/privacy/`, `/terms/`, and the real
  404 route. The expected HTTP 404 resource notice is excluded only for the
  intentionally unknown URL itself.
