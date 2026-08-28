# Mail Attachment Archive

Mail Attachment Archive is a local-first desktop utility for people leaving or
backing up an email account. It turns an MBOX export into a browsable attachment
manifest, stores duplicate files only once, and produces evidence for every
missing, malformed, or corrupt item.

The app does not connect to a mailbox, upload mail, execute attachments, or
collect telemetry. The desktop core is Rust/Tauri 2; the interface and landing
site are dependency-light Vite/TypeScript.

## Try the sample

Open the isolated [sample archive](https://mail-attachment-archive.sociobot.in/demo/)
in one click. It contains a closing statement, a deduplicated photo, and a
damaged contract reference. Resetting or leaving removes its separate `demo:`
storage key. The desktop first-run screen includes **Load sample project**.

## What it does

- Parses standard MBOX exports and MIME attachment parts locally.
- Hashes decoded attachment bytes with SHA-256 and deduplicates identical files.
- Stores attachments inertly as hash-named `.bin` files.
- Optionally encrypts every stored file using Argon2-derived keys and
  XChaCha20-Poly1305. Passphrases are never written to disk.
- Re-verifies plain files when an archive is reopened. Encrypted archives show
  no resolved score until a passphrase-gated full scan finishes.
- Searches by filename, sender, subject, or checksum.
- Exports a complete CSV/JSON-compatible evidence report, including failures.

This is not an inbox replacement and does not delete mail from a provider.
Keep the source MBOX until you have reviewed the report and restored samples.

## Install

Download the detected installer at
[mail-attachment-archive.sociobot.in](https://mail-attachment-archive.sociobot.in).
Release binaries are currently unsigned; compare their SHA-256 hashes with the
release `SHA256SUMS` file.

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

```sh
npm ci
npm run dev          # landing site
npm run tauri dev    # desktop app
npm test
npm run check
cargo test --manifest-path src-tauri/Cargo.toml
npm run build        # dist/site and dist/app
npm run test:e2e     # Chromium desktop and 390 px
```

The deployable static site is exactly `dist/site/`. `npm run build:site`
reproduces it directly. GitHub Actions builds `.dmg`, `.msi`/`.exe`,
`.AppImage`, and `.deb` assets on the appropriate OS when a `v*` tag is pushed.
It also publishes `SHA256SUMS` and `latest.json`.

## Archive format

An archive is an ordinary folder:

```text
archive/
├── manifest.json
├── verification-report.json
└── files/
    └── <sha256>.bin  (or .maa when encrypted)
```

The manifest format is versioned. Encrypted `.maa` records start with a four
byte `MAA1` marker, a random 16-byte salt, a random 24-byte nonce, and the
authenticated ciphertext. Restoration fails closed if authentication or the
recorded SHA-256 checksum does not match. New archives include an independently
encrypted passphrase check, so a wrong passphrase is not reported as file
corruption. A successful full scan writes an explicit verification report.

## Privacy, payment, and security

The free app includes import, deduplication, encryption, restoration, and all
safety reports. Archive Plus is a $29 one-time convenience unlock verified by
the Sociobot billing API; it does not gate accessibility, data export, or
safety. See the hosted `/privacy/` and `/terms/` pages.

Attachments can contain malware. The app never previews or launches them. A
restored attachment should be scanned before opening. Please report security
issues privately to `security@sociobot.in`.

## License

[MIT](LICENSE). The original generated hero artwork is documented in
[`.factory/design.md`](.factory/design.md).
