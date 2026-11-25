# FIELDRAIL — Font research (accessed / verified 2026-11-25)

Scope: distinctive, non-default typography for a **premium, light-first financial operations product**. No Inter / Roboto / Arial / Open Sans / bare system stack as the primary pairing. No font files were downloaded into the repo; URLs only.

All status labels below are based on direct requests made on **2026-11-25**.

---

## Recommendation (top candidate)

**Fraunces (display / headlines / large KPI statements) + Geist (UI, body, labels) + JetBrains Mono (tabular figures, IDs, addresses, code).**

Rationale:
- Fraunces is a variable "old-style" serif with optical sizing — editorial and expensive-feeling without the default-tech look. In a light-first fintech dashboard it gives the single moment of personality (programme title, headline KPI, empty-state hero) while leaving dense tables alone.
- Geist is a precise, screen-optimised neo-grotesque (Vercel) that is *not* one of the default families and has clean tabular figures for UI chrome.
- JetBrains Mono keeps amounts, wallet addresses, transaction IDs and dates aligned column-to-column. Use it only for numeric/technical data, never for prose.

### Exact WOFF2 download URLs (latin subset, variable)

| Family | Role | Variable axes | Exact URL | `curl -I` result (2026-11-25) |
| --- | --- | --- | --- | --- |
| Fraunces | Display | `opsz` 9–144, `wght` 100–900 | `https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2` | **HTTP/2 200**, `content-type: font/woff2`, `content-length: 67304`, `cache-control: public, max-age=31536000` — **VERIFIED** |
| Geist | Body / UI | `wght` 400–700 | `https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFU.woff2` | **HTTP/2 200**, `content-type: font/woff2`, `content-length: 29400`, `cache-control: public, max-age=31536000` — **VERIFIED** |
| JetBrains Mono | Numerals / code | `wght` 400–700 | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2` | **HTTP/2 200**, `content-type: font/woff2`, `content-length: 31432`, `cache-control: public, max-age=31536000` — **VERIFIED** |

These URLs were extracted from the official Google Fonts CSS2 API responses:
- Fraunces: `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900&display=swap` — **VERIFIED** (returned a single variable latin file with `font-weight: 100 900`)
- Geist: `https://fonts.googleapis.com/css2?family=Geist:wght@400..700&display=swap` — **VERIFIED**
- JetBrains Mono: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap` — **VERIFIED**

The same CSS responses also give `latin-ext`, `cyrillic` and `vietnamese` subset URLs for each family; only the latin subset is listed above. If programme names include diacritics outside latin, pull the `latin-ext` URL from the same CSS response (the exact `latin-ext` URLs were observed but are **UNVERIFIED** by `curl -I`; do not hard-code without re-checking).

### Licence / embedding rights

All three are licensed under the **SIL Open Font License 1.1 (OFL-1.1)** — verified by reading the official licence files in the Google Fonts repository on 2026-11-25:

| Family | Official licence source | Status |
| --- | --- | --- |
| Fraunces | `https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/OFL.txt` (Copyright 2018 The Fraunces Project Authors) | **VERIFIED** — first lines state "This Font Software is licensed under the SIL Open Font License, Version 1.1." |
| Geist | `https://raw.githubusercontent.com/google/fonts/main/ofl/geist/OFL.txt` (Copyright 2024 The Geist Project Authors, https://github.com/vercel/geist-font.git) | **VERIFIED** — same OFL-1.1 statement (a later request timed out mid-body but the header/subject were confirmed) |
| JetBrains Mono | `https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt` (Copyright 2020 The JetBrains Mono Project Authors) | **VERIFIED** — same OFL-1.1 statement |

Practical terms (OFL-1.1):
- **Web embedding / self-hosting is explicitly permitted** — you may bundle the WOFF2 in your app and serve it via `@font-face` or `next/font/local`.
- Modification and derivative works are permitted; modified versions must **not** use the reserved font name(s) without permission, and must be distributed under OFL-1.1.
- The font software may **not** be sold on its own; it may be bundled inside a commercial product.
- Keep the OFL licence text alongside the font files you ship (e.g. `public/fonts/OFL.txt`) — this is the standard compliance step.
- No attribution is required in the UI, but preserving the copyright notice in the licence file is required.

### Variable font availability

- Fraunces — **variable confirmed**; Google Fonts CSS2 returns `font-weight: 100 900` from one file. The upstream family also exposes `SOFT` and `WONK` axes, but whether those are live in the Google-served file is **UNVERIFIED** — treat `opsz` + `wght` as the supported axes.
- Geist — **variable confirmed** (`font-weight: 400 700` from one file).
- JetBrains Mono — **variable confirmed** (`font-weight: 400 700` from one file).
- Instrument Serif and Bricolage Grotesque (below) are also served as variable files from the same API.

### Implementation sketch (Next.js App Router, self-hosted)

```css
/* app/globals.css */
@font-face {
  font-family: "Fraunces";
  src: url("/fonts/fraunces-latin-variable.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Geist";
  src: url("/fonts/geist-latin-variable.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrainsmono-latin-variable.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
```

Or use `next/font/local` with `src: "./fonts/...woff2"`, `weight: "100 900"`, `variable: "--font-display"`, and apply the CSS variables in the root layout. Either route is compliant under OFL.

### Deterministic fallback stack

```css
--font-display: "Fraunces", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
--font-body:    "Geist", "Helvetica Neue", "Segoe UI", "Noto Sans", sans-serif;
--font-numeric: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

Require `font-variant-numeric: tabular-nums` on every money/percentage/ID cell regardless of which font loads, so columns stay aligned even on the fallback path.

---

## Candidates 2 and 3 (both viable, not chosen)

| # | Pairing | Why it works | URLs / licence |
| --- | --- | --- | --- |
| 2 | **Instrument Serif** (display) + **Geist** (body) + JetBrains Mono (figures) | Quieter, more restrained than Fraunces; high-contrast display serif that reads as "institutional premium" for NGO/finance reporting. Single weight (400) keeps it disciplined. | Google Fonts CSS2 `https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap`. Latin variable/static file observed: `https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2` — **VERIFIED HTTP/2 200, `content-type: font/woff2`, content-length 21032**. OFL-1.1, `https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt` — **VERIFIED**. Only weight 400 is offered; **not** a multi-weight variable family. |
| 3 | **Bricolage Grotesque** (display) + **Geist** (body) + JetBrains Mono (figures) | More assertive/brutalist grotesque for a hackathon demo that needs to look bold on a projector; less "bank" and more "product studio". | Google Fonts CSS2 `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400..800&display=swap`. Latin variable file: `https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9H6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiawA1Xp.woff2` — **VERIFIED HTTP/2 200, `content-type: font/woff2`, content-length 41344**. OFL-1.1, `https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/OFL.txt` — **VERIFIED**. **Variable** 400–800. |

Note: a previously-guessed Bricolage URL (`.../v13/...`) failed with SSL errors and is **not** valid — use the v9 URL above, which was pulled from the live CSS response and verified.

---

## Anti-patterns to avoid

- Do not use the same family for display and body with only weight change — Fraunces/Geist are deliberately different in register (warm serif vs cool grotesque).
- Do not set Fraunces below ~20px; its detail gets muddy in table cells. Body/table text stays Geist.
- Do not animate font loading; use `font-display: swap` with a metric-close fallback to avoid CLS on dashboard KPIs.
