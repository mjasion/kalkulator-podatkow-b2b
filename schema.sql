-- Stores the user's base configuration
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  title TEXT,
  yearly_revenue_netto REAL DEFAULT 0,
  yearly_fixed_costs REAL DEFAULT 0,
  vat_payer BOOLEAN DEFAULT 1,
  vat_rate_mixed REAL DEFAULT 1.0,
  zus_type TEXT NOT NULL,
  current_taxation_form TEXT NOT NULL
);

-- Add missing columns to existing scenarios table (for schema migrations)
ALTER TABLE scenarios ADD COLUMN title TEXT DEFAULT NULL;
ALTER TABLE scenarios ADD COLUMN yearly_revenue_netto REAL DEFAULT 0;
ALTER TABLE scenarios ADD COLUMN yearly_fixed_costs REAL DEFAULT 0;

-- Stores planned investments attached to a scenario
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cost_netto REAL NOT NULL,
  month_of_purchase INTEGER NOT NULL,
  type TEXT NOT NULL,
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);

-- Specific details for car simulations (1:1 with investments of type 'car_xx')
CREATE TABLE IF NOT EXISTS car_details (
  investment_id TEXT PRIMARY KEY,
  engine_type TEXT NOT NULL,
  financing_method TEXT NOT NULL,
  car_price_netto REAL NOT NULL,
  leasing_initial_payment_percent REAL,
  leasing_months INTEGER,
  leasing_buyout_percent REAL,
  usage_type TEXT NOT NULL,
  FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Tax year configuration (global settings for each year)
CREATE TABLE IF NOT EXISTS tax_year_configs (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  minimum_wage_gross REAL NOT NULL,
  average_wage_prognosis REAL NOT NULL,
  average_wage_q4_previous_year REAL NOT NULL,
  retirement_rate REAL NOT NULL DEFAULT 0.1952,
  disability_rate REAL NOT NULL DEFAULT 0.08,
  accident_rate REAL NOT NULL DEFAULT 0.0167,
  sickness_rate REAL NOT NULL DEFAULT 0.0245,
  work_fund_rate REAL NOT NULL DEFAULT 0.0245,
  solidarity_fund_rate REAL NOT NULL DEFAULT 0.0245,
  health_insurance_rate_skala REAL NOT NULL DEFAULT 0.09,
  health_insurance_rate_liniowy REAL NOT NULL DEFAULT 0.049,
  health_insurance_limit_linear REAL NOT NULL DEFAULT 11600,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Contribution configuration (user preferences per year)
CREATE TABLE IF NOT EXISTS contribution_configs (
  id TEXT PRIMARY KEY,
  tax_year_config_id TEXT NOT NULL,
  taxation_form TEXT NOT NULL,
  zus_type TEXT NOT NULL,
  custom_base REAL,
  voluntary_sickness INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tax_year_config_id) REFERENCES tax_year_configs(id) ON DELETE CASCADE
);

-- Default tax year configurations for 2025-2028
INSERT OR IGNORE INTO tax_year_configs (id, year, minimum_wage_gross, average_wage_prognosis, average_wage_q4_previous_year, retirement_rate, disability_rate, accident_rate, sickness_rate, work_fund_rate, solidarity_fund_rate, health_insurance_rate_skala, health_insurance_rate_liniowy, health_insurance_limit_linear, created_at, updated_at) VALUES
('cfg-2025', 2025, 4388, 7143, 7000, 0.1952, 0.08, 0.0167, 0.0245, 0.0245, 0.0245, 0.09, 0.049, 11300, 1735689600000, 1735689600000),
('cfg-2026', 2026, 4626, 7286, 7000, 0.1952, 0.08, 0.0167, 0.0245, 0.0245, 0.0245, 0.09, 0.049, 11600, 1767225600000, 1767225600000),
('cfg-2027', 2027, 4750, 7500, 7286, 0.1952, 0.08, 0.0167, 0.0245, 0.0245, 0.0245, 0.09, 0.049, 11900, 1798761600000, 1798761600000),
('cfg-2028', 2028, 4900, 7700, 7500, 0.1952, 0.08, 0.0167, 0.0245, 0.0245, 0.0245, 0.09, 0.049, 12200, 1830384000000, 1830384000000);
