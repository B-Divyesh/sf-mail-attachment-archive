# Copy audit — polish 3

Audited 29 August 2026 after the cumulative repair. Visible landing-page
sentences, headings, labels, actions, and factual lines are listed below.
Whitespace-delimited words are counted; filenames and sample table values are
data rather than prose. No item exceeds 22 words, and no banned marketing term
appears in product copy.

## First screen

| Copy | Words | Claim or result |
| --- | ---: | --- |
| Local attachment archive | 3 | Section label |
| Prove every attachment made it. | 5 | Job-first H1 |
| For people leaving or backing up an email account, it turns an MBOX export into a checked local archive. | 19 | Audience and outcome |
| Try it with sample data | 5 | Primary action |
| Opens a separate demo. | 4 | Demo behavior |
| Nothing is saved. | 3 | `demo-sandbox` |
| Processing makes no network connections | 5 | `local-only` |
| Core archive tools are free | 5 | `free-core` |
| Archive Plus costs $29 once | 5 | `plus-price` |
| Download for Linux | 3 | `release-assets` |
| AppImage · Ubuntu 22.04+ | 3 | `ubuntu-support` |
| Many references. | 2 | Illustration caption |
| One verified copy of each file. | 6 | `sha256-dedup` |

## Landing sections

| Copy | Words | Claim or result |
| --- | ---: | --- |
| How attachment checks work | 4 | Section label |
| Check every attachment result | 4 | Heading |
| An MBOX export can exist while useful files are missing. | 10 | Problem statement |
| This archive shows each attachment result. | 6 | `mbox-import` |
| Import the MBOX export | 4 | Step heading |
| Choose a standard MBOX export. | 5 | Instruction |
| The app reads it locally and never connects to your email account. | 12 | `local-only` |
| Verify each attachment | 3 | Step heading |
| Attachments are decoded, checked, and stored once—even when the same file appears in many threads. | 16 | `sha256-dedup` |
| Review every failed attachment | 4 | Step heading |
| Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report. | 14 | `evidence-reports` |
| Desktop walkthrough | 2 | Section label |
| Review the archive before you download | 6 | Heading |
| These frames show the desktop steps for an MBOX export and its verification report. | 14 | Walkthrough description |
| Choose an MBOX export. | 5 | Caption |
| Choose a local archive folder. | 6 | Caption |
| Review the verification report. | 5 | Caption |
| Restore a checksum-verified file. | 5 | Caption |
| Sample archive | 2 | Section label |
| Sample attachment records | 3 | Heading |
| 3 of 4 sample references resolved | 6 | `sample-evidence` |
| Private processing | 2 | Section label |
| Mail processing stays on your computer. | 6 | `local-only` |
| Importing, checking, search, and verification reports happen on your computer. | 10 | `local-only` |
| No mail data leaves it. | 5 | `local-only` |
| Archive Plus pricing | 3 | Section label |
| The complete archive engine is free. | 6 | `free-core` |
| Import, duplicate checks, encryption, restoration, and verification reports stay free. | 9 | `free-core` |
| Archive Plus adds shortcuts for repeated migrations. | 7 | Offer description |
| $29 one-time | 2 | `plus-price` |
| Saved recent archive shortcuts | 4 | Paid feature |
| Compact attachment ledger | 3 | Paid feature |
| Buy Archive Plus | 3 | Purchase action |
| Have a license? Restore it | 5 | Restore action |
| Dodo hosts checkout. | 3 | `plus-price` |
| Revoked licenses no longer enable Plus. | 6 | `paid-license` |
| Keep a checked local archive | 5 | Section label |
| Download the desktop archive | 4 | Heading |
| Download Mail Attachment Archive | 4 | Action |
| Local attachment archives with verification reports. | 6 | Footer description |
| Original generated hero imagery; provenance in the repository. | 8 | Asset disclosure |

## Demo messages

| Copy | Words | Result |
| --- | ---: | --- |
| Demo — sample data, nothing is saved | 7 | `demo-sandbox` |
| Inspect a checked attachment archive | 5 | H1 |
| Search this archive | 3 | Field label |
| Reset demo | 2 | Action |
| Start for real | 3 | Action |
| The attachment data was incomplete, so this file could not be saved. | 12 | Plain error |
| The verification report keeps this failure visible. | 7 | `sample-evidence` |
| Sample restored. | 2 | Live feedback |

## README prose checks

The README introduction, feature list, install guidance, archive-format note,
privacy copy, and test commands were read line by line. No prose sentence
exceeds 22 words. User-facing encryption copy names the outcome; algorithm
names remain only in implementation dependencies and source. The unlisted
mailbox, provider-deletion, telemetry, merchant, and funding promises from
reviews 1 and 2 are absent.

## Terminology

| Concept | One term |
| --- | --- |
| Source mail container | MBOX export |
| Result folder and index | archive |
| Stored object pointer | attachment reference |
| Duplicate physical bytes | duplicate |
| Integrity value | SHA-256 checksum |
| Problems list and CSV/JSON output | verification report |
| Isolated try-out | demo |

Search evidence: `rg` found no remaining visitor-facing “exception report,”
“MBOX file,” “local-first,” “dependency-light,” “passphrase-gated,” “fails
closed,” funding-benefit, or slogan copy.

## Polish 3 additions

The landing first screen remains unchanged because review 3 found it clear on
desktop and phone. README now says “Archive Plus costs $29 once.” and “It adds
saved recent archive shortcuts and a compact attachment ledger.” These have 5
and 11 words and are covered by `@claim:plus-shortcuts`.

“Re-verifies plain files when an archive is reopened” is covered by
`@claim:plain-reopen-integrity`. The release-workflow sentences are covered by
`@claim:release-workflow-assets`. Each new sentence is under 22 words and has
no banned wording.
