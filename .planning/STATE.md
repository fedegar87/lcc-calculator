---
gsd_state_version: 1.0
milestone: SA
milestone_name: Sensitivity Analysis (Pernetti et al. 2021)
status: shipped
last_updated: "2026-05-17T09:55:00.000Z"
progress:
  total_phases: 19
  completed_phases: 19
  total_plans: 39
  completed_plans: 37
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Accurate, standards-compliant LCC calculations that replicate verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis + sensitivity analysis per Pernetti et al. 2021.
**Current focus:** SA milestone shipped (DSA + Elementary Effects). Next candidate: v2.0 cash-flow ledger + EPBD_2025_DRAFT profile coding, gated on `[[decision-epbd-profile-gate]]` research-phase.

## Current Position

Phase: SA-2 (Elementary Effects) — SHIPPED
Status: SA milestone shipped on top of v1.3 reporting hygiene; 21 commits ahead of github/main not yet pushed.
Last activity: 2026-05-17 — SA milestone close-out hygiene sweep (run-history restore, print stylesheet, comparison view KPI table, onboarding sample badge)

Progress: [####################] 100% v1.0 | [####################] 100% v1.1 | [####################] 100% v1.2 | [####################] 100% v1.3 | [####################] 100% SA

## Performance Metrics

**Velocity (cumulative v1.0 → SA):**
- Total plans completed: 37
- Engine tests: 225 passing across 22 files
- New SA tests: 28 (rng, parameters, dsa, ee, sampling, paper-replication)

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table. SA-specific decisions:
- `[[decision-uncertainty-architecture]]` — profile `calculateLCC` first, worker_threads only if >50ms on large WBS (deferred pending benchmark)
- `[[decision-scenario-data-versioning]]` — paper Tables 2 & 3 are ground truth for SA bounds; live data sources (Eurostat / IEA WEO) require manual versioning, no scraping
- `[[decision-epbd-profile-gate]]` — EPBD_2025 profile coding blocked until research-phase extracts Reg. 2025/2273 annex requirements

### Pending Todos

None for SA milestone. Multi-day work explicitly carried forward:
- d3 migration of `chart-renderer.tsx` to re-enable PDF/Excel server-side export
- i18n full rollout (next-intl + IT/DE/EN)
- EPBD_2025_DRAFT profile coding (gated)
- Cash-flow ledger v2.0 (gated)
- Sobol / LHS / Monte Carlo (SA-3, gated on benchmark)
- methodProfile gate activation in `sensitivity.ts:148` (TODO inline, ships with method-profile UI)

### Blockers/Concerns

- E2E-04 (export) blocked by Recharts/RSC incompatibility — needs chart library migration (future work, tracked in `chart-renderer.tsx:15`)
- Migration `prisma/migrations/20260516210000_add_sensitivity_run/` written by hand (no shadow DB available); needs `npx prisma migrate deploy` against Render production before SA UI is usable in prod

## Session Continuity

Last session: 2026-05-17 — SA close-out hygiene sweep complete.
Stopped at: 27 commits ahead of github/main (v1.3 + SA-0/SA-1/SA-2 + close-out hygiene). Not yet pushed — user reviewing locally first.
Resume file: None
