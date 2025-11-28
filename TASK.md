# Project Specification: Polish B2B Tax Optimizer & Forecaster (2026 Edition)

## 1. Project Overview
We are building a "Tax & Cashflow Forecaster" application for Polish B2B sole proprietorships (JDG). The goal is to help users choose the best form of taxation for the upcoming year (2026) by analyzing historical data and simulating future investments (specifically cars and hardware).

**Key Context:** The application must account for Polish tax laws effective from **January 1, 2026**, specifically the drastically reduced depreciation limits for combustion engine cars (100,000 PLN limit).

## 2. Tech Stack & Infrastructure
- **Platform:** Cloudflare Workers (Serverless/Edge).
- **Framework:** React Router v7 (Frontend) + Hono (Backend API) using the `react-router-hono-fullstack-template`.
- **Database:** Cloudflare D1 (SQLite). Used to store "Simulation Scenarios" (since there is no auth, we will store simulations by a generated UUID).
- **AI/LLM:** Vercel AI SDK (`ai` package) for "Agentic" analysis of InFakt data.
- **Styling:** Tailwind CSS + Shadcn/UI (Radix Primitives) for a modern, clean, dark-mode-first aesthetic.
- **Charts:** Recharts (for visualization of tax comparisons).
- **Data Source:** InFakt API (via User provided API Key).

## 3. Database Schema (D1)
Since there is no auth, we treat data as "Ephemeral" or "Shareable via Link".

-- Stores the user's base configuration
CREATE TABLE scenarios (
id TEXT PRIMARY KEY, -- UUID
created_at INTEGER,
vat_payer BOOLEAN DEFAULT 1,
vat_rate_mixed REAL DEFAULT 1.0, -- 1.0 = 100% VAT deductible
zus_type TEXT, -- 'ulga_na_start', 'preferencyjny', 'maly_plus', 'duzy'
current_taxation_form TEXT -- 'liniowy', 'skala', 'ryczalt'
);

-- Stores planned investments attached to a scenario
CREATE TABLE investments (
id TEXT PRIMARY KEY,
scenario_id TEXT,
name TEXT, -- e.g., "MacBook Pro"
cost_netto REAL,
month_of_purchase INTEGER, -- 1-12
type TEXT -- 'equipment', 'car_leasing', 'car_cash'
);

-- Specific details for car simulations (1:1 with investments of type 'car_xx')
CREATE TABLE car_details (
investment_id TEXT PRIMARY KEY,
engine_type TEXT, -- 'combustion', 'hybrid_plugin', 'electric'
financing_method TEXT, -- 'cash', 'leasing'
car_price_netto REAL,
leasing_initial_payment_percent REAL,
leasing_months INTEGER,
leasing_buyout_percent REAL,
usage_type TEXT -- 'mixed', 'full_business'
);


## 4. Core Features & Modules

### 4.1. AI Data Ingestion (The "Smart" Part)
The backend (Hono) will expose an endpoint that uses Vercel AI SDK.
- **Route:** `POST /api/ai/analyze-infakt`
- **Input:** User's InFakt API Key.
- **Logic:**
  - The AI Agent is equipped with a Tool: `fetchInFaktHistory(apiKey, year)`.
  - The tool connects to InFakt REST API to fetch monthly revenue and categorized expenses for the last 12 months.
  - **AI Task:** The LLM analyzes the JSON to determine:
    1. Average monthly revenue trend.
    2. Recurring fixed costs (servers, accounting, software) vs. one-off costs.
  - **Output:** Returns a structured JSON forecast for 2026 (Revenue baseline + Fixed Costs baseline).

### 4.2. The "2026 Car Calculator" (Strict Math Logic)
This is a critical module. Do NOT use AI for the math here; use strict Typescript functions.
**2026 Rules to Implement:**
1. **Engine Types & Limits (KUP - Koszt Uzyskania Przychodu):**
  - **Combustion/Standard Hybrid:** Limit **100,000 PLN**.
  - **Plugin Hybrid (Eco):** Limit **150,000 PLN**.
  - **Electric:** Limit **225,000 PLN**.
2. **Leasing Logic:**
  - If `CarPrice > Limit`: The tax-deductible part of the *capital* installment is proportional (`Limit / CarPrice`).
  - Interest part (odsetki) is usually 100% deductible (simplification for MVP).
  - VAT: 50% deductible for mixed usage, 100% for full business.
  - Non-deductible VAT increases the Gross value, which serves as the basis for the 100k limit check.

### 4.3. Tax Comparator (The Output)
A dashboard comparing 3 columns for the year 2026:
1.  **Lump Sum (Ryczałt):**
  - Revenue * Rate (e.g., 12% for IT).
  - Deductions: ZUS Health (partial).
  - *Investments (Car/Laptop) DO NOT lower tax.*
2.  **Linear Tax (Liniowy 19%):**
  - (Revenue - Costs - Car Amortization - Laptop) * 19%.
  - Health Insurance: 4.9% (Deductible up to annual limit ~11k PLN).
3.  **Tax Scale (Skala 12%/32%):**
  - Progressive tax. 30k PLN tax-free allowance.
  - Health Insurance: 9% (Non-deductible).

## 5. UI/UX Requirements
- **Frontend:** React Router 7 (Components in `app/components`).
- **Theme:** Dark mode default.
- **Flow:**
  1. **Landing:** "Paste your InFakt API Key to generate 2026 forecast" (Client-side only storage of key).
  2. **Analysis:** Loading state while AI analyzes history.
  3. **Configuration:** A clean form to adjust the AI's forecast (e.g., "I expect 10% raise").
  4. **Investments:** A dedicated card to add "New Car 2026".
    - Compare "Leasing" vs "Cash" side-by-side inside the modal.
  5. **Results:** A large Bar Chart showing "Net Cash in Hand" for all 3 tax forms.

## 6. API Routes (Hono - server/index.ts)
- `POST /api/simulation/create` - Create a new D1 session.
- `POST /api/ai/analyze` - AI SDK stream/generate object.
- `GET /api/simulation/:id` - Retrieve state.
- `POST /api/simulation/:id/investment` - Add car/laptop.

## 7. Implementation Steps for the Agent
1. **Setup:** Initialize D1 database and generate types.
2. **Backend Core:** Implement the `TaxCalculator` class in TypeScript (business logic for Polish Order).
3. **InFakt Integration:** Create the AI SDK Tool definition for fetching InFakt data.
4. **Frontend:** Build the `CarLeasingForm` component with dynamic sliders.
5. **Visualization:** Implement Recharts for the comparison summary.
