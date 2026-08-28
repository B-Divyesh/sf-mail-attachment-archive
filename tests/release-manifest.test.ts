import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseReleaseManifest, releasePlatforms } from "../src/release-manifest";

describe("same-origin release manifest", () => {
  it("@claim:release-assets keeps a checksummed asset for every supported platform", () => {
    const manifest = parseReleaseManifest(JSON.parse(readFileSync("public/latest.json", "utf8")));
    expect(manifest).not.toBeNull();
    expect(manifest!.source_commit).toMatch(/^[a-f0-9]{40}$/);
    expect(Object.keys(manifest!.platforms).sort()).toEqual([...releasePlatforms].sort());
    for (const platform of releasePlatforms) {
      const asset = manifest!.platforms[platform];
      expect(asset.url).toContain(`/releases/download/v${manifest!.version}/`);
      expect(asset.url.endsWith(encodeURIComponent(asset.filename).replaceAll("%2F", "/"))).toBe(true);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("rejects incomplete metadata rather than producing a broken download", () => {
    expect(parseReleaseManifest({ version: "0.1.0", source_commit: "a".repeat(40), published_at: new Date().toISOString(), platforms: {} })).toBeNull();
  });

  it("generates checksums that are bound to the tagged source commit", () => {
    const directory = mkdtempSync(join(tmpdir(), "maa-release-"));
    const fixtures = [
      "Mail.Attachment.Archive_0.1.4_aarch64.dmg",
      "Mail.Attachment.Archive_0.1.4_x64.dmg",
      "Mail.Attachment.Archive_0.1.4_x64-setup.exe",
      "Mail.Attachment.Archive_0.1.4_amd64.AppImage",
      "Mail.Attachment.Archive_0.1.4_amd64.deb"
    ];
    const sourceCommit = "0123456789abcdef0123456789abcdef01234567";
    try {
      fixtures.forEach((filename, index) => writeFileSync(join(directory, filename), `artifact-${index}`));
      execFileSync("node", ["scripts/make-release-manifest.mjs", directory, "owner/repo", "v0.1.4", sourceCommit]);
      const manifest = parseReleaseManifest(JSON.parse(readFileSync(join(directory, "latest.json"), "utf8")));
      expect(manifest?.version).toBe("0.1.4");
      expect(manifest?.source_commit).toBe(sourceCommit);
      expect(manifest?.platforms.linux.sha256).toBe(
        createHash("sha256").update("artifact-3").digest("hex")
      );
      expect(manifest?.platforms.linux_deb.sha256).toBe(
        createHash("sha256").update("artifact-4").digest("hex")
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
