
// src/services/stock-data-service.ts
/**
 * @fileOverview 주식 데이터 조회를 위한 서비스입니다. Alpha Vantage API를 사용합니다.
 *
 * - getStockData - 지정된 티커의 과거 주가 데이터를 가져옵니다.
 * - StockData - 개별 주가 데이터 포인트의 타입입니다.
 * - StockDataResponse - getStockData 함수의 반환 타입입니다.
 */
import dayjs from 'dayjs';

export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDataResponse {
  prices: StockData[];
  error?: string;
}

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * 지정된 티커에 대한 과거 주가 데이터를 Alpha Vantage에서 가져옵니다.
 * @param ticker - 주식 티커 심볼 (예: AAPL, 005930.KS)
 * @returns {Promise<StockDataResponse>} 주가 데이터 배열과 오류 메시지를 포함하는 객체
 */
export async function getStockData(ticker: string): Promise<StockDataResponse> {
  console.log(`[getStockData] Alpha Vantage Service called for ticker: '${ticker}'`);

  if (!API_KEY) {
    const errorMsg = 'ALPHA_VANTAGE_API_KEY_MISSING: Alpha Vantage API 키가 .env 파일에 설정되지 않았습니다.';
    console.error(`[getStockData] Error: ${errorMsg}`);
    return { prices: [], error: errorMsg };
  }

  // outputsize=full로 전체 데이터를 가져온 후 클라이언트에서 필터링
  const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorMsg = `API_ERROR: Alpha Vantage API 요청에 실패했습니다. Status: ${response.status}`;
      console.error(`[getStockData] Error: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }

    const data = await response.json();

    // API 오류 또는 정보 메시지 확인 (예: 잘못된 티커, API 사용량 초과)
    if (data['Error Message']) {
      const errorMsg = `TICKER_NOT_FOUND: ${data['Error Message']}`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }
     if (data['Information']) {
      const errorMsg = `API_LIMIT_REACHED: ${data['Information']}`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      const errorMsg = `DATA_INCOMPLETE: 티커 '${ticker}'에 대한 시계열 데이터를 찾을 수 없습니다.`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }

    const oneYearAgo = dayjs().subtract(1, 'year').startOf('day');
    
    const allPrices = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date: date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['6. volume'], 10),
    }));

    const validPrices = allPrices
      .filter(price => {
        const dataDate = dayjs(price.date);
        return dataDate.isAfter(oneYearAgo) &&
               isFinite(price.open) && 
               isFinite(price.high) &&
               isFinite(price.low) &&
               isFinite(price.close) &&
               isFinite(price.volume);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (validPrices.length < 2) {
      const errorMsg = `DATA_INCOMPLETE: 티커 '${ticker}'에 대한 유효한 OHLCV 데이터가 최근 1년 내에 부족합니다 (${validPrices.length}개). 차트를 표시할 수 없습니다.`;
      console.warn(`[getStockData] Warning: ${errorMsg}`);
      return { prices: [], error: errorMsg };
    }

    console.log(`[getStockData] Processed ${validPrices.length} valid data points for the last year. Period: ${validPrices[0].date} to ${validPrices[validPrices.length - 1].date}`);
    return { prices: validPrices };

  } catch (error: any) {
    const errorMsg = `UNKNOWN_ERROR: 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
    console.error(`[getStockData] Fatal Error: ${errorMsg}`, error);
    return { prices: [], error: errorMsg };
  }
}
