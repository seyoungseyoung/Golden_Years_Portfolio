
'use server';
/**
 * @fileOverview 주식 데이터 및 기술 지표를 기반으로 매수/매도 신호를 분석하는 AI 플로우입니다.
 *
 * - analyzeStockSignal - 주식 매수/매도 신호를 분석하는 함수입니다.
 * - AnalyzeStockSignalInput - analyzeStockSignal 함수의 입력 유형입니다.
 * - AnalyzeStockSignalOutput - analyzeStockSignal 함수의 반환 유형입니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getStockData, type StockData, type StockDataResponse } from '@/services/stock-data-service';

const getStockDataTool = ai.defineTool(
  {
    name: 'getStockData',
    description: '지정된 티커에 대한 과거 1년치 주가 데이터를 가져옵니다.',
    inputSchema: z.object({
      ticker: z.string().describe('주식 티커 심볼 (예: AAPL, MSFT, GOOG, 005930.KS).'),
    }),
    outputSchema: z.object({
      prices: z.array(
        z.object({
          date: z.string(),
          open: z.number().optional(),
          high: z.number().optional(),
          low: z.number().optional(),
          close: z.number(),
          volume: z.number().optional(),
        })
      ),
      error: z.string().optional(),
    }),
  },
  async ({ticker}): Promise<StockDataResponse> => {
    return getStockData(ticker);
  }
);


const AnalyzeStockSignalInputSchema = z.object({
  ticker: z.string().min(1, "티커를 입력해주세요.").describe('분석할 주식 종목 코드 (예: AAPL, MSFT, GOOG, 005930.KS)'),
  indicators: z.array(z.string()).min(1, "하나 이상의 기술 지표를 선택해주세요.").describe("선택된 기술 지표 배열 (예: ['RSI', 'BollingerBands', 'MACD', 'Volume'])"),
  riskTolerance: z.string().describe("사용자의 위험 감수 수준 (예: 보수적, 중립적, 공격적)"),
  customTimingPrompt: z.string().optional().describe("사용자가 입력한 선호하는 매매 전략 또는 타이밍 설명 (예: '단기 변동성 매매 원함')"),
});
export type AnalyzeStockSignalInput = z.infer<typeof AnalyzeStockSignalInputSchema>;

const AnalyzeStockSignalOutputSchema = z.object({
  signal: z.string().describe('추천 매매 신호 (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")'),
  explanation: z.string().describe('추천 신호에 대한 기술적 분석 및 사용자 프로필 기반 설명. 사용된 지표와 그 해석을 포함해야 합니다.'),
  confidence: z.string().optional().describe('신호에 대한 확신 수준 (예: 높음, 중간, 낮음)'),
  indicatorSummary: z.record(z.string()).optional().describe('각 선택된 지표에 대한 간략한 해석 (예: {"RSI": "과매도 상태", "MACD": "골든 크로스 임박"})'),
  chartData: z.array(
    z.object({
      date: z.string().describe("날짜 (YYYY-MM-DD)"),
      open: z.number().optional().describe("시가"),
      high: z.number().optional().describe("고가"),
      low: z.number().optional().describe("저가"),
      close: z.number().describe("종가"),
      volume: z.number().optional().describe("거래량"),
    })
  ).optional().describe("차트 표시에 사용될 과거 주가 데이터. getStockDataTool에서 받은 데이터를 기반으로 제공."),
  signalEvents: z.array(
    z.object({
      date: z.string().describe("신호 발생 날짜 (YYYY-MM-DD). chartData에 포함된 날짜여야 함."),
      type: z.enum(["buy", "sell", "hold"]).describe("신호 유형 (매수, 매도, 관망)"),
      price: z.number().describe("신호 발생 시점의 가격 (해당 날짜의 종가)"),
      indicator: z.string().optional().describe("이 신호를 트리거한 주요 지표 또는 근거. 예: 'RSI 과매도', '볼린저밴드 하단 터치', 'MACD 골든크로스 및 거래량 증가'"),
    })
  ).optional().describe("차트에 화살표 등으로 표시할 주요 매매 신호 이벤트 (최대 3-5개).")
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
  system: `당신은 사용자의 투자 성향, 선호하는 매매 전략, 그리고 선택된 기술 지표를 바탕으로 주식 매매 신호를 분석하는 AI 금융 분석가입니다. 
  제공되는 주가 데이터는 실제 금융 데이터로 가정하고 답변해야 합니다.
  분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  {{#if customTimingPrompt}}
  - 사용자 선호 매매 전략/타이밍: "{{{customTimingPrompt}}}"
  {{/if}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  getStockData 도구의 응답에 'error' 필드가 있고, 오류 메시지에 "TICKER_NOT_FOUND"가 포함되어 있으면, 
  explanation 필드에 "입력하신 티커 '{{{ticker}}}'를 찾을 수 없었습니다. 티커 심볼이 정확한지 다시 한번 확인해주시겠어요? 또는 다른 티커로 시도해보시는 건 어떠세요?" 와 같이 사용자 친화적인 메시지를 담아주세요. 
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  만약 getStockData 도구의 응답에 'error' 필드가 있고, 오류 메시지에 "DATA_INCOMPLETE"가 포함되어 있으면, 
  explanation 필드에 "티커 '{{{ticker}}}'에 대한 데이터는 찾았지만, 차트를 그리기에 충분한 가격 정보가 부족합니다. 다른 티커를 시도해보시거나, 해당 티커의 데이터가 충분한지 확인해주세요." 와 같이 메시지를 설정해주세요.
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  만약 getStockData 도구의 응답에 'error' 필드가 있고, "TICKER_NOT_FOUND"나 "DATA_INCOMPLETE"가 아닌 다른 내용(예: "API_ERROR", "UNKNOWN_ERROR" 등)으로 시작하면, 
  explanation 필드에 "데이터 조회 중 다음 오류가 발생했습니다: [받은 오류 메시지 전체]" 와 같이 명확히 명시해주세요.
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  데이터를 성공적으로 가져왔다면 (즉, getStockData 도구 응답에 'error' 필드가 없거나 비어 있다면), 해당 데이터와 선택된 기술 지표를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호 (signal)**: (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")
  2.  **설명 (explanation)**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요.
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요.
      *   {{#if customTimingPrompt}}사용자가 입력한 선호 매매 전략/타이밍 ("{{{customTimingPrompt}}}")을 분석에 어떻게 반영했는지 간략히 언급해주세요.{{/if}}
      *   이 분석은 투자 참고용 정보이며, 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준 (confidence, 선택 사항)**: 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약 (indicatorSummary, 선택 사항)**: 각 선택된 지표가 나타내는 간략한 신호 또는 상태를 객체 형태로 제공해주세요.
  5.  **차트 데이터 (chartData)**: getStockData 도구에서 반환된 과거 주가 데이터 전체를 그대로 제공해주세요. 이 데이터는 차트 표시에 사용됩니다. 데이터가 없다면 빈 배열로 제공해주세요.
  6.  **신호 이벤트 (signalEvents)**: 분석 결과, 차트 상에 화살표로 표시할 만한 주요 매수(buy), 매도(sell) 또는 관망(hold) 신호가 발생했다고 판단되는 지점을 날짜(date), 신호 유형(type: 'buy'|'sell'|'hold'), 당시 종가(price), 그리고 **해당 신호를 판단하게 된 주요 지표 또는 근거(indicator)**와 함께 배열로 제공해주세요. 최대 3-5개의 주요 이벤트를 선정해주세요. 데이터가 없다면 빈 배열로 제공해주세요.

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
    console.log("[analyzeStockSignalFlow] Input received:", input);
    const {output} = await prompt(input); 
    
    if (!output) {
        console.error("[analyzeStockSignalFlow] Did not receive a valid response from the AI model. Input:", input);
        return {
            signal: "분석 오류",
            explanation: "AI 모델로부터 유효한 응답을 받지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.",
            confidence: "낮음",
            indicatorSummary: {},
            chartData: [],
            signalEvents: []
        };
    }

    // Ensure optional fields have default values for stability
    output.chartData ??= [];
    output.signalEvents ??= [];
    output.indicatorSummary ??= {};
    output.confidence ??= "정보 없음";
    
    console.log("[analyzeStockSignalFlow] Final AI return result (summary):", { 
        signal: output.signal, 
        explanationLength: output.explanation?.length || 0, 
        chartDataLength: output.chartData?.length || 0, 
        signalEventsLength: output.signalEvents?.length || 0 
    });
    
    return output;
  }
);
