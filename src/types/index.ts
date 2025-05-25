// src/types/index.ts
import type { InvestmentStrategyInput, InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesInput, SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import type { AnalyzeStockSignalInput, AnalyzeStockSignalOutput as GenkitAnalyzeStockSignalOutput } from '@/ai/flows/analyze-stock-signal';

// AnalyzeStockSignalOutput 타입을 확장하여 chartData와 signalEvents를 명시적으로 포함하도록 합니다.
// Genkit 플로우에서 반환되는 스키마와 일치시키면서, 프론트엔드에서 사용할 때 이 필드들이 존재할 수 있음을 타입으로 보장합니다.
export interface AnalyzeStockSignalOutput extends GenkitAnalyzeStockSignalOutput {
  chartData?: Array<{
    date: string;
    open?: number;
    high?: number;
    low?: number;
    close: number;
    volume?: number;
  }>;
  signalEvents?: Array<{
    date: string;
    type: "buy" | "sell" | "hold";
    price: number;
    indicator?: string;
  }>;
}


export type {
  InvestmentStrategyInput,
  InvestmentStrategyOutput,
  SummarizeMarketChangesInput,
  SummarizeMarketChangesOutput,
  AnalyzeStockSignalInput,
  // AnalyzeStockSignalOutput, // 위에서 확장된 타입을 사용하므로 주석 처리 또는 수정
};

export interface QuestionnaireAnswers extends InvestmentStrategyInput {}

