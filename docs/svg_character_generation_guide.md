# SVG Character Generation Guide (A-Z, a-z, 0-9)

This document defines strict rules for generating tracing-guide SVG paths so output is consistent and does not drift in size, alignment, or quality.

## 1) Coordinate System (Mandatory)

- Use `viewBox: "0 0 260 300"` for every character.
- All coordinates must stay inside bounds:
  - `0 <= x <= 260`
  - `0 <= y <= 300`
- Never generate points outside the viewBox (prevents clipping and off-center render).

## 2) Shared Layout Lines

Use these alignment lines for all characters:

- **Left sidebearing:** `x = 44`
- **Right sidebearing:** `x = 216`
- **Center line:** `x = 130`
- **Top line (caps):** `y = 36`
- **Cap baseline:** `y = 264`
- **Lowercase x-height top:** `y = 104`
- **Lowercase baseline:** `y = 228`
- **Descender line:** `y = 288`
- **Vertical center:** `y = 150`

## 3) Character Bands

### Uppercase A-Z
- Draw inside `y = 36..264`.
- Most uppercase letters should visually fill this band.
- Keep visual center near `(130, 150)`.

### Lowercase a-z
- Standard lowercase body: `y = 104..228`.
- Ascenders (`b d f h k l t`) may rise to `y = 36`.
- Descenders (`g j p q y`) may drop to `y = 288`.
- Keep body letters (`a c e m n o r s u v w x z`) inside `y = 104..228`.

### Digits 0-9
- Default to cap-height style (`y = 36..264`) unless explicitly choosing old-style figures.
- Use one style only; do not mix styles.

## 4) Path Construction Rules

- Use smooth cubic (`C`) or quadratic (`Q`) curves for rounded forms.
- Use straight (`L`) segments for geometric stems/bars.
- Use `fill="none"` behavior (single-stroke guide path style).
- Keep endpoints and joins smooth:
  - avoid sudden hooks unless intentional.
  - avoid very sharp bends on rounded letters.
- Keep stroke flow natural for tracing (logical start-to-end motion).

## 5) Consistency Rules

- Similar letters must share geometry logic:
  - `O`, `0`, `Q` share same core oval proportions.
  - `C` and `G` share same outer curve family.
  - `b/d/p/q` share mirrored bowl proportions.
- Lowercase letters should not appear randomly high/low:
  - body letters aligned to x-height/baseline band.
- Horizontal centering:
  - each glyph's visual mass should be centered around `x = 130`.
  - narrow glyphs (`i`, `l`, `1`) need balanced sidebearings.

## 6) AI Output Contract (Use This Prompt)

When generating characters with AI, enforce this contract:

1. Return only JSON array entries of:
   - `character`
   - `svgPath`
   - `viewBox`
2. Always set `viewBox` to `"0 0 260 300"`.
3. Respect all alignment lines in this document.
4. Keep all coordinates inside bounds.
5. Keep lowercase body letters in `y = 104..228`.
6. Keep descenders inside `y <= 288`.
7. Keep uppercase and digits in `y = 36..264`.
8. Do not output experimental alternates; output one canonical form per character.

## 7) Automatic Validation Checklist

Before accepting generated paths, validate:

- **Bounds check:** No command point outside viewBox.
- **Band check:** Character respects its required vertical band.
- **Center check:** Visual bbox center near `x = 130` (allow small tolerance).
- **Height check:** Character uses expected height range for its class.
- **Style check:** Curves are smooth; no accidental corners.
- **Pair check:** Related pairs (`b/d/p/q`, `C/G`, `O/Q/0`) have consistent proportions.

## 8) Manual QA Checklist (Device Preview)

Test on target phone screen with the same app canvas:

- Does each character appear centered in the blue guide box?
- Do lowercase body letters align to same baseline/x-height?
- Are descenders visible and not clipped?
- Are `S`, `G`, `a`, `c`, `e`, `2`, `5`, `8` smooth and readable?
- Is tracing flow natural from start to finish?

## 9) Recommended Workflow

1. Generate a small batch (5-10 chars).
2. Run validation checks.
3. Preview on device.
4. Fix geometry and regenerate only failed chars.
5. Freeze approved chars as canonical references.
6. Generate remaining chars using approved references as style anchors.

## 10) Canonical Sets to Build

- `uppercase`: `A-Z`
- `lowercase`: `a-z`
- `digits`: `0-9`

Store each set with the same rules and never mix unvalidated paths into production.
