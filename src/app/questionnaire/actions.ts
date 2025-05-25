// src/app/questionnaire/actions.ts
"use server";

import { generateInvestmentStrategy, type InvestmentStrategyInput, type InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import { z } from 'zod';

// Re-define schema here to ensure server-side validation before calling AI flow
const QuestionnaireFormSchema = z.object({
  retirementHorizon: z.string().min(1, "은퇴 시기는 필수 항목입니다."),
  cashFlowNeeds: z.string().min(1, "현금 흐름 필요성은 필수 항목입니다."),
  assetSize: z.string().min(1, "자산 규모는 필수 항목입니다."),
  taxSensitivity: z.string().min(1, "세금 민감도는 필수 항목입니다."),
  themePreference: z.string().min(1, "투자 테마 선호도는 필수 항목입니다."),
  investmentRegionPreference: z.string().min(1, "투자 지역 선호도는 필수 항목입니다."), // 새로 추가된 필드
  managementStyle: z.string().min(1, "관리 스타일은 필수 항목입니다."),
  otherAssets: z.string().optional(), // Optional, can be empty
  riskTolerance: z.string().min(1, "위험 감수 수준은 필수 항목입니다."),
});


export async function handleGenerateStrategyAction(
  data: InvestmentStrategyInput
): Promise<{ success: boolean; data?: InvestmentStrategyOutput; error?: string; fieldErrors?: z.ZodIssue[] }> {
  const validationResult = QuestionnaireFormSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, error: "유효성 검사에 실패했습니다.", fieldErrors: validationResult.error.issues };
  }

  try {
    const strategy = await generateInvestmentStrategy(validationResult.data);
    return { success: true, data: strategy };
  } catch (error) {
    console.error("Error generating investment strategy:", error);
    return { success: false, error: error instanceof Error ? error.message : "전략 생성 중 알 수 없는 오류가 발생했습니다." };
  }
}
