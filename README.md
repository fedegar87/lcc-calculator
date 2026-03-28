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

## Known Limitations

- **PDF/Excel export is disabled.** Recharts chart components use `React.createContext`, which is not available in React Server Components. This blocks server-side chart rendering required for PDF generation. A future migration to a server-compatible chart library will re-enable exports.
