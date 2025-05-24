// src/ai/flows/generate-investment-strategy.ts
'use server';
/**
 * @fileOverview 사용자 설문 조사 응답을 기반으로 맞춤형 투자 전략을 생성합니다.
 *
 * - generateInvestmentStrategy - 투자 전략을 생성하는 함수입니다.
 * - InvestmentStrategyInput - generateInvestmentStrategy 함수의 입력 유형입니다.
 * - InvestmentStrategyOutput - generateInvestmentStrategy 함수의 반환 유형입니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentStrategyInputSchema = z.object({
  retirementHorizon: z.string().describe('은퇴까지 몇 년 남았습니까? 예: 이미 은퇴, 5년, 20년 이상'),
  cashFlowNeeds: z.string().describe('월 소득이 필요합니까? 그렇다면 얼마입니까? 예: 아니오, 월 100만원, 월 500만원 이상'),
  assetSize: z.string().describe('투자 자산 규모는 얼마입니까? 예: 5천만원, 1억원, 10억원 이상'),
  taxSensitivity: z.string().describe('세금에 민감하십니까? 예: 예, 아니오'),
  themePreference: z.string().describe('어떤 투자 테마를 선호하십니까? 예: 배당, 성장, ESG, 국내/해외'),
  managementStyle: z.string().describe('투자를 얼마나 적극적으로 관리하고 싶으십니까? 예: 적극적, 소극적/자동화'),
  otherAssets: z.string().describe('연금이나 부동산과 같은 다른 자산이 있습니까? 예: 예(연금), 예(부동산), 아니오'),
  riskTolerance: z.string().describe('위험 감수 수준은 어느 정도입니까? 예: 보수적, 보통, 공격적'),
});
export type InvestmentStrategyInput = z.infer<typeof InvestmentStrategyInputSchema>;

const InvestmentStrategyOutputSchema = z.object({
  assetAllocation: z.string().describe('추천 자산 배분 비율 (주식/채권/현금/대안 투자).'),
  etfRecommendations: z.string().describe('특정 ETF 또는 주식 추천.'),
  tradingStrategy: z.string().describe('추천 거래 전략 (예: 커버드 콜, 리밸런싱 규칙).'),
  explanation: z.string().describe('이 전략이 사용자에게 적합한 이유에 대한 설명.'),
});
export type InvestmentStrategyOutput = z.infer<typeof InvestmentStrategyOutputSchema>;

export async function generateInvestmentStrategy(input: InvestmentStrategyInput): Promise<InvestmentStrategyOutput> {
  return generateInvestmentStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentStrategyPrompt',
  input: {schema: InvestmentStrategyInputSchema},
  output: {schema: InvestmentStrategyOutputSchema},
  prompt: `당신은 사용자 프로필을 기반으로 맞춤형 투자 전략을 제공하는 전문 금융 자문가입니다.

  다음 질문에 대한 사용자 답변을 분석하여 적절한 투자 전략을 생성하십시오.

  은퇴 시기: {{{retirementHorizon}}}
  현금 흐름 필요성: {{{cashFlowNeeds}}}
  자산 규모: {{{assetSize}}}
  세금 민감도: {{{taxSensitivity}}}
  투자 테마 선호도: {{{themePreference}}}
  관리 스타일: {{{managementStyle}}}
  기타 자산: {{{otherAssets}}}
  위험 감수 수준: {{{riskTolerance}}}

  이러한 답변을 바탕으로 다음을 추천합니다:
  1.  자산 배분 (주식/채권/현금/대안 투자).
  2.  특정 ETF 또는 주식 추천.
  3.  거래 전략 (예: 커버드 콜, 리밸런싱 규칙).
  4.  이 전략이 사용자에게 적합한 이유에 대한 간략한 설명.

  명확하고 간결하게 답변을 작성하십시오.
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
