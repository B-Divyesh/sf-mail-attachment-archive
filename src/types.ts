export interface AttachmentRecord {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size: number;
  sha256: string;
  stored_path: string;
  duplicate_of: string | null;
  status: "verified" | "missing" | "corrupt";
}

export interface MessageRecord {
  id: string;
  subject: string;
  from: string;
  date: string;
  attachment_ids: string[];
}

export interface IssueRecord {
  message_id: string | null;
  filename: string | null;
  kind: string;
  detail: string;
}

export interface ArchiveManifest {
  version: number;
  created_at: string;
  source_name: string;
  archive_path: string;
  encrypted: boolean;
  messages: MessageRecord[];
  attachments: AttachmentRecord[];
  issues: IssueRecord[];
  total_bytes: number;
  unique_bytes: number;
}

export interface LicenseState {
  token: string | null;
  valid: boolean;
  checkedAt: number;
}
