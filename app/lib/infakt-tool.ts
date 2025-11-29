/**
 * InFakt API integration tool for Vercel AI SDK
 * This tool allows the LLM to fetch and analyze historical data from InFakt
 */

import { tool } from 'ai';
import { z } from 'zod';

export interface InFaktMonthlyData {
  month: string; // YYYY-MM
  revenue: number;
  expenses: number;
  expenseCategories: {
    servers: number;
    accounting: number;
    software: number;
    other: number;
  };
}

/**
 * Fetch historical data from InFakt API
 * Note: This is a simplified implementation. Real InFakt API integration would require
 * proper authentication and API endpoints.
 */
async function fetchInFaktData(apiKey: string, year: number): Promise<InFaktMonthlyData[]> {
  // TODO: Implement actual InFakt API integration
  // For now, return mock data structure

  // In production, this would make actual API calls like:
  // const response = await fetch(`https://api.infakt.pl/v3/invoices?year=${year}`, {
  //   headers: { 'X-inFakt-ApiKey': apiKey }
  // });

  // Mock data for development
  const mockData: InFaktMonthlyData[] = [];
  for (let month = 1; month <= 12; month++) {
    mockData.push({
      month: `${year}-${String(month).padStart(2, '0')}`,
      revenue: 15000 + Math.random() * 5000,
      expenses: 3000 + Math.random() * 2000,
      expenseCategories: {
        servers: 500,
        accounting: 300,
        software: 800,
        other: 1400 + Math.random() * 1000,
      },
    });
  }

  return mockData;
}

/**
 * Create InFakt data fetching tool with API key injected server-side
 * This prevents exposing the API key to the client
 */
export const createInFaktTool = (infaktApiKey: string) => tool({
  description: 'Fetch historical revenue and expense data from InFakt accounting system for a specific year. Returns monthly breakdown of revenue and categorized expenses.',
  parameters: z.object({
    year: z.number().describe('Year to fetch data for (e.g., 2025)'),
  }),
  execute: async ({ year }) => {
    const apiKey = infaktApiKey; // Use server-side API key
    try {
      const data = await fetchInFaktData(apiKey, year);

      // Calculate statistics for the AI to analyze
      const totalRevenue = data.reduce((sum, month) => sum + month.revenue, 0);
      const totalExpenses = data.reduce((sum, month) => sum + month.expenses, 0);
      const avgMonthlyRevenue = totalRevenue / 12;
      const avgMonthlyExpenses = totalExpenses / 12;

      // Categorize expense totals
      const categorizedExpenses = {
        servers: data.reduce((sum, month) => sum + month.expenseCategories.servers, 0),
        accounting: data.reduce((sum, month) => sum + month.expenseCategories.accounting, 0),
        software: data.reduce((sum, month) => sum + month.expenseCategories.software, 0),
        other: data.reduce((sum, month) => sum + month.expenseCategories.other, 0),
      };

      return {
        success: true,
        data: {
          year,
          monthlyData: data,
          summary: {
            totalRevenue,
            totalExpenses,
            avgMonthlyRevenue,
            avgMonthlyExpenses,
            categorizedExpenses,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch InFakt data: ${error}`,
      };
    }
  },
});

/**
 * AI analysis prompt for InFakt data
 */
export const INFAKT_ANALYSIS_PROMPT = `You are a Polish B2B tax advisor analyzing historical business data from InFakt accounting system.

Your task is to:
1. Analyze the monthly revenue trend from the provided data
2. Identify recurring fixed costs (servers, accounting, software subscriptions)
3. Distinguish between one-off expenses and predictable monthly costs
4. Generate a realistic forecast for the upcoming year (2026)

IMPORTANT: Your response must be a structured JSON object, not free-form text.

Return your analysis in this exact JSON format:
{
  "revenueForecast": {
    "baseline": number, // Projected average monthly revenue for 2026
    "trend": "growing" | "stable" | "declining",
    "confidence": "high" | "medium" | "low"
  },
  "fixedCostsForecast": {
    "monthlyTotal": number, // Projected monthly fixed costs
    "breakdown": {
      "servers": number,
      "accounting": number,
      "software": number,
      "other": number
    }
  },
  "insights": string[], // Array of 2-3 key insights about the business
  "recommendations": string[] // Array of 2-3 recommendations for tax optimization
}`;
