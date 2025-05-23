// src/ai/flows/generate-investment-strategy.ts
'use server';
/**
 * @fileOverview Generates a personalized investment strategy based on user's questionnaire responses.
 *
 * - generateInvestmentStrategy - A function that generates the investment strategy.
 * - InvestmentStrategyInput - The input type for the generateInvestmentStrategy function.
 * - InvestmentStrategyOutput - The return type for the generateInvestmentStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentStrategyInputSchema = z.object({
  retirementHorizon: z.string().describe('How many years until retirement? e.g., Already retired, 5 years, 20+ years'),
  cashFlowNeeds: z.string().describe('Do you need monthly income? If so, how much? e.g., No, $1000/month, $5000+/month'),
  assetSize: z.string().describe('What is the size of your investment assets? e.g., $10,000, $100,000, $1,000,000+'),
  taxSensitivity: z.string().describe('Are you tax-sensitive? e.g., Yes, No'),
  themePreference: z.string().describe('What investment themes do you prefer? e.g., Dividends, Growth, ESG, Domestic/International'),
  managementStyle: z.string().describe('How actively do you want to manage your investments? e.g., Active, Passive/Automated'),
  otherAssets: z.string().describe('Do you have other assets like a pension or real estate? e.g., Yes (pension), Yes (real estate), No'),
  riskTolerance: z.string().describe('What is your risk tolerance? e.g., Conservative, Moderate, Aggressive'),
});
export type InvestmentStrategyInput = z.infer<typeof InvestmentStrategyInputSchema>;

const InvestmentStrategyOutputSchema = z.object({
  assetAllocation: z.string().describe('Recommended asset allocation percentages (stocks/bonds/cash/alternatives).'),
  etfRecommendations: z.string().describe('Specific ETF or stock recommendations.'),
  tradingStrategy: z.string().describe('Recommended trading strategy (e.g., covered call, rebalancing rules).'),
  explanation: z.string().describe('Explanation of why this strategy is suitable for the user.'),
});
export type InvestmentStrategyOutput = z.infer<typeof InvestmentStrategyOutputSchema>;

export async function generateInvestmentStrategy(input: InvestmentStrategyInput): Promise<InvestmentStrategyOutput> {
  return generateInvestmentStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentStrategyPrompt',
  input: {schema: InvestmentStrategyInputSchema},
  output: {schema: InvestmentStrategyOutputSchema},
  prompt: `You are an expert financial advisor who provides personalized investment strategies based on a user's profile.

  Analyze the user's responses to the following questions to generate an appropriate investment strategy.

  Retirement Horizon: {{{retirementHorizon}}}
  Cash Flow Needs: {{{cashFlowNeeds}}}
  Asset Size: {{{assetSize}}}
  Tax Sensitivity: {{{taxSensitivity}}}
  Theme Preference: {{{themePreference}}}
  Management Style: {{{managementStyle}}}
  Other Assets: {{{otherAssets}}}
  Risk Tolerance: {{{riskTolerance}}}

  Based on these responses, recommend:
  1.  An asset allocation (stocks/bonds/cash/alternatives).
  2.  Specific ETF or stock recommendations.
  3.  A trading strategy (e.g., covered call, rebalancing rules).
  4.  A short explanation of why this strategy is suitable for the user.

  Format your response clearly and concisely.
  `,
});

const generateInvestmentStrategyFlow = ai.defineFlow(
  {
    name: 'generateInvestmentStrategyFlow',
    inputSchema: InvestmentStrategyInputSchema,
    outputSchema: InvestmentStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
