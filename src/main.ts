import "./styles.css";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { captureLicense, checkoutUrl, checkoutUrlForReturn, saveLicense, storedLicense, verifyLicense } from "./license";
import type { ArchiveManifest, AttachmentRecord } from "./types";
import { escapeHtml, fileExt, filename, formatBytes, resolutionScore } from "./archive-utils";
import { parseReleaseManifest, type ReleasePlatform } from "./release-manifest";
import { demoCsv, demoJson, demoManifest, demoStorageKey } from "./demo";

declare const __APP_BUILD__: boolean;

const root = document.querySelector<HTMLDivElement>("#app")!;
const appMode = __APP_BUILD__ || new URLSearchParams(location.search).get("app") === "1";
const demoMode = location.pathname.replace(/\/+$/, "").endsWith("/demo") || new URLSearchParams(location.search).get("demo") === "1";
const icon = `<svg class="mark" viewBox="0 0 44 44" aria-hidden="true"><path d="M5 11h12l5 6 5-6h12v22H5z"/><circle cx="12" cy="26" r="2"/><circle cx="22" cy="26" r="2"/><circle cx="32" cy="26" r="2"/><path d="M12 26h20"/></svg>`;
const siteOrigin = "https://mail-attachment-archive.sociobot.in";
const appVersion = "0.1.5";

interface NativeClaimConfig {
  claim: "local-only" | "free-core";
  sourcePath: string;
  archivePath: string;
  restoredPath: string;
  csvPath: string;
  jsonPath: string;
  passphrase: string;
}

if (!demoMode) captureLicense();

if (location.pathname.replace(/\/+$/, "").endsWith("/privacy")) renderLegal("privacy");
else if (location.pathname.replace(/\/+$/, "").endsWith("/terms")) renderLegal("terms");
else if (demoMode) renderDemo();
else if (appMode) renderApp();
else renderSite();

function setRouteMetadata(title: string, description: string, path: string): void {
  document.title = title;
  const canonical = `${siteOrigin}${path}`;
  const set = (selector: string, value: string): void => {
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
  };
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonical);
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[name="twitter:title"]', title);
  set('meta[name="twitter:description"]', description);
}

/** Give document navigation a useful keyboard and screen-reader destination. */
function announceRoute(): void {
  const shouldFocus = sessionStorage.getItem("maa:route-navigation") === "1" || sessionStorage.getItem("maa:history-focus") === "1";
  if (!shouldFocus) return;
  sessionStorage.removeItem("maa:route-navigation");
  sessionStorage.removeItem("maa:history-focus");
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    const announcement = document.querySelector<HTMLElement>("#route-announcement");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    if (announcement) announcement.textContent = heading.textContent?.trim() || "New page";
  });
}

function prepareRouteLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach(link => {
    link.addEventListener("click", () => sessionStorage.setItem("maa:route-navigation", "1"));
  });
}

function restoreRouteFocusOnHistory(): void {
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    const heading = document.querySelector<HTMLElement>("main h1");
    heading?.focus({ preventScroll: true });
    const announcement = document.querySelector<HTMLElement>("#route-announcement");
    if (heading && announcement) announcement.textContent = heading.textContent?.trim() || "New page";
  }, { once: true });
}

function siteHeader(demo = false): string {
  return `<header class="site-header"><a class="brand" href="/" aria-label="Mail Attachment Archive home">${icon}<span>Mail Attachment Archive</span></a><nav aria-label="Primary"><a href="/demo/">Demo</a><a href="/#proof">How it works</a><a href="/#download">Download</a><a href="/privacy/">Privacy</a></nav>${demo ? `<span class="offline-badge">● Sample archive</span>` : ""}</header>`;
}

function siteFooter(): string {
  return `<footer><div class="brand">${icon}<span>Mail Attachment Archive</span></div><p>Local attachment archives with verification reports.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-mail-attachment-archive">Source</a></nav><small>Mail Attachment Archive · v${appVersion} · Built by Param Factory · Original generated hero imagery; provenance in the repository.</small></footer>`;
}

function bindDialogFocus(dialog: HTMLDialogElement, trigger: HTMLElement): void {
  const focusable = (): HTMLElement[] => Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(element => !element.hidden && element.getClientRects().length > 0);
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const elements = focusable();
    if (!elements.length) return;
    const active = document.activeElement as HTMLElement | null;
    const index = active ? elements.indexOf(active) : -1;
    if (event.shiftKey && (index <= 0 || !dialog.contains(active))) {
      event.preventDefault();
      elements.at(-1)?.focus();
    } else if (!event.shiftKey && (index === elements.length - 1 || !dialog.contains(active))) {
      event.preventDefault();
      elements[0].focus();
    }
  });
  dialog.addEventListener("close", () => trigger.focus());
}

function openDialog(dialog: HTMLDialogElement, initialFocus: HTMLElement): void {
  dialog.showModal();
  queueMicrotask(() => initialFocus.focus());
}

function renderLegal(page: "privacy" | "terms"): void {
  const privacy = page === "privacy";
  setRouteMetadata(`${privacy ? "Privacy" : "Terms"} — Mail Attachment Archive`, privacy ? "Read how Mail Attachment Archive keeps mail data local and uses license tokens." : "Read the terms for Mail Attachment Archive, a local MBOX attachment archive.", privacy ? "/privacy/" : "/terms/");
  const content = privacy
    ? `<p class="eyebrow">Effective 29 August 2026</p><h1>Privacy, in plain language</h1><p><strong>Archive processing makes no network connections.</strong> The app writes mail data only to the archive folder you choose.</p><h2>Local archive data</h2><p>The desktop app reads an MBOX export you choose. Optional encryption derives a key on your computer, and the passphrase is not stored.</p><h2>License verification</h2><p>If you buy or restore Archive Plus, only your license token is sent to Sociobot’s billing API. Verification runs at most once per day.</p><h2>Website</h2><p>The site sets no tracking cookies and loads no third-party scripts, fonts, pixels, or analytics.</p><h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`
    : `<p class="eyebrow">Effective 29 August 2026</p><h1>Terms of use</h1><p>Mail Attachment Archive creates and checks local attachment archives from MBOX exports you control.</p><h2>Your responsibility</h2><p>You must have the right to process imported mail. Keep the source export until you inspect the report and restore important files.</p><h2>What resolved means</h2><p>“Resolved” means decoded bytes were stored locally and matched their SHA-256 checksum. It does not mean the content is safe or complete.</p><h2>Archive Plus</h2><p>Archive Plus costs <strong>US $29 once</strong>. Dodo hosts checkout. A revoked license no longer enables Plus features.</p><h2>Warranty</h2><p>The software is provided “as is,” to the extent permitted by law. These terms do not limit rights that cannot legally be limited.</p><h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`;
  root.innerHTML = `${siteHeader()}<main id="main" tabindex="-1" class="legal-main">${content}</main>${siteFooter()}<div id="route-announcement" class="sr-only" aria-live="polite"></div>`;
  prepareRouteLinks();
  restoreRouteFocusOnHistory();
  announceRoute();
}

function renderSite(): void {
  setRouteMetadata("Mail Attachment Archive — check an MBOX export", "Make a local attachment archive and keep an explicit report of every failure.", "/");
  root.innerHTML = `
    ${siteHeader()}
    <main id="main" tabindex="-1">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> Local attachment archive</p>
          <h1>Prove every attachment made it.</h1>
          <p class="lede">For people leaving or backing up an email account, it turns an MBOX export into a checked local archive.</p>
          <div class="hero-actions" id="download">
            <a class="button primary" href="/demo/">Try it with sample data</a>
            <span class="download-note">Opens a separate demo. Nothing is saved.</span>
          </div>
          <ul class="trust-list" aria-label="Product facts"><li>Processing makes no network connections</li><li>Core archive tools are free</li><li>Archive Plus costs $29 once</li></ul>
          <div class="download-row"><a class="text-button" id="platform-download" href="https://github.com/B-Divyesh/sf-mail-attachment-archive/releases/latest">Download for your computer</a><span class="download-note" id="platform-note">Free core app</span></div>
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
        <div class="section-intro"><p class="eyebrow">How attachment checks work</p><h2 id="proof-title">Check every attachment result</h2><p>An MBOX export can exist while useful files are missing. This archive shows each attachment result.</p></div>
        <ol class="process">
          <li><span>01</span><h3>Import the MBOX export</h3><p>Choose a standard MBOX export. The app reads it locally and never connects to your email account.</p></li>
          <li><span>02</span><h3>Verify each attachment</h3><p>Attachments are decoded, checked, and stored once—even when the same file appears in many threads.</p></li>
          <li><span>03</span><h3>Review every failed attachment</h3><p>Missing, malformed, and corrupt items stay visible in a CSV or JSON verification report.</p></li>
        </ol>
      </section>

      <section class="walkthrough" aria-labelledby="walkthrough-title"><div class="section-intro"><p class="eyebrow">Desktop walkthrough</p><h2 id="walkthrough-title">Review the archive before you download</h2><p>These frames show the desktop steps for an MBOX export and its verification report.</p></div><div class="walkthrough-grid"><figure><img src="/assets/walkthrough-import.svg" width="720" height="450" alt="Desktop app screen with the Import MBOX export control selected." /><figcaption>1. Choose an MBOX export.</figcaption></figure><figure><img src="/assets/walkthrough-folder.svg" width="720" height="450" alt="Desktop app screen choosing a local archive folder and optional encryption." /><figcaption>2. Choose a local archive folder.</figcaption></figure><figure><img src="/assets/walkthrough-report.svg" width="720" height="450" alt="Desktop app verification report showing three resolved references and one reported failure." /><figcaption>3. Review the verification report.</figcaption></figure><figure><img src="/assets/walkthrough-restore.svg" width="720" height="450" alt="Desktop app row for a checked PDF with a restore action." /><figcaption>4. Restore a checksum-verified file.</figcaption></figure></div></section>

      <section class="ledger-demo" aria-labelledby="ledger-title">
        <div class="ledger-head"><div><p class="eyebrow">Sample archive</p><h2 id="ledger-title">Sample attachment records</h2></div><div class="score"><strong>3 of 4</strong><span>sample references resolved</span></div></div>
        <div class="sample-ledger" role="table" aria-label="Example attachment manifest">
          <div class="row row-head" role="row"><span role="columnheader">Attachment</span><span role="columnheader">Message</span><span role="columnheader">Checksum</span><span role="columnheader">Status</span></div>
          <div class="row" role="row"><span role="cell"><b>closing-statement.pdf</b><small>1.8 MB · PDF</small></span><span role="cell">Your final statement</span><span role="cell" class="hash">9f8d…7a20</span><span role="cell" class="verified">✓ Verified</span></div>
          <div class="row" role="row"><span role="cell"><b>IMG_2048.jpg</b><small>3.2 MB · JPEG</small></span><span role="cell">Summer photos</span><span role="cell" class="hash">c610…e931</span><span role="cell" class="deduped">↳ Duplicate</span></div>
          <div class="row" role="row"><span role="cell"><b>signed-contract.docx</b><small>Reference damaged</small></span><span role="cell">Re: countersigned</span><span role="cell" class="hash">—</span><span role="cell" class="failed">! Reported</span></div>
        </div>
      </section>

      <section class="privacy-band" aria-labelledby="private-title"><div class="geometry-seal" aria-hidden="true"><span></span><span></span><span></span></div><div><p class="eyebrow">Private processing</p><h2 id="private-title">Mail processing stays on your computer.</h2><p>Importing, checking, search, and verification reports happen on your computer. No mail data leaves it.</p></div></section>

      <section class="pricing" id="price" aria-labelledby="price-title">
        <div><p class="eyebrow">Archive Plus pricing</p><h2 id="price-title">The complete archive engine is free.</h2><p>Import, duplicate checks, encryption, restoration, and verification reports stay free. Archive Plus adds shortcuts for repeated migrations.</p></div>
        <div class="price-panel"><p><strong>$29</strong> one-time</p><ul><li>Saved recent archive shortcuts</li><li>Compact attachment ledger</li></ul><a class="button primary" href="${checkoutUrl}">Buy Archive Plus</a><button class="text-button" id="restore-license">Have a license? Restore it</button><p class="fine">Dodo hosts checkout. Revoked licenses no longer enable Plus. <a href="./terms/">Terms</a></p></div>
      </section>

      <section class="final-cta"><p class="eyebrow">Keep a checked local archive</p><h2>Download the desktop archive</h2><a class="button primary" href="#download">Download Mail Attachment Archive</a></section>
    </main>
    ${siteFooter()}<div id="route-announcement" class="sr-only" aria-live="polite"></div>
    <dialog id="license-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><h2>Restore Archive Plus</h2><p>Paste the license token from your receipt. It is stored only in this browser.</p><label for="license-token">License token</label><input id="license-token" autocomplete="off" /><p class="form-status" aria-live="polite"></p><button class="button primary" id="verify-token" type="button">Verify license</button></form></dialog>`;

  void configureDownload();
  bindLicenseDialog();
  prepareRouteLinks();
  restoreRouteFocusOnHistory();
  announceRoute();
}

function renderDemo(): void {
  setRouteMetadata("Demo — Mail Attachment Archive", "Inspect a realistic local sample archive with four attachment references and its verification report.", "/demo/");
  localStorage.setItem(demoStorageKey, JSON.stringify({ startedAt: new Date().toISOString() }));
  root.innerHTML = `
    <div class="demo-banner" role="status"><strong>Demo — sample data, nothing is saved</strong><span id="demo-notice" aria-live="polite"></span><div><button class="text-button" id="reset-demo">Reset demo</button><a class="button secondary" id="leave-demo" href="/#download">Start for real</a></div></div>
    ${siteHeader(true)}
    <main id="main" tabindex="-1" class="workspace demo-workspace">
      <section class="workspace-title"><div><p class="eyebrow">Leaving-account sample</p><h1>Inspect a checked attachment archive</h1><p id="archive-subtitle">leaving-work-account.mbox · four attachment references</p></div></section>
      <section id="demo-state"></section>
    </main>
    ${siteFooter()}<div id="route-announcement" class="sr-only" aria-live="polite"></div>`;
  renderDemoArchive();
  document.querySelector("#reset-demo")?.addEventListener("click", () => {
    localStorage.removeItem(demoStorageKey);
    localStorage.setItem(demoStorageKey, JSON.stringify({ startedAt: new Date().toISOString() }));
    renderDemoArchive();
    document.querySelector<HTMLElement>("#demo-notice")!.textContent = "Sample restored.";
  });
  document.querySelector("#leave-demo")?.addEventListener("click", () => localStorage.removeItem(demoStorageKey));
  document.querySelector(".site-header .brand")?.addEventListener("click", () => localStorage.removeItem(demoStorageKey));
  window.addEventListener("pagehide", () => {
    localStorage.removeItem(demoStorageKey);
    sessionStorage.setItem("maa:history-focus", "1");
  }, { once: true });
  prepareRouteLinks();
  restoreRouteFocusOnHistory();
  announceRoute();
}

function renderDemoArchive(): void {
  const resolved = demoManifest.attachments.filter(item => item.status === "verified").length;
  const duplicateCount = demoManifest.attachments.filter(item => item.duplicate_of).length;
  document.querySelector<HTMLElement>("#demo-state")!.innerHTML = `
    <section class="summary-strip" aria-label="Sample archive summary"><div><span>Messages</span><strong>${demoManifest.messages.length}</strong></div><div><span>Attachment references</span><strong>${demoManifest.attachments.length}</strong></div><div><span>Duplicates</span><strong>${duplicateCount}</strong></div><div class="resolution"><span>Resolved locally</span><strong>${resolved} of ${demoManifest.attachments.length}</strong></div></section>
    <section class="archive-tools"><label for="demo-search">Search this archive</label><input id="demo-search" type="search" placeholder="Filename, sender, subject, or checksum" /><select id="demo-filter" aria-label="Filter by status"><option value="all">All statuses</option><option value="verified">Verified</option><option value="duplicate">Duplicates</option><option value="issue">Needs attention</option></select><button class="button secondary" id="demo-export-csv">Export CSV</button><button class="button secondary" id="demo-export-json">Export JSON</button></section>
    <div class="archive-grid"><section class="manifest-panel" aria-labelledby="demo-manifest-title"><div class="panel-title"><div><p class="eyebrow">Attachment manifest</p><h2 id="demo-manifest-title">Files and references</h2></div><span id="demo-visible-count">4 shown</span></div><div class="attachment-list" id="demo-list"></div></section>
    <aside class="verification-panel" aria-labelledby="demo-verification-title"><p class="eyebrow">Verification report</p><h2 id="demo-verification-title">1 item needs attention</h2><div class="resolution-ring" style="--score:75"><strong>75.0%</strong><span>resolved</span></div><dl><div><dt>Source bytes</dt><dd>${formatBytes(demoManifest.total_bytes)}</dd></div><div><dt>Stored once</dt><dd>${formatBytes(demoManifest.unique_bytes)}</dd></div><div><dt>Space avoided</dt><dd>${formatBytes(demoManifest.total_bytes - demoManifest.unique_bytes)}</dd></div><div><dt>Storage</dt><dd>Plain local files</dd></div></dl><p class="issue-copy"><strong>signed-contract.docx</strong><br />The attachment data was incomplete, so this file could not be saved. The verification report keeps this failure visible.</p></aside></div>`;
  const search = document.querySelector<HTMLInputElement>("#demo-search")!;
  const filter = document.querySelector<HTMLSelectElement>("#demo-filter")!;
  const update = (): void => {
    const query = search.value.toLowerCase();
    const messages = new Map(demoManifest.messages.map(message => [message.id, message]));
    const rows = demoManifest.attachments.filter(attachment => {
      const message = messages.get(attachment.message_id);
      const haystack = `${attachment.filename} ${attachment.sha256} ${message?.subject ?? ""} ${message?.from ?? ""}`.toLowerCase();
      const matchesStatus = filter.value === "all" || filter.value === "duplicate" && Boolean(attachment.duplicate_of) || filter.value === "issue" && attachment.status !== "verified" || filter.value === attachment.status;
      return haystack.includes(query) && matchesStatus;
    });
    renderDemoRows(rows);
  };
  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  const downloadDemoReport = (format: "csv" | "json"): void => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([format === "csv" ? demoCsv() : demoJson()], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" }));
    link.download = `sample-attachment-verification.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  document.querySelector("#demo-export-csv")?.addEventListener("click", () => downloadDemoReport("csv"));
  document.querySelector("#demo-export-json")?.addEventListener("click", () => downloadDemoReport("json"));
  renderDemoRows(demoManifest.attachments);
}

function renderDemoRows(rows: AttachmentRecord[]): void {
  const messages = new Map(demoManifest.messages.map(message => [message.id, message]));
  document.querySelector<HTMLElement>("#demo-visible-count")!.textContent = `${rows.length} shown`;
  document.querySelector<HTMLElement>("#demo-list")!.innerHTML = rows.length ? rows.map(attachment => {
    const message = messages.get(attachment.message_id);
    const state = attachment.status !== "verified" ? `<span class="failed">! Reported</span>` : attachment.duplicate_of ? `<span class="deduped">↳ Duplicate</span>` : `<span class="verified">✓ Verified</span>`;
    const hash = attachment.sha256 ? `${attachment.sha256.slice(0, 8)}…${attachment.sha256.slice(-6)}` : "No checksum";
    return `<article class="attachment-row"><div class="file-main"><span class="file-icon">${fileExt(attachment.filename)}</span><span><b>${escapeHtml(attachment.filename)}</b><small>${escapeHtml(message?.subject ?? "Unknown message")} · ${formatBytes(attachment.size)}</small></span></div><code title="SHA-256 ${escapeHtml(attachment.sha256)}">${escapeHtml(hash)}</code>${state}</article>`;
  }).join("") : `<div class="no-results"><p>No sample attachments match these filters.</p></div>`;
}

async function configureDownload(): Promise<void> {
  const button = document.querySelector<HTMLAnchorElement>("#platform-download");
  const note = document.querySelector<HTMLElement>("#platform-note");
  if (!button || !note) return;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) {
    button.textContent = "Open this page on a computer";
    button.removeAttribute("href");
    button.setAttribute("aria-disabled", "true");
    note.textContent = "Available for macOS, Windows, and Linux.";
    return;
  }
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
  const trigger = document.querySelector<HTMLElement>("#restore-license")!;
  bindDialogFocus(dialog, trigger);
  document.querySelector("#restore-license")?.addEventListener("click", () => openDialog(dialog, document.querySelector<HTMLElement>("#license-token")!));
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
    <header class="app-header"><div class="brand">${icon}<span>Mail Attachment Archive</span></div><div class="app-actions"><span class="offline-badge">● Local app</span><button class="icon-button" id="about-button" aria-label="About and license">?</button></div></header>
    <main id="main" tabindex="-1" class="workspace">
      <section class="workspace-title"><div><p class="eyebrow">Local archive workspace</p><h1>Your attachment ledger</h1><p id="archive-subtitle">Import an MBOX export or reopen an existing archive.</p></div><div class="workspace-actions"><button class="button secondary" id="open-archive">Open archive</button><button class="button primary" id="import-mbox">Import MBOX export</button></div></section>
      <section id="app-state" aria-live="polite"></section>
    </main>
    <dialog id="import-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="eyebrow">New local archive</p><h2>Choose how to store it</h2><p id="source-file"></p><label class="check-row"><input type="checkbox" id="encrypt-archive" /><span><b>Encrypt attachment files</b><small>Recommended on shared computers. Your passphrase is never stored.</small></span></label><div id="passphrase-wrap" hidden><label for="passphrase">Archive passphrase</label><input id="passphrase" type="password" minlength="10" autocomplete="new-password" /><small>At least 10 characters. Losing this passphrase means losing access.</small></div><p class="form-status" aria-live="polite"></p><button class="button primary" id="choose-location" type="button">Choose archive location</button></form></dialog>
    <dialog id="about-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close">×</button><p class="eyebrow">Version ${appVersion}</p><h2>Private archive processing</h2><p>Free archive processing makes no network connections. License verification sends only the token and runs at most once per day.</p><p id="license-status"></p><label for="app-license-token">Restore Archive Plus on this computer</label><input id="app-license-token" autocomplete="off" /><p class="form-status" id="app-license-status" aria-live="polite"></p><button class="button primary" id="verify-app-license" type="button">Verify and restore license</button><a class="button secondary" href="${checkoutUrlForReturn("https://mail-attachment-archive.sociobot.in/")}" target="_blank" rel="noopener">Buy Archive Plus · $29</a><p class="fine">After checkout, paste the license token from your receipt here. It stays in this app only.</p></form></dialog>`;

  renderEmpty();
  bindAppActions();
  bindDialogFocus(document.querySelector<HTMLDialogElement>("#import-dialog")!, document.querySelector<HTMLElement>("#import-mbox")!);
  bindDialogFocus(document.querySelector<HTMLDialogElement>("#about-dialog")!, document.querySelector<HTMLElement>("#about-button")!);
  void verifyLicense();
  void runNativeClaimHarness();
}

/**
 * Runs only when the packaged binary receives the factory's explicit claim-test
 * environment. It uses the production Tauri IPC commands and production UI,
 * then asks the Rust host to persist observable DOM evidence and exit.
 */
async function runNativeClaimHarness(): Promise<void> {
  let config: NativeClaimConfig | null;
  try {
    config = await invoke<NativeClaimConfig | null>("native_claim_config");
  } catch {
    return;
  }
  if (!config) return;

  const checks: Array<{ name: string; passed: boolean; visible?: string }> = [];
  const check = (name: string, passed: boolean, visible?: string): void => {
    checks.push({ name, passed, visible });
    if (!passed) throw new Error(`Native claim check failed: ${name}`);
  };
  const finish = async (passed: boolean, error?: unknown): Promise<void> => {
    const evidence = {
      claim: config!.claim,
      passed,
      error: error ? String(error) : null,
      checks,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim(),
      visibleText: document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim(),
      url: location.href,
      cookie: document.cookie,
      storageKeys: Object.keys(localStorage)
    };
    await invoke("native_claim_finish", { passed, evidence: JSON.stringify(evidence, null, 2) });
  };

  try {
    localStorage.clear();
    const state = document.querySelector<HTMLElement>("#app-state")!;
    state.innerHTML = `<div class="loading-state" id="native-claim-progress"><p class="eyebrow">Packaged app verification</p><h2>Choosing the test MBOX export</h2><p>The production command bridge is processing a clean local fixture.</p></div>`;
    check("unlicensed start", !storedLicense().token, "The complete archive engine is free");
    check("source choice shown", state.textContent?.includes("Choosing the test MBOX export") === true, state.textContent || "");

    const encrypted = config.claim === "free-core";
    const imported = await invoke<ArchiveManifest>("import_mbox", {
      sourcePath: config.sourcePath,
      destinationPath: config.archivePath,
      encrypted,
      passphrase: encrypted ? config.passphrase : null
    });
    currentManifestPath = `${config.archivePath}/manifest.json`;
    currentArchivePassphrase = encrypted ? config.passphrase : null;
    renderArchive(imported);
    check("import result rendered", document.querySelectorAll(".attachment-row").length === imported.attachments.length, document.querySelector("#visible-count")?.textContent || "");
    check("free export controls rendered", !!document.querySelector("#export-csv") && !!document.querySelector("#export-json"), "Export CSV · Export JSON");
    check("Plus remains locked", !document.querySelector("#compact-ledger"), "No license token");

    const reopened = await invoke<ArchiveManifest>("load_manifest", { manifestPath: currentManifestPath });
    renderArchive(reopened);
    check("reopened archive rendered", document.querySelector("#archive-subtitle")?.textContent?.includes(reopened.source_name) === true, document.querySelector("#archive-subtitle")?.textContent || "");

    let checked = reopened;
    if (encrypted) {
      check("encrypted archive awaits passphrase", document.body.textContent?.includes("Enter the passphrase to check every file") === true, "Enter the passphrase to check every file");
      checked = await invoke<ArchiveManifest>("verify_encrypted_archive", { manifestPath: currentManifestPath, passphrase: config.passphrase });
      renderArchive(checked);
      check("encrypted scan rendered", document.body.textContent?.includes("Every decoded file is accounted for") === true, "Every decoded file is accounted for");
      const restorable = checked.attachments.find(item => item.status === "verified" && !item.duplicate_of);
      check("restorable record available", !!restorable, restorable?.filename);
      await invoke("restore_attachment", { manifestPath: currentManifestPath, attachmentId: restorable!.id, destinationPath: config.restoredPath, passphrase: config.passphrase });
      await invoke("export_report", { manifestPath: currentManifestPath, destinationPath: config.csvPath, format: "csv", passphrase: config.passphrase });
      await invoke("export_report", { manifestPath: currentManifestPath, destinationPath: config.jsonPath, format: "json", passphrase: config.passphrase });
      document.querySelector<HTMLElement>("#archive-action-status")!.textContent = "Restored one checked file. CSV and JSON reports saved.";
      check("workflow success rendered", document.body.textContent?.includes("CSV and JSON reports saved") === true, "Restored one checked file. CSV and JSON reports saved.");
    }

    check("no authentication state", document.cookie === "" && !Object.keys(localStorage).some(key => /auth|session|account/i.test(key)), "No cookies or identity keys");
    await new Promise(resolve => setTimeout(resolve, 250));
    await finish(true);
  } catch (error) {
    await finish(false, error);
  }
}

function renderEmpty(): void {
  const recents = storedLicense().valid ? recentArchives() : [];
  const recentMarkup = recents.length ? `<div class="recent-list"><p class="eyebrow">Archive Plus · recent workspaces</p>${recents.map(path => `<button data-path="${escapeHtml(path)}"><b>${escapeHtml(filename(path.replace(/[/\\]manifest\.json$/, "")))}</b><small>${escapeHtml(path)}</small></button>`).join("")}</div>` : "";
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `<div class="empty-state"><div class="empty-geometry" aria-hidden="true"><i></i><i></i><i></i><b></b></div><h2>No archive open</h2><p>Start with an MBOX export from Gmail, Thunderbird, Apple Mail, or another mail provider.</p><div class="empty-actions"><button class="button primary" id="empty-import">Import your first MBOX export</button><button class="button secondary" id="load-sample">Load sample archive</button></div><details><summary>What happens to my files?</summary><p>The app reads them locally, stores attachments without opening them, and writes a manifest plus a verification report beside them.</p></details>${recentMarkup}</div>`;
  document.querySelector("#empty-import")?.addEventListener("click", startImport);
  document.querySelector("#load-sample")?.addEventListener("click", renderSampleProject);
  document.querySelectorAll<HTMLButtonElement>(".recent-list button").forEach(button => button.addEventListener("click", () => loadArchivePath(button.dataset.path!)));
}

function renderSampleProject(): void {
  const state = document.querySelector<HTMLElement>("#app-state")!;
  state.id = "demo-state";
  state.insertAdjacentHTML("beforebegin", `<div class="demo-banner in-app" role="status"><strong>Demo — sample data, nothing is saved</strong><div><button class="text-button" id="reset-sample">Reset demo</button><button class="button secondary" id="close-sample">Start for real</button></div></div>`);
  document.querySelector<HTMLElement>("#archive-subtitle")!.textContent = "leaving-work-account.mbox · four attachment references";
  renderDemoArchive();
  document.querySelector("#reset-sample")?.addEventListener("click", renderDemoArchive);
  document.querySelector("#close-sample")?.addEventListener("click", () => {
    document.querySelector(".demo-banner.in-app")?.remove();
    state.id = "app-state";
    document.querySelector<HTMLElement>("#archive-subtitle")!.textContent = "Import an MBOX export or reopen an existing archive.";
    renderEmpty();
  });
}

function bindAppActions(): void {
  document.querySelector("#import-mbox")?.addEventListener("click", startImport);
  document.querySelector("#open-archive")?.addEventListener("click", openArchive);
  document.querySelector("#about-button")?.addEventListener("click", () => {
    const state = storedLicense();
    document.querySelector<HTMLElement>("#license-status")!.textContent = state.valid ? "Archive Plus is active." : "The complete archive engine is free. Plus adds workspace conveniences.";
    openDialog(document.querySelector<HTMLDialogElement>("#about-dialog")!, document.querySelector<HTMLElement>("#app-license-token")!);
  });
  document.querySelector("#verify-app-license")?.addEventListener("click", async () => {
    const input = document.querySelector<HTMLInputElement>("#app-license-token")!;
    const status = document.querySelector<HTMLElement>("#app-license-status")!;
    if (!input.value.trim()) { status.textContent = "Paste a license token first."; return; }
    status.textContent = "Checking license…";
    const state = await saveLicense(input.value);
    status.textContent = state.valid ? "Archive Plus is active on this computer." : "That license could not be verified. Check the token and try again.";
    document.querySelector<HTMLElement>("#license-status")!.textContent = state.valid ? "Archive Plus is active." : "The complete archive engine is free. Plus adds workspace conveniences.";
    if (state.valid) renderEmpty();
  });
}

let pendingMbox = "";
let currentManifestPath = "";
let currentArchivePassphrase: string | null = null;

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
    openDialog(dialog, checkbox);
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
    currentArchivePassphrase = encrypted ? passphrase : null;
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
  try {
    currentManifestPath = path;
    currentArchivePassphrase = null;
    const manifest = await invoke<ArchiveManifest>("load_manifest", { manifestPath: currentManifestPath });
    renderArchive(manifest);
  } catch (error) {
    renderError("That archive could not be opened", error);
  }
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
  const { percent } = resolutionScore(manifest.attachments);
  const requiresVerification = manifest.encrypted && manifest.verification_complete === false;
  const score = requiresVerification ? "Not checked" : `${percent}%`;
  const duplicateCount = manifest.attachments.filter(a => a.duplicate_of).length;
  document.querySelector<HTMLElement>("#archive-subtitle")!.textContent = `${manifest.source_name} · created ${new Date(manifest.created_at).toLocaleString()}`;
  document.querySelector<HTMLElement>("#app-state")!.innerHTML = `
    <section class="summary-strip" aria-label="Archive summary"><div><span>Messages</span><strong>${manifest.messages.length.toLocaleString()}</strong></div><div><span>Attachment references</span><strong>${manifest.attachments.length.toLocaleString()}</strong></div><div><span>Duplicates</span><strong>${duplicateCount.toLocaleString()}</strong></div><div class="resolution"><span>Resolved locally</span><strong>${score}</strong></div></section>
    <section class="archive-tools"><label for="archive-search">Search this archive</label><input id="archive-search" type="search" placeholder="Filename, sender, subject, or checksum" /><select id="status-filter" aria-label="Filter by status"><option value="all">All statuses</option><option value="verified">Verified</option><option value="duplicate">Duplicates</option><option value="issue">Needs attention</option></select>${storedLicense().valid ? `<button class="button secondary" id="compact-ledger" aria-pressed="false">Compact</button>` : ""}<button class="button secondary" id="export-csv">Export CSV</button><button class="button secondary" id="export-json">Export JSON</button><p id="archive-action-status" class="form-status" aria-live="polite"></p></section>
    <div class="archive-grid"><section class="manifest-panel" aria-labelledby="manifest-title"><div class="panel-title"><div><p class="eyebrow">Attachment manifest</p><h2 id="manifest-title">Files and references</h2></div><span id="visible-count">${manifest.attachments.length} shown</span></div><div class="attachment-list" id="attachment-list"></div></section>
    <aside class="verification-panel" aria-labelledby="verification-title"><p class="eyebrow">Verification report</p><h2 id="verification-title">${requiresVerification ? "Enter the passphrase to check every file" : manifest.issues.length ? `${manifest.issues.length} items need attention` : "Every decoded file is accounted for"}</h2><div class="resolution-ring ${requiresVerification ? "pending-ring" : ""}" style="--score:${requiresVerification ? 0 : percent}"><strong>${score}</strong><span>${requiresVerification ? "encrypted files" : "resolved"}</span></div>${requiresVerification ? `<p class="verification-help">Encrypted files cannot be marked resolved until a full checksum scan finishes.</p><button class="button primary" id="verify-encrypted">Verify encrypted archive</button><p id="verification-status" class="form-status" aria-live="polite"></p>` : ""}<dl><div><dt>Source bytes</dt><dd>${formatBytes(manifest.total_bytes)}</dd></div><div><dt>Stored once</dt><dd>${formatBytes(manifest.unique_bytes)}</dd></div><div><dt>Space avoided</dt><dd>${formatBytes(Math.max(0, manifest.total_bytes - manifest.unique_bytes))}</dd></div><div><dt>Storage</dt><dd>${manifest.encrypted ? "Encrypted" : "Plain local files"}</dd></div></dl><button class="text-button" id="view-issues">${manifest.issues.length ? "View reported failures" : "No failures reported"}</button></aside></div>`;
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
  const exportReport = async (format: "csv" | "json"): Promise<void> => {
    const status = document.querySelector<HTMLElement>("#archive-action-status")!;
    try {
      const destination = await save({ defaultPath: `attachment-verification.${format}`, filters: [{ name: `${format.toUpperCase()} report`, extensions: [format] }] });
      if (!destination) return;
      await invoke("export_report", { manifestPath: currentManifestPath, destinationPath: destination, format, passphrase: currentArchivePassphrase });
      status.textContent = `${format.toUpperCase()} report saved.`;
    } catch (error) {
      status.textContent = `The report was not saved. ${String(error)}`;
    }
  };
  document.querySelector("#export-csv")?.addEventListener("click", () => void exportReport("csv"));
  document.querySelector("#export-json")?.addEventListener("click", () => void exportReport("json"));
  document.querySelector("#verify-encrypted")?.addEventListener("click", async () => {
    const passphrase = window.prompt("Enter this archive’s passphrase to verify every stored file:");
    if (!passphrase) return;
    const status = document.querySelector<HTMLElement>("#verification-status")!;
    status.textContent = "Checking every unique encrypted file…";
    try {
      const checked = await invoke<ArchiveManifest>("verify_encrypted_archive", { manifestPath: currentManifestPath, passphrase });
      currentArchivePassphrase = passphrase;
      renderArchive(checked);
    } catch (error) {
      status.textContent = `The scan did not run. ${String(error)}`;
    }
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
