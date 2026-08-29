import { afterEach, describe, expect, it, vi } from "vitest";
import { captureLicense, storedLicense, verifyLicense } from "../src/license";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  get length(): number { return this.values.size; }
}

describe("license response policy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("@claim:license-daily captures, strips, and verifies a token at most once per day", async () => {
    const storage = new MemoryStorage();
    const replaceState = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ valid: true }) });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("location", { href: "https://mail-attachment-archive.sociobot.in/?license=test-token" });
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("fetch", fetchMock);

    captureLicense();
    expect(storedLicense().token).toBe("test-token");
    expect(replaceState).toHaveBeenCalledWith({}, "", new URL("https://mail-attachment-archive.sociobot.in/"));
    expect((await verifyLicense()).valid).toBe(true);
    expect((await verifyLicense()).valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("api.sociobot.in/api/v1/products/mail-attachment-archive/verify?license=test-token");
  });

  it("@claim:paid-license locks Plus when the billing gateway revokes a license", async () => {
    const storage = new MemoryStorage();
    storage.setItem("sb_license:mail-attachment-archive", "refunded-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: async () => ({ valid: true, reason: "ok" }) })
      .mockResolvedValueOnce({ json: async () => ({ valid: false, reason: "revoked" }) });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("fetch", fetchMock);

    expect((await verifyLicense(true)).valid).toBe(true);
    expect(storedLicense().valid).toBe(true);
    expect((await verifyLicense(true)).valid).toBe(false);
    expect(storedLicense().valid).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
