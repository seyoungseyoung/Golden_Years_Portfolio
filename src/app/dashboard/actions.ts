"use server";

import { summarizeMarketChanges, type SummarizeMarketChangesInput, type SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import { z } from 'zod';

const MarketChangesSchema = z.object({
  portfolio: z.string().min(1, "Portfolio details are required."),
  marketNews: z.string().min(1, "Market news is required."),
});

export async function handleSummarizeMarketChangesAction(
  data: SummarizeMarketChangesInput
): Promise<{ success: boolean; data?: SummarizeMarketChangesOutput; error?: string }> {
  const validationResult = MarketChangesSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: "Validation failed. Ensure portfolio and market news are provided." };
  }

  try {
    const summary = await summarizeMarketChanges(validationResult.data);
    return { success: true, data: summary };
  } catch (error) {
    console.error("Error summarizing market changes:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred while summarizing market changes." };
  }
}
