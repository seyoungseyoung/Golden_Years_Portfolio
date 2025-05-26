
'use server';
/**
 * @fileOverview 주식 데이터 및 기술 지표를 기반으로 매수/매도 신호를 분석하는 AI 플로우입니다.
 *
 * - analyzeStockSignal - 주식 매수/매도 신호 분석을 처리하는 함수입니다.
 * - AnalyzeStockSignalInput - analyzeStockSignal 함수의 입력 유형입니다.
 * - AnalyzeStockSignalOutput - analyzeStockSignal 함수의 반환 유형입니다.
 */

import dayjs from 'dayjs';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import yahooFinance from 'yahoo-finance2';

const getStockDataTool = ai.defineTool(
  {
    name: 'getStockData',
    description: '지정된 티커에 대한 과거 주가 데이터를 야후 파이낸스에서 가져옵니다. 날짜, 시가(open), 고가(high), 저가(low), 종가(close), 거래량(volume) 데이터를 포함해야 합니다. 최근 1년치 일봉 데이터를 가져옵니다.',
    inputSchema: z.object({
      ticker: z.string().describe('주식 티커 심볼 (예: AAPL, MSFT, GOOG, 005930.KS). 야후 파이낸스 형식 사용 권장.'),
      // period1, period2, interval는 내부적으로 1년으로 고정하므로 AI 입력에서는 제거하거나 무시합니다.
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
      ).describe('과거 가격 및 거래량 데이터 배열. 각 항목은 날짜, 시가, 고가, 저가, 종가, 거래량, 수정종가를 포함해야 합니다.'),
      error: z.string().optional().describe('데이터 조회 중 오류 발생 시 메시지. 오류 유형(예: "TICKER_NOT_FOUND", "API_ERROR", "DATA_INCOMPLETE", "UNKNOWN_ERROR")과 상세 메시지를 포함할 수 있음.'),
    }),
  },
  async ({ticker}) => { // period1, period2, interval 입력을 받지 않음
    console.log(`getStockDataTool 호출됨 (입력): ticker=${ticker}`);
    
    const today = dayjs();
    const oneYearAgo = today.subtract(1, 'year');
    const startDate = oneYearAgo.format('YYYY-MM-DD');
    const endDate = today.format('YYYY-MM-DD');
    const queryInterval = '1d';

    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: queryInterval, 
    };

    console.log(`getStockDataTool: 야후 파이낸스 API 요청 옵션: ${ticker}, ${JSON.stringify(queryOptions)}`);
    // Log the calculated date range and interval before the API call
    console.log(`getStockDataTool: Requesting data for ${ticker} from ${startDate} to ${endDate} with interval ${queryInterval}`);

    try {
      const results = await yahooFinance.historical(ticker, queryOptions);
      
      if (!results) {
        console.warn(`getStockDataTool: 야후 파이낸스에서 티커 \'${ticker}\'에 대한 응답이 null입니다.`);
        return { prices: [], error: `TICKER_NOT_FOUND: 티커 '${ticker}'에 대한 데이터를 야후 파이낸스에서 찾을 수 없습니다 (응답 없음). (기간: ${queryOptions.period1} ~ ${queryOptions.period2})` };
      }
      // Log the number of results and the first item received from Yahoo Finance
      console.log(`getStockDataTool: Received ${results.length} results from Yahoo Finance. First item:`, results.length > 0 ? results[0] : "No data received");


      const mappedPrices = results.map(data => {
        let dateStr = '';
        if (data.date && typeof data.date.toISOString === 'function') {
            dateStr = data.date.toISOString().split('T')[0];
        } else {
            // console.warn(`getStockDataTool: 티커 ${ticker}의 데이터에 유효하지 않은 날짜 객체 발견:`, data.date, "전체 데이터 항목:", data);
            // 유효하지 않은 날짜는 필터링에서 걸러지도록 null이나 빈 문자열로 처리 가능
            return null; 
        }
        return {
          date: dateStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          adjClose: data.adjClose, // 현재 사용 안함
          volume: data.volume,
        };
      }).filter(price => price !== null); // 유효하지 않은 날짜 객체로 인해 null이 된 항목 제거

      let formattedPrices = mappedPrices.filter(price => 
          typeof price.open === 'number' && isFinite(price.open) &&
          typeof price.high === 'number' && isFinite(price.high) &&
          typeof price.low === 'number' && isFinite(price.low) &&
          typeof price.close === 'number' && isFinite(price.close) &&
          (typeof price.volume === 'number' && isFinite(price.volume)) && // Require valid finite volume
          price.date !== '' // 빈 날짜 문자열 필터링
      );
      
      // 최종적으로 숫자 타입으로 변환 (위에서 이미 타입 체크했지만, 안전을 위해)
      formattedPrices = formattedPrices.map(price => ({
        date: price.date,
        open: Number(price.open),
        high: Number(price.high),
        low: Number(price.low),
        close: Number(price.close),
        volume: (typeof price.volume === 'number' && isFinite(price.volume)) ? Number(price.volume) : undefined,
      }));


      // 날짜 오름차순으로 정렬
      formattedPrices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log(`getStockDataTool: 유효한 OHLCV 데이터 개수 (정렬 후): ${formattedPrices.length}`);
      if (formattedPrices.length > 0) {
        console.log(`getStockDataTool: 정렬 후 첫 5개:`, formattedPrices.slice(0,5));
        console.log(`getStockDataTool: 정렬 후 마지막 5개:`, formattedPrices.slice(-5));
        console.log(`getStockDataTool: 가져온 데이터 기간 범위: ${formattedPrices[0].date} ~ ${formattedPrices[formattedPrices.length - 1].date}`);
      } else {
         console.warn(`getStockDataTool: 유효한 OHLCV 데이터가 없습니다.`);

      }
      

      if (formattedPrices.length < 100) { // 대략 1년치 데이터에 비해 너무 적으면 문제로 간주 (예: 250 거래일 중 100일 미만)
        console.warn(`getStockDataTool: 티커 \'${ticker}\'에 대한 유효 데이터가 부족합니다 (${formattedPrices.length}개). 차트 표시에 부적합할 수 있습니다.`);
        return { prices: formattedPrices, error: `DATA_INCOMPLETE: 티커 '${ticker}'에 대한 데이터는 찾았으나, 1년치 차트를 그리기에 충분한 연속된 가격 정보(시가, 고가, 저가, 종가)가 부족합니다 (데이터 ${formattedPrices.length}개). 티커를 확인하거나 다른 티커를 시도해보세요.` };
      }
      
      return { prices: formattedPrices };

    } catch (error: any) {
      console.error(`getStockDataTool: 야후 파이낸스 API 오류 (${ticker}):`, error);
      // 오류 객체에 따라 더 자세한 정보 로깅
      if (error && typeof error === 'object') {
        console.error("Detailed error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }

      let errorType: string = "UNKNOWN_ERROR";
      let errorMessageContent: string = `티커 '${ticker}'의 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.`;
      
      if (error.message) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('not found') || (error.result && typeof error.result === 'string' && error.result.includes('No data found')) || error.code === 404 || (error.response && error.response.status === 404) ) { 
          errorType = "TICKER_NOT_FOUND";
          errorMessageContent = `티커 '${ticker}'를 찾을 수 없습니다. 올바른 티커인지 확인해주세요. (요청 기간: ${startDate} ~ ${endDate})`;
        } else if (error.result && error.result.message) { 
           errorType = "API_ERROR";
           errorMessageContent = `야후 파이낸스 데이터 조회 오류 (${ticker}): ${error.result.message}`;
        } else {
           errorType = "API_ERROR";
           errorMessageContent = `야후 파이낸스 데이터 조회 중 오류 (${ticker}): ${error.message}`;
         }
      } else if (error.name === 'FailedYahooValidationError') {
        errorType = "VALIDATION_ERROR";
        errorMessageContent = `잘못된 요청입니다. 입력값을 확인해주세요. (${error.message})`;
      }
      return { prices: [], error: `${errorType}: ${errorMessageContent}` };
    }
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
  ).optional().describe("차트 표시에 사용될 과거 주가 데이터 (날짜, 시가, 고가, 저가, 종가 및 거래량). getStockDataTool에서 받은 데이터를 기반으로 제공."),
  signalEvents: z.array(
    z.object({
      date: z.string().describe("신호 발생 날짜 (YYYY-MM-DD). chartData에 포함된 날짜여야 함."),
      type: z.enum(["buy", "sell", "hold"]).describe("신호 유형 (매수, 매도, 관망)"),
      price: z.number().describe("신호 발생 시점의 가격 (해당 날짜의 종가)"),
      indicator: z.string().optional().describe("이 신호를 트리거한 주요 지표 또는 근거. 예: 'RSI 과매도', '볼린저밴드 하단 터치', 'MACD 골든크로스 및 거래량 증가'"),
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
  system: `당신은 사용자의 투자 성향, 선호하는 매매 전략, 그리고 선택된 기술 지표를 바탕으로 주식 매매 신호를 분석하는 AI 금융 분석가입니다. 
  제공되는 주가 데이터(날짜, 시가, 고가, 저가, 종가, 거래량 포함)는 실제 금융 데이터로 가정하고 답변해야 합니다.
  분석 결과는 투자 조언이 아닌 참고용 정보임을 강조해주세요.`,
  prompt: `다음 정보를 바탕으로 주식 매매 신호를 분석해주세요:
  - 주식 티커: {{{ticker}}}
  {{#if customTimingPrompt}}
  - 사용자 선호 매매 전략/타이밍: "{{{customTimingPrompt}}}"
  {{/if}}
  - 선택된 기술 지표: {{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - 사용자 위험 감수 수준: {{{riskTolerance}}}

  getStockData 도구의 응답에 'error' 필드가 있고, 오류 메시지가 "TICKER_NOT_FOUND"로 시작하면, 
  explanation 필드에 "입력하신 티커 '{{{ticker}}}'를 찾을 수 없었습니다. 티커 심볼이 정확한지 다시 한번 확인해주시겠어요? 또는 다른 티커로 시도해보시는 건 어떠세요?" 와 같이 사용자 친화적인 메시지를 담아주세요. 
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  만약 getStockData 도구의 응답에 'error' 필드가 있고, 오류 메시지가 "DATA_INCOMPLETE"로 시작하면, 
  explanation 필드에 "티커 '{{{ticker}}}'에 대한 데이터는 찾았지만, 차트를 그리기에 충분한 가격 정보(시가, 고가, 저가, 종가)가 부족합니다. 다른 티커를 시도해보시거나, 해당 티커의 데이터가 충분한지 확인해주세요." 와 같이 메시지를 설정해주세요.
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  만약 getStockData 도구의 응답에 'error' 필드가 있고, 오류 메시지가 "TICKER_NOT_FOUND"나 "DATA_INCOMPLETE"가 아닌 다른 내용(예: "API_ERROR", "UNKNOWN_ERROR" 등)으로 시작하면, 
  해당 오류 내용 전체를 사용자에게 전달하기 위해 explanation 필드에 "데이터 조회 중 다음 오류가 발생했습니다: [받은 오류 메시지 전체]" 와 같이 명확히 명시해주세요.
  signal 필드는 "분석 불가"로 설정하고, confidence는 "낮음", chartData와 signalEvents는 빈 배열로 설정합니다.

  데이터를 성공적으로 가져왔다면 (즉, getStockData 도구 응답에 'error' 필드가 없거나 비어 있다면), 해당 데이터와 선택된 기술 지표 ({{#each indicators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}})를 종합적으로 고려하여, 다음 사항을 포함한 분석 결과를 제공해주세요:

  1.  **매매 신호 (signal)**: (예: "강력 매수", "매수 고려", "관망", "매도 고려", "분석 불가")
  2.  **설명 (explanation)**:
      *   왜 그렇게 판단했는지, 각 선택된 기술 지표가 현재 상황에서 어떤 의미를 가지는지 설명해주세요. (예: "최근 주가 흐름과 RSI 지표가 30 이하 과매도 구간에 진입한 점을 고려할 때 단기적 반등 가능성이 있습니다.", "볼린저 밴드 하단을 터치 후 반등하는 모습을 보여 매수 고려 시점으로 볼 수 있습니다. 거래량도 평균 이상으로 증가하고 있어 신뢰도를 높입니다.")
      *   사용자의 위험 감수 수준 ({{{riskTolerance}}})을 고려하여 신호를 어떻게 해석해야 할지 조언해주세요. (예: "보수적인 투자자라면 추가적인 확인이 필요할 수 있지만, 공격적인 투자자라면 분할 매수를 고려해볼 수 있습니다.")
      *   {{#if customTimingPrompt}}사용자가 입력한 선호 매매 전략/타이밍 ("{{{customTimingPrompt}}}")을 분석에 어떻게 반영했는지 간략히 언급해주세요. (예: "사용자께서 언급하신 단기 변동성 활용 전략에 따라, RSI와 볼린저 밴드의 단기 신호에 더 주목했습니다."){{/if}}
      *   이 분석은 투자 참고용 정보이며, 실제 투자 결정은 신중해야 함을 다시 한번 강조해주세요.
  3.  **확신 수준 (confidence, 선택 사항)**: 신호에 대한 당신의 확신 수준 (높음, 중간, 낮음)
  4.  **지표별 요약 (indicatorSummary, 선택 사항)**: 각 선택된 지표가 나타내는 간략한 신호 또는 상태를 객체 형태로 제공해주세요. (예: {"RSI": "과매도 (28.5)", "BollingerBands": "하단 근접", "MACD": "데드 크로스 발생"})
  5.  **차트 데이터 (chartData)**: getStockData 도구에서 반환된 과거 주가 데이터 전체(날짜, 시가, 고가, 저가, 종가, 거래량 포함)를 그대로 제공해주세요. 이 데이터는 차트 표시에 사용됩니다. 데이터가 없다면 빈 배열로 제공해주세요.
  6.  **신호 이벤트 (signalEvents)**: 분석 결과, 차트 상에 화살표로 표시할 만한 주요 매수(buy), 매도(sell) 또는 관망(hold) 신호가 발생했다고 판단되는 지점을 날짜(date), 신호 유형(type: 'buy'|'sell'|'hold'), 당시 종가(price), 그리고 **해당 신호를 판단하게 된 주요 지표 또는 근거(indicator, 예: 'RSI 과매도 및 볼린저밴드 하단 터치', 'MACD 골든크로스 및 거래량 증가')**와 함께 배열로 제공해주세요. 최대 3-5개의 주요 이벤트를 선정하고, 날짜는 제공된 chartData 내의 실제 날짜여야 하며, 가격은 해당 날짜의 종가여야 합니다. {{#if customTimingPrompt}}사용자 선호 전략/타이밍("{{{customTimingPrompt}}}")을 고려하여 신호 이벤트를 선정해주세요.{{/if}} 데이터가 없다면 빈 배열로 제공해주세요.

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
    console.log("analyzeStockSignalFlow: 입력값 수신:", input);
    const {output} = await prompt(input); 
    
    if (!output) {
        console.error("analyzeStockSignalFlow: AI 모델로부터 유효한 응답을 받지 못했습니다. Input:", input);
        return {
            signal: "분석 오류",
            explanation: "AI 모델로부터 유효한 응답을 받지 못했습니다. 입력값을 확인하거나 잠시 후 다시 시도해주세요.",
            confidence: "낮음",
            indicatorSummary: {},
            chartData: [],
            signalEvents: []
        };
    }
     // AI 응답에 chartData가 없거나 배열이 아닌 경우 빈 배열로 초기화
    if (!output.chartData || !Array.isArray(output.chartData)) {
        console.warn("analyzeStockSignalFlow: AI 응답에 chartData가 없거나 배열이 아닙니다. 빈 배열로 설정합니다. output.chartData:", output.chartData);
        output.chartData = [];
    }
    if (!output.signalEvents || !Array.isArray(output.signalEvents)) {
        output.signalEvents = [];
    }


    // AI 응답에 주요 필드가 누락된 경우 기본값 설정
    const result = { ...output };
    if (!result.indicatorSummary) result.indicatorSummary = {};
    // chartData와 signalEvents는 위에서 이미 배열로 보장됨
    if (!result.confidence) result.confidence = "정보 없음";
    
    console.log("analyzeStockSignalFlow: AI 최종 반환 결과 (일부):", { 
        signal: result.signal, 
        explanationLength: result.explanation?.length || 0, 
        chartDataLength: result.chartData?.length || 0, 
        signalEventsLength: result.signalEvents?.length || 0 
    });
    if (result.chartData && result.chartData.length > 0) {
        console.log("analyzeStockSignalFlow: 반환될 chartData의 첫번째/마지막 항목:", result.chartData[0], result.chartData[result.chartData.length - 1]);
    }
    return result;
  }
);
