
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
import yahooFinance from 'yahoo-finance2'; // 야후 파이낸스 라이브러리 import

// 주가 데이터를 가져오는 도구 정의
const getStockDataTool = ai.defineTool(
  {
    name: 'getStockData',
    description: '지정된 티커에 대한 과거 주가 데이터를 야후 파이낸스에서 가져옵니다. 날짜, 시가(open), 고가(high), 저가(low), 종가(close), 거래량(volume) 데이터를 포함해야 합니다. 기본적으로 최근 1년치 일봉 데이터를 가져옵니다.',
    inputSchema: z.object({
      ticker: z.string().describe('주식 티커 심볼 (예: AAPL, MSFT, GOOG, 005930.KS). 야후 파이낸스 형식 사용 권장.'),
      period1: z.string().optional().describe('데이터 시작일 (YYYY-MM-DD). 지정하지 않으면 1년 전 오늘.'),
      period2: z.string().optional().describe('데이터 종료일 (YYYY-MM-DD). 지정하지 않으면 오늘 날짜.'),
      interval: z.string().optional().describe('데이터 간격 (예: 1d, 1wk, 1mo). 기본값 1d.'),
    }),
    outputSchema: z.object({
      prices: z.array(
        z.object({
          date: z.string().describe('날짜 (YYYY-MM-DD)'),
          open: z.number().optional().describe('시가'),
          high: z.number().optional().describe('고가'),
          low: z.number().optional().describe('저가'),
          close: z.number().describe('종가'),
          adjClose: z.number().optional().describe('수정 종가'),
          volume: z.number().optional().describe('거래량'),
        })
      ).describe('과거 가격 및 거래량 데이터 배열. 각 항목은 날짜, 시가, 고가, 저가, 종가, 거래량을 포함해야 합니다.'),
      error: z.string().optional().describe('데이터 조회 중 오류 발생 시 메시지'),
    }),
  },
  async ({ticker, period1, period2, interval}) => {
    console.log(`getStockDataTool 호출됨: ticker=${ticker}, period1=${period1}, period2=${period2}, interval=${interval}`);
    
    const today = new Date();
    const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));

    const queryOptions = {
      period1: period1 || oneYearAgo.toISOString().split('T')[0],
      period2: period2 || today.toISOString().split('T')[0],
      interval: interval || '1d',
    };

    try {
      console.log(`Yahoo Finance 요청: ${ticker}, ${JSON.stringify(queryOptions)}`);
      const results = await yahooFinance.historical(ticker, queryOptions);
      
      if (!results || results.length === 0) {
        return { prices: [], error: `티커 '${ticker}'에 대한 데이터를 야후 파이낸스에서 찾을 수 없습니다. (기간: ${queryOptions.period1} ~ ${queryOptions.period2})` };
      }

      const formattedPrices = results.map(data => ({
        date: data.date.toISOString().split('T')[0],
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        adjClose: data.adjClose, // adjClose도 포함
        volume: data.volume,
      }));
      console.log(`Yahoo Finance 응답 (첫 5개):`, formattedPrices.slice(0,5));
      return { prices: formattedPrices };

    } catch (error: any) {
      console.error(`Yahoo Finance API 오류 (${ticker}):`, error);
      let errorMessage = `티커 '${ticker}'의 데이터를 가져오는 중 오류가 발생했습니다.`;
      if (error.message) {
        if (error.message.includes('404 Not Found')) {
          errorMessage = `티커 '${ticker}'를 찾을 수 없습니다. 올바른 티커인지 확인해주세요.`;
        } else if (error.result && error.result.message) { // yahoo-finance2 오류 형식
           errorMessage = `야후 파이낸스 데이터 조회 오류 (${ticker}): ${error.result.message}`;
        } else {
           errorMessage = `야후 파이낸스 데이터 조회 중 알 수 없는 오류 (${ticker}): ${error.message}`;
        }
      } else if (error.name === 'FailedYahooValidationError') {
        errorMessage = `잘못된 요청입니다. 입력값을 확인해주세요. (${error.message})`;
      }
      return { prices: [], error: errorMessage };
    }
  }
);


const AnalyzeStockSignalInputSchema = z.object({
  ticker: z.string().min(1, "티커를 입력해주세요.").describe('분석할 주식 종목 코드 (예: AAPL, MSFT, GOOG, 005930.KS)'),
  indicators: z.array(z.string()).min(1, "하나 이상의 기술 지표를 선택해주세요.").describe("선택된 기술 지표 배열 (예: ['RSI', 'BollingerBands', 'MACD', 'Volume'])"),
  riskTolerance: z.string().describe("사용자의 위험 감수 수준 (예: 보수적, 중립적, 공격적)"),
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
  ).optional().describe("차트 표시에 사용될 과거 주가 데이터 (날짜, 시가, 고가, 저가, 종가 및 거래량). getStockDataTool에서 받은 데이터를 기반으로 제공."),
  signalEvents: z.array(
    z.object({
      date: z.string().describe("신호 발생 날짜 (YYYY-MM-DD). chartData에 포함된 날짜여야 함."),
      type: z.enum(["buy", "sell", "hold"]).describe("신호 유형 (매수, 매도, 관망)"),
      price: z.number().describe("신호 발생 시점의 가격 (해당 날짜의 종가)"),
      indicator: z.string().optional().describe("이 신호를 트리거한 주요 지표 또는 근거. 예: 'RSI 과매도', '볼린저밴드 하단 터치'"),
    })
  ).optional().describe("차트에 화살표 등으로 표시할 주요 매매 신호 이벤트 (최대 3-5개). 각 이벤트는 어떤 지표(들)에 의해 트리거되었는지 명시하는 것이 좋습니다.")
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
  제공되는 주가 데이터(날짜, 시가, 고가, 저가, 종가, 거래량 포함)는 야후 파이낸스와 같은 실제 금융 데이터 제공처에서 온다고 가정하고 답변해야 합니다.
  분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  먼저, getStockData 도구를 사용해 {{{ticker}}}의 과거 주가 데이터를 가져오세요. (기본적으로 최근 약 1년 치의 일봉 데이터(날짜, 시가, 고가, 저가, 종가, 거래량 포함)가 요청됩니다.)
  만약 getStockData 도구가 오류를 반환하거나 데이터를 가져오지 못했다면, 사용자에게 해당 오류를 명확히 전달하고 "분석 불가"로 응답해주세요. chartData와 signalEvents는 빈 배열로 설정합니다.

  데이터를 성공적으로 가져왔다면, 해당 데이터와 선택된 기술 지표 ({{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}})를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호 (signal)**: (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")
  2.  **설명 (explanation)**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요. (예: "최근 주가 흐름과 RSI 지표가 30 이하 과매도 구간에 진입한 점을 고려할 때 단기적 반등 가능성이 있습니다.", "볼린저 밴드 하단을 터치 후 반등하는 모습을 보여 매수 고려 시점으로 볼 수 있습니다. 거래량도 평균 이상으로 증가하고 있어 신뢰도를 높입니다.")
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요. (예: "보수적인 투자자라면 추가적인 확인이 필요할 수 있지만, 공격적인 투자자라면 분할 매수를 고려해볼 수 있습니다.")
      *   이 분석은 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준 (confidence, 선택 사항)**: 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약 (indicatorSummary, 선택 사항)**: 각 선택된 지표가 나타내는 간략한 신호 또는 상태를 객체 형태로 제공해주세요. (예: {"RSI": "과매도 (28.5)", "BollingerBands": "하단 근접", "MACD": "데드 크로스 발생"})
  5.  **차트 데이터 (chartData)**: getStockData 도구에서 반환된 과거 주가 데이터 전체(날짜, 시가, 고가, 저가, 종가, 거래량 포함)를 그대로 제공해주세요. 이 데이터는 차트 표시에 사용됩니다. 데이터가 없다면 빈 배열로 제공해주세요.
  6.  **신호 이벤트 (signalEvents)**: 분석 결과, 차트 상에 화살표로 표시할 만한 주요 매수(buy), 매도(sell) 또는 관망(hold) 신호가 발생했다고 판단되는 지점을 날짜(date), 신호 유형(type: 'buy'|'sell'|'hold'), 당시 종가(price), 그리고 **해당 신호를 판단하게 된 주요 지표 또는 근거(indicator, 예: 'RSI 과매도 및 볼린저밴드 하단 터치', 'MACD 골든크로스')**와 함께 배열로 제공해주세요. 최대 3-5개의 주요 이벤트를 선정하고, 날짜는 제공된 chartData 내의 실제 날짜여야 하며, 가격은 해당 날짜의 종가여야 합니다. 데이터가 없다면 빈 배열로 제공해주세요.

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
    // 입력 받은 티커를 대문자로 변환하는 것은 야후 파이낸스에서는 특정 경우 문제를 일으킬 수 있으므로,
    // 원본 티커를 사용하거나, 야후 파이낸스에서 요구하는 형식에 맞게 처리하는 것이 좋습니다.
    // 여기서는 원본 티커를 그대로 사용합니다.
    const {output} = await prompt(input); // 티커는 사용자가 입력한 그대로 전달
    
    if (!output) {
        return {
            signal: "분석 오류",
            explanation: "AI 모델로부터 유효한 응답을 받지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.",
            confidence: "낮음",
            indicatorSummary: {},
            chartData: [],
            signalEvents: []
        };
    }
    // 필요한 필드가 없으면 기본값으로 초기화
    if (output && !output.indicatorSummary) {
      output.indicatorSummary = {};
    }
    if (output && !output.chartData) {
      output.chartData = [];
    }
    if (output && !output.signalEvents) {
      output.signalEvents = [];
    }
    return output;
  }
);

