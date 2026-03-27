---
phase: 08-ui-implementation
plan: 01
subsystem: ui
tags: [next-themes, react-hook-form, zod, better-auth, shadcn-sidebar, base-ui, glass-morphism]

requires:
  - phase: 07-trpc-api-authentication
    provides: tRPC project router, Better Auth client, middleware for route protection
provides:
  - Two-layout architecture: (auth) centered, (app) sidebar
  - Login and register pages connected to Better Auth
  - Responsive sidebar with project list from tRPC
  - Project list page with create dialog
  - ThemeProvider with system dark mode preference
  - EURAC brand colors and glass morphism styling
affects: [08-02, 08-03, 08-04, 08-05]

tech-stack:
  added: [next-themes, shadcn-sidebar, shadcn-accordion, shadcn-command, shadcn-popover, shadcn-scroll-area]
  patterns: [base-ui render prop (not asChild), react-hook-form + zod v4 blur validation, GlassCard composition]

key-files:
  created:
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/projects/page.tsx
    - src/components/project/project-sidebar.tsx
  modified:
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/page.tsx

key-decisions:
  - "base-ui render prop pattern instead of Radix asChild for slot composition in base-nova shadcn"
  - "Zod v4 with string-based constructionYear to avoid z.coerce type mismatch with react-hook-form"
  - "Dark mode primary keeps EURAC red (oklch 0.55) instead of neutral gray for brand consistency"

patterns-established:
  - "base-ui render prop: use render={<Link href='...' />} instead of asChild for SidebarMenuButton, DialogTrigger, etc."
  - "Form pattern: react-hook-form + zodResolver + mode:onBlur + inline error display for auth forms"
  - "Create dialog pattern: Dialog with form, Select for enum fields, mutation with queryClient invalidation"

requirements-completed: [UI-01, UI-02, UI-03]

duration: 18min
completed: 2026-03-27
---

# Phase 8 Plan 1: Application Shell Summary

**Two-layout app shell with login/register auth pages, collapsible sidebar with project list, and create project dialog using EURAC glass morphism design**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-27T12:12:39Z
- **Completed:** 2026-03-27T12:30:31Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Auth route group with centered login/register forms connected to Better Auth client
- App route group with collapsible sidebar showing project list from tRPC, user menu with sign-out
- Project list page with grid cards, empty state, and create dialog (name/city/buildingUse/year)
- ThemeProvider with system dark mode, distinct chart color tokens, Toaster integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components and update root layout with ThemeProvider** - `e01e444` (feat) -- committed in prior session as part of 08-02 wave
2. **Task 2: Auth pages (login, register) with (auth) route group layout** - `2213525` (feat)
3. **Task 3: App layout with responsive sidebar, project list page, and user menu** - `43557bd` (feat)

## Files Created/Modified
- `src/app/(auth)/layout.tsx` - Centered layout for auth pages
- `src/app/(auth)/login/page.tsx` - Login form with email/password, Better Auth signIn
- `src/app/(auth)/register/page.tsx` - Register form with name/email/password/confirm, auto-login
- `src/app/(app)/layout.tsx` - SidebarProvider + ProjectSidebar + header with trigger
- `src/app/(app)/projects/page.tsx` - Project list grid with create dialog and empty state
- `src/components/project/project-sidebar.tsx` - Collapsible sidebar with project list and user menu
- `src/app/layout.tsx` - Added ThemeProvider, Toaster, suppressHydrationWarning
- `src/app/globals.css` - Chart colors changed from grayscale to distinct hues, dark mode primary to EURAC red
- `src/app/page.tsx` - Session-based redirect to /projects or /login

## Decisions Made
- Used base-ui `render` prop pattern instead of Radix `asChild` for all slot composition (DialogTrigger, SidebarMenuButton) since shadcn base-nova uses @base-ui/react
- Changed constructionYear to string type in form schema to avoid Zod v4 `z.coerce` type incompatibility with react-hook-form; conversion happens in onSubmit
- Kept EURAC red as primary in dark mode (oklch 0.55 0.18 27.5) instead of the default neutral gray for consistent brand identity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed prisma.config.ts type error**
- **Found during:** Task 1 (build verification)
- **Issue:** Pre-existing type error: `migrate` property not recognized by Prisma 7 defineConfig type
- **Fix:** Cast config object via `as Parameters<typeof defineConfig>[0]`
- **Files modified:** prisma.config.ts
- **Verification:** Build passes
- **Committed in:** e01e444 (prior session)

**2. [Rule 1 - Bug] Fixed Zod v4 + react-hook-form resolver type mismatch**
- **Found during:** Task 3 (create project form)
- **Issue:** `z.coerce.number()` produces input type `unknown` in Zod v4, incompatible with react-hook-form's resolver inference
- **Fix:** Changed constructionYear to `z.string().optional()` with manual parseInt in onSubmit
- **Files modified:** src/app/(app)/projects/page.tsx
- **Verification:** Build passes, form submits correctly

**3. [Rule 1 - Bug] Replaced asChild with render prop for base-ui components**
- **Found during:** Task 3 (DialogTrigger, SidebarMenuButton)
- **Issue:** base-nova shadcn components use @base-ui/react which doesn't support Radix-style `asChild` prop
- **Fix:** Switched to `render={<Component />}` pattern throughout sidebar and dialog
- **Files modified:** src/components/project/project-sidebar.tsx, src/app/(app)/projects/page.tsx
- **Verification:** Build passes, all components compile

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for build correctness. No scope creep.

## Issues Encountered
- Task 1 was already committed in a prior session (e01e444) as part of 08-02 work; no duplicate commit needed

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth and app layouts established, ready for wizard navigation (08-02)
- Sidebar and project CRUD working, ready for project detail pages
- Glass morphism and dark mode active across all pages

## Self-Check: PASSED

All 9 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 08-ui-implementation*
*Completed: 2026-03-27*
