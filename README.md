# LCCzero

LCCzero is a Life Cycle Cost calculator for buildings, replacing the CRAVEzero Excel workbook with a modern web application built on Next.js.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- npm >= 10 (included with Node.js)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (provides Docker Compose for PostgreSQL)

## Quickstart

### 1. Clone the repository

```bash
git clone https://gitlab.inf.unibz.it/Federico.Garzia/lcc-calculator.git
cd lcc-calculator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

The defaults work out of the box with the Docker setup. No changes needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://lccuser:lccpass@localhost:5432/lccdb?schema=public` | PostgreSQL connection (matches docker-compose.yml) |
| `BETTER_AUTH_SECRET` | `lcczero-dev-secret-do-not-use-in-production` | Auth session signing key |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Base URL for auth callbacks |
| `EXPORT_DIR` | `./exports` | Directory for generated exports |

### 4. Start PostgreSQL

```bash
docker compose up -d
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Run database migrations

```bash
npx prisma migrate deploy
```

### 7. Seed demo data

```bash
npx prisma db seed
```

### 8. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the login page.

## Demo Credentials

| Email | Password |
|-------|----------|
| `demo@lcczero.dev` | `demo123` |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once (CI) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create new migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Troubleshooting

### Docker not running

`docker compose up -d` fails with a connection error.

**Fix:** Install and start Docker Desktop, then retry the command.

### Port 5432 already in use

Another PostgreSQL instance is running on the same port.

**Fix:** Stop the other instance (`sudo systemctl stop postgresql` on Linux, or stop the service on Windows), or change the port in `docker-compose.yml` and update `DATABASE_URL` in `.env` to match.

### Prisma migration fails

Migration commands fail with a connection error.

**Fix:** Ensure PostgreSQL is healthy (`docker compose ps` should show status "running"). Verify `DATABASE_URL` in `.env` matches the credentials in `docker-compose.yml` (user: `lccuser`, password: `lccpass`, database: `lccdb`).

### Auth redirect issues

Login or registration redirects to the wrong URL.

**Fix:** Verify `BETTER_AUTH_URL` in `.env` matches the dev server port. The default is `http://localhost:3000`.

## Sensitivity analysis

Every project gets a **Sensitivity** tab in the results page implementing
the methodology from Pernetti, Garzia & Filippi Oberegger (2021,
*Sustainable Cities and Society* 74, 103139). Two methods, paper-faithful:

- **DSA — Differential Sensitivity Analysis.** One-click "paper top-4" run
  (interest rate, building-element maintenance %, HVAC maintenance multiplier,
  structural construction cost). Tornado plot ranked by sensitivity index
  `s = (ΔO/O_b) / (ΔI/I_b)`. ~33 engine evaluations, < 500 ms.
- **EE — Elementary Effects** (Morris 1991 + Campolongo et al. 2007 screening,
  paper §2.2.3 variant). 10 000 candidate trajectories, 100 random samples of
  10, max-spread selection. Uses the paper's modified EE definition
  (Eq. 4: absolute Δ-LCC, not normalised). Outputs μ, μ\*, σ per parameter
  + box-plot LCC distribution (paper Fig. 5). `r·(n+1) ≈ 170` engine
  evaluations, reproducible under seed=42.

Every run is persisted as a `SensitivityRun` row with the resolved
parameter specs and a baseline LCC snapshot — runs are self-contained and
restorable from the history list without re-execution.

A regression test (`tests/engine/sensitivity-paper-replication.test.ts`)
runs DSA on a Väla Gård-like fixture and asserts the paper-consistent
top-3 ranking and LCC-variation envelope.

## Known Limitations

- **PDF/Excel export is disabled.** Recharts chart components use `React.createContext`, which is not available in React Server Components. This blocks server-side chart rendering required for PDF generation. A future migration to a server-compatible chart library will re-enable exports.
- **Sobol / LHS / Monte Carlo** are not implemented (Phase SA-3, deferred). EE box plot covers most uncertainty-quantification needs for the foreseeable future.
- **EPBD_2025 / Level(s)-50y method profiles** are metadata-only. The engine uses CRAVEzero defaults; switching profile is informational, not yet behavioural.
