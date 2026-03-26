# Stack Research

**Domain:** Financial/Engineering Calculator Web Application (nZEB Life-Cycle Cost Analysis)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Validation Summary

The user-chosen stack is **solid with three critical corrections**:

1. **Next.js 14 -> Next.js 15** (not 16 yet; see rationale below)
2. **Auth.js -> Better Auth** (Auth.js merged into Better Auth project; Better Auth is the successor)
3. **framer-motion -> motion** (Framer Motion renamed to Motion; import from `motion/react`)

Everything else validates well. Prisma with Decimal, tRPC, Recharts, shadcn/ui, Vitest, exceljs, @react-pdf/renderer are all current, actively maintained, and appropriate for this domain.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 15.x (latest 15.x) | Full-stack React framework | App Router is stable and mature. v15 is the pragmatic choice: v16.2 exists but requires React 19.2 and has breaking changes (async params, middleware->proxy rename). v15 is well-documented, all ecosystem libraries (tRPC, Better Auth, shadcn/ui) have proven v15 support. Upgrade to v16 after initial release when ecosystem stabilizes. | HIGH |
| React | 19.x (19.2.4) | UI library | Required by Next.js 15. Server Components, Server Actions, `use()` hook all stable. v19.2 adds View Transitions but those are optional. | HIGH |
| TypeScript | 5.7.x | Type safety | TS 6.0 RC just dropped (March 2026) with `strict: true` as default. Use 5.7.x for stability -- TS 6.0 is too fresh for a greenfield project and Next.js 15 doesn't officially support it yet. TS 5.7 is battle-tested. | HIGH |

**Why Next.js 15, not 14 or 16:**
- **Not 14:** End of active support. Missing React 19, Server Actions improvements, and Turbopack stability.
- **Not 16 (yet):** Released March 2026. Breaking changes include fully async Request APIs (`params`, `cookies()`, `headers()`), middleware renamed to proxy, requires React 19.2 minimum. The ecosystem (tRPC adapters, Better Auth, testing tools) has proven compatibility with v15 but v16 compatibility is still being validated. For a greenfield project starting now, v15 provides the best stability-to-features ratio. Plan upgrade to v16 in Phase 9 (polish/optimization).

### Database & ORM

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| PostgreSQL | 16.x | Relational database | The standard for financial applications. Native `NUMERIC`/`DECIMAL` types with arbitrary precision. JSONB for flexible metadata. Mature, reliable, excellent tooling. | HIGH |
| Prisma ORM | 7.x (latest 7.4) | Database ORM & migrations | v7 rewrote the query engine (dropped Rust binary for TS/WASM). 85-90% smaller engine (~1.6MB vs ~14MB). Decimal type maps to `decimal.js` automatically. Schema-driven migrations are excellent for team workflows. Prisma Studio for debugging. The `@db.Decimal(precision, scale)` native type annotation gives exact control over PostgreSQL NUMERIC columns. | HIGH |

**Why Prisma, not Drizzle:**
Drizzle is lighter and faster for raw queries, but Prisma wins here because:
- Built-in `Decimal` type backed by `decimal.js` -- critical for this project's financial calculations
- Schema-driven migrations with `prisma migrate` are more reliable for a multi-developer academic project
- Prisma Studio provides visual DB inspection without additional tooling
- The team is already committed to Prisma; switching adds risk for marginal gain
- Prisma 7's engine rewrite closed the performance gap significantly

### API Layer

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| tRPC | 11.x (latest 11.12) | Type-safe API layer | End-to-end type safety between client and server without code generation. v11 is stable, actively maintained, with first-class Next.js App Router support. `createCaller` for Server Components (no HTTP overhead), React Query hooks for Client Components. Zod validation at the boundary layer. | HIGH |
| @tanstack/react-query | 5.x | Server state management | Required by tRPC v11 for client-side data fetching. Provides caching, background refetching, optimistic updates. Replaces manual `useState`/`useEffect` data-fetching patterns. | HIGH |
| Zod | 3.x | Schema validation | tRPC's native validation library. Use for input validation on all procedures. Schemas can be shared between client forms and server validation. | HIGH |
| superjson | 2.x | Data serialization | Required for tRPC to serialize Decimal, Date, Map, Set, BigInt across the wire. Critical for this project's Decimal financial values. | HIGH |

### Authentication

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Better Auth | latest | Authentication framework | **Auth.js (NextAuth) merged into Better Auth in September 2025.** Better Auth is the official successor. Built-in email/password credentials, session management, rate limiting, password policies, and email verification. First-class Next.js integration. Prisma adapter available. Plugin architecture for future needs (2FA, magic links, organizations). For a new project in 2026, this is the correct choice -- not Auth.js v5. | MEDIUM |

**Why MEDIUM confidence on Better Auth:**
The merger is recent (September 2025). The migration is real and documented, but Better Auth is younger than Auth.js was. The credentials provider works well, but documentation for edge cases is still maturing. **Fallback plan:** Auth.js v5 (next-auth@5.x) still works and will be maintained for a transition period. If Better Auth causes friction, fall back to Auth.js v5 -- the API is similar enough that switching early is low-cost.

**Why not roll custom auth:**
This is an academic project with limited scope. The authentication needs are simple (email/password, session cookies). Rolling custom auth is a security risk and time sink. Better Auth provides exactly what's needed with minimal configuration.

### UI & Styling

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Tailwind CSS | 4.x (4.1+) | Utility-first CSS | v4 is stable with CSS-first configuration (no `tailwind.config.js`). 5x faster full builds, 100x faster incremental builds. OKLCH color support. `@theme` directive for design tokens. Well-suited for glass morphism (backdrop-blur, transparency utilities built in). | HIGH |
| shadcn/ui | latest (CLI v4) | Component library | Not a dependency -- components are copied into your project. Full Tailwind v4 + React 19 support. `data-slot` attributes for styling. CLI v4 handles installation. Perfect for rapid UI development with full customization control. | HIGH |
| Motion (ex Framer Motion) | 12.x (12.38) | Animation library | **Renamed from framer-motion to motion.** Import from `motion/react`, NOT `framer-motion`. Same API, new package. Hardware-accelerated animations via Web Animations API. Spring physics, gesture tracking, layout animations. Ideal for glass morphism transitions, page transitions, and micro-interactions. | HIGH |
| tw-animate-css | latest | Tailwind animation plugin | **Replaces `tailwindcss-animate`** which is deprecated by shadcn/ui in favor of `tw-animate-css`. Required for shadcn/ui component animations with Tailwind v4. | HIGH |

### Charting & Visualization

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Recharts | 3.x (3.8) | Interactive charts | 3.6M+ weekly downloads. Declarative React components for bar, line, area, pie charts. SVG-based rendering. Composable API (`<LineChart>`, `<Bar>`, `<Tooltip>`, `<Legend>`). Good enough for LCC breakdown charts, cost evolution lines, and variant comparison bars. Lightweight, well-documented, actively maintained. | HIGH |

**Why Recharts, not alternatives:**
- **Not Nivo:** More features but heavier, steeper learning curve. Overkill for this project's 4-5 chart types.
- **Not Chart.js/react-chartjs-2:** Canvas-based (not SVG), harder to style with Tailwind, less React-idiomatic.
- **Not Tremor:** Good for dashboards but opinionated styling conflicts with custom glass morphism design.
- **Not D3 directly:** Too low-level. Recharts already wraps D3 submodules.
- **Not ECharts:** Powerful but large bundle, imperative API, less React-native.

### Export

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| exceljs | 4.4.0 | Excel export (.xlsx) | Standard for server-side Excel generation in Node.js. Supports formatting, formulas, multiple sheets, styling. Last published 2 years ago but stable and feature-complete for .xlsx generation. 5M+ weekly downloads. | MEDIUM |
| @react-pdf/renderer | 4.3.x | PDF export | React component-based PDF generation. Declarative API matches the project's React-first approach. Supports custom fonts, images, tables, styled layouts. Server-side rendering compatible. | HIGH |

**Why MEDIUM confidence on exceljs:**
The package hasn't been updated in 2 years (last release: 4.4.0). It works, it's stable, and it's widely used, but the lack of recent maintenance is a concern. **Alternative if issues arise:** `xlsx-js-style` (a maintained fork of SheetJS with styling support). Monitor for security advisories.

### Testing

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Vitest | 4.x (4.1.1) | Unit & integration testing | The standard test runner for Vite-based projects. Jest-compatible API. Near-instant startup. Browser Mode now stable. TypeScript support without additional config. ESM-native. Perfect for testing the LCC calculation engine. | HIGH |
| @testing-library/react | 16.x | Component testing | Standard for React component tests. DOM-based, user-centric queries. | HIGH |
| Playwright | latest | E2E testing | Cross-browser end-to-end testing. Visual regression support in Vitest 4. Trace support for debugging. Use for wizard flow E2E tests and export verification. | MEDIUM |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint 9.x + @eslint/js | Linting | Flat config format. Next.js provides `eslint-config-next`. |
| Prettier | Code formatting | With `prettier-plugin-tailwindcss` for class sorting. |
| Turbopack | Bundler | Default in Next.js 15+. No configuration needed. Stable for dev and build. |
| prisma studio | DB inspection | `npx prisma studio` for visual database exploration during development. |
| @t3-oss/env-nextjs | Environment validation | Type-safe environment variables with Zod schemas. Prevents runtime env var errors. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| decimal.js | 10.x | Arbitrary precision arithmetic | Automatically used by Prisma for Decimal fields. Also use directly in engine calculations if you need precision beyond IEEE 754 `number`. For LCC calculations, JS `number` is fine (per DEC-001), but decimal.js is available via Prisma when reading/writing DB values. |
| date-fns | 4.x | Date manipulation | For reference period calculations, date formatting in exports. Lighter than moment.js/dayjs, tree-shakeable. |
| react-hook-form | 7.x | Form management | For the 5-step wizard. Performant (uncontrolled inputs), integrates with Zod via `@hookform/resolvers`. |
| @hookform/resolvers | 3.x | Form validation bridge | Connects Zod schemas to react-hook-form. Single validation schema shared between form and tRPC input. |
| nuqs | 2.x | URL state management | Type-safe search params for Next.js App Router. Use for filter/sort state in project lists, chart view options. |
| sonner | 2.x | Toast notifications | shadcn/ui-compatible toast component. Lightweight, accessible. For autosave confirmations, error messages. |
| next-themes | 0.4.x | Theme management | If dark mode is needed. Works with shadcn/ui and Tailwind v4 CSS variables. |
| server-only / client-only | latest | Boundary enforcement | Prevents accidental import of server code in client bundles and vice versa. Required by tRPC App Router setup. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Next.js 16 | Too new (March 2026). Breaking changes not yet absorbed by ecosystem. Upgrade later. |
| Framework | Next.js 15 | Remix/React Router 7 | Less ecosystem, no tRPC adapter, smaller community. Next.js is the standard. |
| ORM | Prisma 7 | Drizzle ORM | Prisma's Decimal type and schema migrations are more important than Drizzle's raw perf edge. |
| Auth | Better Auth | Auth.js v5 | Auth.js merged into Better Auth. For new projects, Better Auth is the forward path. |
| Auth | Better Auth | Lucia Auth | Lucia was archived in March 2025. No longer maintained. |
| Charts | Recharts 3.x | Nivo | Heavier, more complex. Recharts covers all needed chart types with simpler API. |
| Charts | Recharts 3.x | Tremor | Opinionated styling conflicts with custom glass morphism design system. |
| Animation | Motion 12 | CSS-only | Motion provides spring physics, gesture tracking, and layout animations that CSS can't match for glass morphism effects. |
| PDF | @react-pdf/renderer | puppeteer/playwright PDF | Browser-based PDF generation requires headless browser on server. @react-pdf is pure Node.js, no browser dependency. |
| Excel | exceljs | SheetJS (xlsx) | SheetJS community edition lacks styling. exceljs supports full formatting needed for financial reports. |
| Testing | Vitest 4 | Jest 30 | Vitest is faster, ESM-native, zero-config with Vite/Turbopack projects. Jest 30 improved but Vitest is now the standard for new projects. |
| State | @tanstack/react-query | SWR | tRPC v11 integrates with TanStack React Query natively. SWR would require custom adapter. |
| Forms | react-hook-form | Formik | react-hook-form is more performant (uncontrolled), smaller bundle, better Zod integration. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` (package name) | Renamed to `motion`. The `framer-motion` npm package still works but is a legacy alias. New projects should use the `motion` package. | `motion` (import from `motion/react`) |
| `tailwindcss-animate` | Deprecated by shadcn/ui for Tailwind v4. | `tw-animate-css` |
| `tailwind.config.js` | Tailwind v4 uses CSS-first configuration. No JS config file needed. | `@theme` directive in `globals.css` |
| Auth.js v5 / next-auth@5 | Merged into Better Auth. Starting a new project on Auth.js is choosing a transitioning codebase. | Better Auth |
| Lucia Auth | Archived March 2025. No longer maintained. | Better Auth |
| `moment.js` | Massive bundle (300KB+), mutable API. | `date-fns` (tree-shakeable, immutable) |
| `axios` | Unnecessary with tRPC. Next.js has built-in `fetch` with caching. | tRPC client / native `fetch` |
| PostgreSQL `MONEY` type | Locale-dependent formatting and precision. Behavior changes across database instances. | `NUMERIC(precision, scale)` via Prisma Decimal |
| `next/font` with Google Fonts download | Avoid at build time for self-hosted deployments. | Pre-download Inter font files, serve from `/public/fonts/` |
| React Context for server state | Stale data, no caching, no background refresh. | TanStack React Query (via tRPC) |
| `prisma.$queryRaw` for standard operations | Bypasses type safety, Decimal handling, and relation loading. | Prisma Client typed queries. Reserve `$queryRaw` only for complex aggregations if needed. |

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19.x, TypeScript 5.7.x | Stable combination. React 19.0 minimum. |
| Next.js 15.x | Prisma 7.x | Works via API routes or Server Actions. |
| tRPC 11.x | Next.js 15.x App Router | Use `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`. Do NOT use `@trpc/next` (Pages Router only). |
| tRPC 11.x | @tanstack/react-query 5.x | Required pairing. tRPC 11 dropped built-in React hooks in favor of TanStack Query integration. |
| shadcn/ui (CLI v4) | Tailwind CSS 4.x, React 19.x | CLI auto-detects versions. Components output for correct Tailwind/React version. |
| Better Auth | Prisma 7.x | Via `@better-auth/prisma` adapter. Shares the same Prisma client. |
| Motion 12.x | React 19.x | Full React 19 concurrent rendering support. |
| Vitest 4.x | TypeScript 5.7.x | Native TypeScript support. No `ts-jest` needed. |
| exceljs 4.4.0 | Node.js 18+ | Works in Next.js API routes / Server Actions. Not browser-compatible (use server-side only). |
| @react-pdf/renderer 4.x | React 19.x | Server-side rendering compatible. Can generate PDFs in API routes. |

---

## Installation

```bash
# Core framework
npm install next@15 react@19 react-dom@19

# Database & ORM
npm install prisma@7 @prisma/client@7

# API layer
npm install @trpc/server@11 @trpc/client@11 @trpc/tanstack-react-query@11 @tanstack/react-query@5 superjson@2 zod@3

# Authentication
npm install better-auth @better-auth/prisma

# UI & Styling
npm install tailwindcss@4 motion@12 tw-animate-css

# shadcn/ui (installed via CLI, not npm)
npx shadcn@latest init

# Charting
npm install recharts@3

# Export
npm install exceljs@4 @react-pdf/renderer@4

# Forms & Utilities
npm install react-hook-form@7 @hookform/resolvers@3 date-fns@4 nuqs@2 sonner@2 server-only client-only

# Environment validation
npm install @t3-oss/env-nextjs

# Dev dependencies
npm install -D typescript@5.7 @types/react @types/react-dom vitest@4 @testing-library/react@16 @testing-library/jest-dom eslint@9 prettier prettier-plugin-tailwindcss @playwright/test
```

---

## Stack Patterns by Variant

**If Better Auth causes friction during Phase 2 (Auth):**
- Fall back to Auth.js v5 (`next-auth@5`)
- The API is similar: middleware-based session, Prisma adapter
- Migration cost is low if caught early

**If exceljs maintenance becomes a concern:**
- Switch to `xlsx-js-style` (maintained fork of SheetJS with cell styling)
- API is different but covers the same use cases
- Or consider `@pdi/xlsx` for a more modern alternative

**If Next.js 16 upgrade is needed mid-project:**
- Run `npx @next/codemod@latest upgrade` for automated migration
- Main change: all `params`, `cookies()`, `headers()` become async
- Test tRPC adapter compatibility before merging

---

## Sources

- [Next.js 16.2 Blog Post](https://nextjs.org/blog/next-16-2) -- Current latest version, verified March 2026 (HIGH)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- Breaking changes documented (HIGH)
- [Prisma ORM v7.4 Release](https://www.prisma.io/blog/prisma-orm-v7-4-query-caching-partial-indexes-and-major-performance-improvements) -- Latest Prisma, Feb 2026 (HIGH)
- [Prisma Decimal Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types) -- Decimal.js integration (HIGH)
- [tRPC v11 Announcement](https://trpc.io/blog/announcing-trpc-v11) -- Stable release, v11.12.0 as of March 2026 (HIGH)
- [tRPC Next.js App Router Setup](https://trpc.io/docs/client/nextjs) -- Integration guide (HIGH)
- [Auth.js -> Better Auth Merger](https://github.com/nextauthjs/next-auth/discussions/13252) -- Official announcement (HIGH)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next) -- Setup documentation (MEDIUM)
- [Better Auth Migration from Auth.js](https://better-auth.com/docs/guides/next-auth-migration-guide) -- Migration guide (MEDIUM)
- [Recharts npm](https://www.npmjs.com/package/recharts) -- v3.8.0, 3.6M+ weekly downloads (HIGH)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) -- Official migration/setup (HIGH)
- [Motion (ex Framer Motion)](https://motion.dev/docs/react-upgrade-guide) -- Rename documentation (HIGH)
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4) -- Current stable (HIGH)
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) -- RC March 2026, use 5.7.x for now (HIGH)
- [React 19.2.4 Release](https://react.dev/versions) -- Current stable React (HIGH)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- Stable since Jan 2025 (HIGH)
- [exceljs npm](https://www.npmjs.com/package/exceljs) -- v4.4.0, last updated 2 years ago (MEDIUM)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- v4.3.2 (HIGH)

---
*Stack research for: nZEB Life-Cycle Cost Calculator Web Application*
*Researched: 2026-03-26*
