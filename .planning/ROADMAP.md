# Roadmap: LCCzero

## Milestones

- v1.0 **LCCzero Calculator** -- Phases 1-11 (shipped 2026-03-28)
- v1.1 **Local Dev Operativo** -- Phases 12-15 (shipped 2026-03-28)

## Phases

<details>
<summary>v1.0 LCCzero Calculator (Phases 1-11) -- SHIPPED 2026-03-28</summary>

- [x] Phase 1: Project Scaffolding (2/2 plans) -- completed 2026-03-26
- [x] Phase 2: Excel Workbook Audit (2/2 plans) -- completed 2026-03-26
- [x] Phase 3: Schema, Types & Constants (2/2 plans) -- completed 2026-03-26
- [x] Phase 4: Calculation Engine (4/4 plans) -- completed 2026-03-26
- [x] Phase 5: Engine Tests (2/2 plans) -- completed 2026-03-26
- [x] Phase 6: Database Seed (1/1 plan) -- completed 2026-03-26
- [x] Phase 7: tRPC API & Authentication (3/3 plans) -- completed 2026-03-27
- [x] Phase 8: UI Implementation (5/5 plans) -- completed 2026-03-27
- [x] Phase 9: Export (2/2 plans) -- completed 2026-03-28
- [x] Phase 10: Variant Creation UI (1/1 plan) -- completed 2026-03-28
- [x] Phase 11: Test & Code Quality Cleanup (2/2 plans) -- completed 2026-03-28

**Full archive:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>v1.1 Local Dev Operativo (Phases 12-15) -- SHIPPED 2026-03-28</summary>

- [x] Phase 12: Docker + Environment Setup (2/2 plans) -- completed 2026-03-28
- [x] Phase 13: Database + Smoke Test (2/2 plans) -- completed 2026-03-28
- [x] Phase 14: E2E Verification + Tech Debt (2/2 plans) -- completed 2026-03-28
- [x] Phase 15: Documentation (1/1 plan) -- completed 2026-03-28

**Full archive:** [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

### v1.2 Gap Analysis Fixes

**Milestone Goal:** Close confirmed gaps found during Excel workbook audit -- expose missing UI for existing schema fields and fix misplaced form sections.

- [ ] **Phase 16: Gap Analysis Fixes** - Add stakeholderRole dropdown to WLC form, move MaintenanceConfig from Energy to Construction form

## Phase Details

### Phase 16: Gap Analysis Fixes
**Goal**: All confirmed UX gaps from the Excel workbook audit are closed -- stakeholderRole is editable, maintenance config is on the construction page
**Depends on**: Phase 15 (v1.1 complete)
**Requirements**: GAP-01, GAP-02
**Success Criteria** (what must be TRUE):
  1. WLC form shows a "Stakeholder Role" dropdown (Owner / Tenant / Third Party) in the Boundary Conditions section, and the selection persists after page reload
  2. MaintenanceConfig slider no longer appears on the Energy form
  3. MaintenanceConfig slider appears on the Construction form and saves correctly via the existing `upsertMaintenanceConfig` tRPC mutation
  4. `npm run build` passes with no TypeScript errors
**Plans**: 2 plans
Plans:
- [ ] 16-01-PLAN.md -- Add stakeholderRole dropdown to WLC Boundary Conditions
- [ ] 16-02-PLAN.md -- Move MaintenanceConfig from Energy form to Construction form

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffolding | v1.0 | 2/2 | Complete | 2026-03-26 |
| 2. Excel Workbook Audit | v1.0 | 2/2 | Complete | 2026-03-26 |
| 3. Schema, Types & Constants | v1.0 | 2/2 | Complete | 2026-03-26 |
| 4. Calculation Engine | v1.0 | 4/4 | Complete | 2026-03-26 |
| 5. Engine Tests | v1.0 | 2/2 | Complete | 2026-03-26 |
| 6. Database Seed | v1.0 | 1/1 | Complete | 2026-03-26 |
| 7. tRPC API & Authentication | v1.0 | 3/3 | Complete | 2026-03-27 |
| 8. UI Implementation | v1.0 | 5/5 | Complete | 2026-03-27 |
| 9. Export | v1.0 | 2/2 | Complete | 2026-03-28 |
| 10. Variant Creation UI | v1.0 | 1/1 | Complete | 2026-03-28 |
| 11. Test & Code Quality Cleanup | v1.0 | 2/2 | Complete | 2026-03-28 |
| 12. Docker + Environment Setup | v1.1 | 2/2 | Complete | 2026-03-28 |
| 13. Database + Smoke Test | v1.1 | 2/2 | Complete | 2026-03-28 |
| 14. E2E Verification + Tech Debt | v1.1 | 2/2 | Complete | 2026-03-28 |
| 15. Documentation | v1.1 | 1/1 | Complete | 2026-03-28 |
| 16. Gap Analysis Fixes | v1.2 | 0/2 | Planned | - |

---
*Last updated: 2026-03-28 after v1.1 milestone complete*
