// src/types/index.ts
import type { InvestmentStrategyInput, InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesInput, SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import type { AnalyzeStockSignalInput, AnalyzeStockSignalOutput as GenkitAnalyzeStockSignalOutput } from '@/ai/flows/analyze-stock-signal';

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface SignalEventPoint {
  date: string;
  type: "buy" | "sell" | "hold";
  price: number;
  indicator?: string;
}

// Genkit 플로우에서 반환되는 스키마와 일치시키면서, 프론트엔드에서 사용할 때 필드 타입을 명확히 합니다.
export interface AnalyzeStockSignalOutput extends GenkitAnalyzeStockSignalOutput {
  chartData?: ChartDataPoint[];
  signalEvents?: SignalEventPoint[];
}


export type {
  InvestmentStrategyInput,
  InvestmentStrategyOutput,
  SummarizeMarketChangesInput,
  SummarizeMarketChangesOutput,
  AnalyzeStockSignalInput,
};

export interface QuestionnaireAnswers extends InvestmentStrategyInput {}
