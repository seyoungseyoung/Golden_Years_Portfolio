"use server";

import { generateInvestmentStrategy, type InvestmentStrategyInput, type InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import { z } from 'zod';

// Re-define schema here to ensure server-side validation before calling AI flow
const QuestionnaireFormSchema = z.object({
  retirementHorizon: z.string().min(1, "Retirement horizon is required."),
  cashFlowNeeds: z.string().min(1, "Cash flow needs are required."),
  assetSize: z.string().min(1, "Asset size is required."),
  taxSensitivity: z.string().min(1, "Tax sensitivity is required."),
  themePreference: z.string().min(1, "Theme preference is required."),
  managementStyle: z.string().min(1, "Management style is required."),
  otherAssets: z.string().optional(), // Optional, can be empty
  riskTolerance: z.string().min(1, "Risk tolerance is required."),
});


export async function handleGenerateStrategyAction(
  data: InvestmentStrategyInput
): Promise<{ success: boolean; data?: InvestmentStrategyOutput; error?: string; fieldErrors?: z.ZodIssue[] }> {
  const validationResult = QuestionnaireFormSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: "Validation failed.", fieldErrors: validationResult.error.issues };
  }

  try {
    const strategy = await generateInvestmentStrategy(validationResult.data);
    return { success: true, data: strategy };
  } catch (error) {
    console.error("Error generating investment strategy:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred while generating the strategy." };
  }
}
