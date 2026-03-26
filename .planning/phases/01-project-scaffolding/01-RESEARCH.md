# Phase 1: Project Scaffolding - Research

**Researched:** 2026-03-26
**Domain:** Next.js 15 full-stack scaffolding with Tailwind v4, shadcn/ui, Prisma 7, tRPC 11, Vitest
**Confidence:** HIGH

## Summary

Phase 1 creates the foundational skeleton for the LCCzero web application. The working directory (`C:\llc-calculator-app`) already contains a git repo, `CRAVEzero/` data files, `docs/`, `plans/`, and `.planning/` artifacts. The scaffolding must initialize Next.js 15 around these existing contents without disturbing them.

The main complexity is that `create-next-app` expects an empty or near-empty directory. Running `npx create-next-app@latest . --yes` in the current directory will work because create-next-app tolerates non-conflicting existing files, but the `.gitignore` it generates must be augmented to protect `CRAVEzero/*.xlsm` and `CRAVEzero/*.docx` from accidental commits. After scaffolding, Tailwind v4 is already configured by create-next-app (CSS-first, no `tailwind.config.js`), and shadcn/ui can be initialized on top. Prisma 7 and tRPC 11 require boilerplate files but no business logic. Vitest needs a config file and the `vite-tsconfig-paths` plugin for `@/` alias resolution.

**Primary recommendation:** Run `create-next-app` in the existing directory with `--use-npm`, then layer shadcn/ui init, Prisma 7 generator, tRPC boilerplate, and Vitest config on top. Install all dependencies up-front in grouped batches. No business logic, no DB schema, no auth setup -- just the skeleton.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Next.js 15 with App Router, TypeScript strict mode, Tailwind CSS v4, ESLint
- Use `npx create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- Stack update from research: Use Next.js 15 (not 14), Tailwind v4 (CSS-first config via `@theme`), `motion` (not `framer-motion`)
- Core deps: `@prisma/client @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod superjson`
- Auth: Better Auth (fallback: `next-auth@beta @auth/prisma-adapter`)
- UI: `recharts react-number-format lucide-react class-variance-authority clsx tailwind-merge tw-animate-css motion`
- Export: `exceljs @react-pdf/renderer sharp`
- Dev: `prisma vitest @vitejs/plugin-react tsx @types/node`
- shadcn/ui components: button, card, input, label, select, tabs, dialog, dropdown-menu, toast, separator, badge, sheet, form, table, skeleton
- Working directory: `C:\llc-calculator-app`
- Source in `src/` with subdirectories: `app/`, `components/`, `engine/`, `server/`, `lib/`, `hooks/`
- `CRAVEzero/` directory must NOT be modified
- `docs/` for documentation, `scripts/` for audit scripts, `tests/` for Vitest, `prisma/` for schema
- GitLab remote: `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`
- Branch: `main`, commit convention: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- `.gitignore`: node_modules, .next, .env*, coverage, CRAVEzero/*.xlsm, CRAVEzero/*.docx
- `.env.example`: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, EXPORT_DIR
- `vitest.config.ts`: globals true, node environment, `@/` alias
- Package scripts: dev, build, start, lint, test, test:run, db:push/migrate/seed/studio/generate
- Inter font via `next/font/google` (weights 300-700)
- EURAC color palette in Tailwind: primary #C8102E, grays #404648/#666B6C/#B2B5B5
- Glass morphism utilities in globals.css
- Tailwind v4 CSS-first config (no `tailwind.config.js` -- use `@theme` directive)

### Claude's Discretion
- Exact package versions (use latest stable as of March 2026)
- Better Auth vs Auth.js decision (research recommends Better Auth, but if issues arise, fallback to Auth.js v5)
- shadcn/ui initialization details (CLI prompts, color scheme)
- Tailwind v4 migration specifics (CSS-first config syntax)
- README.md content structure

### Deferred Ideas (OUT OF SCOPE)
- Prisma schema creation (Phase 3)
- Auth setup (Phase 7)
- UI component implementation (Phase 8)
- Any business logic or page content
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-01 | Project scaffolded with Next.js 15, TypeScript strict, Tailwind v4, Prisma 7, tRPC 11 | create-next-app CLI flags verified, Prisma 7 generator config documented, tRPC 11 boilerplate structure researched |
| SETUP-02 | Git repository initialized with conventional commits and GitLab remote | Git repo already exists. Need .gitignore augmentation, remote add, and initial commit with conventional format |
| SETUP-03 | Vitest configured for engine unit testing | Vitest + vite-tsconfig-paths setup documented with Next.js 15 path alias support |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (latest) | Full-stack React framework with App Router | Stable, ecosystem-proven. v16 too new (March 2026 release, breaking changes). All tooling (tRPC, shadcn, Better Auth) has verified v15 support |
| React | 19.x | UI library | Ships with Next.js 15. Server Components, Server Actions stable |
| TypeScript | 5.7.x | Type safety | Stable. TS 6.0 RC too fresh (March 2026), Next.js 15 doesn't officially support it |
| Tailwind CSS | 4.x (4.1+) | Utility-first CSS | CSS-first config via `@theme` directive. No tailwind.config.js needed. 5x faster builds |
| Prisma ORM | 7.x (7.4.1) | Database ORM & migrations | New `prisma-client` provider (Rust-free). Output path now required. Decimal type for financial data |
| tRPC | 11.x (11.12) | Type-safe API layer | Fetch adapter for App Router. `@trpc/tanstack-react-query` for client hooks |
| shadcn/ui | CLI v4 | Component library (copied, not dependency) | Full Tailwind v4 + React 19 support. `data-slot` attributes. Preset system |
| Vitest | 4.x (4.1.1) | Unit & integration testing | ESM-native, instant startup, Jest-compatible API |

### Supporting (install in Phase 1 but configure later)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Better Auth | latest | Authentication | Phase 7 (Auth). Install now to avoid version conflicts |
| @better-auth/prisma-adapter | latest | Better Auth + Prisma bridge | Phase 7 |
| motion | 12.x | Animation library (ex framer-motion) | Phase 8 (UI). Import from `motion/react` |
| tw-animate-css | latest | Tailwind animation plugin for shadcn/ui | Phase 8. Replaces deprecated `tailwindcss-animate` |
| recharts | 3.x | Charting | Phase 8 (Results UI) |
| exceljs | 4.4.0 | Excel export | Phase 9 (Export) |
| @react-pdf/renderer | 4.x | PDF export | Phase 9 (Export) |
| @tanstack/react-query | 5.x | Server state (used by tRPC) | Phase 7 (API) |
| zod | 3.x | Schema validation | Phase 3+ |
| superjson | 2.x | Serialization for tRPC Decimals | Phase 7 (API) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `create-next-app` in existing dir | Manual setup | Manual is more work but avoids file conflicts. create-next-app in `.` works with non-conflicting existing files |
| `vite-tsconfig-paths` for Vitest aliases | Manual `resolve.alias` in vitest.config | vite-tsconfig-paths reads tsconfig.json automatically; manual alias requires maintaining two sources of truth |
| shadcn/ui CLI v4 init | Manual shadcn setup | CLI handles all config; manual requires knowing exact file structure. CLI is strongly recommended |

**Installation (Phase 1 -- all at once):**

```bash
# Step 1: create-next-app (installs next, react, react-dom, typescript, tailwindcss, eslint, @eslint/js)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes

# Step 2: shadcn/ui init (creates components.json, updates globals.css, adds lib/utils.ts)
npx shadcn@latest init

# Step 3: shadcn/ui components
npx shadcn@latest add button card input label select tabs dialog dropdown-menu toast separator badge sheet form table skeleton

# Step 4: Database & ORM
npm install @prisma/client@7 @prisma/adapter-pg
npm install -D prisma@7

# Step 5: API layer
npm install @trpc/server@11 @trpc/client@11 @trpc/tanstack-react-query@11 @tanstack/react-query@5 superjson@2 zod@3

# Step 6: Auth (install only, configure in Phase 7)
npm install better-auth

# Step 7: UI & styling deps
npm install motion@12 tw-animate-css recharts@3 react-number-format lucide-react class-variance-authority clsx tailwind-merge

# Step 8: Export deps (install only, use in Phase 9)
npm install exceljs@4 @react-pdf/renderer@4 sharp

# Step 9: Forms & utilities
npm install react-hook-form@7 @hookform/resolvers@3 server-only client-only

# Step 10: Dev dependencies
npm install -D vitest@4 @vitejs/plugin-react vite-tsconfig-paths @testing-library/react@16 @testing-library/dom tsx @types/node @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure (after scaffolding)

```
C:\llc-calculator-app\
├── .env.example              # Template env vars
├── .gitignore                # Augmented with CRAVEzero patterns
├── prisma/
│   └── schema.prisma         # Minimal generator block only (Phase 1)
├── prisma.config.ts          # Prisma 7 config (datasource URL)
├── vitest.config.ts          # Vitest with path aliases
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with Inter font, TRPCProvider
│   │   ├── page.tsx          # Placeholder home page
│   │   ├── globals.css       # Tailwind v4 @theme + EURAC palette + glass morphism
│   │   └── api/
│   │       └── trpc/
│   │           └── [...trpc]/
│   │               └── route.ts  # tRPC fetch handler
│   ├── components/
│   │   └── ui/               # shadcn/ui components (auto-generated by CLI)
│   ├── engine/               # Empty dir (Phase 4)
│   ├── server/
│   │   └── trpc/
│   │       ├── init.ts       # tRPC initialization + context
│   │       ├── router.ts     # Root router (empty procedures)
│   │       ├── client.tsx    # Client-side tRPC provider
│   │       ├── server.tsx    # Server-side caller
│   │       └── query-client.ts  # QueryClient factory
│   ├── lib/
│   │   ├── utils.ts          # shadcn cn() utility (auto-created)
│   │   └── prisma.ts         # PrismaClient singleton
│   └── hooks/                # Empty dir (Phase 8)
├── tests/                    # Vitest test files (Phase 5)
├── scripts/                  # Audit scripts (Phase 2)
├── docs/                     # Already exists
├── CRAVEzero/                # Already exists -- DO NOT MODIFY
├── plans/                    # Already exists
└── .planning/                # Already exists -- GSD artifacts
```

### Pattern 1: Tailwind v4 CSS-First Config with EURAC Palette

**What:** Define all design tokens in `globals.css` using `@theme` and `@theme inline` directives instead of `tailwind.config.js`.

**Example:**
```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* shadcn/ui CSS variables for light/dark mode */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.48 0.18 27.5);       /* EURAC #C8102E in OKLCH */
  --primary-foreground: oklch(0.98 0.01 106.42);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --border: oklch(0.92 0 0);
  --ring: oklch(0.48 0.18 27.5);          /* Same as primary */
  --radius: 0.5rem;
  /* ... additional shadcn/ui variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.98 0 0);
  /* ... dark mode overrides */
}

/* Register design tokens with Tailwind v4 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* EURAC custom color palette (static tokens) */
@theme {
  --color-eurac-red: oklch(0.48 0.18 27.5);     /* #C8102E */
  --color-eurac-dark: oklch(0.33 0.01 240);      /* #404648 */
  --color-eurac-gray: oklch(0.47 0.01 240);      /* #666B6C */
  --color-eurac-light: oklch(0.74 0.01 240);     /* #B2B5B5 */
  --font-sans: var(--font-inter);
}

/* Glass morphism utilities */
@layer utilities {
  .glass {
    background: oklch(1 0 0 / 0.1);
    backdrop-filter: blur(12px);
    border: 1px solid oklch(1 0 0 / 0.2);
  }
  .glass-dark {
    background: oklch(0 0 0 / 0.2);
    backdrop-filter: blur(12px);
    border: 1px solid oklch(1 0 0 / 0.1);
  }
}
```
**Source:** Tailwind CSS v4 @theme docs (https://tailwindcss.com/docs/theme), shadcn/ui Tailwind v4 guide (https://ui.shadcn.com/docs/tailwind-v4)

### Pattern 2: Prisma 7 Generator (Minimal -- No Schema Yet)

**What:** Set up the Prisma 7 generator with the new required `output` path and `prisma-client` provider. No models yet (Phase 3).

**Example:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models will be added in Phase 3
```

```typescript
// prisma.config.ts (project root)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
});
```

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```
**Source:** Prisma 7 upgrade guide (https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)

### Pattern 3: tRPC 11 App Router Boilerplate

**What:** Minimal tRPC setup with fetch adapter, server-side caller, and client-side provider. No business procedures yet.

**Key files:** `src/server/trpc/init.ts`, `src/server/trpc/router.ts`, `src/server/trpc/client.tsx`, `src/server/trpc/server.tsx`, `src/server/trpc/query-client.ts`, `src/app/api/trpc/[...trpc]/route.ts`

**Example (init.ts):**
```typescript
// src/server/trpc/init.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    // Auth context will be added in Phase 7
  };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

**Example (route.ts):**
```typescript
// src/app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });

export { handler as GET, handler as POST };
```
**Source:** tRPC App Router setup guide (https://trpc.io/docs/client/nextjs/app-router-setup)

### Pattern 4: Vitest Configuration for Engine Testing

**What:** Vitest with `vite-tsconfig-paths` for `@/` alias resolution and `node` environment (engine tests don't need DOM).

**Example:**
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```
**Source:** Next.js Vitest guide (https://nextjs.org/docs/app/guides/testing/vitest), Vitest docs (https://vitest.dev/config/)

### Anti-Patterns to Avoid

- **Creating `tailwind.config.js`:** Tailwind v4 is CSS-first. All config goes in `globals.css` via `@theme`. shadcn/ui CLI v4 handles this correctly.
- **Using `@trpc/next`:** That package is for Pages Router only. App Router uses `@trpc/tanstack-react-query` with fetch adapter.
- **Importing from `@prisma/client`:** Prisma 7 requires importing from the custom output path (e.g., `../generated/prisma`).
- **Using `framer-motion` package:** Renamed to `motion`. Import from `motion/react`.
- **Using `tailwindcss-animate`:** Deprecated. Use `tw-animate-css` instead.
- **Using `prisma-client-js` provider:** Prisma 7 uses `prisma-client` (Rust-free).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path alias resolution in Vitest | Manual `resolve.alias` config | `vite-tsconfig-paths` plugin | Reads tsconfig.json automatically; single source of truth |
| CSS utility classes | Manual CSS classes | Tailwind v4 `@theme` tokens | Generates utility classes from design tokens automatically |
| Component library | Custom components from scratch | shadcn/ui CLI `add` command | Accessible, Tailwind-native, fully customizable once copied |
| tRPC boilerplate | Custom API client | tRPC App Router template files | Well-tested pattern with server-side prefetching and client hooks |
| PrismaClient singleton | Custom global caching | Standard globalForPrisma pattern | Prevents connection pool exhaustion in dev mode hot reloads |

**Key insight:** Phase 1 is pure scaffolding. Every file should be boilerplate from official templates. Custom logic = wrong phase.

## Common Pitfalls

### Pitfall 1: create-next-app Overwrites Existing Files

**What goes wrong:** Running `create-next-app .` in a directory with existing files can fail or overwrite `.gitignore`, `README.md`, or other files.
**Why it happens:** create-next-app generates its own `.gitignore` and other config files.
**How to avoid:** Back up `.gitignore` before running, or augment the generated one immediately after. The existing `.git/`, `CRAVEzero/`, `docs/`, `plans/`, `.planning/` directories should be safe (create-next-app doesn't touch directories it doesn't know about).
**Warning signs:** Missing CRAVEzero glob patterns in `.gitignore` after scaffolding.

### Pitfall 2: Prisma 7 Output Path Not Set

**What goes wrong:** `npx prisma generate` fails or generates into `node_modules` (legacy behavior removed).
**Why it happens:** Prisma 7 made `output` field mandatory in the generator block.
**How to avoid:** Always include `output = "../src/generated/prisma"` in the generator block. Import PrismaClient from that path, not from `@prisma/client`.
**Warning signs:** Import errors like "Cannot find module '@prisma/client'".

### Pitfall 3: Prisma 7 Driver Adapter Required

**What goes wrong:** PrismaClient instantiation fails without a driver adapter.
**Why it happens:** Prisma 7 removed the built-in Rust query engine. All DB connections now go through driver adapters.
**How to avoid:** Install `@prisma/adapter-pg` for PostgreSQL. Instantiate with `new PrismaClient({ adapter })`. See Pattern 2 above.
**Warning signs:** Runtime error about missing engine or adapter.

### Pitfall 4: tRPC @trpc/next Package Used Instead of Fetch Adapter

**What goes wrong:** API routes fail with App Router, or tRPC complains about missing Pages Router context.
**Why it happens:** The CONTEXT.md lists `@trpc/next` in dependencies, but this package is for Pages Router only.
**How to avoid:** Do NOT install `@trpc/next`. Use `@trpc/server/adapters/fetch` for App Router route handlers. Use `@trpc/tanstack-react-query` for client-side hooks.
**Warning signs:** "Cannot find module next/api" errors, or tRPC handler not matching route.

### Pitfall 5: shadcn/ui Generates Tailwind v3 Config

**What goes wrong:** `tailwind.config.js` gets created alongside the CSS-first Tailwind v4 setup, causing conflicts.
**Why it happens:** Older shadcn CLI or misconfigured project detected as Tailwind v3.
**How to avoid:** Use `npx shadcn@latest init` (latest CLI v4). It auto-detects Tailwind v4 when `@import "tailwindcss"` is present in the CSS file. Do NOT create `tailwind.config.js` manually.
**Warning signs:** A `tailwind.config.js` file appears after shadcn init.

### Pitfall 6: OKLCH Color Conversion for EURAC Palette

**What goes wrong:** EURAC hex colors (#C8102E, #404648, etc.) look wrong when naively converted to OKLCH.
**Why it happens:** Tailwind v4 uses OKLCH color space. Hex colors must be accurately converted.
**How to avoid:** Use a reliable converter (e.g., oklch.com or CSS `color()` function) to convert EURAC hex values. Verify visually.
**Warning signs:** Brand colors look washed out or different from the original hex values.

### Pitfall 7: Vitest `environment: "jsdom"` for Engine Tests

**What goes wrong:** Engine (pure calculation) tests run slower than necessary and may have DOM-related side effects.
**Why it happens:** Using `jsdom` environment when no DOM is needed.
**How to avoid:** Use `environment: "node"` in vitest.config.ts for the engine test suite. Only use `jsdom` for component tests (Phase 8).
**Warning signs:** Tests import unnecessary DOM polyfills, slower test execution.

## Code Examples

### Complete .gitignore Augmentation

```gitignore
# -- Next.js generated defaults --
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# -- Project-specific --
# CRAVEzero binary files (text extracts are tracked)
CRAVEzero/*.xlsm
CRAVEzero/*.docx

# Prisma generated client
src/generated/

# IDE
.vscode/
.idea/
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

### .env.example

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lccdb?schema=public"

# Auth
BETTER_AUTH_SECRET="your-secret-at-least-32-chars-long"
BETTER_AUTH_URL="http://localhost:3000"

# Legacy (kept for reference if fallback to Auth.js needed)
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-nextauth-secret"

# Export
EXPORT_DIR="./exports"
```

### Inter Font Setup in Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LCCzero",
  description: "Life-Cycle Cost Calculator for nZEB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` JS config | CSS-first `@theme` directive in CSS | Tailwind v4.0 (Jan 2025) | No JS config file. All tokens in CSS. Faster builds. |
| `prisma-client-js` provider | `prisma-client` provider (Rust-free) | Prisma 7.0 (Dec 2025) | Output path required. Import from generated path, not `@prisma/client`. Driver adapter required. |
| `framer-motion` package | `motion` package | Mid 2025 | Import from `motion/react` instead of `framer-motion`. Same API. |
| `tailwindcss-animate` | `tw-animate-css` | shadcn/ui Tailwind v4 update | Old package incompatible with Tailwind v4 |
| `@trpc/next` (Pages Router) | `@trpc/tanstack-react-query` + fetch adapter | tRPC v11 | App Router uses Web standard Request/Response |
| `@trpc/react-query` (v10 hooks) | `@trpc/tanstack-react-query` (v11) | tRPC v11 | Package renamed. New `createTRPCContext` + `useTRPC()` pattern |
| `next-auth` / Auth.js | Better Auth | Sep 2025 (merger) | Better Auth is the successor. `better-auth` package, `better-auth/next-js` integration |
| shadcn/ui forwardRef components | `data-slot` attribute components | shadcn/ui CLI v4 (Mar 2026) | React 19 dropped forwardRef. Components use data-slot for styling |

**Deprecated/outdated:**
- `framer-motion` npm package: Legacy alias. Use `motion` package.
- `tailwindcss-animate`: Incompatible with Tailwind v4. Use `tw-animate-css`.
- `@trpc/next`: Pages Router only. Use fetch adapter for App Router.
- `@prisma/client` imports: Prisma 7 generates to custom output path.
- `tailwind.config.js`: Tailwind v4 uses CSS-first config.

## Open Questions

1. **EURAC Hex to OKLCH Accuracy**
   - What we know: Tailwind v4 uses OKLCH internally. EURAC colors are defined as hex (#C8102E, #404648, #666B6C, #B2B5B5).
   - What's unclear: Exact OKLCH equivalents need visual verification. CSS `oklch()` and hex may render slightly differently depending on browser gamut handling.
   - Recommendation: Use a tool like oklch.com to convert, then verify visually in the browser. The values in the code example above are approximations that should be validated.

2. **create-next-app in Non-Empty Directory Behavior**
   - What we know: `create-next-app .` works when existing files don't conflict with generated files. The `--yes` flag skips prompts.
   - What's unclear: Whether the existing `.git/` directory causes any issues (create-next-app normally runs `git init`).
   - Recommendation: Use `--disable-git` flag to prevent create-next-app from running `git init` (git repo already exists). Then verify no files were overwritten.

3. **Prisma 7 `prisma.config.ts` vs `datasource` in schema.prisma**
   - What we know: Prisma 7 introduced `prisma.config.ts` for datasource URL, but `datasource` block in schema.prisma still works.
   - What's unclear: Whether both are needed or if schema.prisma `datasource` block alone is sufficient for basic usage.
   - Recommendation: Keep `datasource` block in schema.prisma for simplicity in Phase 1. Add `prisma.config.ts` only if needed for seed scripts or advanced config. Test with `npx prisma generate` to confirm.

4. **`@trpc/next` in Dependencies List**
   - What we know: CONTEXT.md lists `@trpc/next` in core deps, but this is Pages Router only.
   - What's unclear: Whether user intentionally wants Pages Router support or this is a stale reference.
   - Recommendation: Do NOT install `@trpc/next`. Use `@trpc/tanstack-react-query` instead. This is a correction to the CONTEXT.md dependency list.

## Sources

### Primary (HIGH confidence)
- [Next.js create-next-app CLI Reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) - All CLI flags verified, including `--disable-git` and `--agents-md`
- [Tailwind CSS v4 @theme docs](https://tailwindcss.com/docs/theme) - CSS-first config, @theme vs @theme inline, namespaces, OKLCH
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - CLI v4 compatibility, @theme inline, OKLCH colors
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) - Init command, project templates, component adding
- [shadcn CLI v4 Changelog (March 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) - Preset system, `shadcn init --template next`, `shadcn info`
- [tRPC App Router Setup](https://trpc.io/docs/client/nextjs/app-router-setup) - Complete file structure, fetch adapter, server-side caller, client hooks
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) - Generator changes, output path, driver adapter, prisma.config.ts
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) - Manual setup, vite-tsconfig-paths plugin, test examples
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) - framer-motion to motion migration, import path change
- [Better Auth Installation](https://better-auth.com/docs/installation) - npm install, env vars, Next.js route handler, client creation
- [Better Auth Prisma Adapter](https://better-auth.com/docs/adapters/prisma) - Adapter setup, Prisma 7 output path note, schema generation

### Secondary (MEDIUM confidence)
- [Prisma Better Auth Guide](https://www.prisma.io/docs/guides/authentication/better-auth/nextjs) - Better Auth + Prisma + Next.js integration
- [Vitest path alias discussion](https://github.com/vercel/next.js/discussions/72424) - Community confirmation of vite-tsconfig-paths approach

### Tertiary (LOW confidence)
- EURAC OKLCH color values: Approximate conversions from hex. Need visual verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions and CLI commands verified from official docs
- Architecture: HIGH - tRPC, Prisma 7, Vitest patterns from official guides
- Pitfalls: HIGH - Prisma 7 breaking changes, tRPC package naming, Tailwind v4 migration well-documented
- OKLCH colors: LOW - Hex-to-OKLCH conversion values are approximations

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, 30-day validity)
