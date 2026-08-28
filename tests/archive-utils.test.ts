import { describe, expect, it } from "vitest";
import { escapeHtml, fileExt, filename, formatBytes } from "../src/archive-utils";

describe("archive presentation helpers", () => {
  it("formats byte counts for evidence summaries", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("handles paths from every desktop platform", () => {
    expect(filename("/tmp/mail.mbox")).toBe("mail.mbox");
    expect(filename("C:\\Mail\\mail.mbox")).toBe("mail.mbox");
  });

  it("escapes imported metadata before rendering", () => {
    expect(escapeHtml(`<script data-x="1">`)).toBe("&lt;script data-x=&quot;1&quot;&gt;");
    expect(fileExt("invoice.final.pdf")).toBe("PDF");
  });
});
