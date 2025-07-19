
// src/services/stock-data-service.ts
/**
 * @fileOverview 주식 데이터 조회를 위한 서비스입니다.
 *
 * - getStockData - 지정된 티커의 과거 주가 데이터를 가져옵니다.
 * - StockData - 개별 주가 데이터 포인트의 타입입니다.
 * - StockDataResponse - getStockData 함수의 반환 타입입니다.
 */
import dayjs from 'dayjs';
import yahooFinance from 'yahoo-finance2';

export interface StockData {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adjClose?: number;
  volume?: number;
}

export interface StockDataResponse {
  prices: StockData[];
  error?: string;
}

/**
 * 지정된 티커에 대한 과거 1년치 주가 데이터를 야후 파이낸스에서 가져옵니다.
 * @param ticker - 주식 티커 심볼 (예: AAPL, 005930.KS)
 * @returns {Promise<StockDataResponse>} 주가 데이터 배열과 오류 메시지를 포함하는 객체
 */
export async function getStockData(ticker: string): Promise<StockDataResponse> {
  console.log(`[getStockData] Service called for ticker: '${ticker}'`);

  const endDate = dayjs();
  const startDate = endDate.subtract(1, 'year');

  const queryOptions = {
    period1: startDate.format('YYYY-MM-DD'),
    period2: endDate.format('YYYY-MM-DD'),
    interval: '1d' as const,
  };

  console.log(`[getStockData] Querying Yahoo Finance with options: ${JSON.stringify(queryOptions)}`);

  try {
    const results = await yahooFinance.historical(ticker, queryOptions);

    if (!results || results.length === 0) {
      const errorMsg = `TICKER_NOT_FOUND: 티커 '${ticker}'에 대한 데이터를 야후 파이낸스에서 찾을 수 없습니다. (기간: ${queryOptions.period1} ~ ${queryOptions.period2})`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }
    console.log(`[getStockData] Received ${results.length} results from Yahoo Finance.`);

    const validPrices = results
      .map((data) => ({
        date: dayjs(data.date).format('YYYY-MM-DD'),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjClose: data.adjClose,
      }))
      .filter((price): price is StockData =>
        price.date !== null &&
        typeof price.close === 'number' && isFinite(price.close) &&
        typeof price.high === 'number' && isFinite(price.high) &&
        typeof price.low === 'number' && isFinite(price.low) &&
        typeof price.open === 'number' && isFinite(price.open)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (validPrices.length < 2) {
      const errorMsg = `DATA_INCOMPLETE: 티커 '${ticker}'에 대한 유효한 OHLCV 데이터가 부족합니다 (${validPrices.length}개). 차트를 표시할 수 없습니다.`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }

    console.log(`[getStockData] Processed ${validPrices.length} valid data points. Period: ${validPrices[0].date} to ${validPrices[validPrices.length - 1].date}`);
    return { prices: validPrices };

  } catch (error: any) {
    console.error(`[getStockData] Yahoo Finance API Error for '${ticker}':`, error);
    
    let errorType = "UNKNOWN_ERROR";
    let errorMessageContent = `티커 '${ticker}'의 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.`;

    if (error.name === 'Not Found' || error.message?.includes('404')) {
      errorType = "TICKER_NOT_FOUND";
      errorMessageContent = `티커 '${ticker}'를 찾을 수 없습니다. 올바른 티커인지 확인해주세요.`;
    } else {
      errorType = "API_ERROR";
      errorMessageContent = `야후 파이낸스 데이터 조회 중 오류가 발생했습니다: ${error.message}`;
    }
    
    const finalErrorMsg = `${errorType}: ${errorMessageContent}`;
    console.error(`[getStockData] Returning final error: ${finalErrorMsg}`);
    return { prices: [], error: finalErrorMsg };
  }
}
