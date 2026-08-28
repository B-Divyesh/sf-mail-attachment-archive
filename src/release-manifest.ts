export const releasePlatforms = ["macos", "macos_intel", "windows", "linux", "linux_deb"] as const;

export type ReleasePlatform = typeof releasePlatforms[number];

export interface ReleaseAsset {
  url: string;
  sha256: string;
  filename: string;
  signature?: string;
}

export interface ReleaseManifest {
  version: string;
  published_at: string;
  platforms: Record<ReleasePlatform, ReleaseAsset>;
}

function isAsset(value: unknown): value is ReleaseAsset {
  if (!value || typeof value !== "object") return false;
  const asset = value as Partial<ReleaseAsset>;
  if (typeof asset.url !== "string" || typeof asset.filename !== "string") return false;
  if (!/^[a-f0-9]{64}$/i.test(asset.sha256 || "")) return false;
  if (asset.signature !== undefined && typeof asset.signature !== "string") return false;
  try {
    const url = new URL(asset.url);
    return url.protocol === "https:" && url.hostname === "github.com" && url.pathname.includes("/releases/download/");
  } catch {
    return false;
  }
}

export function parseReleaseManifest(value: unknown): ReleaseManifest | null {
  if (!value || typeof value !== "object") return null;
  const manifest = value as Partial<ReleaseManifest>;
  if (typeof manifest.version !== "string" || !manifest.version) return null;
  if (typeof manifest.published_at !== "string" || Number.isNaN(Date.parse(manifest.published_at))) return null;
  if (!manifest.platforms || !releasePlatforms.every(platform => isAsset(manifest.platforms?.[platform]))) return null;
  return manifest as ReleaseManifest;
}
