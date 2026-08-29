# Adversarial first-read review 2 — Mail Attachment Archive

Reviewed 29 August 2026 against `https://mail-attachment-archive.sociobot.in/`
and clean dependency installation from checkout `a4ae7081ccc0564eb98050ae4158a27a050bfa6b`.

## Verdict: FAIL

Three previously reported blockers remain. Their tests are green, but they
call Rust functions directly and do not prove the claims through the shipped
desktop product. Seven further copy and unlisted-claim findings remain. `PASS`
requires zero findings.

## Cold first read

Fresh Chromium contexts were used at 390 × 844 and 1440 × 900, with empty
browser storage. Before scrolling, the answer was clear on both:

| Question | First-screen answer | Result |
| --- | --- | --- |
| What does it do? | It turns an MBOX export into a checked local archive. | PASS |
| Who is it for? | People leaving or backing up an email account. | PASS |
| What should I click first? | **Try it with sample data**. | PASS |

The exact supporting copy is: “For people leaving or backing up an email
account, it turns an MBOX export into a checked local archive.” and “Opens a
separate demo. Nothing is saved.” The desktop title is `Mail Attachment
Archive — check an MBOX export`; the mobile and desktop loads had no console
or page errors.

## Findings

### Blocking

#### F-1-2 — Reopened: `local-only` still does not observe real desktop processing

- Location: `.factory/claims.json` `local-only`; `src-tauri/src/lib.rs:815`.
- Exact public claim: “Archive processing stays on your device.”
- The green test imports a temporary MBOX by calling `import_mbox()` directly,
  then checks that archive files exist. It does not launch the packaged Tauri
  app, record its outbound connections, or assert the claims manifest's stated
  “no network-capable command exists” condition.
- Why this remains blocking: a local archive appearing on disk is not evidence
  that the app made no network request while processing it. The prior review's
  required native traffic observation was not implemented; this is a
  filesystem-result test, not a privacy test.
- Fix: run a packaged desktop import/reopen of the shipped MBOX inside a
  network namespace or through a recording proxy, and assert zero connections
  or requests during the whole flow. Keep the existing filesystem assertions
  as supporting checks, not the sole proof.

#### F-1-3 — Reopened: `free-core` does not exercise the shipped desktop workflow

- Location: `.factory/claims.json` `free-core`; `src-tauri/src/lib.rs:878`.
- Exact public claim: “Import, reopen, encryption, restoration, and CSV or JSON
  verification report export remain available without a license.”
- The green test calls `import_mbox`, `load_manifest`, `verify_encrypted_archive`,
  `restore_attachment`, and `export_report` as Rust functions. It never opens
  the desktop product, chooses an MBOX/archive destination, reaches either
  export control, or proves that the command bridge and UI expose this flow
  without a license.
- Why this remains blocking: the prior finding specifically required the
  unlicensed *shipped app* outcome. A private-function test can stay green
  while an action is disconnected, gated, or broken in the desktop UI.
- Fix: add an installed-app/command-bridge end-to-end test that imports the
  bundled MBOX, reopens it, performs an encrypted scan and restore, then saves
  both report formats without a token. Assert the visible success states and
  resulting files.

#### F-1-29 — Reopened: the untestable funding-benefit wording is still present

- Location: landing Archive Plus feature list.
- Exact quote: “Helps fund future app updates”.
- Why this remains blocking: `polish-1.md` says F-1-29 removed the untestable
  funding benefit. The live page still makes that same visitor-facing,
  untestable appeal, so the earlier finding is neither fixed nor verifiable.
- Fix: delete the line. The two actual Plus features already state the offer.

### Major

#### F-2-1 — “Works without a mailbox login” is an unlisted claim

- Location: landing first-screen fact list.
- Exact quote: “Works without a mailbox login”.
- Why: this is a concrete reliance claim, but `claims.json` has no claim or
  test for the no-login path.
- Fix: add `no-mailbox-login` with a clean packaged-app/demo test that records
  no authentication navigation, cookies, or identity requests; otherwise
  remove the line.

#### F-2-2 — The README makes unlisted mailbox, upload, and telemetry promises

- Location: README opening.
- Exact quote: “The app does not connect to a mailbox, upload mail, or collect
  telemetry.”
- Why: `local-only` neither names nor observes all three promises. Its current
  direct Rust fixture does not prove telemetry absence in the shipped desktop
  app.
- Fix: either narrow this to the observed claim (“The import reads the MBOX you
  choose and writes the archive folder you choose.”) or add a single
  observable, packaged-app request-log claim covering all three statements.

#### F-2-3 — The README's non-deletion promise is unlisted

- Location: README, after “What it does”.
- Exact quote: “This is not an inbox replacement and does not delete mail from
  a provider.”
- Why: this is material to someone leaving an account, yet there is no claim
  entry or clean sandbox test for it.
- Fix: replace it with the directly observable “The app imports an MBOX export;
  it does not sign in to an email provider.” and cover that under the proposed
  no-login claim, or add a dedicated test.

#### F-2-4 — Checkout/refund copy carries two unlisted commercial claims

- Location: landing price panel.
- Exact quote: “Sociobot/Dodo is the merchant of record. Refunds revoke the
  license.”
- Why: `plus-price` proves a 303 to a Dodo checkout session, not merchant-of-
  record status or revocation on refund.
- Fix: retain only the tested checkout statement (“Checkout is hosted by
  Dodo.”), or add gateway fixtures/tests that prove the merchant and refund
  behaviour before displaying them.

### Minor

#### F-2-5 — Several headings/labels are slogans rather than section names

- Locations and quotes: hero eyebrow “Local by design · No mailbox login”; sample
  heading “See the files, not just the mailbox”; final heading “Your account
  can close. Your records should still open.”; footer “Local attachment
  archives with visible exceptions.”
- Why: these either make the visitor infer the feature or use “exceptions,” a
  term not used for the exported verification report. They fail the required
  out-of-context heading and terminology checks.
- Fix: use, respectively, “Local archive, no mailbox sign-in”, “Sample
  attachment records”, “Download the desktop archive”, and “Local attachment
  archives with verification reports”.

#### F-2-7 — README keeps avoidable cryptography jargon in its user-facing list

- Location: README “What it does”.
- Exact quote: “Optionally encrypts every stored file using Argon2-derived keys
  and XChaCha20-Poly1305.”
- Why: neither algorithm name helps a person decide what to do, and the line is
  harder to understand than the next sentence's useful passphrase promise.
- Fix: “Optionally encrypts stored attachment files. Your passphrase is never
  written to disk.” Move algorithm names to an implementation-format note.

#### F-2-8 — The demo describes an error with implementation jargon

- Location: `/demo/` verification panel.
- Exact quote: “Source data ended before decoding finished.”
- Why: “decoding” does not tell a first-time visitor what happened to the
  attachment.
- Fix: “The attachment data was incomplete, so this file could not be saved.”

## Demo and sandbox checks

`/?demo=1` immediately showed three messages, four attachment references, one
duplicate, “3 of 4” resolved, and a visible failed contract. The persistent
“Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for
real** controls were all present. Searching reduced the list, Reset restored
four rows and “Sample restored.”, and Start for real returned to `/#download`
with empty localStorage. The only key during the demo was
`demo:mail-attachment-archive:state`; it contains only a start time. A request
log for the complete demo flow contained only same-origin documents and assets.

The web demo sandbox therefore passes. The blocking findings above concern the
different claim that the real desktop processor itself has no network activity.

## Claims audit

All 18 declared commands passed after `npm ci` and the documented Tauri Linux
prerequisites (`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`,
`librsvg2-dev`, `patchelf`) were installed. Green command status does not
remove F-1-2 or F-1-3 because their assertions are insufficient for the stated
claims.

| Claim IDs | Exact command family | Result |
| --- | --- | --- |
| demo-sandbox, evidence-reports, sample-evidence, csv-report, archive-search, plus-price | `npm run test:e2e -- --grep @claim:<id>` | PASS |
| local-only, mbox-import, safe-mbox-limit, sha256-dedup, encrypted-integrity, restore-integrity, free-core, attachments-not-opened | `cargo test --manifest-path src-tauri/Cargo.toml <test>` | PASS (coverage blockers noted above) |
| license-daily, release-assets, verified-installers, ubuntu-support | `npm test -- --testNamePattern @claim:<id>` | PASS |

The live checkout endpoint returned HTTP 303 to a hosted
`checkout.dodopayments.com/session/cks_…` URL without completing a purchase.

## History re-check

Every historical document requested for this round was read:
`review-1.md`, `polish-1.md`, and `handoff.md`.

| Earlier finding(s) | Live/code confirmation |
| --- | --- |
| F-1-1 | PASS: Android/iPhone receive “Open this page on a computer”, not a desktop artifact. |
| F-1-2 | BLOCKING reopened above. |
| F-1-3 | BLOCKING reopened above. |
| F-1-4 | PASS: four captioned original desktop walkthrough frames are present. |
| F-1-5 | PASS: landing → demo and exit/Back focus the destination H1; route announcement exists. |
| F-1-6 | PASS: landing, demo, legal pages, and 404 use the shared compact navigation. |
| F-1-7–F-1-8 | PASS: unsupported unsigned-binary claim is absent; the no-opening claim has a capability/import test. |
| F-1-9–F-1-16 | PASS: the named contextless headings and vague final CTA were rewritten. F-2-5 records separate remaining slogan copy. |
| F-1-17–F-1-19 | PASS: MBOX export, verification report, and sample archive are used consistently for their intended objects. |
| F-1-20–F-1-28 | PASS: the listed overlong README copy and named jargon were revised. F-2-7 is a new, separate remaining jargon case. |
| F-1-29 | BLOCKING reopened above: the funding-benefit wording remains live. |
| F-1-30 | PASS: static privacy, terms, and 404 include the Apple touch icon. |

## Structure, links, accessibility, and visual identity

- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` have route-specific
  titles, one H1, one main landmark, descriptions, canonicals, OG metadata,
  favicon and Apple touch icon. The unknown-route response is HTTP 404 and is
  designed in the product's archive style.
- Same-site navigation, Back, focus movement, skip links, headers/footers,
  Privacy/Terms links, `robots.txt`, sitemap, CSP, and responsive 44px target
  checks pass. Crawled same-origin links were 200 (or the intentional 404);
  GitHub source was 200, the installer redirects to its release asset, and the
  checkout is the verified 303 above.
- Live mobile Axe scans on landing, demo, privacy, terms, and 404 reported zero
  serious or critical violations. No console errors were observed.
- The evidentiary-geometry visual system is distinct from a generic SaaS
  template and matches `.factory/design.md`.
- The brief does not imply a missing AI feature or cloud sync. The existing
  import, search, deduplication, restore, and CSV/JSON exports cover the
  obvious non-AI leverage; adding AI would not improve this local archive job.

## Copy audit

Word counts below use visible user-facing copy. Headings, labels, buttons, and
captions are included as copy items; URLs, commands, filenames, and code blocks
are excluded. No sentence exceeds 22 words. F-2-5, F-2-7, and F-2-8 are the
flagged copy findings.

### Landing page

| Copy item | Words |
| --- | ---: |
| Local by design · No mailbox login | 6 |
| Prove every attachment made it. | 5 |
| For people leaving or backing up an email account, it turns an MBOX export into a checked local archive. | 19 |
| Try it with sample data | 5 |
| Opens a separate demo. | 4 |
| Nothing is saved. | 3 |
| Mail stays on your device | 5 |
| Core archive tools are free | 5 |
| Works without a mailbox login | 5 |
| Download for Linux | 3 |
| AppImage · Ubuntu 22.04+ | 3 |
| Many references. | 2 |
| One verified copy of each file. | 6 |
| How attachment checks work | 4 |
| Check every attachment result | 4 |
| An MBOX export can exist while useful files are missing. | 10 |
| This archive shows each attachment result. | 6 |
| Import the MBOX export | 4 |
| Choose a standard MBOX export. | 5 |
| The app reads it locally and never connects to your email account. | 12 |
| Verify each attachment | 3 |
| Attachments are decoded, checked, and stored once—even when the same file appears in many threads. | 16 |
| Review every failed attachment | 4 |
| Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report. | 14 |
| Desktop walkthrough | 2 |
| Review the archive before you download | 6 |
| These frames show the desktop steps for an MBOX export and its verification report. | 14 |
| Choose an MBOX export. | 5 |
| Choose a local archive folder. | 6 |
| Review the verification report. | 5 |
| Restore a checksum-verified file. | 5 |
| Sample archive | 2 |
| See the files, not just the mailbox | 7 |
| 3 of 4 sample references resolved | 6 |
| Private processing | 2 |
| Mail processing stays on your computer. | 6 |
| Importing, checking, search, and verification reports happen on your computer. | 10 |
| No mail data leaves it. | 5 |
| Archive Plus pricing | 3 |
| The complete archive engine is free. | 6 |
| Import, duplicate checks, encryption, restoration, and verification reports stay free. | 9 |
| Archive Plus adds shortcuts for repeated migrations. | 7 |
| $29 one-time | 2 |
| Saved recent archive shortcuts | 4 |
| Compact attachment ledger | 3 |
| Helps fund future app updates | 5 |
| Buy Archive Plus | 3 |
| Have a license? Restore it | 5 |
| Sociobot/Dodo is the merchant of record. | 7 |
| Refunds revoke the license. | 4 |
| Keep a checked local archive | 5 |
| Your account can close. | 5 |
| Your records should still open. | 5 |
| Download Mail Attachment Archive | 4 |
| Local attachment archives with visible exceptions. | 6 |
| Original generated hero imagery; provenance in the repository. | 8 |

All visible landing buttons name an outcome or destination, except the
phone-only disabled instruction “Open this page on a computer”; it does not
misrepresent an available download.

### README

| Sentence / copy item | Words |
| --- | ---: |
| Mail Attachment Archive is a desktop app for people leaving or backing up an email account. | 16 |
| It keeps mail processing on their computer. | 7 |
| It turns an MBOX export into a local attachment list. | 10 |
| Duplicate files are stored once, and every failure stays in the verification report. | 13 |
| The app does not connect to a mailbox, upload mail, or collect telemetry. | 13 |
| The desktop app uses Rust and Tauri 2. | 8 |
| The interface and website use Vite and TypeScript. | 8 |
| Try the sample | 3 |
| Open the isolated sample archive in one click. | 8 |
| It contains a closing statement, a deduplicated photo, and a damaged contract reference. | 13 |
| Resetting or leaving removes its separate demo storage key. | 9 |
| The desktop first-run screen includes Load sample archive. | 8 |
| What it does | 3 |
| Reads standard MBOX exports and their attached files on your computer. | 11 |
| Hashes decoded attachment bytes with SHA-256 and deduplicates identical files. | 10 |
| Stores attachments without opening them, in `.bin` files named by checksum. | 11 |
| Optionally encrypts every stored file using Argon2-derived keys and XChaCha20-Poly1305. | 9 |
| Passphrases are never written to disk. | 6 |
| Re-verifies plain files when an archive is reopened. | 8 |
| Encrypted archives show no resolved score until you enter the passphrase and finish a full scan. | 16 |
| Searches by filename, sender, subject, or checksum. | 7 |
| Exports complete CSV and JSON verification reports, including failures. | 9 |
| Safely rejects MBOX exports over 256 MB before reading them into memory. | 12 |
| Split a larger export into smaller MBOX exports and import each one. | 12 |
| This is not an inbox replacement and does not delete mail from a provider. | 14 |
| Keep the source MBOX export until you have reviewed the verification report and restored samples. | 15 |
| Install | 1 |
| Download the detected installer at mail-attachment-archive.sociobot.in. | 6 |
| Read the release notes and compare downloads with the release SHA256SUMS file. | 12 |
| On macOS, right-click the application and choose Open the first time. | 11 |
| On Windows, confirm the SmartScreen prompt. | 6 |
| Linux AppImages may require FUSE 2 on older distributions; a `.deb` is also attached to each release. | 17 |
| Develop and verify | 3 |
| Requirements: Node.js 22+, npm, stable Rust, and the Tauri 2 system prerequisites. | 12 |
| The deployable static site is exactly `dist/site/`. | 8 |
| `npm run build:site` reproduces it directly. | 7 |
| GitHub Actions builds platform assets when a `v*` tag is pushed. | 11 |
| It also publishes SHA256SUMS and latest.json. | 6 |
| Archive format | 2 |
| An archive is an ordinary folder. | 6 |
| The manifest format is versioned. | 5 |
| Each encrypted `.maa` file starts with its format marker, salt, nonce, and encrypted attachment bytes. | 15 |
| If decryption or the checksum fails, restoration stops without writing the destination file. | 13 |
| New archives include an encrypted passphrase check, so a wrong passphrase is not reported as file corruption. | 17 |
| A successful full scan writes a verification report. | 8 |
| Privacy, payment, and security | 4 |
| The free app includes import, duplicate checks, encryption, restoration, and all verification reports. | 13 |
| Archive Plus costs $29 once and adds workspace shortcuts. | 9 |
| Import, export, accessibility, and safety features remain free. | 8 |
| See the hosted privacy and terms pages. | 7 |
| Attachments can contain malware. | 4 |
| The app stores attachments without opening them. | 7 |
| A restored attachment should be scanned before opening. | 8 |
| Please report security issues privately to security@sociobot.in. | 8 |
| License | 1 |
| MIT. | 1 |
| The original generated hero artwork is documented in `.factory/design.md`. | 8 |

## What would make this perfect

Make the two core desktop claims observable through the packaged app, list or
remove every remaining reliance claim, and replace the six flagged copy items
copy with the proposed plain wording. Then a repeat cold review could reach
zero findings.
