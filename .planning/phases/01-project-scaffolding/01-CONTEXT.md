# Phase 1: Project Scaffolding - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (llc-implementation-plan.md TASK 0)

<domain>
## Phase Boundary

This phase creates the foundational project structure for the LCCzero web application. After completion, a developer can clone the repo, install dependencies, and run the app with all tooling configured. No business logic, no database, no UI content -- just the skeleton.

</domain>

<decisions>
## Implementation Decisions

### Framework & Tooling
- Next.js 15 with App Router, TypeScript strict mode, Tailwind CSS v4, ESLint
- Use `npx create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- **Stack update from research:** Use Next.js 15 (not 14), Tailwind v4 (CSS-first config via `@theme`), `motion` (not `framer-motion`)

### Dependencies (from implementation plan TASK 0.2)
- Core: `@prisma/client @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod superjson`
- Auth: Better Auth (research finding -- replaces `next-auth@beta`). Fallback: `next-auth@beta @auth/prisma-adapter`
- UI: `recharts react-number-format lucide-react class-variance-authority clsx tailwind-merge tw-animate-css motion`
- Export: `exceljs @react-pdf/renderer sharp`
- Dev: `prisma vitest @vitejs/plugin-react tsx @types/node`
- shadcn/ui components: button, card, input, label, select, tabs, dialog, dropdown-menu, toast, separator, badge, sheet, form, table, skeleton

### Project Structure
- Working directory: `C:\llc-calculator-app`
- Source in `src/` with subdirectories: `app/`, `components/`, `engine/`, `server/`, `lib/`, `hooks/`
- `CRAVEzero/` directory exists and must NOT be modified
- `docs/` for documentation deliverables
- `scripts/` for one-off audit scripts
- `tests/` for Vitest test files
- `prisma/` for schema and migrations (committed, not gitignored)

### Git Configuration
- GitLab remote: `https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git`
- Branch: `main`
- Commit convention: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### Configuration Files
- `.gitignore`: node_modules, .next, .env*, coverage, CRAVEzero/*.xlsm, CRAVEzero/*.docx
- `.env.example`: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, EXPORT_DIR
- `vitest.config.ts`: globals true, node environment, `@/` alias
- Package scripts: dev, build, start, lint, test, test:run, db:push/migrate/seed/studio/generate

### Design System Foundation
- Inter font via `next/font/google` (weights 300-700)
- EURAC color palette in Tailwind config: primary #C8102E, grays #404648/#666B6C/#B2B5B5
- Glass morphism utilities in globals.css
- Tailwind v4 CSS-first config (no `tailwind.config.js` -- use `@theme` directive)

### Claude's Discretion
- Exact package versions (use latest stable as of March 2026)
- Better Auth vs Auth.js decision (research recommends Better Auth, but if issues arise, fallback to Auth.js v5)
- shadcn/ui initialization details (CLI prompts, color scheme)
- Tailwind v4 migration specifics (CSS-first config syntax)
- README.md content structure

</decisions>

<specifics>
## Specific Ideas

- The `CRAVEzero/` directory already contains the Excel workbook and extracted text files -- these must be preserved
- The `docs/plans/` directory already exists with the execution strategy design doc
- The `.planning/` directory already exists with GSD artifacts
- `prisma/migrations/` must NOT be gitignored (migrations are source code)
- Use `npm` not `yarn` or `pnpm`

</specifics>

<deferred>
## Deferred Ideas

- Prisma schema creation (Phase 3)
- Auth setup (Phase 7)
- UI component implementation (Phase 8)
- Any business logic or page content

</deferred>

---
*Phase: 01-project-scaffolding*
*Context gathered: 2026-03-26 via PRD Express Path*
