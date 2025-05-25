
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

// TODO: 실제 야후 파이낸스 API 연동 시 아래 주석 해제 및 yahoo-finance2 라이브러리 설치 필요
// import yahooFinance from 'yahoo-finance2';

// 모의 주가 데이터를 반환하는 도구 정의
const getStockDataTool = ai.defineTool(
  {
    name: 'getStockData',
    description: '지정된 티커에 대한 과거 주가 데이터를 반환합니다. 실제 프로덕션 환경에서는 야후 파이낸스와 같은 신뢰할 수 있는 데이터 소스에서 데이터를 가져와야 합니다. 현재는 모의 데이터를 사용합니다. 날짜, 시가(open), 고가(high), 저가(low), 종가(close), 거래량(volume) 데이터를 포함해야 합니다.',
    inputSchema: z.object({
      ticker: z.string().describe('주식 티커 심볼 (예: AAPL, MSFT, GOOG, 005930.KS). 야후 파이낸스 형식 사용 권장.'),
      period1: z.string().optional().describe('데이터 시작일 (YYYY-MM-DD). 지정하지 않으면 기본값 사용.'),
      period2: z.string().optional().describe('데이터 종료일 (YYYY-MM-DD). 지정하지 않으면 오늘 날짜 사용.'),
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
    
    // --- 실제 API 연동 예시 (주석 처리) ---
    /*
    try {
      // const queryOptions = {
      //   period1: period1 || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // 기본값: 1년 전
      //   period2: period2 || new Date().toISOString().split('T')[0], // 기본값: 오늘
      //   interval: interval || '1d', // 기본값: 일별
      // };
      // console.log(`Yahoo Finance 요청: ${ticker}, ${JSON.stringify(queryOptions)}`);
      // const result = await yahooFinance.historical(ticker, queryOptions);
      // console.log(`Yahoo Finance 응답 (첫 5개):`, result.slice(0,5));

      // if (!result || result.length === 0) {
      //   return { prices: [], error: `티커 '${ticker}'에 대한 데이터를 찾을 수 없습니다.` };
      // }

      // const formattedPrices = result.map(data => ({
      //   date: data.date.toISOString().split('T')[0],
      //   open: data.open,
      //   high: data.high,
      //   low: data.low,
      //   close: data.close,
      //   adjClose: data.adjClose,
      //   volume: data.volume,
      // }));
      // return { prices: formattedPrices };

    } catch (error: any) {
      console.error(`Yahoo Finance API 오류 (${ticker}):`, error);
      // 에러 메시지를 좀 더 사용자 친화적으로 만들 수 있습니다.
      // let errorMessage = `티커 '${ticker}'의 데이터를 가져오는 중 오류가 발생했습니다.`;
      // if (error.message && error.message.includes('404')) {
      //   errorMessage = `티커 '${ticker}'를 찾을 수 없습니다. 올바른 티커인지 확인해주세요.`;
      // } else if (error.name === 'FailedYahooValidationError') {
      //   errorMessage = `잘못된 요청입니다. 입력값을 확인해주세요. (${error.message})`;
      // }
      // return { prices: [], error: errorMessage };
    }
    */
    // --- 여기까지 실제 API 연동 예시 ---

    // --- 현재 사용하는 모의 데이터 ---
    const mockDataStore: Record<string, Array<{date: string; open: number; high: number; low: number; close: number; volume: number, adjClose?: number}>> = {
        "AAPL": Array.from({length: 30}, (_, i) => { // 30일치 데이터
            const date = new Date(2024, 6, 1); // 2024년 7월 1일부터 시작
            date.setDate(date.getDate() + i);
            const basePrice = 190 + i * 0.5 + Math.sin(i / 5) * 5;
            const open = parseFloat((basePrice - Math.random() * 2).toFixed(2));
            const high = parseFloat((Math.max(open, basePrice) + Math.random() * 3).toFixed(2));
            const low = parseFloat((Math.min(open, basePrice) - Math.random() * 3).toFixed(2));
            const close = parseFloat(basePrice.toFixed(2));
            const volume = Math.floor(40000000 + Math.random() * 20000000);
            return { date: date.toISOString().split('T')[0], open, high, low, close, volume };
          }),
        "MSFT": Array.from({length: 30}, (_, i) => {
            const date = new Date(2024, 6, 1);
            date.setDate(date.getDate() + i);
            const basePrice = 440 + i * 0.3 + Math.cos(i / 6) * 8;
            const open = parseFloat((basePrice + (Math.random() - 0.5) * 4).toFixed(2));
            const high = parseFloat((Math.max(open, basePrice) + Math.random() * 5).toFixed(2));
            const low = parseFloat((Math.min(open, basePrice) - Math.random() * 5).toFixed(2));
            const close = parseFloat(basePrice.toFixed(2));
            const volume = Math.floor(15000000 + Math.random() * 10000000);
            return { date: date.toISOString().split('T')[0], open, high, low, close, volume };
        }),
        "GOOG": Array.from({length: 30}, (_, i) => {
            const date = new Date(2024, 6, 1);
            date.setDate(date.getDate() + i);
            const basePrice = 175 + i * 0.2 + Math.sin(i / 4) * 6;
            const open = parseFloat((basePrice - Math.random() * 1.5).toFixed(2));
            const high = parseFloat((Math.max(open, basePrice) + Math.random() * 2.5).toFixed(2));
            const low = parseFloat((Math.min(open, basePrice) - Math.random() * 2.5).toFixed(2));
            const close = parseFloat(basePrice.toFixed(2));
            const volume = Math.floor(20000000 + Math.random() * 15000000);
            return { date: date.toISOString().split('T')[0], open, high, low, close, volume };
        }),
        "005930.KS": Array.from({length: 30}, (_, i) => { // 삼성전자 예시
            const date = new Date(2024, 6, 1);
            date.setDate(date.getDate() + i);
            const basePrice = 78000 + i * 50 + Math.cos(i / 7) * 1500;
            const open = Math.floor(basePrice + (Math.random() - 0.5) * 500);
            const high = Math.floor(Math.max(open, basePrice) + Math.random() * 800);
            const low = Math.floor(Math.min(open, basePrice) - Math.random() * 800);
            const close = Math.floor(basePrice);
            const volume = Math.floor(10000000 + Math.random() * 5000000);
            return { date: date.toISOString().split('T')[0], open, high, low, close, volume };
        }),
    };
    const tickerUpper = ticker.toUpperCase();
    if (mockDataStore[tickerUpper]) {
      return {prices: mockDataStore[tickerUpper]};
    }
    // 기본 모의 데이터 (티커를 찾지 못했을 경우)
    const defaultPrices = Array.from({length: 30}, (_, i) => {
        const date = new Date(2024, 6, 1);
        date.setDate(date.getDate() + i);
        const basePrice = 100 + i * 0.1 + Math.sin(i/3) * 3;
        const open = parseFloat((basePrice - Math.random() * 1).toFixed(2));
        const high = parseFloat((Math.max(open, basePrice) + Math.random() * 1.5).toFixed(2));
        const low = parseFloat((Math.min(open, basePrice) - Math.random() * 1.5).toFixed(2));
        const close = parseFloat(basePrice.toFixed(2));
        const volume = Math.floor(1000000 + Math.random() * 500000);
        return { date: date.toISOString().split('T')[0], open, high, low, close, volume };
    });
    return {prices: defaultPrices, error: `티커 '${ticker}'에 대한 특정 모의 데이터를 찾을 수 없어 기본 데이터를 사용합니다.`};
    // --- 여기까지 모의 데이터 ---
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
  제공되는 주가 데이터(날짜, 시가, 고가, 저가, 종가, 거래량 포함)는 실제 시장 데이터가 아닌 모의 데이터임을 인지하고 답변해야 합니다. 
  (실제 환경이라면 이 데이터는 야후 파이낸스와 같은 신뢰할 수 있는 출처에서 온다고 가정합니다.)
  사용자에게 이 점을 명확히 전달하고, 분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  먼저, getStockData 도구를 사용해 {{{ticker}}}의 과거 주가 데이터를 가져오세요. (모의 데이터이지만, 최근 약 1개월 치의 일봉 데이터(날짜, 시가, 고가, 저가, 종가, 거래량 포함)를 요청했다고 가정합니다.)
  가져온 데이터와 선택된 기술 지표 ({{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}})를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호 (signal)**: (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")
  2.  **설명 (explanation)**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요. (예: "최근 주가 흐름과 RSI 지표가 30 이하 과매도 구간에 진입한 점을 고려할 때 단기적 반등 가능성이 있습니다.", "볼린저 밴드 하단을 터치 후 반등하는 모습을 보여 매수 고려 시점으로 볼 수 있습니다. 거래량도 평균 이상으로 증가하고 있어 신뢰도를 높입니다.")
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요. (예: "보수적인 투자자라면 추가적인 확인이 필요할 수 있지만, 공격적인 투자자라면 분할 매수를 고려해볼 수 있습니다.")
      *   이 분석은 모의 데이터에 기반한 것이며, 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준 (confidence, 선택 사항)**: 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약 (indicatorSummary, 선택 사항)**: 각 선택된 지표가 나타내는 간략한 신호 또는 상태를 객체 형태로 제공해주세요. (예: {"RSI": "과매도 (28.5)", "BollingerBands": "하단 근접", "MACD": "데드 크로스 발생"})
  5.  **차트 데이터 (chartData)**: getStockData 도구에서 반환된 과거 주가 데이터 전체(날짜, 시가, 고가, 저가, 종가, 거래량 포함)를 그대로 제공해주세요. 이 데이터는 차트 표시에 사용됩니다. 데이터가 없다면 빈 배열로 제공해주세요.
  6.  **신호 이벤트 (signalEvents)**: 분석 결과, 차트 상에 화살표로 표시할 만한 주요 매수(buy), 매도(sell) 또는 관망(hold) 신호가 발생했다고 판단되는 지점을 날짜(date), 신호 유형(type: 'buy'|'sell'|'hold'), 당시 종가(price), 그리고 **해당 신호를 판단하게 된 주요 지표 또는 근거(indicator, 예: 'RSI 과매도 및 볼린저밴드 하단 터치', 'MACD 골든크로스')**와 함께 배열로 제공해주세요. 최대 3-5개의 주요 이벤트를 선정하고, 날짜는 제공된 chartData 내의 실제 날짜여야 하며, 가격은 해당 날짜의 종가여야 합니다. 데이터가 없다면 빈 배열로 제공해주세요.

  만약 데이터가 부족하거나 분석이 어렵다면, "분석 불가" 또는 "데이터 부족"으로 명확히 답변하고, chartData와 signalEvents는 빈 배열로 설정해주세요.
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

