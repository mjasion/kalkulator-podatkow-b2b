import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  title: text('title'),
  yearlyRevenueNetto: real('yearly_revenue_netto').default(0),
  yearlyFixedCosts: real('yearly_fixed_costs').default(0),
  vatPayer: integer('vat_payer', { mode: 'boolean' }).default(true),
  vatRateMixed: real('vat_rate_mixed').default(1.0),
  zusType: text('zus_type', {
    enum: ['ulga_na_start', 'preferencyjny', 'maly_plus', 'duzy'],
  }).notNull(),
  currentTaxationForm: text('current_taxation_form', {
    enum: ['liniowy', 'skala', 'ryczalt'],
  }).notNull(),
});

export const investments = sqliteTable('investments', {
  id: text('id').primaryKey(),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => scenarios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  costNetto: real('cost_netto').notNull(),
  monthOfPurchase: integer('month_of_purchase').notNull(),
  type: text('type', {
    enum: ['equipment', 'car_leasing', 'car_cash'],
  }).notNull(),
});

export const carDetails = sqliteTable('car_details', {
  investmentId: text('investment_id')
    .primaryKey()
    .references(() => investments.id, { onDelete: 'cascade' }),
  engineType: text('engine_type', {
    enum: ['combustion', 'hybrid_plugin', 'electric'],
  }).notNull(),
  financingMethod: text('financing_method', {
    enum: ['cash', 'leasing'],
  }).notNull(),
  carPriceNetto: real('car_price_netto').notNull(),
  leasingInitialPaymentPercent: real('leasing_initial_payment_percent'),
  leasingMonths: integer('leasing_months'),
  leasingBuyoutPercent: real('leasing_buyout_percent'),
  usageType: text('usage_type', {
    enum: ['mixed', 'full_business'],
  }).notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;

export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;

export const taxYearConfigs = sqliteTable('tax_year_configs', {
  id: text('id').primaryKey(),
  year: integer('year').notNull().unique(),
  minimumWageGross: real('minimum_wage_gross').notNull(),
  averageWagePrognosis: real('average_wage_prognosis').notNull(),
  averageWageQ4PreviousYear: real('average_wage_q4_previous_year').notNull(),
  retirementRate: real('retirement_rate').notNull().default(0.1952),
  disabilityRate: real('disability_rate').notNull().default(0.08),
  accidentRate: real('accident_rate').notNull().default(0.0167),
  sicknessRate: real('sickness_rate').notNull().default(0.0245),
  workFundRate: real('work_fund_rate').notNull().default(0.0245),
  solidarityFundRate: real('solidarity_fund_rate').notNull().default(0.0245),
  healthInsuranceRateSkala: real('health_insurance_rate_skala').notNull().default(0.09),
  healthInsuranceRateLiniowy: real('health_insurance_rate_liniowy').notNull().default(0.049),
  healthInsuranceLimitLinear: real('health_insurance_limit_linear').notNull().default(11_600),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const contributionConfigs = sqliteTable('contribution_configs', {
  id: text('id').primaryKey(),
  taxYearConfigId: text('tax_year_config_id')
    .notNull()
    .references(() => taxYearConfigs.id, { onDelete: 'cascade' }),
  taxationForm: text('taxation_form', {
    enum: ['liniowy', 'skala', 'ryczalt'],
  }).notNull(),
  zusType: text('zus_type', {
    enum: ['ulga_na_start', 'preferencyjny', 'maly_plus', 'duzy'],
  }).notNull(),
  customBase: real('custom_base'), // For mały_plus
  voluntarySickness: integer('voluntary_sickness', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export type CarDetail = typeof carDetails.$inferSelect;
export type NewCarDetail = typeof carDetails.$inferInsert;

export type TaxYearConfig = typeof taxYearConfigs.$inferSelect;
export type NewTaxYearConfig = typeof taxYearConfigs.$inferInsert;

export type ContributionConfig = typeof contributionConfigs.$inferSelect;
export type NewContributionConfig = typeof contributionConfigs.$inferInsert;
