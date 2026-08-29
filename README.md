# Mail Attachment Archive

Mail Attachment Archive is a desktop app for people leaving or backing up an
email account. It keeps mail processing on their computer. It turns an MBOX
export into a local attachment list. Duplicate files are stored once, and every
failure stays in the verification report.

The import reads the MBOX export you choose and writes the archive folder you
choose. The desktop app uses Rust and Tauri 2. The interface and website use
Vite and TypeScript.

## Try the sample

Open the isolated [sample archive](https://mail-attachment-archive.sociobot.in/?demo=1)
in one click. It contains a closing statement, a deduplicated photo, and a
damaged contract reference. Resetting or leaving removes its separate `demo:`
storage key. The desktop first-run screen includes **Load sample archive**.

## What it does

- Reads standard MBOX exports and their attached files on your computer.
- Hashes decoded attachment bytes with SHA-256 and deduplicates identical files.
- Stores attachments without opening them, in `.bin` files named by checksum.
- Optionally encrypts stored attachment files. Your passphrase is never written
  to disk.
- Re-verifies plain files when an archive is reopened. Encrypted archives show
  no resolved score until you enter the passphrase and finish a full scan.
- Searches by filename, sender, subject, or checksum.
- Exports complete CSV and JSON verification reports, including failures.
- Safely rejects MBOX exports over 256 MB before reading them into memory. Split
  a larger export into smaller MBOX exports and import each one.

The app imports an exported file that you select. Keep the source MBOX export
until you review the verification report and restore important files.

## Install

Download the detected installer at
[mail-attachment-archive.sociobot.in](https://mail-attachment-archive.sociobot.in).
Read the release notes and compare downloads with the release `SHA256SUMS` file.

Linux/macOS:

```sh
curl -fsSL https://mail-attachment-archive.sociobot.in/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://mail-attachment-archive.sociobot.in/install.ps1 | iex
```

On macOS, right-click the application and choose **Open** the first time. On
Windows, confirm the SmartScreen prompt. Linux AppImages may require FUSE 2 on
older distributions; a `.deb` is also attached to each release.

## Develop and verify

Requirements: Node.js 22+, npm, stable Rust, and the
[Tauri 2 system prerequisites](https://v2.tauri.app/start/prerequisites/).
Linux native claim tests also require `xvfb` and `strace`.

```sh
npm ci
npm run dev          # landing site
npm run tauri dev    # desktop app
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
npm run build        # dist/site and dist/app
npm run test:e2e     # Chromium desktop and 390 px
npm run test:native-claim -- local-only
npm run test:native-claim -- free-core
npm run test:native-claim -- plus-shortcuts
```

The deployable static site is exactly `dist/site/`. `npm run build:site`
reproduces it directly. GitHub Actions builds `.dmg`, `.msi`/`.exe`,
`.AppImage`, and `.deb` assets on the appropriate OS when a `v*` tag is pushed.
It also publishes `SHA256SUMS` and `latest.json`.

For a tagged release, stage the release-produced manifest before uploading the
site, then verify the live provenance chain (including one downloaded asset):

```sh
npm run build:site
npm run prepare:release-deploy -- B-Divyesh/sf-mail-attachment-archive vX.Y.Z <tag-commit>
/opt/fleet/lib/deploy-static.sh mail-attachment-archive dist/site
npm run verify:release-provenance -- https://mail-attachment-archive.sociobot.in B-Divyesh/sf-mail-attachment-archive vX.Y.Z <tag-commit>
```

## Archive format

An archive is an ordinary folder:

```text
archive/
├── manifest.json
├── verification-report.json
└── files/
    └── <sha256>.bin  (or .maa when encrypted)
```

The manifest format is versioned. Each encrypted `.maa` file starts with its
format marker, salt, nonce, and encrypted attachment bytes. If decryption or
the checksum fails, restoration stops without writing the destination file. New
archives include an encrypted passphrase check, so a wrong passphrase is not
reported as file corruption. A successful full scan writes a verification report.

## Privacy, payment, and security

The free app includes import, duplicate checks, encryption, restoration, and
all verification reports. Archive Plus costs $29 once. It adds saved recent
archive shortcuts and a compact attachment ledger. Import, export,
accessibility, and safety features remain free. Dodo hosts checkout. A revoked
license no longer enables Plus features. See the hosted `/privacy/` and
`/terms/` pages.

Attachments can contain malware. The app stores attachments without opening
them. A restored attachment should be scanned before opening. Please report
security issues privately to `security@sociobot.in`.

## License

[MIT](LICENSE). The original generated hero artwork is documented in
[`.factory/design.md`](.factory/design.md).
