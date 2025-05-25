
// src/app/dashboard/actions.ts
"use server";

import { summarizeMarketChanges, type SummarizeMarketChangesInput, type SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import { analyzeStockSignal, type AnalyzeStockSignalInput, type AnalyzeStockSignalOutput } from '@/ai/flows/analyze-stock-signal';
import { suggestTechnicalIndicators, type SuggestTechnicalIndicatorsInput, type SuggestTechnicalIndicatorsOutput } from '@/ai/flows/suggest-technical-indicators';
import { z } from 'zod';

const MarketChangesSchema = z.object({
  portfolio: z.string().min(1, "포트폴리오 세부 정보는 필수입니다."),
  marketNews: z.string().min(1, "시장 뉴스는 필수입니다."),
});

export async function handleSummarizeMarketChangesAction(
  data: SummarizeMarketChangesInput
): Promise<{ success: boolean; data?: SummarizeMarketChangesOutput; error?: string }> {
  const validationResult = MarketChangesSchema.safeParse(data);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: `유효성 검사에 실패했습니다: ${errorMessage}` };
  }

  try {
    const summary = await summarizeMarketChanges(validationResult.data);
    return { success: true, data: summary };
  } catch (error) {
    console.error("Error summarizing market changes:", error);
    return { success: false, error: error instanceof Error ? error.message : "시장 변경 사항을 요약하는 중 알 수 없는 오류가 발생했습니다." };
  }
}

const StockSignalSchema = z.object({
  ticker: z.string().min(1, "주식 티커는 필수입니다.").max(10, "티커는 10자를 초과할 수 없습니다."),
  indicators: z.array(z.string()).min(1, "하나 이상의 기술 지표를 선택해야 합니다."),
  riskTolerance: z.string().min(1, "위험 감수 수준 정보가 필요합니다."),
  customTimingPrompt: z.string().optional(), // 사용자 정의 매매 전략/타이밍 필드 추가
});

export async function handleAnalyzeStockSignalAction(
  data: AnalyzeStockSignalInput
): Promise<{ success: boolean; data?: AnalyzeStockSignalOutput; error?: string; fieldErrors?: z.ZodIssue[] }> {
  const validationResult = StockSignalSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: "유효성 검사에 실패했습니다.", fieldErrors: validationResult.error.issues };
  }

  try {
    const analysisResult = await analyzeStockSignal(validationResult.data);
    return { success: true, data: analysisResult };
  } catch (error) {
    console.error("Error analyzing stock signal:", error);
    return { success: false, error: error instanceof Error ? error.message : "주식 신호 분석 중 알 수 없는 오류가 발생했습니다." };
  }
}

const SuggestIndicatorsSchema = z.object({
  userGoal: z.string().min(1, "투자 목표는 필수입니다."),
});

export async function handleSuggestIndicatorsAction(
  data: SuggestTechnicalIndicatorsInput
): Promise<{ success: boolean; data?: SuggestTechnicalIndicatorsOutput; error?: string; fieldErrors?: z.ZodIssue[] }> {
  const validationResult = SuggestIndicatorsSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: "유효성 검사에 실패했습니다.", fieldErrors: validationResult.error.issues };
  }

  try {
    const suggestions = await suggestTechnicalIndicators(validationResult.data);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("Error suggesting technical indicators:", error);
    return { success: false, error: error instanceof Error ? error.message : "기술 지표 추천 중 알 수 없는 오류가 발생했습니다." };
  }
}
