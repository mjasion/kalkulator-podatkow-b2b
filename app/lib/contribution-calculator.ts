/**
 * Polish ZUS & Health Insurance Contribution Calculator for 2026
 * Implements detailed calculation logic for social and health insurance contributions
 * Based on specified tax form and ZUS type
 */

export type ZusType = 'ulga_na_start' | 'preferencyjny' | 'maly_plus' | 'duzy';
export type TaxationForm = 'liniowy' | 'skala' | 'ryczalt';

/**
 * Configuration for tax year (2026 defaults)
 */
export interface TaxYearConfig {
  year: number;
  minimumWageGross: number; // Minimalne wynagrodzenie brutto
  averageWagePrognosis: number; // Prognozowane przeciętne wynagrodzenie
  averageWageQ4PreviousYear: number; // Przeciętne wynagrodzenie IV kwartału roku poprzedniego
  socialSecurityRates: {
    retirement: number; // Emerytalne
    disability: number; // Rentowe
    accident: number; // Wypadkowe
    sickness: number; // Chorobowe (opcjonalne)
  };
  workFundRate: number; // Fundusz Pracy (FP)
  solidarityFundRate: number; // Fundusz Solidarnościowy
  healthInsuranceRate: {
    skala: number; // 9% for progressive scale
    liniowy: number; // 4.9% for linear (but minimum guaranteed)
  };
  minHealthInsuranceLinear: number; // Minimum health insurance for linear: 9% * minimum wage
  healthInsuranceLimits: {
    linear: number; // Roczny limit odliczenia dla liniowego
  };
}

/**
 * Default 2026 configuration
 */
export const DEFAULT_2026_CONFIG: TaxYearConfig = {
  year: 2026,
  minimumWageGross: 4_626, // Approximate for 2026
  averageWagePrognosis: 7_286, // Approximate for 2026
  averageWageQ4PreviousYear: 7_000, // From 2025 Q4
  socialSecurityRates: {
    retirement: 0.1952, // 19.52%
    disability: 0.08, // 8%
    accident: 0.0167, // 1.67% (default, editable)
    sickness: 0.0245, // 2.45%
  },
  workFundRate: 0.0245, // 2.45%
  solidarityFundRate: 0.0245, // 2.45%
  healthInsuranceRate: {
    skala: 0.09,
    liniowy: 0.049,
  },
  minHealthInsuranceLinear: 0, // Will be calculated
  healthInsuranceLimits: {
    linear: 11_600, // 2025 limit, to be updated for 2026
  },
};

// Calculate minimum health insurance for linear tax
DEFAULT_2026_CONFIG.minHealthInsuranceLinear =
  DEFAULT_2026_CONFIG.minimumWageGross * 0.09;

/**
 * Input data for contribution calculation
 */
export interface ContributionInput {
  taxationForm: TaxationForm;
  zusType: ZusType;
  monthlyRevenue: number; // Przychód miesięczny
  monthlyCosts: number; // Koszty miesięczne
  monthlySocialSecurityBase?: number; // Custom base for "mały_plus"
  voluntarySickness: boolean; // Dobrowolne ubezpieczenie chorobowe
  yearlyRevenueToDate?: number; // For ryczałt threshold detection
}

/**
 * Output contribution data
 */
export interface ContributionOutput {
  // Amounts to pay
  socialSecurityTotal: number;
  healthInsuranceAmount: number;

  // Deductible portions (for tax calculation)
  deductibleSocialFromIncome: number; // Full social security
  deductibleHealthFromIncome: number; // For scale & ryczałt
  deductibleHealthFromTax?: number; // For linear (liniowy) tax

  // Breakdown
  breakdown: {
    retirement: number;
    disability: number;
    accident: number;
    sickness?: number;
    workFund?: number;
    solidarityFund?: number;
    healthInsurance: number;
  };
}

export class ContributionCalculator {
  /**
   * Calculate social security contributions (ubezpieczenia społeczne)
   */
  static calculateSocialSecurity(
    input: ContributionInput,
    config: TaxYearConfig
  ): {
    amount: number;
    base: number;
    breakdown: ContributionOutput['breakdown'];
  } {
    let base = 0;

    // Step 1: Determine base (podstawa wymiaru)
    if (input.zusType === 'ulga_na_start') {
      base = 0;
    } else if (input.zusType === 'preferencyjny') {
      base = config.minimumWageGross * 0.3;
    } else if (input.zusType === 'duzy') {
      base = config.averageWagePrognosis * 0.6;
    } else if (input.zusType === 'maly_plus') {
      base = input.monthlySocialSecurityBase || config.minimumWageGross;
    }

    if (base === 0) {
      return {
        amount: 0,
        base: 0,
        breakdown: {
          retirement: 0,
          disability: 0,
          accident: 0,
          workFund: 0,
          solidarityFund: 0,
          healthInsurance: 0,
        },
      };
    }

    // Step 2: Calculate each component
    const retirement = base * config.socialSecurityRates.retirement;
    const disability = base * config.socialSecurityRates.disability;
    const accident = base * config.socialSecurityRates.accident;
    const sickness = input.voluntarySickness ? base * config.socialSecurityRates.sickness : 0;

    // Work fund & solidarity fund (not for preferencyjny if base < minimum wage)
    let workFund = 0;
    let solidarityFund = 0;
    if (input.zusType !== 'preferencyjny' || base >= config.minimumWageGross) {
      workFund = base * config.workFundRate;
      solidarityFund = base * config.solidarityFundRate;
    }

    const total = retirement + disability + accident + sickness + workFund + solidarityFund;

    return {
      amount: total,
      base,
      breakdown: {
        retirement,
        disability,
        accident,
        sickness: sickness || undefined,
        workFund: workFund || undefined,
        solidarityFund: solidarityFund || undefined,
        healthInsurance: 0,
      },
    };
  }

  /**
   * Calculate health insurance (ubezpieczenie zdrowotne)
   */
  static calculateHealthInsurance(
    input: ContributionInput,
    config: TaxYearConfig,
    monthlyIncome: number // Monthly income (revenue - costs - social security)
  ): {
    amount: number;
    deductibleFromIncome: number;
    deductibleFromTax: number;
  } {
    if (input.taxationForm === 'skala') {
      // Scale: 9% from income, no deduction from tax
      const base = Math.max(monthlyIncome, config.minimumWageGross);
      const amount = base * config.healthInsuranceRate.skala;

      return {
        amount,
        deductibleFromIncome: amount,
        deductibleFromTax: 0,
      };
    } else if (input.taxationForm === 'liniowy') {
      // Linear: 4.9% but minimum guaranteed
      const base = Math.max(monthlyIncome, config.minimumWageGross);
      const amount = Math.max(base * config.healthInsuranceRate.liniowy, config.minHealthInsuranceLinear);

      // For linear, amount can be deducted from income OR from tax (up to yearly limit)
      // For simplification in monthly calculation, we'll deduct from income
      return {
        amount,
        deductibleFromIncome: amount,
        deductibleFromTax: 0,
      };
    } else if (input.taxationForm === 'ryczalt') {
      // Ryczałt: Complex progressive rates based on yearly revenue
      const base = config.averageWageQ4PreviousYear;
      let rateMultiplier = 0;

      if (input.yearlyRevenueToDate && input.yearlyRevenueToDate <= 60_000) {
        rateMultiplier = 0.6;
      } else if (input.yearlyRevenueToDate && input.yearlyRevenueToDate <= 300_000) {
        rateMultiplier = 1.0;
      } else {
        rateMultiplier = 1.8;
      }

      const amount = base * 0.09 * rateMultiplier;

      return {
        amount,
        deductibleFromIncome: amount * 0.5, // 50% of paid health insurance is deductible from revenue
        deductibleFromTax: 0,
      };
    }

    return {
      amount: 0,
      deductibleFromIncome: 0,
      deductibleFromTax: 0,
    };
  }

  /**
   * Calculate total monthly contributions
   */
  static calculateMonthlyContributions(
    input: ContributionInput,
    config: TaxYearConfig
  ): ContributionOutput {
    const monthlyIncome = Math.max(0, input.monthlyRevenue - input.monthlyCosts);

    const socialResult = this.calculateSocialSecurity(input, config);
    const healthResult = this.calculateHealthInsurance(input, config, monthlyIncome);

    return {
      socialSecurityTotal: socialResult.amount,
      healthInsuranceAmount: healthResult.amount,
      deductibleSocialFromIncome: socialResult.amount,
      deductibleHealthFromIncome: healthResult.deductibleFromIncome,
      deductibleHealthFromTax: healthResult.deductibleFromTax,
      breakdown: {
        ...socialResult.breakdown,
        healthInsurance: healthResult.amount,
      },
    };
  }
}
