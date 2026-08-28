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

  await page.goto("/demo/");
  await expect(page.getByRole("link", { name: "Mail Attachment Archive home" })).toBeVisible();
  await page.getByRole("link", { name: "Mail Attachment Archive home" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("demo:mail-attachment-archive:state"))).toBeNull();
});

test("demo flow sends no data off origin", async ({ page }) => {
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

test("demo, legal, and 404 routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/demo/", "/privacy/", "/terms/", "/404.html"]) {
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

test("@claim:plus-price shows the one-time price and opens a live Sociobot checkout", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("$29")).toBeVisible();
  const purchase = page.getByRole("link", { name: "Buy Archive Plus" });
  const checkoutUrl = "https://api.sociobot.in/api/v1/products/mail-attachment-archive/checkout";
  await expect(purchase).toHaveAttribute("href", checkoutUrl);

  // Do not follow the hosted checkout or create a purchase. The gateway must
  // prove that this enabled product resolves to a real Dodo checkout session.
  const response = await request.get(checkoutUrl, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  const redirect = new URL(response.headers().location);
  expect(redirect.origin).toBe("https://checkout.dodopayments.com");
  expect(redirect.pathname).toMatch(/^\/session\/cks_[A-Za-z0-9]+$/);
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

test("Android and iPhone visitors are never offered desktop installers", async ({ browser }) => {
  for (const userAgent of [
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"
  ]) {
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("#platform-download")).toHaveText("Open this page on a computer");
    await expect(page.locator("#platform-note")).toHaveText("Available for macOS, Windows, and Linux.");
    await expect(page.locator("#platform-download")).not.toHaveAttribute("href", /\.(AppImage|deb|dmg|exe)/i);
    await context.close();
  }
});

test("direct ?demo=1 opens the isolated demo, announces it, and leaves no demo storage on exit", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.getByRole("heading", { level: 1, name: "Inspect a checked attachment archive" })).toBeVisible();
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await page.getByRole("link", { name: "Mail Attachment Archive home" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem("demo:mail-attachment-archive:state"))).toBeNull();
});

test("landing includes the captioned desktop walkthrough at desktop and phone widths", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".walkthrough figure")).toHaveCount(4);
  await expect(page.getByText("1. Choose an MBOX export.")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    const widths = await page.locator(".walkthrough-grid").evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  }
});

test("document navigation moves focus to the new route heading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Prove every attachment made it." })).toBeFocused();
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

test("mobile every interactive target meets the 44px touch-target baseline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
    await page.goto(route);
    const targets = page.locator("a, button, input, select, summary");
    for (let index = 0; index < await targets.count(); index += 1) {
      const target = targets.nth(index);
      if (!await target.isVisible()) continue;
      const box = await target.boundingBox();
      expect(box, `${route} target ${index}`).not.toBeNull();
      expect(box!.width, `${route} target ${index} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${route} target ${index} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

async function expectFocusToWrapInDialog(page: import("@playwright/test").Page, dialog: import("@playwright/test").Locator): Promise<void> {
  const targets = dialog.locator("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])");
  await expect(targets).not.toHaveCount(0);
  await targets.last().focus();
  await page.keyboard.press("Tab");
  await expect(targets.first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(targets.last()).toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
}

test("license dialogs wrap focus in both directions and restore their triggers", async ({ page }) => {
  await page.goto("/");
  const restore = page.getByRole("button", { name: "Have a license? Restore it" });
  await restore.click();
  const siteDialog = page.locator("#license-dialog");
  await expectFocusToWrapInDialog(page, siteDialog);
  await page.keyboard.press("Escape");
  await expect(restore).toBeFocused();

  await page.goto("/?app=1");
  const about = page.getByRole("button", { name: "About and license" });
  await about.click();
  const appDialog = page.locator("#about-dialog");
  await expectFocusToWrapInDialog(page, appDialog);
  await page.keyboard.press("Escape");
  await expect(about).toBeFocused();
});

test("secondary routes expose route-specific metadata and a complete site skeleton", async ({ page }) => {
  const cases = [
    ["/demo/", "Demo — Mail Attachment Archive", "https://mail-attachment-archive.sociobot.in/demo/"],
    ["/privacy/", "Privacy — Mail Attachment Archive", "https://mail-attachment-archive.sociobot.in/privacy/"],
    ["/terms/", "Terms — Mail Attachment Archive", "https://mail-attachment-archive.sociobot.in/terms/"],
    ["/404.html", "Page not found — Mail Attachment Archive", "https://mail-attachment-archive.sociobot.in/404.html"]
  ] as const;
  for (const [route, title, canonical] of cases) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeVisible();
    await expect(page.getByText("Built by Param Factory")).toBeVisible();
    await expect(page.getByText(/v0\.1\.4/)).toBeVisible();
  }
});

test("desktop shell exposes an actionable empty state", async ({ page }) => {
  await page.goto("/?app=1");
  await expect(page.getByRole("heading", { level: 1, name: "Your attachment ledger" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import your first MBOX" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load sample archive" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("free app shell provides import, open, sample, search, and both report formats without a license", async ({ page }) => {
  await page.goto("/?app=1");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await expect(page.getByRole("button", { name: "Import MBOX export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open archive" })).toBeVisible();
  await page.getByRole("button", { name: "Load sample archive" }).click();
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
