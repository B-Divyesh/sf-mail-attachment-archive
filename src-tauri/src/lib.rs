use argon2::Argon2;
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    XChaCha20Poly1305, XNonce,
};
use mailparse::{parse_mail, MailHeaderMap, ParsedMail};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    path::{Component, Path, PathBuf},
};
use tauri::AppHandle;

const ARCHIVE_VERSION: u8 = 1;
// Importing an MBOX requires a complete parse today. Keep that allocation bounded
// rather than letting a multi-gigabyte Takeout export exhaust the desktop app.
const MAX_MBOX_BYTES: u64 = 256 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentRecord {
    id: String,
    message_id: String,
    filename: String,
    content_type: String,
    size: u64,
    sha256: String,
    stored_path: String,
    duplicate_of: Option<String>,
    status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRecord {
    id: String,
    subject: String,
    from: String,
    date: String,
    attachment_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueRecord {
    message_id: Option<String>,
    filename: Option<String>,
    kind: String,
    detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveManifest {
    version: u8,
    created_at: String,
    source_name: String,
    archive_path: String,
    encrypted: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    encryption_probe: Option<String>,
    // Persisted values are never trusted on reopen, but the current value must
    // cross Tauri IPC so the UI can distinguish an unverified encrypted archive.
    #[serde(default, skip_deserializing)]
    verification_complete: bool,
    messages: Vec<MessageRecord>,
    attachments: Vec<AttachmentRecord>,
    issues: Vec<IssueRecord>,
    total_bytes: u64,
    unique_bytes: u64,
}

struct ExtractedPart {
    filename: String,
    content_type: String,
    bytes: Result<Vec<u8>, String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeClaimConfig {
    claim: String,
    source_path: String,
    archive_path: String,
    restored_path: String,
    csv_path: String,
    json_path: String,
    passphrase: String,
}

/// Exposes a deterministic automation fixture only when the process was
/// explicitly launched by the native claim runner. Normal packaged launches
/// have no configuration and therefore cannot enter this path.
#[tauri::command]
fn native_claim_config() -> Option<NativeClaimConfig> {
    let root = PathBuf::from(std::env::var("MAA_NATIVE_CLAIM_ROOT").ok()?);
    let claim = std::env::var("MAA_NATIVE_CLAIM_ID").ok()?;
    if !matches!(
        claim.as_str(),
        "local-only" | "free-core" | "plus-shortcuts"
    ) {
        return None;
    }
    Some(NativeClaimConfig {
        claim,
        source_path: root.join("leaving-account.mbox").to_string_lossy().into(),
        archive_path: root.join("archive").to_string_lossy().into(),
        restored_path: root
            .join("restored-attachment.bin")
            .to_string_lossy()
            .into(),
        csv_path: root.join("verification.csv").to_string_lossy().into(),
        json_path: root.join("verification.json").to_string_lossy().into(),
        passphrase: "native claim passphrase 2026".into(),
    })
}

#[tauri::command]
fn native_claim_finish(app: AppHandle, passed: bool, evidence: String) -> Result<(), String> {
    let root = PathBuf::from(
        std::env::var("MAA_NATIVE_CLAIM_ROOT")
            .map_err(|_| "Native claim output was not configured.".to_string())?,
    );
    fs::write(root.join("ui-evidence.json"), evidence)
        .map_err(io_error("write native UI evidence"))?;
    app.exit(if passed { 0 } else { 2 });
    Ok(())
}

#[tauri::command]
fn import_mbox(
    source_path: String,
    destination_path: String,
    encrypted: bool,
    passphrase: Option<String>,
) -> Result<ArchiveManifest, String> {
    let source = PathBuf::from(&source_path);
    let destination = PathBuf::from(&destination_path);
    if !source.is_file() {
        return Err("The selected MBOX export does not exist.".into());
    }
    if encrypted && passphrase.as_deref().unwrap_or("").chars().count() < 10 {
        return Err("Encrypted archives require a passphrase of at least 10 characters.".into());
    }
    let source_size = fs::metadata(&source)
        .map_err(io_error("inspect the MBOX export"))?
        .len();
    if source_size > MAX_MBOX_BYTES {
        return Err(format!(
            "This MBOX export is {} MB. This version safely imports exports up to {} MB; split it into smaller MBOX exports and import each one.",
            source_size / (1024 * 1024),
            MAX_MBOX_BYTES / (1024 * 1024)
        ));
    }
    fs::create_dir_all(destination.join("files")).map_err(io_error("create the archive folder"))?;
    let raw = fs::read(&source).map_err(io_error("read the MBOX export"))?;
    let chunks = split_mbox(&raw);
    if chunks.is_empty() {
        return Err("No email messages were found in this MBOX export.".into());
    }

    let mut manifest = ArchiveManifest {
        version: ARCHIVE_VERSION,
        created_at: chrono::Utc::now().to_rfc3339(),
        source_name: source
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("mailbox.mbox")
            .to_owned(),
        archive_path: destination.to_string_lossy().to_string(),
        encrypted,
        encryption_probe: if encrypted {
            Some(hex::encode(encrypt_bytes(
                b"mail-attachment-archive-passphrase-check-v1",
                passphrase.as_deref().unwrap(),
            )?))
        } else {
            None
        },
        verification_complete: true,
        messages: Vec::new(),
        attachments: Vec::new(),
        issues: Vec::new(),
        total_bytes: 0,
        unique_bytes: 0,
    };
    let mut seen: HashMap<String, String> = HashMap::new();

    for (message_index, chunk) in chunks.iter().enumerate() {
        let parsed = match parse_mail(chunk) {
            Ok(mail) => mail,
            Err(error) => {
                manifest.issues.push(IssueRecord {
                    message_id: Some(format!("message-{}", message_index + 1)),
                    filename: None,
                    kind: "malformed_message".into(),
                    detail: error.to_string(),
                });
                continue;
            }
        };
        let header_id = parsed
            .headers
            .get_first_value("Message-ID")
            .unwrap_or_default();
        let message_id = if header_id.trim().is_empty() {
            format!("message-{}", message_index + 1)
        } else {
            header_id.trim().trim_matches(['<', '>']).to_owned()
        };
        let mut message = MessageRecord {
            id: message_id.clone(),
            subject: parsed
                .headers
                .get_first_value("Subject")
                .unwrap_or_else(|| "(No subject)".into()),
            from: parsed
                .headers
                .get_first_value("From")
                .unwrap_or_else(|| "Unknown sender".into()),
            date: parsed.headers.get_first_value("Date").unwrap_or_default(),
            attachment_ids: Vec::new(),
        };
        let mut parts = Vec::new();
        collect_attachments(&parsed, &mut parts);
        for (part_index, part) in parts.into_iter().enumerate() {
            let id = hex::encode(Sha256::digest(
                format!("{}:{}:{}", message_id, part.filename, part_index).as_bytes(),
            ))[..20]
                .to_owned();
            let bytes = match part.bytes {
                Ok(bytes) => bytes,
                Err(detail) => {
                    let filename = safe_filename(&part.filename);
                    // A failed MIME part is still an attachment reference. Keeping
                    // it in the manifest makes the resolved denominator honest and
                    // ensures CSV/JSON reports retain a row as well as the issue.
                    message.attachment_ids.push(id.clone());
                    manifest.attachments.push(AttachmentRecord {
                        id,
                        message_id: message_id.clone(),
                        filename: filename.clone(),
                        content_type: part.content_type,
                        size: 0,
                        sha256: String::new(),
                        stored_path: String::new(),
                        duplicate_of: None,
                        status: "decode_failed".into(),
                    });
                    manifest.issues.push(IssueRecord {
                        message_id: Some(message_id.clone()),
                        filename: Some(filename),
                        kind: "decode_failed".into(),
                        detail,
                    });
                    continue;
                }
            };
            let hash = hex::encode(Sha256::digest(&bytes));
            let duplicate_of = seen.get(&hash).cloned();
            let relative = format!("files/{}.{}", hash, if encrypted { "maa" } else { "bin" });
            manifest.total_bytes += bytes.len() as u64;
            if duplicate_of.is_none() {
                let stored = if encrypted {
                    encrypt_bytes(&bytes, passphrase.as_deref().unwrap())?
                } else {
                    bytes.clone()
                };
                fs::write(destination.join(&relative), stored)
                    .map_err(io_error("store an attachment"))?;
                manifest.unique_bytes += bytes.len() as u64;
                seen.insert(hash.clone(), id.clone());
            }
            message.attachment_ids.push(id.clone());
            manifest.attachments.push(AttachmentRecord {
                id,
                message_id: message_id.clone(),
                filename: safe_filename(&part.filename),
                content_type: part.content_type,
                size: bytes.len() as u64,
                sha256: hash,
                stored_path: relative,
                duplicate_of,
                status: "verified".into(),
            });
        }
        manifest.messages.push(message);
    }
    if manifest.messages.is_empty() {
        return Err(
            "Messages were found, but none could be read. Choose a standard MBOX export.".into(),
        );
    }
    write_manifest(&destination, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn load_manifest(manifest_path: String) -> Result<ArchiveManifest, String> {
    let path = PathBuf::from(&manifest_path);
    let mut manifest = read_manifest(&path)?;
    let root = path.parent().ok_or("The manifest has no archive folder.")?;
    clear_scan_results(&mut manifest);
    manifest.verification_complete = !manifest.encrypted;
    let mut results: HashMap<String, String> = HashMap::new();
    for attachment in &mut manifest.attachments {
        if attachment.status == "decode_failed" {
            continue;
        }
        let stored = safe_join(root, &attachment.stored_path)?;
        let status = if !stored.is_file() {
            "missing".to_string()
        } else if manifest.encrypted {
            "unverified".to_string()
        } else if let Some(status) = results.get(&attachment.sha256) {
            status.clone()
        } else {
            let bytes = fs::read(&stored).map_err(io_error("verify a stored attachment"))?;
            let status = if hex::encode(Sha256::digest(&bytes)) == attachment.sha256 {
                "verified".to_string()
            } else {
                "corrupt".to_string()
            };
            results.insert(attachment.sha256.clone(), status.clone());
            status
        };
        attachment.status = status.clone();
        if status == "missing" {
            manifest.issues.push(IssueRecord {
                message_id: Some(attachment.message_id.clone()),
                filename: Some(attachment.filename.clone()),
                kind: "stored_file_missing".into(),
                detail: "The manifest points to a file that is no longer present.".into(),
            });
        } else if status == "corrupt" {
            manifest.issues.push(IssueRecord {
                message_id: Some(attachment.message_id.clone()),
                filename: Some(attachment.filename.clone()),
                kind: "checksum_mismatch".into(),
                detail: "The stored bytes no longer match the import checksum.".into(),
            });
        }
    }
    // A plain archive can be fully rechecked without a passphrase. Persist the
    // refreshed report so reopening exposes the same corruption evidence to
    // the desktop UI and to a person who later opens the JSON report.
    if !manifest.encrypted {
        write_verification_report(root, &manifest)?;
    }
    Ok(manifest)
}

fn read_manifest(path: &Path) -> Result<ArchiveManifest, String> {
    let manifest: ArchiveManifest =
        serde_json::from_slice(&fs::read(path).map_err(io_error("read the manifest"))?)
            .map_err(|e| format!("The manifest is not valid JSON: {e}"))?;
    if manifest.version != ARCHIVE_VERSION {
        return Err(format!(
            "Archive version {} is not supported by this app.",
            manifest.version
        ));
    }
    Ok(manifest)
}

fn clear_scan_results(manifest: &mut ArchiveManifest) {
    manifest.issues.retain(|issue| {
        !matches!(
            issue.kind.as_str(),
            "stored_file_missing" | "checksum_mismatch" | "encrypted_file_corrupt"
        )
    });
    for attachment in &mut manifest.attachments {
        if attachment.status != "decode_failed" {
            attachment.status = "verified".into();
        }
    }
}

#[tauri::command]
fn verify_encrypted_archive(
    manifest_path: String,
    passphrase: String,
) -> Result<ArchiveManifest, String> {
    let path = PathBuf::from(&manifest_path);
    let mut manifest = read_manifest(&path)?;
    if !manifest.encrypted {
        return Err("This archive is not encrypted; it is checked when opened.".into());
    }
    let probe = manifest.encryption_probe.as_deref().ok_or(
        "This older encrypted archive has no passphrase check. Re-import it with this version before relying on a full scan.",
    )?;
    let probe_bytes = hex::decode(probe).map_err(|_| "The archive passphrase check is damaged.")?;
    let opened = decrypt_bytes(&probe_bytes, &passphrase)
        .map_err(|_| "The passphrase is incorrect, so no files were marked corrupt.".to_string())?;
    if opened != b"mail-attachment-archive-passphrase-check-v1" {
        return Err("The archive passphrase check is invalid.".into());
    }

    clear_scan_results(&mut manifest);
    let root = path.parent().ok_or("The manifest has no archive folder.")?;
    let mut results: HashMap<String, String> = HashMap::new();
    for attachment in &mut manifest.attachments {
        if attachment.status == "decode_failed" {
            continue;
        }
        let status = if let Some(status) = results.get(&attachment.sha256) {
            status.clone()
        } else {
            let stored = safe_join(root, &attachment.stored_path)?;
            let status = if !stored.is_file() {
                "missing".to_string()
            } else {
                let ciphertext =
                    fs::read(&stored).map_err(io_error("verify an encrypted attachment"))?;
                match decrypt_bytes(&ciphertext, &passphrase) {
                    Ok(bytes) if hex::encode(Sha256::digest(&bytes)) == attachment.sha256 => {
                        "verified".to_string()
                    }
                    _ => "corrupt".to_string(),
                }
            };
            results.insert(attachment.sha256.clone(), status.clone());
            status
        };
        attachment.status = status.clone();
        if status != "verified" {
            manifest.issues.push(IssueRecord {
                message_id: Some(attachment.message_id.clone()),
                filename: Some(attachment.filename.clone()),
                kind: if status == "missing" {
                    "stored_file_missing".into()
                } else {
                    "encrypted_file_corrupt".into()
                },
                detail: if status == "missing" {
                    "The manifest points to an encrypted file that is no longer present.".into()
                } else {
                    "The encrypted file failed authentication or its decoded bytes did not match the import checksum.".into()
                },
            });
        }
    }
    manifest.verification_complete = true;
    write_verification_report(root, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn restore_attachment(
    manifest_path: String,
    attachment_id: String,
    destination_path: String,
    passphrase: Option<String>,
) -> Result<(), String> {
    let path = PathBuf::from(&manifest_path);
    let manifest: ArchiveManifest =
        serde_json::from_slice(&fs::read(&path).map_err(io_error("read the manifest"))?)
            .map_err(|e| format!("Invalid manifest: {e}"))?;
    let record = manifest
        .attachments
        .iter()
        .find(|a| a.id == attachment_id)
        .ok_or("That attachment is not in this archive.")?;
    if record.status == "decode_failed" {
        return Err(
            "This attachment could not be decoded during import, so there is no file to restore."
                .into(),
        );
    }
    let root = path.parent().ok_or("The manifest has no archive folder.")?;
    let stored_path = safe_join(root, &record.stored_path)?;
    let stored = fs::read(stored_path).map_err(io_error("read the stored attachment"))?;
    let bytes = if manifest.encrypted {
        decrypt_bytes(&stored, passphrase.as_deref().unwrap_or(""))?
    } else {
        stored
    };
    if hex::encode(Sha256::digest(&bytes)) != record.sha256 {
        return Err("Checksum verification failed. The restored file was not written.".into());
    }
    fs::write(destination_path, bytes).map_err(io_error("write the restored attachment"))
}

#[tauri::command]
fn export_report(
    manifest_path: String,
    destination_path: String,
    format: String,
    passphrase: Option<String>,
) -> Result<(), String> {
    let manifest = if let Some(passphrase) = passphrase {
        verify_encrypted_archive(manifest_path, passphrase)?
    } else {
        load_manifest(manifest_path)?
    };
    if format == "json" {
        return fs::write(
            destination_path,
            serde_json::to_vec_pretty(&manifest).map_err(|e| e.to_string())?,
        )
        .map_err(io_error("write the JSON report"));
    }
    let messages: HashMap<_, _> = manifest
        .messages
        .iter()
        .map(|m| (m.id.as_str(), m))
        .collect();
    let mut csv = String::from(
        "status,filename,content_type,size_bytes,sha256,duplicate_of,message_id,subject,from\n",
    );
    for a in &manifest.attachments {
        let message = messages.get(a.message_id.as_str());
        csv.push_str(
            &[
                csv_field(&a.status),
                csv_field(&a.filename),
                csv_field(&a.content_type),
                a.size.to_string(),
                csv_field(&a.sha256),
                csv_field(a.duplicate_of.as_deref().unwrap_or("")),
                csv_field(&a.message_id),
                csv_field(message.map(|m| m.subject.as_str()).unwrap_or("")),
                csv_field(message.map(|m| m.from.as_str()).unwrap_or("")),
            ]
            .join(","),
        );
        csv.push('\n');
    }
    for issue in &manifest.issues {
        csv.push_str(
            &[
                csv_field(&format!("issue:{}", issue.kind)),
                csv_field(issue.filename.as_deref().unwrap_or("")),
                String::new(),
                String::new(),
                String::new(),
                String::new(),
                csv_field(issue.message_id.as_deref().unwrap_or("")),
                csv_field(&issue.detail),
                String::new(),
            ]
            .join(","),
        );
        csv.push('\n');
    }
    fs::write(destination_path, csv).map_err(io_error("write the CSV report"))
}

fn split_mbox(bytes: &[u8]) -> Vec<&[u8]> {
    let mut starts = Vec::new();
    let mut pos = 0;
    for line in bytes.split_inclusive(|b| *b == b'\n') {
        if line.starts_with(b"From ") {
            starts.push(pos + line.len());
        }
        pos += line.len();
    }
    if starts.is_empty() {
        return if parse_mail(bytes).is_ok() {
            vec![bytes]
        } else {
            vec![]
        };
    }
    starts
        .iter()
        .enumerate()
        .map(|(i, start)| {
            let end = starts
                .get(i + 1)
                .map(|next| {
                    let preceding = &bytes[*start..*next];
                    preceding
                        .windows(6)
                        .rposition(|w| w == b"\nFrom ")
                        .map(|p| start + p + 1)
                        .unwrap_or(*next)
                })
                .unwrap_or(bytes.len());
            &bytes[*start..end]
        })
        .filter(|chunk| !chunk.is_empty())
        .collect()
}

fn collect_attachments(mail: &ParsedMail<'_>, out: &mut Vec<ExtractedPart>) {
    if !mail.subparts.is_empty() {
        for subpart in &mail.subparts {
            collect_attachments(subpart, out);
        }
        return;
    }
    let disposition = mail.get_content_disposition();
    let filename = disposition
        .params
        .get("filename")
        .cloned()
        .or_else(|| mail.ctype.params.get("name").cloned());
    let is_attachment = filename.is_some()
        || matches!(
            disposition.disposition,
            mailparse::DispositionType::Attachment
        );
    if !is_attachment {
        return;
    }
    let fallback = format!(
        "unnamed-attachment.{}",
        extension_for_type(&mail.ctype.mimetype)
    );
    out.push(ExtractedPart {
        filename: safe_filename(filename.as_deref().unwrap_or(&fallback)),
        content_type: mail.ctype.mimetype.clone(),
        bytes: mail.get_body_raw().map_err(|e| e.to_string()),
    });
}

fn safe_filename(name: &str) -> String {
    let clean: String = name
        .chars()
        .map(|c| {
            if c.is_control() || matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') {
                '_'
            } else {
                c
            }
        })
        .collect();
    let trimmed = clean.trim_matches([' ', '.']);
    if trimmed.is_empty() {
        "unnamed-attachment.bin".into()
    } else {
        trimmed.chars().take(180).collect()
    }
}

fn extension_for_type(mime: &str) -> &'static str {
    match mime {
        "application/pdf" => "pdf",
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "text/plain" => "txt",
        "text/csv" => "csv",
        "application/zip" => "zip",
        _ => "bin",
    }
}

fn encrypt_bytes(bytes: &[u8], passphrase: &str) -> Result<Vec<u8>, String> {
    let mut salt = [0u8; 16];
    let mut nonce = [0u8; 24];
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), &salt, &mut key)
        .map_err(|e| format!("Could not derive the encryption key: {e}"))?;
    let cipher = XChaCha20Poly1305::new((&key).into());
    let encrypted = cipher
        .encrypt(XNonce::from_slice(&nonce), bytes)
        .map_err(|_| "Could not encrypt an attachment.".to_string())?;
    let mut output = b"MAA1".to_vec();
    output.extend_from_slice(&salt);
    output.extend_from_slice(&nonce);
    output.extend(encrypted);
    Ok(output)
}

fn decrypt_bytes(bytes: &[u8], passphrase: &str) -> Result<Vec<u8>, String> {
    if bytes.len() < 44 || &bytes[..4] != b"MAA1" {
        return Err("This is not a valid encrypted archive file.".into());
    }
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), &bytes[4..20], &mut key)
        .map_err(|e| format!("Could not derive the decryption key: {e}"))?;
    XChaCha20Poly1305::new((&key).into())
        .decrypt(XNonce::from_slice(&bytes[20..44]), &bytes[44..])
        .map_err(|_| "The passphrase is incorrect or the encrypted file is damaged.".into())
}

fn write_manifest(destination: &Path, manifest: &ArchiveManifest) -> Result<(), String> {
    let data = serde_json::to_vec_pretty(manifest).map_err(|e| e.to_string())?;
    fs::write(destination.join("manifest.json"), &data)
        .map_err(io_error("write the archive manifest"))?;
    fs::write(destination.join("verification-report.json"), data)
        .map_err(io_error("write the verification report"))
}

fn write_verification_report(destination: &Path, manifest: &ArchiveManifest) -> Result<(), String> {
    let data = serde_json::to_vec_pretty(manifest).map_err(|e| e.to_string())?;
    fs::write(destination.join("verification-report.json"), data)
        .map_err(io_error("write the verification report"))
}

fn safe_join(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let path = Path::new(relative);
    if path.is_absolute()
        || path
            .components()
            .any(|c| !matches!(c, Component::Normal(_)))
    {
        return Err("The archive contains an unsafe stored path.".into());
    }
    Ok(root.join(path))
}
fn csv_field(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}
fn io_error(action: &'static str) -> impl FnOnce(std::io::Error) -> String {
    move |error| format!("Could not {action}: {error}")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            import_mbox,
            load_manifest,
            verify_encrypted_archive,
            restore_attachment,
            export_report,
            native_claim_config,
            native_claim_finish
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mail Attachment Archive");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sanitizes_unsafe_names() {
        assert_eq!(safe_filename("../../tax:2026.pdf"), "_.._tax_2026.pdf");
    }
    #[test]
    fn encryption_round_trip_and_wrong_password_fails() {
        let original = b"private attachment";
        let encrypted = encrypt_bytes(original, "a strong password").unwrap();
        assert_ne!(encrypted, original);
        assert_eq!(
            decrypt_bytes(&encrypted, "a strong password").unwrap(),
            original
        );
        assert!(decrypt_bytes(&encrypted, "wrong password").is_err());
    }
    #[test]
    fn parses_single_raw_message() {
        let mail = b"Subject: Test\r\nContent-Type: text/plain\r\n\r\nhello";
        assert_eq!(split_mbox(mail).len(), 1);
    }

    #[test]
    // @claim:sha256-dedup
    fn claim_sha256_dedup_imports_duplicate_references_once() {
        let unique = format!(
            "maa-test-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("source.mbox");
        let destination = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        let message = |id: &str| {
            format!(
            "From sender@example.test Sat Jan 01 00:00:00 2026\nMessage-ID: <{id}>\r\nSubject: Evidence\r\nFrom: sender@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=bound\r\n\r\n--bound\r\nContent-Type: text/plain\r\n\r\nhello\r\n--bound\r\nContent-Type: application/pdf; name=proof.pdf\r\nContent-Disposition: attachment; filename=proof.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--bound--\r\n"
        )
        };
        fs::write(&source, format!("{}{}", message("one"), message("two"))).unwrap();
        let manifest = import_mbox(
            source.to_string_lossy().to_string(),
            destination.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        assert!(manifest.attachments[0].stored_path.ends_with(".bin"));
        assert_eq!(manifest.messages.len(), 2);
        assert_eq!(manifest.attachments.len(), 2);
        assert!(manifest.attachments[1].duplicate_of.is_some());
        assert_eq!(manifest.unique_bytes, 5);
        assert!(destination.join("manifest.json").is_file());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:mbox-import
    fn claim_mbox_import_keeps_a_decode_failed_reference_in_the_real_manifest() {
        let unique = format!(
            "maa-import-test-{}",
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("mixed-success.mbox");
        let destination = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        fs::write(&source, "From owner@example.test Sat Jan 01 00:00:00 2026\nMessage-ID: <mixed@example.test>\r\nSubject: Account export\r\nFrom: owner@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: application/pdf; name=good.pdf\r\nContent-Disposition: attachment; filename=good.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--b\r\nContent-Type: application/pdf; name=broken.pdf\r\nContent-Disposition: attachment; filename=broken.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\nnot valid base64!\r\n--b--\r\n").unwrap();
        let manifest = import_mbox(
            source.to_string_lossy().to_string(),
            destination.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        assert_eq!(manifest.messages.len(), 1);
        assert_eq!(
            manifest.attachments.len(),
            2,
            "every MIME reference stays in the manifest"
        );
        assert_eq!(
            manifest
                .attachments
                .iter()
                .filter(|a| a.status == "verified")
                .count(),
            1
        );
        assert_eq!(
            manifest
                .attachments
                .iter()
                .filter(|a| a.status == "decode_failed")
                .count(),
            1
        );
        assert_eq!(
            manifest
                .issues
                .iter()
                .filter(|i| i.kind == "decode_failed")
                .count(),
            1
        );
        let reopened = load_manifest(
            destination
                .join("manifest.json")
                .to_string_lossy()
                .to_string(),
        )
        .unwrap();
        assert_eq!(reopened.attachments.len(), 2);
        assert_eq!(
            reopened
                .attachments
                .iter()
                .filter(|a| a.status == "verified")
                .count(),
            1
        );
        assert_eq!(
            reopened
                .attachments
                .iter()
                .filter(|a| a.status == "decode_failed")
                .count(),
            1
        );
        fs::remove_dir_all(root).unwrap();
    }

    fn fresh_claim_root(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "maa-{name}-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ))
    }

    fn write_claim_mbox(source: &Path) {
        fs::write(source, "From owner@example.test Sat Jan 01 00:00:00 2026\nMessage-ID: <claim@example.test>\r\nSubject: Leaving work\r\nFrom: owner@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: application/pdf; name=statement.pdf\r\nContent-Disposition: attachment; filename=statement.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--b--\r\n").unwrap();
    }

    #[test]
    // Supporting core test; the claim itself runs through the packaged app.
    fn claim_local_only_processes_a_shipped_mbox_with_filesystem_only_output() {
        let root = fresh_claim_root("local-only");
        let source = root.join("leaving-account.mbox");
        let archive = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        write_claim_mbox(&source);
        let original_source = fs::read(&source).unwrap();
        let imported = import_mbox(
            source.to_string_lossy().to_string(),
            archive.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        let reopened =
            load_manifest(archive.join("manifest.json").to_string_lossy().to_string()).unwrap();
        assert_eq!(reopened.attachments.len(), 1);
        assert!(archive.join("manifest.json").is_file());
        assert!(archive.join("verification-report.json").is_file());
        assert!(archive.join(&imported.attachments[0].stored_path).is_file());
        assert_eq!(
            fs::read(&source).unwrap(),
            original_source,
            "the source is read, never altered"
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:attachments-not-opened
    fn claim_attachments_not_opened_import_writes_only_archive_files() {
        let root = fresh_claim_root("not-opened");
        let source = root.join("sentinel.mbox");
        let archive = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        write_claim_mbox(&source);
        let manifest = import_mbox(
            source.to_string_lossy().to_string(),
            archive.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        let stored = archive.join(&manifest.attachments[0].stored_path);
        assert_eq!(fs::read(stored).unwrap(), b"hello");
        let capabilities = fs::read_to_string(
            Path::new(env!("CARGO_MANIFEST_DIR")).join("capabilities/default.json"),
        )
        .unwrap();
        assert!(
            !capabilities.contains("opener:"),
            "the packaged command allowlist has no file-opening capability"
        );
        assert_eq!(
            fs::read_dir(&root).unwrap().count(),
            2,
            "import creates only its archive beside the source MBOX"
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // Supporting core test; the claim itself runs through the packaged app.
    fn claim_free_core_completes_unlicensed_import_reopen_encryption_restore_and_reports() {
        let root = fresh_claim_root("free-core");
        let source = root.join("free.mbox");
        let archive = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        write_claim_mbox(&source);
        let passphrase = "correct horse battery staple";
        let imported = import_mbox(
            source.to_string_lossy().to_string(),
            archive.to_string_lossy().to_string(),
            true,
            Some(passphrase.into()),
        )
        .unwrap();
        let manifest_path = archive.join("manifest.json").to_string_lossy().to_string();
        let reopened = load_manifest(manifest_path.clone()).unwrap();
        assert!(!reopened.verification_complete);
        assert_eq!(
            serde_json::to_value(&reopened).unwrap()["verification_complete"],
            false,
            "Tauri IPC must tell the UI to request a passphrase scan"
        );
        let checked = verify_encrypted_archive(manifest_path.clone(), passphrase.into()).unwrap();
        assert!(checked.verification_complete);
        let restored = root.join("restored-statement.pdf");
        restore_attachment(
            manifest_path.clone(),
            imported.attachments[0].id.clone(),
            restored.to_string_lossy().to_string(),
            Some(passphrase.into()),
        )
        .unwrap();
        assert_eq!(fs::read(&restored).unwrap(), b"hello");
        let csv = root.join("verification.csv");
        let json = root.join("verification.json");
        export_report(
            manifest_path.clone(),
            csv.to_string_lossy().to_string(),
            "csv".into(),
            Some(passphrase.into()),
        )
        .unwrap();
        export_report(
            manifest_path,
            json.to_string_lossy().to_string(),
            "json".into(),
            Some(passphrase.into()),
        )
        .unwrap();
        assert!(fs::read_to_string(csv).unwrap().contains("statement.pdf"));
        assert_eq!(
            serde_json::from_slice::<ArchiveManifest>(&fs::read(json).unwrap())
                .unwrap()
                .attachments
                .len(),
            checked.attachments.len()
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:safe-mbox-limit
    fn rejects_mbox_files_above_the_safe_import_boundary_before_reading() {
        let unique = format!(
            "maa-size-test-{}",
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("too-large.mbox");
        fs::create_dir_all(&root).unwrap();
        let file = fs::File::create(&source).unwrap();
        file.set_len(MAX_MBOX_BYTES + 1).unwrap();
        let result = import_mbox(
            source.to_string_lossy().to_string(),
            root.join("archive").to_string_lossy().to_string(),
            false,
            None,
        );
        assert!(result.unwrap_err().contains("safely imports exports up to"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn claim_evidence_reports_export_csv_and_json() {
        let unique = format!(
            "maa-report-test-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("source.mbox");
        let destination = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        fs::write(
            &source,
            "Message-ID: <report@example.test>\r\nSubject: Report\r\nFrom: owner@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: application/pdf; name=proof.pdf\r\nContent-Disposition: attachment; filename=proof.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--b--\r\n",
        )
        .unwrap();
        import_mbox(
            source.to_string_lossy().to_string(),
            destination.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        let manifest = destination
            .join("manifest.json")
            .to_string_lossy()
            .to_string();
        let csv = root.join("report.csv");
        let json = root.join("report.json");
        export_report(
            manifest.clone(),
            csv.to_string_lossy().to_string(),
            "csv".into(),
            None,
        )
        .unwrap();
        export_report(
            manifest,
            json.to_string_lossy().to_string(),
            "json".into(),
            None,
        )
        .unwrap();
        assert!(fs::read_to_string(csv).unwrap().contains("proof.pdf"));
        let report: ArchiveManifest = serde_json::from_slice(&fs::read(json).unwrap()).unwrap();
        assert_eq!(report.attachments.len(), 1);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:encrypted-integrity
    fn claim_encrypted_integrity_on_reopen_reports_corruption() {
        let unique = format!(
            "maa-encrypted-test-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("leaving-account.mbox");
        let destination = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        fs::write(
            &source,
            "From sender@example.test Sat Jan 01 00:00:00 2026\nMessage-ID: <encrypted-one>\r\nSubject: Final statement\r\nFrom: accounts@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=bound\r\n\r\n--bound\r\nContent-Type: text/plain\r\n\r\nhello\r\n--bound\r\nContent-Type: application/pdf; name=statement.pdf\r\nContent-Disposition: attachment; filename=statement.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--bound--\r\n",
        )
        .unwrap();
        let imported = import_mbox(
            source.to_string_lossy().to_string(),
            destination.to_string_lossy().to_string(),
            true,
            Some("correct horse battery staple".into()),
        )
        .unwrap();
        let serialized = fs::read_to_string(destination.join("manifest.json")).unwrap();
        assert!(!serialized.contains("correct horse battery staple"));
        let manifest_path = destination.join("manifest.json");
        let reopened = load_manifest(manifest_path.to_string_lossy().to_string()).unwrap();
        assert!(!reopened.verification_complete);
        assert_eq!(reopened.attachments[0].status, "unverified");

        let checked = verify_encrypted_archive(
            manifest_path.to_string_lossy().to_string(),
            "correct horse battery staple".into(),
        )
        .unwrap();
        assert!(checked.verification_complete);
        assert_eq!(checked.attachments[0].status, "verified");

        let stored = destination.join(&imported.attachments[0].stored_path);
        let mut damaged = fs::read(&stored).unwrap();
        let last = damaged.len() - 1;
        damaged[last] ^= 0xff;
        fs::write(&stored, damaged).unwrap();

        let wrong = verify_encrypted_archive(
            manifest_path.to_string_lossy().to_string(),
            "wrong password that is long".into(),
        )
        .unwrap_err();
        assert!(wrong.contains("passphrase is incorrect"));

        let damaged = verify_encrypted_archive(
            manifest_path.to_string_lossy().to_string(),
            "correct horse battery staple".into(),
        )
        .unwrap();
        assert_eq!(damaged.attachments[0].status, "corrupt");
        assert!(damaged
            .issues
            .iter()
            .any(|issue| issue.kind == "encrypted_file_corrupt"));
        let report = fs::read_to_string(destination.join("verification-report.json")).unwrap();
        assert!(report.contains("encrypted_file_corrupt"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:plain-reopen-integrity
    fn claim_plain_reopen_integrity_reports_corruption_in_the_saved_report() {
        let root = fresh_claim_root("plain-reopen-integrity");
        let source = root.join("source.mbox");
        let archive = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        write_claim_mbox(&source);

        let imported = import_mbox(
            source.to_string_lossy().to_string(),
            archive.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        fs::write(
            archive.join(&imported.attachments[0].stored_path),
            b"changed bytes",
        )
        .unwrap();

        let reopened =
            load_manifest(archive.join("manifest.json").to_string_lossy().to_string()).unwrap();
        assert_eq!(reopened.attachments[0].status, "corrupt");
        assert!(reopened
            .issues
            .iter()
            .any(|issue| issue.kind == "checksum_mismatch"));

        let report: ArchiveManifest =
            serde_json::from_slice(&fs::read(archive.join("verification-report.json")).unwrap())
                .unwrap();
        assert_eq!(report.attachments[0].status, "corrupt");
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.kind == "checksum_mismatch"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    // @claim:restore-integrity
    fn claim_restore_integrity_checks_bytes_before_writing() {
        let unique = format!(
            "maa-restore-test-{}-{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
        );
        let root = std::env::temp_dir().join(unique);
        let source = root.join("source.mbox");
        let archive = root.join("archive");
        fs::create_dir_all(&root).unwrap();
        fs::write(
            &source,
            "Message-ID: <restore@example.test>\r\nSubject: Restore\r\nFrom: owner@example.test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: application/pdf; name=proof.pdf\r\nContent-Disposition: attachment; filename=proof.pdf\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--b--\r\n",
        )
        .unwrap();
        let manifest = import_mbox(
            source.to_string_lossy().to_string(),
            archive.to_string_lossy().to_string(),
            false,
            None,
        )
        .unwrap();
        assert!(manifest.attachments[0].stored_path.ends_with(".bin"));
        let manifest_path = archive.join("manifest.json").to_string_lossy().to_string();
        let restored = root.join("proof.pdf");
        restore_attachment(
            manifest_path.clone(),
            manifest.attachments[0].id.clone(),
            restored.to_string_lossy().to_string(),
            None,
        )
        .unwrap();
        assert_eq!(fs::read(&restored).unwrap(), b"hello");

        fs::write(
            archive.join(&manifest.attachments[0].stored_path),
            b"damaged",
        )
        .unwrap();
        let rejected = root.join("rejected.pdf");
        assert!(restore_attachment(
            manifest_path,
            manifest.attachments[0].id.clone(),
            rejected.to_string_lossy().to_string(),
            None,
        )
        .is_err());
        assert!(!rejected.exists());
        fs::remove_dir_all(root).unwrap();
    }
}
