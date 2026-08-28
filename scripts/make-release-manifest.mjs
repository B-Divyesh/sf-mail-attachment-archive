import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const [directory, repository, tag, sourceCommit] = process.argv.slice(2);
if (!directory || !repository || !tag || !/^[a-f0-9]{40}$/i.test(sourceCommit || "")) {
  throw new Error("Usage: node make-release-manifest.mjs <directory> <owner/repo> <tag> <40-character-source-commit>");
}
const files = (await readdir(directory)).filter(name => !["SHA256SUMS", "latest.json"].includes(name));
const records = await Promise.all(files.map(async filename => ({
  filename,
  sha256: createHash("sha256").update(await readFile(join(directory, filename))).digest("hex"),
  url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(filename).replaceAll("%2F", "/")}`
})));
const pick = (...tests) => records.find(record => tests.every(test => test.test(record.filename)));
const macosArm = pick(/\.dmg$/i, /(aarch64|arm64)/i);
const macosIntel = pick(/\.dmg$/i, /(x64|x86_64)/i) || records.find(record => /\.dmg$/i.test(record.filename) && record !== macosArm);
const windows = records.find(record => /setup.*\.exe$/i.test(record.filename)) || records.find(record => /\.msi$/i.test(record.filename));
const linux = records.find(record => /\.AppImage$/i.test(record.filename));
const linuxDeb = records.find(record => /\.deb$/i.test(record.filename));
if (!macosArm || !macosIntel || !windows || !linux || !linuxDeb) {
  throw new Error(`Missing required platform assets. Found: ${files.join(", ")}`);
}
const compact = record => ({ url: record.url, sha256: record.sha256, filename: record.filename });
const manifest = { version: tag.replace(/^v/, ""), source_commit: sourceCommit.toLowerCase(), published_at: new Date().toISOString(), platforms: { macos: compact(macosArm), macos_intel: compact(macosIntel), windows: compact(windows), linux: compact(linux), linux_deb: compact(linuxDeb) } };
await writeFile(join(directory, "latest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(join(directory, "SHA256SUMS"), records.sort((a,b) => a.filename.localeCompare(b.filename)).map(record => `${record.sha256}  ${basename(record.filename)}`).join("\n") + "\n");
