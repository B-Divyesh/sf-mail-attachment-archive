import { parseReleaseManifest, releasePlatforms, type ReleaseManifest, type ReleasePlatform } from "./release-manifest.ts";

export type FetchLike = (input: string) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

type ReleaseAsset = { name: string; browser_download_url: string };
type GitHubRelease = { tag_name: string; target_commitish: string; assets: ReleaseAsset[] };

const asOrigin = (origin: string): string => origin.replace(/\/$/, "");
const releaseDownloadUrl = (repository: string, tag: string, filename: string): string =>
  `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(filename).replaceAll("%2F", "/")}`;

async function readJson(fetcher: FetchLike, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.json();
}

async function readText(fetcher: FetchLike, url: string): Promise<string> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.text();
}

function requireManifest(value: unknown, label: string): ReleaseManifest {
  const manifest = parseReleaseManifest(value);
  if (!manifest) throw new Error(`${label} is not a complete release manifest`);
  return manifest;
}

function requireEqual(actual: string, expected: string, label: string): void {
  if (actual !== expected) throw new Error(`${label} is ${actual}; expected ${expected}`);
}

export async function stageReleaseManifest(options: {
  repository: string;
  tag: string;
  sourceCommit: string;
  fetcher?: FetchLike;
}): Promise<{ bytes: string; manifest: ReleaseManifest }> {
  const fetcher = options.fetcher || (async url => fetch(url) as ReturnType<FetchLike>);
  const url = releaseDownloadUrl(options.repository, options.tag, "latest.json");
  const bytes = await readText(fetcher, url);
  let parsed: unknown;
  try { parsed = JSON.parse(bytes); } catch { throw new Error(`Release manifest is not JSON: ${url}`); }
  const manifest = requireManifest(parsed, "Release manifest");
  requireEqual(manifest.version, options.tag.replace(/^v/, ""), "Release manifest version");
  requireEqual(manifest.source_commit.toLowerCase(), options.sourceCommit.toLowerCase(), "Release manifest source_commit");
  return { bytes, manifest };
}

export async function verifyReleaseProvenance(options: {
  liveOrigin: string;
  repository: string;
  tag: string;
  sourceCommit: string;
  fetcher?: FetchLike;
}): Promise<ReleaseManifest> {
  const fetcher = options.fetcher || (async url => fetch(url) as ReturnType<FetchLike>);
  const origin = asOrigin(options.liveOrigin);
  const expectedCommit = options.sourceCommit.toLowerCase();
  const [liveRaw, releaseRaw, shellInstaller, powershellInstaller] = await Promise.all([
    readJson(fetcher, `${origin}/latest.json`),
    readJson(fetcher, `https://api.github.com/repos/${options.repository}/releases/tags/${options.tag}`),
    readText(fetcher, `${origin}/install.sh`),
    readText(fetcher, `${origin}/install.ps1`)
  ]);
  const live = requireManifest(liveRaw, "Live /latest.json");
  const release = releaseRaw as Partial<GitHubRelease>;
  requireEqual(live.version, options.tag.replace(/^v/, ""), "Live manifest version");
  requireEqual(live.source_commit.toLowerCase(), expectedCommit, "Live manifest source_commit");
  requireEqual(String(release.tag_name || ""), options.tag, "Published release tag");
  requireEqual(String(release.target_commitish || "").toLowerCase(), expectedCommit, "Published release target commit");
  if (!Array.isArray(release.assets)) throw new Error("Published release has no assets");

  const assets = new Map(release.assets.map(asset => [asset.name, asset]));
  const releaseManifestAsset = assets.get("latest.json");
  const checksumsAsset = assets.get("SHA256SUMS");
  if (!releaseManifestAsset || !checksumsAsset) throw new Error("Published release is missing latest.json or SHA256SUMS");
  const releaseManifest = requireManifest(await readJson(fetcher, releaseManifestAsset.browser_download_url), "Published latest.json");
  requireEqual(releaseManifest.source_commit.toLowerCase(), expectedCommit, "Published manifest source_commit");
  requireEqual(JSON.stringify(releaseManifest), JSON.stringify(live), "Live and published manifests");

  const checksums = await readText(fetcher, checksumsAsset.browser_download_url);
  for (const platform of releasePlatforms) {
    const artifact = live.platforms[platform];
    const releaseAsset = assets.get(artifact.filename);
    if (!releaseAsset) throw new Error(`Published release is missing ${artifact.filename}`);
    requireEqual(releaseAsset.browser_download_url, artifact.url, `${platform} download URL`);
    if (!new RegExp(`^${artifact.sha256}  ${artifact.filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m").test(checksums)) {
      throw new Error(`SHA256SUMS does not verify ${artifact.filename}`);
    }
  }

  for (const installer of [shellInstaller, powershellInstaller]) {
    if (!installer.includes(options.repository) || !installer.includes("releases/latest/download/latest.json")) {
      throw new Error("Live installer does not use this repository's current checksummed manifest");
    }
  }
  return live;
}

export function platformAsset(manifest: ReleaseManifest, platform: ReleasePlatform): ReleaseManifest["platforms"][ReleasePlatform] {
  return manifest.platforms[platform];
}
