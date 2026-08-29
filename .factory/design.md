# Mail Attachment Archive — visual thesis

## Direction: evidentiary geometry

The product turns a shapeless mailbox into something a person can inspect and
trust. Its visual language is **generative geometry**: messages are small paper
planes, attachment hashes are precise nodes, and duplicate files converge into
one verified object. The geometry is explanatory, never ornamental. Fine grid
lines suggest an evidence ledger; irregular loops suggest messy source mail;
the final amber node communicates a locally resolved file.

The product uses a deliberately single, dark “archive room” treatment. A dark
canvas makes long scans comfortable, distinguishes this utility from an inbox,
and gives status colors enough contrast without relying on color alone.

## Palette

| Token | Value | Meaning |
| --- | --- | --- |
| Ink / background | `#0B0F14` | Private, offline workspace |
| Raised surface | `#121922` | Panels and grouped controls |
| Surface high | `#1A2430` | Hover and selected records |
| Bone / text | `#F3F0E7` | Primary text, paper evidence |
| Fog / muted | `#A9B2BC` | Secondary metadata (7.1:1 on ink) |
| Archive amber | `#F5B842` | Primary action, resolved records |
| Amber ink | `#241600` | Text on amber |
| Signal mint | `#54D6A2` | Verified and complete |
| Warning coral | `#FF8C78` | Missing or corrupt item |
| Grid blue | `#294057` | Structure and focus support |

All meaningful states pair color with an icon and text. Primary text, muted
text, controls, and focus outlines meet WCAG AA against their surfaces.

## Type and spacing

- Display and body: the native `ui-sans-serif` system stack; compact and highly
  legible across desktop platforms without a network or font payload.
- Evidence labels and hashes: native `ui-monospace`, with tabular figures.
- Type steps: 13, 15, 17, 21, 30, and clamp(42–68) px. Body is 17 px.
- Spacing follows a 4 px base: 4, 8, 12, 16, 24, 32, 48, 72.
- Reading copy is capped at 68 characters. Operational lists can use the full
  workspace width.

## Shape, depth, and interaction grammar

Corners are clipped rather than pill-shaped: an archive is precise, not soft.
Panels use one-pixel blue-gray edges and a shallow black shadow. A dot-grid is
embedded in the background. The primary action is a high-contrast amber block.
Hover lifts actionable objects by 2 px; selected records illuminate their path
in the verification map. Progress grows left-to-right like a checksum pass.
Touch targets are at least 44 px and focus uses a 3 px mint outline.

Desktop keeps the archive ledger and verification summary side-by-side. At
390 px they stack, secondary metadata collapses, and the import/export action
remains first. The phone site explains the desktop workflow and routes to the
correct installer; archive processing itself remains a desktop capability.

## Motion policy

UI state changes use 180–240 ms opacity and transform transitions. The hero
geometry draws once on first view (700 ms) to explain “mail references become
verified local files”; nothing loops. Progress is determinate. Under
`prefers-reduced-motion: reduce`, drawing and transforms are removed and states
change instantly.

## Asset plan and provenance

The hero is an original raster illustration generated for this product, then
cropped and optimized to responsive WebP. UI icons and the app mark are
hand-authored SVGs made of nodes and checksum paths.

### Prompt sheet

- Subject: an abstract mailbox archive resolving paper-like file fragments
  into a rigorous graph of distinct attachment nodes
- World: dark archival workbench, forensic index, no literal room
- Materials: charcoal paper, cream vellum, amber resin, fine blueprint ink
- Light: quiet raking light, amber nodes emitting a soft localized glow
- Lens/composition: orthographic editorial still life, landscape, geometry
  concentrated at right with calm negative space at left
- Palette words: midnight graphite, bone paper, archive amber, signal mint,
  muted steel blue
- Negative list: no people, no brands, no logos, no legible text, no UI mockup,
  no envelopes with email-service marks, no generic gradient, no watermark

### Generated asset

- `assets/src/archive-geometry.png`
- Tool/model: `/opt/fleet/lib/gen-image.sh`, factory-image (Azure AI Foundry)
- Date: 2026-08-28
- Prompt: “Orthographic editorial still life for a privacy-first desktop mail
  archive: scattered charcoal and cream paper fragments enter a precise
  geometric verification lattice and converge into a smaller set of distinct
  amber resin file-nodes; fine blueprint lines, checksum dots, quiet raking
  light, midnight graphite ground, bone paper, archive amber, signal mint and
  muted steel blue; composition weighted to the right with calm negative space
  at left; tactile generative geometry, crisp and trustworthy, not a software
  UI. No people, brands, logos, legible text, watermark, generic gradients, or
  email-provider symbols.”
- License/provenance: original generated asset commissioned for this product;
  project use permitted. The site footer discloses generated imagery.

### Repair derivatives and demo surface

- `public/assets/social-card.webp` is a centered 1200×630 crop of the original
  generated hero, made locally with ImageMagick on 2026-08-28. It introduces no
  new source imagery or license.
- `public/assets/apple-touch-icon.png` is a 180 px rasterization of the
  hand-authored application mark.
- The demo reuses the desktop ledger, verification ring, clipped panels, and
  amber evidence banner. On 390 px, the verification report moves ahead of the
  attachment list so the unresolved item is not hidden below the sample data.
