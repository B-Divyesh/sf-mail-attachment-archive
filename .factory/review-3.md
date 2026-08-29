# Adversarial first-read review 3 — Mail Attachment Archive

Reviewed 29 August 2026 against https://mail-attachment-archive.sociobot.in/ and checkout 920bde7e52d189e67e4a3b4a7befca321bc28a99.

## Verdict: FAIL

The first read, isolated demo, native workflow, and every declared claim pass. Three user-reliance claims remain unlisted and untested. PASS requires zero findings.

## Cold first read

Fresh empty Chromium contexts were opened at 390 × 844 (Android and iPhone user agents) and 1440 × 900 before scrolling.

| Question | Answer from the first screen | Result |
| --- | --- | --- |
| What does this do? | It turns an MBOX export into a checked local attachment archive. | PASS |
| For whom? | People leaving or backing up an email account. | PASS |
| What should I click first? | Try it with sample data. | PASS |

The exact text was “Prove every attachment made it.”; “For people leaving or backing up an email account, it turns an MBOX export into a checked local archive.”; and “Opens a separate demo. Nothing is saved.” The title was “Mail Attachment Archive — check an MBOX export”; no console or page errors occurred. Android and iPhone correctly show “Open this page on a computer” and “Available for macOS, Windows, and Linux.”, not a desktop installer.

## Findings

### Major

#### F-3-1 — Archive Plus promises named features without a claim or feature test

- Location: landing pricing panel; README Privacy, payment, and security.
- Exact quotes: “Archive Plus adds shortcuts for repeated migrations.”, “Saved recent archive shortcuts”, and “Compact attachment ledger”.
- Why: these are paid-product outcomes a purchaser can rely on. claims.json has plus-price and paid-license, but neither proves a valid license reveals either named feature. paid-license only changes a stored verdict from valid to revoked.
- Fix: add a plus-shortcuts claim. In a clean app-shell or packaged-app test, use a recorded valid license, import an archive, assert the recent shortcut and Compact control work, then assert both disappear after a recorded revoked verdict. Alternatively delete the three feature promises.

### Minor

#### F-3-2 — Plain-archive recheck is an unlisted README claim

- Location: README What it does.
- Exact quote: “Re-verifies plain files when an archive is reopened.”
- Why: this is a concrete integrity behavior. mbox-import reopens an unchanged fixture, but its declared claim and assertions only require preserved references and a decode failure. It does not mutate a stored plain file and assert corrupt status on reopen.
- Fix: add plain-reopen-integrity: import a plain fixture, change one stored payload, reopen through the production command, and assert the record and JSON report say corrupt. Otherwise delete the sentence.

#### F-3-3 — README release-workflow assertions are unlisted claims

- Location: README Develop and verify.
- Exact quotes: “GitHub Actions builds .dmg, .msi/.exe, .AppImage, and .deb assets on the appropriate OS when a v* tag is pushed.” and “It also publishes SHA256SUMS and latest.json.”
- Why: these are specific release guarantees. The release-assets test parses an already-published manifest; it does not prove that the tagged workflow creates every named asset and uploads both verification files.
- Fix: remove these internal workflow promises, or add release-workflow-assets with a test that verifies the workflow matrix, targets, and manifest-publishing step for all four artifacts and both verification files.

## Copy audit

Counts are whitespace-delimited. This lists all landing and README prose, headings, labels, actions, and captions; filenames and sample-table values are data rather than sentences. No count exceeds 22. No banned marketing adjective, slogan heading, inconsistent user term, or non-result-naming visible button was found. F-3-1 through F-3-3 are the unlisted-claim flags.

### Landing page

| Copy item | Words |
| --- | ---: |
| Local attachment archive | 3 |
| Prove every attachment made it. | 5 |
| For people leaving or backing up an email account, it turns an MBOX export into a checked local archive. | 19 |
| Try it with sample data / Opens a separate demo. / Nothing is saved. | 5 / 4 / 3 |
| Processing makes no network connections / Core archive tools are free / Archive Plus costs $29 once | 5 / 5 / 5 |
| Download for Linux / Open this page on a computer | 3 / 6 |
| AppImage · Ubuntu 22.04+ / Available for macOS, Windows, and Linux. | 3 / 6 |
| Many references. / One verified copy of each file. | 2 / 6 |
| How attachment checks work / Check every attachment result | 4 / 4 |
| An MBOX export can exist while useful files are missing. / This archive shows each attachment result. | 10 / 6 |
| Import the MBOX export / Choose a standard MBOX export. | 4 / 5 |
| The app reads it locally and never connects to your email account. | 12 |
| Verify each attachment | 3 |
| Attachments are decoded, checked, and stored once—even when the same file appears in many threads. | 16 |
| Review every failed attachment | 4 |
| Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report. | 14 |
| Desktop walkthrough / Review the archive before you download | 2 / 6 |
| These frames show the desktop steps for an MBOX export and its verification report. | 14 |
| Choose an MBOX export. / Choose a local archive folder. / Review the verification report. / Restore a checksum-verified file. | 5 / 6 / 5 / 5 |
| Sample archive / Sample attachment records / 3 of 4 sample references resolved | 2 / 3 / 6 |
| Private processing / Mail processing stays on your computer. | 2 / 6 |
| Importing, checking, search, and verification reports happen on your computer. / No mail data leaves it. | 10 / 5 |
| Archive Plus pricing / The complete archive engine is free. | 3 / 6 |
| Import, duplicate checks, encryption, restoration, and verification reports stay free. | 9 |
| Archive Plus adds shortcuts for repeated migrations. | 7 |
| $29 one-time / Saved recent archive shortcuts / Compact attachment ledger | 2 / 4 / 3 |
| Buy Archive Plus / Have a license? Restore it | 3 / 5 |
| Dodo hosts checkout. / Revoked licenses no longer enable Plus. | 3 / 6 |
| Keep a checked local archive / Download the desktop archive / Download Mail Attachment Archive | 5 / 4 / 4 |
| Local attachment archives with verification reports. | 6 |
| Original generated hero imagery; provenance in the repository. | 8 |
| Restore Archive Plus / Paste the license token from your receipt. / It is stored only in this browser. | 3 / 7 / 7 |
| Paste a license token first. / Checking license… | 5 / 2 |
| Archive Plus is active on this device. | 7 |
| That license could not be verified. / Check the token and try again. | 7 / 6 |

### README

| Sentence / copy item | Words |
| --- | ---: |
| Mail Attachment Archive is a desktop app for people leaving or backing up an email account. | 16 |
| It keeps mail processing on their computer. / It turns an MBOX export into a local attachment list. | 7 / 10 |
| Duplicate files are stored once, and every failure stays in the verification report. | 13 |
| The import reads the MBOX export you choose and writes the archive folder you choose. | 15 |
| The desktop app uses Rust and Tauri 2. / The interface and website use Vite and TypeScript. | 8 / 8 |
| Try the sample / Open the isolated sample archive in one click. | 3 / 8 |
| It contains a closing statement, a deduplicated photo, and a damaged contract reference. | 13 |
| Resetting or leaving removes its separate demo: storage key. / The desktop first-run screen includes Load sample archive. | 9 / 8 |
| What it does | 3 |
| Reads standard MBOX exports and their attached files on your computer. | 11 |
| Hashes decoded attachment bytes with SHA-256 and deduplicates identical files. | 10 |
| Stores attachments without opening them, in .bin files named by checksum. | 11 |
| Optionally encrypts stored attachment files. / Your passphrase is never written to disk. | 5 / 7 |
| Re-verifies plain files when an archive is reopened. | 8 |
| Encrypted archives show no resolved score until you enter the passphrase and finish a full scan. | 16 |
| Searches by filename, sender, subject, or checksum. | 7 |
| Exports complete CSV and JSON verification reports, including failures. | 9 |
| Safely rejects MBOX exports over 256 MB before reading them into memory. | 12 |
| Split a larger export into smaller MBOX exports and import each one. | 12 |
| The app imports an exported file that you select. | 9 |
| Keep the source MBOX export until you review the verification report and restore important files. | 15 |
| Install / Download the detected installer at mail-attachment-archive.sociobot.in. | 1 / 6 |
| Read the release notes and compare downloads with the release SHA256SUMS file. | 12 |
| On macOS, right-click the application and choose Open the first time. / On Windows, confirm the SmartScreen prompt. | 11 / 6 |
| Linux AppImages may require FUSE 2 on older distributions; a .deb is also attached to each release. | 17 |
| Develop and verify | 3 |
| Requirements: Node.js 22+, npm, stable Rust, and the Tauri 2 system prerequisites. | 12 |
| Linux native claim tests also require xvfb and strace. | 9 |
| The deployable static site is exactly dist/site. / npm run build:site reproduces it directly. | 8 / 7 |
| GitHub Actions builds .dmg, .msi/.exe, .AppImage, and .deb assets on the appropriate OS when a v* tag is pushed. | 19 |
| It also publishes SHA256SUMS and latest.json. | 6 |
| Archive format / An archive is an ordinary folder. / The manifest format is versioned. | 2 / 6 / 5 |
| Each encrypted .maa file starts with its format marker, salt, nonce, and encrypted attachment bytes. | 15 |
| If decryption or the checksum fails, restoration stops without writing the destination file. | 13 |
| New archives include an encrypted passphrase check, so a wrong passphrase is not reported as file corruption. | 17 |
| A successful full scan writes a verification report. | 8 |
| Privacy, payment, and security | 4 |
| The free app includes import, duplicate checks, encryption, restoration, and all verification reports. | 13 |
| Archive Plus costs $29 once and adds workspace shortcuts. | 9 |
| Import, export, accessibility, and safety features remain free. | 8 |
| Dodo hosts checkout. / A revoked license no longer enables Plus features. | 3 / 7 |
| See the hosted privacy and terms pages. | 7 |
| Attachments can contain malware. / The app stores attachments without opening them. | 4 / 7 |
| A restored attachment should be scanned before opening. / Please report security issues privately to security@sociobot.in. | 8 / 8 |
| License / MIT. | 1 / 1 |
| The original generated hero artwork is documented in .factory/design.md. | 8 |

## Demo, claims, sandbox, and structure

- Direct demo immediately showed realistic use: three messages, four attachment references, one duplicate, a damaged contract reference, and 3 of 4 resolved. The persistent banner had Reset demo and Start for real.
- In fresh Android and iPhone contexts the only demo key was demo:mail-attachment-archive:state; Reset restored all four rows; Start for real removed it and returned to #download. Landing and full-demo request logs were same-origin only; cookies were empty.
- All 20 commands in claims.json passed. Native local-only and free-core built and launched the production Tauri binary under xvfb and strace; fresh artifacts recorded zero AF_INET or AF_INET6 connections. Free core rendered unlicensed import, encrypted reopen/scan, restore, CSV export, and JSON export success.
- Same-origin links returned 200; the deliberate unknown route returned the designed 404; the release link redirected as a download; checkout returned 303 to a Dodo session; mail links were explicit mailto links.
- Home, demo, Privacy, Terms, and the designed 404 have correct route titles, descriptions, canonicals, OG/Twitter metadata, favicons, Apple touch icons, one H1, main, header/footer, and skip links. Deep links and Back focus the H1 and announce the route. No console error or 390px overflow was observed.
- The evidentiary-geometry palette, clipped ledger panels, original archive art, and responsive evidence layout match design.md and are distinct from a generic SaaS template. The brief does not imply a useful missing AI feature or sync feature.

## Earlier finding re-check

Every earlier review, polish report, handoff, and verification report was read. Every prior finding was confirmed fixed live and in code:

| IDs | Re-check |
| --- | --- |
| F-1-1 | Phone user agents receive computer-only guidance, never a desktop artifact. |
| F-1-2 | Production Tauri import/reopen is network-traced with zero external connections. |
| F-1-3 | Production unlicensed flow visibly completes import, encrypted scan, restore, CSV, and JSON export. |
| F-1-4 | Four original captioned desktop workflow frames are present and responsive. |
| F-1-5 | Route changes and Back focus/announce the destination H1. |
| F-1-6 | All routes use the compact shared header and footer. |
| F-1-7, F-1-8 | Unsupported signing copy is absent; non-opening has a declared passing claim. |
| F-1-9, F-1-10, F-1-11, F-1-12, F-1-13, F-1-14, F-1-15, F-1-16 | Each named slogan/jargon heading and vague CTA is rewritten as recorded in the landing audit. |
| F-1-17, F-1-18, F-1-19 | MBOX export, verification report, and sample archive are consistent. |
| F-1-20, F-1-21, F-1-22, F-1-23, F-1-24, F-1-25, F-1-26, F-1-27, F-1-28 | The named README length, jargon, and safety issues are fixed. |
| F-1-29 | Helps fund future app updates is absent. |
| F-1-30 | Privacy, Terms, and 404 include the Apple touch icon. |
| F-2-1, F-2-2, F-2-3, F-2-4 | Broad no-login, mailbox, merchant, and refund copy was removed or narrowed to current passing claims. |
| F-2-5, F-2-7, F-2-8 | Contextless headings, user-facing crypto jargon, and the demo error were rewritten. |

## What would make this perfect

Add observable claim coverage for the named Archive Plus features, plain-file reopen integrity, and the release-workflow promises, or remove those promises. With those resolved, the product has a clear phone-first explanation, a safe one-click sample, verified local desktop behavior, and a coherent product-specific visual system.

