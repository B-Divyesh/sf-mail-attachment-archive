import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing page is semantic, clean, and accessible", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(String(error)));
  await page.goto("/");
  await expect(page).toHaveTitle(/Mail Attachment Archive/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Download for/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
});

test("@claim:demo-sandbox one click opens an isolated, resettable sample", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Inspect a checked attachment archive" })).toBeVisible();
  await expect(page.locator(".attachment-row")).toHaveCount(4);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["demo:mail-attachment-archive:state"]);
  await page.getByLabel("Search this archive").fill("statement");
  await expect(page.locator(".attachment-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator(".attachment-row")).toHaveCount(4);
  await page.getByRole("link", { name: "Start for real" }).click();
  await expect(page).toHaveURL(/\/#download$/);
  expect(await page.evaluate(() => localStorage.getItem("demo:mail-attachment-archive:state"))).toBeNull();
});

test("@claim:local-only demo flow sends no data off origin", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });
  await page.goto("/demo/");
  await page.getByLabel("Search this archive").fill("northstar");
  await page.getByLabel("Filter by status").selectOption("verified");
  expect(externalRequests).toEqual([]);
});

test("@claim:sample-evidence exposes deduplication and every sample failure", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.getByText("3 of 4")).toBeVisible();
  await expect(page.getByText("↳ Duplicate")).toHaveCount(1);
  await expect(page.getByText("! Reported")).toHaveCount(1);
  await expect(page.getByText("Source data ended before decoding finished.")).toBeVisible();
});

test("@claim:csv-report exports one row per sample reference plus its issue", async ({ page }) => {
  await page.goto("/demo/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample-attachment-verification.csv");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv.split("\n")[0]).toBe("status,filename,content_type,size_bytes,sha256,duplicate_of,message_id,subject,from");
  expect(csv).toContain('"closing-statement.pdf"');
  expect(csv).toContain('"issue:decode_failed"');
  expect(csv.trim().split("\n")).toHaveLength(6);
});

test("@claim:evidence-reports exports the demo evidence as JSON through the shipped control", async ({ page }) => {
  await page.goto("/demo/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample-attachment-verification.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(report.attachments).toHaveLength(4);
  expect(report.attachments.filter((attachment: { status: string }) => attachment.status === "decode_failed")).toHaveLength(1);
  expect(report.issues).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "decode_failed" })]));
});

test("@claim:archive-search searches metadata and filters status", async ({ page }) => {
  await page.goto("/demo/");
  await page.getByLabel("Search this archive").fill("accounts@northstar.example");
  await expect(page.locator(".attachment-row")).toHaveCount(1);
  await page.getByLabel("Search this archive").fill("");
  await page.getByLabel("Filter by status").selectOption("duplicate");
  await expect(page.locator(".attachment-row")).toHaveCount(1);
  await expect(page.getByText("IMG_2048-copy.jpg")).toBeVisible();
});

test("demo and legal routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/demo/", "/privacy/", "/terms/"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || "")), route).toEqual([]);
  }
});

test("keyboard focus starts at the skip link and reduced motion stops looping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const running = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length);
  expect(running).toBe(0);
});

test("@claim:plus-price shows the one-time price and Sociobot checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("$29")).toBeVisible();
  await expect(page.getByRole("link", { name: "Buy Archive Plus" })).toHaveAttribute("href", "https://api.sociobot.in/api/v1/products/mail-attachment-archive/checkout");
});

test("cold load resolves release metadata on the same origin", async ({ page }) => {
  const metadataRequests: string[] = [];
  const failedRequests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => {
    if (request.url().includes("latest.json")) metadataRequests.push(request.url());
  });
  page.on("requestfailed", request => failedRequests.push(request.url()));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(String(error)));

  await page.goto("/", { waitUntil: "networkidle" });
  const download = page.locator("#platform-download");
  await expect(download).toHaveAttribute("href", /\/releases\/download\/v0\.1\.\d+\//);
  await expect(download).toHaveAttribute("data-sha256", /^[a-f0-9]{64}$/);

  expect(metadataRequests).toHaveLength(1);
  expect(new URL(metadataRequests[0]).origin).toBe(new URL(page.url()).origin);
  expect(new URL(metadataRequests[0]).pathname).toBe("/latest.json");
  expect(failedRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("invalid release metadata keeps a calm, usable fallback", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(String(error)));
  await page.route("**/latest.json", route => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));

  await page.goto("/");
  await expect(page.locator("#platform-download")).toHaveAttribute("href", "https://github.com/B-Divyesh/sf-mail-attachment-archive/releases/latest");
  await expect(page.locator("#platform-note")).toContainText("Downloads are being published");
  expect(errors).toEqual([]);
});

test("390px layout does not overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  await page.goto("/");
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("mobile navigation and legal links meet the 44px touch-target baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  for (const route of ["/demo/", "/privacy/", "/terms/"]) {
    await page.goto(route);
    const links = page.locator("header a, footer a");
    for (let index = 0; index < await links.count(); index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box, `${route} target ${index}`).not.toBeNull();
      expect(box!.height, `${route} target ${index}`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("desktop shell exposes an actionable empty state", async ({ page }) => {
  await page.goto("/?app=1");
  await expect(page.getByRole("heading", { level: 1, name: "Your attachment ledger" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import your first MBOX" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load sample project" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("@claim:free-core provides import, open, sample, search, and both report formats without a license", async ({ page }) => {
  await page.goto("/?app=1");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await expect(page.getByRole("button", { name: "Import MBOX" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open archive" })).toBeVisible();
  await page.getByRole("button", { name: "Load sample project" }).click();
  await expect(page.getByLabel("Search this archive")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
});

test("desktop app lets a purchaser paste and verify a license", async ({ page }) => {
  await page.goto("/?app=1");
  await page.getByRole("button", { name: "About and license" }).click();
  await expect(page.getByLabel("Restore Archive Plus on this computer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify and restore license" })).toBeVisible();
  const purchase = page.getByRole("link", { name: "Buy Archive Plus · $29" });
  await expect(purchase).toHaveAttribute("href", /return_url=https%3A%2F%2Fmail-attachment-archive\.sociobot\.in%2F/);
});

test("privacy and terms pages are direct routes", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy, in plain language");
  await page.goto("/terms/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
});
