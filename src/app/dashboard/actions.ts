"use server";

import { summarizeMarketChanges, type SummarizeMarketChangesInput, type SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
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
    // Consider joining multiple error messages if needed
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
