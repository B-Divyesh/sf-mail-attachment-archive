import { createHash } from "node:crypto";
import { verifyReleaseProvenance, platformAsset } from "../src/release-provenance.ts";

const [liveOrigin, repository, tag, sourceCommit, platform = "linux_deb"] = process.argv.slice(2);
if (!liveOrigin || !repository || !/^v\d+\.\d+\.\d+$/.test(tag || "") || !/^[a-f0-9]{40}$/i.test(sourceCommit || "")) {
  throw new Error("Usage: node --experimental-strip-types scripts/verify-release-provenance.mjs <live-origin> <owner/repo> <vX.Y.Z> <40-character-source-commit> [platform]");
}
const manifest = await verifyReleaseProvenance({ liveOrigin, repository, tag, sourceCommit });
if (!(platform in manifest.platforms)) throw new Error(`Unknown platform: ${platform}`);
const artifact = platformAsset(manifest, platform);
const response = await fetch(artifact.url);
if (!response.ok) throw new Error(`Installer asset download failed (${response.status}): ${artifact.url}`);
const actual = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
if (actual !== artifact.sha256) throw new Error(`Downloaded ${artifact.filename} checksum is ${actual}; expected ${artifact.sha256}`);
process.stdout.write(`release provenance verified: ${tag} -> ${manifest.source_commit}; ${artifact.filename} SHA-256 matches\n`);
