import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Single regression implementation for @claim:local-only and @claim:free-core.
// The claim id selects an independent clean packaged-app run.
const claim = process.argv[2];
if (!new Set(["local-only", "free-core"]).has(claim)) {
  throw new Error("Use: npm run test:native-claim -- local-only|free-core");
}

for (const tool of ["xvfb-run", "strace"]) {
  try {
    execFileSync("sh", ["-c", `command -v ${tool}`], { stdio: "ignore" });
  } catch {
    throw new Error(`${tool} is required for native claim tests. Install the Linux test prerequisites documented in README.md.`);
  }
}

execFileSync("npm", ["run", "tauri", "--", "build", "--no-bundle"], { stdio: "inherit", env: { ...process.env, CI: "true" } });
const binary = resolve("src-tauri/target/release/mail-attachment-archive");
if (!existsSync(binary)) throw new Error(`Packaged application binary not found: ${binary}`);

const root = mkdtempSync(join(tmpdir(), `maa-native-${claim}-`));
const runtime = join(root, "runtime");
const config = join(root, "config");
const data = join(root, "data");
mkdirSync(runtime);
mkdirSync(config);
mkdirSync(data);
chmodSync(runtime, 0o700);
const source = join(root, "leaving-account.mbox");
copyFileSync(resolve("public/samples/leaving-account.mbox"), source);
const sourceHash = sha256(source);
const tracePath = join(root, "network.trace");

try {
  const run = spawnSync("xvfb-run", [
    "-a", "strace", "-f", "-s", "240", "-e", "trace=connect,sendto", "-o", tracePath, binary
  ], {
    encoding: "utf8",
    timeout: 120_000,
    env: {
      ...process.env,
      MAA_NATIVE_CLAIM_ID: claim,
      MAA_NATIVE_CLAIM_ROOT: root,
      XDG_RUNTIME_DIR: runtime,
      XDG_CONFIG_HOME: config,
      XDG_DATA_HOME: data,
      WEBKIT_DISABLE_DMABUF_RENDERER: "1",
      NO_AT_BRIDGE: "1"
    }
  });
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`Packaged app claim run exited ${run.status}.\nstdout:\n${run.stdout}\nstderr:\n${run.stderr}`);
  }

  const evidencePath = join(root, "ui-evidence.json");
  if (!existsSync(evidencePath)) throw new Error("The packaged UI did not write claim evidence.");
  const ui = JSON.parse(readFileSync(evidencePath, "utf8"));
  if (!ui.passed || ui.claim !== claim || ui.checks.some((check) => !check.passed)) {
    throw new Error(`Packaged UI evidence failed: ${JSON.stringify(ui, null, 2)}`);
  }
  if (ui.cookie !== "" || ui.storageKeys.some((key) => /auth|session|account/i.test(key))) {
    throw new Error("The clean native workflow created authentication state.");
  }

  const trace = readFileSync(tracePath, "utf8");
  const externalConnections = trace.split("\n").filter(line => /sin6?_family=AF_INET6?/.test(line));
  if (externalConnections.length) {
    throw new Error(`Archive processing made network connections:\n${externalConnections.join("\n")}`);
  }
  if (sha256(source) !== sourceHash) throw new Error("The packaged import changed its source MBOX export.");

  const manifestPath = join(root, "archive", "manifest.json");
  const reportPath = join(root, "archive", "verification-report.json");
  if (!existsSync(manifestPath) || !existsSync(reportPath)) throw new Error("Packaged import did not create both archive records.");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.attachments.length || !manifest.messages.length) throw new Error("Packaged import produced an empty archive.");
  const storedPaths = [...new Set(manifest.attachments.filter(item => item.stored_path).map(item => join(root, "archive", item.stored_path)))];
  if (!storedPaths.every(existsSync)) throw new Error("A packaged archive attachment is missing.");

  const result = {
    claim,
    packagedBinary: binary,
    commandBridge: ["import_mbox", "load_manifest", ...(claim === "free-core" ? ["verify_encrypted_archive", "restore_attachment", "export_report:csv", "export_report:json"] : [])],
    network: { tracedSyscalls: "connect,sendto", externalConnections: 0 },
    sourceUnchanged: true,
    manifest: { messages: manifest.messages.length, attachments: manifest.attachments.length, encrypted: manifest.encrypted },
    ui
  };

  if (claim === "free-core") {
    const restored = join(root, "restored-attachment.bin");
    const csv = join(root, "verification.csv");
    const json = join(root, "verification.json");
    for (const output of [restored, csv, json]) {
      if (!existsSync(output) || statSync(output).size === 0) throw new Error(`Packaged workflow did not create ${output}.`);
    }
    const firstStored = manifest.attachments.find(item => item.status === "verified" && !item.duplicate_of);
    if (sha256(restored) !== firstStored.sha256) throw new Error("Restored bytes do not match the manifest SHA-256.");
    if (!readFileSync(csv, "utf8").includes("status,filename")) throw new Error("CSV verification report is invalid.");
    if (JSON.parse(readFileSync(json, "utf8")).attachments.length !== manifest.attachments.length) throw new Error("JSON verification report is incomplete.");
    Object.assign(result, { outputs: { restoredSha256: sha256(restored), csvBytes: statSync(csv).size, jsonBytes: statSync(json).size } });
  }

  const artifactDir = resolve(".factory/qa-artifacts/native-claims");
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(join(artifactDir, `${claim}.json`), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`@claim:${claim} PASS — packaged command bridge, visible UI evidence, and zero external network connections`);
} finally {
  rmSync(root, { recursive: true, force: true });
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
