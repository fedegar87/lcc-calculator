@echo off
title LCCzero - Dev Environment
echo ============================================
echo   LCCzero - Development Environment Setup
echo ============================================
echo.

:: Prerequisites check
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found in PATH. Install Docker Desktop and try again.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH. Install Node.js and try again.
    pause
    exit /b 1
)

:: Ensure .env exists
if not exist ".env" (
    echo [*] .env not found. Copying from .env.example...
    copy .env.example .env >nul
    echo [*] .env created with default values.
    echo.
)

:: Start PostgreSQL
echo [1/5] Starting PostgreSQL...
docker compose up -d
if errorlevel 1 (
    echo [ERROR] docker compose up failed. Is Docker Desktop running?
    pause
    exit /b 1
)
echo       PostgreSQL running on localhost:5432
echo.

:: Wait for PostgreSQL to accept connections
echo [*] Waiting for PostgreSQL to be ready...
:wait_loop
docker compose exec -T postgres pg_isready -U lccuser >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)
echo       PostgreSQL is ready.
echo.

:: Generate Prisma Client
echo [2/5] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] prisma generate failed.
    pause
    exit /b 1
)
echo.

:: Run migrations
echo [3/5] Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] prisma migrate deploy failed.
    pause
    exit /b 1
)
echo.

:: Seed database
echo [4/5] Seeding database...
call npx prisma db seed
if errorlevel 1 (
    echo [ERROR] prisma db seed failed.
    pause
    exit /b 1
)
echo.

:: Start dev server
echo [5/5] Starting dev server...
echo       Open http://localhost:3000 in your browser
echo.
call npm run dev
