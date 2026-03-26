# Architecture Research

**Domain:** Financial/engineering calculator web application (nZEB Life-Cycle Cost analysis)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Wizard Steps │  │   Results    │  │   Variant    │  │   Export   │  │
│  │ (5 forms)    │  │   Dashboard  │  │  Comparison  │  │  (PDF/XLS) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                │         │
│  ┌──────┴─────────────────┴─────────────────┴────────────────┴──────┐  │
│  │              Form State Manager (React Context / Zustand)        │  │
│  │              + Autosave Debounce + Validation (Zod)              │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
├─────────────────────────────┼───────────────────────────────────────────┤
│                         API LAYER                                       │
│  ┌──────────────────────────┴───────────────────────────────────────┐  │
│  │                    tRPC Router (type-safe RPC)                    │  │
│  │  project.* │ variant.* │ calculation.* │ export.* │ auth.*       │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
├─────────────────────────────┼───────────────────────────────────────────┤
│                      SERVICE / ORCHESTRATION LAYER                      │
│  ┌──────────────┐  ┌───────┴──────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Project     │  │ Calculation  │  │   Export      │  │   Auth     │ │
│  │  Service     │  │ Orchestrator │  │   Service     │  │  Service   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │                │        │
├─────────┼─────────────────┼─────────────────┼────────────────┼────────┤
│         │          PURE CALCULATION ENGINE (no side effects)  │        │
│         │          ┌──────┴───────────────────┐               │        │
│         │          │  ┌─────────┐ ┌─────────┐ │               │        │
│         │          │  │Discount │ │ Energy  │ │               │        │
│         │          │  │ (FIN-*) │ │ (NRG-*) │ │               │        │
│         │          │  ├─────────┤ ├─────────┤ │               │        │
│         │          │  │Maint.   │ │Residual │ │               │        │
│         │          │  │(MNT-*)  │ │(RES-*)  │ │               │        │
│         │          │  ├─────────┤ ├─────────┤ │               │        │
│         │          │  │Income   │ │ Aggreg. │ │               │        │
│         │          │  │(INC-*)  │ │(AGG-*)  │ │               │        │
│         │          │  └─────────┘ └─────────┘ │               │        │
│         │          │  Pure functions, JS number│               │        │
│         │          │  Deterministic, testable  │               │        │
│         │          └──────────────────────────┘               │        │
│         │                                                     │        │
├─────────┼─────────────────────────────────────────────────────┼────────┤
│                         DATA LAYER                                      │
│  ┌──────┴───────────────────────────────────────────────────────────┐  │
│  │                Prisma ORM (Decimal types for storage)            │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│  ┌──────────────────────────┴───────────────────────────────────────┐  │
│  │                     PostgreSQL Database                          │  │
│  │  Projects │ Variants │ InputSets │ ResultSnapshots │ Users       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Wizard Steps (UI) | Collect user inputs across 5 steps (Info, WLC, Construction, Energy, Results) | Form State Manager, tRPC API |
| Results Dashboard (UI) | Display KPIs, charts (Recharts), cost breakdowns | tRPC API (read-only) |
| Variant Comparison (UI) | Side-by-side rendering of BASE + 2 variants | tRPC API (read-only) |
| Export Module (UI) | Trigger and download PDF/Excel exports | tRPC API (export.*) |
| Form State Manager | Client-side state, validation, autosave debounce | Wizard Steps, tRPC API |
| tRPC Router | Type-safe API boundary, input validation (Zod) | Services, Auth middleware |
| Calculation Orchestrator | Load inputs from DB, call engine, store results | Prisma (read inputs), Calculation Engine (call), Prisma (write results) |
| Calculation Engine | Pure LCC math: discount, energy, maintenance, residual, income, aggregation | Nothing (pure functions, no dependencies) |
| Export Service | Generate PDF (jsPDF/react-pdf) and Excel (SheetJS) from ResultSnapshot | Prisma (read snapshot) |
| Project Service | CRUD for projects, variants, sharing permissions | Prisma |
| Auth Service | Authentication, session management | Auth.js, Prisma |
| Prisma ORM | Type-safe DB access, Decimal type conversion at boundary | PostgreSQL |
| PostgreSQL | Persistent storage with Decimal precision | Prisma ORM |

## Recommended Project Structure

```
src/
├── engine/                    # Pure calculation engine (zero dependencies)
│   ├── discount.ts            # FIN-* formulas: present value, discount factors
│   ├── energy.ts              # NRG-* formulas: energy cost calculations
│   ├── maintenance.ts         # MNT-* formulas: maintenance + replacement cycles
│   ├── residual.ts            # RES-* formulas: residual value (METHOD_IMPROVEMENT)
│   ├── income.ts              # INC-* formulas: income/NPV/payback (METHOD_IMPROVEMENT)
│   ├── aggregation.ts         # AGG-* formulas: LCC, WLC, KPI rollups
│   ├── types.ts               # Input/output interfaces for engine
│   ├── constants.ts           # EN 15459 lookup table, default parameters
│   └── index.ts               # Public API barrel export
├── server/
│   ├── routers/               # tRPC routers
│   │   ├── project.ts         # Project CRUD + sharing
│   │   ├── variant.ts         # Variant management
│   │   ├── calculation.ts     # Trigger calculations, return results
│   │   ├── export.ts          # PDF/Excel generation
│   │   └── auth.ts            # Auth procedures
│   ├── services/              # Business logic (orchestration layer)
│   │   ├── calculation.ts     # Orchestrator: load → compute → store
│   │   ├── export.ts          # Snapshot creation + file generation
│   │   └── project.ts         # Project business rules
│   ├── trpc.ts                # tRPC initialization + context
│   └── root.ts                # Root router
├── app/                       # Next.js App Router pages
│   ├── (auth)/                # Login, register
│   ├── dashboard/             # Project list
│   └── project/[id]/          # Wizard + results
│       ├── info/              # Step 1: Project info
│       ├── wlc/               # Step 2: WLC parameters
│       ├── construction/      # Step 3: Construction costs
│       ├── energy/            # Step 4: Energy parameters
│       └── results/           # Step 5: Results + charts
├── components/
│   ├── wizard/                # Wizard navigation, step container
│   ├── forms/                 # Form components per step
│   ├── charts/                # Recharts wrappers
│   ├── comparison/            # Variant comparison layout
│   ├── export/                # Export triggers
│   └── ui/                    # shadcn/ui primitives
├── lib/
│   ├── validators/            # Zod schemas (shared client+server)
│   ├── hooks/                 # Custom React hooks (autosave, etc.)
│   └── utils.ts               # Shared utilities
└── prisma/
    ├── schema.prisma          # Database schema (Decimal fields)
    └── seed.ts                # EN 15459 lookup data seed
```

### Structure Rationale

- **engine/:** Isolated at the top level (not inside `server/`) because it has zero dependencies on Node.js, Prisma, or Next.js. Can be tested with pure unit tests, imported by server or even by a future CLI tool. This is the "functional core."
- **server/routers/:** tRPC routers are thin -- they validate input (Zod), call services, return results. No business logic in routers.
- **server/services/:** The "imperative shell" that orchestrates side effects: read from DB, call engine, write results. This is where Prisma Decimal-to-JS-number conversion happens.
- **app/:** Next.js App Router pages. Each wizard step is a route segment for URL persistence and back-button support.
- **components/:** Reusable UI pieces. Wizard components are separated from form components to keep each file focused.
- **lib/validators/:** Zod schemas shared between client (form validation) and server (tRPC input validation) to guarantee consistency.

## Architectural Patterns

### Pattern 1: Functional Core, Imperative Shell

**What:** All LCC calculation logic lives in pure functions (engine/) with no side effects. The imperative shell (server/services/) handles DB reads, engine invocation, and DB writes.
**When to use:** Always -- this is the fundamental architecture constraint for this project.
**Trade-offs:** Requires explicit conversion at the boundary (Prisma Decimal to JS number and back). Adds a mapping layer. But makes the engine independently testable and deterministic.

**Example:**
```typescript
// engine/discount.ts -- PURE, no imports from server/prisma/next
export function presentValue(
  futureValue: number,
  discountRate: number,
  year: number
): number {
  return futureValue / Math.pow(1 + discountRate, year);
}

// server/services/calculation.ts -- IMPERATIVE SHELL
async function calculateLCC(projectId: string, variantId: string) {
  // 1. Read from DB (side effect)
  const inputs = await prisma.inputSet.findUnique({ where: { variantId } });

  // 2. Convert Decimal → number at boundary
  const engineInput = mapPrismaToEngineInput(inputs);

  // 3. Call pure engine (no side effects)
  const result = computeLCC(engineInput);

  // 4. Write results to DB (side effect)
  await prisma.resultSnapshot.create({
    data: mapEngineResultToPrisma(result, { engineVersion, formulaMode, inputHash }),
  });
}
```

### Pattern 2: Wizard State with Server-Persisted Steps

**What:** Each wizard step corresponds to a URL route. Form state is managed client-side (React Hook Form + Zod) with debounced autosave that persists to the server via tRPC mutations. Navigation between steps does not lose data.
**When to use:** For the 5-step data entry wizard.
**Trade-offs:** More complex than a single-page form, but essential for the UX requirement of preserving progress and supporting browser back/forward. Autosave adds network calls but prevents data loss.

**Example:**
```typescript
// Autosave hook pattern
function useAutosave<T>(data: T, saveFn: (data: T) => Promise<void>, delayMs = 2000) {
  const debouncedSave = useDebouncedCallback(saveFn, delayMs);
  useEffect(() => {
    debouncedSave(data);
  }, [data]);
}
```

### Pattern 3: Immutable Result Snapshots for Export

**What:** When a user triggers an export (PDF or Excel), the system creates an immutable ResultSnapshot that captures: all calculated results, engine version, formula mode (excel_replica vs excel_bugfixed), and an input hash. The export is generated from this snapshot, not from live data.
**When to use:** Every export operation.
**Trade-offs:** Consumes more storage (snapshots accumulate), but guarantees reproducibility. A report generated today produces identical output if re-downloaded later, even if the user has since modified inputs.

## Data Flow

### Primary Calculation Flow

```
[User edits form in Wizard Step]
    |
    v
[React Hook Form + Zod validation (client)]
    |
    v
[Autosave debounce (2s)]
    |
    v
[tRPC mutation: variant.updateInputs]
    |
    v
[Prisma: write InputSet to PostgreSQL (Decimal)]
    |
    v (on "Calculate" or step 5 navigation)
[tRPC mutation: calculation.compute]
    |
    v
[Calculation Orchestrator (service)]
    |--- Read: prisma.inputSet → Decimal → JS number
    |--- Call: engine.computeLCC(inputs) → pure result
    |--- Write: prisma.resultSnapshot.create(result) → JS number → Decimal
    |
    v
[tRPC query: calculation.getResults]
    |
    v
[Results Dashboard renders charts + KPIs]
```

### Variant Comparison Flow

```
[User views Results step with variants enabled]
    |
    v
[tRPC query: calculation.getVariantComparison(projectId)]
    |
    v
[Service loads ResultSnapshots for BASE + VARIANT_1 + VARIANT_2]
    |
    v
[Returns structured comparison object with aligned cost categories]
    |
    v
[Comparison UI renders 3 columns side-by-side]
```

### Export Flow

```
[User clicks "Export PDF" or "Export Excel"]
    |
    v
[tRPC mutation: export.generate({ projectId, format, variantIds })]
    |
    v
[Export Service]
    |--- Read latest ResultSnapshot per variant
    |--- Create immutable ExportRecord (snapshot + metadata)
    |--- Generate file:
    |      PDF: jsPDF/react-pdf with branded template
    |      Excel: SheetJS with structured worksheets
    |--- Return file URL or base64
    |
    v
[Client downloads file]
```

### Key Data Flows

1. **Input persistence:** User types in form -> Zod validates client-side -> debounced tRPC mutation -> Prisma writes Decimal to PostgreSQL. Data is never lost because autosave persists every change.
2. **Calculation trigger:** Explicit user action (or automatic on Results step) -> orchestrator reads inputs as Decimal, converts to JS number, runs pure engine, converts results back to Decimal, writes snapshot.
3. **Precision boundary:** JS `number` (IEEE 754) is used exclusively inside the engine. Prisma `Decimal` is used exclusively in the database. Conversion happens in the service layer at two points: read (Decimal->number) and write (number->Decimal).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | Monolith is perfect. Single Next.js server, single PostgreSQL instance. This is the expected scale for an academic research tool. |
| 100-1k users | Add connection pooling (PgBouncer). Consider moving PDF/Excel generation to a background job queue (Bull/BullMQ) if exports are slow. |
| 1k+ users | Unlikely for this domain. If needed: separate the calculation service, add Redis caching for repeated calculations with same input hash. |

### Scaling Priorities

1. **First bottleneck:** PDF/Excel generation is CPU-intensive and synchronous. If multiple users export simultaneously, it blocks the event loop. Solution: move to a worker thread or background queue.
2. **Second bottleneck:** Complex LCC calculations with 40-year time horizons and 3 variants are pure math -- fast in JS but could be parallelized per variant if needed.

## Anti-Patterns

### Anti-Pattern 1: Calculation Logic in API Routes

**What people do:** Put LCC formulas directly in tRPC procedures or Next.js API routes, mixed with database queries and response formatting.
**Why it's wrong:** Makes calculations untestable without a running server + database. Breaks determinism (database state affects calculation). Makes formula auditing impossible (auditors need to trace ISO 15686-5 formulas, not database queries).
**Do this instead:** Engine functions are pure, take plain objects, return plain objects. Zero imports from Prisma, tRPC, or Next.js.

### Anti-Pattern 2: Floating-Point Accumulation in Database

**What people do:** Store financial results as `Float` in PostgreSQL, accumulate rounding errors across 40 years of cost projections.
**Why it's wrong:** LCC calculations involve summing hundreds of present-value terms. Float accumulation can drift significantly over a 40-year reference period, producing audit-failing discrepancies.
**Do this instead:** Store as Prisma `Decimal` (maps to PostgreSQL `NUMERIC`). Accept JS `number` precision inside the engine (sufficient for individual calculations per DEC-001), but prevent accumulation across database writes.

### Anti-Pattern 3: Mutable Results

**What people do:** Store calculation results in a single mutable row that gets overwritten on each recalculation, then generate exports from live data.
**Why it's wrong:** Export reproducibility is impossible. A PDF generated last week cannot be regenerated because the inputs and/or results have changed. This is a compliance risk for ISO-standards-based tools.
**Do this instead:** Create immutable ResultSnapshots with engine version, formula mode, and input hash. Exports reference a specific snapshot. Old snapshots are never modified.

### Anti-Pattern 4: Fat Wizard Steps

**What people do:** Put all 5 steps of a wizard in a single component with conditional rendering, managing all form state in one massive object.
**Why it's wrong:** Slow initial render, complex validation logic, impossible to deep-link to a specific step, browser back/forward breaks.
**Do this instead:** Each step is a route segment (`/project/[id]/info`, `/project/[id]/wlc`, etc.). Each step manages its own form state with its own Zod schema. A shared wizard shell provides navigation and progress indication.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Auth.js | Middleware + session provider | Handles email/password auth. Session token in cookie. tRPC context reads session. |
| PostgreSQL | Prisma ORM with connection pooling | All DB access goes through Prisma. No raw SQL unless for migrations. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI <-> API | tRPC (type-safe, end-to-end) | Zod schemas validate both client and server side. No REST endpoints. |
| API <-> Engine | Direct function call (import) | Service imports engine functions. No serialization needed. Engine receives plain TS interfaces. |
| API <-> Database | Prisma Client | Decimal conversion happens in service layer, not in engine or UI. |
| Engine <-> Nothing | No communication | Engine is fully isolated. It does not import anything from server, database, or UI. |

## Build Order (Dependencies)

The component dependency graph dictates build order:

```
Phase 1: Engine (zero dependencies, testable immediately)
    |
Phase 2: Database Schema + Prisma (engine types inform schema)
    |
Phase 3: tRPC API + Services (depends on engine + Prisma)
    |
Phase 4: Auth (depends on Prisma for user storage, tRPC for middleware)
    |
Phase 5: Wizard UI (depends on tRPC API for data flow)
    |
Phase 6: Results + Charts (depends on calculation API returning data)
    |
Phase 7: Variant Comparison (depends on results for multiple variants)
    |
Phase 8: Export (depends on ResultSnapshot existing)
    |
Phase 9: Polish (glass morphism, accessibility, sharing permissions)
```

**Rationale:** The engine has no dependencies, so it can be built and fully tested first. Everything else depends on it. Database schema is informed by engine types. API layer bridges engine and UI. UI features build on API availability in increasing complexity order.

## Sources

- [NIST Building Life Cycle Cost Programs](https://www.nist.gov/services-resources/software/building-life-cycle-cost-programs) -- reference LCC calculator architecture
- [Functional Core, Imperative Shell pattern](https://kennethlange.com/functional-core-imperative-shell/) -- architectural pattern for pure calculation engines
- [TypeScript Functional Core, Imperative Shell demo](https://github.com/kenneth-lange/ts-functional-core-imperative-shell) -- TypeScript implementation reference
- [Building a Type-Safe Money Handling Library in TypeScript](https://dev.to/thesmilingsloth/building-a-type-safe-money-handling-library-in-typescript-3o44) -- decimal precision patterns
- [Life-Cycle Cost Analysis (LCCA)](https://www.wbdg.org/resources/life-cycle-cost-analysis-lcca) -- domain reference for LCC component structure
- [tRPC + Next.js + Prisma starter](https://github.com/trpc/examples-next-prisma-starter) -- reference architecture for the chosen stack
- [Why Pure Functions Are the Secret Weapon of Scalable Code](https://dev.to/arkhan/why-pure-functions-are-the-secret-weapon-of-scalable-code-in-2025-4h41) -- pure function architecture rationale

---
*Architecture research for: nZEB Life-Cycle Cost analysis web application*
*Researched: 2026-03-26*
