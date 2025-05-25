
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
    description: '지정된 티커에 대한 과거 주가 데이터를 반환합니다. 실제 프로덕션 환경에서는 야후 파이낸스와 같은 신뢰할 수 있는 데이터 소스에서 데이터를 가져와야 합니다. 현재는 모의 데이터를 사용합니다.',
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
          volume: z.number().describe('거래량'),
        })
      ).describe('과거 가격 및 거래량 데이터 배열'),
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
      "AAPL": [
        {"date": "2024-06-01", "open": 190, "high": 192, "low": 189, "close": 191.5, "volume": 45000000},
        {"date": "2024-06-02", "open": 191, "high": 193, "low": 190, "close": 192.0, "volume": 50000000},
        {"date": "2024-06-03", "open": 192, "high": 192.5, "low": 188, "close": 189.0, "volume": 52000000},
        {"date": "2024-06-04", "open": 189, "high": 191, "low": 187, "close": 190.5, "volume": 48000000},
        {"date": "2024-06-05", "open": 190.5, "high": 194, "low": 190, "close": 193.0, "volume": 55000000},
        {"date": "2024-06-08", "open": 193, "high": 195, "low": 192.5, "close": 194.0, "volume": 60000000},
        {"date": "2024-06-09", "open": 194.5, "high": 196, "low": 193, "close": 195.5, "volume": 58000000},
        {"date": "2024-06-10", "open": 195.0, "high": 198, "low": 194.5, "close": 197.0, "volume": 62000000},
        {"date": "2024-06-11", "open": 197.5, "high": 200, "low": 196, "close": 199.5, "volume": 70000000},
        {"date": "2024-06-12", "open": 200.0, "high": 202, "low": 198, "close": 201.0, "volume": 65000000},
        {"date": "2024-07-01", "open": 201.0, "high": 203, "low": 200, "close": 202.5, "volume": 50000000},
        {"date": "2024-07-02", "open": 202.5, "high": 205, "low": 201, "close": 204.0, "volume": 52000000},
        {"date": "2024-07-03", "open": 204.0, "high": 204.5, "low": 200, "close": 201.5, "volume": 48000000},
        {"date": "2024-07-04", "open": 201.5, "high": 206, "low": 201, "close": 205.0, "volume": 55000000},
        {"date": "2024-07-05", "open": 205.0, "high": 208, "low": 204, "close": 207.0, "volume": 60000000},
        {"date": "2024-07-08", "open": 207.0, "high": 210, "low": 206, "close": 209.0, "volume": 62000000},
        {"date": "2024-07-09", "open": 210.0, "high": 212, "low": 208, "close": 211.5, "volume": 58000000},
        {"date": "2024-07-10", "open": 211.0, "high": 215, "low": 210, "close": 214.0, "volume": 65000000},
      ],
      "MSFT": [
        {"date": "2024-06-01", "open": 420, "high": 422, "low": 418, "close": 421.0, "volume": 20000000},
        {"date": "2024-06-02", "open": 421.5, "high": 425, "low": 420, "close": 423.0, "volume": 22000000},
        // ... (add more data points for MSFT, similar to AAPL)
        {"date": "2024-07-10", "open": 466.5, "high": 470, "low": 465, "close": 468.0, "volume": 28000000},
      ],
      "GOOG": [
        {"date": "2024-06-01", "open": 170, "high": 172, "low": 169, "close": 171.0, "volume": 25000000},
        {"date": "2024-06-02", "open": 171.5, "high": 174, "low": 170, "close": 173.0, "volume": 27000000},
        // ... (add more data points for GOOG, similar to AAPL)
        {"date": "2024-07-10", "open": 189.0, "high": 192, "low": 188, "close": 191.0, "volume": 30000000},
      ],
      "005930.KS": [ // 삼성전자 예시
        {"date": "2024-06-01", "open": 78000, "high": 78500, "low": 77500, "close": 78200, "volume": 10000000},
        {"date": "2024-06-02", "open": 78300, "high": 79000, "low": 78000, "close": 78800, "volume": 12000000},
        // ... (add more data points for 005930.KS, similar to AAPL)
        {"date": "2024-07-10", "open": 82000, "high": 83000, "low": 81500, "close": 82500, "volume": 15000000},
      ]
    };
    const tickerUpper = ticker.toUpperCase();
    if (mockDataStore[tickerUpper]) {
      // 실제 API라면 period1, period2, interval에 따라 필터링/가공해야 합니다.
      // 여기서는 단순화를 위해 저장된 모든 데이터를 반환합니다.
      return {prices: mockDataStore[tickerUpper]};
    }
    return {prices: [], error: `티커 '${ticker}'에 대한 모의 데이터를 찾을 수 없습니다.`};
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
  (실제 환경이라면 이 데이터는 야후 파이낸스와 같은 신뢰할 수 있는 출처에서 온다고 가정합니다.)
  사용자에게 이 점을 명확히 전달하고, 분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  먼저, getStockData 도구를 사용해 {{{ticker}}}의 과거 주가 데이터를 가져오세요. (충분한 기간의 데이터를 요청했다고 가정합니다, 예를 들어 최근 1년)
  가져온 데이터(날짜, 시가, 고가, 저가, 종가, 거래량)와 선택된 기술 지표 ({{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}})를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호**: (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")
  2.  **설명**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요. (예: "최근 주가 흐름과 RSI 지표가 30 이하 과매도 구간에 진입한 점을 고려할 때 단기적 반등 가능성이 있습니다.", "볼린저 밴드 하단을 터치 후 반등하는 모습을 보여 매수 고려 시점으로 볼 수 있습니다. 거래량도 평균 이상으로 증가하고 있어 신뢰도를 높입니다.")
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요. (예: "보수적인 투자자라면 추가적인 확인이 필요할 수 있지만, 공격적인 투자자라면 분할 매수를 고려해볼 수 있습니다.")
      *   이 분석은 모의 데이터에 기반한 것이며, 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준** (선택 사항): 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약** (선택 사항): 각 선택된 지표가 나타내는 간략한 신호 또는 상태를 객체 형태로 제공해주세요. (예: {"RSI": "과매도 (28.5)", "BollingerBands": "하단 근접", "MACD": "데드 크로스 발생"})

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
            confidence: "낮음",
            indicatorSummary: {}
        };
    }
    // indicatorSummary가 없으면 빈 객체로 초기화
    if (output && !output.indicatorSummary) {
      output.indicatorSummary = {};
    }
    return output;
  }
);


    