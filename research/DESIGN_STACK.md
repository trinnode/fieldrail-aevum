# FIELDRAIL — Design stack research (all accesses dated 2026-11-25)

Labels: **VERIFIED** = directly fetched/read on 2026-11-25. **UNVERIFIED** = inferred or not build-tested. Fetched web content was treated as untrusted data only.

---

## 1. Aceternity UI — how it actually ships today

### Official URLs consulted

| URL | What it gave | Status |
| --- | --- | --- |
| `https://ui.aceternity.com/docs` | Docs index / navigation; footer states "Install them with the shadcn CLI or let your AI agent do it" | **VERIFIED** (HTTP 200, text/html) |
| `https://ui.aceternity.com/installation` | Installation guide: registry config, CLI, MCP, requirements, Pro token, troubleshooting | **VERIFIED** (HTTP 200) |
| `https://ui.aceternity.com/components` | Full component catalogue and exact slugs | **VERIFIED** (HTTP 200) |
| `https://ui.aceternity.com/licence` | Aceternity licence terms | **VERIFIED** (HTTP 200) |
| `https://ui.aceternity.com/license` | 404 — wrong spelling | **VERIFIED** |
| `https://ui.aceternity.com/components/3d-card-effect`, `/card-spotlight`, `/background-beams`, `/bento-grid`, `/moving-border`, `/text-generate-effect` | Per-component CLI command, props, manual source tab | **VERIFIED** (each HTTP 200; page slug for 3D is `3d-card-effect`) |
| `https://ui.aceternity.com/registry/<name>.json` | Machine-readable component definitions (dependencies + file paths) | **VERIFIED** (HTTP 200 for all six names below) |

### Copy-in vs npm — **VERIFIED**

Aceternity UI components are **copy-in source files (`components/ui/*.tsx`)**, installed via a **shadcn registry** or copied manually. There is no single runtime npm package to import. Evidence from the official installation page:

- Add the registry to `components.json`:

```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```

- `npx shadcn@latest add @aceternity/bento-grid` — "The CLI adds the files and installs their dependencies."
- `npx shadcn@latest search @aceternity -q "card"` — browse registry from the terminal.
- "Prefer to copy and paste? Every component page also shows the full source" (CLI / Manual tabs).
- AI-agent route: `npx shadcn@latest mcp init --client claude` (also `cursor`, `vscode`), then the agent searches the Aceternity registry over MCP.
- `@aceternity` is a **shadcn registry namespace, not an npm package name**. **UNVERIFIED** whether an official npm package with that scope exists; the docs never mention one and the registry endpoint is the documented source.

**Exact npm dependencies the components actually need** (from registry JSON + installation page), all latest versions from `https://registry.npmjs.org/<pkg>/latest` on 2026-11-25 — **VERIFIED**:

| Package | Version | Why |
| --- | --- | --- |
| `motion` | 14.14.0 | Animation engine. Components import from `motion/react` — this is Framer Motion's new package name. The troubleshooting section explicitly says "Cannot find module framer-motion → install `motion`". |
| `clsx` | 2.1.1 | `cn()` helper |
| `tailwind-merge` | 3.7.1 | `cn()` helper |
| `@tabler/icons-react` | 3.53.0 | Bento Grid demo icons (registry dependency) |
| `three`, `@react-three/fiber`, `@types/three` | — | Only pulled transitively by Card Spotlight → `canvas-reveal-effect` (registry dependency) |

`lib/utils.ts` is required by every component:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

**Requirements** (official installation page) — **VERIFIED**: React 19 + a React framework (Next.js, TanStack Start, Vite, React Router), **Tailwind CSS v4**, TypeScript recommended (components are `.tsx`). Global CSS must start with `@import "tailwindcss";`.

### Licence / Pro restrictions — **VERIFIED**

Correct URL: `https://ui.aceternity.com/licence` (spelled "licence"; `/license` 404s).

- The Aceternity Licence permits: unlimited end products for yourself or clients; selling/licensing/distributing end products; modification and combination; multi-use across projects.
- Prohibited: redistributing the item as stock/source files; selling or distributing the item or derivatives on any marketplace; creating themes/templates/derivative products to sell on a marketplace.
- Third-party components inside items may carry their own licences.
- **Free vs Pro**: the installation guide says components install with "No account needed", while "Blocks, pages and Pro components come with the All-Access Pass" (one-time payment). Pro items need an API key in `.env.local` as `ACETERNITY_PRO_TOKEN`, and `components.json` must use the registry entry with `"headers": { "Authorization": "Bearer ${ACETERNITY_PRO_TOKEN}" }`. A 401 means the key is missing/expired/not on an active licence.
- All six components recommended below returned **HTTP 200 from their registry JSON with no token on 2026-11-25** → free at time of verification. **UNVERIFIED** whether that changes later.
- For an internal hackathon/demo fintech app: no Pro pass is required for these six components. Avoid redistributing the raw `.tsx` as a downloadable template/product.

### Component recommendations for a programme-finance dashboard

Verified registry IDs and exact CLI commands (all six command strings appeared verbatim on their component pages):

| Priority | Component | Registry ID / install | Verified deps | Why it earns its place |
| --- | --- | --- | --- | --- |
| 1 | **Bento Grid** (page slug `bento-grid`) | `npx shadcn@latest add @aceternity/bento-grid` | `@tabler/icons-react` | Best fit: a responsive overview of KPI tiles — disbursed vs committed budget, active programmes, pending approvals, last reconciliation. Real information hierarchy, not decoration. Retheme its default `bg-white`/`dark:bg-black` classes to your light tokens. |
| 2 | **Card Spotlight** (`card-spotlight`) | `npx shadcn@latest add @aceternity/card-spotlight` | registry dependency on `canvas-reveal-effect` → `three`, `@react-three/fiber`, `@types/three` | Cursor-follow spotlight on a single hero programme card or "focus area" panel gives tactile feedback without moving data. **Caveat:** it is a WebGL component and ships a heavy 3D dependency chain — if bundle size or low-end devices matter, use the lighter `@aceternity/spotlight-new` (registry 200, `motion` only) instead. Default spotlight colour is dark (`#262626`); override for light-first. |
| 3 | **3D Card Effect** (page slug `3d-card-effect`, **registry ID `3d-card`**) | `npx shadcn@latest add @aceternity/3d-card` | none declared | Subtle pointer-tilt card for a featured programme, donor/story card, or "impact snapshot" on a landing/report page. Zero extra deps. **Gotcha:** `@aceternity/3d-card-effect` returns HTTP 401 — use `@aceternity/3d-card`. Exports `CardContainer`, `CardBody`, `CardItem`. |
| 4 | **Background Beams** (`background-beams`) | `npx shadcn@latest add @aceternity/background-beams` | `motion` | Appropriate only on the sign-in / marketing / first-run page, behind a hero — it is a dark, animated background and would be noise behind tables or forms. Use as a boundary between public and authenticated surfaces. |
| 5 (optional) | **Moving Border** (`moving-border`) | `npx shadcn@latest add @aceternity/moving-border` | `motion` | One animated border on a single primary CTA ("Launch disbursement review") on the landing page. Do not put it on routine dashboard buttons. |

**Deliberately not recommended:** **Text Generate Effect** (`npx shadcn@latest add @aceternity/text-generate-effect`, deps `motion`) — word-by-word blur reveal is a demo/marketing flourish that slows comprehension in an operations product. Its default copy is also poetic, not financial. Use only on a one-off presentation splash if a judge demo needs it.

**Light-first warning:** several Aceternity components are authored dark-first (`dark:bg-black`, `dark:text-white`, dark spotlights). Budget explicit class overrides; do not adopt their demo theme wholesale.

---

## 2. Next.js App Router + Tailwind + wagmi/viem — current versions and install

Versions below come from the npm registry endpoint `https://registry.npmjs.org/<package>/latest`, queried **2026-11-25** — **VERIFIED**. Docs commands come from the official sites listed.

| Package | Latest | Node / peer facts (from registry metadata) |
| --- | --- | --- |
| `next` | 16.4.6 | `engines.node >=20.9.0`; peer `react ^18.2.0 || ^19.0.0`, `react-dom` same |
| `create-next-app` | 16.4.6 | `engines.node >=20.9.0` |
| `react` / `react-dom` | 19.3.1 | react-dom peer `react ^19.3.1` |
| `tailwindcss` | 4.3.5 | no `engines` field; docs site header shows v4.3 |
| `wagmi` | 3.7.11 | peer `viem 2.x`, `react >=18`, `@tanstack/react-query >=5.0.0`, **`typescript >=5.9.3`** |
| `viem` | 2.58.6 | peer `typescript >=5.0.4`, `mppx >=0.17.0` (optional peer not re-checked — **UNVERIFIED**) |
| `@tanstack/react-query` | 5.108.4 | peer `react ^18 || ^19` |
| `motion` | 14.14.0 | peer `react ^18 || ^19` |
| `shadcn` (CLI) | 4.23.0 | `engines.node >=20.18.1` |
| `typescript` | 7.0.2 | `engines.node >=16.20.0`; satisfies wagmi's `>=5.9.3`. TS 7 + Next 16 compatibility not build-tested — **UNVERIFIED**; pin `5.9.3` if any tooling objects. |

### Node compatibility

Local runtime confirmed by `node --version` / `npm --version`: **Node v26.7.0, npm 11.19.0** — **VERIFIED**.

- Next.js official installation docs (`https://nextjs.org/docs/app/getting-started/installation`, page last updated 2026-10-02) state **minimum Node 20.9** — **VERIFIED**.
- `next` and `create-next-app` metadata declare only a lower bound (`>=20.9.0`), no upper bound — **VERIFIED**, so Node 22 and 26 are not excluded. A full `next build` on Node 26 was **not** run here — **UNVERIFIED**.
- `shadcn` CLI requires Node >=20.18.1 — **VERIFIED**.
- Tailwind, wagmi, viem, TanStack Query and Motion declare no `engines` restriction — **VERIFIED**.

### Install sequence (all commands from official docs)

```bash
# 1. App Router + Tailwind v4 (default: TypeScript, ESLint, App Router, Turbopack, @/* alias)
npx create-next-app@latest fieldrail-web --yes
cd fieldrail-web

# 2. Tailwind v4 manual setup if not using create-next-app defaults
npm install tailwindcss @tailwindcss/postcss postcss
# postcss.config.mjs -> { plugins: { "@tailwindcss/postcss": {} } }
# app/globals.css   -> @import "tailwindcss";

# 3. shadcn CLI + Aceternity registry
npx shadcn@latest init
# add to components.json registries: "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
npm install motion clsx tailwind-merge      # or let the CLI install them
npx shadcn@latest add @aceternity/bento-grid @aceternity/card-spotlight @aceternity/3d-card @aceternity/background-beams

# 4. Wallet stack (wagmi v3 + viem v2 + TanStack Query v5)
npm install wagmi viem@2.x @tanstack/react-query
# pin TS to >=5.9.3 for wagmi 3; create-next-app already supplies TypeScript
```

Official documentation URLs:
- `https://nextjs.org/docs/app/getting-started/installation` — **VERIFIED** (manual install `npm i next@latest react@latest react-dom@latest`; Turbopack default; min Node 20.9; React 19 canary in App Router).
- `https://tailwindcss.com/docs/installation/framework-guides/nextjs` — **VERIFIED** (`@tailwindcss/postcss` + `@import "tailwindcss";`).
- `https://tailwindcss.com/docs/installation` — **VERIFIED** (docs header v4.3).
- `https://wagmi.sh/react/installation` and `https://wagmi.sh/react/getting-started` — **VERIFIED** (`npm install wagmi viem@2.x @tanstack/react-query`; `createConfig` + `WagmiProvider` + `QueryClientProvider`; `cookieToInitialState` available for SSR).
- `https://ui.aceternity.com/installation` — **VERIFIED**.

**Next.js App Router integration note:** `WagmiProvider` and `QueryClientProvider` must live in a client component (`"use client"`) wrapping the app in `app/layout.tsx`; wagmi hooks then work in descendant client components. This pattern is **VERIFIED** from wagmi's getting-started page. Combining it with Next 16 Cache Components / SSR in this specific app is **UNVERIFIED** and should be smoke-tested early.

### Version-pinning recommendation for the hackathon

Pin exact versions in `package.json` (no `^`) from the table above. wagmi 3 is a major version with a newer `createConfig` API (no connectors by default) — do not copy wagmi v1/v2 snippets from memory. If peer conflicts appear, `npm install --legacy-peer-deps` is the official troubleshooting hint on the Aceternity installation page, but prefer pnpm if available.
