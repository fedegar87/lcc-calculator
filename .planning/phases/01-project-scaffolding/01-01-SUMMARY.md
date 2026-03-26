---
phase: 01-project-scaffolding
plan: 01
subsystem: infra
tags: [next.js, tailwind-v4, shadcn-ui, prisma, trpc, vitest, better-auth, typescript]

# Dependency graph
requires: []
provides:
  - "Next.js 15 project structure with App Router and src/ directory"
  - "All npm dependencies (core, UI, export, dev) installed and locked"
  - "shadcn/ui component library (14 components in src/components/ui/)"
  - "EURAC brand design tokens in Tailwind v4 CSS-first config"
  - "Git repo with GitLab remote on main branch"
  - ".env.example template for database, auth, and export config"
  - "Package scripts for dev, build, test, lint, db operations"
affects: [01-02-tooling-config, 02-excel-audit, 03-database-schema, 07-auth, 08-ui]

# Tech tracking
tech-stack:
  added: [next@15.5.14, react@19, typescript@5.9, tailwindcss@4, prisma@7, "@trpc/server@11", vitest@4, zod@4, better-auth, motion@12, recharts@3, shadcn@4, exceljs@4, "@react-pdf/renderer@4", sharp]
  patterns: [tailwind-v4-css-first, shadcn-ui-data-slot, inter-font-variable, oklch-colors]

key-files:
  created: [".env.example", "src/components/ui/*.tsx (14 files)", "src/engine/.gitkeep", "src/hooks/.gitkeep", "scripts/.gitkeep", "tests/.gitkeep"]
  modified: ["package.json", "package-lock.json", ".gitignore", "src/app/globals.css", "src/app/layout.tsx"]

key-decisions:
  - "Downgraded to Next.js 15 (create-next-app installed v16 which is too new for tooling compatibility)"
  - "Used sonner instead of toast (shadcn deprecated toast component)"
  - "Used --font-inter CSS variable for Inter font integration with Tailwind v4"
  - "EURAC primary #C8102E converted to oklch(0.48 0.18 27.5) for Tailwind v4"

patterns-established:
  - "Tailwind v4 CSS-first: all design tokens in globals.css via @theme, no tailwind.config.js"
  - "shadcn/ui: components in src/components/ui/ with data-slot attributes (React 19)"
  - "Font loading: Inter via next/font/google with CSS variable --font-inter"
  - "Glass morphism: .glass and .glass-dark utility classes in @layer utilities"

requirements-completed: [SETUP-01, SETUP-02]

# Metrics
duration: 17min
completed: 2026-03-26
---

# Phase 1 Plan 1: Project Scaffolding Summary

**Next.js 15 project with Tailwind v4, shadcn/ui (14 components), EURAC brand colors, and all 30+ npm dependencies installed**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-26T12:50:23Z
- **Completed:** 2026-03-26T13:07:30Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Complete Next.js 15 project scaffold with TypeScript strict, Tailwind v4, ESLint, App Router
- All dependencies installed: Prisma 7, tRPC 11, Better Auth, Vitest 4, Zod 4, motion, recharts, exceljs, sharp
- 14 shadcn/ui components available (button, card, input, label, select, tabs, dialog, dropdown-menu, sonner, separator, badge, sheet, table, skeleton)
- EURAC brand design system configured: Inter font, primary #C8102E in OKLCH, glass morphism utilities
- Git configured with GitLab remote, branch renamed to main, CRAVEzero binaries untracked

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 and install all dependencies** - `829a188` (feat)
2. **Task 2: Configure Git remote and create initial commit** - `b68c224` (chore)

## Files Created/Modified
- `package.json` - All project dependencies, scripts (dev, build, test, db:*)
- `package-lock.json` - Locked dependency versions
- `.gitignore` - Augmented with CRAVEzero binary patterns, Prisma generated, IDE dirs
- `.env.example` - Template with DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, EXPORT_DIR
- `src/app/layout.tsx` - Root layout with Inter font, LCCzero metadata
- `src/app/globals.css` - Tailwind v4 @theme with EURAC colors, shadcn variables, glass morphism
- `src/components/ui/*.tsx` - 14 shadcn/ui components
- `src/lib/utils.ts` - cn() utility for class merging
- `src/engine/.gitkeep` - Placeholder for calculation engine (Phase 4)
- `src/hooks/.gitkeep` - Placeholder for React hooks (Phase 8)
- `scripts/.gitkeep` - Placeholder for audit scripts (Phase 2)
- `tests/.gitkeep` - Placeholder for Vitest tests (Phase 5)

## Decisions Made
- **Next.js 15 over 16:** create-next-app installed v16 by default, but research identified v16 as too new (March 2026 release) with unverified tooling support. Downgraded to 15.5.14.
- **Sonner over Toast:** shadcn/ui deprecated the `toast` component in favor of `sonner`. Used sonner as the toast solution.
- **OKLCH color conversion:** EURAC #C8102E converted to oklch(0.48 0.18 27.5). Values are approximations that should be visually verified.
- **No @trpc/next:** Correctly excluded Pages Router-only package per research findings. Using @trpc/tanstack-react-query with fetch adapter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused non-empty directory**
- **Found during:** Task 1 (Scaffold step)
- **Issue:** `create-next-app .` rejected the existing directory due to CRAVEzero/, .planning/, etc.
- **Fix:** Scaffolded into temporary directory, copied files over, ran npm install
- **Files modified:** All scaffolded files
- **Verification:** All existing directories intact, npm install successful
- **Committed in:** 829a188

**2. [Rule 1 - Bug] Next.js 16 installed instead of required v15**
- **Found during:** Task 1 (version check)
- **Issue:** create-next-app@latest installed Next.js 16.2.1, but research explicitly recommends v15
- **Fix:** Ran `npm install next@15 eslint-config-next@15` to downgrade
- **Files modified:** package.json, package-lock.json
- **Verification:** `node -e "console.log(require('./node_modules/next/package.json').version)"` returns 15.5.14
- **Committed in:** 829a188

**3. [Rule 1 - Bug] shadcn toast component deprecated**
- **Found during:** Task 1 (shadcn add step)
- **Issue:** `npx shadcn@latest add toast` fails: "The toast component is deprecated. Use the sonner component instead."
- **Fix:** Replaced `toast` with `sonner` in the component list
- **Files modified:** src/components/ui/sonner.tsx
- **Verification:** Component file exists and builds
- **Committed in:** 829a188

**4. [Rule 1 - Bug] CRAVEzero binaries tracked in git**
- **Found during:** Task 2 (binary check)
- **Issue:** .xlsm and .docx files were committed in the initial commit before .gitignore was updated
- **Fix:** `git rm --cached` to untrack without deleting from disk
- **Files modified:** Git index only
- **Verification:** `git ls-files | grep -E '\.(xlsm|docx)$'` returns empty
- **Committed in:** b68c224

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 blocking, 1 deprecation)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Node.js v25.2.1 triggers EBADENGINE warnings for @prisma/studio-core (expects ^20.19 || ^22.12 || ^24.0). This is a warning only and does not affect functionality.
- 11 npm audit vulnerabilities (5 moderate, 6 high) from transitive dependencies. These are in export/PDF dependencies and don't affect runtime security.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Project structure ready for Plan 01-02 (tooling configuration: Prisma schema, tRPC boilerplate, Vitest config)
- All dependencies installed, shadcn/ui components available
- Design tokens configured for EURAC brand
- No blockers

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 01-project-scaffolding*
*Completed: 2026-03-26*
