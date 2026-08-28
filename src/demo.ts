import type { ArchiveManifest } from "./types";

export const demoStorageKey = "demo:mail-attachment-archive:state";

export const demoManifest: ArchiveManifest = {
  version: 1,
  created_at: "2026-08-24T09:30:00.000Z",
  source_name: "leaving-work-account.mbox",
  archive_path: "Demo only — no folder is written",
  encrypted: false,
  verification_complete: true,
  messages: [
    { id: "final-statement", subject: "Your final statement", from: "accounts@northstar.example", date: "2026-08-20", attachment_ids: ["statement"] },
    { id: "summer-photos", subject: "Summer photos", from: "maya@example.test", date: "2026-07-12", attachment_ids: ["photo", "photo-copy"] },
    { id: "signed-contract", subject: "Re: countersigned", from: "legal@studio.example", date: "2026-08-18", attachment_ids: ["contract"] }
  ],
  attachments: [
    { id: "statement", message_id: "final-statement", filename: "closing-statement.pdf", content_type: "application/pdf", size: 1843200, sha256: "9f8d39136e708c53b2f7ba93f142e87599a606412631858c119deb6d154d7a20", stored_path: "files/9f8d3913.bin", duplicate_of: null, status: "verified" },
    { id: "photo", message_id: "summer-photos", filename: "IMG_2048.jpg", content_type: "image/jpeg", size: 3355443, sha256: "c610146aca66e2f1c3c8450f79aaf175bc653350441cca4d68b031214680e931", stored_path: "files/c610146a.bin", duplicate_of: null, status: "verified" },
    { id: "photo-copy", message_id: "summer-photos", filename: "IMG_2048-copy.jpg", content_type: "image/jpeg", size: 3355443, sha256: "c610146aca66e2f1c3c8450f79aaf175bc653350441cca4d68b031214680e931", stored_path: "files/c610146a.bin", duplicate_of: "photo", status: "verified" },
    { id: "contract", message_id: "signed-contract", filename: "signed-contract.docx", content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 0, sha256: "", stored_path: "", duplicate_of: null, status: "decode_failed" }
  ],
  issues: [{ message_id: "signed-contract", filename: "signed-contract.docx", kind: "decode_failed", detail: "The source MIME part ended before its encoded attachment was complete." }],
  total_bytes: 8554086,
  unique_bytes: 5198643
};

export function demoCsv(manifest: ArchiveManifest = demoManifest): string {
  const messages = new Map(manifest.messages.map(message => [message.id, message]));
  const quote = (value: string | number | null): string => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = manifest.attachments.map(attachment => {
    const message = messages.get(attachment.message_id);
    return [attachment.status, attachment.filename, attachment.content_type, attachment.size, attachment.sha256, attachment.duplicate_of, attachment.message_id, message?.subject ?? "", message?.from ?? ""].map(quote).join(",");
  });
  const issues = manifest.issues.map(issue => [
    `issue:${issue.kind}`, issue.filename, "", "", "", "", issue.message_id, issue.detail, ""
  ].map(quote).join(","));
  return ["status,filename,content_type,size_bytes,sha256,duplicate_of,message_id,subject,from", ...rows, ...issues].join("\n") + "\n";
}

export function demoJson(manifest: ArchiveManifest = demoManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
