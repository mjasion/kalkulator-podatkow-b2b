import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { cors } from "hono/cors";
import { eq } from "drizzle-orm";

const app = new Hono();

// Enable CORS for API routes
app.use("/api/*", cors());

// API Routes - MUST be defined BEFORE the catch-all React Router handler

/**
 * POST /api/simulation/create
 * Create a new simulation scenario
 */
app.post("/api/simulation/create", async (c) => {
	const body = await c.req.json<{
		vatPayer: boolean;
		vatRateMixed: number;
		zusType: string;
		currentTaxationForm: string;
		yearlyRevenueNetto?: number;
		yearlyFixedCosts?: number;
		title?: string;
	}>();

	const scenarioId = uuidv4();

	try {
		const { createDbClient } = await import("../app/db/client");
		const { scenarios } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		await db.insert(scenarios).values({
			id: scenarioId,
			createdAt: new Date(),
			title: body.title || null,
			yearlyRevenueNetto: body.yearlyRevenueNetto || 0,
			yearlyFixedCosts: body.yearlyFixedCosts || 0,
			vatPayer: body.vatPayer,
			vatRateMixed: body.vatRateMixed,
			zusType: body.zusType as any,
			currentTaxationForm: body.currentTaxationForm as any,
		});

		return c.json({ id: scenarioId, createdAt: Date.now() });
	} catch (error) {
		console.error("Error creating scenario:", error);
		return c.json({ error: "Failed to create scenario" }, 500);
	}
});

/**
 * GET /api/simulation/:id
 * Retrieve a simulation scenario with all investments
 */
app.get("/api/simulation/:id", async (c) => {
	const scenarioId = c.req.param("id");

	try {
		const { createDbClient } = await import("../app/db/client");
		const { scenarios, investments, carDetails } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		// Get scenario
		const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).get();

		if (!scenario) {
			return c.json({ error: "Scenario not found" }, 404);
		}

		// Get investments
		const investmentsList = await db
			.select()
			.from(investments)
			.where(eq(investments.scenarioId, scenarioId))
			.all();

		// Get car details for car investments
		const carDetailsList = await Promise.all(
			investmentsList.map((inv) =>
				db.select().from(carDetails).where(eq(carDetails.investmentId, inv.id)).get(),
			),
		);

		return c.json({
			scenario,
			investments: investmentsList,
			carDetails: carDetailsList.filter((d) => d !== undefined),
		});
	} catch (error) {
		console.error("Error retrieving scenario:", error);
		return c.json({ error: "Failed to retrieve scenario" }, 500);
	}
});

/**
 * POST /api/simulation/:id/investment
 * Add an investment (car or equipment) to a scenario
 */
app.post("/api/simulation/:id/investment", async (c) => {
	const scenarioId = c.req.param("id");
	const body = await c.req.json<{
		name: string;
		costNetto: number;
		monthOfPurchase: number;
		type: string;
		carDetails?: {
			engineType: string;
			financingMethod: string;
			carPriceNetto: number;
			leasingInitialPaymentPercent?: number;
			leasingMonths?: number;
			leasingBuyoutPercent?: number;
			usageType: string;
		};
	}>();

	const investmentId = uuidv4();

	try {
		const { createDbClient } = await import("../app/db/client");
		const { investments, carDetails } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		// Insert investment
		await db.insert(investments).values({
			id: investmentId,
			scenarioId,
			name: body.name,
			costNetto: body.costNetto,
			monthOfPurchase: body.monthOfPurchase,
			type: body.type as any,
		});

		// If it's a car investment, insert car details
		if (body.carDetails && (body.type === "car_leasing" || body.type === "car_cash")) {
			const car = body.carDetails;
			await db.insert(carDetails).values({
				investmentId,
				engineType: car.engineType as any,
				financingMethod: car.financingMethod as any,
				carPriceNetto: car.carPriceNetto,
				leasingInitialPaymentPercent: car.leasingInitialPaymentPercent,
				leasingMonths: car.leasingMonths,
				leasingBuyoutPercent: car.leasingBuyoutPercent,
				usageType: car.usageType as any,
			});
		}

		return c.json({ id: investmentId });
	} catch (error) {
		console.error("Error adding investment:", error);
		return c.json({ error: "Failed to add investment" }, 500);
	}
});

/**
 * POST /api/simulation/:id/calculate
 * Calculate tax comparison for a scenario
 */
app.post("/api/simulation/:id/calculate", async (c) => {
	const scenarioId = c.req.param("id");
	const body = await c.req.json<{
		yearlyRevenueNetto: number;
		yearlyFixedCosts: number;
		selectedTaxYear?: number;
	}>();

	try {
		const { createDbClient } = await import("../app/db/client");
		const { scenarios, investments, carDetails, taxYearConfigs } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		// Get scenario
		const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).get();

		if (!scenario) {
			return c.json({ error: "Scenario not found" }, 404);
		}

		// Get tax year config if specified
		const selectedTaxYear = body.selectedTaxYear || 2026;
		let taxYearConfig = null;

		const configRecord = await db
			.select()
			.from(taxYearConfigs)
			.where(eq(taxYearConfigs.year, selectedTaxYear))
			.get();

		if (configRecord) {
			taxYearConfig = {
				year: configRecord.year,
				minimumWageGross: configRecord.minimumWageGross,
				averageWagePrognosis: configRecord.averageWagePrognosis,
				averageWageQ4PreviousYear: configRecord.averageWageQ4PreviousYear,
				retirementRate: configRecord.retirementRate,
				disabilityRate: configRecord.disabilityRate,
				accidentRate: configRecord.accidentRate,
				sicknessRate: configRecord.sicknessRate,
				workFundRate: configRecord.workFundRate,
				solidarityFundRate: configRecord.solidarityFundRate,
				healthInsuranceRateSkala: configRecord.healthInsuranceRateSkala,
				healthInsuranceRateLiniowy: configRecord.healthInsuranceRateLiniowy,
				healthInsuranceLimitLinear: configRecord.healthInsuranceLimitLinear,
			};
		}

		// Get investments
		const investmentsList = await db
			.select()
			.from(investments)
			.where(eq(investments.scenarioId, scenarioId))
			.all();

		// Build car and equipment arrays
		const carInvestments = [];
		const equipmentInvestments = [];

		for (const inv of investmentsList) {
			if (inv.type === "car_leasing" || inv.type === "car_cash") {
				const carDetail = await db
					.select()
					.from(carDetails)
					.where(eq(carDetails.investmentId, inv.id))
					.get();

				if (carDetail) {
					carInvestments.push({
						name: inv.name,
						carPriceNetto: carDetail.carPriceNetto,
						engineType: carDetail.engineType,
						financingMethod: carDetail.financingMethod,
						usageType: carDetail.usageType,
						leasingInitialPaymentPercent: carDetail.leasingInitialPaymentPercent || undefined,
						leasingMonths: carDetail.leasingMonths || undefined,
						leasingBuyoutPercent: carDetail.leasingBuyoutPercent || undefined,
						monthOfPurchase: inv.monthOfPurchase,
					});
				}
			} else {
				equipmentInvestments.push({
					name: inv.name,
					costNetto: inv.costNetto,
					monthOfPurchase: inv.monthOfPurchase,
				});
			}
		}

		// Import TaxCalculator dynamically
		const { TaxCalculator } = await import("../app/lib/tax-calculator");

		const config = {
			yearlyRevenueNetto: body.yearlyRevenueNetto,
			yearlyFixedCosts: body.yearlyFixedCosts,
			vatPayer: scenario.vatPayer ?? true,
			vatRateMixed: scenario.vatRateMixed ?? 1.0,
			zusType: scenario.zusType,
			carInvestments,
			equipmentInvestments,
			taxYearConfig: taxYearConfig || undefined,
		};

		const results = TaxCalculator.compareAll(config);

		return c.json(results);
	} catch (error) {
		console.error("Error calculating taxes:", error);
		return c.json({ error: "Failed to calculate taxes", details: String(error) }, 500);
	}
});

/**
 * POST /api/ai/analyze-infakt
 * Use AI to analyze InFakt historical data and generate forecast
 */
app.post("/api/ai/analyze-infakt", async (c) => {
	const body = await c.req.json<{
		year: number;
	}>();

	try {
		const { generateObject } = await import("ai");
		const { openai } = await import("@ai-sdk/openai");
		const { createInFaktTool, INFAKT_ANALYSIS_PROMPT } = await import("../app/lib/infakt-tool");
		const { z } = await import("zod");

		// Get API keys from environment (set via wrangler secret)
		const openaiKey = c.env.OPENAI_API_KEY || "";
		const infaktKey = c.env.INFAKT_API_KEY || "";

		if (!openaiKey) {
			return c.json(
				{
					error: "OpenAI API key not configured. Set OPENAI_API_KEY secret via: wrangler secret put OPENAI_API_KEY",
				},
				500,
			);
		}

		if (!infaktKey) {
			return c.json(
				{
					error: "InFakt API key not configured. Set INFAKT_API_KEY secret via: wrangler secret put INFAKT_API_KEY",
				},
				500,
			);
		}

		// Define the expected response schema
		const analysisSchema = z.object({
			revenueForecast: z.object({
				baseline: z.number(),
				trend: z.enum(["growing", "stable", "declining"]),
				confidence: z.enum(["high", "medium", "low"]),
			}),
			fixedCostsForecast: z.object({
				monthlyTotal: z.number(),
				breakdown: z.object({
					servers: z.number(),
					accounting: z.number(),
					software: z.number(),
					other: z.number(),
				}),
			}),
			insights: z.array(z.string()),
			recommendations: z.array(z.string()),
		});

		// Create InFakt tool with server-side API key
		const infaktTool = createInFaktTool(infaktKey);

		// Use AI SDK with tools to analyze InFakt data
		const result = await generateObject({
			model: openai("gpt-4o-mini", { apiKey: openaiKey }),
			prompt: `${INFAKT_ANALYSIS_PROMPT}

Analyze the InFakt data for year ${body.year} using the fetchInFaktData tool.
The InFakt API key is already configured server-side for security.

After fetching the data, provide your analysis in the required JSON format.`,
			schema: analysisSchema,
			tools: {
				fetchInFaktData: infaktTool,
			},
			maxSteps: 5, // Allow tool calling
		});

		return c.json({
			success: true,
			analysis: result.object,
			usage: result.usage,
		});
	} catch (error) {
		console.error("Error analyzing InFakt data:", error);
		return c.json({ error: "Failed to analyze InFakt data", details: String(error) }, 500);
	}
});

/**
 * GET /api/simulations
 * Get all simulation scenarios with summary data
 */
app.get("/api/simulations", async (c) => {
	try {
		const { createDbClient } = await import("../app/db/client");
		const { scenarios, investments } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		// Get all scenarios sorted by creation date (newest first)
		const allScenarios = await db
			.select()
			.from(scenarios)
			.all();

		// Enrich scenarios with investment counts
		const enrichedScenarios = await Promise.all(
			allScenarios.map(async (scenario) => {
				const investmentsList = await db
					.select()
					.from(investments)
					.where(eq(investments.scenarioId, scenario.id))
					.all();

				return {
					...scenario,
					investmentCount: investmentsList.length,
					investments: investmentsList,
				};
			}),
		);

		// Sort by creation date (newest first)
		enrichedScenarios.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		return c.json(enrichedScenarios);
	} catch (error) {
		console.error("Error retrieving simulations:", error);
		return c.json({ error: "Failed to retrieve simulations" }, 500);
	}
});

/**
 * GET /api/tax-config/:year
 * Get tax year configuration
 */
app.get("/api/tax-config/:year", async (c) => {
	const year = parseInt(c.req.param("year"));

	try {
		const { createDbClient } = await import("../app/db/client");
		const { taxYearConfigs } = await import("../app/db/schema");
		const db = createDbClient(c.env.DB);

		const config = await db
			.select()
			.from(taxYearConfigs)
			.where(eq(taxYearConfigs.year, year))
			.get();

		if (!config) {
			return c.json({ error: "Configuration not found" }, 404);
		}

		return c.json(config);
	} catch (error) {
		console.error("Error retrieving tax config:", error);
		return c.json({ error: "Failed to retrieve tax config" }, 500);
	}
});

/**
 * POST /api/tax-config
 * Create or update tax year configuration
 */
app.post("/api/tax-config", async (c) => {
	const body = await c.req.json<any>();

	try {
		const { createDbClient } = await import("../app/db/client");
		const { taxYearConfigs } = await import("../app/db/schema");
		const { v4: uuidv4 } = await import("uuid");
		const db = createDbClient(c.env.DB);

		// Check if config already exists
		const existing = await db
			.select()
			.from(taxYearConfigs)
			.where(eq(taxYearConfigs.year, body.year))
			.get();

		const now = new Date();
		if (existing) {
			// Update
			await db
				.update(taxYearConfigs)
				.set({
					minimumWageGross: body.minimumWageGross,
					averageWagePrognosis: body.averageWagePrognosis,
					averageWageQ4PreviousYear: body.averageWageQ4PreviousYear,
					retirementRate: body.retirementRate,
					disabilityRate: body.disabilityRate,
					accidentRate: body.accidentRate,
					sicknessRate: body.sicknessRate,
					workFundRate: body.workFundRate,
					solidarityFundRate: body.solidarityFundRate,
					healthInsuranceRateSkala: body.healthInsuranceRateSkala,
					healthInsuranceRateLiniowy: body.healthInsuranceRateLiniowy,
					healthInsuranceLimitLinear: body.healthInsuranceLimitLinear,
					updatedAt: now,
				})
				.where(eq(taxYearConfigs.year, body.year));

			return c.json({ id: existing.id, message: "Config updated" });
		} else {
			// Create
			const id = uuidv4();
			await db.insert(taxYearConfigs).values({
				id,
				year: body.year,
				minimumWageGross: body.minimumWageGross,
				averageWagePrognosis: body.averageWagePrognosis,
				averageWageQ4PreviousYear: body.averageWageQ4PreviousYear,
				retirementRate: body.retirementRate ?? 0.1952,
				disabilityRate: body.disabilityRate ?? 0.08,
				accidentRate: body.accidentRate ?? 0.0167,
				sicknessRate: body.sicknessRate ?? 0.0245,
				workFundRate: body.workFundRate ?? 0.0245,
				solidarityFundRate: body.solidarityFundRate ?? 0.0245,
				healthInsuranceRateSkala: body.healthInsuranceRateSkala ?? 0.09,
				healthInsuranceRateLiniowy: body.healthInsuranceRateLiniowy ?? 0.049,
				healthInsuranceLimitLinear: body.healthInsuranceLimitLinear ?? 11_600,
				createdAt: now,
				updatedAt: now,
			});

			return c.json({ id, message: "Config created" });
		}
	} catch (error) {
		console.error("Error saving tax config:", error);
		return c.json({ error: "Failed to save tax config" }, 500);
	}
});

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
