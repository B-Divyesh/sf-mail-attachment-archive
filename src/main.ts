import "./styles.css";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { captureLicense, checkoutUrl, saveLicense, storedLicense, verifyLicense } from "./license";
import type { ArchiveManifest, AttachmentRecord } from "./types";
import { escapeHtml, fileExt, filename, formatBytes } from "./archive-utils";
import { parseReleaseManifest, type ReleasePlatform } from "./release-manifest";

declare const __APP_BUILD__: boolean;

const root = document.querySelector<HTMLDivElement>("#app")!;
const appMode = __APP_BUILD__ || new URLSearchParams(location.search).get("app") === "1";
const icon = `<svg class="mark" viewBox="0 0 44 44" aria-hidden="true"><path d="M5 11h12l5 6 5-6h12v22H5z"/><circle cx="12" cy="26" r="2"/><circle cx="22" cy="26" r="2"/><circle cx="32" cy="26" r="2"/><path d="M12 26h20"/></svg>`;

captureLicense();

if (location.pathname.replace(/\/+$/, "").endsWith("/privacy")) renderLegal("privacy");
else if (location.pathname.replace(/\/+$/, "").endsWith("/terms")) renderLegal("terms");
else if (appMode) renderApp();
else renderSite();

function renderLegal(page: "privacy" | "terms"): void {
  const privacy = page === "privacy";
  document.title = `${privacy ? "Privacy" : "Terms"} — Mail Attachment Archive`;
  const content = privacy
    ? `<p class="eyebrow">Effective 28 August 2026</p><h1>Privacy, in plain language</h1><p><strong>Your mailbox, messages, attachments, hashes, and reports stay on your computer.</strong> Mail Attachment Archive has no user account, telemetry, advertising, or analytics SDK.</p><h2>Local archive data</h2><p>The desktop app reads files you explicitly choose and writes an archive to a folder you explicitly choose. It does not upload mail data. Optional encryption derives a key from your passphrase on-device; the passphrase is not stored.</p><h2>License verification</h2><p>If you buy or restore Archive Plus, only your license token is sent to Sociobot’s billing API at most once per day. Mail data is never part of this request.</p><h2>Website</h2><p>The landing page sets no tracking cookies and loads no third-party scripts, fonts, pixels, or analytics.</p><h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`
    : `<p class="eyebrow">Effective 28 August 2026</p><h1>Terms of use</h1><p>Mail Attachment Archive is a local utility for creating and verifying attachment archives from mail exports you control.</p><h2>Your responsibility</h2><p>You must have the right to process the mail you import. Keep an independent source copy until you have inspected the report. Attachments remain potentially harmful if restored and opened.</p><h2>No silent promises</h2><p>“Resolved” means decoded bytes were stored locally and matched their SHA-256 checksum, not that the content is safe or semantically complete.</p><h2>Archive Plus</h2><p>Archive Plus costs <strong>US $29 once</strong> and adds recent archive shortcuts and a compact ledger. Core importing, deduplication, encryption, restoration, and reports are free. Sociobot/Dodo is the merchant of record; refunds revoke the license.</p><h2>Warranty</h2><p>The software is provided “as is,” to the extent permitted by law. These terms do not limit rights that cannot legally be limited.</p><h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`;
  root.innerHTML = `<header class="legal-header"><a class="brand" href="../">${icon}<span>Mail Attachment Archive</span></a></header><main id="main" class="legal-main">${content}</main><footer><a href="../${privacy ? "terms" : "privacy"}/">${privacy ? "Terms" : "Privacy"}</a></footer>`;
}

function renderSite(): void {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Mail Attachment Archive home">${icon}<span>Mail Attachment Archive</span></a>
      <nav aria-label="Primary"><a href="#proof">How it works</a><a href="#price">Pricing</a><a href="#download">Download</a></nav>
    </header>
    <main id="main">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> Local by design · No mailbox login</p>
          <h1>Prove every attachment made it.</h1>
          <p class="lede">Turn an MBOX export into a browsable, deduplicated archive—with a checksum and an honest report for every file that did not resolve.</p>
          <div class="hero-actions" id="download">
            <a class="button primary" id="platform-download" href="https://github.com/B-Divyesh/sf-mail-attachment-archive/releases/latest">Download for your computer</a>
            <span class="download-note" id="platform-note">Free core app · Private and offline</span>
          </div>
          <ul class="trust-list" aria-label="Product assurances"><li>Mail stays on your device</li><li>Duplicates stored once</li><li>Failures are never hidden</li></ul>
        </div>
        <figure class="hero-art">
          <picture>
            <source media="(max-width: 700px)" srcset="./assets/archive-geometry-768.webp" type="image/webp" />
            <img src="./assets/archive-geometry.webp" width="1200" height="800" fetchpriority="high" decoding="async" alt="Paper fragments passing through a verification lattice and resolving into six amber archive files" />
          </picture>
          <figcaption>Many references. One verified copy of each file.</figcaption>
        </figure>
      </section>

      <section class="proof" id="proof" aria-labelledby="proof-title">
        <div class="section-intro"><p class="eyebrow">The evidence pass</p><h2 id="proof-title">A backup you can interrogate</h2><p>A mailbox blob can exist while its useful files are missing. This archive makes each claim inspectable.</p></div>
        <ol class="process">
          <li><span>01</span><h3>Import the export</h3><p>Choose a standard MBOX file. The app reads messages locally and never connects to your email account.</p></li>
          <li><span>02</span><h3>Resolve and hash</h3><p>Attachments are decoded, SHA-256 hashed, and stored once—even when the same file appears in many threads.</p></li>
          <li><span>03</span><h3>Keep the exceptions</h3><p>Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report.</p></li>
        </ol>
      </section>

      <section class="ledger-demo" aria-labelledby="ledger-title">
        <div class="ledger-head"><div><p class="eyebrow">Offline archive</p><h2 id="ledger-title">See the files, not just the mailbox</h2></div><div class="score"><strong>99.4%</strong><span>references resolved</span></div></div>
        <div class="sample-ledger" role="table" aria-label="Example attachment manifest">
          <div class="row row-head" role="row"><span role="columnheader">Attachment</span><span role="columnheader">Message</span><span role="columnheader">Checksum</span><span role="columnheader">Status</span></div>
          <div class="row" role="row"><span role="cell"><b>closing-statement.pdf</b><small>1.8 MB · PDF</small></span><span role="cell">Your final statement</span><span role="cell" class="hash">9f8d…7a20</span><span role="cell" class="verified">✓ Verified</span></div>
          <div class="row" role="row"><span role="cell"><b>IMG_2048.jpg</b><small>3.2 MB · JPEG</small></span><span role="cell">Summer photos</span><span role="cell" class="hash">c610…e931</span><span role="cell" class="deduped">↳ Duplicate</span></div>
          <div class="row" role="row"><span role="cell"><b>signed-contract.docx</b><small>Reference damaged</small></span><span role="cell">Re: countersigned</span><span role="cell" class="hash">—</span><span role="cell" class="failed">! Reported</span></div>
        </div>
      </section>

      <section class="privacy-band" aria-labelledby="private-title"><div class="geometry-seal" aria-hidden="true"><span></span><span></span><span></span></div><div><p class="eyebrow">Your mail is not our data</p><h2 id="private-title">There is no cloud to trust.</h2><p>Parsing, hashing, search, and reports happen on your computer. No analytics, accounts, ads, or mail metadata leave it.</p></div></section>

      <section class="pricing" id="price" aria-labelledby="price-title">
        <div><p class="eyebrow">Pay once, when it earns your trust</p><h2 id="price-title">The complete archive engine is free.</h2><p>Import, deduplication, encryption, restoration, and every safety report stay available to everyone. Archive Plus adds convenience for people managing repeated migrations.</p></div>
        <div class="price-panel"><p><strong>$29</strong> one-time</p><ul><li>Saved recent archive shortcuts</li><li>Compact attachment ledger</li><li>Support continued local-first updates</li></ul><a class="button primary" href="${checkoutUrl}">Buy Archive Plus</a><button class="text-button" id="restore-license">Have a license? Restore it</button><p class="fine">Sociobot/Dodo is the merchant of record. Refunds revoke the license. <a href="./terms/">Terms</a></p></div>
      </section>

      <section class="final-cta"><p class="eyebrow">Leave with evidence</p><h2>Your account can close. Your records should still open.</h2><a class="button primary" href="#download">Get Mail Attachment Archive</a></section>
    </main>
    <footer><div class="brand">${icon}<span>Mail Attachment Archive</span></div><p>Built for private, verifiable exits.</p><nav aria-label="Legal"><a href="./privacy/">Privacy</a><a href="./terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-mail-attachment-archive">Source</a></nav><small>Original generated hero imagery; provenance in the repository.</small></footer>
    <dialog id="license-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><h2>Restore Archive Plus</h2><p>Paste the license token from your receipt. It is stored only in this browser.</p><label for="license-token">License token</label><input id="license-token" autocomplete="off" /><p class="form-status" aria-live="polite"></p><button class="button primary" id="verify-token" type="button">Verify license</button></form></dialog>`;

  void configureDownload();
  bindLicenseDialog();
}

async function configureDownload(): Promise<void> {
  const button = document.querySelector<HTMLAnchorElement>("#platform-download");
  const note = document.querySelector<HTMLElement>("#platform-note");
  if (!button || !note) return;
  const platform: ReleasePlatform = /Mac/i.test(navigator.userAgent) ? "macos" : /Win/i.test(navigator.userAgent) ? "windows" : "linux";
  const labels = { macos: "Download for macOS", windows: "Download for Windows", linux: "Download for Linux" };
  button.textContent = labels[platform];
  note.textContent = platform === "linux" ? "AppImage · Ubuntu 22.04+" : "Unsigned v0.1 · Installation help below";
  try {
    const response = await fetch(new URL("./latest.json", document.baseURI), { cache: "no-cache", credentials: "same-origin" });
    const manifest = response.ok ? parseReleaseManifest(await response.json()) : null;
    if (!manifest) throw new Error("Release manifest unavailable");
    button.href = manifest.platforms[platform].url;
    button.dataset.sha256 = manifest.platforms[platform].sha256;
    button.dataset.version = manifest.version;
    if (platform === "macos") {
      note.textContent = "Apple Silicon · ";
      const intel = document.createElement("a");
      intel.href = manifest.platforms.macos_intel.url;
      intel.dataset.sha256 = manifest.platforms.macos_intel.sha256;
      intel.textContent = "Intel Mac download";
      note.append(intel);
    }
  } catch {
    button.textContent = "View all releases";
    note.textContent = "Downloads are being published";
  }
}

function bindLicenseDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>("#license-dialog")!;
  document.querySelector("#restore-license")?.addEventListener("click", () => dialog.showModal());
  document.querySelector("#verify-token")?.addEventListener("click", async () => {
    const input = document.querySelector<HTMLInputElement>("#license-token")!;
    const status = document.querySelector<HTMLElement>(".form-status")!;
    if (!input.value.trim()) { status.textContent = "Paste a license token first."; return; }
    status.textContent = "Checking license…";
    const state = await saveLicense(input.value);
    status.textContent = state.valid ? "Archive Plus is active on this device." : "That license could not be verified. Check the token and try again.";
  });
}

function renderApp(): void {
  root.innerHTML = `
    <header class="app-header"><div class="brand">${icon}<span>Mail Attachment Archive</span></div><div class="app-actions"><span class="offline-badge">● Offline</span><button class="icon-button" id="about-button" aria-label="About and license">?</button></div></header>
    <main id="main" class="workspace">
      <section class="workspace-title"><div><p class="eyebrow">Local archive workspace</p><h1>Your attachment ledger</h1><p id="archive-subtitle">Import an MBOX file or reopen an existing archive.</p></div><div class="workspace-actions"><button class="button secondary" id="open-archive">Open archive</button><button class="button primary" id="import-mbox">Import MBOX</button></div></section>
      <section id="app-state" aria-live="polite"></section>
    </main>
    <dialog id="import-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="eyebrow">New local archive</p><h2>Choose how to store it</h2><p id="source-file"></p><label class="check-row"><input type="checkbox" id="encrypt-archive" /><span><b>Encrypt attachment files</b><small>Recommended on shared computers. Your passphrase is never stored.</small></span></label><div id="passphrase-wrap" hidden><label for="passphrase">Archive passphrase</label><input id="passphrase" type="password" minlength="10" autocomplete="new-password" /><small>At least 10 characters. Losing this passphrase means losing access.</small></div><p class="form-status" aria-live="polite"></p><button class="button primary" id="choose-location" type="button">Choose archive location</button></form></dialog>
    <dialog id="about-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="eyebrow">Version 0.1.0</p><h2>Private by construction</h2><p>No telemetry, accounts, or remote processing. Archive Plus licenses are checked at most once per day; the free archive never waits on that check.</p><p id="license-status"></p><a class="button secondary" href="${checkoutUrl}">Buy Archive Plus · $29</a></form></dialog>`;

  renderEmpty();
  bindAppActions();
  void verifyLicense();
}

function renderEmpty(): void {
  const recents = storedLicense().valid ? recentArchives() : [];
  const recentMarkup = recents.length ? `<div class="recent-list"><p class="eyebrow">Archive Plus · recent workspaces</p>${recents.map(path => `<button data-path="${escapeHtml(path)}"><b>${escapeHtml(filename(path.replace(/[/\\]manifest\.json$/, "")))}</b><small>${escapeHtml(path)}</small></button>`).join("")}</div>` : "";
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `<div class="empty-state"><div class="empty-geometry" aria-hidden="true"><i></i><i></i><i></i><b></b></div><h2>No archive open</h2><p>Start with an MBOX export from Gmail, Thunderbird, Apple Mail, or another mail provider.</p><button class="button primary" id="empty-import">Import your first MBOX</button><details><summary>What happens to my files?</summary><p>The app reads them locally, stores attachments as inert files, and writes a manifest plus a report beside them. Nothing is uploaded.</p></details>${recentMarkup}</div>`;
  document.querySelector("#empty-import")?.addEventListener("click", startImport);
  document.querySelectorAll<HTMLButtonElement>(".recent-list button").forEach(button => button.addEventListener("click", () => loadArchivePath(button.dataset.path!)));
}

function bindAppActions(): void {
  document.querySelector("#import-mbox")?.addEventListener("click", startImport);
  document.querySelector("#open-archive")?.addEventListener("click", openArchive);
  document.querySelector("#about-button")?.addEventListener("click", () => {
    const state = storedLicense();
    document.querySelector<HTMLElement>("#license-status")!.textContent = state.valid ? "Archive Plus is active." : "The complete archive engine is free. Plus adds workspace conveniences.";
    document.querySelector<HTMLDialogElement>("#about-dialog")!.showModal();
  });
}

let pendingMbox = "";
let currentManifestPath = "";

async function startImport(): Promise<void> {
  try {
    const selected = await open({ multiple: false, filters: [{ name: "MBOX mail export", extensions: ["mbox", "mbx"] }] });
    if (!selected) return;
    pendingMbox = selected as string;
    document.querySelector<HTMLElement>("#source-file")!.textContent = `Source: ${filename(pendingMbox)}`;
    const dialog = document.querySelector<HTMLDialogElement>("#import-dialog")!;
    const checkbox = document.querySelector<HTMLInputElement>("#encrypt-archive")!;
    const passWrap = document.querySelector<HTMLElement>("#passphrase-wrap")!;
    checkbox.onchange = () => { passWrap.hidden = !checkbox.checked; };
    dialog.showModal();
    document.querySelector("#choose-location")!.addEventListener("click", runImport, { once: true });
  } catch (error) { renderError("Could not open the file picker", error); }
}

async function runImport(): Promise<void> {
  const encrypted = document.querySelector<HTMLInputElement>("#encrypt-archive")!.checked;
  const passphrase = document.querySelector<HTMLInputElement>("#passphrase")!.value;
  const status = document.querySelector<HTMLElement>("#import-dialog .form-status")!;
  if (encrypted && passphrase.length < 10) { status.textContent = "Use a passphrase of at least 10 characters."; return; }
  const destination = await open({ directory: true, multiple: false });
  if (!destination) return;
  document.querySelector<HTMLDialogElement>("#import-dialog")!.close();
  renderLoading(filename(pendingMbox));
  try {
    const manifest = await invoke<ArchiveManifest>("import_mbox", { sourcePath: pendingMbox, destinationPath: destination, encrypted, passphrase: encrypted ? passphrase : null });
    currentManifestPath = `${destination}/manifest.json`;
    renderArchive(manifest);
  } catch (error) { renderError("The import could not be completed", error); }
}

async function openArchive(): Promise<void> {
  try {
    const selected = await open({ multiple: false, filters: [{ name: "Archive manifest", extensions: ["json"] }] });
    if (!selected) return;
    await loadArchivePath(selected as string);
  } catch (error) { renderError("That archive could not be opened", error); }
}

async function loadArchivePath(path: string): Promise<void> {
  currentManifestPath = path;
  const manifest = await invoke<ArchiveManifest>("load_manifest", { manifestPath: currentManifestPath });
  renderArchive(manifest);
}

function renderLoading(name: string): void {
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `<div class="loading-state"><div class="scan-line" aria-hidden="true"></div><p class="eyebrow">Reading locally</p><h2>Verifying ${escapeHtml(name)}</h2><p>Messages are decoded, attachments hashed, and duplicates resolved. The source file is not changed.</p><div class="indeterminate"><span></span></div></div>`;
}

function renderError(title: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `<div class="error-state" role="alert"><span class="issue-icon">!</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p><div><button class="button primary" id="retry-import">Try another MBOX</button><button class="button secondary" id="back-empty">Return to empty archive</button></div></div>`;
  document.querySelector("#retry-import")?.addEventListener("click", startImport);
  document.querySelector("#back-empty")?.addEventListener("click", renderEmpty);
}

function renderArchive(manifest: ArchiveManifest): void {
  const resolved = manifest.attachments.filter(a => a.status === "verified").length;
  const percent = manifest.attachments.length ? (resolved / manifest.attachments.length * 100).toFixed(1) : "100.0";
  const duplicateCount = manifest.attachments.filter(a => a.duplicate_of).length;
  document.querySelector<HTMLElement>("#archive-subtitle")!.textContent = `${manifest.source_name} · created ${new Date(manifest.created_at).toLocaleString()}`;
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `
    <section class="summary-strip" aria-label="Archive summary"><div><span>Messages</span><strong>${manifest.messages.length.toLocaleString()}</strong></div><div><span>Attachment references</span><strong>${manifest.attachments.length.toLocaleString()}</strong></div><div><span>Duplicates</span><strong>${duplicateCount.toLocaleString()}</strong></div><div class="resolution"><span>Resolved locally</span><strong>${percent}%</strong></div></section>
    <section class="archive-tools"><label for="archive-search">Search this archive</label><input id="archive-search" type="search" placeholder="Filename, sender, subject, or checksum" /><select id="status-filter" aria-label="Filter by status"><option value="all">All statuses</option><option value="verified">Verified</option><option value="duplicate">Duplicates</option><option value="issue">Needs attention</option></select>${storedLicense().valid ? `<button class="button secondary" id="compact-ledger" aria-pressed="false">Compact</button>` : ""}<button class="button secondary" id="export-report">Export report</button></section>
    <div class="archive-grid"><section class="manifest-panel" aria-labelledby="manifest-title"><div class="panel-title"><div><p class="eyebrow">Attachment manifest</p><h2 id="manifest-title">Files and references</h2></div><span id="visible-count">${manifest.attachments.length} shown</span></div><div class="attachment-list" id="attachment-list"></div></section>
    <aside class="verification-panel" aria-labelledby="verification-title"><p class="eyebrow">Verification</p><h2 id="verification-title">${manifest.issues.length ? `${manifest.issues.length} items need attention` : "Every decoded file is accounted for"}</h2><div class="resolution-ring" style="--score:${percent}"><strong>${percent}%</strong><span>resolved</span></div><dl><div><dt>Source bytes</dt><dd>${formatBytes(manifest.total_bytes)}</dd></div><div><dt>Stored once</dt><dd>${formatBytes(manifest.unique_bytes)}</dd></div><div><dt>Space avoided</dt><dd>${formatBytes(Math.max(0, manifest.total_bytes - manifest.unique_bytes))}</dd></div><div><dt>Storage</dt><dd>${manifest.encrypted ? "Encrypted" : "Plain local files"}</dd></div></dl><button class="text-button" id="view-issues">${manifest.issues.length ? "View exception details" : "No exception report needed"}</button></aside></div>`;
  bindArchive(manifest);
  renderAttachmentRows(manifest.attachments, manifest);
  recordRecent(currentManifestPath);
}

function bindArchive(manifest: ArchiveManifest): void {
  const search = document.querySelector<HTMLInputElement>("#archive-search")!;
  const filter = document.querySelector<HTMLSelectElement>("#status-filter")!;
  const update = () => {
    const query = search.value.toLowerCase();
    const messageById = new Map(manifest.messages.map(m => [m.id, m]));
    const rows = manifest.attachments.filter(a => {
      const message = messageById.get(a.message_id);
      const matches = `${a.filename} ${a.sha256} ${message?.subject || ""} ${message?.from || ""}`.toLowerCase().includes(query);
      const status = filter.value === "all" || filter.value === "duplicate" && !!a.duplicate_of || filter.value === "issue" && a.status !== "verified" || filter.value === a.status;
      return matches && status;
    });
    renderAttachmentRows(rows, manifest);
  };
  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  document.querySelector("#export-report")?.addEventListener("click", async () => {
    const destination = await save({ defaultPath: "attachment-verification.csv", filters: [{ name: "CSV report", extensions: ["csv"] }] });
    if (destination) await invoke("export_report", { manifestPath: currentManifestPath, destinationPath: destination, format: "csv" });
  });
  document.querySelector("#view-issues")?.addEventListener("click", () => showIssues(manifest));
  document.querySelector("#compact-ledger")?.addEventListener("click", event => {
    const button = event.currentTarget as HTMLButtonElement;
    const compact = document.querySelector(".attachment-list")?.classList.toggle("compact") || false;
    button.setAttribute("aria-pressed", String(compact));
  });
}

function renderAttachmentRows(rows: AttachmentRecord[], manifest: ArchiveManifest): void {
  const list = document.querySelector<HTMLElement>("#attachment-list")!;
  document.querySelector<HTMLElement>("#visible-count")!.textContent = `${rows.length} shown`;
  if (!rows.length) { list.innerHTML = `<div class="no-results"><p>No attachments match this filter.</p><button class="text-button" id="clear-filter">Clear search and filters</button></div>`; document.querySelector("#clear-filter")?.addEventListener("click", () => { (document.querySelector("#archive-search") as HTMLInputElement).value = ""; (document.querySelector("#status-filter") as HTMLSelectElement).value = "all"; renderAttachmentRows(manifest.attachments, manifest); }); return; }
  const messages = new Map(manifest.messages.map(m => [m.id, m]));
  list.innerHTML = rows.map(a => { const m = messages.get(a.message_id); const state = a.status !== "verified" ? `<span class="failed">! ${escapeHtml(a.status)}</span>` : a.duplicate_of ? `<span class="deduped">↳ Duplicate</span>` : `<span class="verified">✓ Verified</span>`; return `<article class="attachment-row"><button class="file-main" data-id="${escapeHtml(a.id)}"><span class="file-icon">${fileExt(a.filename)}</span><span><b>${escapeHtml(a.filename)}</b><small>${escapeHtml(m?.subject || "Unknown message")} · ${formatBytes(a.size)}</small></span></button><code title="SHA-256 ${escapeHtml(a.sha256)}">${escapeHtml(a.sha256.slice(0, 8))}…${escapeHtml(a.sha256.slice(-6))}</code>${state}</article>`; }).join("");
  list.querySelectorAll<HTMLButtonElement>(".file-main").forEach(button => button.addEventListener("click", () => restoreAttachment(rows.find(a => a.id === button.dataset.id)!, manifest.encrypted)));
}

async function restoreAttachment(attachment: AttachmentRecord, encrypted: boolean): Promise<void> {
  const destination = await save({ defaultPath: attachment.filename });
  if (!destination) return;
  let passphrase: string | null = null;
  if (encrypted) { passphrase = window.prompt("Enter this archive’s passphrase to restore the file:"); if (!passphrase) return; }
  try { await invoke("restore_attachment", { manifestPath: currentManifestPath, attachmentId: attachment.id, destinationPath: destination, passphrase }); window.alert(`Restored and checksum-verified: ${attachment.filename}`); }
  catch (error) { window.alert(`The file was not restored: ${String(error)}`); }
}

function showIssues(manifest: ArchiveManifest): void {
  if (!manifest.issues.length) return;
  const detail = manifest.issues.slice(0, 20).map(i => `${i.kind}: ${i.filename || i.message_id || "mailbox"} — ${i.detail}`).join("\n");
  window.alert(`${detail}${manifest.issues.length > 20 ? `\n…and ${manifest.issues.length - 20} more. Export the report for all details.` : ""}`);
}

const recentKey = "maa:recent-archives";
function recentArchives(): string[] { try { return JSON.parse(localStorage.getItem(recentKey) || "[]") as string[]; } catch { return []; } }
function recordRecent(path: string): void { if (!path || !storedLicense().valid) return; localStorage.setItem(recentKey, JSON.stringify([path, ...recentArchives().filter(item => item !== path)].slice(0, 6))); }
