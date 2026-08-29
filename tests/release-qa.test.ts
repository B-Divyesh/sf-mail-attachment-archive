import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stageReleaseManifest, verifyReleaseProvenance, type FetchLike } from "../src/release-provenance";

describe("release QA contracts", () => {
  it("keeps every desktop package version aligned", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const tauri = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    const cargo = readFileSync("src-tauri/Cargo.toml", "utf8");
    const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
    const app = readFileSync("src/main.ts", "utf8");
    const appVersion = app.match(/^const appVersion = "([^"]+)";/m)?.[1];
    expect(new Set([packageJson.version, packageLock.packages[""].version, tauri.version, cargoVersion, appVersion]).size).toBe(1);
    for (const page of ["public/404.html", "public/privacy/index.html", "public/terms/index.html"]) {
      expect(readFileSync(page, "utf8")).toContain(`v${packageJson.version}`);
    }
  });

  it("binds every release job and manifest to the tagged source commit", () => {
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    const identityCheck = readFileSync("scripts/verify-release-identity.mjs", "utf8");
    const manifestBuilder = readFileSync("scripts/make-release-manifest.mjs", "utf8");
    expect(workflow.match(/ref: \$\{\{ env\.RELEASE_REF \}\}/g)).toHaveLength(3);
    expect(workflow.match(/verify:release-identity/g)).toHaveLength(3);
    expect(workflow.match(/shell: bash/g)).toHaveLength(3);
    expect(workflow).toContain('"$(git rev-parse HEAD)"');
    expect(identityCheck).toContain('git("rev-list", "-n", "1", tag)');
    expect(identityCheck).toContain("head !== tagCommit");
    expect(manifestBuilder).toContain("source_commit: sourceCommit.toLowerCase()");
  });

  it("@claim:release-provenance rejects a stale deployed manifest and requires the live site, release, checksums, and installers to agree", async () => {
    const repository = "owner/repo";
    const tag = "v1.2.3";
    const sourceCommit = "0123456789abcdef0123456789abcdef01234567";
    const origin = "https://archive.example.test";
    const filenames = {
      macos: "archive-arm.dmg",
      macos_intel: "archive-intel.dmg",
      windows: "archive-setup.exe",
      linux: "archive.AppImage",
      linux_deb: "archive.deb"
    };
    const sha256 = "b".repeat(64);
    const manifest = {
      version: "1.2.3",
      source_commit: sourceCommit,
      published_at: "2026-08-29T00:00:00.000Z",
      platforms: Object.fromEntries(Object.entries(filenames).map(([platform, filename]) => [platform, {
        filename,
        sha256,
        url: `https://github.com/${repository}/releases/download/${tag}/${filename}`
      }]))
    };
    const releaseAssets = ["latest.json", "SHA256SUMS", ...Object.values(filenames)].map(name => ({
      name,
      browser_download_url: name === "latest.json"
        ? `https://github.com/${repository}/releases/download/${tag}/latest.json`
        : name === "SHA256SUMS"
          ? `https://github.com/${repository}/releases/download/${tag}/SHA256SUMS`
          : `https://github.com/${repository}/releases/download/${tag}/${name}`
    }));
    const checksums = Object.values(filenames).map(filename => `${sha256}  ${filename}`).join("\n");
    const fetcher = (stale: boolean | "stale-version" = false): FetchLike => async url => {
      const json = (value: unknown) => ({ ok: true, status: 200, json: async () => value, text: async () => JSON.stringify(value) });
      const text = (value: string) => ({ ok: true, status: 200, json: async () => JSON.parse(value), text: async () => value });
      if (url === `${origin}/latest.json`) return json({
        ...manifest,
        version: stale === "stale-version" ? "1.2.2" : manifest.version,
        source_commit: stale ? "f".repeat(40) : sourceCommit
      });
      if (url === `${origin}/install.sh` || url === `${origin}/install.ps1`) return text(`repo="${repository}"\nhttps://github.com/$repo/releases/latest/download/latest.json`);
      if (url === `https://api.github.com/repos/${repository}/releases/tags/${tag}`) return json({ tag_name: tag, target_commitish: sourceCommit, assets: releaseAssets });
      if (url.endsWith("/latest.json")) return json(manifest);
      if (url.endsWith("/SHA256SUMS")) return text(checksums);
      throw new Error(`Unexpected request: ${url}`);
    };

    await expect(verifyReleaseProvenance({ liveOrigin: origin, repository, tag, sourceCommit, fetcher: fetcher() })).resolves.toMatchObject({ source_commit: sourceCommit });
    await expect(stageReleaseManifest({ repository, tag, sourceCommit, fetcher: fetcher() })).resolves.toMatchObject({ manifest: { source_commit: sourceCommit } });
    await expect(verifyReleaseProvenance({ liveOrigin: origin, repository, tag, sourceCommit, fetcher: fetcher("stale-version") })).rejects.toThrow(/Live manifest version/);
    await expect(verifyReleaseProvenance({ liveOrigin: origin, repository, tag, sourceCommit, fetcher: fetcher(true) })).rejects.toThrow(/Live manifest source_commit/);
  });

  it("@claim:release-workflow-assets builds every supported desktop artifact and publishes both verification files", () => {
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    const requiredMatrixEntries = [
      "os: macos-latest\n            target: aarch64-apple-darwin",
      "os: macos-latest\n            target: x86_64-apple-darwin",
      "os: windows-latest\n            target: x86_64-pc-windows-msvc",
      "os: ubuntu-22.04\n            target: x86_64-unknown-linux-gnu"
    ];
    for (const entry of requiredMatrixEntries) expect(workflow).toContain(entry);
    expect(workflow).toContain('tags: ["v*"]');
    expect(workflow).toContain("tauri-apps/tauri-action@v0");
    expect(workflow).toContain("args: --target ${{ matrix.target }}");
    expect(workflow).toContain("node scripts/make-release-manifest.mjs release-assets");
    expect(workflow).toContain("release-assets/SHA256SUMS release-assets/latest.json");
    expect(workflow).toContain("gh release upload \"$RELEASE_TAG\"");
    expect(readFileSync("package.json", "utf8")).toContain("prepare:release-deploy");
    expect(readFileSync("scripts/prepare-static-release.mjs", "utf8")).toContain("stageReleaseManifest");
  });

  it("refuses to publish a tag from a different checked-out source commit", () => {
    const directory = mkdtempSync(join(tmpdir(), "maa-release-identity-"));
    const verifyScript = resolve("scripts/verify-release-identity.mjs");
    const git = (...args: string[]) => execFileSync("git", args, { cwd: directory, encoding: "utf8" });
    try {
      mkdirSync(join(directory, "src-tauri"), { recursive: true });
      mkdirSync(join(directory, "src"), { recursive: true });
      writeFileSync(join(directory, "package.json"), JSON.stringify({ version: "0.1.4" }));
      writeFileSync(join(directory, "package-lock.json"), JSON.stringify({ packages: { "": { version: "0.1.4" } } }));
      writeFileSync(join(directory, "src-tauri", "tauri.conf.json"), JSON.stringify({ version: "0.1.4" }));
      writeFileSync(join(directory, "src-tauri", "Cargo.toml"), '[package]\nversion = "0.1.4"\n');
      writeFileSync(join(directory, "src", "main.ts"), 'const appVersion = "0.1.4";\n', { flag: "w" });
      git("init");
      git("config", "user.email", "qa@example.test");
      git("config", "user.name", "QA");
      git("add", ".");
      git("commit", "-m", "release source");
      git("tag", "v0.1.4");
      expect(execFileSync("node", [verifyScript, "v0.1.4"], { cwd: directory, encoding: "utf8" })).toContain("release identity verified");
      git("commit", "--allow-empty", "-m", "different source");
      expect(() => execFileSync("node", [verifyScript, "v0.1.4"], { cwd: directory, encoding: "utf8", stdio: "pipe" }))
        .toThrow(/does not match v0\.1\.4/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("ships CSP, immutable hashed assets, and an HTTP 404 override", () => {
    const config = JSON.parse(readFileSync("public/staticwebapp.config.json", "utf8"));
    expect(config.globalHeaders["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(config.globalHeaders["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    const assetRoute = config.routes.find((route: { route: string }) => route.route === "/assets/index-*");
    expect(assetRoute.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    expect(config.responseOverrides["404"]).toEqual({ rewrite: "/404.html", statusCode: 404 });
    const page = readFileSync("public/404.html", "utf8");
    expect(page).toContain("<main>");
    expect(page).toContain("This page is not in the archive.");
  });

  it("declares every claim once with an executable regression command", () => {
    const claims = JSON.parse(readFileSync(".factory/claims.json", "utf8")) as Array<{ id: string; test: string }>;
    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map(claim => claim.id)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(claim.test).toMatch(/^(npm|cargo) /);
      const sources = [
        readFileSync("tests/e2e/site.spec.ts", "utf8"),
        readFileSync("tests/license.test.ts", "utf8"),
        readFileSync("tests/release-manifest.test.ts", "utf8"),
        readFileSync("tests/release-qa.test.ts", "utf8"),
        readFileSync("scripts/run-native-claim.mjs", "utf8"),
        readFileSync("src-tauri/src/lib.rs", "utf8")
      ].join("\n");
      const tags = sources.match(new RegExp(`@claim:${claim.id}(?![A-Za-z0-9_-])`, "g")) || [];
      expect(tags, `claim ${claim.id} must have exactly one regression tag`).toHaveLength(1);
    }
  });

  it("routes the demo explicitly without masking unknown URLs", () => {
    const config = JSON.parse(readFileSync("public/staticwebapp.config.json", "utf8"));
    expect(config.routes).toContainEqual({ route: "/demo", rewrite: "/index.html" });
    const normalizedRoutes = config.routes.map((entry: { route: string }) => entry.route.replace(/\/$/, "") || "/");
    expect(new Set(normalizedRoutes).size).toBe(normalizedRoutes.length);
    expect(config).not.toHaveProperty("navigationFallback");
  });

  it("@claim:verified-installers fails closed unless a downloaded asset matches its SHA-256", () => {
    const shell = readFileSync("public/install.sh", "utf8");
    const powershell = readFileSync("public/install.ps1", "utf8");
    for (const installer of [shell, powershell]) {
      expect(installer).toContain("latest.json");
      expect(installer).toMatch(/sha256(sum)?|Get-FileHash/i);
      expect(installer).toMatch(/Checksum verification failed/i);
    }
  });

  it("@claim:ubuntu-support builds the Linux artifact on Ubuntu 22.04 and labels that requirement", () => {
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    const app = readFileSync("src/main.ts", "utf8");
    expect(workflow).toContain("ubuntu-22.04");
    expect(app).toContain("Ubuntu 22.04+");
  });
});
