/**
 * Polish B2B Tax Calculator for 2026
 * Implements strict mathematical calculations for Polish tax law effective January 1, 2026
 * DO NOT use AI/LLM for these calculations - all logic must be deterministic
 */

export type EngineType = 'combustion' | 'hybrid_plugin' | 'electric';
export type FinancingMethod = 'cash' | 'leasing';
export type UsageType = 'mixed' | 'full_business';
export type ZusType = 'ulga_na_start' | 'preferencyjny' | 'maly_plus' | 'duzy';
export type TaxationForm = 'liniowy' | 'skala' | 'ryczalt';

/**
 * 2026 Car Depreciation Limits (KUP - Koszt Uzyskania Przychodu)
 */
const CAR_DEPRECIATION_LIMITS: Record<EngineType, number> = {
  combustion: 100_000,
  hybrid_plugin: 150_000,
  electric: 225_000,
};

/**
 * ZUS (Social Insurance) monthly rates for 2026 (approximate values)
 */
const ZUS_MONTHLY_RATES = {
  ulga_na_start: 0, // First 6 months free
  preferencyjny: 650, // Preferential rate (24 months)
  maly_plus: 1_700, // Small ZUS Plus
  duzy: 1_900, // Full ZUS
};

/**
 * Health insurance rates
 */
const HEALTH_INSURANCE = {
  liniowy: 0.049, // 4.9% for linear tax
  skala: 0.09, // 9% for tax scale
  ryczalt: 0.049, // 4.9% for lump sum (simplified)
};

/**
 * Ryczałt (Lump Sum) rates by industry
 */
const RYCZALT_RATES = {
  it_services: 0.12, // 12% for IT services
  trade: 0.03, // 3% for trade
  services_general: 0.085, // 8.5% for general services
};

/**
 * Tax scale brackets for 2026
 */
const TAX_SCALE_BRACKETS = {
  tax_free_allowance: 30_000,
  first_bracket_rate: 0.12, // 12% up to ~120k
  first_bracket_limit: 120_000,
  second_bracket_rate: 0.32, // 32% above ~120k
};

export interface CarInvestment {
  name: string;
  carPriceNetto: number;
  engineType: EngineType;
  financingMethod: FinancingMethod;
  usageType: UsageType;
  // Leasing specific
  leasingInitialPaymentPercent?: number;
  leasingMonths?: number;
  leasingBuyoutPercent?: number;
  monthOfPurchase: number; // 1-12
}

export interface EquipmentInvestment {
  name: string;
  costNetto: number;
  monthOfPurchase: number; // 1-12
}

export interface TaxYearConfigInput {
  year: number;
  minimumWageGross: number;
  averageWagePrognosis: number;
  averageWageQ4PreviousYear: number;
  retirementRate: number;
  disabilityRate: number;
  accidentRate: number;
  sicknessRate: number;
  workFundRate: number;
  solidarityFundRate: number;
  healthInsuranceRateSkala: number;
  healthInsuranceRateLiniowy: number;
  healthInsuranceLimitLinear: number;
}

export interface ScenarioConfig {
  yearlyRevenueNetto: number;
  yearlyFixedCosts: number;
  vatPayer: boolean;
  vatRateMixed: number; // 1.0 = 100% VAT deductible
  zusType: ZusType;
  carInvestments: CarInvestment[];
  equipmentInvestments: EquipmentInvestment[];
  taxYearConfig?: TaxYearConfigInput; // Optional: for configurable rates
}

export interface TaxResult {
  taxationForm: TaxationForm;
  grossRevenue: number;
  totalCosts: number;
  taxableIncome: number;
  incomeTax: number;
  healthInsurance: number;
  zusTotal: number;
  netCashInHand: number;
  breakdown: {
    carDepreciationDeduction: number;
    equipmentDepreciationDeduction: number;
    vatBenefit: number;
  };
}

export class TaxCalculator {
  /**
   * Helper: Get effective ZUS monthly cost from config
   */
  private static getZUSMonthly(zusType: ZusType, config?: TaxYearConfigInput): number {
    // For now, keep hardcoded values - rates don't vary by year
    const ZUS_MONTHLY_RATES = {
      ulga_na_start: 0,
      preferencyjny: 650,
      maly_plus: 1_700,
      duzy: 1_900,
    };
    return ZUS_MONTHLY_RATES[zusType];
  }

  /**
   * Helper: Get effective health insurance rates from config
   */
  private static getHealthInsuranceRates(config?: TaxYearConfigInput): typeof HEALTH_INSURANCE {
    if (config) {
      return {
        liniowy: config.healthInsuranceRateLiniowy,
        skala: config.healthInsuranceRateSkala,
        ryczalt: config.healthInsuranceRateLiniowy, // Simplified
      };
    }
    return HEALTH_INSURANCE;
  }

  /**
   * Helper: Get effective health insurance limit from config
   */
  private static getHealthInsuranceLimit(config?: TaxYearConfigInput): number {
    if (config) {
      return config.healthInsuranceLimitLinear;
    }
    return 11_000; // Default 2026 limit
  }

  /**
   * Calculate car depreciation deduction for 2026
   */
  static calculateCarDepreciation(car: CarInvestment): number {
    const limit = CAR_DEPRECIATION_LIMITS[car.engineType];

    if (car.financingMethod === 'cash') {
      // For cash purchase, depreciation is limited by the engine type limit
      const depreciableAmount = Math.min(car.carPriceNetto, limit);

      // Simplified: 20% depreciation rate (5 years) for first year
      // In reality, this would be calculated monthly based on purchase month
      const monthsInYear = 13 - car.monthOfPurchase; // Months remaining in year
      return (depreciableAmount * 0.20 * monthsInYear) / 12;
    } else {
      // Leasing
      if (!car.leasingMonths || !car.leasingInitialPaymentPercent || !car.leasingBuyoutPercent) {
        throw new Error('Leasing parameters required for leasing financing method');
      }

      const totalLeasingCost = car.carPriceNetto;
      const initialPayment = totalLeasingCost * (car.leasingInitialPaymentPercent / 100);
      const buyout = totalLeasingCost * (car.leasingBuyoutPercent / 100);
      const capitalPart = totalLeasingCost - initialPayment - buyout;

      // If car price exceeds limit, only proportional part is deductible
      const deductibleRatio = Math.min(1, limit / car.carPriceNetto);

      // Calculate first year's installments
      const monthsInYear = Math.min(13 - car.monthOfPurchase, car.leasingMonths);
      const monthlyCapital = capitalPart / car.leasingMonths;
      const yearlyCapitalDeductible = monthlyCapital * monthsInYear * deductibleRatio;

      // Initial payment deduction
      const initialPaymentDeductible = initialPayment * deductibleRatio;

      // Interest is 100% deductible (simplified - we assume 5% interest)
      const interestRate = 0.05;
      const yearlyInterest = (capitalPart * interestRate * monthsInYear) / 12;

      return initialPaymentDeductible + yearlyCapitalDeductible + yearlyInterest;
    }
  }

  /**
   * Calculate VAT benefit from car purchase
   */
  static calculateCarVATBenefit(car: CarInvestment): number {
    const vatRate = 0.23; // 23% VAT in Poland
    const vatAmount = car.carPriceNetto * vatRate;

    if (car.usageType === 'full_business') {
      return vatAmount; // 100% deductible
    } else {
      return vatAmount * 0.50; // 50% deductible for mixed use
    }
  }

  /**
   * Calculate equipment depreciation (simplified)
   */
  static calculateEquipmentDepreciation(equipment: EquipmentInvestment): number {
    // IT equipment: 30% depreciation rate (simplified)
    const monthsInYear = 13 - equipment.monthOfPurchase;
    return (equipment.costNetto * 0.30 * monthsInYear) / 12;
  }

  /**
   * Calculate total ZUS for the year
   */
  static calculateYearlyZUS(zusType: ZusType, config?: TaxYearConfigInput): number {
    const monthlyRate = this.getZUSMonthly(zusType, config);
    return monthlyRate * 12;
  }

  /**
   * Calculate tax for Ryczałt (Lump Sum)
   */
  static calculateRyczalt(config: ScenarioConfig): TaxResult {
    const ryczaltRate = RYCZALT_RATES.it_services; // Default to IT services
    const grossRevenue = config.yearlyRevenueNetto;

    // Ryczałt tax is simply revenue * rate
    const incomeTax = grossRevenue * ryczaltRate;

    // Health insurance (simplified calculation)
    const healthInsurance = 6_000; // Approximate fixed amount for ryczałt

    const zusTotal = this.calculateYearlyZUS(config.zusType, config.taxYearConfig);

    // Calculate VAT benefit from investments (cars)
    let vatBenefit = 0;
    if (config.vatPayer) {
      config.carInvestments.forEach(car => {
        vatBenefit += this.calculateCarVATBenefit(car) * config.vatRateMixed;
      });
      config.equipmentInvestments.forEach(eq => {
        vatBenefit += eq.costNetto * 0.23 * config.vatRateMixed;
      });
    }

    const netCashInHand = grossRevenue - incomeTax - healthInsurance - zusTotal + vatBenefit;

    return {
      taxationForm: 'ryczalt',
      grossRevenue,
      totalCosts: 0, // Costs don't matter for ryczałt
      taxableIncome: grossRevenue,
      incomeTax,
      healthInsurance,
      zusTotal,
      netCashInHand,
      breakdown: {
        carDepreciationDeduction: 0, // Not applicable
        equipmentDepreciationDeduction: 0, // Not applicable
        vatBenefit,
      },
    };
  }

  /**
   * Calculate tax for Linear Tax (19%)
   */
  static calculateLiniowy(config: ScenarioConfig): TaxResult {
    const grossRevenue = config.yearlyRevenueNetto;
    const healthInsuranceRates = this.getHealthInsuranceRates(config.taxYearConfig);
    const healthInsuranceLimit = this.getHealthInsuranceLimit(config.taxYearConfig);

    // Calculate car depreciation
    let carDepreciation = 0;
    config.carInvestments.forEach(car => {
      carDepreciation += this.calculateCarDepreciation(car);
    });

    // Calculate equipment depreciation
    let equipmentDepreciation = 0;
    config.equipmentInvestments.forEach(eq => {
      equipmentDepreciation += this.calculateEquipmentDepreciation(eq);
    });

    const totalCosts = config.yearlyFixedCosts + carDepreciation + equipmentDepreciation;
    const taxableIncome = Math.max(0, grossRevenue - totalCosts);

    // 19% linear tax
    const incomeTax = taxableIncome * 0.19;

    // Health insurance: rate from config, deductible up to limit from config
    const healthInsuranceBase = taxableIncome;
    const healthInsurance = Math.min(healthInsuranceBase * healthInsuranceRates.liniowy, healthInsuranceLimit);

    const zusTotal = this.calculateYearlyZUS(config.zusType, config.taxYearConfig);

    // VAT benefit
    let vatBenefit = 0;
    if (config.vatPayer) {
      config.carInvestments.forEach(car => {
        vatBenefit += this.calculateCarVATBenefit(car) * config.vatRateMixed;
      });
      config.equipmentInvestments.forEach(eq => {
        vatBenefit += eq.costNetto * 0.23 * config.vatRateMixed;
      });
    }

    const netCashInHand = grossRevenue - totalCosts - incomeTax - healthInsurance - zusTotal + vatBenefit;

    return {
      taxationForm: 'liniowy',
      grossRevenue,
      totalCosts,
      taxableIncome,
      incomeTax,
      healthInsurance,
      zusTotal,
      netCashInHand,
      breakdown: {
        carDepreciationDeduction: carDepreciation,
        equipmentDepreciationDeduction: equipmentDepreciation,
        vatBenefit,
      },
    };
  }

  /**
   * Calculate tax for Tax Scale (Progressive 12%/32%)
   */
  static calculateSkala(config: ScenarioConfig): TaxResult {
    const grossRevenue = config.yearlyRevenueNetto;
    const healthInsuranceRates = this.getHealthInsuranceRates(config.taxYearConfig);

    // Calculate car depreciation
    let carDepreciation = 0;
    config.carInvestments.forEach(car => {
      carDepreciation += this.calculateCarDepreciation(car);
    });

    // Calculate equipment depreciation
    let equipmentDepreciation = 0;
    config.equipmentInvestments.forEach(eq => {
      equipmentDepreciation += this.calculateEquipmentDepreciation(eq);
    });

    const totalCosts = config.yearlyFixedCosts + carDepreciation + equipmentDepreciation;
    const income = Math.max(0, grossRevenue - totalCosts);

    // Apply tax-free allowance
    const taxableIncome = Math.max(0, income - TAX_SCALE_BRACKETS.tax_free_allowance);

    // Progressive tax calculation
    let incomeTax = 0;
    if (taxableIncome <= TAX_SCALE_BRACKETS.first_bracket_limit) {
      incomeTax = taxableIncome * TAX_SCALE_BRACKETS.first_bracket_rate;
    } else {
      const firstBracketTax = TAX_SCALE_BRACKETS.first_bracket_limit * TAX_SCALE_BRACKETS.first_bracket_rate;
      const secondBracketIncome = taxableIncome - TAX_SCALE_BRACKETS.first_bracket_limit;
      const secondBracketTax = secondBracketIncome * TAX_SCALE_BRACKETS.second_bracket_rate;
      incomeTax = firstBracketTax + secondBracketTax;
    }

    // Health insurance: from config, NOT deductible from tax
    const healthInsurance = income * healthInsuranceRates.skala;

    const zusTotal = this.calculateYearlyZUS(config.zusType, config.taxYearConfig);

    // VAT benefit
    let vatBenefit = 0;
    if (config.vatPayer) {
      config.carInvestments.forEach(car => {
        vatBenefit += this.calculateCarVATBenefit(car) * config.vatRateMixed;
      });
      config.equipmentInvestments.forEach(eq => {
        vatBenefit += eq.costNetto * 0.23 * config.vatRateMixed;
      });
    }

    const netCashInHand = grossRevenue - totalCosts - incomeTax - healthInsurance - zusTotal + vatBenefit;

    return {
      taxationForm: 'skala',
      grossRevenue,
      totalCosts,
      taxableIncome,
      incomeTax,
      healthInsurance,
      zusTotal,
      netCashInHand,
      breakdown: {
        carDepreciationDeduction: carDepreciation,
        equipmentDepreciationDeduction: equipmentDepreciation,
        vatBenefit,
      },
    };
  }

  /**
   * Compare all three taxation forms
   */
  static compareAll(config: ScenarioConfig): {
    ryczalt: TaxResult;
    liniowy: TaxResult;
    skala: TaxResult;
  } {
    return {
      ryczalt: this.calculateRyczalt(config),
      liniowy: this.calculateLiniowy(config),
      skala: this.calculateSkala(config),
    };
  }
}
