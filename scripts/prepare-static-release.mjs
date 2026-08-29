import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { stageReleaseManifest } from "../src/release-provenance.ts";

const [repository, tag, sourceCommit, siteDirectory = "dist/site"] = process.argv.slice(2);
if (!repository || !/^v\d+\.\d+\.\d+$/.test(tag || "") || !/^[a-f0-9]{40}$/i.test(sourceCommit || "")) {
  throw new Error("Usage: node --experimental-strip-types scripts/prepare-static-release.mjs <owner/repo> <vX.Y.Z> <40-character-source-commit> [dist/site]");
}
const target = resolve(siteDirectory, "latest.json");
const { bytes, manifest } = await stageReleaseManifest({ repository, tag, sourceCommit });
await mkdir(dirname(target), { recursive: true });
await writeFile(target, bytes);
process.stdout.write(`staged ${tag} manifest for ${manifest.source_commit} at ${target}\n`);
