# Copy audit — polish 1

Audited 28 August 2026 after the repair. Each visitor-facing sentence is at
most 22 words. The banned marketing terms do not appear in product copy.

| Sentence | Words | Result |
| --- | ---: | --- |
| Prove every attachment made it. | 5 | Pass |
| For people leaving or backing up an email account, it turns an MBOX export into a checked local archive. | 19 | Pass |
| Opens a separate demo. Nothing is saved. | 7 | Pass |
| Mail stays on your device. | 5 | Claim: `local-only` |
| Core archive tools are free. | 5 | Claim: `free-core` |
| Works without a mailbox login. | 5 | Pass |
| An MBOX export can exist while useful files are missing. | 10 | Pass |
| This archive shows each attachment result. | 6 | Pass |
| The app reads it locally and never connects to your email account. | 12 | Claim: `local-only` |
| Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report. | 14 | Claim: `evidence-reports` |
| Importing, checking, search, and verification reports happen on your computer. | 10 | Claim: `local-only` |
| No mail data leaves it. | 5 | Claim: `local-only` |
| Import, duplicate checks, encryption, restoration, and verification reports stay free. | 10 | Claim: `free-core` |
| Archive Plus adds shortcuts for repeated migrations. | 7 | Pass |
| Your account can close. Your records should still open. | 9 | Pass |

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
