# Independent verification 6 — PASS

Candidate: `7f8cdafb2bfa0b4acd65cc46195d66669b99da41`  
Live URL: https://mail-attachment-archive.sociobot.in/  
Date: 2026-08-28 UTC

## Result

**PASS.** The live deployment matches the candidate's production-built assets and manifest. The published desktop release is correctly pinned to v0.1.4 source `62f8752149bcea42added1b502d5dfbcc38b0641`; the candidate adds its manifest and handoff after that release tag. No release-blocking defect found.

## Evidence

- `.factory/claims.json` exists. All 17 exact declared claim commands passed from this clean checkout: browser demo claims (desktop and 390px), five Rust MBOX/encryption/restore claims, and four Vitest license/release/installer claims.
- Cold first read passed: “Prove every attachment made it.” says what it does; its next sentence names people leaving/backing up email; “Try it with sample data” is a one-click, explicitly unsaved demo. `/demo/` has persistent demo banner, reset/start-for-real controls, 3/4 resolved, one duplicate, and one visible decode failure.
- Passed: `npm test` (16/16), `npm run check`, all 9 Rust tests, Cargo format, Clippy warnings denied, and `npm run build`. Landing JS is 39.55 KB raw / 12.22 KB gzip; CSS 18.35 KB raw / 4.89 KB gzip.
- Downloaded v0.1.4 Linux DEB as a clean consumer. SHA-256 `36e0eaa0ada7c3d653efde76c0295ea3cb47f64fbd0464f16e66a386043645d4` exactly matches SHA256SUMS; package metadata/content are correct. Full release matrix exists.
- Local production JS/CSS SHA-256 equals live hashed assets. Live `latest.json` exactly equals `public/latest.json` and names the real v0.1.4 assets.
- `verify-url.sh` passed (200, title, lang, one H1, main, alts, no unnamed buttons/errors). Axe at desktop and 390px found zero serious/critical findings. Keyboard controls have a visible 3px mint outline; reduced-motion context is clean.
- Demo outgoing-request log was same-origin only; no trackers, external fonts, or third-party scripts. Headers include CSP, HSTS, nosniff, frame denial, Referrer-Policy, Permissions-Policy; hashed assets are immutable cached.
- Fresh mobile Lighthouse: Performance 96, Accessibility 100, LCP 1.724 s, CLS 0, 50,238-byte transfer.
- Billing API burst from one client: 40 invalid-token requests yielded 30×200 then 10×429, every 429 with `Retry-After: 4`; CORS allowed only the product origin. No sign-in exists, so Entra is not applicable.

## Environment note

`CI=true npm run tauri -- build --bundles appimage,deb` reached AppImage bundling then stopped because this disposable image lacks `/usr/bin/xdg-open`. The harness also sets `CI=1`, which current Tauri rejects unless overridden with `CI=true`. This is not a deployment failure: the independently downloaded v0.1.4 package and release matrix prove the GitHub release completed.
