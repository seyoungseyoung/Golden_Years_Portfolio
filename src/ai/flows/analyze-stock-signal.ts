'use server';
/**
 * @fileOverview 주식 데이터 및 기술 지표를 기반으로 매수/매도 신호를 분석하는 AI 플로우입니다.
 *
 * - analyzeStockSignal - 주식 매수/매도 신호 분석을 처리하는 함수입니다.
 * - AnalyzeStockSignalInput - analyzeStockSignal 함수의 입력 유형입니다.
 * - AnalyzeStockSignalOutput - analyzeStockSignal 함수의 반환 유형입니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// 모의 주가 데이터를 반환하는 도구 정의
const getStockDataTool = ai.defineTool(
  {
    name: 'getStockData',
    description: '지정된 티커에 대한 모의 과거 주가 데이터를 반환합니다. 실제 시장 데이터가 아닌 시뮬레이션용입니다.',
    inputSchema: z.object({
      ticker: z.string().describe('주식 티커 심볼 (예: AAPL, MSFT, GOOG).'),
    }),
    outputSchema: z.object({
      prices: z.array(
        z.object({
          date: z.string().describe('날짜 (YYYY-MM-DD)'),
          close: z.number().describe('종가'),
          volume: z.number().describe('거래량'),
        })
      ).describe('과거 가격 및 거래량 데이터 배열'),
      error: z.string().optional().describe('데이터 조회 중 오류 발생 시 메시지'),
    }),
  },
  async ({ticker}) => {
    // 실제 API 호출 대신 모의 데이터 반환
    const mockData: Record<string, Array<{date: string; close: number; volume: number}>> = {
      AAPL: [
        {date: '2024-07-01', close: 170.0, volume: 1000000},
        {date: '2024-07-02', close: 172.5, volume: 1200000},
        {date: '2024-07-03', close: 171.0, volume: 900000},
        {date: '2024-07-04', close: 175.0, volume: 1500000},
        {date: '2024-07-05', close: 173.0, volume: 1100000},
        {date: '2024-07-08', close: 178.0, volume: 1800000},
        {date: '2024-07-09', close: 180.5, volume: 2000000},
        {date: '2024-07-10', close: 179.0, volume: 1700000},
      ],
      MSFT: [
        {date: '2024-07-01', close: 450.0, volume: 800000},
        {date: '2024-07-02', close: 455.2, volume: 950000},
        {date: '2024-07-03', close: 452.0, volume: 700000},
        {date: '2024-07-04', close: 460.0, volume: 1200000},
        {date: '2024-07-05', close: 458.5, volume: 1000000},
        {date: '2024-07-08', close: 465.0, volume: 1400000},
        {date: '2024-07-09', close: 468.0, volume: 1600000},
        {date: '2024-07-10', close: 466.5, volume: 1300000},
      ],
      GOOG: [
        {date: '2024-07-01', close: 180.0, volume: 1100000},
        {date: '2024-07-02', close: 182.0, volume: 1300000},
        {date: '2024-07-03', close: 181.5, volume: 950000},
        {date: '2024-07-04', close: 185.0, volume: 1600000},
        {date: '2024-07-05', close: 183.0, volume: 1200000},
        {date: '2024-07-08', close: 188.0, volume: 1900000},
        {date: '2024-07-09', close: 190.0, volume: 2100000},
        {date: '2024-07-10', close: 189.0, volume: 1800000},
      ],
    };
    const tickerUpper = ticker.toUpperCase();
    if (mockData[tickerUpper]) {
      return {prices: mockData[tickerUpper]};
    }
    return {prices: [], error: `티커 '${ticker}'에 대한 모의 데이터를 찾을 수 없습니다.`};
  }
);


const AnalyzeStockSignalInputSchema = z.object({
  ticker: z.string().min(1, "티커를 입력해주세요.").describe('분석할 주식 종목 코드 (예: AAPL, MSFT, GOOG)'),
  indicators: z.array(z.string()).min(1, "하나 이상의 기술 지표를 선택해주세요.").describe("선택된 기술 지표 배열 (예: ['RSI', 'BollingerBands', 'MACD', 'Volume'])"),
  riskTolerance: z.string().describe("사용자의 위험 감수 수준 (예: 보수적, 중립적, 공격적)"),
});
export type AnalyzeStockSignalInput = z.infer<typeof AnalyzeStockSignalInputSchema>;

const AnalyzeStockSignalOutputSchema = z.object({
  signal: z.string().describe('추천 매매 신호 (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")'),
  explanation: z.string().describe('추천 신호에 대한 기술적 분석 및 사용자 프로필 기반 설명. 사용된 지표와 그 해석을 포함해야 합니다.'),
  confidence: z.string().optional().describe('신호에 대한 확신 수준 (예: 높음, 중간, 낮음)'),
  indicatorSummary: z.record(z.string()).optional().describe('각 선택된 지표에 대한 간략한 해석'),
});
export type AnalyzeStockSignalOutput = z.infer<typeof AnalyzeStockSignalOutputSchema>;

export async function analyzeStockSignal(input: AnalyzeStockSignalInput): Promise<AnalyzeStockSignalOutput> {
  return analyzeStockSignalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStockSignalPrompt',
  input: {schema: AnalyzeStockSignalInputSchema},
  output: {schema: AnalyzeStockSignalOutputSchema},
  tools: [getStockDataTool],
  system: `당신은 사용자의 투자 성향과 선택된 기술 지표를 바탕으로 주식 매매 신호를 분석하는 AI 금융 분석가입니다. 
  제공되는 주가 데이터는 실제 시장 데이터가 아닌 모의 데이터임을 인지하고 답변해야 합니다. 
  사용자에게 이 점을 명확히 전달하고, 분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  먼저, getStockData 도구를 사용해 {{{ticker}}}의 모의 주가 데이터를 가져오세요.
  가져온 데이터와 선택된 기술 지표 ({{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}})를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호**: (예: "매수 고려", "관망", "데이터 부족으로 분석 불가")
  2.  **설명**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요. (예: "RSI 지표가 30 이하로 과매도 구간에 진입하여 단기적 반등 가능성이 있습니다.", "볼린저 밴드 하단을 터치 후 반등하는 모습을 보여 매수 고려 시점으로 볼 수 있습니다.")
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요.
      *   이 분석은 모의 데이터에 기반한 것이며, 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준** (선택 사항): 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약** (선택 사항): 각 지표가 나타내는 간략한 신호 또는 상태.

  만약 데이터가 부족하거나 분석이 어렵다면, "분석 불가" 또는 "데이터 부족"으로 명확히 답변해주세요.
  결과는 반드시 AnalyzeStockSignalOutputSchema 형식에 맞춰주세요.
  `,
});

const analyzeStockSignalFlow = ai.defineFlow(
  {
    name: 'analyzeStockSignalFlow',
    inputSchema: AnalyzeStockSignalInputSchema,
    outputSchema: AnalyzeStockSignalOutputSchema,
  },
  async (input) => {
    // 입력 받은 티커를 대문자로 변환하여 일관성 유지
    const processedInput = { ...input, ticker: input.ticker.toUpperCase() };
    const {output} = await prompt(processedInput);
    
    if (!output) {
        return {
            signal: "분석 오류",
            explanation: "AI 모델로부터 유효한 응답을 받지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.",
            confidence: "낮음"
        };
    }
    return output;
  }
);
