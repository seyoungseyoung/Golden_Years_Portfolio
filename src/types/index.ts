import type { InvestmentStrategyInput, InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesInput, SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';

export type {
  InvestmentStrategyInput,
  InvestmentStrategyOutput,
  SummarizeMarketChangesInput,
  SummarizeMarketChangesOutput,
};

export interface QuestionnaireAnswers extends InvestmentStrategyInput {}
