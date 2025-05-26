
// src/components/dashboard/StockPriceChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  Customized, // Customized 컴포넌트 추가
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] | undefined ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] | undefined ? U : never;


const Candlestick = (props: any) => {
  const { x, y, width, height, payload, yAxis, index } = props; 

  // Log critical props for ALL data points for now to ensure we see what's happening
  // console.log(`Candlestick[${index}] Raw Props: x=${x}, y=${y}, width=${width}, height=${height}`);
  // console.log(`Candlestick[${index}] Payload:`, payload);
  

  if (!payload || typeof payload.open !== 'number' || typeof payload.close !== 'number' || typeof payload.high !== 'number' || typeof payload.low !== 'number') {
    console.warn(`Candlestick[${index}]: Invalid or incomplete OHLC data in payload.`, {payload});
    return null; 
  }
  
  if (!yAxis || typeof yAxis.scale !== 'function') {
    console.warn(`Candlestick[${index}]: yAxis or yAxis.scale is not available.`, {yAxis});
    return null; 
  }

  if (width <= 0) {
    console.warn(`Candlestick[${index}]: width is zero or negative (${width}). Cannot draw.`);
    return null;
  }

  const { open: actualOpen, close: actualClose, high: actualHigh, low: actualLow } = payload;

  if (![actualOpen, actualClose, actualHigh, actualLow].every(val => Number.isFinite(val))) {
    console.warn(`Candlestick[${index}]: Non-finite OHLC values in payload.`, {payload});
    return null;
  }
  
  const yOpen = yAxis.scale(actualOpen);
  const yClose = yAxis.scale(actualClose);
  const yHigh = yAxis.scale(actualHigh);
  const yLow = yAxis.scale(actualLow);

  // console.log(`Candlestick[${index}] Scaled Y values: yOpen=${yOpen}, yClose=${yClose}, yHigh=${yLow}, yLow=${yLow}`);


  if (![yOpen, yClose, yHigh, yLow].every(val => Number.isFinite(val))) {
    console.warn(`Candlestick[${index}]: Non-finite scaled Y values.`, { yOpen, yClose, yHigh, yLow, actualOpen, actualClose, actualHigh, actualLow });
    return null;
  }

  const isRising = actualClose >= actualOpen;
  const bodyFill = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'; 
  const wickStroke = 'hsl(var(--foreground))'; 

  const candleWidth = Math.max(1, width * 0.8); 
  const candleX = x + (width - candleWidth) / 2; 

  const bodyTopY = Math.min(yOpen, yClose);
  let calculatedBodyHeight = Math.abs(yOpen - yClose);
  
  // Ensure body is at least 1px tall if open and close are different, or if it's a doji
  if (actualOpen !== actualClose && calculatedBodyHeight < 1) {
    calculatedBodyHeight = 1;
  } else if (actualOpen === actualClose) { // Doji or line
    calculatedBodyHeight = 1;
  }


  const wickCenterX = candleX + candleWidth / 2;

  return (
    <g key={`candlestick-${payload.date || index}`}>
      {/* Wick */}
      <line
        x1={wickCenterX}
        y1={yHigh}
        x2={wickCenterX}
        y2={yLow}
        stroke={wickStroke}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={candleX}
        y={bodyTopY}
        width={candleWidth}
        height={calculatedBodyHeight}
        fill={bodyFill}
      />
    </g>
  );
};


const YAxisPriceTickFormatter = (value: number) => {
  if (value === null || value === undefined || !isFinite(value)) return '';
  return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
};

const YAxisVolumeTickFormatter = (value: number) => {
  if (value === null || value === undefined || !isFinite(value)) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // payload에는 여러 데이터 소스 (캔들, 거래량 등)의 정보가 포함될 수 있습니다.
    // 캔들 데이터 (open, high, low, close)를 찾습니다.
    const pricePayload = payload.find((p: any) => 
        p.payload && typeof p.payload.open === 'number' && typeof p.payload.close === 'number'
    );

    const dataPoint = pricePayload?.payload || payload[0].payload as StockDataPoint & { event?: SignalEvent }; // Fallback to first payload if pricePayload not found
    
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold text-foreground">{`날짜: ${label}`}</p>
        {typeof dataPoint.open === 'number' && <p style={{ color: 'hsl(var(--foreground))' }}>시가: {YAxisPriceTickFormatter(dataPoint.open)}</p>}
        {typeof dataPoint.high === 'number' && <p style={{ color: 'hsl(var(--chart-2))' }}>고가: {YAxisPriceTickFormatter(dataPoint.high)}</p>}
        {typeof dataPoint.low === 'number' && <p style={{ color: 'hsl(var(--destructive))' }}>저가: {YAxisPriceTickFormatter(dataPoint.low)}</p>}
        {typeof dataPoint.close === 'number' && <p style={{ color: 'hsl(var(--primary))' }}>종가: {YAxisPriceTickFormatter(dataPoint.close)}</p>}
        {typeof dataPoint.volume === 'number' && (
            <p style={{ color: 'hsl(var(--chart-4))' }}>
            거래량: {YAxisVolumeTickFormatter(dataPoint.volume)}
            </p>
        )}
        {dataPoint.event && (
           <p className={`mt-1 font-semibold ${
            dataPoint.event.type === 'buy' ? 'text-green-500' :
            dataPoint.event.type === 'sell' ? 'text-red-500' :
            'text-yellow-500'
           }`}>
            신호: {dataPoint.event.type === 'buy' ? '매수' : dataPoint.event.type === 'sell' ? '매도' : '관망'}
            {dataPoint.event.indicator && ` (${dataPoint.event.indicator})`}
           </p>
        )}
      </div>
    );
  }
  return null;
};

interface StockPriceChartProps {
  chartData: StockDataPoint[];
  signalEvents: SignalEvent[];
}

export function StockPriceChart({ chartData, signalEvents }: StockPriceChartProps) {
  if (!chartData) {
    console.error("StockPriceChart: chartData prop is null or undefined.");
 return <p className="text-destructive">차트 데이터를 표시할 수 없습니다. (데이터 오류)</p>;
  }

  if (!Array.isArray(chartData)) {
 console.error("StockPriceChart: chartData prop is not an array.", { chartData });
 return <p className="text-destructive">차트 데이터를 표시할 수 없습니다. (잘못된 데이터 형식)</p>;
  }

  if (chartData.length === 0) {
    console.log("StockPriceChart: chartData is empty or null.");
    return <p className="text-muted-foreground">차트 데이터를 불러올 수 없습니다. AI 분석 결과에서 chartData가 비어있을 수 있습니다.</p>;
  }

  const firstDataPoint = chartData[0];
  const hasInvalidFirstDataPoint = !firstDataPoint ||
 typeof firstDataPoint.open !== 'number' || !isFinite(firstDataPoint.open) ||
 typeof firstDataPoint.high !== 'number' || !isFinite(firstDataPoint.high) ||
 typeof firstDataPoint.low !== 'number' || !isFinite(firstDataPoint.low) ||
 typeof firstDataPoint.close !== 'number' || !isFinite(firstDataPoint.close) ||
 typeof firstDataPoint.date !== 'string';

  if (hasInvalidFirstDataPoint) {
 console.error("StockPriceChart: First data point has invalid format. Expected finite OHLC numbers and date string.", { firstDataPoint });
    return <p className="text-destructive">차트 데이터를 표시할 수 없습니다. 데이터 형식이 올바르지 않습니다.</p>;
  }
  console.log(`StockPriceChart: Received chartData (length: ${chartData.length}). First 3 items:`, chartData.slice(0,3));
  console.log(`StockPriceChart: Received signalEvents (length: ${signalEvents.length}):`, signalEvents);


  const dataWithSignals = chartData.map(point => {
    const eventOnDate = signalEvents.find(event => event.date === point.date);
    return {
      ...point,
      event: eventOnDate 
    };
  });

 const pricesForDomain = chartData.filter(d =>
 typeof d.open === 'number' && isFinite(d.open) &&
 typeof d.high === 'number' && isFinite(d.high) &&
 typeof d.low === 'number' && isFinite(d.low) &&
 typeof d.close === 'number' && isFinite(d.close)
 ).flatMap(d => [d.open, d.high, d.low, d.close]) as number[];

 if (pricesForDomain.length === 0) {
    console.error("StockPriceChart: No valid price data (finite OHLC values) found after filtering.");
 return <p className="text-destructive">차트 데이터를 표시할 수 없습니다. (유효한 가격 데이터 부족)</p>;
  }

  let yMin = pricesForDomain.length > 0 ? Math.min(...pricesForDomain) : 0;
  let yMax = pricesForDomain.length > 0 ? Math.max(...pricesForDomain) : 1;

  if (!isFinite(yMin) || !isFinite(yMax)) {
    console.warn("StockPriceChart: Non-finite yMin/yMax calculated initially.", { yMin, yMax });
    const validPrice = pricesForDomain.find(p => isFinite(p));
    if (validPrice !== undefined) {
      yMin = validPrice * 0.9; 
      yMax = validPrice * 1.1; 
    } else {
      yMin = 0; yMax = 100; // Absolute default
    }
  }

  if (yMin === yMax) {
    const spread = Math.max(1, Math.abs(yMin * 0.10)); // 10% buffer, min 1 unit
    yMin -= spread;
    yMax += spread;
  } else {
    const range = yMax - yMin;
    const padding = range * 0.10; // 10% padding
    yMin -= padding;
    yMax += padding;
  }
  
  // Ensure yMin is not negative if all prices are positive
  if (pricesForDomain.every(p => p >= 0) && yMin < 0) {
    yMin = 0;
  }


  if (!isFinite(yMin) || !isFinite(yMax) || yMin >= yMax) {
      console.warn("StockPriceChart: Invalid Y-axis domain after adjustments.", {yMin, yMax});
      const typicalPrice = chartData.length > 0 && typeof chartData[0].close === 'number' && isFinite(chartData[0].close) ? chartData[0].close : 100;
      yMin = typicalPrice * 0.5;
      yMax = typicalPrice * 1.5;
      if (yMin >= yMax || !isFinite(yMin) || !isFinite(yMax)) { // Final final fallback
           yMin = 0; yMax = Math.max(1, (typicalPrice || 1) * 2);
      }
  }
  console.log("StockPriceChart: Y-axis Price Domain:", { yMin, yMax });


  const yMinPriceDomain = yMin;
  const yMaxPriceDomain = yMax;

  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null && typeof d.volume === 'number' && isFinite(d.volume)).map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1;

  let xAxisTickInterval: "preserveStartEnd" | number = "preserveStartEnd";
  const numDataPoints = chartData.length;
  if (numDataPoints > 200) { // Approx 1 year daily data (252 trading days)
    xAxisTickInterval = Math.floor(numDataPoints / 12); // Roughly monthly ticks
  } else if (numDataPoints > 60) { // Approx 3 months daily data
    xAxisTickInterval = Math.floor(numDataPoints / 8); 
  } else if (numDataPoints > 20) { // Approx 1 month daily data
    xAxisTickInterval = Math.floor(numDataPoints / 4); 
  }
  
  // If too few points for interval, recharts might show no ticks.
  if (typeof xAxisTickInterval === 'number' && numDataPoints / xAxisTickInterval < 2 && numDataPoints > 1) {
    xAxisTickInterval = 0; // Show all ticks if interval makes too few
  } else if (numDataPoints <=1) {
    xAxisTickInterval = 0; // Show the single tick
  }


  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={dataWithSignals} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}> 
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            height={40}
            interval={xAxisTickInterval}
            padding={{left:10, right:10}} // Add padding for XAxis labels
          />
          <YAxis 
            yAxisId="left"
            domain={[yMinPriceDomain, yMaxPriceDomain]} 
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={60} 
            allowDataOverflow={false} 
            orientation="left"
            scale="linear" 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          
          {/* Bar 대신 Customized 컴포넌트 사용 */}
          <Customized component={Candlestick} />

          {signalEvents.map((event, index) => (
            <ReferenceDot
              key={`event-${index}`}
              yAxisId="left"
              x={event.date}
              y={event.price} 
              r={8} 
              fill={event.type === 'buy' ? 'hsl(var(--chart-2))' : event.type === 'sell' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              isFront={true} 
            >
              <foreignObject x={-7} y={-7} width={14} height={14}>
                {event.type === 'buy' && <ArrowUpCircle size={14} className="text-white" />}
                {event.type === 'sell' && <ArrowDownCircle size={14} className="text-white" />}
                {event.type === 'hold' && <MinusCircle size={14} className="text-white" />}
              </foreignObject>
            </ReferenceDot>
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="30%">
            <ComposedChart data={dataWithSignals} margin={{ top: 10, right: 30, left: 5, bottom: 20 }}> 
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                height={20}
                interval={xAxisTickInterval}
                padding={{left:10, right:10}}
            />
            <YAxis 
                yAxisId="rightVolume"
                orientation="left" 
                domain={[0, yVolumeMax]} 
                tickFormatter={YAxisVolumeTickFormatter}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={60} 
                axisLine={false}
                tickLine={false}
                scale="linear" 
            />
            <Tooltip content={<CustomTooltip />}/>
            <Bar yAxisId="rightVolume" dataKey="volume" name="거래량" fill="hsl(var(--chart-4))" opacity={0.6} />
            </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

