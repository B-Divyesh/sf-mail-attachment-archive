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
    collections::{HashMap, HashSet},
    fs,
    path::{Component, Path, PathBuf},
};

const ARCHIVE_VERSION: u8 = 1;

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
        return Err("The selected MBOX file does not exist.".into());
    }
    if encrypted && passphrase.as_deref().unwrap_or("").chars().count() < 10 {
        return Err("Encrypted archives require a passphrase of at least 10 characters.".into());
    }
    fs::create_dir_all(destination.join("files")).map_err(io_error("create the archive folder"))?;
    let raw = fs::read(&source).map_err(io_error("read the MBOX file"))?;
    let chunks = split_mbox(&raw);
    if chunks.is_empty() {
        return Err("No RFC 5322 messages were found in this MBOX file.".into());
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
            let bytes = match part.bytes {
                Ok(bytes) => bytes,
                Err(detail) => {
                    manifest.issues.push(IssueRecord {
                        message_id: Some(message_id.clone()),
                        filename: Some(part.filename),
                        kind: "decode_failed".into(),
                        detail,
                    });
                    continue;
                }
            };
            let hash = hex::encode(Sha256::digest(&bytes));
            let id = hex::encode(Sha256::digest(
                format!("{}:{}:{}", message_id, part.filename, part_index).as_bytes(),
            ))[..20]
                .to_owned();
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
        return Err("Messages were found, but none could be parsed. The file may not be a standard MBOX export.".into());
    }
    write_manifest(&destination, &manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn load_manifest(manifest_path: String) -> Result<ArchiveManifest, String> {
    let path = PathBuf::from(&manifest_path);
    let mut manifest: ArchiveManifest =
        serde_json::from_slice(&fs::read(&path).map_err(io_error("read the manifest"))?)
            .map_err(|e| format!("The manifest is not valid JSON: {e}"))?;
    if manifest.version != ARCHIVE_VERSION {
        return Err(format!(
            "Archive version {} is not supported by this app.",
            manifest.version
        ));
    }
    let root = path.parent().ok_or("The manifest has no archive folder.")?;
    let mut checked = HashSet::new();
    for attachment in &mut manifest.attachments {
        let stored = safe_join(root, &attachment.stored_path)?;
        if !stored.is_file() {
            attachment.status = "missing".into();
            manifest.issues.push(IssueRecord {
                message_id: Some(attachment.message_id.clone()),
                filename: Some(attachment.filename.clone()),
                kind: "stored_file_missing".into(),
                detail: "The manifest points to a file that is no longer present.".into(),
            });
        } else if !manifest.encrypted && checked.insert(attachment.sha256.clone()) {
            let bytes = fs::read(&stored).map_err(io_error("verify a stored attachment"))?;
            if hex::encode(Sha256::digest(&bytes)) != attachment.sha256 {
                attachment.status = "corrupt".into();
                manifest.issues.push(IssueRecord {
                    message_id: Some(attachment.message_id.clone()),
                    filename: Some(attachment.filename.clone()),
                    kind: "checksum_mismatch".into(),
                    detail: "The stored bytes no longer match the import checksum.".into(),
                });
            }
        }
    }
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
) -> Result<(), String> {
    let manifest = load_manifest(manifest_path)?;
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            import_mbox,
            load_manifest,
            restore_attachment,
            export_report
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
    fn imports_and_deduplicates_mbox_attachments() {
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
        assert_eq!(manifest.messages.len(), 2);
        assert_eq!(manifest.attachments.len(), 2);
        assert!(manifest.attachments[1].duplicate_of.is_some());
        assert_eq!(manifest.unique_bytes, 5);
        assert!(destination.join("manifest.json").is_file());
        fs::remove_dir_all(root).unwrap();
    }
}
