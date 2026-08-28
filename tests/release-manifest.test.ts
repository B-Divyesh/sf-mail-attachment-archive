import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseReleaseManifest, releasePlatforms } from "../src/release-manifest";

describe("same-origin release manifest", () => {
  it("keeps an installable, checksummed asset for every supported platform", () => {
    const manifest = parseReleaseManifest(JSON.parse(readFileSync("public/latest.json", "utf8")));
    expect(manifest).not.toBeNull();
    expect(Object.keys(manifest!.platforms).sort()).toEqual([...releasePlatforms].sort());
    for (const platform of releasePlatforms) {
      const asset = manifest!.platforms[platform];
      expect(asset.url).toContain(`/releases/download/v${manifest!.version}/`);
      expect(asset.url.endsWith(encodeURIComponent(asset.filename).replaceAll("%2F", "/"))).toBe(true);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("rejects incomplete metadata rather than producing a broken download", () => {
    expect(parseReleaseManifest({ version: "0.1.0", published_at: new Date().toISOString(), platforms: {} })).toBeNull();
  });
});
