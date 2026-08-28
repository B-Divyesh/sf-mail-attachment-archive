import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [tag, eventCommit = ""] = process.argv.slice(2);
if (!/^v\d+\.\d+\.\d+$/.test(tag || "")) {
  throw new Error("Usage: node scripts/verify-release-identity.mjs <vX.Y.Z-tag> [event-commit]");
}

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const packageVersion = readJson("package.json").version;
const lockVersion = readJson("package-lock.json").packages[""].version;
const tauriVersion = readJson("src-tauri/tauri.conf.json").version;
const cargo = readFileSync("src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const appVersion = readFileSync("src/main.ts", "utf8").match(/^const appVersion = "([^"]+)";/m)?.[1];
const expectedVersion = tag.slice(1);

const versions = { packageVersion, lockVersion, tauriVersion, cargoVersion, appVersion };
for (const [source, version] of Object.entries(versions)) {
  if (version !== expectedVersion) {
    throw new Error(`${source} is ${version}; release ${tag} requires ${expectedVersion}`);
  }
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim().toLowerCase();
const head = git("rev-parse", "HEAD");
const tagCommit = git("rev-list", "-n", "1", tag);
if (head !== tagCommit) throw new Error(`checked-out source ${head} does not match ${tag} at ${tagCommit}`);
if (eventCommit && head !== eventCommit.toLowerCase()) {
  throw new Error(`checked-out source ${head} does not match workflow event ${eventCommit}`);
}

process.stdout.write(`release identity verified: ${tag} -> ${head}\n`);
