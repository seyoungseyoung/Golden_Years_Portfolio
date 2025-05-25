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
  investmentRegionPreference: z.string().describe('어느 국가/지역의 주식에 주로 투자하고 싶으신가요? 예: 국내 주식 중심, 미국 주식 중심, 글로벌 분산 투자'), // 새로 추가된 필드
  managementStyle: z.string().describe('투자를 얼마나 적극적으로 관리하고 싶으십니까? 예: 적극적, 소극적/자동화'),
  otherAssets: z.string().describe('연금이나 부동산과 같은 다른 자산이 있습니까? 예: 예(연금), 예(부동산), 아니오'),
  riskTolerance: z.string().describe('위험 감수 수준은 어느 정도입니까? 예: 보수적, 보통, 공격적'),
});
export type InvestmentStrategyInput = z.infer<typeof InvestmentStrategyInputSchema>;

const InvestmentStrategyOutputSchema = z.object({
  assetAllocation: z.string().describe('추천 자산 배분 비율 (주식/채권/현금/대안 투자).'),
  etfRecommendations: z.string().describe("사용자의 프로필에 맞춰 추천하는 구체적인 ETF 또는 주식 예시 (가상 티커 및 추천 사유 포함). Markdown 형식을 사용하여 가독성을 높일 수 있습니다."),
  tradingStrategy: z.string().describe('추천 거래 전략 (예: 커버드 콜, 리밸런싱 규칙).'),
  explanation: z.string().describe('이 전략이 사용자에게 적합한 이유에 대한 설명.'),
  riskTolerance: z.string().describe('사용자가 입력한 위험 감수 수준 (예: 보수적, 보통, 공격적). 이 값은 입력된 값을 그대로 반환해야 합니다.'),
});
export type InvestmentStrategyOutput = z.infer<typeof InvestmentStrategyOutputSchema>;

export async function generateInvestmentStrategy(input: InvestmentStrategyInput): Promise<InvestmentStrategyOutput> {
  const result = await generateInvestmentStrategyFlow(input);
  if (!result.riskTolerance && input.riskTolerance) {
    return { ...result, riskTolerance: input.riskTolerance };
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'investmentStrategyPrompt',
  input: {schema: InvestmentStrategyInputSchema},
  output: {schema: InvestmentStrategyOutputSchema},
  prompt: `당신은 사용자 프로필을 기반으로 맞춤형 투자 전략을 제공하는 전문 금융 자문가입니다.

  다음 질문에 대한 사용자 답변을 분석하여 적절한 투자 전략을 InvestmentStrategyOutputSchema 형식에 맞춰 생성하십시오.

  은퇴 시기: {{{retirementHorizon}}}
  현금 흐름 필요성: {{{cashFlowNeeds}}}
  자산 규모: {{{assetSize}}}
  세금 민감도: {{{taxSensitivity}}}
  투자 테마 선호도: {{{themePreference}}}
  투자 지역 선호도: {{{investmentRegionPreference}}}
  관리 스타일: {{{managementStyle}}}
  기타 자산: {{{otherAssets}}}
  위험 감수 수준: {{{riskTolerance}}}

  이러한 답변을 바탕으로 다음을 추천합니다:
  1.  자산 배분 (주식/채권/현금/대안 투자).
  2.  특정 ETF 또는 주식 추천 (etfRecommendations):
      *   사용자의 투자 테마 선호도 ({{{themePreference}}}), 투자 지역 선호도 ({{{investmentRegionPreference}}}), 그리고 위험 감수 수준 ({{{riskTolerance}}})을 종합적으로 고려하여, 2-3가지 구체적인 ETF 상품 예를 제시해주세요. 각 ETF에 대해 (가상) 티커 심볼과 함께 추천 이유를 간략히 설명해주세요. (예: KODEX 배당성장 (Ticker: 000001): 국내 배당 성장주에 투자하며 안정적인 현금 흐름을 추구합니다. '국내 주식 중심' 선호에 부합.)
      *   만약 사용자의 프로필에 매우 적합하다고 판단될 경우, 1-2가지 개별 주식 예를 (가상) 티커 심볼과 함께 제시할 수 있습니다. 개별 주식 추천 시에는 '개별 주식 투자는 추가적인 깊이 있는 분석이 필요합니다'라는 주의 문구를 포함해주세요. (예: 삼성전자 (Ticker: 005930): 대표적인 우량주로 안정적 배당과 장기 성장 가능성이 있습니다. '국내 주식 중심' 선호 시 고려. (주의: 개별 주식 투자는 추가적인 깊이 있는 분석이 필요합니다))
      *   결과는 명확하게 구분되어 읽기 쉽게, 예를 들어 Markdown 불릿 포인트를 사용하여 작성해주세요. 이 추천은 예시이며 실제 투자 조언이 아님을 명심하세요.
  3.  거래 전략 (예: 커버드 콜, 리밸런싱 규칙).
  4.  이 전략이 사용자에게 적합한 이유에 대한 간략한 설명.
  5.  사용자가 입력한 위험 감수 수준 (riskTolerance 필드에 입력된 값을 그대로 포함).

  명확하고 간결하게 답변을 작성하십시오. 결과는 반드시 InvestmentStrategyOutputSchema 형식에 맞춰야 합니다.
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
    if (output && !output.riskTolerance && input.riskTolerance) {
      return { ...output, riskTolerance: input.riskTolerance };
    }
    return output!;
  }
);
