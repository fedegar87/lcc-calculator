# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — LCCzero Calculator

**Shipped:** 2026-03-28
**Phases:** 11 | **Plans:** 26 | **Sessions:** ~8

### What Was Built
- Pure TypeScript calculation engine replicating 35+ Excel LCC formulas with formula mode toggle and golden dataset validation
- Full-stack web app: Next.js 15 + tRPC 11 + Prisma 7 + Better Auth + PostgreSQL
- Glass morphism wizard UI with 5-step data entry, 21 category accordions, EN 15459 combobox, 500ms autosave
- Interactive results dashboard with KPI cards, 3 Recharts chart types, 3-variant side-by-side comparison
- PDF (react-pdf) and Excel (ExcelJS) export with immutable ResultSnapshot for reproducibility
- 152 engine tests covering all modules, formula mode verification, and edge cases

### What Worked
- **Bottom-up dependency chain**: scaffolding → audit → schema → engine → tests → seed → API → UI → export. Each phase consumed the previous one's outputs cleanly
- **GSD YOLO mode**: 26 plans auto-executed across 11 phases in 3 days. Zero manual approval gates needed
- **Engine-first architecture**: Building the pure calculation engine before any API/UI meant the hardest component was validated earliest
- **Golden dataset approach**: Extracting expected values from Excel for integration tests caught formula mismatches immediately
- **discuss-phase workflow**: Context gathering before planning eliminated ambiguity — decisions were locked before any agent started coding
- **Auto-advance pipeline**: discuss → plan → execute chaining kept momentum without context-switching

### What Was Inefficient
- **Missing GSD tracking files for phases 4/5**: Early phases pre-dated the full tracking workflow, creating false "missing VERIFICATION.md" alerts during audit
- **Phase 7 ROADMAP inconsistency**: Phase 7 was marked `[ ]` unchecked in roadmap despite being complete — caught during audit
- **Phase 8 plan checkboxes**: Plans 08-01 through 08-05 stayed unchecked in ROADMAP.md despite all being executed — not caught until audit
- **Summary one_liner field**: No SUMMARY.md files had one_liner populated, making automated accomplishment extraction fail
- **Gap closure cycle**: Audit found 4 partial requirements requiring 2 extra phases (10-11) — could have been caught earlier with inline verification

### Patterns Established
- `_shared.ts` for cross-router utilities (d(), resolveDetailCost(), buildVariantInput())
- `validateVariantInput` at tRPC boundary before engine invocation
- URL search param `?v=VARIANT_ID` for active variant (stateless, deep-linkable)
- `key={activeVariantId}` on children wrapper to force remount on variant switch
- Separate `useAutosave` hooks per form section feeding same `SaveStatusProvider`
- `useQueries` for parallel variant calculation (max 3 variants)
- Hex colors for chart SVG rendering (oklch not supported by librsvg)

### Key Lessons
1. **Verify phase artifacts inline**: Don't wait for milestone audit to check VERIFICATION.md exists — verify during execute-phase
2. **ROADMAP checkbox automation**: Phase completion should auto-update roadmap checkboxes — manual updates are error-prone
3. **Golden dataset is the anchor**: For any domain with a reference implementation, extract expected outputs first and test against them
4. **Prisma Decimal ↔ JS number boundary**: Always use a conversion helper (d()) at the tRPC layer — never let Decimal objects leak into engine functions
5. **shadcn/ui component API varies by base**: base-nova uses render props (not asChild), Accordion uses `multiple` boolean (not type="multiple"), Select returns string|null

### Cost Observations
- Model mix: ~60% opus, ~30% sonnet, ~10% haiku (via GSD agent spawning)
- Sessions: ~8 across 3 days
- Notable: Average plan execution was 7 minutes; Phase 8 (UI) was the slowest at 13 min/plan due to complex form logic

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~8 | 11 | Full GSD YOLO pipeline: discuss → plan → execute → verify → audit |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 152 | Engine 100%, API/UI untested | 0 unnecessary deps |

### Top Lessons (Verified Across Milestones)

1. Engine-first architecture with golden dataset validation catches formula errors before they propagate to UI
2. GSD YOLO mode is effective for well-scoped milestones with clear requirements — 26 plans in 3 days
