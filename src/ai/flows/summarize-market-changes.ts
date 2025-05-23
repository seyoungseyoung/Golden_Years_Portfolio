'use server';

/**
 * @fileOverview Summarizes market changes and suggests actions for the user to take.
 *
 * - summarizeMarketChanges - A function that summarizes market changes and suggests actions.
 * - SummarizeMarketChangesInput - The input type for the summarizeMarketChanges function.
 * - SummarizeMarketChangesOutput - The return type for the summarizeMarketChanges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMarketChangesInputSchema = z.object({
  portfolio: z
    .string()
    .describe('The user portfolio, including asset allocation and specific holdings.'),
  marketNews: z.string().describe('The latest market news and trends.'),
});
export type SummarizeMarketChangesInput = z.infer<typeof SummarizeMarketChangesInputSchema>;

const SummarizeMarketChangesOutputSchema = z.object({
  summary: z.string().describe('A summary of the market changes.'),
  suggestedAction: z
    .string()
    .describe('A suggested action for the user to take based on the market changes.'),
  reasoning: z.string().describe('The reasoning behind the suggested action.'),
});
export type SummarizeMarketChangesOutput = z.infer<typeof SummarizeMarketChangesOutputSchema>;

export async function summarizeMarketChanges(input: SummarizeMarketChangesInput): Promise<SummarizeMarketChangesOutput> {
  return summarizeMarketChangesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMarketChangesPrompt',
  input: {schema: SummarizeMarketChangesInputSchema},
  output: {schema: SummarizeMarketChangesOutputSchema},
  prompt: `You are a financial advisor who summarizes market changes and suggests actions for the user to take based on those changes.

  Portfolio: {{{portfolio}}}
  Market News: {{{marketNews}}}

  Summary:
  Suggested Action:
  Reasoning: `,
});

const summarizeMarketChangesFlow = ai.defineFlow(
  {
    name: 'summarizeMarketChangesFlow',
    inputSchema: SummarizeMarketChangesInputSchema,
    outputSchema: SummarizeMarketChangesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
