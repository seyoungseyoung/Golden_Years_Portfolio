
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
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] | undefined ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] | undefined ? U : never;


// Custom shape for Candlestick
const Candlestick = (props: any) => {
  const { x, y, width, height, payload, yAxis, index, dataKey } = props; // Added dataKey for context

  // Detailed logging for the first few candles
  if (index < 5) {
    console.log(`Candlestick[${index}] PROPS: x=${x}, y=${y}, width=${width}, height=${height}, dataKey=${dataKey}`);
    console.log(`Candlestick[${index}] PAYLOAD:`, payload);
    if (yAxis && typeof yAxis.scale === 'function' && payload &&
        typeof payload.open === 'number' && typeof payload.close === 'number' &&
        typeof payload.high === 'number' && typeof payload.low === 'number') {
      console.log(`Candlestick[${index}] SCALED: open=${yAxis.scale(payload.open)}, close=${yAxis.scale(payload.close)}, high=${yAxis.scale(payload.high)}, low=${yAxis.scale(payload.low)}`);
    } else {
      console.warn(`Candlestick[${index}]: Invalid payload or yAxis.scale for scaling. yAxis:`, yAxis, `Payload:`, payload);
    }
  }

  if (!yAxis || typeof yAxis.scale !== 'function') {
    if (index < 1) console.warn('Candlestick: yAxis or yAxis.scale is not available.', {yAxis});
    return null; 
  }

  if (!payload || 
      typeof payload.open !== 'number' || 
      typeof payload.close !== 'number' || 
      typeof payload.high !== 'number' || 
      typeof payload.low !== 'number') {
    if (index < 1) console.warn('Candlestick: Invalid OHLC data in payload.', {payload});
    return null; 
  }

  const { open: actualOpen, close: actualClose, high: actualHigh, low: actualLow } = payload;

  if (![actualOpen, actualClose, actualHigh, actualLow].every(val => Number.isFinite(val))) {
    if (index < 1) console.warn('Candlestick: Non-finite OHLC values in payload.', {payload});
    return null;
  }
  
  const yOpen = yAxis.scale(actualOpen);
  const yClose = yAxis.scale(actualClose);
  const yHigh = yAxis.scale(actualHigh);
  const yLow = yAxis.scale(actualLow);

  if (![yOpen, yClose, yHigh, yLow].every(val => Number.isFinite(val))) {
    if (index < 1) console.warn('Candlestick: Non-finite scaled Y values.', { yOpen, yClose, yHigh, yLow, actualOpen, actualClose, actualHigh, actualLow });
    return null;
  }

  // Ensure width and height are positive for drawing
  if (width <= 0 || Math.abs(yOpen - yClose) <= 0 && Math.abs(yHigh - yLow) <=0 ) { // if body and wick have no height
     if (index < 5) console.warn(`Candlestick[${index}]: Zero or negative width/height. width=${width}, yOpen=${yOpen}, yClose=${yClose}`);
    // return null; // Don't return null for zero height body if wick exists
  }


  const isRising = actualClose >= actualOpen;
  const bodyFill = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'; 
  const wickStroke = 'hsl(var(--foreground))'; 

  // Ensure candleWidth is at least 1 to be visible
  const candleWidth = Math.max(1, width * 0.8); // Use 80% of available width, minimum 1px
  const candleX = x + (width - candleWidth) / 2; 

  const wickCenterX = candleX + candleWidth / 2;

  const bodyTopY = Math.min(yOpen, yClose);
  // Ensure bodyHeight is at least 1 if open and close are different, otherwise can be 0 (doji)
  const bodyHeight = Math.max(actualOpen !== actualClose ? 1 : 0, Math.abs(yOpen - yClose));


  return (
    <g>
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
        height={bodyHeight}
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
    const dataPoint = payload[0].payload as StockDataPoint & { event?: SignalEvent };
    
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
  if (!chartData || chartData.length === 0) {
    console.log("StockPriceChart: chartData is empty or null.");
    return <p className="text-muted-foreground">차트 데이터를 불러올 수 없습니다. AI 분석 결과에서 chartData가 비어있을 수 있습니다.</p>;
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
  
  const pricesForDomain = chartData
    .flatMap(d => [d.open, d.high, d.low, d.close])
    .filter(p => typeof p === 'number' && isFinite(p)) as number[];
  
  let yMin = pricesForDomain.length > 0 ? Math.min(...pricesForDomain) : 0;
  let yMax = pricesForDomain.length > 0 ? Math.max(...pricesForDomain) : 1;

  if (!isFinite(yMin) || !isFinite(yMax)) { // Fallback if min/max are not finite
      console.warn("StockPriceChart: Non-finite yMin/yMax calculated initially.", { yMin, yMax });
      yMin = 0; yMax = 1;
      if (pricesForDomain.length > 0) {
          const typicalPrice = pricesForDomain.find(p => isFinite(p)) || 1;
          yMin = typicalPrice * 0.5;
          yMax = typicalPrice * 1.5;
      }
  }
  
  if (yMin === yMax) {
    const spread = Math.max(1, Math.abs(yMin * 0.1)); 
    yMin -= spread;
    yMax += spread;
  } else {
    const range = yMax - yMin;
    // Ensure a minimum visible range, especially for very small ranges
    const minRange = Math.max(1, Math.abs(yMax * 0.02)); // Minimum 2% of max value or 1 unit
    if (range < minRange) {
        const mid = (yMin + yMax) / 2;
        yMin = mid - minRange / 2;
        yMax = mid + minRange / 2;
    } else {
        yMin -= range * 0.05; 
        yMax += range * 0.05; 
    }
  }
 
  // Final check for sanity
  if (!isFinite(yMin) || !isFinite(yMax) || yMin >= yMax) {
      console.warn("StockPriceChart: Invalid Y-axis domain after adjustments.", {yMin, yMax});
      const typicalPrice = pricesForDomain.find(p => isFinite(p)) || 100; // Default typical price
      yMin = typicalPrice * 0.8;
      yMax = typicalPrice * 1.2;
      if (yMin >= yMax || !isFinite(yMin) || !isFinite(yMax)) { // Final final fallback
           yMin = 0; yMax = (typicalPrice || 1) * 2;
      }
  }
  console.log("StockPriceChart: Y-axis Price Domain:", { yMin, yMax });


  const yMinPriceDomain = yMin;
  const yMaxPriceDomain = yMax;

  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null && typeof d.volume === 'number' && isFinite(d.volume)).map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1;

  let xAxisTickInterval: "preserveStartEnd" | number = "preserveStartEnd";
  const numDataPoints = chartData.length;
  if (numDataPoints > 200) { // Approx 1 year daily data
    xAxisTickInterval = Math.floor(numDataPoints / 12); // Roughly monthly ticks
  } else if (numDataPoints > 60) { // Approx 3 months daily data
    xAxisTickInterval = Math.floor(numDataPoints / 8); // Roughly bi-weekly/tri-weekly
  } else if (numDataPoints > 20) { // Approx 1 month daily data
    xAxisTickInterval = Math.floor(numDataPoints / 4); // Roughly weekly
  }
  // For very few data points, preserveStartEnd is better.


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
          />
          <YAxis 
            yAxisId="left"
            domain={[yMinPriceDomain, yMaxPriceDomain]} 
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={60} 
            allowDataOverflow={false} 
            orientation="left"
            scale="linear" // Explicitly set scale
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          
          {/* Using dataKey="close" but shape will use full payload. Name is for Legend */}
          <Bar yAxisId="left" dataKey="close" name="주가" shape={<Candlestick />} />

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
                scale="linear" // Explicitly set scale
            />
            <Tooltip content={<CustomTooltip />}/>
            <Bar yAxisId="rightVolume" dataKey="volume" name="거래량" fill="hsl(var(--chart-4))" opacity={0.6} />
            </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

