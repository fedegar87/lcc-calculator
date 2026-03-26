# LCCzero Execution Strategy Design

**Date:** 2026-03-26
**Status:** Approved
**Approach:** GSD Full + YOLO mode

---

## Overview

This document defines the execution strategy for implementing the LCCzero web application from the implementation plan (`llc-implementation-plan.md` v4). The project replaces a CRAVEzero Excel LCC calculator with a full-stack web app using Next.js 14, TypeScript, PostgreSQL, Prisma, tRPC, and a glass morphism UI.

## Execution Framework: GSD (Get Shit Done)

GSD manages the project lifecycle: roadmap creation, phase planning, execution with atomic commits, and verification. YOLO mode means automatic execution without human confirmation at each step.

### Workflow

```
/gsd:new-project  -->  creates PROJECT.md + ROADMAP.md from llc-implementation-plan.md
    |
    v
/gsd:plan-phase N  -->  creates PLAN.md for phase N (research, plan, verify)
    |
    v
/gsd:execute-phase N  -->  executes PLAN.md with atomic commits per task
    |
    v
/gsd:verify-work  -->  validates phase goal achieved
    |
    v
(repeat for each phase)
    |
    v
/gsd:audit-milestone  -->  final validation of all phases
```

### Session Continuity

- `/gsd:resume-work` restores context between sessions
- `/gsd:pause-work` creates handoff document when stopping mid-phase
- `/gsd:progress` shows current state and routes to next action

## Phase Mapping

The 10 TASKs from the implementation plan map to 9 GSD phases:

| Phase | Source TASK(s) | Name | Est. Time |
|-------|---------------|------|-----------|
| 1 | TASK 0 | Project Scaffolding | 15 min |
| 2 | TASK 1 | Excel Workbook Audit | 30 min |
| 3 | TASK 2 + 3 | Schema, Types & Constants | 25 min |
| 4 | TASK 4 | Calculation Engine | 45 min |
| 5 | TASK 5 | Engine Tests | 30 min |
| 6 | TASK 6 | Database Seed | 15 min |
| 7 | TASK 7 + 8 | tRPC API + Auth | 35 min |
| 8 | TASK 9 | UI Implementation | 45 min |
| 9 | TASK 10 | Export (PDF + Excel) | 20 min |

**Total estimated:** ~260 min

### Phase Merge Rationale

- **TASK 2+3 merged** (Phase 3): Schema and engine types are co-dependent. Types reference Prisma enums, constants reference audit output. Executing together avoids back-and-forth.
- **TASK 7+8 merged** (Phase 7): Auth middleware protects tRPC routes. Building routes without auth means retrofitting protection later. Better to wire together.

## Parallelism Strategy

### Within-Phase Parallelism

GSD executor agents use **wave-based execution** within each phase. Independent tasks within a wave run in parallel via the Task tool.

**Phase 3 (Schema + Types):** 2 waves
- Wave 1: `schema.prisma` + `types.ts` (parallel)
- Wave 2: `constants.ts` + `validation.ts` (depend on types)

**Phase 4 (Engine):** 4 sequential waves (module interdependencies)
- Wave 1: `discount.ts` (no deps)
- Wave 2: `energy.ts` + `maintenance.ts` (both need discount, independent of each other)
- Wave 3: `residual.ts` + `income.ts` (need maintenance types, independent of each other)
- Wave 4: `aggregate.ts` + `index.ts` (need all modules)

**Phase 5 (Tests):** 2 waves
- Wave 1: Create golden fixture `excel-reference.json`
- Wave 2: All 6 test files in parallel (all read the same fixture)

**Phase 7 (API + Auth):** 3 waves
- Wave 1: tRPC setup + Auth.js setup (parallel)
- Wave 2: All 6 routers in parallel + auth pages
- Wave 3: Root router merge + middleware + client

**Phase 8 (UI):** 4 waves
- Wave 1: Design system foundation (`globals.css`, `glass-card`, `animations.ts`, custom components)
- Wave 2: Layout components (sidebar, step-nav, variant-tabs) + Dashboard
- Wave 3: Form components (all 4 step pages, parallel)
- Wave 4: Results page + Charts (3 chart components, parallel)

### Cross-Phase Dependencies

```
Phase 1 (scaffold) --> Phase 2 (audit) --> Phase 3 (schema+types) --> Phase 4 (engine)
                                                                          |
                                                                          v
                                              Phase 5 (tests) --> Phase 6 (seed)
                                                                      |
                                                                      v
                                                              Phase 7 (API+auth)
                                                                      |
                                                                      v
                                                              Phase 8 (UI) --> Phase 9 (export)
```

All phases are sequential at the top level. Parallelism happens within phases.

## Frontend Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.x with glass morphism design system
- **Animation:** Framer Motion
- **Charts:** Recharts
- **Components:** shadcn/ui base + custom GlassCard, InfoTooltip, SliderInput, KPICard
- **State:** React Query (via tRPC) for server state, React state for local form state
- **Icons:** Lucide React

### Design System
- **Visual language:** Glass morphism (frosted cards, backdrop blur, layered shadows)
- **Color palette:** EURAC brand (#C8102E primary, gray scale, domain-specific accents)
- **Typography:** Inter (Google Fonts), weights 300-700
- **Accessibility:** WCAG AA, 44px touch targets, semantic HTML, focus rings
- **Responsive:** Mobile-first, 1/2-3/3-4 column grid progression
- **Motion:** Framer Motion presets (fadeIn, slideUp, scaleIn) with prefers-reduced-motion respect

Full design system specifications are in `llc-implementation-plan.md` under "Design System" section.

## GSD Configuration

### Profile
Default balanced profile. Engine-heavy phases (4, 5) may benefit from quality profile for formula accuracy.

### Commit Strategy
One atomic commit per completed task within a phase. Commit message format: `feat: TASK N.M -- description` for implementation, `test:` for tests, `docs:` for documentation.

Push after each completed phase per implementation plan requirement.

### Error Handling
- Build failures: fix before proceeding (GSD executor handles this)
- Test failures: fix in same phase, do not skip
- Formula mismatches: document in `docs/formula-map.md`, flag as issue

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Excel formula extraction fails | Python openpyxl scripts with fallback manual inspection |
| EN 15459 table has unexpected format | Validate row count + column headers before extraction |
| Engine tests don't match Excel values | Tolerance: +/-0.01 EUR intermediate, exact final (rounded to 2dp) |
| Auth.js beta API changes | Pin version in package.json |
| Large Prisma schema migration issues | Incremental migration, test with `db push` before `migrate dev` |

## Getting Started

```bash
# Initialize GSD project (creates .planning/ directory)
# Use llc-implementation-plan.md as the PRD
# Answer questionnaire referencing existing plan details

/gsd:new-project

# Then iteratively:
/gsd:plan-phase 1
/gsd:execute-phase 1
# ... repeat for phases 2-9
```
