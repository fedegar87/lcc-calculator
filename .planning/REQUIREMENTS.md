# Requirements: LCCzero

**Defined:** 2026-03-28
**Core Value:** Accurate, standards-compliant LCC calculations that replicate the verified Excel workbook behavior while fixing known bugs and adding residual value + income analysis.

## v1.2 Requirements

Close confirmed UX gaps from the Excel workbook audit.

### Gap Analysis

- [x] **GAP-01**: WLC form shows a "Stakeholder Role" dropdown (Owner / Tenant / Third Party) in Boundary Conditions, persists via upsertBoundaryCondition
- [x] **GAP-02**: MaintenanceConfig slider moved from Energy form to Construction form, saves via upsertMaintenanceConfig

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Analysis

- **EXT-01**: Sensitivity analysis (OAT) for discount rate, energy prices, maintenance %
- **EXT-02**: Tornado chart showing parameter sensitivity impact

### Collaboration

- **COLLAB-01**: Project templates with pre-filled sample data
- **COLLAB-02**: CSV import for batch cost data entry

### Internationalization

- **I18N-01**: Multi-language support (EN, DE, IT)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud deployment (Vercel, Docker production) | v1.1 is local dev only; deploy is a separate milestone |
| CI/CD pipeline (GitHub Actions, GitLab CI) | Not needed for local dev operativo |
| Connection pooling (PgBouncer) | Single-user local dev doesn't need pooling |
| Wiring orphaned procedures to UI | Would require new UI components; document-only for v1.1 |
| Linux/Mac run scripts | Windows is the primary dev environment; README covers cross-platform |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAP-01 | Phase 16 | Complete |
| GAP-02 | Phase 16 | Complete |

**Coverage:**
- v1.2 requirements: 2 total
- Complete: 2
- Pending: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after Phase 16 -- v1.2 shipped*
