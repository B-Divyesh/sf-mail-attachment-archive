import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release QA contracts", () => {
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
        readFileSync("src-tauri/src/lib.rs", "utf8")
      ].join("\n");
      expect(sources).toContain(`@claim:${claim.id}`);
    }
  });

  it("routes the demo explicitly without masking unknown URLs", () => {
    const config = JSON.parse(readFileSync("public/staticwebapp.config.json", "utf8"));
    expect(config.routes).toContainEqual({ route: "/demo", rewrite: "/index.html" });
    expect(config).not.toHaveProperty("navigationFallback");
  });
});
