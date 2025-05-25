
'use server';
/**
 * @fileOverview 사용자의 투자 목표에 따라 기술 지표를 추천하는 AI 플로우입니다.
 * - suggestTechnicalIndicators - 기술 지표 추천을 처리하는 함수입니다.
 * - SuggestTechnicalIndicatorsInput - 함수의 입력 유형입니다.
 * - SuggestTechnicalIndicatorsOutput - 함수의 반환 유형입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// StockSignalAnalyzer.tsx의 availableIndicators ID와 일치해야 합니다.
const VALID_INDICATORS = ["BollingerBands", "RSI", "MACD", "Volume"] as const;
export type ValidIndicatorId = typeof VALID_INDICATORS[number];

const SuggestTechnicalIndicatorsInputSchema = z.object({
  userGoal: z.string().min(1, "투자 목표를 입력해주세요.").describe('사용자의 매매 타이밍 또는 투자 목표 설명 (예: "단기 변동성을 활용한 빠른 매매 원함", "장기적 관점에서 저점 매수 희망")'),
});
export type SuggestTechnicalIndicatorsInput = z.infer<typeof SuggestTechnicalIndicatorsInputSchema>;

const SuggestTechnicalIndicatorsOutputSchema = z.object({
  suggestedIndicators: z.array(z.enum(VALID_INDICATORS)).describe('추천된 기술 지표 ID 배열 (예: ["RSI", "MACD"])'),
  reasoning: z.string().optional().describe('AI가 해당 지표들을 추천한 간략한 이유'),
});
export type SuggestTechnicalIndicatorsOutput = z.infer<typeof SuggestTechnicalIndicatorsOutputSchema>;

export async function suggestTechnicalIndicators(input: SuggestTechnicalIndicatorsInput): Promise<SuggestTechnicalIndicatorsOutput> {
  return suggestTechnicalIndicatorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTechnicalIndicatorsPrompt',
  input: { schema: SuggestTechnicalIndicatorsInputSchema },
  output: { schema: SuggestTechnicalIndicatorsOutputSchema },
  prompt: `당신은 사용자의 투자 목표를 분석하여 가장 적합한 기술 지표를 추천하는 AI 금융 전문가입니다.
사용 가능한 기술 지표 목록은 다음과 같습니다: ${VALID_INDICATORS.join(', ')}.
각 지표의 일반적인 특징:
- BollingerBands: 주가의 변동성 채널을 보여주며, 과매수/과매도 상태 또는 추세 전환점을 파악하는 데 사용됩니다. 변동성이 큰 시장에 유용합니다.
- RSI (Relative Strength Index): 주가의 상승 압력과 하락 압력 간의 상대적인 강도를 나타내며, 과매수(보통 70 이상)/과매도(보통 30 이하) 수준을 파악하는 데 주로 사용됩니다.
- MACD (Moving Average Convergence Divergence): 두 이동평균선 간의 관계를 보여주며, 추세의 방향과 강도, 전환 시점을 파악하는 데 사용됩니다. 신호선과의 교차(골든크로스, 데드크로스)가 중요한 신호입니다.
- Volume (거래량 분석): 주가 변동의 신뢰도를 판단하는 데 중요합니다. 주가 상승 시 거래량 증가는 강세 신호로, 주가 하락 시 거래량 증가는 약세 신호로 해석될 수 있습니다.

사용자 투자 목표: "{{{userGoal}}}"

위 사용자 목표를 고려하여, 다음 기준에 따라 기술 지표를 추천해주세요:
1.  목록에서 2~3개의 가장 관련성 높은 기술 지표 ID를 'suggestedIndicators' 배열에 포함하여 추천합니다.
2.  왜 해당 지표들을 추천했는지 간략한 이유를 'reasoning' 필드에 한국어로 작성합니다.

결과는 반드시 SuggestTechnicalIndicatorsOutputSchema JSON 형식에 맞춰야 합니다.
예시: 사용자가 "단기 변동성을 활용하여 빠르게 수익을 내고 싶어요."라고 입력하면, {"suggestedIndicators": ["BollingerBands", "RSI"], "reasoning": "단기 변동성 매매에는 볼린저밴드로 변동폭을 확인하고 RSI로 과매수/과매도 시점을 파악하는 것이 유용합니다."} 와 같이 응답할 수 있습니다.
`,
});

const suggestTechnicalIndicatorsFlow = ai.defineFlow(
  {
    name: 'suggestTechnicalIndicatorsFlow',
    inputSchema: SuggestTechnicalIndicatorsInputSchema,
    outputSchema: SuggestTechnicalIndicatorsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // AI가 간혹 빈 배열을 반환할 수 있으므로, 최소 1개는 추천하도록 유도하거나 후처리 필요 (현재는 AI 응답 존중)
    return output!;
  }
);
