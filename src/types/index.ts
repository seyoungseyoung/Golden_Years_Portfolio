// src/types/index.ts
import type { InvestmentStrategyInput, InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesInput, SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import type { AnalyzeStockSignalInput, AnalyzeStockSignalOutput } from '@/ai/flows/analyze-stock-signal';

export type {
  InvestmentStrategyInput,
  InvestmentStrategyOutput,
  SummarizeMarketChangesInput,
  SummarizeMarketChangesOutput,
  AnalyzeStockSignalInput,
  AnalyzeStockSignalOutput,
};

export interface QuestionnaireAnswers extends InvestmentStrategyInput {}
