# Adversarial first-read review 1 — Mail Attachment Archive

Reviewed 28 August 2026 against
`https://mail-attachment-archive.sociobot.in/` from a clean checkout of
`7066e0921fa27a0bd982c5519da2e0545d4f06a8`.

## Verdict: FAIL

The first screen is unusually clear and the one-click demo works. The product
still fails this review. A real Android phone is offered a Linux AppImage and
an iPhone is offered a macOS DMG. The desktop-class demo also lacks the required
captioned screenshot walkthrough. Two declared claims still have tests that do
not prove the full promised outcome. There are 30 findings: 4 blocking, 5
major, and 21 minor.

## First read before scrolling

Fresh contexts were opened at 390 × 844 and 1440 × 900. No prior product
context or storage was used.

| Question | Answer from the first screen | Result |
| --- | --- | --- |
| What does it do? | It checks an MBOX export and makes a local archive whose missing attachments remain visible. | PASS |
| For whom? | People leaving or backing up an email account. | PASS |
| What should I click first? | **Try it with sample data**; the adjacent text says that it opens a separate unsaved demo. | PASS |

The exact first-screen text that supplied those answers was “Prove every
attachment made it.”, “For people leaving or backing up an email account, it
turns an MBOX export into a checked local archive.”, and “Try it with sample
data” followed by “Opens a separate demo. Nothing is saved.” The headline is
five words, the audience sentence is 19 words, and the primary action is
visible without scrolling on both viewports.

The first screen nevertheless contains the blocking mobile download defect in
F-1-1.

## Findings

### Blocking

#### F-1-1 — Phone visitors are offered incompatible desktop installers

- Exact location: landing first screen, `#platform-download` and
  `#platform-note`.
- Observed quote on a Pixel 7 user agent: “Download for Linux” / “AppImage ·
  Ubuntu 22.04+”. The link downloads
  `Mail.Attachment.Archive_0.1.4_amd64.AppImage`.
- Observed quote on an iPhone 13 user agent: “Download for macOS” / “Apple
  Silicon · Intel Mac download”. The main link downloads a `.dmg`.
- Why this fails: this is a desktop app, but the first screen detects Android
  as Linux and iOS as macOS. A phone visitor is directed to a file that cannot
  run on that device. The design contract specifically says the phone site
  should explain the desktop workflow.
- Concrete fix: detect Android and iOS before desktop platforms. Replace the
  download link on phones with “Open this page on a computer” and the note
  “Available for macOS, Windows, and Linux.” Add Pixel and iPhone regression
  tests that assert no `.AppImage`, `.deb`, `.dmg`, or `.exe` is offered.

#### F-1-2 — `local-only` still does not test desktop mail processing

- Exact claim: “Mail processing stays on the user's device and the demo sends
  no data off origin.”
- Exact test: `npm run test:e2e -- --grep @claim:local-only`.
- What it proves: the web demo makes no off-origin request while a canned
  sample is searched and filtered.
- What it does not prove: the first clause about real desktop mail processing.
  This is the same incomplete-coverage issue recorded in independent
  verification 2; later PASS notes did not add native request instrumentation.
- Why this fails: a privacy claim must be observed across the real processing
  flow, not inferred from an unrelated browser-only sample.
- Concrete fix: instrument a packaged desktop import in a network namespace or
  proxy, import the shipped MBOX, and assert zero mail-data requests. Either add
  that observable check to the single `@claim:local-only` test or narrow the
  claim and public copy to the web demo only.

#### F-1-3 — `free-core` is still a presence-only claim test

- Exact claim: “Import, open, sample, search, and CSV or JSON report export
  remain available without a license.”
- Exact test: `npm run test:e2e -- --grep @claim:free-core`.
- Evidence: `tests/e2e/site.spec.ts` only checks that Import, Open, Export CSV,
  and Export JSON controls are visible. It does not complete import, reopen, or
  either export without a license. This is the same issue called out in
  independent verification 2.
- Why this fails: the claims contract explicitly rejects tests that merely
  assert a button exists. The landing page and README also promise free
  encryption, restoration, and every safety report, which this claim and test
  omit.
- Concrete fix: drive an unlicensed packaged app through import, reopen,
  encrypted scan, restore, CSV export, and JSON export, then assert the files
  and reports. Expand the claim text to cover encryption/restoration or narrow
  the public copy to the outcomes actually tested.

#### F-1-4 — The desktop product has no captioned screenshot walkthrough

- Exact location: landing page after the hero. The page has generated hero art,
  three text steps, and a sample ledger, but no 3–5 frame app walkthrough.
- Why this fails: the attached desktop demo contract requires a short,
  captioned screenshot walkthrough on the landing page in addition to “Load
  sample project.” A visitor can inspect the web demo but cannot see the native
  import, destination, verification, and restore flow before downloading.
- Concrete fix: add 3–5 original screenshots showing “Choose MBOX”, “Choose
  archive folder”, “Review the verification report”, and “Restore a checked
  file”. Give each a plain caption and useful alt text, and test their presence
  at desktop and 390 px.

### Major

#### F-1-5 — Route changes lose focus and are not announced

- Exact location: landing → `/demo/` and browser Back.
- Evidence: after activating “Try it with sample data”, `document.activeElement`
  is `<body>`, not the demo `<h1>`. After Back it is again `<body>`. There is no
  route-announcement live region.
- Why this fails: keyboard and screen-reader users receive no focus or spoken
  confirmation that a new page loaded. It also misses the site-structure
  requirement for focus restoration on route changes.
- Concrete fix: on same-site route entry focus the new `h1` with
  `tabindex="-1"`, announce its text in a persistent `aria-live="polite"`
  region, and add forward/back Playwright assertions.

#### F-1-6 — The required header is not consistent across routes

- Exact locations: `/` has “Demo / How it works / Pricing / Download” but no
  Privacy link; `/demo/` has only “Sample archive”; `/privacy/`, `/terms/`, and
  the 404 have only a back-linked wordmark.
- Why this fails: visitors lose the standard site navigation when they enter
  the demo or legal pages. The attached site skeleton requires a consistent
  wordmark/home and compact navigation including Privacy.
- Concrete fix: render one shared header on every route, with the home
  wordmark and no more than four links such as Demo, How it works, Download,
  and Privacy. Preserve the demo status as a separate badge.

#### F-1-7 — The unsigned-binary claim is unlisted

- Exact quote/location: README Install, “Release binaries are currently
  unsigned; compare their SHA-256 hashes with the release `SHA256SUMS` file.”
- Why this fails: signing status is a safety fact a downloader will rely on,
  but `.factory/claims.json` contains no signing-status claim or test.
- Concrete fix: add a claim that inspects every published artifact for the
  expected unsigned status and preserves the checksum guidance, or replace the
  changing status assertion with a link to release-specific notes.

#### F-1-8 — The no-preview/no-launch safety claim is unlisted

- Exact quote/location: README Privacy, payment, and security, “The app never
  previews or launches them.”
- Why this fails: this is a material malware-safety promise. The
  `restore-integrity` test proves hash verification before writing a restored
  file, but it does not prove that the app never previews or launches one.
- Concrete fix: add a dedicated claim and test against the packaged command
  allowlist/UI flow, or rewrite to the narrower tested statement: “The app
  stores attachments without opening them.” and test that behavior.

#### F-1-30 — Static legal and 404 routes omit the touch icon

- Exact locations: the live `/privacy/`, `/terms/`, and unknown-route 404
  documents have the SVG favicon but no `<link rel="apple-touch-icon">`.
- Why this fails: secondary routes do not carry the complete required icon
  metadata, so saved home-screen links can lose the product identity.
- Concrete fix: add `/assets/apple-touch-icon.png` to all three static heads
  and extend the route-metadata test to assert both icon relations on every
  route.

### Minor — copy and terminology

#### F-1-9 — “The evidence pass” is contextless jargon

- Location: landing section eyebrow.
- Why: it does not say what the section teaches.
- Rewrite: “How attachment checks work”.

#### F-1-10 — “A backup you can interrogate” is metaphorical

- Location: landing section heading.
- Why: “interrogate” does not name a user result.
- Rewrite: “Check every attachment result”.

#### F-1-11 — “Resolve and hash” uses implementation jargon

- Location: landing step 2 heading.
- Why: a first-time visitor should not need to know what hashing means.
- Rewrite: “Verify each attachment”.

#### F-1-12 — “Keep the exceptions” uses internal terminology

- Location: landing step 3 heading.
- Why: “exceptions” can mean software errors or special cases.
- Rewrite: “Review every failed attachment”.

#### F-1-13 — “There is no cloud to trust” is indirect

- Location: landing privacy heading.
- Why: it makes the visitor infer the actual privacy behavior.
- Rewrite: “Mail processing stays on your computer”.

#### F-1-14 — “Pay once, when it earns your trust” is marketing copy

- Location: landing pricing eyebrow.
- Why: it does not label the section out of context.
- Rewrite: “Archive Plus pricing”.

#### F-1-15 — “Leave with evidence” is contextless

- Location: landing final-callout eyebrow.
- Why: it does not identify the action or artifact.
- Rewrite: “Keep a checked local archive”.

#### F-1-16 — “Get Mail Attachment Archive” does not name the result

- Location: landing final action.
- Why: “Get” is vague and the link merely jumps back to the download control.
- Rewrite: “Download Mail Attachment Archive”.

#### F-1-17 — “MBOX file” and “MBOX export” name the same input differently

- Locations: landing “Choose a standard MBOX file”; README uses both “MBOX
  export” and “MBOX files”.
- Why: the product's terminology table specifies “MBOX export”.
- Rewrite: use “MBOX export” throughout.

#### F-1-18 — The report has three names

- Locations: landing/README use “verification report”, “evidence reports”,
  “safety report”, and bare “report”.
- Why: a visitor cannot know whether these are different outputs.
- Rewrite: use “verification report” for the exported CSV/JSON everywhere.

#### F-1-19 — The sample has two names

- Locations: README “sample archive” and “Load sample project”; the desktop
  button also says “Load sample project”.
- Why: “project” suggests a different object from an archive.
- Rewrite: “Load sample archive”.

#### F-1-20 — One README sentence exceeds 22 words

- Exact quote (25 words): “It turns an MBOX export into a browsable attachment
  manifest, stores duplicate files only once, and produces evidence for every
  missing, malformed, or corrupt item.”
- Rewrite: “It turns an MBOX export into a local attachment list. Duplicate
  files are stored once, and every failure stays in the verification report.”

#### F-1-21 — “local-first” is unexplained jargon in the README

- Exact quote: “Mail Attachment Archive is a local-first desktop utility for
  people leaving or backing up an email account.”
- Rewrite: “Mail Attachment Archive is a desktop app for people leaving or
  backing up an email account. It keeps mail processing on their computer.”

#### F-1-22 — “dependency-light” is a vague marketing adjective

- Exact quote: “The desktop core is Rust/Tauri 2; the interface and landing
  site are dependency-light Vite/TypeScript.”
- Rewrite: “The desktop app uses Rust and Tauri 2. The interface and website
  use Vite and TypeScript.”

#### F-1-23 — “MIME attachment parts” is unexplained jargon

- Exact quote: “Parses standard MBOX exports and MIME attachment parts
  locally.”
- Rewrite: “Reads standard MBOX exports and their attached files on your
  computer.”

#### F-1-24 — “inertly” is not plain language

- Exact quote: “Stores attachments inertly as hash-named `.bin` files.”
- Rewrite: “Stores attachments without opening them, in `.bin` files named by
  checksum.”

#### F-1-25 — “passphrase-gated” is compressed jargon

- Exact quote: “Encrypted archives show no resolved score until a
  passphrase-gated full scan finishes.”
- Rewrite: “Encrypted archives show no resolved score until you enter the
  passphrase and finish a full scan.”

#### F-1-26 — “authenticated ciphertext” is unexplained jargon

- Exact quote: “Encrypted `.maa` records start with a four byte `MAA1` marker,
  a random 16-byte salt, a random 24-byte nonce, and the authenticated
  ciphertext.”
- Rewrite: “Each encrypted `.maa` file starts with its format marker, salt,
  nonce, and encrypted attachment bytes.” Link the field names to a format
  specification if implementers need the cryptographic detail.

#### F-1-27 — “fails closed” is security jargon

- Exact quote: “Restoration fails closed if authentication or the recorded
  SHA-256 checksum does not match.”
- Rewrite: “If decryption or the checksum fails, restoration stops without
  writing the destination file.”

#### F-1-28 — The Archive Plus sentence is too long and uses product jargon

- Exact quote (23 words): “Archive Plus is a $29 one-time convenience unlock
  verified by the Sociobot billing API; it does not gate accessibility, data
  export, or safety.”
- Rewrite: “Archive Plus costs $29 once and adds workspace shortcuts. Import,
  export, accessibility, and safety features remain free.”

#### F-1-29 — “Support continued local-first updates” is vague and untested

- Location: landing Archive Plus benefit list.
- Why: it neither names a buyer result nor maps to a claim test.
- Rewrite: “Helps fund future app updates.” If retained as a factual funding
  promise, list and test or document how purchase revenue supports updates.

## Landing copy audit

Counts use whitespace-delimited words; hyphenated and slash-separated terms
count as one. This table includes every rendered prose sentence, including the
restore dialog. Data-table cells are sample records, not sentences. Headings
and actions are audited separately below.

| # | Sentence | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Local by design. | 3 | — |
| 2 | No mailbox login. | 3 | — |
| 3 | Prove every attachment made it. | 5 | — |
| 4 | For people leaving or backing up an email account, it turns an MBOX export into a checked local archive. | 19 | — |
| 5 | Opens a separate demo. | 4 | — |
| 6 | Nothing is saved. | 3 | — |
| 7 | Mail stays on your device. | 5 | F-1-2 coverage |
| 8 | Core archive tools are free. | 5 | F-1-3 coverage |
| 9 | Works without a mailbox login. | 5 | F-1-2 coverage |
| 10 | Many references. | 2 | — |
| 11 | One verified copy of each file. | 6 | — |
| 12 | A mailbox blob can exist while its useful files are missing. | 11 | — |
| 13 | This archive makes each result inspectable. | 6 | — |
| 14 | Choose a standard MBOX file. | 5 | F-1-17 |
| 15 | The app reads messages locally and never connects to your email account. | 12 | F-1-2 coverage |
| 16 | Attachments are decoded, SHA-256 hashed, and stored once—even when the same file appears in many threads. | 17 | — |
| 17 | Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report. | 14 | — |
| 18 | Parsing, hashing, search, and reports happen on your computer. | 9 | F-1-2 coverage |
| 19 | No analytics, accounts, ads, or mail metadata leave it. | 9 | F-1-2 coverage |
| 20 | The complete archive engine is free. | 6 | F-1-3 coverage |
| 21 | Import, deduplication, encryption, restoration, and every safety report stay available to everyone. | 12 | F-1-3, F-1-18 |
| 22 | Archive Plus adds convenience for people managing repeated migrations. | 9 | — |
| 23 | Sociobot/Dodo is the merchant of record. | 6 | — |
| 24 | Refunds revoke the license. | 4 | — |
| 25 | Your account can close. | 4 | — |
| 26 | Your records should still open. | 5 | — |
| 27 | Local attachment archives with visible exceptions. | 6 | F-1-18 |
| 28 | Built by Param Factory. | 4 | — |
| 29 | Original generated hero imagery; provenance in the repository. | 8 | — |
| 30 | Paste the license token from your receipt. | 7 | — |
| 31 | It is stored only in this browser. | 7 | — |

No landing sentence exceeds 22 words and no banned word from the attached
plain-words list appears. The flagged non-sentence copy is:

| Type | Copy | Words | Flag |
| --- | --- | ---: | --- |
| Heading | The evidence pass | 3 | F-1-9 |
| Heading | A backup you can interrogate | 5 | F-1-10 |
| Heading | Import the export | 3 | F-1-17 |
| Heading | Resolve and hash | 3 | F-1-11 |
| Heading | Keep the exceptions | 3 | F-1-12 |
| Heading | Sample archive | 2 | — |
| Heading | See the files, not just the mailbox | 7 | — |
| Heading | Your mail is not our data | 6 | — |
| Heading | Pay once, when it earns your trust | 7 | F-1-14 |
| Heading | Leave with evidence | 3 | F-1-15 |
| Heading | Restore Archive Plus | 3 | — |
| Action | Try it with sample data | 5 | — |
| Action | Download for Linux | 3 | F-1-1 on phones |
| Action | Buy Archive Plus | 3 | — |
| Action | Have a license? Restore it | 5 | — |
| Action | Get Mail Attachment Archive | 4 | F-1-16 |
| Action | Verify license | 2 | — |
| Benefit | Saved recent archive shortcuts | 4 | — |
| Benefit | Compact attachment ledger | 3 | — |
| Benefit | Support continued local-first updates | 4 | F-1-29 |

Navigation labels, form labels, table headers, filenames, statuses, hashes,
prices, and measurements were also checked. They are short labels rather than
sentences and add no further copy finding.

## README copy audit

Code blocks are commands or file trees rather than prose and are excluded.
Markdown links and emphasis are normalized to their visible text. Headings are
included so they can be checked out of context.

| # | Sentence or heading | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Mail Attachment Archive | 3 | — |
| 2 | Mail Attachment Archive is a local-first desktop utility for people leaving or backing up an email account. | 17 | F-1-21 |
| 3 | It turns an MBOX export into a browsable attachment manifest, stores duplicate files only once, and produces evidence for every missing, malformed, or corrupt item. | 25 | F-1-20 |
| 4 | The app does not connect to a mailbox, upload mail, execute attachments, or collect telemetry. | 15 | F-1-2, F-1-8 coverage |
| 5 | The desktop core is Rust/Tauri 2; the interface and landing site are dependency-light Vite/TypeScript. | 14 | F-1-22 |
| 6 | Try the sample | 3 | — |
| 7 | Open the isolated sample archive in one click. | 8 | — |
| 8 | It contains a closing statement, a deduplicated photo, and a damaged contract reference. | 13 | — |
| 9 | Resetting or leaving removes its separate `demo:` storage key. | 9 | — |
| 10 | The desktop first-run screen includes **Load sample project**. | 8 | F-1-19 |
| 11 | What it does | 3 | — |
| 12 | Parses standard MBOX exports and MIME attachment parts locally. | 9 | F-1-23 |
| 13 | Hashes decoded attachment bytes with SHA-256 and deduplicates identical files. | 10 | — |
| 14 | Stores attachments inertly as hash-named `.bin` files. | 7 | F-1-24 |
| 15 | Optionally encrypts every stored file using Argon2-derived keys and XChaCha20-Poly1305. | 10 | — |
| 16 | Passphrases are never written to disk. | 6 | — |
| 17 | Re-verifies plain files when an archive is reopened. | 8 | — |
| 18 | Encrypted archives show no resolved score until a passphrase-gated full scan finishes. | 12 | F-1-25 |
| 19 | Searches by filename, sender, subject, or checksum. | 7 | — |
| 20 | Exports complete CSV and JSON evidence reports, including failures. | 9 | F-1-18 |
| 21 | Safely rejects MBOX files over 256 MB before reading them into memory. | 12 | F-1-17 |
| 22 | Split a larger export into smaller MBOX files and import each one. | 12 | F-1-17 |
| 23 | This is not an inbox replacement and does not delete mail from a provider. | 14 | — |
| 24 | Keep the source MBOX until you have reviewed the report and restored samples. | 13 | F-1-18 |
| 25 | Install | 1 | — |
| 26 | Download the detected installer at mail-attachment-archive.sociobot.in. | 6 | F-1-1 on phones |
| 27 | Release binaries are currently unsigned; compare their SHA-256 hashes with the release `SHA256SUMS` file. | 14 | F-1-7 |
| 28 | Linux/macOS: | 1 | — |
| 29 | Windows PowerShell: | 2 | — |
| 30 | On macOS, right-click the application and choose **Open** the first time. | 11 | — |
| 31 | On Windows, confirm the SmartScreen prompt. | 6 | — |
| 32 | Linux AppImages may require FUSE 2 on older distributions; a `.deb` is also attached to each release. | 17 | — |
| 33 | Develop and verify | 3 | — |
| 34 | Requirements: Node.js 22+, npm, stable Rust, and the Tauri 2 system prerequisites. | 12 | — |
| 35 | The deployable static site is exactly `dist/site/`. | 7 | — |
| 36 | `npm run build:site` reproduces it directly. | 6 | — |
| 37 | GitHub Actions builds `.dmg`, `.msi`/`.exe`, `.AppImage`, and `.deb` assets on the appropriate OS when a `v*` tag is pushed. | 19 | — |
| 38 | It also publishes `SHA256SUMS` and `latest.json`. | 6 | — |
| 39 | Archive format | 2 | — |
| 40 | An archive is an ordinary folder: | 6 | — |
| 41 | The manifest format is versioned. | 5 | — |
| 42 | Encrypted `.maa` records start with a four byte `MAA1` marker, a random 16-byte salt, a random 24-byte nonce, and the authenticated ciphertext. | 22 | F-1-26 |
| 43 | Restoration fails closed if authentication or the recorded SHA-256 checksum does not match. | 13 | F-1-27 |
| 44 | New archives include an independently encrypted passphrase check, so a wrong passphrase is not reported as file corruption. | 18 | — |
| 45 | A successful full scan writes an explicit verification report. | 9 | — |
| 46 | Privacy, payment, and security | 4 | — |
| 47 | The free app includes import, deduplication, encryption, restoration, and all safety reports. | 12 | F-1-3, F-1-18 |
| 48 | Archive Plus is a $29 one-time convenience unlock verified by the Sociobot billing API; it does not gate accessibility, data export, or safety. | 23 | F-1-28 |
| 49 | See the hosted `/privacy/` and `/terms/` pages. | 7 | — |
| 50 | Attachments can contain malware. | 4 | — |
| 51 | The app never previews or launches them. | 7 | F-1-8 |
| 52 | A restored attachment should be scanned before opening. | 8 | — |
| 53 | Please report security issues privately to `security@sociobot.in`. | 7 | — |
| 54 | License | 1 | — |
| 55 | MIT. | 1 | — |
| 56 | The original generated hero artwork is documented in `.factory/design.md`. | 9 | — |

README prose averages 10.7 words per sentence. Two sentences exceed the
22-word cap: rows 3 and 47.

## Demo and sandbox evidence

- One click from the hero opened `/demo/` with four attachment rows already
  visible: a statement, two references to one photo, and a failed contract.
- The persistent banner said “Demo — sample data, nothing is saved” and exposed
  **Reset demo** and **Start for real**.
- Searching “statement” reduced the list to one row. Reset restored four rows,
  cleared the search, and announced “Sample restored.”
- Sentinel real values in `sb_license:mail-attachment-archive`, its verdict key,
  and a recent-data key remained byte-for-byte unchanged. Leaving removed only
  `demo:mail-attachment-archive:state`.
- The complete landing → demo → search → reset → exit request log contained
  only `https://mail-attachment-archive.sociobot.in` requests. There were no
  console or page errors.
- CSV and JSON downloads passed their declared observable tests.

The sandbox itself passes. F-1-4 concerns the separately required desktop
walkthrough, not the web sample's behavior.

## Claims audit

All commands were run exactly as listed from a fresh clone. The documented
Tauri Linux prerequisites were absent initially, so the five Rust commands
first stopped at `glib-sys` compilation. After installing
`libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, and `patchelf`,
all five exact commands passed. That setup failure is not counted as a product
test failure because the README links the required prerequisites.

| Claim | Declared command | Result |
| --- | --- | --- |
| `demo-sandbox` | Playwright grep | PASS, 2/2 |
| `local-only` | Playwright grep | Command PASS, 2/2; contract coverage FAIL, F-1-2 |
| `mbox-import` | filtered Cargo test | PASS, 1/1 |
| `safe-mbox-limit` | filtered Cargo test | PASS, 1/1 |
| `sha256-dedup` | filtered Cargo test | PASS, 1/1 |
| `encrypted-integrity` | filtered Cargo test | PASS, 1/1 |
| `restore-integrity` | filtered Cargo test | PASS, 1/1 |
| `evidence-reports` | Playwright grep | PASS, 2/2 |
| `sample-evidence` | Playwright grep | PASS, 2/2 |
| `csv-report` | Playwright grep | PASS, 2/2 |
| `archive-search` | Playwright grep | PASS, 2/2 |
| `plus-price` | Playwright grep plus live 303 | PASS, 2/2 |
| `free-core` | Playwright grep | Command PASS, 2/2; contract coverage FAIL, F-1-3 |
| `license-daily` | filtered Vitest | PASS, 1/1 |
| `release-assets` | filtered Vitest | PASS, 1/1 |
| `verified-installers` | filtered Vitest | PASS, 1/1 |
| `ubuntu-support` | filtered Vitest | PASS, 1/1 |

No declared command has a failing assertion. F-1-7, F-1-8, and F-1-29 are
claim-like README/landing statements without their own entries. F-1-2 and
F-1-3 leave part of their listed claims untested.

## History audit

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
The current handoff and all six earlier independent verification reports were
read. Each earlier defect was checked in live behavior and source rather than
accepted from its status label.

| Earlier finding | Current result and evidence |
| --- | --- |
| V1: claims manifest missing | FIXED — 17 entries and tag-uniqueness test. |
| V1: no one-click demo | FIXED — live one-click flow and isolation verified. |
| V1: encrypted corruption not reported | FIXED — exact Rust mutation/reopen test passes. |
| V1: no CSP | FIXED — restrictive live CSP is present. |
| V1: hashed assets cached for 30 seconds | FIXED — live JS is `max-age=31536000, immutable`. |
| V1: no real 404 | FIXED — unknown route returns styled HTTP 404. |
| V1: audience absent above fold | FIXED — exact 19-word audience sentence is visible. |
| V2: claim tests bypass the shipped outcome | PARTLY FIXED — importer/report paths improved; `local-only` and `free-core` remain F-1-2/F-1-3. |
| V2: failed references omitted from denominator | FIXED — mixed-success Rust test retains two references and the live sample shows 3 of 4. |
| V2: installed app cannot restore a license | FIXED — token input and verification action exist, with dialog tests. |
| V2: JSON export unreachable | FIXED — visible demo and app JSON actions; download test passes. |
| V2: touch targets below 44 px | FIXED — live manual bounds and all-route mobile regression pass. |
| V2: unbounded MBOX buffering | FIXED WITH DOCUMENTED LIMIT — 256 MB + 1 byte rejection test passes. |
| V2: filesystem recovery incomplete | FIXED — export and reopen paths catch and show errors. |
| V2: installer/Ubuntu claims unlisted | FIXED — dedicated entries and tests pass. |
| V3: Archive Plus checkout returns 404 | FIXED — live endpoint returns 303 to hosted Dodo checkout. |
| V4: modal focus escapes | FIXED — forward/reverse wrapping and trigger restoration test passes. |
| V4: demo home retains demo key | FIXED — live home/Start for real paths remove only the demo key. |
| V4: Rust formatting gate fails | FIXED — `cargo fmt --check` passes. |
| V4: route metadata incomplete | FIXED — route titles, descriptions, canonicals, OG/Twitter metadata present. |
| V4: 404 skeleton/footer incomplete | FIXED for the cited elements — skip link, legal links, version, and Param Factory text are present. F-1-6 is a broader header-consistency defect. |
| V5: published installers do not match candidate | FIXED — live manifest points to v0.1.4 source `62f8752…`, matching the tag, with five checksummed assets. |

## Structure, accessibility, privacy, and links

Verified passes:

- Landing title is “Mail Attachment Archive — check an MBOX export” (46
  characters). Demo, Privacy, Terms, and 404 each have route-specific titles.
- Every checked route has exactly one `h1`, one `main`, `lang="en"`, a meta
  description, canonical, Open Graph/Twitter image metadata, and an SVG
  favicon. The missing secondary-route touch icons are F-1-30.
- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. An unknown path returns
  the designed 404 with routes home and to the sample.
- Every internal link crawled successfully. The source repository and current
  Linux asset resolve successfully. Mail links are explicit. The checkout
  intentionally returns 303 to `checkout.dodopayments.com`.
- Live Axe scans found zero violations at 390 px on landing, demo, legal pages,
  and 404. The deployment verifier reported no missing alt text, unnamed
  buttons, console errors, or page errors.
- The page does not overflow at 390 px, touch targets pass the 44 px regression,
  the skip link works, focus rings are visible, and reduced motion leaves no
  running animation.
- Landing and demo requests are same-origin only. There are no third-party
  fonts, scripts, pixels, trackers, or analytics requests.
- The evidentiary-grid palette, clipped panels, generated archive geometry,
  monospace evidence labels, and dark archive-room treatment are distinct from
  a generic centered-gradient SaaS template and match `.factory/design.md`.

Structure failures are F-1-1, F-1-4, F-1-5, F-1-6, and F-1-30.

## Missed leverage

No additional AI, sync, or import feature is warranted by the brief. MBOX
import, CSV/JSON export, search, encryption, integrity verification, and
restore already cover the implied workflow. AI classification would add a
network/privacy dependency to a deterministic evidence tool without improving
its core proof. Cloud sync would conflict with the local-first constraint.

## Quality-gate evidence

Run from the same clean clone after installing the documented Tauri system
prerequisites:

- `npm ci`: PASS, 0 vulnerabilities reported.
- `npm test`: PASS, 16/16.
- `npm run check`: PASS.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS, 9/9.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: PASS.
- `npm run build`: PASS; `dist/site` and `dist/app` produced. Site JavaScript
  is 39.55 KB raw / 12.22 KB gzip.
- `npm run test:e2e`: PASS, 38 passed and 2 expected project skips.
- `/opt/fleet/lib/verify-url.sh`: PASS against live, 605 ms observed load, no
  console errors.
- Live `latest.json` SHA-256 matches the repository file; its
  `source_commit` matches tag v0.1.4. Security headers and immutable asset
  caching are present.

## What would make this perfect

Resolve every finding above. In particular, stop offering desktop binaries to
phones; add the native-workflow screenshots; replace the two incomplete claim
tests with observable packaged-app tests; add tests for the two unlisted safety
claims; make route focus and navigation consistent; and apply every proposed
plain-language rewrite. Then rerun the entire checklist from a fresh clone and
fresh mobile/desktop browser contexts. A passing rerun must have zero findings
and no untested claim.
