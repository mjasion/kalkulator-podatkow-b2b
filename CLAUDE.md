# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Polish B2B Tax Optimizer & Forecaster** for sole proprietorships (JDG) targeting tax year 2026. The application helps users choose the optimal taxation form by analyzing historical data from InFakt and simulating investment scenarios, particularly focusing on the 2026 Polish tax law changes for vehicle depreciation limits.

## Architecture

### Full-Stack Edge Application
- **Platform**: Cloudflare Workers (serverless edge deployment)
- **Frontend**: React Router v7 with SSR enabled
- **Backend**: Hono (lightweight web framework)
- **Build System**: Vite with Cloudflare plugin
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **AI Integration**: Vercel AI SDK (optional, for InFakt analysis)

### Key Architectural Pattern

The application uses a **hybrid SSR/SPA architecture**:
1. **Workers Entry** (`workers/app.ts`): Hono app that handles all requests
2. **API Routes**: Define Hono routes BEFORE the catch-all React Router handler
3. **React Router SSR**: The `app.get("*")` handler delegates to React Router for rendering
4. **Route Configuration**: Routes defined in `app/routes.ts` using React Router's file-based routing

Example of how to add API endpoints:
```typescript
// In workers/app.ts, add BEFORE the app.get("*") handler:
app.post("/api/simulation/create", async (c) => {
  // Access Cloudflare bindings via c.env
  const db = c.env.DB; // D1 database
  // ... implementation
});
```

### Database Schema (D1)

The database includes five main tables:
- **`scenarios`**: Base configuration (UUID, VAT settings, ZUS type, taxation form, revenue, costs)
- **`investments`**: Planned purchases (equipment, cars) linked to scenarios
- **`car_details`**: Extended data for car-specific investments (engine type, leasing details)
- **`tax_year_configs`**: Global tax settings per year (2025-2028) with rates for ZUS, health insurance, wage bases
- **`contribution_configs`**: User-specific contribution preferences per year (ZUS type, optional custom base)

Default configurations are automatically inserted for years 2025-2028 during database migration. See `schema.sql` for complete schema definition.

### Tax Calculation Logic (Critical Implementation Notes)

**IMPORTANT**: The 2026 car depreciation calculator must use **strict TypeScript math** - do NOT delegate to AI/LLM for calculations.

**2026 Tax Deduction Limits (KUP - Koszt Uzyskania Przychodu)**:
- Combustion/Standard Hybrid: **100,000 PLN**
- Plugin Hybrid (Eco): **150,000 PLN**
- Electric: **225,000 PLN**

Leasing calculations:
- If `CarPrice > Limit`: Only `Limit / CarPrice` of capital installments are deductible
- Interest is 100% deductible (simplified for MVP)
- VAT: 50% deductible for mixed use, 100% for full business use
- Non-deductible VAT adds to gross value used in limit checks

**Three Tax Forms to Compare**:
1. **Ryczałt (Lump Sum)**: Revenue × rate (e.g., 12% for IT) - investments don't reduce tax, but ZUS and health insurance still apply
2. **Liniowy 19% (Linear)**: (Revenue - Costs - Amortization) × 19% - health insurance 4.9%, applies to all self-employed
3. **Skala (Progressive)**: 12%/32% brackets with 30k PLN tax-free allowance - health insurance 9%, most beneficial for high earners

**TaxYearConfig System**:
The application now supports configurable tax rates per year (2025-2028). Each tax year has:
- Minimum wage (wage base for ZUS calculations)
- Average wage prognosis
- ZUS contribution rates (retirement, disability, accident, sickness, work fund, solidarity)
- Health insurance rates per taxation form
- Health insurance thresholds per form
- These are fetched from `tax_year_configs` table and applied during calculations

## Common Commands

### Development
```bash
pnpm dev                 # Start local dev server with hot reload
pnpm build               # Build for production
pnpm preview             # Preview production build locally
pnpm typecheck           # Run TypeScript checks and generate types
```

### Cloudflare-Specific
```bash
pnpm cf-typegen          # Generate TypeScript types for Cloudflare bindings
pnpm deploy              # Build and deploy to Cloudflare Workers
wrangler dev             # Alternative dev server (use pnpm dev instead)
wrangler d1 execute DB --command "SELECT * FROM scenarios"  # Query D1 database
```

### Type Generation Workflow
When adding new Cloudflare bindings (D1, KV, R2, etc.) to `wrangler.jsonc`:
1. Run `pnpm cf-typegen` to generate types in `worker-configuration.d.ts`
2. Access bindings in Hono handlers via `c.env.BINDING_NAME`
3. Access in React Router loaders via `context.cloudflare.env.BINDING_NAME`

## File Structure

```
app/
├── routes/
│   ├── home.tsx                        # Landing page
│   ├── simulator.tsx                   # Main tax calculator (config → investments → results)
│   ├── tax-config.tsx                  # Tax year configuration page (/tax-config)
│   └── +types/                         # React Router type definitions
├── components/
│   ├── configuration-form.tsx          # Tax config form (revenue, ZUS type, VAT settings, year selector)
│   ├── car-investment-form.tsx         # Car purchase/leasing simulator
│   ├── equipment-investment-form.tsx   # Equipment investment form
│   ├── tax-comparison-chart.tsx        # Recharts visualization of tax results
│   └── history-sidebar.tsx             # Fixed sidebar with scenario history and navigation
├── db/
│   ├── schema.ts                       # Drizzle ORM schema (scenarios, investments, car_details, tax configs)
│   └── client.ts                       # Database client factory
├── lib/
│   ├── tax-calculator.ts               # Core tax calculation engine (3 forms, ZUS, health insurance)
│   ├── contribution-calculator.ts      # Standalone ZUS and health insurance calculator
│   └── infakt-tool.ts                  # AI SDK tool for InFakt API integration
├── routes.ts                           # Route configuration
├── root.tsx                            # Root layout component with sidebar
├── entry.server.tsx                    # SSR entry point
└── entry.client.tsx                    # Client-side entry point

workers/
└── app.ts                              # Hono backend with API endpoints (see API section)

schema.sql                              # D1 database schema with default 2025-2028 configs
drizzle.config.ts                       # Drizzle ORM configuration
wrangler.jsonc                          # Cloudflare Workers configuration (D1 binding)
vite.config.ts                          # Vite build configuration
react-router.config.ts                  # React Router SSR config (ssr: true)
```

## API Endpoints

### Simulation Management
- `POST /api/simulation/create` - Create new tax scenario with configuration (returns scenario UUID)
- `GET /api/simulation/:id` - Fetch scenario with all investments
- `GET /api/simulations` - List all scenarios (shareable via URL params)
- `POST /api/simulation/:id/investment` - Add car or equipment investment
- `POST /api/simulation/:id/calculate` - Calculate taxes for all 3 forms with optional `selectedTaxYear`

### Tax Configuration
- `GET /api/tax-config/:year` - Fetch tax configuration for specific year (2025-2028)
- `POST /api/tax-config` - Create or update tax year configuration

### AI Analysis (Optional)
- `POST /api/ai/analyze-infakt` - InFakt historical data analysis using Vercel AI SDK

## Development Workflow

### Adding a New API Endpoint
1. Edit `workers/app.ts`
2. Add route handlers BEFORE the `app.get("*")` React Router handler
3. Access database via D1 binding: `c.env.DB`
4. Return JSON responses using `c.json({ ... })`
5. Example:
   ```typescript
   app.post("/api/simulation/create", async (c) => {
     const db = c.env.DB;
     const data = await c.req.json();
     // Validate and insert into scenarios table
     return c.json({ id: scenarioId });
   });
   ```

### Adding a New Page/Route
1. Create file in `app/routes/` (e.g., `simulator.tsx`)
2. Add route to `app/routes.ts`
3. Use `loader` functions to fetch data from API or database
4. Pages automatically get fixed sidebar (ml-80 margin on main content)

### Calculating Taxes with Dynamic Year Config
1. Frontend sends `selectedTaxYear` to `POST /api/simulation/:id/calculate`
2. Backend fetches `TaxYearConfig` from database for that year
3. Pass config to calculation functions: `calculateRyczalt(scenario, investments, taxYearConfig)`
4. Functions use dynamic rates instead of hardcoded values

### Tax Year Configuration UI
1. Users access `/tax-config` page via sidebar button (⚙️ Składki)
2. Form allows editing all ZUS and health insurance rates for selected year
3. Changes are persisted via `POST /api/tax-config`
4. Next scenario calculations automatically use updated rates

### Sidebar Navigation
- **Fixed positioning**: Uses `fixed left-0 top-0 h-screen w-80` CSS classes
- **Shareable scenarios**: Each scenario has UUID-based URL with copy button
- **Quick access**: Links to `/simulator` (new sim) and `/tax-config` (settings)
- **Responsive**: Collapses to `w-16` on mobile, expands to `w-80` on desktop
- **Auto-load**: URL params `?scenario=UUID&calculate=true` auto-load and auto-calculate

### AI Integration Pattern (InFakt Analysis)
The InFakt API integration uses Vercel AI SDK with **tool calling**:
- Tool `fetchInFaktHistory(apiKey, year)` queries InFakt REST API
- LLM analyzes revenue trends and expense categorization
- Returns structured JSON forecast (not free-form text)
- See `TASK.md` section 4.1 for complete specification

## Important Constraints

- **No Authentication**: Simulations are stored by UUID (shareable links with `?scenario=UUID&calculate=true`)
- **Client-Side API Key Storage**: InFakt API keys stored in browser only (localStorage/sessionStorage)
- **Dark Mode First**: UI uses dark theme with Tailwind CSS (gray-950, gray-900, blue-600 accent colors)
- **Polish Language**: All UI labels, forms, and messages in Polish
- **Polish Tax Law 2025-2028**: Calculations reflect laws per selected tax year (configurable via `/tax-config`)
- **Strict Calculation Logic**: Car depreciation, ZUS, and tax math must be deterministic TypeScript (not LLM-generated)
- **Sidebar Fixed to Viewport**: Sidebar uses `fixed` positioning with `ml-80` margin on main content to prevent overlap during scrolling
- **Dynamic Tax Rates**: All ZUS and health insurance rates fetched from database per year, not hardcoded

## Debugging

- **Cloudflare Workers logs**: `wrangler tail` (after deployment)
- **Local dev server**: `pnpm dev` includes hot reload for frontend and backend
- **TypeScript errors**: `pnpm typecheck` for all compiler errors
- **D1 database inspection**:
  ```bash
  wrangler d1 execute "DB" --local --file schema.sql  # Initialize/migrate schema
  wrangler d1 execute "DB" --local --command "SELECT * FROM scenarios"  # Query data
  ```
- **Database reset** (if needed):
  ```bash
  rm -rf .wrangler/state/v3/d1/* && wrangler d1 execute "DB" --local --file schema.sql
  ```
- **Hot reload issues**: Kill dev server (`pnpm dev` Ctrl+C) and restart if changes don't reflect

## Phase 3 Integration Summary

This codebase implements Phase 3 of the tax calculator project:

1. **Tax Year Configuration System** (`tax_year_configs` table)
   - Supports years 2025-2028 with configurable ZUS and health insurance rates
   - Default configurations pre-populated during database migration
   - User-accessible via `/tax-config` page

2. **Scenario Persistence** (D1 Database)
   - Scenarios saved with UUID for sharing
   - Investments linked to scenarios with full details
   - Car-specific data stored separately for leasing calculations

3. **Fixed Sidebar Navigation** (responsive UI)
   - Shareable scenario links auto-load and auto-calculate
   - Quick access to `/simulator` (new) and `/tax-config` (settings)
   - Collapses on mobile, expands on desktop

4. **Dynamic Tax Calculations**
   - All ZUS percentages, health insurance rates, and wage bases fetched from database
   - Calculations adapt automatically when user changes tax year
   - Three tax forms compared side-by-side with detailed breakdowns

5. **Polish Language Support**
   - All UI, forms, and documentation in Polish
   - Supports Polish number formatting (pl-PL locale)
   - Tax law references specific to 2025-2028 periods
