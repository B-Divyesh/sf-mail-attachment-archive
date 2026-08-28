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
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
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
  await expect(download).toHaveAttribute("href", /\/releases\/download\/v0\.1\.0\//);
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

test("desktop shell exposes an actionable empty state", async ({ page }) => {
  await page.goto("/?app=1");
  await expect(page.getByRole("heading", { level: 1, name: "Your attachment ledger" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import your first MBOX" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});

test("privacy and terms pages are direct routes", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy, in plain language");
  await page.goto("/terms/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms of use");
});
